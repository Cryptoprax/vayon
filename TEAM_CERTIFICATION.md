# Wave 1 Team certification

Status: Blocked

| Step | Existing implementation/evidence | Status |
| --- | --- | --- |
| Owner invites user | Canonical Team Members -> inviteMemberAction -> EnterpriseOrganizationService.invite | Needs Verification |
| Invitation generated | invite_organization_member validates role and writes pending invitation | Needs Verification |
| Invitation delivered | SupabaseInvitationProvider queues through EmailPublisherService; no inbox evidence | Needs Verification |
| Invitation accepted | Authenticated matching email, pending status, expiry and row lock; selects newest pending by email | Blocked |
| Workspace joined | SQL writes active memberships but action ignores returned workspace ID | Blocked |
| Correct role assigned | Stored role applied to both memberships; role policy/alias mismatch unresolved | Blocked |
| Correct navigation | Runtime/visibility role filters differ; proxy workspace selection differs from application context | Blocked |
| Correct permissions | Manager invitation denied; HR-manager runtime grant conflicts with Owner/Admin-only SQL | Blocked |

No invitation was sent, received, accepted, cancelled or resent during this wave. Email queued is not email delivered. Fresh/existing recipients, duplicate/expired invitations and exact joined-workspace selection require a controlled live run. An inbox and authorization to send test invitation/reset emails were requested; none was provided.

Existing SQL requires the authenticated email and pending unexpired invitation, and uses the invitation role rather than a browser-submitted acceptance role. These are useful source controls but not live proof of the lifecycle. Multiple pending invitations and an already-selected workspace remain blockers.

Sources: features/platform/organization/services/organization.service.ts; features/platform/organization/actions/organization.actions.ts; features/platform/organization/providers/supabase-invitation.provider.ts; supabase/migrations/20260820000000_sprint51_enterprise_organization.sql; supabase/migrations/20260919000000_sprint120a_workspace_role_catalog.sql.
