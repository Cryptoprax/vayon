# Navigation Map

Configured primary navigation: Dashboard ? CRM ? Marketing ? AI Assistant ? Reports ? Settings. Existing role/industry filters can hide unavailable groups; no access policy was changed. Primary links open the first permitted destination. Child destinations are shown only inside the active customer job. Advanced Creative tools appear after entering Creative Center; canonical compatibility pages reuse existing implementations.

## Dashboard

- Dashboard: `/vayon/dashboard`

## CRM

- Properties: `/vayon/properties`
- Leads: `/vayon/leads`
- Clients: `/vayon/crm/contacts`
- Companies: `/vayon/crm/companies`
- Deals: `/vayon/deals`
- Inbox: `/vayon/notifications`
- Calendar: `/vayon/calendar`
- Tasks: `/vayon/tasks`
- Timeline: `/vayon/timeline`
- Communications: `/vayon/communications`

## Marketing

- Campaigns: `/vayon/creative/campaigns`
- Creative Center: `/vayon/creative`
- Brand: `/vayon/creative/brand`
- Image: `/vayon/creative/images`
- Video: `/vayon/creative/videos`
- Document: `/vayon/creative/documents`
- Asset Library: `/vayon/creative/assets`
- Website: `/vayon/creative/landing-pages`
- Projects: `/vayon/creative-studio/packs`
- Templates: `/vayon/creative/templates`
- Publishing calendar: `/vayon/creative/calendar`
- Growth planning: `/vayon/growth`
- Lead Generation: `/vayon/growth/lead-generation`
- Buyer Intelligence: `/vayon/growth/buyer-intelligence`
- Seller Intelligence: `/vayon/growth/seller-intelligence`
- Property SEO: `/vayon/growth/property-seo`
- Referral Network: `/vayon/growth/referral-network`
- Market Intelligence: `/vayon/growth/market-intelligence`
- Creative Cloud: `/vayon/creative/cloud`
- Creative Pipelines: `/vayon/creative/pipelines`

## AI Assistant

- AI Assistant: `/vayon/intelligence`
- My AI Team: `/vayon/ai/workforce`
- Today's AI Work: `/vayon/ai/work-queue`
- Suggestions: `/vayon/ai/collaboration`
- Automations: `/vayon/ai/automations`
- Approvals: `/vayon/approvals`
- Goals: `/vayon/ai/goals`
- History: `/vayon/ai/history`
- Workflow templates: `/vayon/workflows`

## Reports

- Analytics: `/vayon/analytics`
- Performance: `/vayon/analytics/sales`
- Revenue & Forecasting: `/vayon/analytics/executive`
- Listing Performance: `/vayon/growth/listing-performance`
- Marketing Analytics: `/vayon/growth/marketing-analytics`
- Advertising Performance: `/vayon/growth/advertising-performance`
- Social Performance: `/vayon/growth/social-performance`
- Reports: `/vayon/growth/reports`

## Settings

- Workspace: `/vayon/settings/organization`
- Users: `/vayon/settings/members`
- Integrations: `/vayon/settings/integrations`
- Billing: `/vayon/settings/billing`
- Preferences: `/vayon/settings/appearance`
- Workflow Designer: `/platform/founder/workflows`
- Platform Analytics: `/platform/system-analytics`
- Investor Relations: `/vayon/growth/investor-relations`
- Platform Marketing: `/platform/founder/marketing`
- Product Intelligence: `/vayon/settings/product-intelligence`
- AI Playground: `/vayon/ai/playground`
- Feature Flags: `/platform/feature-flags`
- Enterprise Management: `/platform/organizations`
- Platform Settings: `/platform/settings`
- Founder Approval Center: `/vayon/founder/approvals`
- Customer Success: `/vayon/customer-success`
- Knowledge Engine: `/vayon/knowledge`
- Administration: `/vayon/admin`
- System Diagnostics: `/vayon/system`

## Route family ownership

Literal destination matching uses the longest path first, so Growth performance pages belong to Reports while Growth planning belongs to Marketing. Unlisted child routes inherit their family; they are not automatically added to the menu. Internal platform tools remain Settings-context destinations under their existing access restrictions.

