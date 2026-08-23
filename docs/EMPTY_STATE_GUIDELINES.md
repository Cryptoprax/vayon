# Empty State Guidelines

An empty collection is an onboarding opportunity, not an outage.

Use `UniversalEmptyState` when a module has no records. It provides:

- an accessible visual marker and concise explanation;
- a primary create/import action;
- a secondary demo action;
- tutorial and documentation links;
- optional dismissal persisted by workspace, user, and module.

Recommended first actions:

| Module | Primary action |
| --- | --- |
| Marketing / Creative / Growth | Create campaign or import assets |
| CRM | Create or import a lead |
| Inventory | Add or import inventory |
| Visits / Meetings | Schedule the first appointment |
| Knowledge | Create or upload trusted knowledge |
| Product Intelligence | Review setup and start collecting consented events |
| AI Workforce | Open an employee conversation |

Use an error state only when a real request failed because of authentication, permission, timeout, provider outage, or database failure. Error states must explain what happened, provide a safe retry or configuration path, and never expose stack traces or secrets.

Do not label these conditions “unavailable”:

- no records yet;
- first visit;
- optional integration not connected;
- feature requires onboarding;
- a governed action is awaiting user input.
