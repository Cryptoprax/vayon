# Search certification

Status: Blocked

This milestone supersedes the earlier local-only search certification. Executed 14 required queries for six role variants (84 cases) using the actual shared catalog, role/visibility filters, static provider and ranker. These results are narrower than the full authenticated Universal Bar: they exclude live record loading, personalized history and browser command-mode composition. No five-second first-time-customer discovery claim is certified.

## Ordinary Owner: current first static result

| Query | First result | Destination |
| --- | --- | --- |
| Property | Create Property | /vayon/properties/new |
| Lead | Create Lead | /vayon/leads/new |
| Client | Clients | /vayon/crm/contacts |
| Deal | Create Company | /vayon/crm/companies/new |
| Task | Create Task | /vayon/tasks |
| Campaign | No static result | None |
| Invite Team | Invite Team Members | /vayon/settings/members |
| Reports | Reports | /vayon/growth/reports |
| Settings | Workspace | /vayon/settings/organization |
| Create Property | Create Property | /vayon/properties/new |
| Create Lead | Create Lead | /vayon/leads/new |
| Generate Brochure | No static result | None |
| Schedule Viewing | Schedule Viewing | /vayon/site-visits |
| Call Buyer | No static result | None |

Blockers: Campaign and Generate Brochure are absent from the customer-filtered static catalog because Creative visibility is founder-only. Call Buyer has a command-router destination but no static task result. Deal returns Create Company first; existence of a later correct result does not satisfy highest-value-first. Client opens a directory whose creation handoff is incomplete. Reports opens a report destination, but customer understanding and completion remain unverified.

## Role-specific results

### organization_owner

| Query | First static result | Local calculation time (ms) |
| --- | --- | --- |
| Property | Create Property | 0.546 |
| Lead | Create Lead | 0.149 |
| Client | Clients | 0.091 |
| Deal | Create Company | 0.077 |
| Task | Create Task | 0.084 |
| Campaign | No static result | 0.071 |
| Invite Team | Invite Team Members | 0.079 |
| Reports | Reports | 0.097 |
| Settings | Workspace | 0.083 |
| Create Property | Create Property | 0.088 |
| Create Lead | Create Lead | 0.07 |
| Generate Brochure | No static result | 0.079 |
| Schedule Viewing | Schedule Viewing | 0.077 |
| Call Buyer | No static result | 0.062 |

### organization_admin

| Query | First static result | Local calculation time (ms) |
| --- | --- | --- |
| Property | Create Property | 0.084 |
| Lead | Create Lead | 0.078 |
| Client | Clients | 0.066 |
| Deal | Create Company | 0.061 |
| Task | Create Task | 0.063 |
| Campaign | No static result | 0.061 |
| Invite Team | Invite Team Members | 0.073 |
| Reports | Reports | 0.071 |
| Settings | Workspace | 0.067 |
| Create Property | Create Property | 0.057 |
| Create Lead | Create Lead | 0.064 |
| Generate Brochure | No static result | 0.052 |
| Schedule Viewing | Schedule Viewing | 0.059 |
| Call Buyer | No static result | 0.052 |

### manager

| Query | First static result | Local calculation time (ms) |
| --- | --- | --- |
| Property | Create Property | 0.053 |
| Lead | Create Lead | 0.041 |
| Client | Clients | 0.043 |
| Deal | Create Company | 0.05 |
| Task | Create Task | 0.039 |
| Campaign | No static result | 0.037 |
| Invite Team | No static result | 0.049 |
| Reports | Reports | 0.04 |
| Settings | Preferences | 0.038 |
| Create Property | Create Property | 0.05 |
| Create Lead | Create Lead | 0.038 |
| Generate Brochure | No static result | 0.038 |
| Schedule Viewing | Schedule Viewing | 0.051 |
| Call Buyer | No static result | 0.05 |

### sales_representative

| Query | First static result | Local calculation time (ms) |
| --- | --- | --- |
| Property | Create Property | 0.05 |
| Lead | Create Lead | 0.035 |
| Client | Clients | 0.032 |
| Deal | Create Company | 0.039 |
| Task | Create Task | 0.033 |
| Campaign | No static result | 0.032 |
| Invite Team | No static result | 0.033 |
| Reports | Reports | 0.042 |
| Settings | No static result | 0.043 |
| Create Property | Create Property | 0.077 |
| Create Lead | Create Lead | 0.047 |
| Generate Brochure | No static result | 0.053 |
| Schedule Viewing | Schedule Viewing | 0.046 |
| Call Buyer | No static result | 0.046 |

### agent

| Query | First static result | Local calculation time (ms) |
| --- | --- | --- |
| Property | Create Property | 0.043 |
| Lead | Lead Generation | 0.029 |
| Client | No static result | 0.03 |
| Deal | No static result | 0.034 |
| Task | No static result | 0.035 |
| Campaign | No static result | 0.034 |
| Invite Team | No static result | 0.029 |
| Reports | Reports | 0.032 |
| Settings | No static result | 0.035 |
| Create Property | Create Property | 0.028 |
| Create Lead | No static result | 0.032 |
| Generate Brochure | No static result | 0.036 |
| Schedule Viewing | Schedule Viewing | 0.029 |
| Call Buyer | No static result | 0.03 |

### read_only

| Query | First static result | Local calculation time (ms) |
| --- | --- | --- |
| Property | Create Property | 0.064 |
| Lead | Create Lead | 0.055 |
| Client | Clients | 0.053 |
| Deal | Create Company | 0.064 |
| Task | Create Task | 0.052 |
| Campaign | No static result | 0.051 |
| Invite Team | No static result | 1.219 |
| Reports | Reports | 0.063 |
| Settings | No static result | 0.051 |
| Create Property | Create Property | 0.055 |
| Create Lead | Create Lead | 0.049 |
| Generate Brochure | No static result | 0.048 |
| Schedule Viewing | Schedule Viewing | 0.05 |
| Call Buyer | No static result | 0.049 |

Local calculation timings exclude rendering, network, data fetching, typing, decision time and task completion. They cannot establish the five-second requirement. No-result cases may differ when authenticated records or command results are available; those full paths require verification. Existing permissions are not bypassed to manufacture search coverage.

Sources: scripts/audit-business-workflow-certification.mjs; test-results/business-certification/source-audit.json; features/vayon/universal-bar/components/UniversalBar.tsx; features/vayon/universal-bar/providers/static-navigation.provider.ts; features/vayon/universal-bar/services/universal-search.service.ts; features/vayon/cross-module-intelligence/command-router.ts.
