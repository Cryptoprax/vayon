# Universal Layout Audit

Audit date: 2026-08-23  
Scope: authenticated VAYON routes plus the isolated public demo.

## Result

The application now has one floating layout owner. VAYON Intelligence, proactive welcome guidance, Quick Create, shell feedback, demo tour controls, coachmarks, and demo notices register with the same dock. Existing fixed headers, navigation drawers, and modal search remain structural overlays rather than floating widgets.

The dock measures its rendered bounds, visual viewport, browser zoom, page scroll, sidebar state, and modal/drawer mutations. It exposes safe bottom/right reservations to the shell. Compact surfaces stack at 16px intervals. Expanded Intelligence hides compact utilities; mobile expansion uses the full dynamic viewport.

## Empty-state audit

The existing workspace engine now delegates empty collections to `UniversalEmptyState`, producing first-time guidance, create/demo actions, tutorial/documentation links, semantic labelling, and optional workspace/user/module dismissal. Provider, permission, authentication, timeout, and database failures remain genuine error states.

## Accessibility

- Labelled dock and dialog surfaces
- Existing Escape/focus restoration for Quick Create
- Keyboard-native links and buttons
- ARIA live feedback and alert/status roles
- Safe-area inset support
- Reduced-motion override
- High-contrast-compatible semantic design tokens

## CLS and responsive assessment

The manager is mounted once by the shell and uses stable default reservations before measurement. Floating surfaces are portalled outside content flow, so stacking does not shift page elements. User-triggered assistant expansion updates the reserved desktop area; mobile uses a fullscreen dialog. No per-route padding or viewport polling was introduced.

## Automated coverage

`npm run audit:floating-layout` source-audits every authenticated page and shared VAYON surface. It fails when unmanaged bottom-fixed/sticky widgets are introduced or when registration, safe-area, responsive, reduced-motion, empty-state, or documentation contracts disappear.

Visual browser verification remains required for representative pages at 200% zoom and mobile/tablet/desktop breakpoints before release certification.
