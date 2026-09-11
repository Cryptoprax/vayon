# Wave 1 Session and recovery certification

Status: Blocked

| Case | Existing path and evidence | Status |
| --- | --- | --- |
| Login | Password service, rate limits, cookies and safe return tests | Needs Verification |
| Logout | signOut then login redirect; real cookies/token rejection not observed | Needs Verification |
| Session expiry | Proxy getUser check; actual expiry during navigation/save not exercised | Needs Verification |
| Session recovery | Existing Supabase cookie refresh hooks and login next path | Needs Verification |
| Remembered login | Persistence across browser restart and refresh-token rotation untested; no explicit remember control found in auth flow | Needs Verification |
| Password reset | Forgot-password ignores sendReset provider error before sent-link message | Blocked |
| Invalid token | Local missing-code/provider-error redirects; real invalid/expired token exchange untested | Needs Verification |
| Expired invitation | SQL expiry gate and resend guidance; live resend/acceptance untested | Needs Verification |
| Workspace recovery | No working switch action; stale selected-context and active membership checks need reconciliation | Blocked |

Browser checks use a fresh unauthenticated local production build. Missing session is not an expired authenticated session. An error redirect is not evidence that a real user can recover. Provider delivery, successful password replacement, rejection of old credentials, logged-out-session invalidation and remembered login need controlled accounts.

The proxy returns newly created redirect responses in some branches after refreshing cookies on its normal response. Cookie propagation on those redirect branches needs live verification; no production session failure is asserted without that evidence. Authentication error and optional audit calls also require provider-failure testing.

Sources: features/authentication/services/authentication.service.ts; features/authentication/actions/auth.actions.ts; app/auth/callback/route.ts; lib/supabase/proxy.ts; lib/supabase/server.ts; app/accept-invitation/page.tsx. Focused authentication/identity regression run: 43 tests, zero failures; tests are not production session certification.
