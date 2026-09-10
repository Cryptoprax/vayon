# Navigation Certification

Status: source routes and task lookup tested; five-second human discovery not certified. The current audit has 68 unique catalog destinations across 346 page files. The one newly exposed catalog destination is the existing viewing scheduler, not a new page.

| Common task | Existing path / entry | Status |
|---|---|---|
| Create Property | /vayon/properties/new | Exact action tested |
| Create Lead | /vayon/leads/new | Exact action tested |
| Invite Team | /vayon/settings/members | Exact action tested; invitation still uses existing UI and permissions |
| Create Campaign | /vayon/creative/campaigns | Exact action tested; destination capability/access unchanged |
| Upload Photos | Search alias leads to Properties, then edit and Media | Existing picker only previews locally. No persistent upload certified; wording corrected |
| Generate Brochure | /vayon/creative/documents | Exact action tested; opens tool, does not itself generate |
| Schedule Viewing | /vayon/site-visits | Exact action tested; existing VisitForm route |
| Send WhatsApp | /vayon/communications | Exact action tested; opens conversations, does not send automatically |
| Create Task | /vayon/tasks | Exact action tested |
| Export Report | /vayon/analytics/executive, then Export CSV | Existing CSV control discovered and made searchable; download contents need live-data QA |
| Reset Password | Profile menu to /forgot-password; existing login recovery | Existing recovery route exposed; no authentication change, email not submitted |
| Update Company | Search alias to /vayon/crm/companies, then select company | Directory discovery improved; record-specific name search remains separate |

Common-action tests assert first destination and label for nine tasks and zero shortcuts when the permitted catalog is empty. Existing role/visibility gates are retained. Creative and AI founder restrictions may prevent some personas from seeing requested tasks. This phase does not override those restrictions.

Floating Create deduplicates shared destinations; profile workspace/keyboard-shortcut duplication is replaced with the existing password recovery link. General navigation remains workflow-oriented. Three/five-second rules require user observation, not a passing route regex.
