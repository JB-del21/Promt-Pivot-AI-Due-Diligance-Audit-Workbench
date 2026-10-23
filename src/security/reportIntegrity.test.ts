import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyStoredReport, type StoredReport } from './reportIntegrity';
import { canonicalizeJson, sha256 } from '../utils/auditScoring';

async function fixture(): Promise<StoredReport> {
  const payload = { scenarioId: 'case-1', tenantId: 'tenant-A', totalScore: 71, auditStatus: 'ASSOCIATE', userName: 'A', userRole: 'Analyst', deviceType: 'web', isStrictMode: true, timestamp: '2026-10-23T12:00:00.000Z', faultResults: [{ faultId: 'e-1', status: 'TRUE_POSITIVE' }] };
  return { scenarioId: payload.scenarioId, tenantId: payload.tenantId, totalScore: payload.totalScore, status: payload.auditStatus, name: payload.userName, role: payload.userRole, deviceType: payload.deviceType, auditMode: 'strict', sha256Hash: 'SHA256:' + await sha256(canonicalizeJson(payload)), rawAuditJson: payload };
}
test('accepts unmodified persisted canonical report', async () => {
  assert.equal(await verifyStoredReport(await fixture()), true);
});
test('fails closed for DB score/status/tenant modifications', async () => {
  const r = await fixture();
  assert.equal(await verifyStoredReport({ ...r, totalScore: 100000 }), false);
  assert.equal(await verifyStoredReport({ ...r, status: 'SENIOR' }), false);
  assert.equal(await verifyStoredReport({ ...r, tenantId: 'tenant-B' }), false);
});
test('fails closed for changed JSON payload and unknown digest', async () => {
  const r = await fixture();
  assert.equal(await verifyStoredReport({ ...r, rawAuditJson: { ...(r.rawAuditJson as object), totalScore: 100000 } }), false);
  assert.equal(await verifyStoredReport({ ...r, sha256Hash: 'SHA256:' + '0'.repeat(64) }), false);
  assert.equal(await verifyStoredReport({ ...r, sha256Hash: 'garbage' }), false);
});
