# Operation Launch - Final Wave 1 certification

Status: Blocked

Wave 1 is NOT complete. Of 24 lifecycle and certification checks, 0 are Certified, 9 are Blocked and 15 are Needs Verification. Passing local checks is not evidence that a customer completed the Identity and Workspace lifecycle.

## Scope

Only Authentication, Workspace, Team, RBAC and Recovery were audited. Landing and Dashboard were checked solely as identity entry/boundary points. Analytics, AI and approvals were examined only as permission gates, as requested. No product feature, page, navigation, service, repository, schema, API or application code was changed. There was no UX improvement or optimization.

## Workflow classifications

| Workflow | Status | Evidence or missing step |
| --- | --- | --- |
| Landing Page | Needs Verification | Local public entry can render; no production first-user journey observed. |
| Sign Up | Needs Verification | Existing signup/provider call and profile trigger inspected; no fresh identity created. |
| Google OAuth | Needs Verification | Code exchange and safe return logic exist; no real Google round-trip. |
| Email Signup | Needs Verification | Existing email verification path; delivery and confirmation unverified. |
| Workspace Creation | Needs Verification | Existing RPC inserts organization/workspace and owner memberships atomically; no live transaction observed. |
| Automatic Owner Assignment | Needs Verification | organization_owner is inserted in both memberships during creation; live role and immediate invite access unverified. |
| Workspace Selected | Blocked | Creation/acceptance does not establish explicit selected context; acceptance ignores returned workspace ID. |
| Dashboard Identity Entry | Needs Verification | Unauthenticated boundary checked; no first authenticated dashboard with Owner permissions observed. |
| Invite Team | Blocked | Owner/Admin allowed in source, Manager denied; HR-manager runtime/SQL disagreement. |
| Invitation Email | Needs Verification | Existing queue/provider path inspected; no production delivery or controlled inbox receipt. |
| Invitation Acceptance | Blocked | SQL chooses newest pending invite by email without exact invitation identity; real link/session unverified. |
| Workspace Join | Blocked | Membership writes exist but joined-workspace selection is not completed. |
| Correct Role Assignment | Blocked | Stored role assignment exists; legacy agent/runtime and Manager/HR permission inconsistencies remain. |
| Login | Needs Verification | Existing password service and mocked safe return tests; real session not established. |
| Logout | Needs Verification | Existing signOut/redirect inspected; no authenticated logout or old-session rejection observed. |
| Login Again | Needs Verification | No real logout/login cycle or workspace persistence observation. |
| Password Reset | Blocked | Forgot-password action ignores sendReset error before reporting a sent link. |
| Expired Session Recovery | Needs Verification | No-session boundary and next routing inspected; actual expiration/refresh not exercised. |
| Workspace Recovery | Blocked | Workspace menu cannot switch; selected-context resolver lacks explicit active-membership revalidation before returning context. |
| Remembered Login | Needs Verification | Cookie/session persistence is not verified across browser restart or token expiry. |
| Invalid Token Recovery | Needs Verification | Missing-code/provider-error local callback paths checked; real invalid/expired token exchange unverified. |
| Expired Invitation Recovery | Needs Verification | SQL expiry gate and request-resend guidance exist; no live resend/reacceptance. |
| RBAC | Blocked | Runtime/visibility/SQL and role-alias mismatches prevent role certification. |
| Identity Search | Blocked | Roles, Users, Owner and Admin have no Owner-visible static result in current audit. |

## Owner finding

The existing creation RPC inserts organization, workspace and both organization_owner memberships atomically. Owner assignment does not wait for optional onboarding provisioning. This wave's requirement is immediately after successful workspace creation; it must not be confused with the earlier requirement of ownership at auth signup. The atomic source path is supported, but committed live records, selected workspace and immediate Owner invitation access remain unverified. Explicit workspace selection and recovery are blocked independently.

## Acceptance decision

