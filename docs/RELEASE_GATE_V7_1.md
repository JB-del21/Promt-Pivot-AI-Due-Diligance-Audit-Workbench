# v7.1 Security & Evidence Closure (draft release gate)

## Status: NOT PRODUCTION APPROVED
This branch deliberately closes privileged API routes until a trusted identity provider is configured. Public synthetic practice screens remain available, but server persistence, cohort analytics, and live AI benchmark require a verified signed JWT.

### Required server configuration
- `AUTH_JWT_PUBLIC_KEY`: server-only PEM RS256 public key issued by your identity provider. RSA modulus >= 2048 bits. Never use a browser/client public env prefix.
- `AUTH_JWT_ISSUER`: exact JWT `iss` claim of the issuer.
- `AUTH_JWT_AUDIENCE`: exact audience intended for this API.
- `DATABASE_URL`: server-only Postgres connection string with certificate verification enabled.
- `GEMINI_API_KEY`: optional server-only key; paid calls disabled when absent.

The identity provider must issue short-lived RS256 access tokens with signed `sub`, `tenant_id`, `iss`, `aud`, `iat`, and `exp` claims. Tenant membership MUST be verified by that trusted issuer, not supplied through `x-tenant-id`. This patch does not implement a user-login UI or provision an identity provider. No real keys were added.

### Migration required before enabling the protected endpoints
Apply the `benchmark_rate_limits` table addition in `schema.sql` using a migration path appropriate to your database. Existing report tables are not automatically migrated by a Vercel deployment. In a shared DB role model, keep the API role server-only and apply explicit tenant filters to every user-visible query. Review existing tenants and legacy default-tenant records before enabling data access.

### Implemented controls
1. Protected APIs require server-side cryptographic RSA signature, issuer, audience, expiration, subject and signed tenant claim verification; missing configuration fails closed.
2. Report verification matches both the supplied digest and tenant, recomputes digest over stored canonical report payload, and compares duplicated DB fields.
3. No `ON CONFLICT DO UPDATE` for immutable report evidence; writes are transaction-scoped, failed persistence returns unsuccessful HTTP response.
4. Tenant scoped cohort read excludes legacy `default-tenant` crossover; missing DB connection fails closed.
5. Paid LLM calls use database-backed 10/min/tenant budget and SDK-owned 10 second request timeout; no key/failed provider yields FAILED rather than fabricated benchmark.
6. Browser practice submissions remain local only until an authenticated sign-in flow is connected. Local hashes are not audit certificates.

### Validation evidence and open gates
- 6 new isolated pure security tests passed locally under Node.js 22 with temporary import-path adaptation. These are **not** equivalent to a complete repository CI PASS.
- Full `npm install`, `npm run lint`, `npm test`, `npm run build` and Vercel Preview integration have **not** been independently verified for this branch.
- HTTP integration tests against a disposable Postgres database, tenant A/B JWTs, simulated DB rollback, and DB certificate trust are still required.
- Real identity provider setup, signed-in frontend, migration review, benchmark model validation and external report attestation remain open.
- The `/api/benchmark/presets` response is illustrative synthetic data and not a model performance measurement.

**Do not merge to production** until the remaining tests and identity/database setup are verified. Existing frontend API widgets will show authorization errors until sign-in exists.
