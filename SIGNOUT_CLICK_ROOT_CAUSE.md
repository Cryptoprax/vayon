# Sign Out Click Root Cause

## Root cause

The Sign Out control in `features/vayon/product-shell/ShellMenus.tsx` was rendered, enabled, and wired to the existing `logoutAction`, but its profile dropdown was trapped inside the fixed `ShellHeader` stacking context at `z-index: 60`.

`ProductExperience` also renders `VayonIntelligence` through `FloatingLayoutManager`. The floating dock is a body-level portal at `z-index: 70`. When Vayon Intelligence is expanded, its 29rem-wide, up-to-42rem-high interactive surface occupies the upper-right area containing the open profile dropdown. Browser hit testing therefore resolves `document.elementFromPoint(...)` to the Vayon Intelligence surface, not the Sign Out button. Pointer events never reach the button, so neither form submission nor `logoutAction` can start; this exactly accounts for no handler, network request, redirect, or console error.

The outside-click listener is not the cause: it listens on `mousedown` and closes only when the event target is outside the profile-menu root. The button has no `preventDefault` or `stopPropagation`, is not disabled, has `pointer-events` enabled, has `type="submit"`, and its parent form has `action={logoutAction}`.

## Exact components and files

- Intercepting component: `VayonIntelligence`, rendered as a `FloatingSurface` from `features/vayon/intelligence-core/components/VayonIntelligence.tsx`.
- Intercepting stacking context: `.vayon-floating-layout` in `app/globals.css` (`z-index: 70`, interactive child surfaces use `pointer-events: auto`).
- Obscured component: `ProfileMenu` in `features/vayon/product-shell/ShellMenus.tsx`.
- Constraining ancestor: `ShellHeader` in `features/vayon/product-shell/ShellHeader.tsx` (closed/default `z-index: 60`).

Line numbers should be taken from the final checked-in file; the relevant declarations are also directly searchable by the names above.

## Interaction trace

1. Profile trigger receives its click and renders the menu.
2. The Sign Out button is present and its form action is bound.
3. The expanded floating assistant is painted above the header stacking context.
4. Pointer hit testing selects the assistant surface at the Sign Out coordinates.
5. No Sign Out `click` or form `submit` event is dispatched, so logout is never called.

Temporary event logging at the Sign Out control would only prove the negative (no event arrives). It was not retained in production code; the stacking order, interactive surface bounds, and regression assertion provide deterministic evidence without adding console noise or changing authentication.

## Minimal repair

`ShellHeader` now tracks only whether `ProfileMenu` is open. It remains at `z-index: 60` normally and rises to `z-index: 80` only while that menu is open. `ProfileMenu` reports its existing open/close transitions through `onOpenChange`.

This places the open profile menu above the `z-index: 70` floating surface while preserving the original layer order at all other times. No logout flow, Supabase call, authentication logic, middleware, RBAC, or session behavior was changed.

## Regression evidence

`tests/sprint119-production-signout.test.mjs` verifies all three required relationships:

- floating surfaces remain at layer 70;
- the profile menu reports its open state;
- the authenticated header rises to layer 80 only while the profile menu is open.
