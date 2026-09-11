# Business-critical workflow matrix

Product Bible v1.0 certification milestone. Status vocabulary is limited to Certified, Blocked, Needs Verification. A local test/build result is technical evidence, not customer completion. No workflow is Certified without production and first-time-customer evidence.

| ID | Workflow | Status | Missing certification evidence or blocker |
| --- | --- | --- | --- |
| W01 | Website | Needs Verification | Local public render only; no production or first-time-customer observation. |
| W02 | Signup | Blocked | Required immediate owner does not exist at auth signup; ownership is created by onboarding. |
| W03 | Google Login | Needs Verification | No real Google account round-trip or production redirect verification. |
| W04 | Email Login | Needs Verification | Mocked return-path regression and public form verified; no live credentials/session. |
| W05 | Workspace Creation | Blocked | No-onboarding-dependency requirement conflicts with existing onboarding-based creation; no live transaction observed. |
| W06 | Workspace Owner Assignment | Blocked | Persisted assignment is in source after onboarding, not immediately at signup; explicit selected workspace and live permissions unverified. |
| W07 | Dashboard | Needs Verification | Prior fixture checks do not certify live tenant completeness or customer completion. |
| W08 | Invite Team | Blocked | Manager denied; production email unverified; onboarding invitation recording still differs from canonical email path. |
| W09 | Accept Invitation | Blocked | Newest pending invitation is selected by email, not explicit invitation identity; invite-link session handling unverified. |
| W10 | Workspace Join | Blocked | Returned workspace ID is ignored and selected context is not updated. |
| W11 | Role Assignment | Blocked | Manager requirement and HR-manager runtime/SQL mismatch; legacy agent role differs from runtime sales_representative. |
| W12 | Create Property | Blocked | Service role lookup lacks actor filter and accepts a narrower role list than runtime; live save not verified. |
| W13 | Edit Property | Needs Verification | Success/failure paths exist; concurrency, persisted reload and actor permissions require live checks. |
| W14 | Publish Property | Blocked | Primary create/update contract has no publish mutation; end-to-end entry/action/public confirmation is not established. |
| W15 | Create Lead | Blocked | Runtime Agent create grant conflicts with service owner/admin/sales_manager allowlist; actor role lookup lacks user filter. |
| W16 | Convert Lead | Blocked | Changing status does not establish a complete linked conversion workflow. |
| W17 | Create Client | Blocked | Primary client directory has no direct create-client handoff; import and Create Lead are alternatives, not certified client creation. |
| W18 | Create Company | Needs Verification | Local source covers error and success; live persisted company and novice completion unverified. |
| W19 | Create Deal | Needs Verification | Live role-specific creation, linkage and reload unverified. |
| W20 | Move Deal | Needs Verification | Mouse/keyboard and stale-version real-customer completion unverified. |
| W21 | Create Task | Needs Verification | Source evidence only for tenant save and assignment. |
| W22 | Complete Task | Needs Verification | Persisted completion, repeat click and authorized role behavior not live-verified. |
| W23 | Calendar | Needs Verification | Timezone, overlap, persistence and customer navigation need authenticated evidence. |
| W24 | Viewing | Blocked | Lifecycle role list and unfiltered organization role lookup diverge from runtime roles; authenticated scheduling/recovery unverified. |
| W25 | Campaign | Blocked | Save campaign blueprint disabled; founder-only visibility overrides customer Creative grant. |
| W26 | Creative | Blocked | Customer visibility blocked; rendering/publishing disabled in governed studio; canned scores are not completed creative work. |
| W27 | Reports | Needs Verification | CSV path exists; customer production data, export correctness and full role coverage unverified. |
| W28 | Search | Blocked | 84 role/query cases expose missing/misranked tasks; five-second customer discoverability unmeasured. |
| W29 | Settings | Blocked | Read-only runtime view grants conflict with Settings visibility; invitation HR-manager/SQL mismatch; broad settings cannot be certified. |
| W30 | Logout | Needs Verification | Sign-out code exists; browser cookie, tab and expired-session behavior not live-verified. |
| W31 | Login Again | Needs Verification | No real logout/login cycle or selected-workspace persistence observation. |
| W32 | Password Reset | Blocked | Forgot-password ignores sendReset error and reports link sent; production recovery email/session and old-password rejection unverified. |
| W33 | Workspace Recovery | Blocked | Switcher has no workspace selection; selected context returned without explicit active-membership revalidation in resolver; RLS behavior needs live verification. |

