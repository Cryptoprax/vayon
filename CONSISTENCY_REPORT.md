# Consistency Report

| Area | Observed source inconsistency | Quick win / recommendation |
|---|---|---|
| Buttons | New/Create/Capture labels for equivalent creation jobs | Shared search/Create catalog now uses Create; property and lead headings match |
| Cards | Client cards showed eight speculative or unavailable metrics | Show actual company, owner and available email/phone; one Open client profile action |
| Forms | Property form exposes schema, ingestion and extension terminology | Plain broker labels and honest browser-only warnings; validation unchanged |
| Form purpose | Property step Publish only saves a property | Rename Save Property; no claim of publication |
| Tables/directories | Client/Contacts names differ between sidebar and page | Customer-facing directory now says Clients; domain contracts unchanged |
| Dialogs | Universal Bar has keyboard focus handling; campaign wizard has its own flow | Preserve existing dialogs; authenticated focus/zoom test still needed |
| Headers | Signup/login describe OS, tenants and governance | Explain properties, leads and daily work instead; authentication untouched |
| Spacing / typography | Existing VDS cards and focus styles mostly shared | Reuse current styles; no global token or layout redesign |
| Icons | Auth split panel used off-scale small icon sizes | Use existing approved size-4 icon convention |
| Loading | Existing route skeletons retained | No extra loaders, queries or hooks added |
| Errors | Campaign access service returned null into generic notFound | Existing SmartEmptyState now gives an Open Properties recovery path; upstream permission guard unchanged |
| Success / progress | Checklist percentage implied complete milestone knowledge | Remove percentage; show positive recorded activity and skippable suggestions |
| Empty states | Create Contact linked to the lead form | Clients empty state offers Import Clients, with Create Lead explicitly secondary |
| Navigation | CRM link actually opens Properties but did not say so | Expose direct destination under group label, without another link |

## Validation limits

Existing responsive/accessibility/commercial audits inspect source conventions, not every rendered contrast ratio, screen reader announcement or touch interaction. Public browser checks are recorded in QUICK_WINS_IMPLEMENTED.md. Protected forms, dialogs, record lists and empty states require a QA workspace. The ten-step property and six-step lead forms remain larger simplification candidates; do not remove fields or alter persistence as a cosmetic change.


Public Chromium smoke testing found one intermittent landing-page overflow at 320px; two isolated rechecks did not reproduce it. Signup/login had no overflow at 320/375/1440px. Record this as unresolved narrow-screen QA evidence, not a confirmed clean responsive audit.
