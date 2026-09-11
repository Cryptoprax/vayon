# Team workflow audit

Status: local reconnection fixes implemented; full beta certification remains blocked.

## Signup and ownership

AuthenticationService.signUp creates an auth identity. The auth.users profile trigger writes user_profiles. The existing complete_sprint43_onboarding RPC creates organization and workspace, then inserts the same organization_owner role into organization_members and workspace_members. OnboardingService verifies persisted workspace ownership and OnboardingCompletionService checks active ownership. organization_owner receives every runtime permission, so administrative capability does not require a separate Admin membership. No extra role or membership was invented.

This proves the code path after onboarding, not live production persistence or ownership immediately at signup. Existing users with no workspace are routed through onboarding. Invited users must join through acceptance rather than receive a new owner role.

## Route inventory and reconnection

| Route | Purpose and disposition |
| --- | --- |
| /vayon/settings | Now links Workspace Team Members to canonical membership management |
| /vayon/settings/organization | Existing Workspace entry now links Team Members |
| /vayon/settings/members | Canonical invitation and membership management, with feedback and solo-workspace guidance |
| /vayon/team | Existing redirect retained to canonical members page |
| /vayon/settings/users | Existing searchable employee directory retained; links canonical invitations; no duplicate invite form |
| /vayon/settings/teams | Existing subteam assignment/capacity management, distinct from workspace membership |
| /vayon/admin/users | Now redirects to canonical members page |
| /vayon/admin/teams | Now redirects to existing Settings Teams page |
| /platform/users | Platform administration; distinct scope, retained |
| /vayon/communications/teams | Microsoft Teams communication integration; not workspace membership, retained |
| /accept-invitation | Existing authenticated acceptance page, now exposes bounded error guidance |

No new pages were created. Existing identity-workspace invitation action now delegates to inviteMemberAction. Historical repository/RPC definitions are retained; old onboarding invitation capture still exists and is documented in the invitation report.

## Dashboard and search

The checklist shows Invite Your Team only for workspaceMemberCount === 1. Pending invitations do not count as joined members. Removed memberships are excluded; suspended existing members still count as joined. Zero/unknown counts do not claim the workspace has only the viewer. A single exact-count, head-only query reuses the dashboard service's tenant-scoped Supabase client. No new repository/service is created. This adds one database request to the existing parallel batch; it returns no member profiles. RLS is retained and live count visibility needs tenant QA.

Invite, Team, Members, User, Employee and Staff rank Invite Team Members first. The action requires the explicit members navigation destination, preventing a broad Settings ancestor from resurrecting an absent team action. Existing role-filtered navigation remains the gate; live role coverage is not certified.

## Files modified in this task

- app/accept-invitation/page.tsx
- app/login/page.tsx
- app/vayon/settings/page.tsx
- app/vayon/admin/teams/page.tsx
- app/vayon/admin/users/page.tsx
- app/vayon/settings/members/page.tsx
- app/vayon/settings/organization/page.tsx
- app/vayon/settings/users/page.tsx
- features/authentication/actions/auth.actions.ts
- features/identity-workspace/actions/settings.actions.ts
- features/vayon/dashboard/types.ts
- features/vayon/product-shell/navigation.ts
- features/platform/organization/actions/organization.actions.ts
- features/platform/organization/components/RoleManagementUI.tsx
- features/vayon/dashboard/components/GettingStartedChecklist.tsx
- features/vayon/dashboard/services/executive-dashboard.service.ts
- features/vayon/universal-bar/config/quick-create.ts
- features/vayon/universal-bar/providers/static-navigation.provider.ts
- features/vayon/universal-bar/services/universal-search.service.ts
- tests/product-bible-daily-workflows.test.mjs
- tests/product-bible-phase3.test.mjs
- tests/sprint223-remove-crm-import-onboarding.test.mjs
- tests/team-invitation-workflow.test.mjs

New reports/artifacts: TEAM_WORKFLOW_AUDIT.md, TEAM_INVITATION_REPORT.md, BETA_BLOCKER_REPORT.md, test-results/team-invitation/modified-files.json, test-results/team-invitation/audits.json. Regression execution also regenerates test-results/product-bible-phase2/dashboard-fixture.html; prior artifacts are preserved. Earlier uncommitted work was retained.