## W01 - Website

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | / |
| Permissions | Public |
| Success state to observe | Read proposition; reach signup/login |
| Failure state | Public route/render error |
| Recovery | Reload or use login link |
| Next logical action | Signup |
| Status | Needs Verification |
| Missing step/evidence | Local public render only; no production or first-time-customer observation. |

Sources: `app/page.tsx`, `features/marketing/components/Homepage.tsx`. These are source references, not proof of production behavior.

## W02 - Signup

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | /signup |
| Permissions | Public auth signup |
| Success state to observe | Identity and profile, then email verification |
| Failure state | Validation/provider failure |
| Recovery | Correct form; retry verification |
| Next logical action | Verify email, then workspace creation |
| Status | Blocked |
| Missing step/evidence | Required immediate owner does not exist at auth signup; ownership is created by onboarding. |

Sources: `features/authentication/services/authentication.service.ts`, `features/authentication/actions/auth.actions.ts`. These are source references, not proof of production behavior.

## W03 - Google Login

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | /login > Continue with Google |
| Permissions | OAuth provider/session policy |
| Success state to observe | Existing callback exchanges code and redirects safely |
| Failure state | Provider cancellation or invalid code |
| Recovery | Return to login; retry |
| Next logical action | Selected workspace or onboarding |
| Status | Needs Verification |
| Missing step/evidence | No real Google account round-trip or production redirect verification. |

Sources: `app/login/page.tsx`, `app/auth/callback/route.ts`. These are source references, not proof of production behavior.

## W04 - Email Login

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | /login |
| Permissions | Existing authentication/rate limit |
| Success state to observe | Session established; safe return URL preserved |
| Failure state | Bounded credential error |
| Recovery | Correct credentials or password reset |
| Next logical action | Dashboard or invitation acceptance |
| Status | Needs Verification |
| Missing step/evidence | Mocked return-path regression and public form verified; no live credentials/session. |

Sources: `features/authentication/actions/auth.actions.ts`, `tests/team-invitation-workflow.test.mjs`. These are source references, not proof of production behavior.

## W05 - Workspace Creation

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | /vayon -> /onboarding |
| Permissions | Authenticated identity without active organization |
| Success state to observe | Organization/workspace and memberships inserted by existing RPC |
| Failure state | Provisioning/ownership check failure |
| Recovery | Existing onboarding retry |
| Next logical action | Dashboard after ownership verification |
| Status | Blocked |
| Missing step/evidence | No-onboarding-dependency requirement conflicts with existing onboarding-based creation; no live transaction observed. |

Sources: `features/onboarding/services/onboarding.service.ts`, `app/vayon/page.tsx`. These are source references, not proof of production behavior.

## W06 - Workspace Owner Assignment

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | Workspace creation RPC |
| Permissions | Authenticated creator |
| Success state to observe | organization_owner inserted into both membership tables |
| Failure state | Missing role or ownership verification failure |
| Recovery | Repair failed provisioning through existing flow |
| Next logical action | Dashboard with owner capabilities |
| Status | Blocked |
| Missing step/evidence | Persisted assignment is in source after onboarding, not immediately at signup; explicit selected workspace and live permissions unverified. |

Sources: `supabase/migrations/20260814000000_sprint43_google_identity_workspace.sql`, `features/onboarding/services/onboarding-completion.service.ts`. These are source references, not proof of production behavior.

