# Sprint 227 — Broken Route Certification

**Final state: Needs Verification**

Local navigation fixes and automated checks are complete. The entire customer navigation experience is **not certified**: an application URL was supplied, but no existing authenticated QA session file was supplied. Production workspace requests reached login. No authenticated customer page was marked Certified on that evidence.

## Evidence and validation

Evidence captured on 12 September 2026 (Asia/Kolkata; JSON timestamps use UTC).

| Check | Result | Evidence |
| --- | --- | --- |
| TypeScript | Passed | `test-results/routes/typecheck.log` |
| ESLint | Passed | `test-results/routes/eslint.log`, `redirect-script-lint.log` |
| Regression tests | 1,653 passed; 0 failed; 0 skipped | `test-results/routes/regression.log` |
| Production build | Passed | `test-results/routes/build.log` |
| Existing route integrity audit | 376 page/API route patterns cover 807 literal internal references | `test-results/routes/route-integrity.log` |
| Customer destination audit | 117 catalog entries resolve to page files; no source-resolution issues | `test-results/routes/static-audit.json` |
| Navigation, search, journey source audits | Passed | `test-results/routes/navigation.log`, `search.log`, `journey.log` |
| Accessibility and responsive source audits | Passed; not browser/device certification | `test-results/routes/accessibility.log`, `responsive.log` |
| Local built-app redirects | 10/10 returned HTTP 308 to expected canonical paths and preserved query parameters | `test-results/routes/redirect-audit.json` |
| Browser checker fixtures | Reject error boundaries, not-found screens, Coming Soon, persistent busy/skeleton states, and empty main content | `tests/customer-route-certification.test.mjs` and regression log |
| Production authenticated navigation | Needs Verification; no authenticated session | `test-results/routes/browser-audit.json` |

The stricter catalog audit covers 64 shell sidebar entries, 21 quick actions, and 32 secondary builder navigation entries. It resolves **page files**, rather than accepting API route handlers as pages, and checks the finite Creative and Growth compatibility catalogs. Source resolution does not establish tenant access, backend availability, record validity, or production readiness.

## Working routes: evidence boundaries

Public browser requests to `https://vayon.online/` and `/login` returned HTTP 200 after the site's canonical-host redirect. Requests to `/vayon/dashboard` and `/vayon/creative-studio/packs` ended at `/login` with HTTP 200. Those are authentication-gate observations, not proof that the requested workspace pages work.

All customer catalog destinations and their exact page files are listed below. Their authenticated runtime state remains Needs Verification. No missing page was detected in those catalogs. Conditional `notFound()` calls, licensed Creative availability screens, and record-specific destinations still require authenticated runtime checks.

## Redirected routes

The existing Next.js redirect catalog is reused. The new Campaign Packs compatibility redirect sends `/vayon/creative-studio/packs` directly to `/vayon/creative/campaigns`. Existing UI links to Creative Studio root, assets, templates, publishing calendar, wizard, and packs now use their canonical destinations. The secondary Workforce navigation link now uses `/vayon/ai/workforce`.

All ten configured redirects were exercised against the local production build using real HTTP requests. HTTP redirect behavior is Certified within that scope; destination rendering is not certified by a redirect response. The Creative dynamic compatibility map also now points directly to canonical destinations, removing the intermediate legacy hops.

## Removed and hidden navigation

- Removed the shell's Projects entry, which advertised legacy Campaign Packs as a project workflow. Existing bookmarks use the campaigns redirect.
- Removed Website navigation, which opened a campaign wizard rather than a website workflow.
- Removed Creative Cloud and Creative Pipelines from the shell. Their conditional early-access screens must not be advertised as customer workflows.
- Removed the Founder dashboard's Creative Cloud, Creative Runtime, and Creative Execution diagnostic links.
- Hid Website and Projects studio cards with misleading destinations; studio cards marked `foundation` are not exposed.
- Search and Quick Create exclude the known unfinished Creative Cloud, Pipelines, Runtime subtree, and landing-page destinations, including results under a broader permitted Creative parent.
- Search results and history selections use canonical redirect destinations. Existing role and visibility checks remain in place.
- Breadcrumb ancestors link only to known catalog destinations or existing CRM/Settings roots. Unknown intermediate path segments remain text instead of speculative links.

