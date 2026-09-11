# Sprint 228 — Marketing Workflow Certification

**Final state: Needs Verification**

The identified marketing navigation defects are corrected locally. Production marketing workflows are not certified. The supplied production URL is `https://vayon.online`; no existing authenticated QA session file was supplied. All 15 marketing entry routes tested in production ended at login. No live campaign was created, no provider generation was invoked, and no publishing action was performed.

## Main finding and correction

The canonical `/vayon/creative/campaigns` page mounted a seven-step prototype whose final **Save campaign blueprint** button was permanently disabled. A route-existence check therefore passed while the customer workflow could never save.

That page now reuses the existing five-step `CampaignWizard` from `creative-studio/components/StudioViews.tsx`. Its existing action calls `CreativeStudioService.saveDraft`, the existing repository, and the existing `create_creative_campaign_draft` RPC. No replacement campaign system, service, repository, schema, or API was created.

The action now waits for the existing save operation before revalidating the canonical pages and returning to the Creative workspace with the existing success feedback. A failed save returns to Campaigns with existing error feedback instead of throwing into the workspace error boundary. The old prototype remains in source but is no longer mounted by the Campaigns page.

The repository-wide inventory also found two computed links to nonexistent `/vayon/marketing`: one in the marketing conversation panel and one in the employee's related-workspace link. Both now point to `/vayon/growth`. The audit now fails on unresolved literal marketing routes even when the string appears in a computed return value rather than a literal `href` attribute. Only these two destination strings changed in those components; AI behavior was not changed.

## Working and connected CTAs

“Connected” below means the implementation is wired to an existing workflow. It does not mean production persistence or provider execution was certified.

| Surface / CTA | Category | Existing destination / behavior | Evidence |
| --- | --- | --- | --- |
| Marketing Performance: Prepare a campaign | A — connect | `/vayon/creative/campaigns`, directly displaying the existing saving wizard | Rendered component/browser fixture and source |
| Marketing Performance: Create marketing materials | A — connect | `/vayon/creative`, the existing Creative workspace | Rendered component/browser fixture; Creative response in fixture is a route stub |
| Marketing Performance: Plan lead generation | A — existing | `/vayon/growth/lead-generation` | Source route and page inventory |
| Lead Generation: Create a property campaign | A — reconnect | `/vayon/creative/campaigns`, replacing the generic Creative destination | Rendered component and source |
| Founder Growth Campaigns: Plan a campaign | A — reconnect | `/vayon/creative/campaigns` | Source |
| Brand Assets: Open brand kits | B — canonical replacement | `/vayon/creative/brand` | Source and real local HTTP redirect |
| Property SEO: Review property pages | A — existing | `/vayon/properties` | Source |
| Referral Network: Review agencies and partners | A — existing | `/vayon/crm/companies` | Source |
| Buyer Intelligence: Review buyer leads | A — existing | `/vayon/leads` | Source |
| Seller Intelligence: Review seller pipeline | A — existing | `/vayon/leads` | Source |
| Campaign Wizard: Generate governed draft | A — existing action | Existing draft service/repository/RPC, followed by Creative success feedback | Action test with mocked persistence boundary; live RPC not exercised |
| Creative brief: Continue in studio | A — continue | Existing intent-selected studio | Source; renamed from “Begin execution” because this button navigates rather than executes generation |
| Studio navigation | A — existing | Creative Workspace, Create Campaign, Assets, Brand Studio, Analytics | Source; duplicate destinations removed |

Growth evaluates the existing visibility policy and Creative access service before exposing Creative/Campaign actions. An unavailable marketing action becomes non-clickable text: **Continue when Campaigns become available**. Other denied Growth actions are also not rendered as buttons. These checks reuse existing access rules; no role grants were changed.

Campaigns with no accessible inventory projects display a non-clickable prerequisite message instead of an impossible empty project selector. No “create project” route was invented: the existing inventory projects page is not evidence of a working project-creation flow. A workspace without project inventory still needs prerequisite setup; that end-to-end onboarding branch is not certified.

## Hidden / removed CTAs

