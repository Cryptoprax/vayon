# Version 1 module dependency graph

## Platform graph

```text
Organizations + Workspaces + RBAC
        ├─ CRM
        ├─ Property Projects / Towers / Units
        │      ├─ Site Visits
        │      ├─ Property Matching
        │      └─ Marketing / Creative / Growth Studio
        ├─ Billing / Usage
        ├─ Notifications / Email
        ├─ Workflow Automation
        ├─ Knowledge Platform
        │      └─ AI Help / Product Intelligence
        └─ AI Workforce / Collaboration
               └─ Continuous Learning / Executive Intelligence
```

## Module verification

| Module | Database dependencies | Static status |
| --- | --- | --- |
| Organizations | organizations, workspaces, members, roles, audit | Complete |
| CRM | existing CRM relations and tenant helpers | Complete |
| Properties | property_projects, towers, units, prices, documents, audit | Complete |
| Marketing Studio | property_projects, creative campaigns/assets, licensing | Schema complete |
| Creative Studio | property_projects, campaigns, assets, jobs, brand kits, timeline | Schema complete; runtime obsolete-name mapping remains |
| Growth Studio | creative campaigns and campaign packs | Complete after project-name repair |
| Knowledge | articles, versions, documents, videos, analytics, storage | Complete |
| Product Intelligence | events, feedback, knowledge/audit integration | Complete |
| Continuous Learning | intelligence memory, aggregates, jobs, briefings | Complete |
| Billing | customers, subscriptions, items, payments, invoices, events, usage | Complete |
| Notifications | events, preferences, queue, reminders | Complete |
| AI Workforce | runtime tables, collaboration, approvals, observability | Complete at schema level |

## Provider and application boundaries

Database dependency completeness does not activate OpenAI, Stripe, Razorpay, Google Workspace, SMTP, Microsoft OAuth, or WhatsApp. Provider readiness remains separately governed.

Creative application generation currently queries legacy `inventory_*` relation names. This report does not certify that runtime path because changing it would exceed the schema-only Sprint 93 authorization.

## Result

Internal staged SQL module graph: **PASS**  
Creative schema dependency: **REPAIRED**  
Knowledge dependency: **PASS**  
Marketing dependency: **PASS at schema level**
