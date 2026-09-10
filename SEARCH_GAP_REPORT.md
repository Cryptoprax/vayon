# Search Gap Report

## Implemented behavior

?Create Property? returns the existing Create Property action first, linking to /vayon/properties/new. Create/New/Add query wording is normalized for ranking. The existing search service ranks exact actions above page/document matches and deduplicates navigation/action destinations. Distinct records sharing a list URL remain separate. The existing provider engine, Sprint 218 command routing, server action and permission gates are unchanged.

| Requested content | Current coverage | Remaining gap |
|---|---|---|
| Pages | Shared permitted navigation catalog | Does not index every hidden route or documentation page |
| Actions | Existing quick-create catalog and routed commands | Some different verbs open the same workflow workspace; no automatic execution |
| Properties / leads | Existing live tenant list search and demo providers | Authenticated data/latency not tested here |
| Clients / companies | Existing CRM search | Clients have no standalone create form; directory and import must not be called Create Client |
| Deals | Existing tenant list | Full-list contract before matching |
| Tasks / calendar | Existing calendar entries | Result opens existing list, not a selected row |
| Campaigns / creative assets | Existing creative snapshot | Access gated; campaign opens workspace, asset opens editor |
| Templates / brand assets | Existing catalog and brand snapshot | Template is navigation, not a fabricated tenant record; brand opens workspace |
| Approvals | Page and workflow navigation | No authoritative tenant approval record provider; process-local governance must not be indexed as live tenant data |
| Settings / reports | Permitted pages | Role visibility can remove results |
| AI commands | Existing Sprint 218 router | Opens review workflow, often leaves original record page; context must be validated at destination |
| Recent / frequently used | Existing user/workspace-scoped history | Frequent items derive from recorded visits; no synthetic recommendations |

## Regressions covered

Tests verify Create Property outranks a same-named documentation result, Create/New/Add variants work, forbidden actions remain absent, and de-duplication retains distinct task records. Existing history isolation tests remain in place. No added queries, polling, index or API in this phase. Sorting cost is local O(n log n) over the existing result set.

## Outstanding research

Measure first-result relevance for real broker names, addresses, spelling variants and multilingual text using tenant-safe fixtures. Test selection during slow responses, focus movement, history after switching workspaces and partial service failure. Full-text/fuzzy search and new repository contracts are outside this quick-win phase.

