# Page Purpose Report

This is a source-based audit and a proposed purpose map, not certification that every runtime page has one action. Major broker workflows received the detailed review below. The route appendix covers the existing 345-page inventory; composed components and dynamic states still require signed-in review. No routes were removed or changed in this phase.

| Workflow | One question / purpose | Primary action | Secondary actions | Remove / relocate / simplify | Source |
|---|---|---|---|---|---|
| Dashboard | What should I do today? | Continue suggested next step | Review priorities and activity | Keep setup options collapsed; retain daily operational sections | features/vayon/dashboard/components/GettingStartedChecklist.tsx |
| Property | Sell this property. | Create or update property | Manage media; promote property | Recommend deferring optional qualification; renamed misleading Publish step to Save Property | features/vayon/property/components/PropertyWizard.tsx |
| Lead | Convert this lead. | Create or follow up lead | Qualify; schedule; link deal | Recommend deferring optional qualification and AI scoring until after initial capture | app/vayon/leads/new/page.tsx |
| Client | Manage this client relationship. | Open client profile | Import clients; create lead | Removed speculative metrics; retain actual relationship fields | features/vayon/crm-company/ContactDirectory.tsx |
| Company | Manage this business relationship. | Create or update company | Assign owner; manage contacts | Recommend moving optional business enrichment behind details | app/vayon/crm/companies/new/page.tsx |
| Deal | Move this deal toward closing. | Create or update deal | Connect property/client; review AI suggestions | Keep AI tied to current deal; verify destination context and return path | app/vayon/deals/[dealId]/page.tsx |
| Task | Complete the next follow-up. | Create or complete task | Set due date; assign owner | Keep optional detail secondary; task creation remains in existing task workspace | app/vayon/tasks/page.tsx |
| Campaign | Promote this property. | Create campaign | Review existing campaigns | Recommend one creation entry per state; unavailable service now offers Open Properties recovery | app/vayon/creative/campaigns/page.tsx |
| Approval | Decide what can proceed. | Review and approve/reject | Inspect supporting context | Recommend linking decisions from originating records; process-local source prevents authoritative global indexing | app/vayon/approvals/page.tsx |
| Creative | Create marketing material for this property. | Choose asset workflow | Use templates; review assets | Recommend contextual launch with record context; retain existing studios and access rules | app/vayon/creative/page.tsx |
| Analytics | How is my business performing? | Review performance | Filter; inspect metrics | Keep advanced metrics here; avoid duplicating summary surfaces | app/vayon/analytics/page.tsx |
| Settings | Configure my business. | Change selected business setting | Manage members and integrations | Keep occasional configuration contextual; preserve permissions | app/vayon/settings/page.tsx |

## Route purpose inventory

Suggested purposes below are inferred from route and source inventory, not customer research. Existing action excerpts can be incomplete when actions are composed in child components. Recommendation for every composed or unclear page: identify one primary job in signed-in QA before removing secondary controls. Administrative pages are not broker onboarding destinations.

