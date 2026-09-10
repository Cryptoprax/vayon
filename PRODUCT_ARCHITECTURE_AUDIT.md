# VAYON 3.0 Product Architecture Audit

Source audit: 2026-09-08. Scanned 2889 project files and 345 page files. Static references are discoverability evidence, not proof of usage. Dynamic pages and component-composed actions require runtime review. No page is deleted solely because it lacks a literal incoming link.

## Findings before reorganization

- Sidebar: ten groups with duplicate Dashboard, AI collaboration and Creative destinations. Advanced studios and individual AI employees exposed before the customer chooses a job.
- Search: live workspaces use static navigation only; four Aurora providers provide demo record search. Page catalog contains duplicate companies/map destinations and internal Brain/Cognitive/Runtime terms.
- Quick create: contacts and companies open Universal Objects; campaign opens Growth instead of Campaigns.
- Dashboard: ExecutiveCommandCenter, DailyBriefing, GettingStartedChecklist, AICommandBar, Executive Overview, RealEstateIntelligence, ContextualAIActions, AIWorkQueue, PipelineBoard, RevenueChartLoader, AIWorkforceGrid, CalendarWidget, ActivityTimeline, WhatsAppConversations, QuickActions. Multiple AI summaries and entry points compete.
- CRM contextual AI exists for property, lead, client and company. Deal context is missing. Preserve Sprint 218 command routing and action approval.
- Creative / creative-studio / creative-studio-2 and workforce / operational-workforce overlap by responsibility. Route aliases cannot safely be deleted until incoming consumers and permission contracts are verified.
- Website publication and full live enterprise search require capability verification; do not represent navigation matches as records.

## Changes and remaining findings

- One shell catalog now serves the sidebar, header search, and permission-filtered action menus. Six configured primary jobs; visible items still depend on existing role/industry policy.
- The existing builder catalog remains for builder consumers; it is no longer the customer shell search source. No foundational navigation configuration was deleted.
- Canonical creative Assets, Templates and Calendar pages now render the existing implementation. This breaks the pre-existing canonical/legacy redirect cycles without changing the existing redirect configuration.
- Existing compatibility redirects, internal-only tools and unreferenced pages are retained: reference count alone is insufficient evidence that deletion is safe.
- Creative, AI/workforce and settings access rules prevent all six groups and all suggested workflows from being available to every customer. These rules were not changed.
- Approval records are process-local in GovernanceService; indexing them as tenant records would be misleading. Approvals remain a page/action match.
- First task/team/campaign completion is not fully projected into the dashboard. Recent activity can show positive evidence; absence cannot establish non-completion.

## Module inventory

### CRM

- `/vayon/property-matching/reports`
- `/vayon/property-matching`
- `/vayon/property-matching/compare`
- `/vayon/properties/[propertyId]`
- `/vayon/properties/[propertyId]/edit`
- `/vayon/properties/projects/[projectId]`
- `/vayon/properties/projects`
- `/vayon/properties/price-lists`
- `/vayon/properties`
- `/vayon/properties/new`
- `/vayon/properties/media`
- `/vayon/properties/map`
- `/vayon/properties/inventory`
- `/vayon/properties/grid`
- `/vayon/properties/documents`
- `/vayon/properties/availability`
- `/vayon/properties/analytics`
- `/vayon/leads/[leadId]`
- `/vayon/leads/[leadId]/edit`
- `/vayon/leads`
- `/vayon/leads/new`
- `/vayon/crm`
- `/vayon/crm/leads/[leadId]`
- `/vayon/crm/leads`
- `/vayon/crm/customers`
- `/vayon/crm/contacts/[contactId]`
- `/vayon/crm/contacts`
- `/vayon/crm/companies/[companyId]`
- `/vayon/crm/companies/[companyId]/edit`
- `/vayon/crm/companies`
- `/vayon/crm/companies/new`
- `/vayon/crm/activities`
- `/vayon/deals/[dealId]`
- `/vayon/deals/[dealId]/edit`
- `/vayon/deals/pipeline`
- `/vayon/deals`
- `/vayon/deals/offers`
- `/vayon/deals/new`
- `/vayon/deals/contracts`
- `/vayon/deals/checklists`
- `/vayon/deals/analytics`

### Marketing and growth

- `/vayon/growth/[section]`
- `/vayon/growth`
- `/vayon/creative-studio/wizard`
- `/vayon/creative-studio/templates`
- `/vayon/creative-studio`
- `/vayon/creative-studio/packs`
- `/vayon/creative-studio/assets`
- `/vayon/creative-studio/growth`
- `/vayon/creative-studio/analytics`
- `/vayon/creative-studio/editor/[assetId]`
- `/vayon/creative-studio/brand-kits`
- `/vayon/creative-studio/calendar`
- `/vayon/creative-studio/assistant`
- `/vayon/creative/images`
- `/vayon/creative/[studio]`
- `/vayon/creative/documents`
- `/vayon/creative/videos`
- `/vayon/creative/cloud`
- `/vayon/creative/templates`
- `/vayon/creative/campaigns`
- `/vayon/creative/runtime`
- `/vayon/creative/calendar`
- `/vayon/creative/runtime/execution`
- `/vayon/creative/brand`
- `/vayon/creative/pipelines`
- `/vayon/creative`
- `/vayon/creative/assets`

### AI modules

- `/vayon/workforce`
- `/vayon/brain`
- `/vayon/runtime`
- `/vayon/ai/workforce/[employeeId]`
- `/vayon/ai/workforce`
- `/vayon/ai/work-queue`
- `/vayon/ai/tasks`
- `/vayon/ai/playground`
- `/vayon/ai`
- `/vayon/ai/knowledge`
- `/vayon/ai/history`
- `/vayon/ai/goals`
- `/vayon/ai/employees/[employeeId]`
- `/vayon/ai/employees`
- `/vayon/ai/collaboration`
- `/vayon/ai/automations`
- `/vayon/intelligence`
- `/vayon/context`
- `/vayon/cognitive`

### Reports

- `/vayon/analytics/workforce`
- `/vayon/analytics/sales`
- `/vayon/analytics/properties`
- `/vayon/analytics`
- `/vayon/analytics/executive`
- `/vayon/analytics/deals`
- `/vayon/analytics/crm`
- `/vayon/analytics/conversion`
- `/vayon/analytics/communications`

### Settings

