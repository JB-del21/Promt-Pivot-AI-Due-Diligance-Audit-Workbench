/** Fail-closed RS256 JWT verifier. The issuer (not this app) provisions tokens. */
import { createPublicKey, verify } from 'node:crypto';

export interface VerifiedPrincipal { userId: string; tenantId: string }
export type AuthResult = { ok: true; principal: VerifiedPrincipal } | { ok: false; status: 401 | 503; error: string };
export interface AuthConfig { publicKey?: string; issuer?: string; audience?: string }

function decodeObject(encoded: string): Record<string, unknown> {
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error('Malformed JWT');
  const parsed: unknown = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('Malformed JWT');
  return parsed as Record<string, unknown>;
}

export function verifyAccessToken(header: string | undefined, config: AuthConfig, now = Math.floor(Date.now() / 1000)): AuthResult {
  if (!config.publicKey || !config.issuer || !config.audience) {
    return { ok: false, status: 503, error: 'Authentication provider not configured' };
  }
  if (!header || !/^Bearer [A-Za-z0-9_.-]+$/.test(header) || header.length > 8500) {
    return { ok: false, status: 401, error: 'Missing or malformed bearer token' };
  }
  try {
    const token = header.slice(7);
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[2] || !/^[A-Za-z0-9_-]+$/.test(parts[2])) throw new Error('Invalid JWT format');
    const jwtHeader = decodeObject(parts[0]);
    const claims = decodeObject(parts[1]);
    if (jwtHeader.alg !== 'RS256') throw new Error('Unexpected signing algorithm');
    const key = createPublicKey(config.publicKey.replace(/\\n/g, '\n'));
    if (key.asymmetricKeyType !== 'rsa' || (key.asymmetricKeyDetails?.modulusLength || 0) < 2048) throw new Error('Invalid public key');
    const valid = verify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), key, Buffer.from(parts[2], 'base64url'));
    if (!valid) throw new Error('JWT signature mismatch');
    const aud = claims.aud;
    if (claims.iss !== config.issuer || !(aud === config.audience || (Array.isArray(aud) && aud.includes(config.audience)))) throw new Error('Issuer/audience mismatch');
    if (!Number.isSafeInteger(claims.exp) || Number(claims.exp) <= now || !Number.isSafeInteger(claims.iat) || Number(claims.iat) > now + 30 || Number(claims.exp) - Number(claims.iat) > 3600) throw new Error('Expired or excessive token lifetime');
    if (claims.nbf !== undefined && (!Number.isSafeInteger(claims.nbf) || Number(claims.nbf) > now + 30)) throw new Error('Token not yet valid');
    if (typeof claims.sub !== 'string' || !/^[a-zA-Z0-9_:@.\-]{1,128}$/.test(claims.sub)) throw new Error('Invalid subject');
    if (typeof claims.tenant_id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(claims.tenant_id)) throw new Error('Missing signed tenant membership');
    return { ok: true, principal: { userId: claims.sub, tenantId: claims.tenant_id } };
  } catch {
    return { ok: false, status: 401, error: 'Invalid or expired bearer token' };
  }
}
