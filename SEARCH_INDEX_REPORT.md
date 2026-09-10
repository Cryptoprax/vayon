# Search Index Report

One Universal Bar, the existing provider-neutral search, existing intent parsing, and Sprint 218 command routing are reused. No second command engine or database index was introduced.

| Category | Source | Result behavior / limits |
|---|---|---|
| Pages/settings/reports | Permission-filtered shell catalog | Canonical navigation results; no database request |
| Actions | Existing quick-create catalog | Shared by global Create and Universal Bar; matches multiple words |
| Workflows | Sprint 218 command router | Brochure, logo, landing page, call buyer, follow-up and reports prepare a workflow; never execute on search |
| Properties/leads | Existing PropertyService / LeadService | Query-aware tenant list, five results each |
| Clients/companies | Existing CrmCompanyService | Existing contact/company queries, five results each |
| Deals | Existing DealService | Existing full list read, server-side matching, five returned |
| Tasks/calendar | Existing CalendarService | Existing combined list read, five matches; opens list workspace, not a new detail route |
| Campaigns/creative/brand assets | Existing CreativeStudioService | Existing snapshot and access gates; asset opens editor; campaign/brand opens workspace |
| Templates | Existing template catalog via Creative snapshot | Template navigation match, not a fabricated tenant record |
| AI employees | Existing SupabaseWorkforceRepository | Existing employee read only; no AI runtime/observability call |
| Approvals | Existing page/action | Record search deliberately omitted: current governance projection is process-local, not tenant-authoritative |
| Recent/frequent/pinned/favorites | Existing local history store | Namespaced by user/workspace, measured visit counts; no telemetry upload |
| AI suggestions | Existing adaptive suggestions and router | Suggestions remain navigation/preparation, not generated business facts |

## Request behavior

Live search runs only while the bar is open, in search mode, after two characters and a 350ms debounce. Queries are capped at 100 characters; filter metacharacters are removed before existing PostgREST list methods. Stale responses are ignored. Closing the palette cancels the scheduled request, though an already-running Server Action cannot be aborted. Authentication, role permission and visibility checks run server-side before record reads. Individual source failures produce partial-search guidance. Demo providers remain separate and do not trigger live search.

## Performance and certification limits

Page/action/command matching is local. Live search adds existing-service reads on demand. Deal/calendar/creative list contracts are not paginated search contracts, and company/contact methods can perform related-name reads. No production latency or tenant-scale benchmark has been run. Campaign/brand/task/calendar results open their existing workspace rather than selecting an individual row. A future bounded search contract requires separate repository work; none was created in this sprint.

Navigation, multi-word matching, forbidden-action filtering, routing and history isolation have executable tests in tests/vayon3-product-unification.test.mjs. Authenticated record correctness, cross-tenant RLS and browser result opening still require QA fixtures.