| CTA or entry | Category | Action |
| --- | --- | --- |
| Seven-step Campaign Studio prototype and disabled final save | C — unfinished | Removed from the canonical page's render path; existing code retained |
| Templates sidebar entry, Featured Templates cards, Browse Templates links, Template studio card | C/D — no usable template workflow | Hidden/removed from customer entry points; the old page only listed generated category cards without a use/edit action |
| Publishing calendar marketing sidebar entry | D — future workflow | Hidden; existing calendar implementation explicitly says publishing is future-only and execution disabled |
| Legacy template/calendar search, favorites and quick-action destinations | C/D | Existing route-exposure filter now canonicalizes aliases before applying the hidden-route check |
| Landing Page quick action in Creative | D — unsupported destination | Removed; it previously prepared a brief that led to Campaign Studio, not a landing-page workflow |
| Duplicate Campaign Packs / Campaign Wizard links in Studio navigation | B/C | Replaced by one Create Campaign destination |
| Legacy AI Growth Studio, assistant, template, calendar and analytics entries in Studio navigation | B/C | Removed from this navigation surface; retained implementations were not deleted |
| Recent campaign cards pretending to reopen a campaign | C — missing continuation | Removed click behavior; actual campaign information remains visible as non-clickable cards |
| Document Studio's permanently disabled Redo button | C — unfinished control | Removed; existing Undo behavior retained |

## Redirects and legacy routes

Added `/vayon/creative-studio/brand-kits` → `/vayon/creative/brand` and `/vayon/marketing` → `/vayon/growth` to the existing Next.js redirect catalog. The eight marketing redirects in that catalog returned **HTTP 308**, pointed directly to their expected canonical destinations, and preserved `goal=QA` against the local production build. This certifies redirect responses only, not destination rendering or business operations.

No route files were deleted. Wizard, packs, assets, template/calendar and Creative compatibility implementations remain where existing imports or bookmarks need them. Valid asset-editor routes under `/vayon/creative-studio/editor/[assetId]` remain because no replacement editor route exists.

No active literal legacy link remains in the edited Growth/Studio navigation surfaces. Remaining repository-wide legacy references include implementation imports, permission prefixes, cache invalidation, and existing service/repository-generated aliases. These were inventoried, not blindly deleted; existing redirects and presentation canonicalization resolve them. Documentation and historical tests retain legacy terminology for historical accuracy.

## Route and control inventory

`test-results/marketing/source-inventory.json` contains:

- 769 repository files matching campaign/campaigns, creative, packs, marketing, brief, or creative-studio at the time of the scan, with matching line numbers.
- 184 literal marketing route references, their canonical targets, matching page files, and exposure state. All resolve to page files after the fixes.
- 102 JSX control declarations across Growth, Creative, Campaign, Brand, Image, Video and Document sources, with file/line, label, route/action expression and disabled state.
- All 22 Growth-section primary CTAs, including founder sections.

The scan includes tracked and untracked non-ignored source/documentation/configuration/SQL files. Dependencies, generated build output, binaries and test-result artifacts are excluded. Dynamic expressions and unmounted prototype controls are included as review items where discoverable; this is not a claim that every runtime instance or provider response was enumerated. The number of control declarations is not a count of visible customer buttons.

## Automated crawl

