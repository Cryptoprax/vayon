# Wave 1 Workspace certification

Status: Blocked

This wave requires Owner immediately after successful workspace creation. It does not require an organization membership before a workspace exists. The existing complete_sprint43_onboarding SQL creates organization, workspace and both owner memberships in the same transaction. The owner role is not postponed until optional completion/provisioning. Calling the RPC an onboarding operation is not itself evidence that ownership is delayed after creation.

| Required condition | Current evidence | Status |
| --- | --- | --- |
| Organization exists | Existing creation RPC inserts organizations | Needs Verification |
| Workspace exists | Same RPC inserts workspaces | Needs Verification |
| Membership exists | organization_members and workspace_members inserted atomically | Needs Verification |
| Owner role exists immediately | Both inserts use organization_owner role ID | Needs Verification |
| No optional provisioning dependency | Required tenant exists before complete_enterprise_onboarding; optional failures deferred | Needs Verification |
| Workspace selected | Resolver falls back to first active membership; acceptance discards returned workspace ID | Blocked |
| Owner permissions active | Runtime Owner grants all; permission context checks actor's active membership | Needs Verification |
| Owner can invite on first dashboard | Owner allowed by runtime and SQL; no first-login invitation executed | Needs Verification |
| Workspace switching/recovery | Current-only menu, no selection action; selected context returned before explicit membership recheck | Blocked |

Live persisted IDs/roles, effective permissions and selected context have not been inspected. No separate Admin membership is invented: Owner already has administrative capability. The creation entry still uses existing onboarding; no independent creation flow was added. Completing the broader onboarding UI without assistance is unverified.

A separate consistency risk exists in proxy navigation: it selects a first active workspace membership, while the application resolver prefers user_organization_context. Different workspaces can therefore require reconciliation of navigation and selected-workspace permissions. This is a source mismatch, not a proven production bypass; database RLS behavior remains unverified.

Sources: supabase/migrations/20260814000000_sprint43_google_identity_workspace.sql; supabase/migrations/20260928000000_sprint211_onboarding_completion.sql; features/onboarding/services/onboarding.service.ts; features/onboarding/services/onboarding-completion.service.ts; features/onboarding/services/workspace.service.ts; features/platform/permissions/runtime/permission.service.ts; lib/supabase/proxy.ts; features/vayon/product-shell/WorkspaceSwitcher.tsx.
