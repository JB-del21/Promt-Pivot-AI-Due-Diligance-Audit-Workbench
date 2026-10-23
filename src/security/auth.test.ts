import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import test from 'node:test';
import { verifyAccessToken } from './auth';

const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const config = { publicKey: keys.publicKey.export({ type: 'spki', format: 'pem' }).toString(), issuer: 'https://identity.example.test', audience: 'prompt-pivot-api' };
const now = 1780000000;
const payload = { iss: config.issuer, aud: config.audience, iat: now - 10, exp: now + 300, sub: 'user-123', tenant_id: 'tenant-01' };
function token(claims: Record<string, unknown> = payload, alg = 'RS256') {
  const part = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const unsigned = `${part({ alg, typ: 'JWT' })}.${part(claims)}`;
  return `Bearer ${unsigned}.${sign('RSA-SHA256', Buffer.from(unsigned), keys.privateKey).toString('base64url')}`;
}

test('accepts verified signed subject and tenant membership only', () => {
  assert.deepEqual(verifyAccessToken(token(), config, now), { ok: true, principal: { userId: 'user-123', tenantId: 'tenant-01' } });
});
test('rejects missing or disabled authentication configuration', () => {
  assert.equal(verifyAccessToken(undefined, config, now).ok, false);
  assert.deepEqual(verifyAccessToken(token(), {}, now), { ok: false, status: 503, error: 'Authentication provider not configured' });
});
test('rejects unsigned/incorrect algorithm, tampered and expired tokens', () => {
  assert.equal(verifyAccessToken(token(payload, 'none'), config, now).ok, false);
  assert.equal(verifyAccessToken(token({ ...payload, exp: now - 10 }), config, now).ok, false);
  assert.equal(verifyAccessToken(token({ ...payload, aud: 'other' }), config, now).ok, false);
  assert.equal(verifyAccessToken(token({ ...payload, tenant_id: '' }), config, now).ok, false);
  const parts = token().split('.');
  const corrupted = `${parts[0]}.${Buffer.from(JSON.stringify({ ...payload, tenant_id: 'tenant-02' })).toString('base64url')}.${parts[2]}`;
  assert.equal(verifyAccessToken(corrupted, config, now).ok, false);
});
