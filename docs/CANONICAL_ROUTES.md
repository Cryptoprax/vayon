# VAYON Canonical Routes

Sprint 222 freezes the customer-facing route hierarchy. Compatibility entries redirect before application rendering and preserve query parameters through Next.js redirect handling.

| Capability | Canonical route | Compatibility entries |
| --- | --- | --- |
| Dashboard | `/vayon/dashboard` | `/vayon/home` |
| Leads | `/vayon/leads` | `/vayon/crm/leads` |
| AI Workforce | `/vayon/ai/workforce` | `/vayon/workforce`, `/vayon/ai/employees` |
| AI Work Queue | `/vayon/ai/work-queue` | None |
| Creative | `/vayon/creative` | `/vayon/creative-studio` and mapped child routes |
| Notifications / Enterprise Inbox | `/vayon/notifications` | `/vayon/notifications/inbox` |
| Customer Success workspace | `/vayon/customer-success` | None |
| Customer learning and support | `/vayon/success-center` | None; intentionally distinct |
| Approvals | `/vayon/approvals` | Founder route is a role-specific projection, not a second workflow |

Internal architecture, runtime, diagnostic and compatibility routes must not be added to primary customer navigation.
