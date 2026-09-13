# Assistant and Trial Banner UI Certification

**Final state: Local Verified.** No authenticated production session was used, so production verification was not performed.

## Changes

- `features/platform/design-system/layout/WorkspaceLayouts.tsx` — replaced the shared visible “Open assistant” control with the existing design-system `IconButton`, `Tooltip`, and Lucide `MessageCircle` icon. It retains the same open/close state, `vayon:copilot:open` event support, Escape behavior, focus restoration, and existing assistant content.
- `features/platform/design-system/layout/workspace.css` — made the single shared assistant dock a compact bottom-right viewport control using the existing sticky layer convention; the expanded assistant remains anchored above it. Removed assistant-reserved layout space and the notice-specific internal scrolling rules.
- `tests/fixtures/layout-system/entry.jsx` — added a local-only trial banner fixture and sufficient document height to audit the shared layout’s real scroll behavior.
- `tests/workspace-unification.test.mjs` — updated the shared-layout assertion for an icon-only accessible assistant trigger.
- `tests/sprint234-assistant-trial-ui.test.mjs` — added source-level regression checks for the icon trigger and normal-flow trial notice.
- `scripts/certify-assistant-trial-ui.mjs` — added a local Chromium audit using the actual shared components and CSS.
- `eslint.config.mjs` — excludes generated browser-audit output so a fixture that correctly removes its temporary bundle cannot make the repository lint target a missing generated file.

## Before and after

Before, the global assistant was a visible text CTA in a sticky bottom row. The workspace and trial notice could be placed inside a dedicated internal scroll container, leaving the trial banner persistent while users worked lower on the page.

After, there is one fixed, icon-only chat launcher with the accessible name “Open VAYON assistant,” a visible focus state, a `VAYON Assistant` tooltip on hover/focus, and a 44 px minimum control. It opens the existing assistant; no second assistant implementation was added. The launcher hides while native dialogs or modal drawers are open.

The trial banner remains at the top of the workspace with its existing day, quota, and upgrade information. It is now normal document content and scrolls away naturally. No billing, subscription, trial, authentication, RBAC, database, API, routing, or business-workflow behavior changed.

## Local verification

- Focused tests: 7 passed.
- Full regression suite: 1,681 passed, 0 failed.
- TypeScript: passed.
- ESLint: passed after the fixture’s time value was made static.
- Production build: passed.
- Browser audit: passed at 320, 375, 390, 414, 768, 1024, 1280, 1440, 1920, and 2560 px.

The browser audit verifies no horizontal overflow, a 44 px or larger launcher, keyboard Enter to open, Escape focus restoration, visible tooltip, native-dialog layering, persistent bottom-right positioning for the launcher, and natural scroll-away behavior for the trial banner. Screenshots and evidence are in [`test-results/assistant-trial-ui`](test-results/assistant-trial-ui).

## Limitations

The browser audit is a local presentation fixture. It does not certify an authenticated deployment, real workspace data, device browser chrome behavior, or production route rendering. No production verification is claimed.

**NO COMMIT**

**NO DEPLOYMENT**
