# Floating Component Guidelines

All floating UI must use `FloatingSurface` inside `FloatingLayoutManager`. Direct `fixed bottom-*` or `sticky bottom-*` positioning is prohibited for assistants, help, toasts, coachmarks, actions, and banners.

## Registration

Each surface provides a stable ID, semantic kind, and priority:

| Surface | Kind | Priority |
| --- | --- | ---: |
| AI assistant | `assistant` | 10 |
| Help / coachmark | `help` or `walkthrough` | 20 |
| Toast / feedback | `toast` | 30 |
| Floating action button | `action` | 50 |

The dock uses 16px spacing. An expanded assistant hides compact utilities until it closes. Fullscreen surfaces use safe-area insets and must expose a labelled dialog with keyboard-accessible close/minimize controls.

## Layout contract

- Desktop: bottom-right dock; measured right and bottom content reservations.
- Tablet: safe-area-aware dock above browser/navigation controls.
- Mobile: compact controls share one dock; the expanded assistant fills the viewport.
- The manager observes viewport resize, browser zoom, scroll, sidebar state, drawers, and modals.
- Content uses `floating-safe-content`; do not add route-specific compensation.
- Fixed headers, navigation drawers, and true modal overlays are not dock widgets.
- Never assign arbitrary z-index values to a new floating surface.

## Accessibility and performance

- Provide an accessible label and correct live-region role.
- Restore focus when menus/dialogs close.
- Support Escape and keyboard traversal.
- Respect reduced motion.
- Lazy-load large assistants and help experiences.
- Use the centralized ResizeObserver; do not create per-widget viewport polling.