## W07 - Dashboard

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | /vayon/dashboard |
| Permissions | Session, workspace and visibility gates |
| Success state to observe | Existing data snapshot and linked work |
| Failure state | Route error/empty setup state |
| Recovery | Retry or complete workspace setup |
| Next logical action | Start today's work |
| Status | Needs Verification |
| Missing step/evidence | Prior fixture checks do not certify live tenant completeness or customer completion. |

Sources: `features/vayon/dashboard/services/executive-dashboard.service.ts`, `features/vayon/dashboard/components/DashboardShell.tsx`. These are source references, not proof of production behavior.

## W08 - Invite Team

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | Settings > Workspace > Team Members |
| Permissions | Runtime team_management.create plus SQL owner/admin |
| Success state to observe | Invitation row and queued email |
| Failure state | Validation, duplicate, permission or provider failure |
| Recovery | Review pending list; correct email; resend |
| Next logical action | Recipient acceptance |
| Status | Blocked |
| Missing step/evidence | Manager denied; production email unverified; onboarding invitation recording still differs from canonical email path. |

Sources: `features/platform/organization/services/organization.service.ts`, `features/platform/organization/providers/supabase-invitation.provider.ts`. These are source references, not proof of production behavior.

## W09 - Accept Invitation

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | Email -> /accept-invitation |
| Permissions | Authenticated invited email; pending unexpired invitation |
| Success state to observe | SQL assigns stored role and marks accepted |
| Failure state | Invalid/expired/wrong email feedback |
| Recovery | Sign in as recipient or request resend |
| Next logical action | Workspace join |
| Status | Blocked |
| Missing step/evidence | Newest pending invitation is selected by email, not explicit invitation identity; invite-link session handling unverified. |

Sources: `app/accept-invitation/page.tsx`, `supabase/migrations/20260820000000_sprint51_enterprise_organization.sql`. These are source references, not proof of production behavior.

## W10 - Workspace Join

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | Accept invitation form |
| Permissions | Existing acceptance RPC |
| Success state to observe | Active organization/workspace memberships |
| Failure state | RPC or session failure |
| Recovery | Resend and retry with correct email |
| Next logical action | Select joined workspace |
| Status | Blocked |
| Missing step/evidence | Returned workspace ID is ignored and selected context is not updated. |

Sources: `features/platform/organization/actions/organization.actions.ts`, `features/onboarding/services/workspace.service.ts`. These are source references, not proof of production behavior.

## W11 - Role Assignment

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | Team Members invite/role controls |
| Permissions | Owner/Admin SQL; runtime manage |
| Success state to observe | Stored invitation role applied; role change persisted |
| Failure state | Invalid role/permission or owner-transfer restriction |
| Recovery | Choose valid role or existing transfer flow |
| Next logical action | Member logs in and verifies access |
| Status | Blocked |
| Missing step/evidence | Manager requirement and HR-manager runtime/SQL mismatch; legacy agent role differs from runtime sales_representative. |

Sources: `features/platform/organization/components/RoleManagementUI.tsx`, `features/platform/organization/services/organization.service.ts`. These are source references, not proof of production behavior.

## W12 - Create Property

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | Properties > create /vayon/properties/new |
| Permissions | PropertyService.canCreate plus database authorization |
| Success state to observe | Redirect to saved property ID |
| Failure state | Form/server error |
| Recovery | Correct inputs or reopen browser draft |
| Next logical action | Complete property details or prepare marketing |
| Status | Blocked |
| Missing step/evidence | Service role lookup lacks actor filter and accepts a narrower role list than runtime; live save not verified. |

Sources: `features/vayon/property/actions/property.actions.ts`, `features/vayon/property/services/property.service.ts`. These are source references, not proof of production behavior.

## W13 - Edit Property

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | Property record > Edit |
| Permissions | Existing service and database update authorization |
| Success state to observe | Updated record with versioned mutation |
| Failure state | Validation/conflict/permission failure |
| Recovery | Reload current version and retry |
| Next logical action | Review listing facts |
| Status | Needs Verification |
| Missing step/evidence | Success/failure paths exist; concurrency, persisted reload and actor permissions require live checks. |