| Route | Suggested single purpose | Existing action evidence | Source |
|---|---|---|---|
| /verify-email | Access or recover the workspace | Continue to sign in | app/verify-email/page.tsx |
| /vayon/workforce | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/workforce/page.tsx |
| /vayon/workflows/[workflowId] | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/workflows/[workflowId]/page.tsx |
| /vayon/workflows/runtime | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/workflows/runtime/page.tsx |
| /vayon/workflows | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/workflows/page.tsx |
| /vayon/whatsapp/templates | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/whatsapp/templates/page.tsx |
| /vayon/whatsapp/settings | Configure this business capability | Composed component: runtime review required | app/vayon/whatsapp/settings/page.tsx |
| /vayon/whatsapp | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/whatsapp/page.tsx |
| /vayon/whatsapp/inbox | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/whatsapp/inbox/page.tsx |
| /vayon/whatsapp/conversations | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/whatsapp/conversations/page.tsx |
| /vayon/timeline | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/timeline/page.tsx |
| /vayon/team | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/team/page.tsx |
| /vayon/tasks | Plan and complete follow-up | Composed component: runtime review required | app/vayon/tasks/page.tsx |
| /vayon/system | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/system/page.tsx |
| /vayon/success-center | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/success-center/page.tsx |
| /vayon/storage | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/storage/page.tsx |
| /forgot-password | Access or recover the workspace | Composed component: runtime review required | app/forgot-password/page.tsx |
| /vayon/calendar/week | Plan and complete follow-up | Composed component: runtime review required | app/vayon/calendar/week/page.tsx |
| /demo | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/demo/page.tsx |
| /vayon/calendar/tasks | Plan and complete follow-up | Composed component: runtime review required | app/vayon/calendar/tasks/page.tsx |
| /vayon/calendar/site-visits | Plan and complete follow-up | Composed component: runtime review required | app/vayon/calendar/site-visits/page.tsx |
| /vayon/calendar/reminders | Plan and complete follow-up | Composed component: runtime review required | app/vayon/calendar/reminders/page.tsx |
| /vayon/calendar | Plan and complete follow-up | Composed component: runtime review required | app/vayon/calendar/page.tsx |
| /vayon/calendar/outlook | Plan and complete follow-up | }) | app/vayon/calendar/outlook/page.tsx |
| /vayon/calendar/month | Plan and complete follow-up | Composed component: runtime review required | app/vayon/calendar/month/page.tsx |
| /vayon/calendar/meetings | Plan and complete follow-up | Composed component: runtime review required | app/vayon/calendar/meetings/page.tsx |
| /vayon/site-visits/[visitId] | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/site-visits/[visitId]/page.tsx |
| /vayon/site-visits/reports | Understand business performance | Composed component: runtime review required | app/vayon/site-visits/reports/page.tsx |
| /vayon/site-visits | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/site-visits/page.tsx |
| /vayon/site-visits/calendar | Plan and complete follow-up | Composed component: runtime review required | app/vayon/site-visits/calendar/page.tsx |
| /vayon/calendar/google/settings | Plan and complete follow-up | Composed component: runtime review required | app/vayon/calendar/google/settings/page.tsx |
| /vayon/calendar/google | Plan and complete follow-up | Composed component: runtime review required | app/vayon/calendar/google/page.tsx |
| /vayon/calendar/google/free-busy | Plan and complete follow-up | Composed component: runtime review required | app/vayon/calendar/google/free-busy/page.tsx |
| /vayon/calendar/google/events | Plan and complete follow-up | Composed component: runtime review required | app/vayon/calendar/google/events/page.tsx |
| /accept-invitation | Complete the job named by this destination; confirm with its owner | Accept invitation | app/accept-invitation/page.tsx |
| /vayon/calendar/google/calendars | Plan and complete follow-up | Composed component: runtime review required | app/vayon/calendar/google/calendars/page.tsx |
| /vayon/calendar/day | Plan and complete follow-up | Composed component: runtime review required | app/vayon/calendar/day/page.tsx |
| /vayon/settings/workspace | Configure this business capability | Composed component: runtime review required | app/vayon/settings/workspace/page.tsx |
| /vayon/calendar/agenda | Plan and complete follow-up | Composed component: runtime review required | app/vayon/calendar/agenda/page.tsx |
| /vayon/settings/users | Configure this business capability | Composed component: runtime review required | app/vayon/settings/users/page.tsx |
| /vayon/settings/usage | Configure this business capability | Composed component: runtime review required | app/vayon/settings/usage/page.tsx |
| /workflows | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/workflows/page.tsx |
| /vayon/settings/teams | Configure this business capability | Composed component: runtime review required | app/vayon/settings/teams/page.tsx |
| /trust-center | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/trust-center/page.tsx |
| /vayon/settings/subscription | Configure this business capability | Composed component: runtime review required | app/vayon/settings/subscription/page.tsx |
| /vayon/settings/security | Configure this business capability | Composed component: runtime review required | app/vayon/settings/security/page.tsx |
| /trademark-policy | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/trademark-policy/page.tsx |
| /vayon/settings/roles | Configure this business capability | Composed component: runtime review required | app/vayon/settings/roles/page.tsx |
| /terms | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/terms/page.tsx |
| /support-policy | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/support-policy/page.tsx |
| /subprocessors | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/subprocessors/page.tsx |
| /status | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/status/page.tsx |
| /solutions/[slug] | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/solutions/[slug]/page.tsx |
| /solutions | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/solutions/page.tsx |
| /security | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/security/page.tsx |
| /search | Complete the job named by this destination; confirm with its owner | ;
}) | app/(marketing)/search/page.tsx |
| /sales-assets/[slug] | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/sales-assets/[slug]/page.tsx |
| /sales-assets | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/sales-assets/page.tsx |
| /roi-calculator | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/roi-calculator/page.tsx |
| /resources | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/resources/page.tsx |
| /release-notes | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/release-notes/page.tsx |
| /refund-policy | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/refund-policy/page.tsx |
| /vayon/settings/profile | Configure this business capability | Composed component: runtime review required | app/vayon/settings/profile/page.tsx |
| /properties | Sell or manage the selected property | Composed component: runtime review required | app/(marketing)/properties/page.tsx |
| /product | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/product/page.tsx |
| /privacy | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/privacy/page.tsx |
| /pricing | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/pricing/page.tsx |
| /vayon/settings/product-intelligence | Configure this business capability | Composed component: runtime review required | app/vayon/settings/product-intelligence/page.tsx |
| /press-kit | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/press-kit/page.tsx |
| /vayon/settings/plans | Configure this business capability | Composed component: runtime review required | app/vayon/settings/plans/page.tsx |
| /vayon/settings/permissions | Configure this business capability | Composed component: runtime review required | app/vayon/settings/permissions/page.tsx |
| /vayon/settings/payment-methods | Configure this business capability | Composed component: runtime review required | app/vayon/settings/payment-methods/page.tsx |
| /vayon/settings | Configure this business capability | Composed component: runtime review required | app/vayon/settings/page.tsx |
| /vayon/settings/organization | Configure this business capability | Composed component: runtime review required | app/vayon/settings/organization/page.tsx |
| /vayon/settings/notifications | Configure this business capability | Edit notification preferences | app/vayon/settings/notifications/page.tsx |
| /vayon/settings/members | Configure this business capability | Composed component: runtime review required | app/vayon/settings/members/page.tsx |
| /vayon/settings/invoices/[invoiceId] | Configure this business capability | Composed component: runtime review required | app/vayon/settings/invoices/[invoiceId]/page.tsx |
| /vayon/settings/invoices | Configure this business capability | Composed component: runtime review required | app/vayon/settings/invoices/page.tsx |
| /partners | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/partners/page.tsx |
| /media-kit | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/media-kit/page.tsx |
| /investors | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/investors/page.tsx |
| /vayon/settings/integrations | Configure this business capability | ;
}) | app/vayon/settings/integrations/page.tsx |
| /integrations | Configure this business capability | Composed component: runtime review required | app/(marketing)/integrations/page.tsx |
| /vayon/settings/integrations/microsoft | Configure this business capability | Composed component: runtime review required | app/vayon/settings/integrations/microsoft/page.tsx |
| /vayon/settings/integrations/google | Configure this business capability | Composed component: runtime review required | app/vayon/settings/integrations/google/page.tsx |
| /vayon/settings/integrations/data-import | Configure this business capability | Composed component: runtime review required | app/vayon/settings/integrations/data-import/page.tsx |
| /vayon/settings/google | Configure this business capability | Composed component: runtime review required | app/vayon/settings/google/page.tsx |
| /industries/[slug] | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/industries/[slug]/page.tsx |
| /industries | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/industries/page.tsx |
| /vayon/brain | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/brain/page.tsx |
| /vayon/settings/email/templates | Configure this business capability | Composed component: runtime review required | app/vayon/settings/email/templates/page.tsx |
| /vayon/settings/email/queue | Configure this business capability | Composed component: runtime review required | app/vayon/settings/email/queue/page.tsx |
| /vayon/settings/email | Configure this business capability | Composed component: runtime review required | app/vayon/settings/email/page.tsx |
| /vayon/approvals/[approvalId] | Review a requested decision | Composed component: runtime review required | app/vayon/approvals/[approvalId]/page.tsx |
| /vayon/approvals | Review a requested decision | Composed component: runtime review required | app/vayon/approvals/page.tsx |
| /vayon/settings/email/history | Configure this business capability | Composed component: runtime review required | app/vayon/settings/email/history/page.tsx |
| /vayon/settings/departments | Configure this business capability | Composed component: runtime review required | app/vayon/settings/departments/page.tsx |
| /vayon/settings/configuration | Configure this business capability | Composed component: runtime review required | app/vayon/settings/configuration/page.tsx |
| /vayon/settings/billing/provider-health | Configure this business capability | Composed component: runtime review required | app/vayon/settings/billing/provider-health/page.tsx |
| /vayon/settings/billing | Configure this business capability | import("@/features/vayon/billing/components/BillingRecoveryDetails"));
// PaddleCatalogService.list() is isolated inside BillingStabilityService so provider failure cannot reject this page.
export default async function Page() | app/vayon/settings/billing/page.tsx |
| /vayon/settings/appearance | Configure this business capability | Composed component: runtime review required | app/vayon/settings/appearance/page.tsx |
| /vayon/analytics/workforce | Understand business performance | Composed component: runtime review required | app/vayon/analytics/workforce/page.tsx |
| /vayon/analytics/sales | Understand business performance | Composed component: runtime review required | app/vayon/analytics/sales/page.tsx |
| /vayon/analytics/properties | Sell or manage the selected property | Composed component: runtime review required | app/vayon/analytics/properties/page.tsx |
| /vayon/analytics | Understand business performance | Composed component: runtime review required | app/vayon/analytics/page.tsx |
| /vayon/analytics/executive | Understand business performance | Composed component: runtime review required | app/vayon/analytics/executive/page.tsx |
| /vayon/analytics/deals | Move deals toward closing | Composed component: runtime review required | app/vayon/analytics/deals/page.tsx |
| /vayon/analytics/crm | Understand business performance | Composed component: runtime review required | app/vayon/analytics/crm/page.tsx |
| /vayon/analytics/conversion | Understand business performance | Composed component: runtime review required | app/vayon/analytics/conversion/page.tsx |
| /reset-password | Access or recover the workspace | Composed component: runtime review required | app/reset-password/page.tsx |
| /vayon/analytics/communications | Understand business performance | Composed component: runtime review required | app/vayon/analytics/communications/page.tsx |
| /vayon/settings/ai/openai | Configure this business capability | Composed component: runtime review required | app/vayon/settings/ai/openai/page.tsx |
| /vayon/settings/activity | Configure this business capability | Composed component: runtime review required | app/vayon/settings/activity/page.tsx |
| /vayon/runtime | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/runtime/page.tsx |
| /vayon/providers/[provider] | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/providers/[provider]/page.tsx |
| /vayon/providers | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/providers/page.tsx |
| /vayon/property-matching/reports | Understand business performance | Composed component: runtime review required | app/vayon/property-matching/reports/page.tsx |
| /vayon/property-matching | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/property-matching/page.tsx |
| /vayon/ai/workforce/[employeeId] | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/ai/workforce/[employeeId]/page.tsx |
| /vayon/ai/workforce | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/ai/workforce/page.tsx |
| /vayon/property-matching/compare | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/property-matching/compare/page.tsx |
| /vayon/ai/work-queue | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/ai/work-queue/page.tsx |
| /vayon/ai/tasks | Plan and complete follow-up | Composed component: runtime review required | app/vayon/ai/tasks/page.tsx |
| /vayon/ai/playground | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/ai/playground/page.tsx |
| /vayon/ai | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/ai/page.tsx |
| /vayon/ai/knowledge | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/ai/knowledge/page.tsx |
| /vayon/ai/history | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/ai/history/page.tsx |
| /vayon/properties/[propertyId] | Sell or manage the selected property | Composed component: runtime review required | app/vayon/properties/[propertyId]/page.tsx |
| /vayon/ai/goals | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/ai/goals/page.tsx |
| /vayon/properties/[propertyId]/edit | Sell or manage the selected property | Composed component: runtime review required | app/vayon/properties/[propertyId]/edit/page.tsx |
| /vayon/ai/employees/[employeeId] | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/ai/employees/[employeeId]/page.tsx |
| /vayon/ai/employees | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/ai/employees/page.tsx |
| /vayon/properties/projects/[projectId] | Sell or manage the selected property | Composed component: runtime review required | app/vayon/properties/projects/[projectId]/page.tsx |
| /vayon/properties/projects | Sell or manage the selected property | Composed component: runtime review required | app/vayon/properties/projects/page.tsx |
| /vayon/ai/collaboration | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/ai/collaboration/page.tsx |
| /vayon/properties/price-lists | Sell or manage the selected property | Composed component: runtime review required | app/vayon/properties/price-lists/page.tsx |
| /vayon/properties | Sell or manage the selected property | >}) | app/vayon/properties/page.tsx |
| /vayon/properties/new | Sell or manage the selected property | Composed component: runtime review required | app/vayon/properties/new/page.tsx |
| /platform/workspaces | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/workspaces/page.tsx |
| /vayon/properties/media | Sell or manage the selected property | Composed component: runtime review required | app/vayon/properties/media/page.tsx |
| /vayon/ai/automations | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/ai/automations/page.tsx |
| /vayon/properties/map | Sell or manage the selected property | Composed component: runtime review required | app/vayon/properties/map/page.tsx |
| /vayon/properties/inventory | Sell or manage the selected property | Composed component: runtime review required | app/vayon/properties/inventory/page.tsx |
| /platform/users | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/users/page.tsx |
| /vayon/properties/grid | Sell or manage the selected property | Composed component: runtime review required | app/vayon/properties/grid/page.tsx |
| /vayon/properties/documents | Sell or manage the selected property | Composed component: runtime review required | app/vayon/properties/documents/page.tsx |
| /vayon/properties/availability | Sell or manage the selected property | Composed component: runtime review required | app/vayon/properties/availability/page.tsx |
| /vayon/admin/workspaces | Operate the selected administrative capability | Composed component: runtime review required | app/vayon/admin/workspaces/page.tsx |
| /vayon/properties/analytics | Sell or manage the selected property | Composed component: runtime review required | app/vayon/properties/analytics/page.tsx |
| /vayon/admin/users | Operate the selected administrative capability | Composed component: runtime review required | app/vayon/admin/users/page.tsx |
| /vayon/admin/teams | Operate the selected administrative capability | Composed component: runtime review required | app/vayon/admin/teams/page.tsx |
| /vayon/platform/launch-readiness | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/platform/launch-readiness/page.tsx |
| /vayon | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/page.tsx |
| /platform/themes | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/themes/page.tsx |
| /vayon/admin/roles | Operate the selected administrative capability | Composed component: runtime review required | app/vayon/admin/roles/page.tsx |
| /vayon/operations | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/operations/page.tsx |
| /platform/system-analytics | Understand business performance | Composed component: runtime review required | app/platform/system-analytics/page.tsx |
| /vayon/admin/permissions | Operate the selected administrative capability | Composed component: runtime review required | app/vayon/admin/permissions/page.tsx |
| /vayon/admin | Operate the selected administrative capability | Composed component: runtime review required | app/vayon/admin/page.tsx |
| /vayon/objects | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/objects/page.tsx |
| /platform/support | Complete the job named by this destination; confirm with its owner | x.status==="active"&&x.expiresAt&&x.expiresAt>new Date().toISOString());return | app/platform/support/page.tsx |
| /vayon/admin/organizations | Operate the selected administrative capability | Composed component: runtime review required | app/vayon/admin/organizations/page.tsx |
| /platform/settings | Configure this business capability | Composed component: runtime review required | app/platform/settings/page.tsx |
| /vayon/admin/departments | Operate the selected administrative capability | Composed component: runtime review required | app/vayon/admin/departments/page.tsx |
| /vayon/admin/audit | Operate the selected administrative capability | Composed component: runtime review required | app/vayon/admin/audit/page.tsx |
| /platform/security-review | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/security-review/page.tsx |
| /help | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/help/page.tsx |
| /signup | Access or recover the workspace | }) | app/signup/page.tsx |
| /platform/search | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/search/page.tsx |
| /vayon/notifications/preferences | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/notifications/preferences/page.tsx |
| /vayon/notifications | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/notifications/page.tsx |
| /vayon/executions | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/executions/page.tsx |
| /platform/roles | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/roles/page.tsx |
| /vayon/notifications/inbox | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/notifications/inbox/page.tsx |
| /features/[slug] | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/features/[slug]/page.tsx |
| /features | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/features/page.tsx |
| /platform/feature-flags | Complete the job named by this destination; confirm with its owner | Create flag | app/platform/feature-flags/page.tsx |
| /vayon/events | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/events/page.tsx |
| /platform/releases | Complete the job named by this destination; confirm with its owner | Publish release record | app/platform/releases/page.tsx |
| /vayon/notifications/history | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/notifications/history/page.tsx |
| /enterprise | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/enterprise/page.tsx |
| /platform/deployment | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/deployment/page.tsx |
| /vayon/events/history | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/events/history/page.tsx |
| /platform/region-management | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/region-management/page.tsx |
| /vayon/messages | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/messages/page.tsx |
| /vayon/events/catalog | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/events/catalog/page.tsx |
| /platform/platform-health | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/platform-health/page.tsx |
| /vayon/meetings | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/meetings/page.tsx |
| /platform/customers/[organizationId] | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/customers/[organizationId]/page.tsx |
| /platform/customers | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/customers/page.tsx |
| /docs/[slug] | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/docs/[slug]/page.tsx |
| /docs | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/docs/page.tsx |
| /platform/permissions | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/permissions/page.tsx |
| /platform/customer-success | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/customer-success/page.tsx |
| /developers | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/developers/page.tsx |
| /platform/performance | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/performance/page.tsx |
| /platform | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/page.tsx |
| /vayon/leads/[leadId] | Capture or convert the selected lead | Composed component: runtime review required | app/vayon/leads/[leadId]/page.tsx |
| /platform/country-management | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/country-management/page.tsx |
| /vayon/email/[messageId] | Review or perform the selected AI-assisted job | }) | app/vayon/email/[messageId]/page.tsx |
| /deals | Move deals toward closing | Composed component: runtime review required | app/(marketing)/deals/page.tsx |
| /platform/organizations | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/organizations/page.tsx |
| /vayon/leads/[leadId]/edit | Capture or convert the selected lead | Composed component: runtime review required | app/vayon/leads/[leadId]/edit/page.tsx |
| /vayon/leads | Capture or convert the selected lead | >}) | app/vayon/leads/page.tsx |
| /platform/command-center | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/command-center/page.tsx |
| /vayon/email/trash | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/email/trash/page.tsx |
| /data-processing-addendum | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/data-processing-addendum/page.tsx |
| /platform/operations | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/operations/page.tsx |
| /vayon/leads/new | Capture or convert the selected lead | Composed component: runtime review required | app/vayon/leads/new/page.tsx |
| /data-ownership | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/data-ownership/page.tsx |
| /platform/notifications | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/notifications/page.tsx |
| /vayon/email/spam | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/email/spam/page.tsx |
| /platform/launch-readiness | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/launch-readiness/page.tsx |
| /vayon/knowledge | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/knowledge/page.tsx |
| /customers/[slug] | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/customers/[slug]/page.tsx |
| /customers | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/customers/page.tsx |
| /vayon/customer-success | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/customer-success/page.tsx |
| /platform/integrations/webhooks | Configure this business capability | Composed component: runtime review required | app/platform/integrations/webhooks/page.tsx |
| /vayon/email/sent | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/email/sent/page.tsx |
| /vayon/email | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/email/page.tsx |
| /platform/builder/settings | Configure this business capability | Composed component: runtime review required | app/platform/builder/settings/page.tsx |
| /platform/builder | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/builder/page.tsx |
| /vayon/knowledge/help | Complete the job named by this destination; confirm with its owner | ;
}) | app/vayon/knowledge/help/page.tsx |
| /crm | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/crm/page.tsx |
| /platform/integrations/secrets | Configure this business capability | Composed component: runtime review required | app/platform/integrations/secrets/page.tsx |
| /vayon/intelligence | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/intelligence/page.tsx |
| /platform/builder/navigation | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/builder/navigation/page.tsx |
| /copyright-policy | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/copyright-policy/page.tsx |
| /vayon/email/inbox | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/email/inbox/page.tsx |
| /vayon/crm | Complete the job named by this destination; confirm with its owner | Add lead | app/vayon/crm/page.tsx |
| /platform/integrations/providers | Configure this business capability | Composed component: runtime review required | app/platform/integrations/providers/page.tsx |
| /platform/integrations | Configure this business capability | Composed component: runtime review required | app/platform/integrations/page.tsx |
| /vayon/home | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/home/page.tsx |
| /cookie-policy | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/cookie-policy/page.tsx |
| /platform/builder/modules | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/builder/modules/page.tsx |
| /vayon/email/drafts | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/email/drafts/page.tsx |
| /platform/integrations/logs | Configure this business capability | Composed component: runtime review required | app/platform/integrations/logs/page.tsx |
| /platform/builder/features | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/builder/features/page.tsx |
| /contact | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/contact/page.tsx |
| /vayon/crm/leads/[leadId] | Capture or convert the selected lead | Composed component: runtime review required | app/vayon/crm/leads/[leadId]/page.tsx |
| /vayon/crm/leads | Capture or convert the selected lead | >;
}) | app/vayon/crm/leads/page.tsx |
| /platform/integrations/health | Configure this business capability | Composed component: runtime review required | app/platform/integrations/health/page.tsx |
| /vayon/growth/[section] | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/growth/[section]/page.tsx |
| /vayon/growth | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/growth/page.tsx |
| /platform/builder/branding | Promote a property with the selected marketing tool | Composed component: runtime review required | app/platform/builder/branding/page.tsx |
| /vayon/email/archive | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/vayon/email/archive/page.tsx |
| /vayon/crm/customers | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/crm/customers/page.tsx |
| /platform/identity | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/identity/page.tsx |
| /platform/builder/applications | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/builder/applications/page.tsx |
| /compare/[slug] | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/compare/[slug]/page.tsx |
| /compare | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/compare/page.tsx |
| /vayon/founder/approvals | Review a requested decision | Composed component: runtime review required | app/vayon/founder/approvals/page.tsx |
| /platform/audit | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/audit/page.tsx |
| /communications | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/communications/page.tsx |
| /vayon/documents/onedrive | Complete the job named by this destination; confirm with its owner | }) | app/vayon/documents/onedrive/page.tsx |
| /vayon/crm/contacts/[contactId] | Manage the client relationship | Composed component: runtime review required | app/vayon/crm/contacts/[contactId]/page.tsx |
| /vayon/crm/contacts | Manage the client relationship | Composed component: runtime review required | app/vayon/crm/contacts/page.tsx |
| /vayon/follow-ups | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/follow-ups/page.tsx |
| /platform/applications | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/applications/page.tsx |
| /careers | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/careers/page.tsx |
| /vayon/documents/drive | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/documents/drive/page.tsx |
| /platform/activity | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/platform/activity/page.tsx |
| /calendar | Plan and complete follow-up | Composed component: runtime review required | app/(marketing)/calendar/page.tsx |
| /platform/founder/workflows | Operate the selected administrative capability | Composed component: runtime review required | app/platform/founder/workflows/page.tsx |
| /vayon/crm/companies/[companyId] | Manage the company relationship | Composed component: runtime review required | app/vayon/crm/companies/[companyId]/page.tsx |
| /vayon/developers | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/developers/page.tsx |
| /brand-assets | Promote a property with the selected marketing tool | Composed component: runtime review required | app/(marketing)/brand-assets/page.tsx |
| /platform/founder/tenants | Operate the selected administrative capability | Composed component: runtime review required | app/platform/founder/tenants/page.tsx |
| /vayon/crm/companies/[companyId]/edit | Manage the company relationship | Composed component: runtime review required | app/vayon/crm/companies/[companyId]/edit/page.tsx |
| /vayon/crm/companies | Manage the company relationship | >;
}) | app/vayon/crm/companies/page.tsx |
| /platform/founder/sales | Operate the selected administrative capability | Composed component: runtime review required | app/platform/founder/sales/page.tsx |
| /platform/founder | Operate the selected administrative capability | Composed component: runtime review required | app/platform/founder/page.tsx |
| /vayon/crm/companies/new | Manage the company relationship | Composed component: runtime review required | app/vayon/crm/companies/new/page.tsx |
| /blog/[slug] | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/blog/[slug]/page.tsx |
| /blog | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/blog/page.tsx |
| /onboarding/[setup] | Prepare the business workspace | Composed component: runtime review required | app/onboarding/[setup]/page.tsx |
| /onboarding | Prepare the business workspace | Composed component: runtime review required | app/onboarding/page.tsx |
| /platform/founder/operations | Operate the selected administrative capability | Composed component: runtime review required | app/platform/founder/operations/page.tsx |
| /vayon/crm/activities | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/crm/activities/page.tsx |
| /api | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/api/page.tsx |
| /platform/founder/observability | Operate the selected administrative capability | Composed component: runtime review required | app/platform/founder/observability/page.tsx |
| /vayon/deals/[dealId] | Move deals toward closing | Composed component: runtime review required | app/vayon/deals/[dealId]/page.tsx |
| /onboarding/business-launch | Prepare the business workspace | Composed component: runtime review required | app/onboarding/business-launch/page.tsx |
| /ai-workforce | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/(marketing)/ai-workforce/page.tsx |
| /platform/founder/memory | Operate the selected administrative capability | Composed component: runtime review required | app/platform/founder/memory/page.tsx |
| /vayon/deals/[dealId]/edit | Move deals toward closing | Composed component: runtime review required | app/vayon/deals/[dealId]/edit/page.tsx |
| /login | Access or recover the workspace | }) | app/login/page.tsx |
| /ai-usage-policy | Review or perform the selected AI-assisted job | Composed component: runtime review required | app/(marketing)/ai-usage-policy/page.tsx |
| /platform/founder/marketing | Promote a property with the selected marketing tool | Composed component: runtime review required | app/platform/founder/marketing/page.tsx |
| /vayon/deals/pipeline | Move deals toward closing | Pipeline reports | app/vayon/deals/pipeline/page.tsx |
| /vayon/deals | Move deals toward closing | New transaction | app/vayon/deals/page.tsx |
| /vayon/creative-studio/wizard | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/creative-studio/wizard/page.tsx |
| /platform/founder/customer-success | Operate the selected administrative capability | Composed component: runtime review required | app/platform/founder/customer-success/page.tsx |
| /acceptable-use-policy | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/acceptable-use-policy/page.tsx |
| /platform/founder/intelligence | Operate the selected administrative capability | Composed component: runtime review required | app/platform/founder/intelligence/page.tsx |
| /vayon/deals/offers | Move deals toward closing | Composed component: runtime review required | app/vayon/deals/offers/page.tsx |
| /vayon/creative-studio/templates | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/creative-studio/templates/page.tsx |
| /vayon/creative-studio | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/creative-studio/page.tsx |
| /platform/founder/command-center | Operate the selected administrative capability | Composed component: runtime review required | app/platform/founder/command-center/page.tsx |
| /about | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/(marketing)/about/page.tsx |
| /platform/founder/integrations | Configure this business capability | Composed component: runtime review required | app/platform/founder/integrations/page.tsx |
| /vayon/deals/new | Move deals toward closing | Composed component: runtime review required | app/vayon/deals/new/page.tsx |
| /vayon/creative-studio/packs | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/creative-studio/packs/page.tsx |
| /platform/founder/ai | Operate the selected administrative capability | Composed component: runtime review required | app/platform/founder/ai/page.tsx |
| /vayon/creative-studio/assets | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/creative-studio/assets/page.tsx |
| /vayon/deals/contracts | Move deals toward closing | Composed component: runtime review required | app/vayon/deals/contracts/page.tsx |
| /vayon/creative-studio/growth | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/creative-studio/growth/page.tsx |
| /platform/founder/access | Operate the selected administrative capability | Composed component: runtime review required | app/platform/founder/access/page.tsx |
| /vayon/deals/checklists | Move deals toward closing | Composed component: runtime review required | app/vayon/deals/checklists/page.tsx |
| /vayon/creative-studio/analytics | Understand business performance | Composed component: runtime review required | app/vayon/creative-studio/analytics/page.tsx |
| /vayon/context | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/context/page.tsx |
| /vayon/contacts/microsoft | Manage the client relationship | }) | app/vayon/contacts/microsoft/page.tsx |
| /vayon/deals/analytics | Move deals toward closing | Composed component: runtime review required | app/vayon/deals/analytics/page.tsx |
| /vayon/creative-studio/editor/[assetId] | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/creative-studio/editor/[assetId]/page.tsx |
| /vayon/creative-studio/brand-kits | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/creative-studio/brand-kits/page.tsx |
| /vayon/contacts/google | Manage the client relationship | Composed component: runtime review required | app/vayon/contacts/google/page.tsx |
| /vayon/dashboard | Choose what to do today | Composed component: runtime review required | app/vayon/dashboard/page.tsx |
| /vayon/creative-studio/calendar | Plan and complete follow-up | Composed component: runtime review required | app/vayon/creative-studio/calendar/page.tsx |
| /vayon/creative-studio/assistant | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/creative-studio/assistant/page.tsx |
| /vayon/creative/images | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/creative/images/page.tsx |
| /vayon/creative/[studio] | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/creative/[studio]/page.tsx |
| /vayon/creative/documents | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/creative/documents/page.tsx |
| /vayon/creative/videos | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/creative/videos/page.tsx |
| /vayon/communications/templates | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/communications/templates/page.tsx |
| /vayon/creative/cloud | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/creative/cloud/page.tsx |
| /vayon/creative/templates | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/creative/templates/page.tsx |
| /vayon/communications/teams | Complete the job named by this destination; confirm with its owner | }) | app/vayon/communications/teams/page.tsx |
| /vayon/creative/campaigns | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/creative/campaigns/page.tsx |
| /vayon/creative/runtime | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/creative/runtime/page.tsx |
| /vayon/communications/reports | Understand business performance | Composed component: runtime review required | app/vayon/communications/reports/page.tsx |
| /vayon/communications | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/communications/page.tsx |
| /vayon/creative/calendar | Plan and complete follow-up | Composed component: runtime review required | app/vayon/creative/calendar/page.tsx |
| /vayon/creative/runtime/execution | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/creative/runtime/execution/page.tsx |
| /vayon/communications/outlook | Complete the job named by this destination; confirm with its owner | ;
}) | app/vayon/communications/outlook/page.tsx |
| /vayon/creative/brand | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/creative/brand/page.tsx |
| /vayon/creative/pipelines | Move deals toward closing | Composed component: runtime review required | app/vayon/creative/pipelines/page.tsx |
| /vayon/creative | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/creative/page.tsx |
| /vayon/communications/notifications | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/communications/notifications/page.tsx |
| /vayon/creative/assets | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/creative/assets/page.tsx |
| /vayon/communications/inbox | Complete the job named by this destination; confirm with its owner | >;
}) | app/vayon/communications/inbox/page.tsx |
| /vayon/communications/conversations/[conversationId] | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/communications/conversations/[conversationId]/page.tsx |
| /vayon/communications/conversations | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/communications/conversations/page.tsx |
| /vayon/communications/connectors | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/communications/connectors/page.tsx |
| /vayon/communications/campaigns | Promote a property with the selected marketing tool | Composed component: runtime review required | app/vayon/communications/campaigns/page.tsx |
| /vayon/cognitive | Complete the job named by this destination; confirm with its owner | Composed component: runtime review required | app/vayon/cognitive/page.tsx |