No page files were deleted. No placeholder or Coming Soon page was created. Legacy implementations remain where canonical pages import them. `/vayon/creative-studio/editor/[assetId]` is retained because it is an existing record editor with no replacement route. It was not rewritten to a nonexistent `/vayon/creative/editor/...` path.

## Legacy-reference and redirect audit

The source inventory scans `app`, `features`, and `config` for `creative-studio`, `packs`, and legacy/removed-route terminology. `static-audit.json` records file and line references, classifying implementation imports separately from route references and non-navigation names. It also inventories literal page redirects and the finite Creative alias map.

Remaining legacy strings include compatibility implementations/imports, valid editor links, permission prefixes, cache invalidation paths, and existing service/repository-provided aliases. These are not deleted pages. Canonicalization at the search presentation boundary handles legacy search destinations without changing repositories, services, or RBAC. No claim is made that every arbitrary runtime-generated URL has been verified.

## Automated click certification

Run the read-only browser audit against a running application containing these changes:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:3000'
$env:PLAYWRIGHT_AUTH_STATE = 'C:\path\to\existing-qa-session.json'
node scripts/certify-customer-navigation.mjs
```

The runner visits source pages, expands contextual sidebar disclosure, opens Quick Create, and **clicks actual rendered links** from navigation, breadcrumbs, quick actions, and page content. It revisits source pages before each click, traverses discovered navigation, and clicks real Universal Search result buttons for configurable queries (`ROUTE_SEARCH_QUERIES`). It does not submit business forms, invite users, or click session mutations.

Document HTTP errors, error-boundary/not-found/unfinished content, unhandled page errors, login redirection, persistent loading/skeletons, missing main content, click failures, and incomplete traversal fail the run. The crawl is bounded at 150 source pages and fails rather than silently passing if that limit is reached. Missing authentication produces Needs Verification and exit code 1, not a skipped/pass result.

A successful authenticated run certifies only that session's discovered links and sampled search results. Other roles, contextual navigation that was not discovered, mobile-only surfaces, arbitrary record matches, hash anchors, downloads, and unannotated navigation buttons require separate coverage. The current production probe discovered no authenticated links, so it provides no click certification for workspace navigation.

The separate local redirect check is:

```powershell
npm.cmd run start -- --hostname 127.0.0.1 --port 3227
# In another terminal:
node scripts/certify-route-redirects.mjs
```

## Remaining blockers

1. Supply an existing authenticated QA storage-state file for each role/tenant to be certified. The supplied production URL alone does not grant workspace access.
2. Run the click audit against this working tree's build. These changes were not deployed, so the production site cannot prove the local fixes are installed.
3. Verify conditional Creative licensing/availability, Growth pages, owner/admin/manager/agent visibility, and contextual AI navigation in their real sessions. Source `notFound()` guards are not proof of either a broken route or a working workflow.
4. Exercise dynamic record results with valid, deleted, and inaccessible record fixtures; inspect rendered dashboard actions and role-specific menus. The source catalog cannot certify those runtime branches.
5. Complete browser-based responsive/accessibility and commercial-readiness review of authenticated pages. The passing source audits are not substitutes for those checks.

No commit. No deployment. No schemas, authentication, RBAC, repositories, or services changed. No additional application data queries or fetching were introduced; changes are navigation targets and presentation filtering. No measured production performance claim is made.

## Complete destination inventory

| Surface / group | Item | Destination | Page implementation | Runtime |
| --- | --- | --- | --- | --- |
| Today's work | Dashboard | `/vayon/dashboard` | `app/vayon/dashboard/page.tsx` | Needs Verification |
| Sell & follow up | Properties | `/vayon/properties` | `app/vayon/properties/page.tsx` | Needs Verification |
| Sell & follow up | Leads | `/vayon/leads` | `app/vayon/leads/page.tsx` | Needs Verification |
| Sell & follow up | Clients | `/vayon/crm/contacts` | `app/vayon/crm/contacts/page.tsx` | Needs Verification |
| Sell & follow up | Companies | `/vayon/crm/companies` | `app/vayon/crm/companies/page.tsx` | Needs Verification |
| Sell & follow up | Deals | `/vayon/deals` | `app/vayon/deals/page.tsx` | Needs Verification |
| Sell & follow up | Inbox | `/vayon/notifications` | `app/vayon/notifications/page.tsx` | Needs Verification |
| Sell & follow up | Schedule Viewing | `/vayon/site-visits` | `app/vayon/site-visits/page.tsx` | Needs Verification |
| Sell & follow up | Calendar | `/vayon/calendar` | `app/vayon/calendar/page.tsx` | Needs Verification |
| Sell & follow up | Tasks | `/vayon/tasks` | `app/vayon/tasks/page.tsx` | Needs Verification |
| Sell & follow up | Timeline | `/vayon/timeline` | `app/vayon/timeline/page.tsx` | Needs Verification |
| Sell & follow up | Communications | `/vayon/communications` | `app/vayon/communications/page.tsx` | Needs Verification |
| Market properties | Campaigns | `/vayon/creative/campaigns` | `app/vayon/creative/campaigns/page.tsx` | Needs Verification |
| Market properties | Create marketing assets | `/vayon/creative` | `app/vayon/creative/page.tsx` | Needs Verification |
| Market properties | Brand assets | `/vayon/creative/brand` | `app/vayon/creative/brand/page.tsx` | Needs Verification |
| Market properties | Image | `/vayon/creative/images` | `app/vayon/creative/images/page.tsx` | Needs Verification |
| Market properties | Video | `/vayon/creative/videos` | `app/vayon/creative/videos/page.tsx` | Needs Verification |
| Market properties | Document | `/vayon/creative/documents` | `app/vayon/creative/documents/page.tsx` | Needs Verification |
| Market properties | Marketing assets | `/vayon/creative/assets` | `app/vayon/creative/assets/page.tsx` | Needs Verification |
| Market properties | Templates | `/vayon/creative/templates` | `app/vayon/creative/templates/page.tsx` | Needs Verification |
| Market properties | Publishing calendar | `/vayon/creative/calendar` | `app/vayon/creative/calendar/page.tsx` | Needs Verification |
| Market properties | Marketing Performance | `/vayon/growth` | `app/vayon/growth/page.tsx` | Needs Verification |
| Market properties | Lead Generation | `/vayon/growth/lead-generation` | `app/vayon/growth/[section]/page.tsx` | Needs Verification |
| Market properties | Buyer Intelligence | `/vayon/growth/buyer-intelligence` | `app/vayon/growth/[section]/page.tsx` | Needs Verification |
| Market properties | Seller Intelligence | `/vayon/growth/seller-intelligence` | `app/vayon/growth/[section]/page.tsx` | Needs Verification |
| Market properties | Property SEO | `/vayon/growth/property-seo` | `app/vayon/growth/[section]/page.tsx` | Needs Verification |
| Market properties | Referral Network | `/vayon/growth/referral-network` | `app/vayon/growth/[section]/page.tsx` | Needs Verification |
| Market properties | Market Intelligence | `/vayon/growth/market-intelligence` | `app/vayon/growth/[section]/page.tsx` | Needs Verification |
| AI Assistant | AI Assistant | `/vayon/intelligence` | `app/vayon/intelligence/page.tsx` | Needs Verification |
| AI Assistant | My AI Team | `/vayon/ai/workforce` | `app/vayon/ai/workforce/page.tsx` | Needs Verification |
| AI Assistant | Today's AI Tasks | `/vayon/ai/work-queue` | `app/vayon/ai/work-queue/page.tsx` | Needs Verification |
| AI Assistant | Suggestions | `/vayon/ai/collaboration` | `app/vayon/ai/collaboration/page.tsx` | Needs Verification |
| AI Assistant | Automations | `/vayon/ai/automations` | `app/vayon/ai/automations/page.tsx` | Needs Verification |
| AI Assistant | Approvals | `/vayon/approvals` | `app/vayon/approvals/page.tsx` | Needs Verification |
| AI Assistant | AI Goals | `/vayon/ai/goals` | `app/vayon/ai/goals/page.tsx` | Needs Verification |
| AI Assistant | History | `/vayon/ai/history` | `app/vayon/ai/history/page.tsx` | Needs Verification |
| AI Assistant | Workflow templates | `/vayon/workflows` | `app/vayon/workflows/page.tsx` | Needs Verification |
| Understand performance | Analytics | `/vayon/analytics` | `app/vayon/analytics/page.tsx` | Needs Verification |
| Understand performance | Performance | `/vayon/analytics/sales` | `app/vayon/analytics/sales/page.tsx` | Needs Verification |
| Understand performance | Revenue & Forecasting | `/vayon/analytics/executive` | `app/vayon/analytics/executive/page.tsx` | Needs Verification |
| Understand performance | Listing Performance | `/vayon/growth/listing-performance` | `app/vayon/growth/[section]/page.tsx` | Needs Verification |
| Understand performance | Marketing Analytics | `/vayon/growth/marketing-analytics` | `app/vayon/growth/[section]/page.tsx` | Needs Verification |
| Understand performance | Advertising Performance | `/vayon/growth/advertising-performance` | `app/vayon/growth/[section]/page.tsx` | Needs Verification |
| Understand performance | Social Performance | `/vayon/growth/social-performance` | `app/vayon/growth/[section]/page.tsx` | Needs Verification |
| Understand performance | Reports | `/vayon/growth/reports` | `app/vayon/growth/[section]/page.tsx` | Needs Verification |
| Configure workspace | Workspace | `/vayon/settings/organization` | `app/vayon/settings/organization/page.tsx` | Needs Verification |
| Configure workspace | Team Members | `/vayon/settings/members` | `app/vayon/settings/members/page.tsx` | Needs Verification |
| Configure workspace | Integrations | `/vayon/settings/integrations` | `app/vayon/settings/integrations/page.tsx` | Needs Verification |
| Configure workspace | Billing | `/vayon/settings/billing` | `app/vayon/settings/billing/page.tsx` | Needs Verification |
| Configure workspace | Preferences | `/vayon/settings/appearance` | `app/vayon/settings/appearance/page.tsx` | Needs Verification |
| Configure workspace | Workflow Designer | `/platform/founder/workflows` | `app/platform/founder/workflows/page.tsx` | Needs Verification |
| Configure workspace | Platform Analytics | `/platform/system-analytics` | `app/platform/system-analytics/page.tsx` | Needs Verification |
| Configure workspace | Investor Relations | `/vayon/growth/investor-relations` | `app/vayon/growth/[section]/page.tsx` | Needs Verification |
| Configure workspace | Platform Marketing | `/platform/founder/marketing` | `app/platform/founder/marketing/page.tsx` | Needs Verification |
| Configure workspace | Product Intelligence | `/vayon/settings/product-intelligence` | `app/vayon/settings/product-intelligence/page.tsx` | Needs Verification |
| Configure workspace | AI Playground | `/vayon/ai/playground` | `app/vayon/ai/playground/page.tsx` | Needs Verification |
| Configure workspace | Feature Flags | `/platform/feature-flags` | `app/platform/feature-flags/page.tsx` | Needs Verification |
| Configure workspace | Enterprise Management | `/platform/organizations` | `app/platform/organizations/page.tsx` | Needs Verification |
| Configure workspace | Platform Settings | `/platform/settings` | `app/platform/settings/page.tsx` | Needs Verification |
| Configure workspace | Founder Approval Center | `/vayon/founder/approvals` | `app/vayon/founder/approvals/page.tsx` | Needs Verification |
| Configure workspace | Customer Success | `/vayon/customer-success` | `app/vayon/customer-success/page.tsx` | Needs Verification |
| Configure workspace | Knowledge Engine | `/vayon/knowledge` | `app/vayon/knowledge/page.tsx` | Needs Verification |
| Configure workspace | Administration | `/vayon/admin` | `app/vayon/admin/page.tsx` | Needs Verification |
| Configure workspace | System Diagnostics | `/vayon/system` | `app/vayon/system/page.tsx` | Needs Verification |
| quick action | Export Report | `/vayon/analytics/executive` | `app/vayon/analytics/executive/page.tsx` | Needs Verification |
| quick action | Generate Brochure | `/vayon/creative/documents` | `app/vayon/creative/documents/page.tsx` | Needs Verification |
| quick action | Invite Team Members | `/vayon/settings/members` | `app/vayon/settings/members/page.tsx` | Needs Verification |
| quick action | Schedule Viewing | `/vayon/site-visits` | `app/vayon/site-visits/page.tsx` | Needs Verification |
| quick action | Send WhatsApp | `/vayon/communications` | `app/vayon/communications/page.tsx` | Needs Verification |
| quick action | Create Lead | `/vayon/leads/new` | `app/vayon/leads/new/page.tsx` | Needs Verification |
| quick action | Create Deal | `/vayon/deals/new` | `app/vayon/deals/new/page.tsx` | Needs Verification |
| quick action | Create Property | `/vayon/properties/new` | `app/vayon/properties/new/page.tsx` | Needs Verification |
| quick action | Create Campaign | `/vayon/creative/campaigns` | `app/vayon/creative/campaigns/page.tsx` | Needs Verification |
| quick action | Create Meeting | `/vayon/meetings` | `app/vayon/meetings/page.tsx` | Needs Verification |
| quick action | Create Task | `/vayon/tasks` | `app/vayon/tasks/page.tsx` | Needs Verification |
| quick action | Clients | `/vayon/crm/contacts` | `app/vayon/crm/contacts/page.tsx` | Needs Verification |
| quick action | Create Company | `/vayon/crm/companies/new` | `app/vayon/crm/companies/new/page.tsx` | Needs Verification |
| quick action | Create Document | `/vayon/creative/documents` | `app/vayon/creative/documents/page.tsx` | Needs Verification |
| quick action | Generate Image | `/vayon/creative/images` | `app/vayon/creative/images/page.tsx` | Needs Verification |
| quick action | Generate Video | `/vayon/creative/videos` | `app/vayon/creative/videos/page.tsx` | Needs Verification |
| quick action | Create AI Employee | `/onboarding/ai-workforce` | `app/onboarding/[setup]/page.tsx` | Needs Verification |
| quick action | Create Workflow | `/vayon/workflows` | `app/vayon/workflows/page.tsx` | Needs Verification |
| quick action | Run Workflow | `/vayon/workflows` | `app/vayon/workflows/page.tsx` | Needs Verification |
| quick action | Duplicate Workflow | `/vayon/workflows` | `app/vayon/workflows/page.tsx` | Needs Verification |
| quick action | Search Workflow | `/vayon/workflows` | `app/vayon/workflows/page.tsx` | Needs Verification |
| builder navigation | Dashboard | `/vayon/dashboard` | `app/vayon/dashboard/page.tsx` | Needs Verification |
| builder navigation | Properties | `/vayon/properties` | `app/vayon/properties/page.tsx` | Needs Verification |
| builder navigation | Leads | `/vayon/leads` | `app/vayon/leads/page.tsx` | Needs Verification |
| builder navigation | Transactions | `/vayon/deals` | `app/vayon/deals/page.tsx` | Needs Verification |
| builder navigation | Clients | `/vayon/crm/contacts` | `app/vayon/crm/contacts/page.tsx` | Needs Verification |
| builder navigation | Agencies / Builders | `/vayon/crm/companies` | `app/vayon/crm/companies/page.tsx` | Needs Verification |
| builder navigation | Developers | `/vayon/crm/companies` | `app/vayon/crm/companies/page.tsx` | Needs Verification |
| builder navigation | Communities | `/vayon/properties/map` | `app/vayon/properties/map/page.tsx` | Needs Verification |
| builder navigation | Locations | `/vayon/properties/map` | `app/vayon/properties/map/page.tsx` | Needs Verification |
| builder navigation | Agents | `/vayon/analytics/sales` | `app/vayon/analytics/sales/page.tsx` | Needs Verification |
| builder navigation | Documents | `/vayon/storage` | `app/vayon/storage/page.tsx` | Needs Verification |
| builder navigation | Operations | `/vayon/operations` | `app/vayon/operations/page.tsx` | Needs Verification |
| builder navigation | Calendar | `/vayon/calendar` | `app/vayon/calendar/page.tsx` | Needs Verification |
| builder navigation | Tasks | `/vayon/tasks` | `app/vayon/tasks/page.tsx` | Needs Verification |
| builder navigation | Communications | `/vayon/communications` | `app/vayon/communications/page.tsx` | Needs Verification |
| builder navigation | AI Workforce | `/vayon/ai` | `app/vayon/ai/page.tsx` | Needs Verification |
| builder navigation | Universal Objects | `/vayon/objects` | `app/vayon/objects/page.tsx` | Needs Verification |
| builder navigation | AI Assistant | `/vayon/intelligence` | `app/vayon/intelligence/page.tsx` | Needs Verification |
| builder navigation | Brain | `/vayon/brain` | `app/vayon/brain/page.tsx` | Needs Verification |
| builder navigation | Cognitive | `/vayon/cognitive` | `app/vayon/cognitive/page.tsx` | Needs Verification |
| builder navigation | Workforce | `/vayon/ai/workforce` | `app/vayon/ai/workforce/page.tsx` | Needs Verification |
| builder navigation | Runtime | `/vayon/runtime` | `app/vayon/runtime/page.tsx` | Needs Verification |
| builder navigation | Growth | `/vayon/growth` | `app/vayon/growth/page.tsx` | Needs Verification |
| builder navigation | Marketing | `/vayon/creative` | `app/vayon/creative/page.tsx` | Needs Verification |
| builder navigation | Business Timeline | `/vayon/timeline` | `app/vayon/timeline/page.tsx` | Needs Verification |
| builder navigation | Unified Context | `/vayon/context` | `app/vayon/context/page.tsx` | Needs Verification |
| builder navigation | Configuration | `/vayon/settings/configuration` | `app/vayon/settings/configuration/page.tsx` | Needs Verification |
| builder navigation | Appearance | `/vayon/settings/appearance` | `app/vayon/settings/appearance/page.tsx` | Needs Verification |
| builder navigation | Billing | `/vayon/settings/billing` | `app/vayon/settings/billing/page.tsx` | Needs Verification |
| builder navigation | Organization | `/vayon/settings/organization` | `app/vayon/settings/organization/page.tsx` | Needs Verification |
| builder navigation | Members | `/vayon/settings/members` | `app/vayon/settings/members/page.tsx` | Needs Verification |
| builder navigation | Team | `/vayon/team` | `app/vayon/team/page.tsx` | Needs Verification |

## Redirect runtime inventory

| Legacy source | Canonical destination | Local HTTP result |
| --- | --- | --- |
| `/vayon/workforce` | `/vayon/ai/workforce` | 308; query preserved; Certified (redirect only) |
| `/vayon/ai/employees` | `/vayon/ai/workforce` | 308; query preserved; Certified (redirect only) |
| `/vayon/crm/leads` | `/vayon/leads` | 308; query preserved; Certified (redirect only) |
| `/vayon/notifications/inbox` | `/vayon/notifications` | 308; query preserved; Certified (redirect only) |
| `/vayon/creative-studio` | `/vayon/creative` | 308; query preserved; Certified (redirect only) |
| `/vayon/creative-studio/assets` | `/vayon/creative/assets` | 308; query preserved; Certified (redirect only) |
| `/vayon/creative-studio/templates` | `/vayon/creative/templates` | 308; query preserved; Certified (redirect only) |
| `/vayon/creative-studio/calendar` | `/vayon/creative/calendar` | 308; query preserved; Certified (redirect only) |
| `/vayon/creative-studio/wizard` | `/vayon/creative/campaigns` | 308; query preserved; Certified (redirect only) |
| `/vayon/creative-studio/packs` | `/vayon/creative/campaigns` | 308; query preserved; Certified (redirect only) |

## Every modified or added file

The following inventory includes source, tests, this report, and generated evidence. No pre-existing user changes were present when this task started.

- `BROKEN_ROUTE_CERTIFICATION.md`
- `app/vayon/creative-studio/assistant/page.tsx`
- `app/vayon/creative-studio/error.tsx`
- `app/vayon/creative/[studio]/page.tsx`
- `config/canonical-routes.ts`
- `features/platform/builder/config/vayon-navigation.ts`
- `features/platform/founder/components/FounderDashboard.tsx`
- `features/platform/marketing-director/components/MarketingDirectorDashboard.tsx`
- `features/vayon/adaptive-workspace/AdaptiveWorkspace.tsx`
- `features/vayon/creative-cloud/catalog.ts`
- `features/vayon/creative-studio-2/CreativeStudioHome.tsx`
- `features/vayon/creative-studio/components/StudioViews.tsx`
- `features/vayon/growth-intelligence/catalog.ts`
- `features/vayon/intelligence-core/module-registry.ts`
- `features/vayon/product-shell/Breadcrumbs.tsx`
- `features/vayon/product-shell/QuickCreate.tsx`
- `features/vayon/product-shell/navigation.ts`
- `features/vayon/universal-bar/actions/search.actions.ts`
- `features/vayon/universal-bar/components/UniversalBar.tsx`
- `features/vayon/universal-bar/providers/static-navigation.provider.ts`
- `scripts/audit-customer-routes.mjs`
- `scripts/audit-product-unification.mjs`
- `scripts/certify-customer-navigation.mjs`
- `scripts/certify-route-redirects.mjs`
- `test-results/routes/accessibility.log`
- `test-results/routes/browser-audit.json`
- `test-results/routes/build.log`
- `test-results/routes/eslint.log`
- `test-results/routes/journey.log`
- `test-results/routes/navigation.log`
- `test-results/routes/production-probe.log`
- `test-results/routes/redirect-audit.json`
- `test-results/routes/redirect-script-lint.log`
- `test-results/routes/redirects.log`
- `test-results/routes/regression.log`
- `test-results/routes/responsive.log`
- `test-results/routes/route-integrity.log`
- `test-results/routes/search.log`
- `test-results/routes/source-audit.log`
- `test-results/routes/static-audit.json`
- `test-results/routes/typecheck.log`
- `tests/customer-route-certification.test.mjs`
- `tests/sprint101-ai-marketing-director.test.mjs`
- `tests/sprint171-onboarding-route-integrity.test.mjs`
- `tests/sprint84-1-marketing-studio-production.test.mjs`
- `tests/workforce-mvp.test.mjs`