Sources: `features/vayon/property/actions/property.actions.ts`. These are source references, not proof of production behavior.

## W14 - Publish Property

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | Property record/listing workflow |
| Permissions | Publishing permission must be verified |
| Success state to observe | Public listing reflects approved saved property |
| Failure state | No connected publish action identified in primary property mutation flow |
| Recovery | Return to property details; do not claim publication |
| Next logical action | Verify public listing |
| Status | Blocked |
| Missing step/evidence | Primary create/update contract has no publish mutation; end-to-end entry/action/public confirmation is not established. |

Sources: `features/vayon/property/actions/property.actions.ts`, `features/vayon/property/types/index.ts`. These are source references, not proof of production behavior.

## W15 - Create Lead

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | /vayon/leads/new |
| Permissions | LeadService.canManage plus database authorization |
| Success state to observe | Saved lead ID and confirmation |
| Failure state | Duplicate/input/permission feedback |
| Recovery | Open duplicate or correct form |
| Next logical action | Follow-up tasks |
| Status | Blocked |
| Missing step/evidence | Runtime Agent create grant conflicts with service owner/admin/sales_manager allowlist; actor role lookup lacks user filter. |

Sources: `features/vayon/lead/actions/lead.actions.ts`, `features/vayon/lead/services/lead.service.ts`. These are source references, not proof of production behavior.

## W16 - Convert Lead

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | Lead record |
| Permissions | Conversion permission not established |
| Success state to observe | Linked client/deal must persist |
| Failure state | No dedicated conversion action identified in audited primary lead flow |
| Recovery | Review existing lead/deals without duplicating records |
| Next logical action | Deal and viewing |
| Status | Blocked |
| Missing step/evidence | Changing status does not establish a complete linked conversion workflow. |

Sources: `features/vayon/lead/actions/lead.actions.ts`, `app/vayon/leads/[leadId]/page.tsx`. These are source references, not proof of production behavior.

## W17 - Create Client

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | /vayon/crm/contacts |
| Permissions | Contacts permission; import path separately gated |
| Success state to observe | New client record and profile |
| Failure state | Directory offers import or lead creation |
| Recovery | Use existing import when permitted; verify record |
| Next logical action | Client requirements/follow-up |
| Status | Blocked |
| Missing step/evidence | Primary client directory has no direct create-client handoff; import and Create Lead are alternatives, not certified client creation. |

Sources: `app/vayon/crm/contacts/page.tsx`, `features/vayon/crm-company/ContactDirectory.tsx`. These are source references, not proof of production behavior.

## W18 - Create Company

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | /vayon/crm/companies/new |
| Permissions | Existing company service/database authorization |
| Success state to observe | Saved company profile redirect |
| Failure state | Duplicate/validation/permission error |
| Recovery | Open existing company or correct inputs |
| Next logical action | Link clients/leads |
| Status | Needs Verification |
| Missing step/evidence | Local source covers error and success; live persisted company and novice completion unverified. |

Sources: `features/vayon/crm-company/actions.ts`. These are source references, not proof of production behavior.

## W19 - Create Deal

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | /vayon/deals/new |
| Permissions | Existing deal service/database authorization |
| Success state to observe | Saved deal ID and confirmation |
| Failure state | Validation or save error |
| Recovery | Correct linked property/customer and retry |
| Next logical action | Review tasks or schedule viewing |
| Status | Needs Verification |
| Missing step/evidence | Live role-specific creation, linkage and reload unverified. |

Sources: `features/vayon/deal/actions/deal.actions.ts`. These are source references, not proof of production behavior.

## W20 - Move Deal

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | Deals board/stage action |
| Permissions | Pipeline service and database role/version checks |
| Success state to observe | Stage updated and board refreshed |
| Failure state | Conflict or permission error |
| Recovery | Reload current version and retry |
| Next logical action | Next stage commitment |
| Status | Needs Verification |
| Missing step/evidence | Mouse/keyboard and stale-version real-customer completion unverified. |