- `/vayon/team`
- `/vayon/system`
- `/vayon/settings/workspace`
- `/vayon/settings/users`
- `/vayon/settings/usage`
- `/vayon/settings/teams`
- `/vayon/settings/subscription`
- `/vayon/settings/security`
- `/vayon/settings/roles`
- `/vayon/settings/profile`
- `/vayon/settings/product-intelligence`
- `/vayon/settings/plans`
- `/vayon/settings/permissions`
- `/vayon/settings/payment-methods`
- `/vayon/settings`
- `/vayon/settings/organization`
- `/vayon/settings/notifications`
- `/vayon/settings/members`
- `/vayon/settings/invoices/[invoiceId]`
- `/vayon/settings/invoices`
- `/vayon/settings/integrations`
- `/vayon/settings/integrations/microsoft`
- `/vayon/settings/integrations/google`
- `/vayon/settings/integrations/data-import`
- `/vayon/settings/google`
- `/vayon/settings/email/templates`
- `/vayon/settings/email/queue`
- `/vayon/settings/email`
- `/vayon/settings/email/history`
- `/vayon/settings/departments`
- `/vayon/settings/configuration`
- `/vayon/settings/billing/provider-health`
- `/vayon/settings/billing`
- `/vayon/settings/appearance`
- `/vayon/settings/ai/openai`
- `/vayon/settings/activity`
- `/vayon/admin/workspaces`
- `/vayon/admin/users`
- `/vayon/admin/teams`
- `/vayon/admin/roles`
- `/vayon/admin/permissions`
- `/vayon/admin`
- `/vayon/admin/organizations`
- `/vayon/admin/departments`
- `/vayon/admin/audit`

## Full route and workflow source inventory

All page sources were scanned. Components listed below identify where actions are composed; entries marked runtime review are not certified as one-primary-action screens.

