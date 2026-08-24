# Production Sign Out Root Cause

## Root cause

VAYON has two authenticated profile menus and both had disconnected Sign Out controls:

1. `features/vayon/product-shell/ShellMenus.tsx` placed the shared VDS `Button` inside a form bound to `logoutAction`, but omitted `type="submit"`. The shared Button intentionally defaults to `type="button"`, so clicking it never submitted the form and the server action never ran.
2. `features/dashboard/components/ProfileDropdown.tsx`, used by the platform and Founder shell, only invoked `onClose`. It closed the menu without calling any authentication action.

The downstream service already called Supabase `signOut()`, but the action ignored its returned error. A failed sign-out could therefore continue to `/login`, where middleware still saw an authenticated user and redirected back into the application.

## Before

```text
Product shell click → type="button" → no form submission → no server action
Platform shell click → close dropdown → no server action
```

If the action was invoked through another path, its Supabase result was awaited but not checked, and routed server state was not explicitly invalidated.

## After

```text
Profile menu
  → explicit submit button
  → logoutAction server action
  → optional authenticated audit event
  → AuthenticationService.logout()
  → awaited Supabase auth.signOut()
  → Supabase SSR clears Auth cookies through the server cookie adapter
  → provider errors throw a sanitized exception
  → successful logout invalidates the root layout cache
  → redirect("/login")
  → middleware auth.getUser() observes no user
```

Both product and platform profile menus now submit the same existing server action. No client-side reload, middleware bypass, alternate logout implementation, or authentication-provider change was introduced.

## Files changed

- `features/vayon/product-shell/ShellMenus.tsx`
- `features/dashboard/components/ProfileDropdown.tsx`
- `features/authentication/actions/auth.actions.ts`
- `tests/sprint119-production-signout.test.mjs`
- `SIGNOUT_ROOT_CAUSE.md`

## Why the fix is correct

- The click now reaches the existing server action through native form submission.
- The action awaits the existing authentication service, which awaits and returns Supabase `auth.signOut()`.
- Supabase SSR performs cookie mutation through the existing server cookie adapter; no cookie names or provider internals are duplicated.
- Sign-out errors are no longer silently ignored.
- Layout revalidation prevents stale authenticated server-rendered state.
- The existing `/login` destination and middleware behavior remain unchanged.
- Refreshing or requesting a protected route after logout causes middleware to verify the missing session with `auth.getUser()` and redirect to `/login`.
- Founder pages remain inaccessible because their server services require a verified authenticated Founder identity.

## Validation evidence

- Focused sign-out regression: PASS (4/4).
- TypeScript: PASS.
- ESLint: PASS (zero errors; one unrelated pre-existing warning in `scripts/generate-rc1-release-reports.mjs`).
- Full regression suite: PASS (1,133/1,133).
- Production build: PASS (334 generated pages).
- Email and Google authentication converge on the same Supabase SSR session cookies and canonical logout action; neither provider flow was changed.
- Protected-route and Founder denial after cookie removal are enforced by the unchanged middleware and server authorization guards.
- Browser production execution remains an operational post-deployment check; no deployment was performed in this sprint.