Sources: `features/vayon/deal/services/pipeline.service.ts`, `features/vayon/deal/actions/deal.actions.ts`. These are source references, not proof of production behavior.

## W21 - Create Task

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | /vayon/tasks |
| Permissions | Operations task authorization |
| Success state to observe | Task created confirmation and list refresh |
| Failure state | Validation/service error |
| Recovery | Correct due date/assignment and retry |
| Next logical action | Complete task |
| Status | Needs Verification |
| Missing step/evidence | Source evidence only for tenant save and assignment. |

Sources: `features/vayon/operations/actions/operations.actions.ts`, `app/vayon/tasks/page.tsx`. These are source references, not proof of production behavior.

## W22 - Complete Task

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | Task list > complete |
| Permissions | Existing task/version authorization |
| Success state to observe | Completed status and confirmation |
| Failure state | Version/permission failure |
| Recovery | Reload and retry eligible task |
| Next logical action | Review remaining work |
| Status | Needs Verification |
| Missing step/evidence | Persisted completion, repeat click and authorized role behavior not live-verified. |

Sources: `features/vayon/operations/actions/operations.actions.ts`. These are source references, not proof of production behavior.

## W23 - Calendar

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | /vayon/calendar; /vayon/meetings |
| Permissions | calendar runtime grant plus service/RLS |
| Success state to observe | Recorded event and schedule view |
| Failure state | Validation/timezone/service errors |
| Recovery | Correct time and retry |
| Next logical action | Viewing or follow-up |
| Status | Needs Verification |
| Missing step/evidence | Timezone, overlap, persistence and customer navigation need authenticated evidence. |

Sources: `features/vayon/operations/actions/operations.actions.ts`, `features/vayon/operations/services/calendar.service.ts`. These are source references, not proof of production behavior.

## W24 - Viewing

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | /vayon/site-visits |
| Permissions | Runtime calendar plus separate lifecycle role allowlist |
| Success state to observe | Scheduled visit and lifecycle transitions |
| Failure state | Validation/version/permission error |
| Recovery | Correct participants/time; reload before retry |
| Next logical action | Feedback and follow-up |
| Status | Blocked |
| Missing step/evidence | Lifecycle role list and unfiltered organization role lookup diverge from runtime roles; authenticated scheduling/recovery unverified. |

Sources: `features/vayon/site-visits/actions.ts`, `app/vayon/site-visits/page.tsx`. These are source references, not proof of production behavior.

## W25 - Campaign

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | /vayon/creative/campaigns |
| Permissions | Creative visibility, subscription and runtime gates |
| Success state to observe | Saved campaign usable for review |
| Failure state | Canonical blueprint Save is disabled |
| Recovery | Existing draft tools require explicit reconnection/permission review |
| Next logical action | Review campaign assets |
| Status | Blocked |
| Missing step/evidence | Save campaign blueprint disabled; founder-only visibility overrides customer Creative grant. |

Sources: `features/vayon/campaign-studio/CampaignStudio.tsx`, `features/platform/visibility/policy.ts`. These are source references, not proof of production behavior.

## W26 - Creative

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | /vayon/creative; document/image/video tools |
| Permissions | Creative visibility and provider access |
| Success state to observe | Persisted usable output available for review |
| Failure state | Missing entitlement/provider/editor/rendering |
| Recovery | Existing route guidance and retry where supported |
| Next logical action | Approve/export usable artifact |
| Status | Blocked |
| Missing step/evidence | Customer visibility blocked; rendering/publishing disabled in governed studio; canned scores are not completed creative work. |

Sources: `features/vayon/creative-studio/service.ts`, `features/vayon/creative-studio/providers.ts`, `features/platform/visibility/policy.ts`. These are source references, not proof of production behavior.