| Requirement | Status |
| --- | --- |
| Workspace owner exists immediately after successful creation | Needs Verification |
| Invite Team works for required roles | Blocked |
| Invitation delivered and accepted | Blocked |
| Exact workspace joined and selected | Blocked |
| Correct RBAC | Blocked |
| Login works end to end | Needs Verification |
| Logout invalidates the session | Needs Verification |
| Password reset completes and old credentials fail | Blocked |
| Session recovery completes | Needs Verification |
| Every workflow certified | Blocked |

## Blocking findings

1. Invitation acceptance selects the newest pending invitation by email and does not target an explicit invitation identity. The action ignores the returned workspace ID.
2. Selected workspace, proxy navigation context and active-member authorization are not consistently resolved. Workspace menu has no switching action.
3. Manager lacks invite permission; HR-manager runtime grants disagree with SQL. Legacy agent differs from supported sales_representative. No privileges were widened to conceal the mismatch.
4. Password-reset submission ignores sendReset failure before presenting a sent-link message.
5. Owner-visible static search lacks Roles, Users, Owner and Admin results. Forty-eight role/query combinations were evaluated. Full authenticated records and command composition are not certified.

## Validation

| Check | Local evidence | Workflow certification limit |
| --- | --- | --- |
| TypeScript | Exit 0 | Compilation only |
| ESLint | Exit 0; audit script also checked | Static lint only |
| Regression tests | 1,632 completed; zero failures | Mock/source/contract coverage, not live completion |
| Production build | Exit 0 | Local build, no deployment |
| RBAC audit | Six role variants and 48 identity search cases executed | Blocked by mismatches; live API/RLS unverified |
| Navigation audit | Exit 0 using existing audit | Catalog links do not prove accepted-user authorization |
| Workspace audit | Owner inserts, context selection, acceptance and recovery inspected | Blocked by selected-context/recovery gaps |
| Authentication audit | 43 focused tests, zero failures; nine fresh local browser/HTTP cases, zero page errors | Needs Verification for actual credentials, delivery, OAuth, expiration and recovery |

Read-only browser/HTTP checks covered landing, signup, login with invitation return, forgot/reset password, unauthenticated dashboard/acceptance, missing-code callback, and provider-error callback. Invalid/missing callback parameters do not substitute for an expired real token. No form, email, account, membership or session mutation was executed. The local server/browser were closed afterward.

## Evidence required to finish Wave 1

An existing QA URL, authenticated session file, controlled inbox and authorization for test invitation/reset delivery were requested. None was supplied during this run. PLAYWRIGHT_AUTH_STATE is not configured. No production inbox receipt, OAuth consent, real login/logout, password replacement, invitation acceptance or joined-workspace persistence was observed.

Completion requires a controlled unassisted run through creation/Owner selection, invite/delivery/acceptance, exact role/workspace checks, logout/login, reset, invalid/expired tokens, remembered login and workspace recovery for the required roles. Record environment, role, timestamps and outcomes without secrets. Blocked findings must be resolved within the existing architecture before rerunning. No missing evidence is treated as approval or success.

## Reports and modified files

- IDENTITY_CERTIFICATION.md
- WORKSPACE_CERTIFICATION.md
- TEAM_CERTIFICATION.md
- RBAC_CERTIFICATION.md
- SESSION_CERTIFICATION.md
- FINAL_WAVE1_CERTIFICATION.md
- scripts/audit-wave1-certification.mjs
- test-results/wave1-certification/source-audit.json
- test-results/wave1-certification/workflows.json
- test-results/wave1-certification/authentication-browser-audit.json
- test-results/wave1-certification/validation.json
- test-results/wave1-certification/modified-files.json

TEAM_CERTIFICATION.md and RBAC_CERTIFICATION.md now contain this scoped Wave 1 audit. Earlier uncommitted application work is preserved. Required full-suite validation can regenerate existing fixtures; no intentional unrelated file change was made.

No commit. No deployment.
