# Sprint 225 — AI Creative Center

The Creative Center now uses a centered layout capped at 1600px, a clear hero, nine quick actions, studio group filters, and cards sized to the available workspace. The unused sidebar grid track is removed. Studios display four columns in wide content areas, two on tablets and constrained desktops, and one on phones.

Recent work offers generations, campaigns, assets, and exports with search and empty states. Featured templates use the existing Creative Studio snapshot. Brand assets expose the saved logo status, fonts, colors, and guidelines through Brand Studio. Activity shows existing asset generation dates and approval status. Export entries use recorded asset exports; no export timestamps or generation jobs are fabricated.

The assistant starts collapsed and occupies an in-flow right dock on wide screens, with a keyboard-operable width slider. On smaller screens it expands above the content. The existing intelligence assistant renders inside this dock, preserving its conversations and actions. Only the Create with AI action floats on this overview. The creation dialog retains intent analysis, planning, session memory, provider diagnostics, and routing, with modal focus containment and Escape dismissal.

## Modified files

| File | Change |
| --- | --- |
| `features/vayon/creative-studio-2/CreativeStudioHome.tsx` | Overview information architecture, cards, recent work, brand assets, templates, activity, assistant dock, and accessible creation dialog. |
| `features/vayon/creative-studio-2/CreativeStudioHome.module.css` | Scoped responsive grids, spacing, dock, VDS hover motion, and accessible light-theme token selection. |
| `features/vayon/creative-studio-2/types.ts` | Exposes the existing template snapshot type to the overview. |
| `features/vayon/creative-studio-2/service.ts` | Passes through `source.templates` from the existing snapshot. |
| `features/vayon/components/ProductExperience.tsx` | Suppresses duplicate global Create on this overview and selects the docked assistant presentation. |
| `features/vayon/intelligence-core/components/VayonIntelligence.tsx` | Adds an inline portal presentation and a stacked layout for the narrow dock. |
| `scripts/audit-sprint225-creative-center.mjs` | Reproducible isolated browser audit using real UI components, fixture data, and stubbed Next navigation. |
| `docs/SPRINT_225_CREATIVE_CENTER_UX.md` | Scope, validation evidence, and complete file inventory. |

## Validation

- TypeScript and ESLint.
- Full regression suite: 1,605 tests passed, no failures or skips.
- Repository responsive, accessibility, commercial UX, interaction, and floating-layout audits passed.
- Chromium rendered audit: 320, 375, 768, 1024, 1440, 1920, and 2560px; no horizontal page overflow or assistant/content overlap; verified 1/2/4 studio columns and minimum card width.
- Browser interactions: studio filtering, recent exports, search empty state, modal focus containment, Escape, quick-action prompt reuse, assistant expansion/collapse, keyboard resizing, and a single floating action.
- Axe WCAG A/AA checks passed on the overview in dark and light themes; reduced-motion behavior checked. These automated checks do not constitute a full manual screen-reader certification.
- Production build. The first sandboxed attempt could not fetch the existing Google Fonts; the network-enabled retry succeeded. The existing build-time provider health check reported insufficient quota without failing the build.
- Screenshots and browser/build/regression logs are local artifacts under `build/sprint225-audit/` (gitignored). Run `node scripts/audit-sprint225-creative-center.mjs` to reproduce the UI audit.

Browser evidence uses fixture data, not an authenticated production workspace. It does not certify live generation, approvals, exports, or provider availability. Repository implementations, routes, APIs, schemas, RBAC, authentication, provider selection, AI execution, and approval behavior were not changed. No commit or deployment was performed.
