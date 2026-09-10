# Workflow Simplification

## Implemented

- Customer shell: six primary jobs, active-context children, one catalog shared by search and sidebar; role filters remain in place.
- Dashboard: preserve Executive Overview, primary command-center summary, checklist, pipeline/chart and daily operational widgets. Remove repeated AI prompt bar, extra briefing, secondary intelligence grid, standalone contextual-AI grid, duplicate work queue and bottom quick actions from dashboard composition. Existing components and destination modules remain intact.
- CRM and workforce: remove duplicate module-wide navigation bars now owned by the shared sidebar.
- Global Create: reuse the Universal Bar quick-create catalog; fix client/company/campaign destinations and stop labeling a directory as a create form.
- Contextual AI: property, lead, client, company and deal share one component and Sprint 218 router. Show three suggested actions and progressively disclose the remaining actions. Keep record ID, label and approval-required indicators.
- Search: customer wording, focus containment, live CRM lookup, workflow preparation, permission-filtered results, scoped recent/frequent history.
- Creative: resolve three pre-existing compatibility loops by rendering the existing implementation at canonical URLs.

## Retained intentionally

The feature and workflow implementations, underlying repositories, database, authentication, RBAC, subscriptions and AI runtime are unchanged. Compatibility and internal routes remain reachable under their existing permissions. No supposedly unused page was deleted without proof of non-use.

## Page-by-page audit limits

PRODUCT_ARCHITECTURE_AUDIT.md and PRODUCT_ROUTE_INVENTORY.json enumerate every page and its composed components. Source scanning cannot establish that every runtime page has exactly one primary action, that every button is useful, or that every journey is uninterrupted. Existing module-level internal terminology and multi-action screens outside the shared surfaces remain a review backlog, not certified fixes.

## Remaining work before acceptance

1. Resolve customer access policy for Creative/AI with product and security owners; this sprint forbids RBAC changes.
2. Connect authoritative approval records before enabling approval record search.
3. Project trustworthy onboarding milestone completion before claiming end-to-end setup progress.
4. Validate all page primary actions and empty states with a signed-in QA workspace; resolve actual dead ends observed there.
5. Benchmark live search using large tenant fixtures; its existing full-list contracts impose scaling limits.
6. Validate Website production/publishing capability; its compatibility path currently leads to campaign planning, not an independent publication workflow.
