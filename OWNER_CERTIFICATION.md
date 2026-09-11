# Owner certification

Status: Blocked

The current signup call creates an authentication identity. The profile trigger creates user_profiles. Organization and workspace ownership is created later by complete_sprint43_onboarding. The strict requirements of owner immediately after signup and no onboarding dependency are not met by this source path.

| Required evidence | Existing implementation | Missing verification |
| --- | --- | --- |
| Workspace exists | Onboarding SQL inserts workspaces | Committed live record immediately after creation |
| Owner exists | Authenticated creator ID used by SQL | Actual first-user identity and creator fields |
| Membership exists | SQL inserts organization_members and workspace_members | Both committed membership rows in a real tenant |
| Owner role assigned | Same organization_owner role ID inserted in both rows | Live role IDs/code and effective permissions |
| Administrative capability | Runtime organization_owner grants all modules/actions | Dashboard/API/database behavior as real Owner |
| Workspace selected | WorkspaceService uses selected context or first active membership | Creation RPC does not prove selected user_organization_context |
| Before dashboard loads | OnboardingService and OnboardingCompletionService verify workspace ownership | Direct dashboard entry does not establish immediate-signup owner creation |
| No onboarding dependency | Creation uses onboarding RPC | Requirement conflicts with current creation path |

No separate Admin membership is required for an Owner to have administrative capability. No role values or persistence were fabricated.

Sources: features/authentication/services/authentication.service.ts; supabase/migrations/20260814000000_sprint43_google_identity_workspace.sql; features/onboarding/services/onboarding.service.ts; features/onboarding/services/onboarding-completion.service.ts; features/onboarding/services/workspace.service.ts; features/platform/permissions/runtime/policy.ts; app/vayon/page.tsx.

Exit evidence: observe a fresh customer create a workspace, inspect committed organization/workspace memberships and selected context, then reload the dashboard and verify allowed/denied operations. Establish how the frozen product meets immediate signup ownership without adding a separate provisioning architecture. No production database mutation was performed by this milestone.
