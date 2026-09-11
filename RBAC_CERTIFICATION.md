# Wave 1 RBAC certification

Status: Blocked

Only role gates are inspected for Analytics, AI and approvals; those product modules were not changed or functionally audited. Actual pure policy and navigation functions ran for six role codes: Owner, Admin, Manager, supported Agent (sales_representative), legacy agent, and Read-only. Live page/API/RLS checks remain Needs Verification.

Blockers: Manager lacks invitation permission; HR-manager runtime and invitation SQL disagree; legacy agent is not a runtime role; Read-only view grants disagree with Settings visibility; identity search lacks required tasks. Runtime grants are not proof that the database or destination permits the same operation. No permission was changed.

## organization_owner

Status: Blocked

| Permission area | Granted runtime actions |
| --- | --- |
| reports | view, create, update, delete, approve, export, manage, admin |
| analytics | view, create, update, delete, approve, export, manage, admin |
| ai_employees | view, create, update, delete, approve, export, manage, admin |
| workflow_automation | view, create, update, delete, approve, export, manage, admin |
| team_management | view, create, update, delete, approve, export, manage, admin |
| organization_settings | view, create, update, delete, approve, export, manage, admin |

Actions include view, create, update (edit), delete, approve, export, manage and admin. Invite uses team_management.create. General create/edit/delete grants for every module are recorded in source-audit.json; they were evaluated as RBAC only.

Visible catalog destinations:

- /vayon/dashboard
- /vayon/properties
- /vayon/leads
- /vayon/crm/contacts
- /vayon/crm/companies
- /vayon/deals
- /vayon/notifications
- /vayon/site-visits
- /vayon/calendar
- /vayon/tasks
- /vayon/timeline
- /vayon/communications
- /vayon/creative-studio/packs
- /vayon/growth
- /vayon/growth/lead-generation
- /vayon/growth/buyer-intelligence
- /vayon/growth/seller-intelligence
- /vayon/growth/property-seo
- /vayon/growth/referral-network
- /vayon/growth/market-intelligence
- /vayon/intelligence
- /vayon/approvals
- /vayon/analytics
- /vayon/analytics/sales
- /vayon/analytics/executive
- /vayon/growth/listing-performance
- /vayon/growth/marketing-analytics
- /vayon/growth/advertising-performance
- /vayon/growth/social-performance
- /vayon/growth/reports
- /vayon/settings/organization
- /vayon/settings/members
- /vayon/settings/integrations
- /vayon/settings/billing
- /vayon/settings/appearance

Hidden catalog destinations:

- /vayon/creative/campaigns
- /vayon/creative
- /vayon/creative/brand
- /vayon/creative/images
- /vayon/creative/videos
- /vayon/creative/documents
- /vayon/creative/assets
- /vayon/creative/landing-pages
- /vayon/creative/templates
- /vayon/creative/calendar
- /vayon/creative/cloud
- /vayon/creative/pipelines
- /vayon/ai/workforce
- /vayon/ai/work-queue
- /vayon/ai/collaboration
- /vayon/ai/automations
- /vayon/ai/goals
- /vayon/ai/history
- /vayon/workflows
- /platform/founder/workflows
- /platform/system-analytics
- /vayon/growth/investor-relations
- /platform/founder/marketing
- /vayon/settings/product-intelligence
- /vayon/ai/playground
- /platform/feature-flags
- /platform/organizations
- /platform/settings
- /vayon/founder/approvals
- /vayon/customer-success
- /vayon/knowledge
- /vayon/admin
- /vayon/system

| Identity search | First static result | Destination |
| --- | --- | --- |
| Invite Team | Invite Team Members | /vayon/settings/members |
| Workspace | Workspace | /vayon/settings/organization |
| Members | Invite Team Members | /vayon/settings/members |
| Roles | No static result | None |
| Settings | Workspace | /vayon/settings/organization |
| Users | No static result | None |
| Owner | No static result | None |
| Admin | No static result | None |

## organization_admin

Status: Blocked

| Permission area | Granted runtime actions |
| --- | --- |
| reports | view, create, update, delete, approve, export, manage |
| analytics | view, create, update, delete, approve, export, manage |
| ai_employees | view, create, update, delete, approve, export, manage |
| workflow_automation | view, create, update, delete, approve, export, manage |
| team_management | view, create, update, delete, approve, export, manage, admin |
| organization_settings | view, create, update, delete, approve, export, manage |

Actions include view, create, update (edit), delete, approve, export, manage and admin. Invite uses team_management.create. General create/edit/delete grants for every module are recorded in source-audit.json; they were evaluated as RBAC only.

Visible catalog destinations:

- /vayon/dashboard
- /vayon/properties
- /vayon/leads
- /vayon/crm/contacts
- /vayon/crm/companies
- /vayon/deals
- /vayon/notifications
- /vayon/site-visits
- /vayon/calendar
- /vayon/tasks
- /vayon/timeline
- /vayon/communications
- /vayon/creative-studio/packs
- /vayon/growth
- /vayon/growth/lead-generation
- /vayon/growth/buyer-intelligence
- /vayon/growth/seller-intelligence
- /vayon/growth/property-seo
- /vayon/growth/referral-network
- /vayon/growth/market-intelligence
- /vayon/intelligence
- /vayon/approvals
- /vayon/analytics
- /vayon/analytics/sales
- /vayon/analytics/executive
- /vayon/growth/listing-performance
- /vayon/growth/marketing-analytics
- /vayon/growth/advertising-performance
- /vayon/growth/social-performance
- /vayon/growth/reports
- /vayon/settings/organization
- /vayon/settings/members
- /vayon/settings/integrations
- /vayon/settings/appearance

Hidden catalog destinations:

- /vayon/creative/campaigns
- /vayon/creative
- /vayon/creative/brand
- /vayon/creative/images
- /vayon/creative/videos
- /vayon/creative/documents
- /vayon/creative/assets
- /vayon/creative/landing-pages
- /vayon/creative/templates
- /vayon/creative/calendar
- /vayon/creative/cloud
- /vayon/creative/pipelines
- /vayon/ai/workforce
- /vayon/ai/work-queue
- /vayon/ai/collaboration
- /vayon/ai/automations
- /vayon/ai/goals
- /vayon/ai/history
- /vayon/workflows
- /vayon/settings/billing
- /platform/founder/workflows
- /platform/system-analytics
- /vayon/growth/investor-relations
- /platform/founder/marketing
- /vayon/settings/product-intelligence
- /vayon/ai/playground
- /platform/feature-flags
- /platform/organizations
- /platform/settings
- /vayon/founder/approvals
- /vayon/customer-success
- /vayon/knowledge
- /vayon/admin
- /vayon/system

| Identity search | First static result | Destination |
| --- | --- | --- |
| Invite Team | Invite Team Members | /vayon/settings/members |
| Workspace | Workspace | /vayon/settings/organization |
| Members | Invite Team Members | /vayon/settings/members |
| Roles | No static result | None |
| Settings | Workspace | /vayon/settings/organization |
| Users | No static result | None |
| Owner | No static result | None |
| Admin | No static result | None |

## manager

Status: Blocked

| Permission area | Granted runtime actions |
| --- | --- |
| reports | view |
| analytics | view |
| ai_employees | None |
| workflow_automation | view, create, update, delete, approve, export, manage |
| team_management | None |
| organization_settings | None |

Actions include view, create, update (edit), delete, approve, export, manage and admin. Invite uses team_management.create. General create/edit/delete grants for every module are recorded in source-audit.json; they were evaluated as RBAC only.

Visible catalog destinations:

- /vayon/dashboard
- /vayon/properties
- /vayon/leads
- /vayon/crm/contacts
- /vayon/crm/companies
- /vayon/deals
- /vayon/notifications
- /vayon/site-visits
- /vayon/calendar
- /vayon/tasks
- /vayon/timeline
- /vayon/communications
- /vayon/creative-studio/packs
- /vayon/growth
- /vayon/growth/lead-generation
- /vayon/growth/buyer-intelligence
- /vayon/growth/seller-intelligence
- /vayon/growth/property-seo
- /vayon/growth/referral-network
- /vayon/growth/market-intelligence
- /vayon/approvals
- /vayon/analytics
- /vayon/analytics/sales
- /vayon/analytics/executive
- /vayon/growth/listing-performance
- /vayon/growth/marketing-analytics
- /vayon/growth/advertising-performance
- /vayon/growth/social-performance
- /vayon/growth/reports
- /vayon/settings/appearance

Hidden catalog destinations:

- /vayon/creative/campaigns
- /vayon/creative
- /vayon/creative/brand
- /vayon/creative/images
- /vayon/creative/videos
- /vayon/creative/documents
- /vayon/creative/assets
- /vayon/creative/landing-pages
- /vayon/creative/templates
- /vayon/creative/calendar
- /vayon/creative/cloud
- /vayon/creative/pipelines
- /vayon/intelligence
- /vayon/ai/workforce
- /vayon/ai/work-queue
- /vayon/ai/collaboration
- /vayon/ai/automations
- /vayon/ai/goals
- /vayon/ai/history
- /vayon/workflows
- /vayon/settings/organization
- /vayon/settings/members
- /vayon/settings/integrations
- /vayon/settings/billing
- /platform/founder/workflows
- /platform/system-analytics
- /vayon/growth/investor-relations
- /platform/founder/marketing
- /vayon/settings/product-intelligence
- /vayon/ai/playground
- /platform/feature-flags
- /platform/organizations
- /platform/settings
- /vayon/founder/approvals
- /vayon/customer-success
- /vayon/knowledge
- /vayon/admin
- /vayon/system