| Route | Source | Incoming literals | Redirect | Composed UI / primary-action review |
|---|---|---:|---|---|
| /verify-email | app/verify-email/page.tsx | 1 | ? | AuthShell, ButtonLink |
| /vayon/workforce | app/vayon/workforce/page.tsx | 5 | ? | WorkforceShell, AuroraAdvisorPanel |
| /vayon/workflows/[workflowId] | app/vayon/workflows/[workflowId]/page.tsx | 0 | ? | GovernanceHeader, GovernanceNav, WorkflowDetail |
| /vayon/workflows/runtime | app/vayon/workflows/runtime/page.tsx | 5 | ? | WorkflowMonitoringDashboard |
| /vayon/workflows | app/vayon/workflows/page.tsx | 17 | ? | WorkflowOrchestrator, Link, Link, WorkflowAutomationDashboard, WorkflowDesigner |
| /vayon/whatsapp/templates | app/vayon/whatsapp/templates/page.tsx | 1 | ? | WhatsAppTemplates |
| /vayon/whatsapp/settings | app/vayon/whatsapp/settings/page.tsx | 6 | ? | WhatsAppSettings |
| /vayon/whatsapp | app/vayon/whatsapp/page.tsx | 3 | ? | WhatsAppInbox |
| /vayon/whatsapp/inbox | app/vayon/whatsapp/inbox/page.tsx | 2 | ? | Query, WhatsAppInbox |
| /vayon/whatsapp/conversations | app/vayon/whatsapp/conversations/page.tsx | 1 | ? | WhatsAppConversation, WhatsAppInbox |
| /vayon/timeline | app/vayon/timeline/page.tsx | 4 | ? | TimelineExperience, TimelineDashboard |
| /vayon/team | app/vayon/team/page.tsx | 5 | /vayon/settings/members | Composed component: runtime review required |
| /vayon/tasks | app/vayon/tasks/page.tsx | 19 | ? | OperationsHeader, TaskForm, TaskList |
| /vayon/system | app/vayon/system/page.tsx | 2 | ? | SystemDiagnosticsView |
| /vayon/success-center | app/vayon/success-center/page.tsx | 3 | ? | Link, Link |
| /vayon/storage | app/vayon/storage/page.tsx | 4 | ? | StorageManager, ImageUploader, ImageUploader, DocumentUploader, DocumentUploader, DocumentUploader |
| /forgot-password | app/forgot-password/page.tsx | 3 | ? | AuthShell, FormNotice, AuthFields |
| /vayon/calendar/week | app/vayon/calendar/week/page.tsx | 1 | ? | CalendarViewRoute |
| /demo | app/demo/page.tsx | 14 | ? | MarketingCurrencyProvider, MarketingAnalytics, ConsentManager, DemoExperience |
| /vayon/calendar/tasks | app/vayon/calendar/tasks/page.tsx | 1 | ? | CalendarEntityRoute |
| /vayon/calendar/site-visits | app/vayon/calendar/site-visits/page.tsx | 2 | ? | CalendarEntityRoute |
| /vayon/calendar/reminders | app/vayon/calendar/reminders/page.tsx | 1 | ? | CalendarEntityRoute |
| /vayon/calendar | app/vayon/calendar/page.tsx | 19 | ? | OperationsHeader, CalendarProductionControls, CalendarBoard, GoogleCalendarWorkspace |
| /vayon/calendar/outlook | app/vayon/calendar/outlook/page.tsx | 5 | ? | ReturnType, ReturnType, MicrosoftCapabilityShell, Button |
| /vayon/calendar/month | app/vayon/calendar/month/page.tsx | 1 | ? | CalendarViewRoute |
| /vayon/calendar/meetings | app/vayon/calendar/meetings/page.tsx | 3 | ? | CalendarEntityRoute |
| /vayon/site-visits/[visitId] | app/vayon/site-visits/[visitId]/page.tsx | 0 | ? | VisitHeader, VisitDetail |
| /vayon/site-visits/reports | app/vayon/site-visits/reports/page.tsx | 1 | ? | VisitHeader, VisitReports |
| /vayon/site-visits | app/vayon/site-visits/page.tsx | 7 | ? | VisitHeader, VisitDashboard, VisitForm, AgentBoard, VisitList |
| /vayon/site-visits/calendar | app/vayon/site-visits/calendar/page.tsx | 0 | ? | VisitHeader, VisitCalendar |
| /vayon/calendar/google/settings | app/vayon/calendar/google/settings/page.tsx | 2 | ? | GoogleCalendarWorkspace |
| /vayon/calendar/google | app/vayon/calendar/google/page.tsx | 0 | ? | GoogleCalendarWorkspace |
| /vayon/calendar/google/free-busy | app/vayon/calendar/google/free-busy/page.tsx | 0 | ? | GoogleCalendarWorkspace |
| /vayon/calendar/google/events | app/vayon/calendar/google/events/page.tsx | 1 | ? | GoogleCalendarEventDetail, GoogleCalendarWorkspace |
| /accept-invitation | app/accept-invitation/page.tsx | 0 | ? | Button |
| /vayon/calendar/google/calendars | app/vayon/calendar/google/calendars/page.tsx | 0 | ? | GoogleCalendarWorkspace |
| /vayon/calendar/day | app/vayon/calendar/day/page.tsx | 1 | ? | CalendarViewRoute |
| /vayon/settings/workspace | app/vayon/settings/workspace/page.tsx | 1 | ? | SettingsShell, TenantSettingsPanel |
| /vayon/calendar/agenda | app/vayon/calendar/agenda/page.tsx | 1 | ? | CalendarViewRoute |
| /vayon/settings/users | app/vayon/settings/users/page.tsx | 2 | ? | OrganizationHeader, EnterpriseUserDirectory |
| /vayon/settings/usage | app/vayon/settings/usage/page.tsx | 1 | ? | BillingHeader, UsageCharts |
| /workflows | app/(marketing)/workflows/page.tsx | 3 | ? | MarketingPage |
| /vayon/settings/teams | app/vayon/settings/teams/page.tsx | 3 | ? | OrganizationHeader, TeamsManagement |
| /trust-center | app/(marketing)/trust-center/page.tsx | 4 | ? | PublicContentPage |
| /vayon/settings/subscription | app/vayon/settings/subscription/page.tsx | 6 | ? | BillingHeader, SubscriptionStatus, SubscriptionLifecycle, PaddlePlanGrid |
| /vayon/settings/security | app/vayon/settings/security/page.tsx | 2 | ? | SettingsShell, IdentitySecurityDashboard |
| /trademark-policy | app/(marketing)/trademark-policy/page.tsx | 1 | ? | LegalPolicyPage |
| /vayon/settings/roles | app/vayon/settings/roles/page.tsx | 1 | ? | OrganizationHeader, RolesView |
| /terms | app/(marketing)/terms/page.tsx | 4 | ? | LegalPolicyPage |
| /support-policy | app/(marketing)/support-policy/page.tsx | 4 | ? | LegalPolicyPage |
| /subprocessors | app/(marketing)/subprocessors/page.tsx | 1 | ? | LegalPolicyPage |
| /status | app/(marketing)/status/page.tsx | 4 | ? | LaunchInformationPage |
| /solutions/[slug] | app/(marketing)/solutions/[slug]/page.tsx | 0 | ? | Metadata, CommercialCatalogDetail |
| /solutions | app/(marketing)/solutions/page.tsx | 4 | ? | CommercialCatalogIndex |
| /security | app/(marketing)/security/page.tsx | 5 | ? | MarketingPage |
| /search | app/(marketing)/search/page.tsx | 3 | ? | Button, Link |
| /sales-assets/[slug] | app/(marketing)/sales-assets/[slug]/page.tsx | 0 | ? | Metadata, SalesAssetPage |
| /sales-assets | app/(marketing)/sales-assets/page.tsx | 1 | ? | CatalogGrid |
| /roi-calculator | app/(marketing)/roi-calculator/page.tsx | 5 | ? | RoiCalculator |
| /resources | app/(marketing)/resources/page.tsx | 5 | ? | MarketingPage |
| /release-notes | app/(marketing)/release-notes/page.tsx | 3 | ? | LaunchInformationPage |
| /refund-policy | app/(marketing)/refund-policy/page.tsx | 3 | ? | LegalPolicyPage |
| /vayon/settings/profile | app/vayon/settings/profile/page.tsx | 2 | ? | SettingsShell, ProfileSettings |
| /properties | app/(marketing)/properties/page.tsx | 2 | ? | MarketingPage |
| /product | app/(marketing)/product/page.tsx | 3 | ? | MarketingPage |
| /privacy | app/(marketing)/privacy/page.tsx | 4 | ? | LegalPolicyPage |
| /pricing | app/(marketing)/pricing/page.tsx | 6 | ? | MarketingPage |
| /vayon/settings/product-intelligence | app/vayon/settings/product-intelligence/page.tsx | 8 | ? | ProductIntelligenceDashboard, ContinuousLearningDashboard |
| /press-kit | app/(marketing)/press-kit/page.tsx | 1 | ? | LaunchInformationPage |
| /vayon/settings/plans | app/vayon/settings/plans/page.tsx | 1 | ? | BillingHeader, StripePlanGrid |
| /vayon/settings/permissions | app/vayon/settings/permissions/page.tsx | 2 | ? | OrganizationHeader, PermissionMatrix |
| /vayon/settings/payment-methods | app/vayon/settings/payment-methods/page.tsx | 1 | ? | BillingHeader, PaymentMethodList |
| /vayon/settings | app/vayon/settings/page.tsx | 2 | ? | SettingsShell, Link, Link |
| /vayon/settings/organization | app/vayon/settings/organization/page.tsx | 10 | ? | OrganizationHeader, OrganizationSettingsForm |
| /vayon/settings/notifications | app/vayon/settings/notifications/page.tsx | 2 | ? | SettingsShell, ButtonLink |
| /vayon/settings/members | app/vayon/settings/members/page.tsx | 9 | ? | OrganizationHeader, MembersManagement |
| /vayon/settings/invoices/[invoiceId] | app/vayon/settings/invoices/[invoiceId]/page.tsx | 0 | ? | BillingHeader |
| /vayon/settings/invoices | app/vayon/settings/invoices/page.tsx | 5 | ? | BillingHeader, InvoiceTable |
| /partners | app/(marketing)/partners/page.tsx | 3 | ? | LaunchInformationPage |
| /media-kit | app/(marketing)/media-kit/page.tsx | 3 | ? | AssetGrid, AssetGrid, Link, Image |
| /investors | app/(marketing)/investors/page.tsx | 3 | ? | CatalogGrid |
| /vayon/settings/integrations | app/vayon/settings/integrations/page.tsx | 16 | ? | ButtonLink, IntegrationCenter |
| /integrations | app/(marketing)/integrations/page.tsx | 4 | ? | MarketingPage |
| /vayon/settings/integrations/microsoft | app/vayon/settings/integrations/microsoft/page.tsx | 4 | ? | MicrosoftIdentityDashboard |
| /vayon/settings/integrations/google | app/vayon/settings/integrations/google/page.tsx | 5 | ? | GoogleIdentityDashboard |
| /vayon/settings/integrations/data-import | app/vayon/settings/integrations/data-import/page.tsx | 6 | ? | DataImportWorkspace |
| /vayon/settings/google | app/vayon/settings/google/page.tsx | 3 | ? | SettingsShell, GoogleSettings |
| /industries/[slug] | app/(marketing)/industries/[slug]/page.tsx | 0 | ? | Metadata, CommercialCatalogDetail |
| /industries | app/(marketing)/industries/page.tsx | 1 | ? | CommercialCatalogIndex |
| /vayon/brain | app/vayon/brain/page.tsx | 3 | ? | BrainDashboard |
| /vayon/settings/email/templates | app/vayon/settings/email/templates/page.tsx | 2 | ? | EmailCenter |
| /vayon/settings/email/queue | app/vayon/settings/email/queue/page.tsx | 2 | ? | EmailCenter |
| /vayon/settings/email | app/vayon/settings/email/page.tsx | 4 | ? | EmailCenter |
| /vayon/approvals/[approvalId] | app/vayon/approvals/[approvalId]/page.tsx | 0 | ? | GovernanceHeader, GovernanceNav, ApprovalDetail |
| /vayon/approvals | app/vayon/approvals/page.tsx | 18 | ? | GovernanceHeader, ApprovalList |
| /vayon/settings/email/history | app/vayon/settings/email/history/page.tsx | 2 | ? | EmailCenter |
| /vayon/settings/departments | app/vayon/settings/departments/page.tsx | 3 | ? | OrganizationHeader, DepartmentsManagement |
| /vayon/settings/configuration | app/vayon/settings/configuration/page.tsx | 3 | ? | SimpleConfigurationIntro, ConfigurationEngine |
| /vayon/settings/billing/provider-health | app/vayon/settings/billing/provider-health/page.tsx | 4 | ? | BillingHeader, ProviderHealthGrid |
| /vayon/settings/billing | app/vayon/settings/billing/page.tsx | 12 | ? | BillingHeader, BillingRecoveryState, SubscriptionStatus, CommercialPlans, Link, Link, PaddlePortalButton, Link, Link, Link, BillingContactForm, Details |
| /vayon/settings/appearance | app/vayon/settings/appearance/page.tsx | 3 | ? | Palette, AppearanceSettings |
| /vayon/analytics/workforce | app/vayon/analytics/workforce/page.tsx | 1 | ? | AnalyticsRoute |
| /vayon/analytics/sales | app/vayon/analytics/sales/page.tsx | 6 | ? | AnalyticsRoute |
| /vayon/analytics/properties | app/vayon/analytics/properties/page.tsx | 1 | ? | AnalyticsRoute |
| /vayon/analytics | app/vayon/analytics/page.tsx | 9 | ? | AnalyticsRoute |
| /vayon/analytics/executive | app/vayon/analytics/executive/page.tsx | 3 | ? | AnalyticsHeader, ExecutiveBI |
| /vayon/analytics/deals | app/vayon/analytics/deals/page.tsx | 1 | ? | AnalyticsRoute |
| /vayon/analytics/crm | app/vayon/analytics/crm/page.tsx | 1 | ? | AnalyticsRoute |
| /vayon/analytics/conversion | app/vayon/analytics/conversion/page.tsx | 2 | ? | EnterpriseAnalyticsDashboard |
| /reset-password | app/reset-password/page.tsx | 2 | ? | AuthShell, FormNotice, AuthFields |
| /vayon/analytics/communications | app/vayon/analytics/communications/page.tsx | 1 | ? | AnalyticsRoute |
| /vayon/settings/ai/openai | app/vayon/settings/ai/openai/page.tsx | 3 | ? | OpenAISettings |
| /vayon/settings/activity | app/vayon/settings/activity/page.tsx | 1 | ? | OrganizationHeader, ActivityLog |
| /vayon/runtime | app/vayon/runtime/page.tsx | 4 | ? | RuntimeDashboard |
| /vayon/providers/[provider] | app/vayon/providers/[provider]/page.tsx | 0 | ? | ProviderDetail |
| /vayon/providers | app/vayon/providers/page.tsx | 2 | ? | ProviderInventory |
| /vayon/property-matching/reports | app/vayon/property-matching/reports/page.tsx | 1 | ? | MatchingHeader, MatchingMetrics, MatchingReports |
| /vayon/property-matching | app/vayon/property-matching/page.tsx | 4 | ? | MatchingHeader, MatchingMetrics, GovernanceNote, MatchCards |
| /vayon/ai/workforce/[employeeId] | app/vayon/ai/workforce/[employeeId]/page.tsx | 0 | ? | WorkforceShell, SalesAIDashboard, DavidFinanceManagerDashboard, CRMAIDashboard, WhatsAppAIDashboard, EmmaMarketingManagerDashboard, MarketingAIDashboard, ExecutiveAIDashboard, ExecutiveCollaborationDashboard, AlexOperationsManagerDashboard, OliviaCustomerSuccessManagerDashboard, EmployeeDailyWorkspace, EmployeeIdentityPanel, EmployeeProfile, EmployeeHeadquartersSecondary, EmployeeMemoryPanel, EmployeeCollaborationPanel, WorkforceChatPanel |
| /vayon/ai/workforce | app/vayon/ai/workforce/page.tsx | 10 | ? | WorkforceShell, WorkforceDirectory, ContextualSetupState |
| /vayon/property-matching/compare | app/vayon/property-matching/compare/page.tsx | 1 | ? | MatchingHeader, Comparison, GovernanceNote |
| /vayon/ai/work-queue | app/vayon/ai/work-queue/page.tsx | 3 | ? | WorkforceShell, AIWorkQueue, EmployeeActivity |
| /vayon/ai/tasks | app/vayon/ai/tasks/page.tsx | 6 | ? | WorkforceShell, TaskList |
| /vayon/ai/playground | app/vayon/ai/playground/page.tsx | 3 | ? | AIRuntimeHeader, PromptLibrary |
| /vayon/ai | app/vayon/ai/page.tsx | 15 | ? | WorkforceShell, CommandCenter |
| /vayon/ai/knowledge | app/vayon/ai/knowledge/page.tsx | 1 | /vayon/knowledge | Composed component: runtime review required |
| /vayon/ai/history | app/vayon/ai/history/page.tsx | 3 | ? | WorkforceShell, ActivityList |
| /vayon/properties/[propertyId] | app/vayon/properties/[propertyId]/page.tsx | 0 | ? | PropertyCrmSummary, WorkspaceRenderer, RealEstateSignalGrid, ContextualRealEstateRecommendations, ContextualAIActions, EntityCollaboration |
| /vayon/ai/goals | app/vayon/ai/goals/page.tsx | 1 | ? | WorkforceShell, GoalsAndStrategy |
| /vayon/properties/[propertyId]/edit | app/vayon/properties/[propertyId]/edit/page.tsx | 0 | ? | PropertyWizard |
| /vayon/ai/employees/[employeeId] | app/vayon/ai/employees/[employeeId]/page.tsx | 0 | ? | Composed component: runtime review required |
| /vayon/ai/employees | app/vayon/ai/employees/page.tsx | 5 | ? | AIHeader, ProviderHealth, WorkforceDirectory |
| /vayon/properties/projects/[projectId] | app/vayon/properties/projects/[projectId]/page.tsx | 0 | ? | InventoryHeader, ProjectDetail |
| /vayon/properties/projects | app/vayon/properties/projects/page.tsx | 5 | ? | InventoryHeader, InventoryDashboard, ProjectGrid, InventoryUtilities |
| /vayon/ai/collaboration | app/vayon/ai/collaboration/page.tsx | 6 | ? | WorkforceShell, ExecutiveCollaborationBoard, AICompanyOrchestrationCenter |
| /vayon/properties/price-lists | app/vayon/properties/price-lists/page.tsx | 1 | ? | InventoryHeader, PriceHistory |
| /vayon/properties | app/vayon/properties/page.tsx | 22 | ? | Record, Download, ButtonLink, Plus, PropertyDashboard, Link, Link, PropertyToolbar, Sparkles, PropertyCard, Button, PropertyTable, Link, Link, ImportCenter |
| /vayon/properties/new | app/vayon/properties/new/page.tsx | 14 | /vayon/properties?error=You%20do%20not%20have%20permission. | PropertyForm |
| /platform/workspaces | app/platform/workspaces/page.tsx | 1 | ? | PageContainer, PageHeader, WorkspaceGrid |
| /vayon/properties/media | app/vayon/properties/media/page.tsx | 1 | ? | InventoryHeader, MediaLibrary |
| /vayon/ai/automations | app/vayon/ai/automations/page.tsx | 1 | ? | WorkforceShell, AutomationRules |
| /vayon/properties/map | app/vayon/properties/map/page.tsx | 2 | ? | PropertyPlatformRoute |
| /vayon/properties/inventory | app/vayon/properties/inventory/page.tsx | 5 | ? | Record, InventoryHeader, InventoryFiltersForm, UnitTable, InventoryUtilities |
| /platform/users | app/platform/users/page.tsx | 2 | ? | PageContainer, PageHeader, UserTable |
| /vayon/properties/grid | app/vayon/properties/grid/page.tsx | 1 | ? | PropertyPlatformRoute |
| /vayon/properties/documents | app/vayon/properties/documents/page.tsx | 1 | ? | PropertyPlatformRoute |
| /vayon/properties/availability | app/vayon/properties/availability/page.tsx | 1 | ? | PropertyPlatformRoute |
| /vayon/admin/workspaces | app/vayon/admin/workspaces/page.tsx | 1 | ? | AdminRoute |
| /vayon/properties/analytics | app/vayon/properties/analytics/page.tsx | 2 | ? | PropertyPlatformRoute |
| /vayon/admin/users | app/vayon/admin/users/page.tsx | 1 | ? | AdminRoute |
| /vayon/admin/teams | app/vayon/admin/teams/page.tsx | 1 | ? | AdminRoute |
| /vayon/platform/launch-readiness | app/vayon/platform/launch-readiness/page.tsx | 2 | ? | LaunchReadinessDashboard |
| /vayon | app/vayon/page.tsx | 11 | /login | Composed component: runtime review required |
| /platform/themes | app/platform/themes/page.tsx | 1 | ? | PageLayout, ThemeManager |
| /vayon/admin/roles | app/vayon/admin/roles/page.tsx | 1 | ? | AdminRoute |
| /vayon/operations | app/vayon/operations/page.tsx | 3 | ? | OperationsHeader, OperationsDashboard |
| /platform/system-analytics | app/platform/system-analytics/page.tsx | 2 | ? | PlatformHeader, AnalyticsWidget |
| /vayon/admin/permissions | app/vayon/admin/permissions/page.tsx | 1 | ? | AdminRoute |
| /vayon/admin | app/vayon/admin/page.tsx | 4 | ? | AdminRoute |
| /vayon/objects | app/vayon/objects/page.tsx | 2 | ? | UniversalObjectsWorkbench |
| /platform/support | app/platform/support/page.tsx | 3 | ? | SupportSessionBanner, PlatformHeader, Button, SupportList, SupportActions |
| /vayon/admin/organizations | app/vayon/admin/organizations/page.tsx | 1 | ? | AdminRoute |
| /platform/settings | app/platform/settings/page.tsx | 2 | ? | PageLayout, SettingsPlatform |
| /vayon/admin/departments | app/vayon/admin/departments/page.tsx | 1 | ? | AdminRoute |
| /vayon/admin/audit | app/vayon/admin/audit/page.tsx | 1 | ? | AdminRoute |
| /platform/security-review | app/platform/security-review/page.tsx | 0 | ? | SecurityReviewDashboard |
| /help | app/(marketing)/help/page.tsx | 5 | ? | LaunchInformationPage |
| /signup | app/signup/page.tsx | 10 | ? | AuthShell, FormNotice, Button, AuthFields, Link |
| /platform/search | app/platform/search/page.tsx | 1 | ? | PageLayout, UniversalSearch |
| /vayon/notifications/preferences | app/vayon/notifications/preferences/page.tsx | 2 | ? | NotificationPreferences |
| /vayon/notifications | app/vayon/notifications/page.tsx | 6 | ? | Record, NotificationCenter |
| /vayon/executions | app/vayon/executions/page.tsx | 1 | ? | GovernanceHeader, GovernanceNav, ExecutionList |
| /platform/roles | app/platform/roles/page.tsx | 1 | ? | PageContainer, PageHeader, RoleTable |
| /vayon/notifications/inbox | app/vayon/notifications/inbox/page.tsx | 3 | /vayon/notifications?view=all | Composed component: runtime review required |
| /features/[slug] | app/(marketing)/features/[slug]/page.tsx | 0 | ? | Metadata, CommercialCatalogDetail |
| /features | app/(marketing)/features/page.tsx | 4 | ? | ProductCatalog |
| /platform/feature-flags | app/platform/feature-flags/page.tsx | 3 | ? | PlatformHeader, Button, FeatureFlagCard |
| /vayon/events | app/vayon/events/page.tsx | 1 | ? | EventRoute |
| /platform/releases | app/platform/releases/page.tsx | 2 | ? | PlatformHeader, Button, ReleaseCard |
| /vayon/notifications/history | app/vayon/notifications/history/page.tsx | 2 | /vayon/notifications?view=archived | Composed component: runtime review required |
| /enterprise | app/(marketing)/enterprise/page.tsx | 2 | ? | MarketingPage |
| /platform/deployment | app/platform/deployment/page.tsx | 0 | ? | DeploymentDashboard |
| /vayon/events/history | app/vayon/events/history/page.tsx | 1 | ? | EventRoute |
| /platform/region-management | app/platform/region-management/page.tsx | 0 | ? | PlatformHeader, RegionCard |
| /vayon/messages | app/vayon/messages/page.tsx | 1 | ? | CommunicationHeader, CommunicationFilters, ConversationList, ConversationTimeline, CallForm, CallList, NoteForm |
| /vayon/events/catalog | app/vayon/events/catalog/page.tsx | 1 | ? | EventRoute |
| /platform/platform-health | app/platform/platform-health/page.tsx | 2 | ? | PlatformHeader, AnalyticsWidget |
| /vayon/meetings | app/vayon/meetings/page.tsx | 7 | ? | OperationsHeader, MeetingForm, MeetingList |
| /platform/customers/[organizationId] | app/platform/customers/[organizationId]/page.tsx | 0 | ? | PlatformHeader, CustomerProfile, CustomerTimeline |
| /platform/customers | app/platform/customers/page.tsx | 3 | ? | PlatformHeader, CustomerDirectory |
| /docs/[slug] | app/(marketing)/docs/[slug]/page.tsx | 0 | ? | Metadata, DocumentationArticleView |
| /docs | app/(marketing)/docs/page.tsx | 17 | ? | DocumentationHome |
| /platform/permissions | app/platform/permissions/page.tsx | 1 | ? | PageContainer, PageHeader, PermissionGroups |
| /platform/customer-success | app/platform/customer-success/page.tsx | 3 | ? | PlatformHeader, HealthCard |
| /developers | app/(marketing)/developers/page.tsx | 6 | ? | DeveloperPortal |
| /platform/performance | app/platform/performance/page.tsx | 1 | ? | PerformanceDashboard, Suspense, Loading, Report |
| /platform | app/platform/page.tsx | 4 | ? | Breadcrumbs |
| /vayon/leads/[leadId] | app/vayon/leads/[leadId]/page.tsx | 0 | ? | WorkspaceRenderer, RealEstateSignalGrid, ContextualRealEstateRecommendations, ContextualAIActions, EntityCollaboration |
| /platform/country-management | app/platform/country-management/page.tsx | 0 | ? | PlatformHeader, CountryCard |
| /vayon/email/[messageId] | app/vayon/email/[messageId]/page.tsx | 0 | ? | ButtonLink, Button, ButtonLink, EmailComposer |
| /deals | app/(marketing)/deals/page.tsx | 2 | ? | MarketingPage |
| /platform/organizations | app/platform/organizations/page.tsx | 5 | ? | PageContainer, PageHeader, OrganizationTable |
| /vayon/leads/[leadId]/edit | app/vayon/leads/[leadId]/edit/page.tsx | 0 | ? | LeadWizard |
| /vayon/leads | app/vayon/leads/page.tsx | 15 | ? | Record, LeadToolbar, ButtonLink, ButtonLink, LeadCard, Button, LeadTable |
| /platform/command-center | app/platform/command-center/page.tsx | 0 | ? | PageLayout, CommandCenter |
| /vayon/email/trash | app/vayon/email/trash/page.tsx | 0 | ? | GmailMailboxPage |
| /data-processing-addendum | app/(marketing)/data-processing-addendum/page.tsx | 3 | ? | LegalPolicyPage |
| /platform/operations | app/platform/operations/page.tsx | 1 | ? | OperationsDashboard |
| /vayon/leads/new | app/vayon/leads/new/page.tsx | 16 | /vayon/leads?error=Insufficient%20permission | LeadWizard |
| /data-ownership | app/(marketing)/data-ownership/page.tsx | 0 | ? | LaunchInformationPage |
| /platform/notifications | app/platform/notifications/page.tsx | 1 | ? | PageLayout, NotificationPlatform |
| /vayon/email/spam | app/vayon/email/spam/page.tsx | 0 | ? | GmailMailboxPage |
| /platform/launch-readiness | app/platform/launch-readiness/page.tsx | 2 | /vayon/platform/launch-readiness | Composed component: runtime review required |
| /vayon/knowledge | app/vayon/knowledge/page.tsx | 13 | ? | KnowledgeRecovery, KnowledgeCenter |
| /customers/[slug] | app/(marketing)/customers/[slug]/page.tsx | 0 | ? | Metadata, CustomerStoryPage |
| /customers | app/(marketing)/customers/page.tsx | 4 | ? | CatalogGrid |
| /vayon/customer-success | app/vayon/customer-success/page.tsx | 5 | /login?next=/vayon/customer-success | CustomerSuccessWorkspace |
| /platform/integrations/webhooks | app/platform/integrations/webhooks/page.tsx | 3 | ? | ProviderHeader, WebhookTable |
| /vayon/email/sent | app/vayon/email/sent/page.tsx | 0 | ? | GmailMailboxPage |
| /vayon/email | app/vayon/email/page.tsx | 6 | ? | GmailMailboxPage |
| /platform/builder/settings | app/platform/builder/settings/page.tsx | 2 | ? | BuilderPage, SettingsGrid |
| /platform/builder | app/platform/builder/page.tsx | 1 | ? | BuilderPage, MetricCard, MetricCard, MetricCard, MetricCard, MetricCard, MetricCard, MetricCard, MetricCard, MetricCard, MetricCard, MetricCard |
| /vayon/knowledge/help | app/vayon/knowledge/help/page.tsx | 9 | ? | Link, Button, Link, Link, Link, Link, Button, Link, Link |
| /crm | app/(marketing)/crm/page.tsx | 2 | ? | MarketingPage |
| /platform/integrations/secrets | app/platform/integrations/secrets/page.tsx | 1 | ? | ProviderHeader, SecretsTable |
| /vayon/intelligence | app/vayon/intelligence/page.tsx | 9 | ? | IntelligenceDashboard |
| /platform/builder/navigation | app/platform/builder/navigation/page.tsx | 2 | ? | BuilderPage, NavigationCanvas |
| /copyright-policy | app/(marketing)/copyright-policy/page.tsx | 1 | ? | LegalPolicyPage |
| /vayon/email/inbox | app/vayon/email/inbox/page.tsx | 1 | ? | GmailMailboxPage |
| /vayon/crm | app/vayon/crm/page.tsx | 9 | ? | CrmShell, ButtonLink, SalesAutomationSummary, SalesCommandCenter, CrmDashboard |
| /platform/integrations/providers | app/platform/integrations/providers/page.tsx | 1 | ? | ProviderHeader, OpenAIMetrics, ProviderGrid, ProviderConfiguration |
| /platform/integrations | app/platform/integrations/page.tsx | 2 | ? | ProviderHeader, IntegrationDashboard |
| /vayon/home | app/vayon/home/page.tsx | 3 | ? | Record |
| /cookie-policy | app/(marketing)/cookie-policy/page.tsx | 3 | ? | LegalPolicyPage |
| /platform/builder/modules | app/platform/builder/modules/page.tsx | 2 | ? | BuilderPage, ModuleGrid |
| /vayon/email/drafts | app/vayon/email/drafts/page.tsx | 0 | ? | GmailMailboxPage |
| /platform/integrations/logs | app/platform/integrations/logs/page.tsx | 2 | ? | ProviderHeader, ProviderLogs |
| /platform/builder/features | app/platform/builder/features/page.tsx | 2 | ? | BuilderPage, FeatureGrid |
| /contact | app/(marketing)/contact/page.tsx | 19 | ? | LeadCapture |
| /vayon/crm/leads/[leadId] | app/vayon/crm/leads/[leadId]/page.tsx | 0 | ? | CrmShell, CrmLeadProfileView |
| /vayon/crm/leads | app/vayon/crm/leads/page.tsx | 2 | ? | Record, CrmShell, ButtonLink, Button, CrmLeadTable |
| /platform/integrations/health | app/platform/integrations/health/page.tsx | 4 | ? | ProviderHeader, HealthCard, RetryQueue, SyncTimeline |
| /vayon/growth/[section] | app/vayon/growth/[section]/page.tsx | 0 | ? | GrowthSectionPage |
| /vayon/growth | app/vayon/growth/page.tsx | 9 | ? | GrowthOverview |
| /platform/builder/branding | app/platform/builder/branding/page.tsx | 2 | ? | BuilderPage, BrandPreview |
| /vayon/email/archive | app/vayon/email/archive/page.tsx | 0 | ? | GmailMailboxPage |
| /vayon/crm/customers | app/vayon/crm/customers/page.tsx | 1 | ? | Record, CrmShell, CustomerDirectory |
| /platform/identity | app/platform/identity/page.tsx | 1 | ? | PageContainer, PageHeader, IdentityDashboard |
| /platform/builder/applications | app/platform/builder/applications/page.tsx | 2 | ? | BuilderPage, MetricCard, MetricCard, MetricCard, MetricCard |
| /compare/[slug] | app/(marketing)/compare/[slug]/page.tsx | 0 | ? | Metadata, ComparisonLanding |
| /compare | app/(marketing)/compare/page.tsx | 1 | ? | CatalogGrid |
| /vayon/founder/approvals | app/vayon/founder/approvals/page.tsx | 2 | ? | FounderApprovalCenter |
| /platform/audit | app/platform/audit/page.tsx | 2 | ? | PageLayout, AuditTable |
| /communications | app/(marketing)/communications/page.tsx | 2 | ? | MarketingPage |
| /vayon/documents/onedrive | app/vayon/documents/onedrive/page.tsx | 5 | ? | ReturnType, MicrosoftCapabilityShell, Button, Button |
| /vayon/crm/contacts/[contactId] | app/vayon/crm/contacts/[contactId]/page.tsx | 0 | ? | CrmShell, CrmLeadProfileView, ContextualAIActions |
| /vayon/crm/contacts | app/vayon/crm/contacts/page.tsx | 6 | ? | Record, CrmShell, ContactDirectory |
| /vayon/follow-ups | app/vayon/follow-ups/page.tsx | 1 | ? | CommunicationHeader, FollowUpForm, FollowUpList |
| /platform/applications | app/platform/applications/page.tsx | 1 | ? | ApplicationSidebar, ApplicationHeader, ApplicationGrid |
| /careers | app/(marketing)/careers/page.tsx | 3 | ? | MarketingPage |
| /vayon/documents/drive | app/vayon/documents/drive/page.tsx | 4 | ? | GoogleDriveWorkspace |
| /platform/activity | app/platform/activity/page.tsx | 1 | ? | PageLayout, Timeline |
| /calendar | app/(marketing)/calendar/page.tsx | 2 | ? | MarketingPage |
| /platform/founder/workflows | app/platform/founder/workflows/page.tsx | 2 | ? | WorkflowOrchestrationDashboard |
| /vayon/crm/companies/[companyId] | app/vayon/crm/companies/[companyId]/page.tsx | 0 | ? | CrmShell, CompanyMetrics, CompanyProfile, ContextualAIActions |
| /vayon/developers | app/vayon/developers/page.tsx | 1 | ? | DeveloperPortal |
| /brand-assets | app/(marketing)/brand-assets/page.tsx | 2 | ? | LaunchInformationPage |
| /platform/founder/tenants | app/platform/founder/tenants/page.tsx | 1 | ? | TenantManagementCenter |
| /vayon/crm/companies/[companyId]/edit | app/vayon/crm/companies/[companyId]/edit/page.tsx | 0 | ? | CrmShell, CompanyForm |
| /vayon/crm/companies | app/vayon/crm/companies/page.tsx | 6 | ? | Record, CrmShell, ButtonLink, CompanyDirectory, Link, Link |
| /platform/founder/sales | app/platform/founder/sales/page.tsx | 3 | ? | SalesDirectorDashboard |
| /platform/founder | app/platform/founder/page.tsx | 8 | ? | FounderDashboard |
| /vayon/crm/companies/new | app/vayon/crm/companies/new/page.tsx | 3 | ? | CrmShell, CompanyForm |
| /blog/[slug] | app/(marketing)/blog/[slug]/page.tsx | 0 | ? | Metadata, BlogArticlePage |
| /blog | app/(marketing)/blog/page.tsx | 3 | ? | BlogIndex |
| /onboarding/[setup] | app/onboarding/[setup]/page.tsx | 0 | ? | Composed component: runtime review required |
| /onboarding | app/onboarding/page.tsx | 6 | /login | EnterpriseOnboardingWizard |
| /platform/founder/operations | app/platform/founder/operations/page.tsx | 1 | ? | AutonomousOperationsDashboard |
| /vayon/crm/activities | app/vayon/crm/activities/page.tsx | 1 | ? | CrmShell, ActivityDirectory |
| /api | app/(marketing)/api/page.tsx | 2 | ? | LaunchInformationPage |
| /platform/founder/observability | app/platform/founder/observability/page.tsx | 1 | ? | ObservabilityDashboard |
| /vayon/deals/[dealId] | app/vayon/deals/[dealId]/page.tsx | 0 | ? | DealPanel, WorkspaceRenderer, DealOverview, ContextualAIActions |
| /onboarding/business-launch | app/onboarding/business-launch/page.tsx | 3 | ? | BusinessLaunchWizard |
| /ai-workforce | app/(marketing)/ai-workforce/page.tsx | 4 | ? | MarketingPage |
| /platform/founder/memory | app/platform/founder/memory/page.tsx | 2 | ? | UnifiedAIContextDashboard |
| /vayon/deals/[dealId]/edit | app/vayon/deals/[dealId]/edit/page.tsx | 0 | ? | DealForm |
| /login | app/login/page.tsx | 7 | ? | AuthShell, FormNotice, Button, AuthFields, Link, Link |
| /ai-usage-policy | app/(marketing)/ai-usage-policy/page.tsx | 3 | ? | LegalPolicyPage |
| /platform/founder/marketing | app/platform/founder/marketing/page.tsx | 4 | ? | MarketingDirectorDashboard |
| /vayon/deals/pipeline | app/vayon/deals/pipeline/page.tsx | 3 | ? | ButtonLink, ButtonLink, PipelineStatistics, DealBoard |
| /vayon/deals | app/vayon/deals/page.tsx | 16 | ? | ButtonLink, PipelineStatistics, ButtonLink, ButtonLink, DealBoard, ContextualRealEstateRecommendations |
| /vayon/creative-studio/wizard | app/vayon/creative-studio/wizard/page.tsx | 6 | ? | StudioShell, CampaignWizard, CapabilityCatalog |
| /platform/founder/customer-success | app/platform/founder/customer-success/page.tsx | 4 | ? | CustomerGrowthDashboard |
| /acceptable-use-policy | app/(marketing)/acceptable-use-policy/page.tsx | 3 | ? | LegalPolicyPage |
| /platform/founder/intelligence | app/platform/founder/intelligence/page.tsx | 1 | ? | Query, IntelligenceHubDashboard |
| /vayon/deals/offers | app/vayon/deals/offers/page.tsx | 3 | ? | DealRoomRoute |
| /vayon/creative-studio/templates | app/vayon/creative-studio/templates/page.tsx | 6 | ? | StudioShell |
| /vayon/creative-studio | app/vayon/creative-studio/page.tsx | 12 | ? | StudioShell, StudioDashboard |
| /platform/founder/command-center | app/platform/founder/command-center/page.tsx | 1 | ? | AICommandCenter |
| /about | app/(marketing)/about/page.tsx | 4 | ? | MarketingPage |
| /platform/founder/integrations | app/platform/founder/integrations/page.tsx | 2 | ? | EnterpriseIntegrationDashboard |
| /vayon/deals/new | app/vayon/deals/new/page.tsx | 8 | ? | DealForm |
| /vayon/creative-studio/packs | app/vayon/creative-studio/packs/page.tsx | 4 | ? | StudioShell, CampaignPacks |
| /platform/founder/ai | app/platform/founder/ai/page.tsx | 3 | ? | FounderAIHome |
| /vayon/creative-studio/assets | app/vayon/creative-studio/assets/page.tsx | 8 | ? | Record, StudioShell, AssetLibrary |
| /vayon/deals/contracts | app/vayon/deals/contracts/page.tsx | 2 | ? | DealRoomRoute |
| /vayon/creative-studio/growth | app/vayon/creative-studio/growth/page.tsx | 3 | ? | StudioShell, GrowthCampaignChat, GrowthOverview |
| /platform/founder/access | app/platform/founder/access/page.tsx | 2 | ? | FounderBootstrapPanel |
| /vayon/deals/checklists | app/vayon/deals/checklists/page.tsx | 1 | ? | DealRoomRoute |
| /vayon/creative-studio/analytics | app/vayon/creative-studio/analytics/page.tsx | 1 | ? | StudioShell |
| /vayon/context | app/vayon/context/page.tsx | 2 | ? | UnifiedContextPanel, ContextEngineDashboard |
| /vayon/contacts/microsoft | app/vayon/contacts/microsoft/page.tsx | 4 | ? | ReturnType, MicrosoftCapabilityShell, Button |
| /vayon/deals/analytics | app/vayon/deals/analytics/page.tsx | 2 | ? | DealRoomRoute |
| /vayon/creative-studio/editor/[assetId] | app/vayon/creative-studio/editor/[assetId]/page.tsx | 0 | ? | StudioShell, CreativeEditor |
| /vayon/creative-studio/brand-kits | app/vayon/creative-studio/brand-kits/page.tsx | 2 | ? | StudioShell, BrandKits |
| /vayon/contacts/google | app/vayon/contacts/google/page.tsx | 2 | ? | GoogleContactsWorkspace |
| /vayon/dashboard | app/vayon/dashboard/page.tsx | 25 | ? | DashboardShell |
| /vayon/creative-studio/calendar | app/vayon/creative-studio/calendar/page.tsx | 3 | ? | StudioShell, CampaignCalendar |
| /vayon/creative-studio/assistant | app/vayon/creative-studio/assistant/page.tsx | 3 | ? | Record, StudioShell, CreativeAssistant, Link, Link |
| /vayon/creative/images | app/vayon/creative/images/page.tsx | 8 | ? | ImageStudio |
| /vayon/creative/[studio] | app/vayon/creative/[studio]/page.tsx | 0 | ? | Composed component: runtime review required |
| /vayon/creative/documents | app/vayon/creative/documents/page.tsx | 10 | ? | DocumentStudio |
| /vayon/creative/videos | app/vayon/creative/videos/page.tsx | 8 | ? | VideoStudio |
| /vayon/communications/templates | app/vayon/communications/templates/page.tsx | 1 | ? | CommunicationsShell, TemplateLibrary |
| /vayon/creative/cloud | app/vayon/creative/cloud/page.tsx | 2 | ? | FeatureAvailabilityState, CreativeCloudDashboard |
| /vayon/creative/templates | app/vayon/creative/templates/page.tsx | 2 | ? | Composed component: runtime review required |
| /vayon/communications/teams | app/vayon/communications/teams/page.tsx | 3 | ? | ReturnType, ReturnType, ReturnType, ReturnType, MicrosoftCapabilityShell, Button |
| /vayon/creative/campaigns | app/vayon/creative/campaigns/page.tsx | 14 | ? | CampaignStudio |
| /vayon/creative/runtime | app/vayon/creative/runtime/page.tsx | 3 | ? | CreativeRuntimeDashboard |
| /vayon/communications/reports | app/vayon/communications/reports/page.tsx | 1 | ? | CommunicationsShell |
| /vayon/communications | app/vayon/communications/page.tsx | 11 | ? | CommunicationActivityPanel, CommunicationsShell, HubDashboard, CommunicationActivityPanel |
| /vayon/creative/calendar | app/vayon/creative/calendar/page.tsx | 2 | ? | Composed component: runtime review required |
| /vayon/creative/runtime/execution | app/vayon/creative/runtime/execution/page.tsx | 1 | ? | ExecutionDashboard |
| /vayon/communications/outlook | app/vayon/communications/outlook/page.tsx | 4 | ? | MicrosoftCapabilityShell, Link, Button, Link, Button, Button |
| /vayon/creative/brand | app/vayon/creative/brand/page.tsx | 6 | ? | BrandStudio |
| /vayon/creative/pipelines | app/vayon/creative/pipelines/page.tsx | 2 | ? | FeatureAvailabilityState, CreativePipelineDashboard |
| /vayon/creative | app/vayon/creative/page.tsx | 20 | ? | FeatureAvailabilityState, CreativeStudioHome |
| /vayon/communications/notifications | app/vayon/communications/notifications/page.tsx | 1 | ? | CommunicationsShell, NotificationList |
| /vayon/creative/assets | app/vayon/creative/assets/page.tsx | 2 | ? | Composed component: runtime review required |
| /vayon/communications/inbox | app/vayon/communications/inbox/page.tsx | 3 | ? | Record, CommunicationsShell, Button, InboxList |
| /vayon/communications/conversations/[conversationId] | app/vayon/communications/conversations/[conversationId]/page.tsx | 0 | ? | CommunicationsShell, ConversationView |
| /vayon/communications/conversations | app/vayon/communications/conversations/page.tsx | 1 | ? | CommunicationsShell, ConversationLinks |
| /vayon/communications/connectors | app/vayon/communications/connectors/page.tsx | 1 | ? | CommunicationsShell |
| /vayon/communications/campaigns | app/vayon/communications/campaigns/page.tsx | 3 | ? | CommunicationsShell, CampaignList |
| /vayon/cognitive | app/vayon/cognitive/page.tsx | 3 | ? | CognitiveDashboard |

