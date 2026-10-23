import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';

const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
process.env.VERCEL = '1'; // Prevent dev Vite listener during isolated API tests.
process.env.AUTH_JWT_PUBLIC_KEY = pair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
process.env.AUTH_JWT_ISSUER = 'https://identity.example.test';
process.env.AUTH_JWT_AUDIENCE = 'prompt-pivot-api';
delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;
delete process.env.SUPABASE_DB_URL;
delete process.env.POSTGRES_URL_NON_POOLING;
delete process.env.GEMINI_API_KEY;

let base = '';
let server: import('node:http').Server;

function jwt(tenantId = 'tenant-A') {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const header = encode({ alg: 'RS256', typ: 'JWT' });
  const payload = encode({
    sub: 'auditor-1', tenant_id: tenantId,
    iss: process.env.AUTH_JWT_ISSUER, aud: process.env.AUTH_JWT_AUDIENCE,
    iat: now, exp: now + 300,
  });
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${sign('RSA-SHA256', Buffer.from(unsigned), pair.privateKey).toString('base64url')}`;
}

async function post(path: string, body: unknown, token?: string, extraHeaders: Record<string, string> = {}) {
  const response = await fetch(base + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}), ...extraHeaders },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(4000),
  });
  return { status: response.status, body: await response.json() as Record<string, unknown> };
}

before(async () => {
  const { default: app } = await import('../../server');
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
});
after(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('public health does not disclose API secrets or tenant metadata', async () => {
  const response = await fetch(base + '/api/health', { signal: AbortSignal.timeout(4000) });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});
test('protected API rejects anonymous and fabricated tenant headers', async () => {
  const anonymous = await post('/api/reports', { scenarioId: 'irrelevant' }, undefined, { 'x-tenant-id': 'tenant-B' });
  assert.equal(anonymous.status, 401);
  const fake = await post('/api/reports/verify', { sha256Hash: 'SHA256:' + 'a'.repeat(64) }, 'not-a-jwt');
  assert.equal(fake.status, 401);
});
test('signed requests are validated before persistence and reject unknown scenarios', async () => {
  const result = await post('/api/reports', { scenarioId: 'does-not-exist', annotations: [] }, jwt(), { 'x-tenant-id': 'tenant-B' });
  assert.equal(result.status, 400);
  assert.equal(result.body.success, undefined);
});
test('validation denies malformed hash independently of database availability', async () => {
  const result = await post('/api/reports/verify', { sha256Hash: 'garbage' }, jwt());
  assert.equal(result.status, 400);
  assert.equal(result.body.verified, false);
});
test('missing quota database denies paid LLM even with valid signed token', async () => {
  const result = await post('/api/benchmark/run', {
    scenarioId: 'mna-saas-cloudpulse-2026',
    documentText: 'Synthetic test document',
  }, jwt());
  assert.equal(result.status, 503);
  assert.equal(result.body.executionState, 'FAILED');
});
