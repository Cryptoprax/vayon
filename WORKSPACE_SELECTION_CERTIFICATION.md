# Workspace Selection Certification

Final state: **Needs Verification**

## Scope and decision

Only Workspace Selection was examined: creation, persistence, selection, dashboard context, refresh, logout/login, automatic restoration and the specified recovery cases. No other blocker was investigated or changed.

Production verification could not be completed because no target production/QA environment, authenticated test-session file, login-capable test account, or approved read-only access to that account's workspace/organization/membership/selected-context rows was supplied. PLAYWRIGHT_AUTH_STATE is not configured in the tool process. This does not establish that production is unavailable; it establishes that this run had no authenticated evidence from it. Access references were requested.

Source code, previous reports and an unauthenticated redirect cannot establish successful Workspace Selection. No workspace IDs, database rows, sessions or restoration outcomes were invented.

## Fresh runtime evidence

Observed at: 2026-09-11T18:05:08.074Z

Environment: Local existing production build at 127.0.0.1:3134

Method: GET without credentials, redirects not followed. No authentication cookies were supplied. Redirects were not followed.

| Request | HTTP status | Redirect | Preserved next path |
| --- | --- | --- | --- |
| GET /vayon/dashboard | 307 | /login | /vayon/dashboard |
| GET /vayon/dashboard | 307 | /login | /vayon/dashboard |
| GET /vayon/settings/workspace | 307 | /login | /vayon/settings/workspace |

The second Dashboard GET is a repeated unauthenticated request, not evidence of refresh within an authenticated session. These observations establish only the local unauthenticated entry behavior. They establish neither production behavior nor the identity of a selected workspace. The temporary local server was stopped.

## Required evidence ledger

| Required evidence | Evidence obtained in this run | What remains unobserved |
| --- | --- | --- |
| Workspace row | None from a database | Persisted ID, organization ID, active/deleted state |
| Organization row | None from a database | Persisted organization ID matching the workspace |
| Membership row | None from a database | Actor ID, workspace/organization IDs, active status and role |
| Selected workspace | No authenticated selection record | user_organization_context matches the same workspace |
| Session | Only requests without credentials | Valid authenticated actor and session before/after login |
| Dashboard | Local redirect to login | Rendered authenticated dashboard for the selected workspace |
| Navigation | Source path inspected only | Navigation uses the same selected workspace and role |
| Search context | Source authorization path inspected only | Search request and returned records belong to the same workspace |
| RBAC context | Source actor/workspace membership query inspected only | Effective runtime actor, organization, workspace and role |

No token or credential was captured.

## Requested lifecycle

| Step | Runtime observation still required |
| --- | --- |
| Workspace Creation | Real controlled creation returns the workspace and organization IDs |
| Workspace Persistence | Read back committed workspace, organization and membership rows |
| Workspace Selection | Read selected context and compare it with the created workspace |
| Dashboard | Load authenticated dashboard and record the selected workspace identity |
| Workspace Context | Correlate dashboard, navigation, search and RBAC with identical actor/workspace/organization IDs |
| Refresh | Reload within the same authenticated session; repeat the context comparison |
| Logout | Observe sign-out and loss of authenticated access |
| Login | Authenticate the same account through the existing flow |
| Workspace Automatically Restored | Verify selected context and all consumers restore the same authorized workspace without manual intervention |

No creation, selection, authenticated refresh, logout or login was executed in this run.

## Recovery evidence

| Case | What was actually observed | Required remaining runtime check |
| --- | --- | --- |
| No workspace | Not exercised with an authenticated account lacking membership | Observe the existing recovery destination without inventing a workspace |
| Multiple workspaces | No controlled multi-membership account supplied | Select an authorized workspace; verify context stability across refresh/login and all consumers |
| Deleted workspace | No deleted-workspace test state supplied | Verify stale selection is rejected and an authorized recovery path is presented |
| Expired session | Not exercised | Expire a controlled session and observe recovery plus restored workspace |
| Invalid session | Not exercised | Use an approved invalid/revoked test-session state and observe rejection/recovery |

An absent session is not an expired or invalid session. No workspace was deleted and no session was expired/revoked for testing.

## Source observations, not runtime conclusions

- `features/onboarding/services/onboarding.service.ts` calls the existing creation RPC, checks returned IDs, and reads the created actor's workspace membership.
- `features/onboarding/services/workspace.service.ts` reads selected context first; otherwise it requests a first active workspace membership.
- `features/onboarding/services/organization.service.ts` separately resolves selected organization or first active organization membership.
- `features/vayon/operations/services/context.ts` combines those organization/workspace results.
- `lib/supabase/proxy.ts` uses a first active workspace membership for navigation visibility.
- `features/platform/permissions/runtime/permission.service.ts` checks the actor's active membership for the resolved organization and workspace.
- `features/vayon/universal-bar/actions/search.actions.ts` obtains permission and visibility contexts before searching through existing services.

These paths identify the exact runtime IDs that must be compared. They are not proof that contexts match or differ in a real session. Database RLS, ordering, selection persistence and recovery behavior were not inferred from the source.

## Completion evidence needed

Provide an existing approved environment, controlled login-capable account and read-only row access. For a single real workspace ID, record committed rows and selected context, then correlate dashboard/navigation/search/RBAC before refresh, after refresh and after logout/login. Repeat the five recovery cases with controlled test states. Record timestamps and redacted identifiers; never store passwords, session cookies or tokens in this report.

Only this report was added. No application code, UX, feature, architecture or unrelated module was modified. No commit. No deployment.