## W27 - Reports

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | /vayon/analytics/executive and existing reports |
| Permissions | reports/analytics view/export grants |
| Success state to observe | Evidence-backed report or actual CSV export |
| Failure state | No figures/provider/data errors |
| Recovery | Review data coverage and retry |
| Next logical action | Business decision/follow-up |
| Status | Needs Verification |
| Missing step/evidence | CSV path exists; customer production data, export correctness and full role coverage unverified. |

Sources: `features/vayon/analytics-platform/components/ExecutiveBI.tsx`. These are source references, not proof of production behavior.

## W28 - Search

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | Universal Bar |
| Permissions | Filtered navigation and record-service permission gates |
| Success state to observe | Highest-value permitted action/record first |
| Failure state | Missing result/partial source state |
| Recovery | Try exact task or use existing navigation |
| Next logical action | Execute discovered workflow |
| Status | Blocked |
| Missing step/evidence | 84 role/query cases expose missing/misranked tasks; five-second customer discoverability unmeasured. |

Sources: `scripts/audit-business-workflow-certification.mjs`, `features/vayon/universal-bar/services/universal-search.service.ts`. These are source references, not proof of production behavior.

## W29 - Settings

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | Settings > existing configuration pages |
| Permissions | Visibility and per-module/action checks |
| Success state to observe | Persisted authorized configuration |
| Failure state | Validation or denied operation |
| Recovery | Correct inputs or return to permitted settings |
| Next logical action | Resume daily work |
| Status | Blocked |
| Missing step/evidence | Read-only runtime view grants conflict with Settings visibility; invitation HR-manager/SQL mismatch; broad settings cannot be certified. |

Sources: `features/platform/permissions/runtime/policy.ts`, `features/platform/visibility/policy.ts`. These are source references, not proof of production behavior.

## W30 - Logout

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | Profile menu > Sign out |
| Permissions | Authenticated session |
| Success state to observe | Session signed out; redirect login |
| Failure state | Sign-out error |
| Recovery | Retry and verify session ended |
| Next logical action | Login again |
| Status | Needs Verification |
| Missing step/evidence | Sign-out code exists; browser cookie, tab and expired-session behavior not live-verified. |

Sources: `features/authentication/actions/auth.actions.ts`. These are source references, not proof of production behavior.

## W31 - Login Again

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | /login after logout |
| Permissions | Authentication/rate limits |
| Success state to observe | New session returns to authorized workspace |
| Failure state | Credential/session/context failure |
| Recovery | Password reset or existing recovery |
| Next logical action | Dashboard |
| Status | Needs Verification |
| Missing step/evidence | No real logout/login cycle or selected-workspace persistence observation. |

Sources: `features/authentication/actions/auth.actions.ts`, `features/onboarding/services/workspace.service.ts`. These are source references, not proof of production behavior.

## W32 - Password Reset

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | /forgot-password -> email -> /reset-password |
| Permissions | Existing auth recovery/session |
| Success state to observe | Password update then login |
| Failure state | Provider/link/validation/session error |
| Recovery | Request fresh reset link |
| Next logical action | Login with new password |
| Status | Blocked |
| Missing step/evidence | Forgot-password ignores sendReset error and reports link sent; production recovery email/session and old-password rejection unverified. |

Sources: `features/authentication/actions/auth.actions.ts`, `features/authentication/services/authentication.service.ts`. These are source references, not proof of production behavior.

## W33 - Workspace Recovery

| Check | Existing path / evidence |
| --- | --- |
| Entry and navigation | Workspace switcher/login/selected context |
| Permissions | Active tenant membership required |
| Success state to observe | Valid selected workspace restored |
| Failure state | Removed/stale/missing membership |
| Recovery | No complete customer workspace-switch/recovery path shown |
| Next logical action | Authorized dashboard |
| Status | Blocked |
| Missing step/evidence | Switcher has no workspace selection; selected context returned without explicit active-membership revalidation in resolver; RLS behavior needs live verification. |

Sources: `features/vayon/product-shell/WorkspaceSwitcher.tsx`, `features/onboarding/services/workspace.service.ts`. These are source references, not proof of production behavior.

