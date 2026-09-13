# Assistant Launcher Visibility Certification

**Final state: Local Verified.** Production was not tested with an authenticated session.

## Root cause

The Sprint 234 launcher used the correct primary token, but its single-class rule was overridden on live authenticated pages by the premium canvas’s generic surface styling. That left the inherited translucent dark surface appearance visible until interaction.

## Correction

`workspace.css` now scopes the launcher’s resting and hover color rules under `.vayon-premium-canvas`. This has higher specificity than the generic premium-surface selector and keeps `--vds-color-primary` as the resting background and `--vds-color-on-accent` as the icon color. No hard-coded green, assistant logic, state, event handling, API, trial-banner, subscription, or layout behavior changed.

## Modified files

- `features/platform/design-system/layout/workspace.css` — fixed the shared launcher’s cascade ordering.
- `tests/sprint234-assistant-trial-ui.test.mjs` — verifies the scoped resting primary rule and contrast token.
- `scripts/certify-assistant-trial-ui.mjs` — verifies computed resting background/icon colors before hover at every responsive width.

## Local evidence

The Chromium audit verifies the green launcher before hover, token-based icon contrast, one icon-only launcher, 44 px target, tooltip on hover/focus, Enter/Space-compatible native button behavior, Escape focus restoration, modal hiding, panel opening, safe bottom-right positioning, no horizontal overflow, and unchanged trial-banner scroll behavior.

Widths: 320, 375, 390, 414, 768, 1024, 1280, 1440, 1920, and 2560 px. Evidence and screenshots are in `test-results/assistant-trial-ui`.

## Validation

- Focused assistant/trial tests: 8 passed.
- Full regression suite: 1,682 passed, 0 failed.
- TypeScript: passed.
- ESLint: passed.
- Production build: passed.

## Remaining limitation

This is local browser evidence using the shared production components and CSS. It does not claim authenticated production-route verification.

**NO COMMIT**

**NO DEPLOYMENT**
