# Property Experience Certification

Overall result: **Blocked** against full acceptance. The scoped interface changes and local checks are complete. Missing existing upload/publish/share workflows and unverified authenticated runtime prevent full certification.

## What changed

- The welcome overlay now mounts only at the existing onboarding destination `/vayon/dashboard?welcome=1`, without success/error feedback. A property route cannot mount it, even if a welcome query is present. No new first-login tracking was added.
- Successful property saves retain the existing direct record redirect and shell success toast. The duplicate detail-page success notice was removed. The toast is keyed by route/message so an earlier dismissed toast cannot suppress a later property notification.
- Property inventory now starts with attention items derived from the current list response (missing description or responsible agent), followed by inventory. It does not imply a workspace-wide attention count.
- Map previews, import/provider previews, future intelligence, duplicate recent-property cards and distribution charts no longer occupy the primary property page. Their underlying components/services remain untouched.
- Property cards retain recorded facts and an actionable next-step description. Unavailable AI/demand/buyer/viewing metrics, the empty AI table column and the large decorative image preview were removed.
- Property details start with existing working destinations: complete/edit details, Generate Brochure, Match Buyers, Schedule Viewing. Descriptions explain when users must select or enter property details in the destination. No unsupported automatic context handoff is claimed.
- History and contextual AI are secondary sections; Analytics opens the existing property analytics route. Insights is hidden unless a finite score exists on the loaded record. The default detail route no longer depends on the CRM intelligence snapshot or displays its placeholders.
- The property list and record detail each own a single sticky header containing breadcrumb, title and principal action. Their detached shell breadcrumb is suppressed. Property routes use the shell's available width with one outer gutter.
- Property routes display either the existing assistant or Quick Create, not both. The assistant's floating proactive welcome bubble is suppressed on property routes; inventory has inline guidance. Feedback toasts remain temporary notifications, not additional assistant/action launchers.
- The AI error boundary now offers retry, AI Settings and return-to-properties actions. This improves recovery; it is **not** evidence that the underlying AI data-loading exception is fixed.

## Acceptance and remaining gaps

| Requirement | Evidence/result |
| --- | --- |
| Creation uninterrupted by AI welcome | Explicit route gating and regression assertions; authenticated creation remains unverified |
| Success toast/direct created-record destination | Existing server-action redirect retained; shell toast retained/keyed; database-backed browser sequence not run |
| No workspace crash | Default property detail removes its additional CRM snapshot dependency; production exception and live AI-team destination not verified |
| Workflow-first property list/detail | Actual route rendering with fixture records, source assertions and screenshots |
| Upload Photos | Blocked: existing MediaManager makes browser previews; persistent property photo upload is not connected |
| Publish Listing | Blocked: property published status can be read, but the existing wizard/parser exposes no publishing action |
| Share Listing | Blocked: no verified existing property public-link/share action was identified |
| Generate Brochure | Links to existing Document Studio; live generation depends on existing configuration and is not certified |
| Match Buyers | Links to existing matching workflow; no unsupported propertyId preselection added |
| Schedule Viewing | Links to existing site-visit form; user selects the property/buyer there |
| Secondary sections/evidence gating | History and AI are secondary; Insights conditional; Analytics existing destination |
| Width, gutters, coherent sticky header | Property-specific shell width and route headers; local browser assertions at four widths |
| No overlapping welcome helper/one launcher | Property-route conditions checked; complete authenticated shell interaction remains unverified |
| Placeholder intelligence removed | Removed from default property pages/cards/table; broader Insights/Analytics modules unchanged |

Adding the three missing workflows would violate this request's no-feature/no-service/no-repository/no-schema constraints. No dummy buttons, fake successful operations, new services, or substitute architecture were introduced.

## Validation

| Check | Result |
| --- | --- |
| `npm.cmd run typecheck` | Passed |
| `npm.cmd run lint` | Passed; scoped ESLint rerun after final property-card/table/test changes also passed |
| `npm.cmd test` | 1,643 passed, zero failed/skipped |
| `npm.cmd run build` | Passed, 429 static pages generated |
| `npm.cmd run audit:responsive` | Passed; existing static audit |
| `npm.cmd run audit:accessibility` | Passed; existing static audit |
| `npm.cmd run audit:ux` | Passed; semantic appearance/icon audit, not complete commercial certification |
| `node scripts/audit-property-experience-browser.mjs` | Passed for detail and grid inventory at 390, 768, 1440 and 1920px |
| Workflow audit | Five new executable tests plus destination source inspection; missing capabilities above remain explicit |

The production build logged an existing AI health quota diagnostic (`billing_required` / `insufficient_quota`) but exited successfully. This does not establish the cause of the reported AI-team workspace failure.

### Browser evidence limits

`tests/property-experience.test.mjs` renders the actual asynchronous property routes with fixture data, real property cards/toolbar and VDS buttons. Next links become native anchors; history/AI/collaboration dependencies are isolated. `scripts/audit-property-experience-browser.mjs` loads that markup with production CSS into Chromium.

Assertions cover viewport overflow, visible actions, breadcrumb count, keyboard link focus, evidence-hidden Insights, attention guidance and sticky header position. Screenshots were reviewed. Long description content is added for the scrolling assertion. This is not an authenticated Next app session, a full accessibility certification, a live RBAC audit, a live destination test or proof of persistence. The complete floating shell is source-tested, not browser-certified.

No authenticated QA session, designated test workspace or reproducible production exception was available. Completion requires recording a real save -> toast -> property detail -> refresh sequence; opening the AI-team destination with server error evidence; and confirming the existing generation/matching/viewing workflows under the appropriate role. Missing photo/publish/share capabilities cannot be certified within this scope.

## Files changed in this request

Application UI:

- `app/vayon/properties/page.tsx`
- `app/vayon/properties/[propertyId]/page.tsx`
- `app/vayon/ai/error.tsx`
- `features/vayon/components/ProductExperience.tsx`
- `features/vayon/intelligence-core/components/VayonIntelligence.tsx`
- `features/vayon/property/components/PropertyCard.tsx`
- `features/vayon/property/components/PropertyTable.tsx`

Tests and audit:

- `tests/crm-intelligence-automation.test.mjs`
- `tests/sprint11-workspace-engine.test.mjs`
- `tests/sprint196-real-estate-experience.test.mjs`
- `tests/sprint197-commercial-polish.test.mjs`
- `tests/property-experience.test.mjs` (new)
- `scripts/audit-property-experience-browser.mjs` (new)

Report and evidence (new):

- `PROPERTY_EXPERIENCE_CERTIFICATION.md`
- `test-results/property-experience/detail.html`
- `test-results/property-experience/inventory.html`
- `test-results/property-experience/browser-audit.json`
- `test-results/property-experience/detail-390.png`
- `test-results/property-experience/detail-768.png`
- `test-results/property-experience/detail-1440.png`
- `test-results/property-experience/detail-1920.png`
- `test-results/property-experience/inventory-390.png`
- `test-results/property-experience/inventory-768.png`
- `test-results/property-experience/inventory-1440.png`
- `test-results/property-experience/inventory-1920.png`

Earlier uncommitted property-wizard, action, validation, repository/service, test and certification files were preserved. This request makes no further repository/service changes. The prior property-creation report describes the earlier implementation; this report supersedes its description of the detail-page inline success notice.

No architecture, schema, authentication, RBAC or routing changes. No commit. No deployment.