## Potentially undiscoverable / legacy candidates

- `/vayon/workflows/[workflowId]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/site-visits/[visitId]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/site-visits/calendar` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/calendar/google` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/calendar/google/free-busy` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/accept-invitation` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/calendar/google/calendars` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/solutions/[slug]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/sales-assets/[slug]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/settings/invoices/[invoiceId]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/industries/[slug]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/approvals/[approvalId]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/providers/[provider]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/ai/workforce/[employeeId]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/properties/[propertyId]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/properties/[propertyId]/edit` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/ai/employees/[employeeId]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/properties/projects/[projectId]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/platform/security-review` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/features/[slug]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/platform/deployment` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/platform/region-management` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/platform/customers/[organizationId]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/docs/[slug]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/leads/[leadId]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/platform/country-management` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/email/[messageId]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/leads/[leadId]/edit` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/platform/command-center` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/email/trash` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/data-ownership` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/email/spam` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/customers/[slug]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/email/sent` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/email/drafts` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/crm/leads/[leadId]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/growth/[section]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/email/archive` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/compare/[slug]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/crm/contacts/[contactId]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/crm/companies/[companyId]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/crm/companies/[companyId]/edit` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/blog/[slug]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/onboarding/[setup]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/deals/[dealId]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/deals/[dealId]/edit` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/creative-studio/editor/[assetId]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/creative/[studio]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
- `/vayon/communications/conversations/[conversationId]` ? no exact incoming literal found. Investigate dynamic links and external bookmarks before removing.
