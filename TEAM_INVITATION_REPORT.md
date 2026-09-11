# Team invitation report

## Canonical flow

1. Settings > Workspace > Team Members uses EnterpriseMembersManagement.
2. inviteMemberAction validates the existing invitation schema.
3. EnterpriseOrganizationService enforces team_management.create and calls invite_organization_member in the selected workspace.
4. SupabaseInvitationProvider generates the existing invite link and queues organization.team_invitation through EmailPublisherService. Queued is not delivered; UI submission no longer claims confirmed sending.
5. /accept-invitation invokes accept_organization_invitation for the authenticated email.
6. Existing SQL requires pending, unexpired invitation, locks it, assigns its stored role to both membership tables, then marks it accepted.

Resend/cancel/member role/status/transfer operations retain existing services and authorization. Failed provider submission attempts to cancel the pending invitation. No invitation or email was sent by this audit.

## Implemented fixes

- One canonical invitation action; legacy action delegates instead of calling a separate no-email repository mutation.
- Members page renders success/error feedback without echoing raw backend errors.
- Solo-member guidance links the existing invite form.
- Acceptance page shows expired/wrong-email retry guidance.
- Password login and Google login form retain the invitation return destination; password success and failure paths preserve it using safeAuthenticatedPath. Regression checks reject external return URLs.
- Membership actions revalidate the dashboard so its membership-driven checklist can refresh.

## Unresolved end-to-end risks

- Database enterprise_org_context only grants organization_owner/organization_admin. Manager is denied by runtime and SQL; hr_manager runtime permission is not sufficient for SQL. No silent privilege expansion was made.
- Acceptance chooses the newest pending invitation for the email, not an explicit invitation ID. Multiple pending workspaces require a separate database-contract review.
- Acceptance returns workspace ID, but the action does not select it in user_organization_context. A user with an existing workspace may land in that workspace.
- Generated invite links point to the acceptance page. The existing callback only exchanges code; browser session establishment for generated invite links has not been verified. Fresh user, existing user, expired link and resend need real auth-provider QA.
- Legacy onboarding records invitations directly. Delivery through the canonical email worker is not established for those records. No claim is made that all onboarding invitations are sent.
- A submitted invitation entering the queue does not prove provider delivery, inbox receipt, acceptance or member assignment in a live tenant.

No new authentication system, membership system, service, repository, schema or role was introduced.