| Product route | Home |
|---|---|
| /vayon/workforce | AI Assistant |
| /vayon/workflows/[workflowId] | AI Assistant |
| /vayon/workflows/runtime | AI Assistant |
| /vayon/workflows | AI Assistant |
| /vayon/whatsapp/templates | CRM |
| /vayon/whatsapp/settings | CRM |
| /vayon/whatsapp | CRM |
| /vayon/whatsapp/inbox | CRM |
| /vayon/whatsapp/conversations | CRM |
| /vayon/timeline | CRM |
| /vayon/team | CRM |
| /vayon/tasks | CRM |
| /vayon/system | Settings |
| /vayon/success-center | CRM |
| /vayon/storage | CRM |
| /vayon/calendar/week | CRM |
| /vayon/calendar/tasks | CRM |
| /vayon/calendar/site-visits | CRM |
| /vayon/calendar/reminders | CRM |
| /vayon/calendar | CRM |
| /vayon/calendar/outlook | CRM |
| /vayon/calendar/month | CRM |
| /vayon/calendar/meetings | CRM |
| /vayon/site-visits/[visitId] | CRM |
| /vayon/site-visits/reports | CRM |
| /vayon/site-visits | CRM |
| /vayon/site-visits/calendar | CRM |
| /vayon/calendar/google/settings | CRM |
| /vayon/calendar/google | CRM |
| /vayon/calendar/google/free-busy | CRM |
| /vayon/calendar/google/events | CRM |
| /vayon/calendar/google/calendars | CRM |
| /vayon/calendar/day | CRM |
| /vayon/settings/workspace | Settings |
| /vayon/calendar/agenda | CRM |
| /vayon/settings/users | Settings |
| /vayon/settings/usage | Settings |
| /vayon/settings/teams | Settings |
| /vayon/settings/subscription | Settings |
| /vayon/settings/security | Settings |
| /vayon/settings/roles | Settings |
| /vayon/settings/profile | Settings |
| /vayon/settings/product-intelligence | Settings |
| /vayon/settings/plans | Settings |
| /vayon/settings/permissions | Settings |
| /vayon/settings/payment-methods | Settings |
| /vayon/settings | Settings |
| /vayon/settings/organization | Settings |
| /vayon/settings/notifications | Settings |
| /vayon/settings/members | Settings |
| /vayon/settings/invoices/[invoiceId] | Settings |
| /vayon/settings/invoices | Settings |
| /vayon/settings/integrations | Settings |
| /vayon/settings/integrations/microsoft | Settings |
| /vayon/settings/integrations/google | Settings |
| /vayon/settings/integrations/data-import | Settings |
| /vayon/settings/google | Settings |
| /vayon/brain | CRM |
| /vayon/settings/email/templates | Settings |
| /vayon/settings/email/queue | Settings |
| /vayon/settings/email | Settings |
| /vayon/approvals/[approvalId] | AI Assistant |
| /vayon/approvals | AI Assistant |
| /vayon/settings/email/history | Settings |
| /vayon/settings/departments | Settings |
| /vayon/settings/configuration | Settings |
| /vayon/settings/billing/provider-health | Settings |
| /vayon/settings/billing | Settings |
| /vayon/settings/appearance | Settings |
| /vayon/analytics/workforce | Reports |
| /vayon/analytics/sales | Reports |
| /vayon/analytics/properties | Reports |
| /vayon/analytics | Reports |
| /vayon/analytics/executive | Reports |
| /vayon/analytics/deals | Reports |
| /vayon/analytics/crm | Reports |
| /vayon/analytics/conversion | Reports |
| /vayon/analytics/communications | Reports |
| /vayon/settings/ai/openai | Settings |
| /vayon/settings/activity | Settings |
| /vayon/runtime | CRM |
| /vayon/providers/[provider] | CRM |
| /vayon/providers | CRM |
| /vayon/property-matching/reports | CRM |
| /vayon/property-matching | CRM |
| /vayon/ai/workforce/[employeeId] | AI Assistant |
| /vayon/ai/workforce | AI Assistant |
| /vayon/property-matching/compare | CRM |
| /vayon/ai/work-queue | AI Assistant |
| /vayon/ai/tasks | AI Assistant |
| /vayon/ai/playground | Settings |
| /vayon/ai | AI Assistant |
| /vayon/ai/knowledge | AI Assistant |
| /vayon/ai/history | AI Assistant |
| /vayon/properties/[propertyId] | CRM |
| /vayon/ai/goals | AI Assistant |
| /vayon/properties/[propertyId]/edit | CRM |
| /vayon/ai/employees/[employeeId] | AI Assistant |
| /vayon/ai/employees | AI Assistant |
| /vayon/properties/projects/[projectId] | CRM |
| /vayon/properties/projects | CRM |
| /vayon/ai/collaboration | AI Assistant |
| /vayon/properties/price-lists | CRM |
| /vayon/properties | CRM |
| /vayon/properties/new | CRM |
| /vayon/properties/media | CRM |
| /vayon/ai/automations | AI Assistant |
| /vayon/properties/map | CRM |
| /vayon/properties/inventory | CRM |
| /vayon/properties/grid | CRM |
| /vayon/properties/documents | CRM |
| /vayon/properties/availability | CRM |
| /vayon/admin/workspaces | Settings |
| /vayon/properties/analytics | CRM |
| /vayon/admin/users | Settings |
| /vayon/admin/teams | Settings |
| /vayon/platform/launch-readiness | CRM |
| /vayon/admin/roles | Settings |
| /vayon/operations | CRM |
| /vayon/admin/permissions | Settings |
| /vayon/admin | Settings |
| /vayon/objects | CRM |
| /vayon/admin/organizations | Settings |
| /vayon/admin/departments | Settings |
| /vayon/admin/audit | Settings |
| /vayon/notifications/preferences | CRM |
| /vayon/notifications | CRM |
| /vayon/executions | CRM |
| /vayon/notifications/inbox | CRM |
| /vayon/events | CRM |
| /vayon/notifications/history | CRM |
| /vayon/events/history | CRM |
| /vayon/messages | CRM |
| /vayon/events/catalog | CRM |
| /vayon/meetings | CRM |
| /vayon/leads/[leadId] | CRM |
| /vayon/email/[messageId] | CRM |
| /vayon/leads/[leadId]/edit | CRM |
| /vayon/leads | CRM |
| /vayon/email/trash | CRM |
| /vayon/leads/new | CRM |
| /vayon/email/spam | CRM |
| /vayon/knowledge | Settings |
| /vayon/customer-success | Settings |
| /vayon/email/sent | CRM |
| /vayon/email | CRM |
| /vayon/knowledge/help | Settings |
| /vayon/intelligence | AI Assistant |
| /vayon/email/inbox | CRM |
| /vayon/crm | CRM |
| /vayon/home | CRM |
| /vayon/email/drafts | CRM |
| /vayon/crm/leads/[leadId] | CRM |
| /vayon/crm/leads | CRM |
| /vayon/growth/[section] | Marketing |
| /vayon/growth | Marketing |
| /vayon/email/archive | CRM |
| /vayon/crm/customers | CRM |
| /vayon/founder/approvals | Settings |
| /vayon/documents/onedrive | CRM |
| /vayon/crm/contacts/[contactId] | CRM |
| /vayon/crm/contacts | CRM |
| /vayon/follow-ups | CRM |
| /vayon/documents/drive | CRM |
| /vayon/crm/companies/[companyId] | CRM |
| /vayon/developers | CRM |
| /vayon/crm/companies/[companyId]/edit | CRM |
| /vayon/crm/companies | CRM |
| /vayon/crm/companies/new | CRM |
| /vayon/crm/activities | CRM |
| /vayon/deals/[dealId] | CRM |
| /vayon/deals/[dealId]/edit | CRM |
| /vayon/deals/pipeline | CRM |
| /vayon/deals | CRM |
| /vayon/creative-studio/wizard | Marketing |
| /vayon/deals/offers | CRM |
| /vayon/creative-studio/templates | Marketing |
| /vayon/creative-studio | Marketing |
| /vayon/deals/new | CRM |
| /vayon/creative-studio/packs | Marketing |
| /vayon/creative-studio/assets | Marketing |
| /vayon/deals/contracts | CRM |
| /vayon/creative-studio/growth | Marketing |
| /vayon/deals/checklists | CRM |
| /vayon/creative-studio/analytics | Marketing |
| /vayon/context | CRM |
| /vayon/contacts/microsoft | CRM |
| /vayon/deals/analytics | CRM |
| /vayon/creative-studio/editor/[assetId] | Marketing |
| /vayon/creative-studio/brand-kits | Marketing |
| /vayon/contacts/google | CRM |
| /vayon/dashboard | Dashboard |
| /vayon/creative-studio/calendar | Marketing |
| /vayon/creative-studio/assistant | Marketing |
| /vayon/creative/images | Marketing |
| /vayon/creative/[studio] | Marketing |
| /vayon/creative/documents | Marketing |
| /vayon/creative/videos | Marketing |
| /vayon/communications/templates | CRM |
| /vayon/creative/cloud | Marketing |
| /vayon/creative/templates | Marketing |
| /vayon/communications/teams | CRM |
| /vayon/creative/campaigns | Marketing |
| /vayon/creative/runtime | Marketing |
| /vayon/communications/reports | CRM |
| /vayon/communications | CRM |
| /vayon/creative/calendar | Marketing |
| /vayon/creative/runtime/execution | Marketing |
| /vayon/communications/outlook | CRM |
| /vayon/creative/brand | Marketing |
| /vayon/creative/pipelines | Marketing |
| /vayon/creative | Marketing |
| /vayon/communications/notifications | CRM |
| /vayon/creative/assets | Marketing |
| /vayon/communications/inbox | CRM |
| /vayon/communications/conversations/[conversationId] | CRM |
| /vayon/communications/conversations | CRM |
| /vayon/communications/connectors | CRM |
| /vayon/communications/campaigns | CRM |
| /vayon/cognitive | CRM |

## Discovery limits

Family ownership does not prove a route is linked from its parent page. Potentially undiscoverable routes are listed in PRODUCT_ARCHITECTURE_AUDIT.md. Legacy builder navigation remains available to builder consumers but is no longer rendered as the customer shell search catalog. No new sidebar or module dashboard was introduced.