| Identity search | First static result | Destination |
| --- | --- | --- |
| Invite Team | No static result | None |
| Workspace | No static result | None |
| Members | No static result | None |
| Roles | No static result | None |
| Settings | Preferences | /vayon/settings/appearance |
| Users | No static result | None |
| Owner | No static result | None |
| Admin | No static result | None |

## sales_representative

Status: Blocked

| Permission area | Granted runtime actions |
| --- | --- |
| reports | None |
| analytics | None |
| ai_employees | view, create, update |
| workflow_automation | None |
| team_management | None |
| organization_settings | None |

Actions include view, create, update (edit), delete, approve, export, manage and admin. Invite uses team_management.create. General create/edit/delete grants for every module are recorded in source-audit.json; they were evaluated as RBAC only.

Visible catalog destinations:

- /vayon/dashboard
- /vayon/properties
- /vayon/leads
- /vayon/crm/contacts
- /vayon/crm/companies
- /vayon/deals
- /vayon/notifications
- /vayon/site-visits
- /vayon/calendar
- /vayon/tasks
- /vayon/timeline
- /vayon/growth
- /vayon/growth/lead-generation
- /vayon/growth/buyer-intelligence
- /vayon/growth/seller-intelligence
- /vayon/growth/property-seo
- /vayon/growth/referral-network
- /vayon/growth/market-intelligence
- /vayon/intelligence
- /vayon/growth/listing-performance
- /vayon/growth/marketing-analytics
- /vayon/growth/advertising-performance
- /vayon/growth/social-performance
- /vayon/growth/reports

Hidden catalog destinations:

- /vayon/communications
- /vayon/creative/campaigns
- /vayon/creative
- /vayon/creative/brand
- /vayon/creative/images
- /vayon/creative/videos
- /vayon/creative/documents
- /vayon/creative/assets
- /vayon/creative/landing-pages
- /vayon/creative-studio/packs
- /vayon/creative/templates
- /vayon/creative/calendar
- /vayon/creative/cloud
- /vayon/creative/pipelines
- /vayon/ai/workforce
- /vayon/ai/work-queue
- /vayon/ai/collaboration
- /vayon/ai/automations
- /vayon/approvals
- /vayon/ai/goals
- /vayon/ai/history
- /vayon/workflows
- /vayon/analytics
- /vayon/analytics/sales
- /vayon/analytics/executive
- /vayon/settings/organization
- /vayon/settings/members
- /vayon/settings/integrations
- /vayon/settings/billing
- /vayon/settings/appearance
- /platform/founder/workflows
- /platform/system-analytics
- /vayon/growth/investor-relations
- /platform/founder/marketing
- /vayon/settings/product-intelligence
- /vayon/ai/playground
- /platform/feature-flags
- /platform/organizations
- /platform/settings
- /vayon/founder/approvals
- /vayon/customer-success
- /vayon/knowledge
- /vayon/admin
- /vayon/system

| Identity search | First static result | Destination |
| --- | --- | --- |
| Invite Team | No static result | None |
| Workspace | No static result | None |
| Members | No static result | None |
| Roles | No static result | None |
| Settings | No static result | None |
| Users | No static result | None |
| Owner | No static result | None |
| Admin | No static result | None |

## agent

Status: Blocked

| Permission area | Granted runtime actions |
| --- | --- |
| reports | None |
| analytics | None |
| ai_employees | None |
| workflow_automation | None |
| team_management | None |
| organization_settings | None |

Actions include view, create, update (edit), delete, approve, export, manage and admin. Invite uses team_management.create. General create/edit/delete grants for every module are recorded in source-audit.json; they were evaluated as RBAC only.

Visible catalog destinations:

- /vayon/dashboard
- /vayon/properties
- /vayon/notifications
- /vayon/site-visits
- /vayon/timeline
- /vayon/growth
- /vayon/growth/lead-generation
- /vayon/growth/buyer-intelligence
- /vayon/growth/seller-intelligence
- /vayon/growth/property-seo
- /vayon/growth/referral-network
- /vayon/growth/market-intelligence
- /vayon/growth/listing-performance
- /vayon/growth/marketing-analytics
- /vayon/growth/advertising-performance
- /vayon/growth/social-performance
- /vayon/growth/reports

Hidden catalog destinations:

- /vayon/leads
- /vayon/crm/contacts
- /vayon/crm/companies
- /vayon/deals
- /vayon/calendar
- /vayon/tasks
- /vayon/communications
- /vayon/creative/campaigns
- /vayon/creative
- /vayon/creative/brand
- /vayon/creative/images
- /vayon/creative/videos
- /vayon/creative/documents
- /vayon/creative/assets
- /vayon/creative/landing-pages
- /vayon/creative-studio/packs
- /vayon/creative/templates
- /vayon/creative/calendar
- /vayon/creative/cloud
- /vayon/creative/pipelines
- /vayon/intelligence
- /vayon/ai/workforce
- /vayon/ai/work-queue
- /vayon/ai/collaboration
- /vayon/ai/automations
- /vayon/approvals
- /vayon/ai/goals
- /vayon/ai/history
- /vayon/workflows
- /vayon/analytics
- /vayon/analytics/sales
- /vayon/analytics/executive
- /vayon/settings/organization
- /vayon/settings/members
- /vayon/settings/integrations
- /vayon/settings/billing
- /vayon/settings/appearance
- /platform/founder/workflows
- /platform/system-analytics
- /vayon/growth/investor-relations
- /platform/founder/marketing
- /vayon/settings/product-intelligence
- /vayon/ai/playground
- /platform/feature-flags
- /platform/organizations
- /platform/settings
- /vayon/founder/approvals
- /vayon/customer-success
- /vayon/knowledge
- /vayon/admin
- /vayon/system

| Identity search | First static result | Destination |
| --- | --- | --- |
| Invite Team | No static result | None |
| Workspace | No static result | None |
| Members | No static result | None |
| Roles | No static result | None |
| Settings | No static result | None |
| Users | No static result | None |
| Owner | No static result | None |
| Admin | No static result | None |

## read_only

Status: Blocked

| Permission area | Granted runtime actions |
| --- | --- |
| reports | view |
| analytics | view |
| ai_employees | view |
| workflow_automation | view |
| team_management | view |
| organization_settings | view |

Actions include view, create, update (edit), delete, approve, export, manage and admin. Invite uses team_management.create. General create/edit/delete grants for every module are recorded in source-audit.json; they were evaluated as RBAC only.

Visible catalog destinations:

- /vayon/dashboard
- /vayon/properties
- /vayon/leads
- /vayon/crm/contacts
- /vayon/crm/companies
- /vayon/deals
- /vayon/notifications
- /vayon/site-visits
- /vayon/calendar
- /vayon/tasks
- /vayon/timeline
- /vayon/creative-studio/packs
- /vayon/growth
- /vayon/growth/lead-generation
- /vayon/growth/buyer-intelligence
- /vayon/growth/seller-intelligence
- /vayon/growth/property-seo
- /vayon/growth/referral-network
- /vayon/growth/market-intelligence
- /vayon/intelligence
- /vayon/approvals
- /vayon/analytics
- /vayon/analytics/sales
- /vayon/analytics/executive
- /vayon/growth/listing-performance
- /vayon/growth/marketing-analytics
- /vayon/growth/advertising-performance
- /vayon/growth/social-performance
- /vayon/growth/reports

Hidden catalog destinations:

- /vayon/communications
- /vayon/creative/campaigns
- /vayon/creative
- /vayon/creative/brand
- /vayon/creative/images
- /vayon/creative/videos
- /vayon/creative/documents
- /vayon/creative/assets
- /vayon/creative/landing-pages
- /vayon/creative/templates
- /vayon/creative/calendar
- /vayon/creative/cloud
- /vayon/creative/pipelines
- /vayon/ai/workforce
- /vayon/ai/work-queue
- /vayon/ai/collaboration
- /vayon/ai/automations
- /vayon/ai/goals
- /vayon/ai/history
- /vayon/workflows
- /vayon/settings/organization
- /vayon/settings/members
- /vayon/settings/integrations
- /vayon/settings/billing
- /vayon/settings/appearance
- /platform/founder/workflows
- /platform/system-analytics
- /vayon/growth/investor-relations
- /platform/founder/marketing
- /vayon/settings/product-intelligence
- /vayon/ai/playground
- /platform/feature-flags
- /platform/organizations
- /platform/settings
- /vayon/founder/approvals
- /vayon/customer-success
- /vayon/knowledge
- /vayon/admin
- /vayon/system

| Identity search | First static result | Destination |
| --- | --- | --- |
| Invite Team | No static result | None |
| Workspace | No static result | None |
| Members | No static result | None |
| Roles | No static result | None |
| Settings | No static result | None |
| Users | No static result | None |
| Owner | No static result | None |
| Admin | No static result | None |

Source-audit.json records 48 role/query cases. Live record search and browser command composition are not included. The ordinary Owner receives no static result for Roles, Users, Owner and Admin. User singular resolving does not satisfy Users plural. No missing result was manufactured or bypassed through a broader permission. Full customer discovery remains Blocked.

Sources: features/platform/permissions/runtime/policy.ts; navigation.ts; permission.service.ts; features/platform/visibility/policy.ts; scripts/audit-wave1-certification.mjs.
