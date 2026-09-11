# Property Workflow Certification

Final state: **Needs Verification**

Scope: OPERATION LAUNCH P0 Blocker #1, property creation only. Evidence collected on 2026-09-12 (Asia/Calcutta). No commit or deployment.

## Findings and corrections

1. **The Step 4 to Step 10 jump was explicitly implemented.** `PropertyWizard.tsx` previously used `current === 4 ? sections.length : current + 1`; Back used `current === sections.length ? 4 : current - 1`. Both now advance or retreat one step. Unvisited step buttons are disabled, so Review cannot be opened before completing Step 9. Previously visited sections remain reachable.
2. **Validation could prevent saving without revealing the affected section.** All sections remain mounted to preserve their form values. Native required controls in hidden sections can prevent the submit action. The wizard now validates the current section before Continue, uses the existing mutation schema for schema-only requirements (including location and a sale/rental price), and reveals/focuses invalid controls at final submission. An early Enter press does not jump to a later invalid section. Decimal price, commission, bathroom and area inputs now accept the decimals already permitted by the schema.
3. **The permission lookup did not identify the acting user or selected workspace.** The previous organization-members query selected one active member without a user filter. The existing service now checks the authenticated actor's active workspace membership, scoped to organization and selected workspace. The allowed roles remain organization owner, organization admin, branch manager and sales manager, matching the existing create-property SQL function.
4. **A missing mutation result could become a false success URL.** The repository previously returned `String(data)`, allowing `null` to produce a `/properties/null` redirect. It now rejects missing or malformed record IDs and propagates RPC errors. A returned UUID is necessary for success, but is not independent proof of database persistence.

The step-jump cause is established by the original source. The other findings are demonstrated failure paths; the specific cause of the reported production persistence failure has not been established without that authenticated runtime.

## Runtime evidence

Command: `node scripts/test-property-workflow.mjs`

Result: `Wizard navigation and submission checks passed`.

Artifact: `test-results/property-workflow/browser-audit.json`.

This Chromium fixture compiles and renders the actual PropertyWizard, location selectors, shared schema, inputs and VDS Button. Next Link/Image have browser-only shims. The form action is a test callback. It does not run an authenticated Next server action, apply production CSS, or contact the database.

Observed assertions:

- Forward path: Basic (1), Location (2), Pricing (3), Property Features (4), Media (5), Amenities (6), Ownership (7), Documents (8), Search Details (9), Review & Save (10).
- Back path: 10, 9, 8, 7, 6, 5, 4, 3, 2, 1; forward traversal again succeeds.
- Review is initially disabled. Incomplete current sections prevent forward navigation.
- Enter in Basic does not skip ahead or submit the form.
- Missing price prevents leaving Step 3. Decimal price and area are accepted.
- An invalid hidden required field at final submission reveals its section and prevents the action callback.
- After correction, the callback runs once and receives the entered price and city. No browser page errors were observed.

## Save path evidence

`tests/property-creation-workflow.test.mjs` executes the actual shared parser, server action, service and repository with a simulated Supabase client. All six tests pass. They verify:

- Repeated amenities and decimal values survive FormData extraction.
- Permission lookup includes organization, workspace, authenticated user and active status.
- Existing authorized roles pass; unauthorized roles and authentication/membership errors cannot mutate.
- Missing/malformed IDs and RPC errors cannot produce a success redirect.
- Valid input reaches `create_property` with the selected workspace and parsed input.
- A successful simulated RPC revalidates `/vayon/properties` and redirects to `/vayon/properties/<returned UUID>?success=Property%20created`.
- Invalid input or mutation failures redirect to the existing error state without revalidation or success.

Source inspection of `supabase/migrations/20260813000000_sprint22_production_baseline.sql` confirms the existing `create_property` function checks authentication and workspace membership, inserts into `properties`, and returns the inserted ID. This is source evidence only; deployed SQL and a persisted row were not verified.

The existing detail route, `app/vayon/properties/[propertyId]/page.tsx`, loads the property through `PropertyService.detail`, calls `notFound()` if absent, and displays the success query in a `role="status"` notice. There is no separate creation toast in this path. That page was inspected and left unchanged; its authenticated runtime rendering remains unverified.

## Validation

| Check | Result |
| --- | --- |
| Chromium wizard runtime | Passed, with the fixture limits above |
| TypeScript: `npm.cmd run typecheck` | Passed |
| Regression: `npm.cmd test` | 1,638 passed; zero failures/skips |
| ESLint: `npm.cmd run lint` | Passed |
| Production build: `npm.cmd run build` | Passed; 429 static pages generated |
| Authenticated database insertion/read-back | Not executed |
| Authenticated detail-page redirect and refresh | Not executed |

The production build emitted an existing AI health-check quota diagnostic while generating pages; it still exited successfully. No AI changes were made.

## Why production certification cannot be completed

No authenticated QA session file or designated test workspace was supplied. `PLAYWRIGHT_AUTH_STATE` and `PLAYWRIGHT_BASE_URL` are unset in this execution environment. The browser fixture and simulated RPC do not establish a production write. No real property was created during this investigation.

To finish verification, use an authorized workspace session to traverse all ten steps, create a uniquely identifiable QA property, capture the returned ID, independently read the matching `properties` row (including organization/workspace/creator and entered values), observe the detail redirect and success notice, and refresh to confirm persistence. Also verify the existing error path with a denied or expired session. Record deployment/version evidence so the tested runtime can be tied to these changes.

## Modified files

- `features/vayon/property/components/PropertyWizard.tsx` — sequential steps, validation and decimal constraints.
- `features/vayon/property/validation/property.ts` — shared existing FormData extraction; schema unchanged.
- `features/vayon/property/actions/property.actions.ts` — reuse shared extraction for create/update.
- `features/vayon/property/services/property.service.ts` — actor/workspace-specific creation permission check.
- `features/vayon/property/repositories/property.repository.ts` — validate create mutation result.
- `tests/product-bible-phase3.test.mjs` — replace obsolete property step-skipping expectation; lead expectation unchanged.
- `tests/property-wizard-step-indicators.test.mjs` — align navigation assertions with guarded sequential flow.
- `tests/sprint213-property-listing-ux.test.mjs` — verify amenity extraction at its shared location.
- `tests/property-creation-workflow.test.mjs` — six executable save-path tests (new).
- `scripts/test-property-workflow.mjs` — repeatable Chromium fixture with temporary bundle cleanup (new).
- `test-results/property-workflow/browser-audit.json` — browser evidence (new).
- `PROPERTY_WORKFLOW_CERTIFICATION.md` — this report (new).

No fields, styling classes, unrelated modules, schemas, routes, or architecture were changed. Existing media previews and browser-only ownership/document/search fields retain their prior persistence behavior; this work does not add upload or field-persistence features.