Run against a running build with an existing QA session:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:3000'
$env:PLAYWRIGHT_AUTH_STATE = 'C:\path\to\existing-qa-session.json'
node scripts/certify-marketing-workflows.mjs
```

The runner seeds Growth/Marketing Performance, Creative, Campaigns and all customer Growth sections. With authentication, it clicks actual visible main-content links and annotated navigation buttons, follows discovered marketing destinations, checks navigation timeouts, and detects HTTP 404/500, missing/error-boundary/unfinished content, persistent loading and unhandled page errors. It inventories form and button controls without submitting business mutations. The 100-page cap fails incomplete traversal instead of silently passing.

Without authentication, it records the signed-out observations and exits 1 with Needs Verification. It never treats login's HTTP 200 as a working marketing page. Save/generate/upload/publish controls and modal behavior require separate authorized QA interaction tests. The runner deliberately does not label the whole marketing experience Certified based on a read-only crawl.

`tests/marketing-workflow-certification.test.mjs` adds five checks:

1. Growth route resolution and selection of the persistence-backed wizard.
2. Canonical CTAs and non-clickable unavailable states.
3. Real wizard form rendering, initial goal propagation, missing-project and missing-access states.
4. Save-before-success sequencing and failure recovery with a mocked service boundary.
5. Real browser clicks on server-rendered Growth components, reaching the existing wizard form and the Creative route fixture.

These fixtures prove local wiring and behavior in isolation. They are not Supabase, RBAC, provider or production certification.

## Validation

| Check | Result | Evidence |
| --- | --- | --- |
| TypeScript | Passed | `test-results/marketing/typecheck.log` |
| ESLint | Passed | `test-results/marketing/eslint.log` |
| Regression tests | 1,658 passed, 0 failed, 0 skipped | `test-results/marketing/regression.log` |
| Production build | Passed | `test-results/marketing/build.log` |
| Marketing source audit | 22 Growth CTAs resolved; no source-audit issues | `test-results/marketing/source-audit.log` |
| Existing route audit | 376 route patterns cover 807 static internal references | `test-results/marketing/route-integrity.log` |
| Navigation source audit | Passed | `test-results/marketing/navigation.log` |
| Accessibility / responsive source audits | Passed; not authenticated browser certification | `test-results/marketing/accessibility.log`, `responsive.log` |
| Local marketing redirects | 8/8 passed | `test-results/marketing/redirect-audit.json` |
| Production crawl | 15 routes ended at `/login`; no authenticated CTA clicked | `test-results/marketing/browser-audit.json`, `production-crawl.log` |

## Remaining blockers and verification needs

1. **Authenticated production evidence:** existing QA session files and role/tenant fixtures are missing. Owner/admin/manager/agent behavior, actual provider availability, and record destinations remain unverified.
2. **Live campaign persistence:** the save action was tested through a mocked service boundary, not through a live database. Verify the campaign row, workspace, role, feedback, refresh and subsequent Creative listing in QA.
3. **Multi-workspace RPC concern:** the existing `create_creative_campaign_draft` definition in `supabase/migrations/20260911000000_sprint82_creative_studio_beta.sql` selects the first active membership by creation time. The repository carries workspace context, but that RPC does not receive a selected workspace argument. This is source evidence of a risk, not proof of production behavior; a later production definition may differ. Multi-workspace saves cannot be certified without inspecting/testing the deployed function. No schema/RPC change was made in this sprint.
4. **No-project workspaces:** the existing wizard requires inventory-project records. The empty state now removes the unusable form, but a complete customer project-setup workflow was not established. This prerequisite branch remains unverified and can prevent campaign work.
5. **Creative generation and editing:** Brand/Image/Video/Document workflows still need authenticated save, provider failure, preview, export and record-recovery tests. Loading a studio or discovering an action handler is insufficient evidence that it completes work.
6. **Availability coverage:** Growth CTAs use existing visibility/access checks. Other Creative entry points may still reach prerequisite, permission or provider states; no claim of complete tenant-wide readiness is made.
7. **Local versus production:** the fixes were not deployed. Production observations cannot demonstrate that this local build is installed.

Existing architecture, services, repositories, authentication and RBAC policies are reused. Growth pages now perform existing visibility/access service checks before rendering marketing links; these add service reads compared with the previous unconditional links. No new data repository, schema, API or provider was introduced. No production performance claim is made.

No commits. No deployment.

## Complete Growth CTA inventory

| Source | CTA | Canonical destination | Source page exists | Runtime |
| --- | --- | --- | --- | --- |
| `/vayon/growth/lead-generation` | Create a property campaign | `/vayon/creative/campaigns` | Yes | Needs Verification |
| `/vayon/growth/listing-performance` | Review property inventory | `/vayon/properties` | Yes | Needs Verification |
| `/vayon/growth/buyer-intelligence` | Review buyer leads | `/vayon/leads` | Yes | Needs Verification |
| `/vayon/growth/seller-intelligence` | Review seller pipeline | `/vayon/leads` | Yes | Needs Verification |
| `/vayon/growth/marketing-analytics` | Open analytics | `/vayon/analytics` | Yes | Needs Verification |
| `/vayon/growth/advertising-performance` | Review campaign evidence | `/vayon/analytics` | Yes | Needs Verification |
| `/vayon/growth/social-performance` | Review social evidence | `/vayon/analytics` | Yes | Needs Verification |
| `/vayon/growth/property-seo` | Review property pages | `/vayon/properties` | Yes | Needs Verification |
| `/vayon/growth/referral-network` | Review agencies and partners | `/vayon/crm/companies` | Yes | Needs Verification |
| `/vayon/growth/market-intelligence` | Review property analytics | `/vayon/properties/analytics` | Yes | Needs Verification |
| `/vayon/growth/analytics` | Open analytics | `/vayon/analytics` | Yes | Needs Verification |
| `/vayon/growth/reports` | Review analytics | `/vayon/analytics` | Yes | Needs Verification |
| `/vayon/growth/campaigns` | Plan a campaign | `/vayon/creative/campaigns` | Yes | Needs Verification |
| `/vayon/growth/content-calendar` | Prepare content | `/vayon/creative` | Yes | Needs Verification |
| `/vayon/growth/brand-assets` | Open brand kits | `/vayon/creative/brand` | Yes | Needs Verification |
| `/vayon/growth/seo` | Draft search content | `/vayon/creative` | Yes | Needs Verification |
| `/vayon/growth/pr` | Draft an announcement | `/vayon/creative` | Yes | Needs Verification |
| `/vayon/growth/community` | Plan an initiative | `/vayon/tasks` | Yes | Needs Verification |
| `/vayon/growth/influencers` | Prepare a creator brief | `/vayon/creative` | Yes | Needs Verification |
| `/vayon/growth/referrals` | Review workflows | `/vayon/workflows` | Yes | Needs Verification |
| `/vayon/growth/investor-relations` | Prepare an investor update | `/vayon/creative/documents` | Yes | Needs Verification |
| `/vayon/growth/settings` | Review integrations | `/vayon/settings/integrations` | Yes | Needs Verification |

## Local redirect evidence

| Source | Canonical destination | HTTP | Query preserved |
| --- | --- | --- | --- |
| `/vayon/marketing` | `/vayon/growth` | 308 | true |
| `/vayon/creative-studio` | `/vayon/creative` | 308 | true |
| `/vayon/creative-studio/assets` | `/vayon/creative/assets` | 308 | true |
| `/vayon/creative-studio/templates` | `/vayon/creative/templates` | 308 | true |
| `/vayon/creative-studio/calendar` | `/vayon/creative/calendar` | 308 | true |
| `/vayon/creative-studio/wizard` | `/vayon/creative/campaigns` | 308 | true |
| `/vayon/creative-studio/packs` | `/vayon/creative/campaigns` | 308 | true |
| `/vayon/creative-studio/brand-kits` | `/vayon/creative/brand` | 308 | true |

## Every modified or added file

The working tree was clean at the start of Sprint 228. Sprint 227 files are part of the existing baseline; its evidence was preserved.

- `MARKETING_WORKFLOW_CERTIFICATION.md`
- `app/vayon/creative/campaigns/page.tsx`
- `app/vayon/growth/[section]/page.tsx`
- `app/vayon/growth/page.tsx`
- `config/canonical-routes.ts`
- `features/platform/openai/runtime/ChatPanel.tsx`
- `features/vayon/creative-studio-2/CreativeStudioHome.tsx`
- `features/vayon/creative-studio/actions.ts`
- `features/vayon/creative-studio/components/StudioViews.tsx`
- `features/vayon/document-studio/DocumentStudio.tsx`
- `features/vayon/growth-intelligence/GrowthOverview.tsx`
- `features/vayon/growth-intelligence/GrowthSectionPage.tsx`
- `features/vayon/growth-intelligence/catalog.ts`
- `features/vayon/operational-workforce/components/EmployeeDailyWorkspace.tsx`
- `features/vayon/product-shell/navigation.ts`
- `scripts/audit-marketing-workflows.mjs`
- `scripts/audit-product-unification.mjs`
- `scripts/certify-marketing-workflows.mjs`
- `test-results/marketing/accessibility.log`
- `test-results/marketing/browser-audit.json`
- `test-results/marketing/build.log`
- `test-results/marketing/eslint.log`
- `test-results/marketing/navigation.log`
- `test-results/marketing/production-crawl.log`
- `test-results/marketing/redirect-audit.json`
- `test-results/marketing/regression.log`
- `test-results/marketing/responsive.log`
- `test-results/marketing/route-integrity.log`
- `test-results/marketing/source-audit.log`
- `test-results/marketing/source-inventory.json`
- `test-results/marketing/typecheck.log`
- `tests/marketing-workflow-certification.test.mjs`
