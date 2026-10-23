import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generateKeyPairSync, sign } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import pg from 'pg';
import { after, before, test } from 'node:test';
import { canonicalizeJson, sha256 } from '../utils/auditScoring';

const connection = process.env.DATABASE_URL;
if (!connection || !connection.includes('/prompt_pivot_test')) throw new Error('DB integration suite requires an isolated prompt_pivot_test database');
const admin = new pg.Pool({ connectionString: connection, max: 2 });
const prefix = 'integration-' + process.pid;
const scenarioId = 'mna-saas-cloudpulse-2026';
const keypair = generateKeyPairSync('rsa', { modulusLength: 2048 });
process.env.VERCEL = '1';
process.env.AUTH_JWT_PUBLIC_KEY = keypair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
process.env.AUTH_JWT_ISSUER = 'https://integration.test';
process.env.AUTH_JWT_AUDIENCE = 'prompt-pivot-api';

let db: typeof import('../db/client');
let base = '';
let server: import('node:http').Server;

function jwt(tenantId: string) {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = encode({alg:'RS256'}) + '.' + encode({sub:'auditor',tenant_id:tenantId,iss:process.env.AUTH_JWT_ISSUER,aud:process.env.AUTH_JWT_AUDIENCE,iat:now,exp:now+300});
  return unsigned + '.' + sign('RSA-SHA256', Buffer.from(unsigned), keypair.privateKey).toString('base64url');
}

async function fixture(tenantId: string, suffix: string, faultId = 'fault-01') {
  const rawAuditJson = {
    scenarioId, tenantId, userName: 'Auditor',
    userRole: 'Analyst', deviceType: 'web', totalScore: 66,
    auditStatus: 'ASSOCIATE', isStrictMode: true,
    faultResults: [{ faultId, status: 'TRUE_POSITIVE' }],
    timestamp: '2026-10-23T00:00:00.000Z', suffix
  };
  const sha256Hash = 'SHA256:' + await sha256(canonicalizeJson(rawAuditJson));
  return {
    scenarioId, tenantId, userName: 'Auditor', userRole: 'Analyst', deviceType: 'web',
    totalScore: 66, auditStatus: 'ASSOCIATE', auditMode: 'strict',
    rawAuditJson, sha256Hash, faultResults: [{ faultId, status: 'TRUE_POSITIVE', comment: 'Test' }]
  };
}

before(async () => {
  const [{current_database: name}] = (await admin.query('SELECT current_database()')).rows;
  assert.equal(name, 'prompt_pivot_test');
  await admin.query(await readFile('schema.sql', 'utf8'));
  db = await import('../db/client');
  const { default: app } = await import('../../server');
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
});
after(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  await admin.end();
});

test('tenant A/B isolated SQL reads and verified HTTP report lookup', async () => {
  const a = await fixture(prefix + '-A','a');
  const b = await fixture(prefix + '-B','b');
  assert.equal((await db.saveAuditReportToDb(a)).success, true);
  assert.equal((await db.saveAuditReportToDb(b)).success, true);

  const aRows = await db.fetchAuditReportsFromDb(scenarioId, a.tenantId);
  const bRows = await db.fetchAuditReportsFromDb(scenarioId, b.tenantId);
  assert.ok(aRows.some((r) => r.sha256Hash === a.sha256Hash));
  assert.ok(!aRows.some((r) => r.sha256Hash === b.sha256Hash));
  assert.ok(bRows.some((r) => r.sha256Hash === b.sha256Hash));
  assert.ok(!bRows.some((r) => r.sha256Hash === a.sha256Hash));

  const call = async (token: string, hash: string, extra: Record<string,string> = {}) => {
    const response = await fetch(base + '/api/reports/verify', {
      method: 'POST',
      headers: {'content-type':'application/json',authorization:'Bearer '+token,...extra},
      body: JSON.stringify({sha256Hash: hash}), signal: AbortSignal.timeout(4000)
    });
    return { status: response.status, body: await response.json() as Record<string, unknown> };
  };
  const allowed = await call(jwt(a.tenantId), a.sha256Hash);
  assert.equal(allowed.status, 200);
  assert.equal(allowed.body.verified, true);

  const denied = await call(jwt(b.tenantId), a.sha256Hash, {'x-tenant-id':a.tenantId});
  assert.equal(denied.status, 404);
  assert.equal(denied.body.verified, false);
});

test('existing evidence cannot be overwritten even if attacker knows its hash', async () => {
  const a = await fixture(prefix + '-immutable', 'original');
  assert.equal((await db.saveAuditReportToDb(a)).success, true);
  const malicious = { ...a, totalScore: 10000, auditStatus: 'SENIOR' };
  assert.equal((await db.saveAuditReportToDb(malicious)).success, false);
  const rows = await db.executeQuery<{ total_score: number; audit_status: string }>(
    'SELECT total_score, audit_status FROM audit_reports WHERE sha256_hash = $1', [a.sha256Hash]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].total_score, 66);
  assert.equal(rows[0].audit_status, 'ASSOCIATE');
});

test('failed fault insert rolls back the whole report transaction', async () => {
  const a = await fixture(prefix + '-rollback', 'rollback', 'x'.repeat(80));
  const result = await db.saveAuditReportToDb(a);
  assert.equal(result.success, false);
  const rows = await db.executeQuery('SELECT id FROM audit_reports WHERE sha256_hash = $1', [a.sha256Hash]);
  assert.equal(rows.length, 0);
});

test('tampering with persisted metadata invalidates the report', async () => {
  const a = await fixture(prefix + '-tamper', 'tamper');
  assert.equal((await db.saveAuditReportToDb(a)).success, true);
  await admin.query('UPDATE audit_reports SET total_score = 97 WHERE sha256_hash = $1',[a.sha256Hash]);
  const response = await fetch(base + '/api/reports/verify',{
    method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+jwt(a.tenantId)},
    body:JSON.stringify({sha256Hash:a.sha256Hash}),signal:AbortSignal.timeout(4000)
  });
  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.verified, false);
});

test('database-based quota is shared and rejects the eleventh request per minute', async () => {
  const tenantId = prefix + '-quota';
  for (let i=0;i<10;i++) assert.equal(await db.consumeBenchmarkQuota(tenantId), true);
  assert.equal(await db.consumeBenchmarkQuota(tenantId), false);
  assert.equal(await db.consumeBenchmarkQuota(prefix + '-other'), true);
});
