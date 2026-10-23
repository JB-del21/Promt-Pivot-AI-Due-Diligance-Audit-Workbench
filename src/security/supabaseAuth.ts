/**
 * Verifies Supabase Auth access JWTs using the project's asymmetric JWKS.
 * Never accept a tenant supplied via headers, user_metadata or request body.
 */
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export type IdentityResult =
  | { ok: true; principal: { userId: string; tenantId: string } }
  | { ok: false; status: 401 | 503; error: string };

const jwksCache = new Map<string, JWTVerifyGetKey>();

export function extractTenantPrincipal(claims: Record<string, unknown>): { userId: string; tenantId: string } | null {
  const metadata = claims.app_metadata;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const tenantId = (metadata as Record<string, unknown>).tenant_id;
  if (claims.role !== 'authenticated' || claims.is_anonymous === true ||
      typeof claims.sub !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(claims.sub) ||
      typeof tenantId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(tenantId)) return null;
  return { userId: claims.sub, tenantId };
}

export async function verifySupabaseBearer(
  authorization: string | undefined,
  supabaseUrl: string | undefined,
  customKeySet?: JWTVerifyGetKey
): Promise<IdentityResult> {
  if (!supabaseUrl) return { ok: false, status: 503, error: 'Supabase Auth not configured' };
  if (!authorization || !/^Bearer [A-Za-z0-9_.-]{40,8400}$/.test(authorization)) {
    return { ok: false, status: 401, error: 'Missing or malformed bearer token' };
  }
  try {
    const parsed = new URL(supabaseUrl);
    if (parsed.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(parsed.hostname) ||
        parsed.pathname !== '/' || parsed.search || parsed.hash) throw new Error('Unsupported issuer');
    const issuer = parsed.origin + '/auth/v1';
    let keySet = customKeySet ?? jwksCache.get(issuer);
    if (!keySet) {
      keySet = createRemoteJWKSet(new URL(issuer + '/.well-known/jwks.json'), {
        timeoutDuration: 5000, cooldownDuration: 30000, cacheMaxAge: 300000,
      });
      jwksCache.set(issuer, keySet);
    }
    const { payload } = await jwtVerify(authorization.slice(7), keySet, {
      issuer, audience: 'authenticated', algorithms: ['ES256', 'RS256'],
      requiredClaims: ['sub', 'exp', 'iat', 'iss', 'aud'],
      maxTokenAge: '1h', clockTolerance: 5,
    });
    const principal = extractTenantPrincipal(payload as Record<string, unknown>);
    if (!principal) return { ok: false, status: 403 as 401, error: 'Account has no authorized tenant membership' };
    return { ok: true, principal };
  } catch {
    return { ok: false, status: 401, error: 'Invalid or expired Supabase access token' };
  }
}
