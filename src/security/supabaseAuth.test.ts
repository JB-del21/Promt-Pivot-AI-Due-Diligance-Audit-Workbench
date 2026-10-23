import assert from 'node:assert/strict';
import test from 'node:test';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { extractTenantPrincipal, verifySupabaseBearer } from './supabaseAuth';

const issuer = 'https://project-test.supabase.co/auth/v1';
const url = 'https://project-test.supabase.co/';
const subject = '77777777-7777-4777-8777-777777777777';

async function signer() {
  const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true });
  const jwk = await exportJWK(publicKey);
  const keys = createLocalJWKSet({ keys: [{ ...jwk, alg: 'RS256', kid: 'test-key', use: 'sig' }] });
  const signToken = async (extra: Record<string, unknown> = {}) => (
    await new SignJWT({ role: 'authenticated', app_metadata: { tenant_id: 'tenant-A' }, ...extra })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setSubject(subject).setIssuer(issuer).setAudience('authenticated')
      .setIssuedAt().setExpirationTime('5m').sign(privateKey)
  );
  return { keys, signToken };
}

test('Supabase JWT signature, issuer, audience and signed app_metadata tenant all required', async () => {
  const { keys, signToken } = await signer();
  const token = await signToken();
  assert.deepEqual(await verifySupabaseBearer('Bearer ' + token, url, keys), {
    ok: true, principal: { userId: subject, tenantId: 'tenant-A' },
  });
  const wrongTenant = await signToken({ app_metadata: {}, user_metadata: { tenant_id: 'tenant-B' } });
  assert.equal((await verifySupabaseBearer('Bearer ' + wrongTenant, url, keys)).ok, false);
  assert.equal((await verifySupabaseBearer('Bearer ' + token.slice(0, -2) + 'xx', url, keys)).ok, false);
  assert.equal((await verifySupabaseBearer('Bearer ' + token, 'https://evil.invalid', keys)).ok, false);
  assert.equal((await verifySupabaseBearer('', url, keys)).ok, false);
});

test('tenant may never be supplied in user_metadata or as anonymous identity', () => {
  assert.equal(extractTenantPrincipal({ role: 'authenticated', sub: subject, user_metadata: { tenant_id: 'team' } }), null);
  assert.equal(extractTenantPrincipal({ role: 'authenticated', sub: subject, app_metadata: { tenant_id: 'team' }, is_anonymous: true }), null);
  assert.deepEqual(extractTenantPrincipal({ role: 'authenticated', sub: subject, app_metadata: { tenant_id: 'team' } }), {
    userId: subject, tenantId: 'team',
  });
});
