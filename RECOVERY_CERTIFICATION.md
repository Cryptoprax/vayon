# Recovery certification

Status: Blocked

| Recovery case | Existing path | Failure/recovery evidence | Status |
| --- | --- | --- | --- |
| Password reset | Forgot password -> email -> reset password -> login | sendReset result is ignored before sent-message redirect; delivery/session/password change unverified | Blocked |
| Expired invitation | Acceptance error -> request resend | Page gives bounded guidance; SQL rejects expired pending invitation | Needs Verification |
| Invalid invitation | Acceptance error -> correct account/request invite | SQL requires authenticated matching email and valid pending invitation; no live wrong-account case observed | Needs Verification |
| Duplicate invitation | Existing invite RPC replaces pending invite; rejects existing organization member | Real delivery retry and duplicate acceptance behavior unverified | Needs Verification |
| Removed member | Login/selected workspace -> membership gates | Resolver returns selected context before explicit active-membership recheck; live RLS/session revocation unverified | Blocked |
| Workspace switching | Header workspace menu | Current workspace only, no selectable alternatives; create button disabled | Blocked |
| Session recovery | Existing Supabase cookie refresh and login | Public protected acceptance redirect observed locally; real refreshed session unverified | Needs Verification |
| Expired session | Proxy -> login -> safe next | Local no-session path and mocked return URL tests only; expiry during save unverified | Needs Verification |
| Multiple workspace invitations | Accept newest pending for email | Wrong-target prevention and exact selected-workspace recovery not established | Blocked |

Customer recovery must preserve intent, explain the next step, and end at an authorized usable destination. Error text alone does not certify successful recovery. Workspace errors must never cause creation of a duplicate organization to recover an existing membership.

Sources: features/authentication/actions/auth.actions.ts; features/authentication/services/authentication.service.ts; lib/supabase/proxy.ts; features/onboarding/services/workspace.service.ts; features/onboarding/services/organization.service.ts; features/vayon/product-shell/WorkspaceSwitcher.tsx; app/accept-invitation/page.tsx; supabase/migrations/20260820000000_sprint51_enterprise_organization.sql.

No reset email, account removal, session revocation or workspace mutation was executed. Exit evidence requires production-like authentication, queue/provider verification, explicit active membership checks, and first-time-customer recovery observation.
