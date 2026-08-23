# RC1 module status

| Module | Status | Evidence / blocker |
| --- | --- | --- |
| Authentication | READY | Core production tables exist; provider journeys require live browser evidence. |
| Organizations | DEGRADED | Core organizations/workspaces exist; enterprise Sprint 51/76 objects need the database patch. |
| Workspaces | READY | Core workspace and membership schema exists. |
| CRM | READY | Core CRM schema is represented in production. |
| Properties | DEGRADED | Core properties exist; enterprise inventory/site-visit extensions need the patch. |
| Leads | READY | Core lead schema exists. |
| Deals | READY | Core deal schema exists. |
| Meetings | READY | Core meetings schema exists. |
| Calendar | DEGRADED | Local scheduling works; Google provider requires flag, credentials, consent, and health evidence. |
| Tasks | READY | Core task schema exists. |
| Communications | DEGRADED | Core communications exist; live providers require credentials and connection evidence. |
| Marketing Studio | BLOCKED | Code and entitlement are ready; creative/growth production tables are missing. |
| Creative Studio | BLOCKED | Creative schema and generation queues require the Version 1 patch. |
| Growth Studio | BLOCKED | Growth campaign schema requires the Version 1 patch. |
| Landing Pages | DEGRADED | Draft generator is code-ready; publishing is intentionally unavailable. |
| Campaign Builder | BLOCKED | Campaign persistence requires the Version 1 patch. |
| AI Workforce | DEGRADED | Runtime schema exists; OpenAI health observed billing_required during build. |
| AI Employees | DEGRADED | Configured employees exist; live inference depends on OpenAI billing/health. |
| Knowledge | BLOCKED | Recovery is safe, but all Knowledge production tables/RPCs/bucket are missing. |
| Help Center | DEGRADED | Static documentation remains available; tenant retrieval needs Knowledge schema. |
| Product Intelligence | BLOCKED | Sprint 86.4 tables/RPCs are missing. |
| Continuous Learning | BLOCKED | Sprint 86.5 tables/RPCs are missing. |
| Notifications | DEGRADED | Core notification tables exist; Sprint 59 platform is only partially represented. |
| Billing | BLOCKED | Core subscription records exist; commercial Sprint 50/83 schema and live provider evidence are missing. |
| Subscriptions | DEGRADED | Core subscription schema exists; checkout/portal require live Stripe configuration. |
| Settings | READY | Routes compile and retain authenticated governance. |
| Integrations | DEGRADED | Provider-neutral center is ready; connections depend on flags, credentials, and consent. |
| Founder Dashboard | DEGRADED | Code compiles; authenticated runtime verification is pending. |
| Demo Environment | READY | Aurora demo is isolated, deterministic, and read-only. |
| Public Website | READY | Public routes, SEO assets, contact resilience, and build pass. |
| Pricing | DEGRADED | Page is ready; live checkout requires billing provider configuration. |
| Contact Sales / Book Demo | DEGRADED | Failure isolation is tested; production submission requires marketing tables/RPCs. |

READY means repository/build evidence and required production core schema exist. DEGRADED means safe fallback or partial operation is available. BLOCKED means a required production database/provider dependency is absent.
