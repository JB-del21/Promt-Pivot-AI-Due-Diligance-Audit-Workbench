# Gate 4 — Supabase Auth + Vercel Preview (pilot)

**Status:** Integration code implemented in PR #1; real provider and Preview validation still require operator configuration. Do not merge to main until the checklist is proven.

## 1. Supabase Auth setup (manual operator actions)

1. Reuse a controlled Supabase project or create one. In Authentication → Providers enable **Email / Magic Link**. Configure an approved email sender and rate limiting for production.
2. In Authentication → URL Configuration, allow the intended Preview URL(s) and the production URL as redirect URLs. Avoid wildcard origins on a production domain. If Preview URLs change, use a branch-stable preview alias scoped to the project.
3. In Auth → JWT Signing Keys, use **asymmetric RSA/ECC** JWT signing. Do not use the legacy HS256 JWT secret for this integration. The backend verifies the published JWKS at `https://<project>.supabase.co/auth/v1/.well-known/jwks.json`. It accepts only `RS256` or `ES256`, with `iss=https://<project>.supabase.co/auth/v1`, `aud=authenticated`.
4. Tenant membership is supplied by **issuer-managed** `app_metadata.tenant_id`. Assign it only through the Supabase operator/admin interface or trusted server, **not** `user_metadata` or frontend forms. Refresh the user's session after changes. Pick a pilot tenant ID of letters, numbers, underscores or dashes, max 64 chars. Existing records under `default-tenant` are **not** automatically accessible.
5. The first release uses one organization per user. Tenant changes take effect on JWT refresh or new login (token TTL). Immediate revocation requires further work with an online membership check and session revocation controls before high-stakes deployment.

No service role key is needed in the application. Never paste secrets in issues, chat, frontend variables, or client bundles.

## 2. Configure Vercel Environment Variables

Add the following to the **Preview environment** in each relevant Vercel project (and later to Production only after approval):

| Name | Exposure | Value |
| --- | --- | --- |
| `AUTH_PROVIDER` | Server only | `supabase` |
| `SUPABASE_URL` | Server only | `https://<project>.supabase.co` |
| `VITE_SUPABASE_URL` | Public browser | Same project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public browser | Supabase publishable key (`sb_publishable_...`), not secret/service-role key |
| `DATABASE_URL` | Server only | Tenant-restricted PostgreSQL connection string, TLS certificate checked |
| `GEMINI_API_KEY` | Server only, optional | Omit during initial smoke tests to prevent paid AI calls |

The frontend build uses `VITE_` only for the **public Supabase URL and public publishable key**. Never use `VITE_`, `NEXT_PUBLIC_` or `PUBLIC_` for private secrets.

If `AUTH_PROVIDER=supabase` is absent, the previous issuer-configured RSA verifier remains available on the draft branch. It also fails closed when its trusted issuer/public key settings are absent.

## 3. Required Preview smoke test

1. A new Preview deployment has finished building successfully **and** is accessible on the expected branch URL. A green GitHub Vite build alone is insufficient.
2. `GET /api/health` responds HTTP 200 with `{ "status": "ok" }` and no secret/tenant information.
3. In an unauthenticated browser, `GET /api/session` is HTTP 401. The app renders the public synthetic practice content. `/api/reports`, `/api/cohort/metrics`, and `/api/benchmark/run` reject unsigned requests.
4. Submit approved email in the browser, follow the magic link from the allowed Preview origin, verify `GET /api/session` is 200 and returns exactly the expected tenant. A user without `app_metadata.tenant_id` must be denied.
5. Finish a synthetic audit. Inspect the Network tab: `POST /api/reports` must include a short-lived access token, return HTTP 201, `persistedToDb: true` and `reportId`. If DB is absent/broken, UI must show failure instead of “verified”.
6. Call `/api/reports/verify` with a report hash while authenticated as tenant A, then test with a tenant B identity. Tenant B must not see tenant A's report.
7. Benchmark with missing `GEMINI_API_KEY` returns `FAILED`; never silently claim LIVE AI. Only after cost cap verification allow a controlled paid call.
8. Logout; protected routes return 401 again. Check redirect allowlist, CORS behavior, cache headers and absence of secrets in browser bundle.

**Current blocker (observed in PR comments):** One Vercel project returned `api-deployments-free-per-day` (over 100 deployments). Do not circumvent this by altering the production branch. Pause deployment attempts until allowance resets or the account owner changes the Vercel plan. Prefer one squashed/aggregated PR update over a commit per file.

## 4. Evidence bar

- Unit tests and ephemeral PostgreSQL integration tests prove only the local and CI contracts.
- A real signed token issued by the configured Supabase project and a reachable Vercel Preview must be observed separately.
- Until all eight Preview cases are evidenced, this is **integration-ready, NOT production approved**.
