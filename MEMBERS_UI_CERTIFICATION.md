# Sprint 231 — Members UI Certification

Date: 2026-09-12

Local UI validation: **Passed**. Authenticated production verification: **Needs Verification**.

## Scope

Redesigned only the Team Members presentation using the rules in the sprint prompt. No Product Bible file was required after the user's clarification. No APIs, schema, queries, server actions, services, invitation logic, or RBAC rules were changed. No commit or deployment was performed.

The working tree already contained changes from earlier sprints. Those changes are excluded from this report; the starting status is recorded in [pre-sprint-status.txt](test-results/members/pre-sprint-status.txt).

## Before and after

| Before | After |
| --- | --- |
| Six-column table with a 1080px minimum width | Full-width member cards with responsive identity and action areas |
| Horizontal table scrolling reproduced at 390px and 1280px | No horizontal overflow detected at any of eight tested widths |
| Permission summary occupies a table column | Concise access label beside View Permissions; existing permission data opens in a modal |
| Actions extend beyond the available table viewport | Change Role, Suspend/Reactivate, and Remove remain visible within each card |
| Invitation controls precede the member list | Members appear first; the header's Invite Team action leads to the existing invitation form |
| Dense table presentation | Consistent padding, clear role and department text, status labels, and wrapping long addresses |

The table and its minimum width were removed. Overflow is not concealed with horizontal clipping. Card columns use available container width and stack on narrower screens. Permissions retain their existing catalog definitions and restrictions.

## Files modified or added in this sprint

Production presentation:

- `app/vayon/settings/members/page.tsx` — Members header and invitation anchor.
- `features/platform/organization/components/RoleManagementUI.tsx` — Members list presentation, invitation wrapping, and ownership-control labels. The Roles page implementation is unchanged.
- `features/platform/organization/components/MemberManagementRows.tsx` — Responsive member presentation and accessible permission modal.
- `features/platform/organization/components/MembersManagement.css` — Members-scoped responsive styles.

Validation and documentation:

- `tests/sprint120b-enterprise-role-management-ui.test.mjs` — Updated presentation assertions while retaining existing functionality checks.
- `scripts/certify-members-ui.mjs` — Local browser certification harness.
- `tests/fixtures/members/entry.jsx` — Actual presentation components with explicit QA records.
- `tests/fixtures/members/actions.mjs` — Captures existing form payloads without executing mutations.
- `tests/fixtures/members/loader.mjs` — Fixture compilation and before-state loading.
- `MEMBERS_UI_CERTIFICATION.md` — This report.
- `test-results/members/` — Logs, baseline source/status, JSON evidence, and 20 screenshots listed below. Temporary compiled fixture files were cleaned up.

## Responsive evidence

Local Chromium rendered the actual Members components and application styles inside a fixture shell. All eight widths passed document and content overflow checks, button containment, minimum 44px member-button height, and permission-modal keyboard/overflow checks. Desktop and mobile screenshots were visually reviewed.

| Width | Members | Permissions | Result |
| --- | --- | --- | --- |
| 320 | [Screenshot](test-results/members/screenshots/members-320.png) | [Screenshot](test-results/members/screenshots/permissions-320.png) | Passed |
| 390 | [Screenshot](test-results/members/screenshots/members-390.png) | [Screenshot](test-results/members/screenshots/permissions-390.png) | Passed |
| 768 | [Screenshot](test-results/members/screenshots/members-768.png) | [Screenshot](test-results/members/screenshots/permissions-768.png) | Passed |
| 1280 | [Screenshot](test-results/members/screenshots/members-1280.png) | [Screenshot](test-results/members/screenshots/permissions-1280.png) | Passed |
| 1440 | [Screenshot](test-results/members/screenshots/members-1440.png) | [Screenshot](test-results/members/screenshots/permissions-1440.png) | Passed |
| 1600 | [Screenshot](test-results/members/screenshots/members-1600.png) | [Screenshot](test-results/members/screenshots/permissions-1600.png) | Passed |
| 1920 | [Screenshot](test-results/members/screenshots/members-1920.png) | [Screenshot](test-results/members/screenshots/permissions-1920.png) | Passed |
| 2560 | [Screenshot](test-results/members/screenshots/members-2560.png) | [Screenshot](test-results/members/screenshots/permissions-2560.png) | Passed |

Additional evidence: before-state horizontal scrolling at [390px](test-results/members/screenshots/before-390.png) and [1280px](test-results/members/screenshots/before-1280.png); light-theme checks at [390px](test-results/members/screenshots/members-light-390.png) and [1440px](test-results/members/screenshots/members-light-1440.png).

## Validation

| Check | Result | Evidence |
| --- | --- | --- |
| TypeScript | Passed | [Log](test-results/members/typecheck.log) |
| ESLint | Passed | [Log](test-results/members/eslint.log) |
| Regression tests | 1,663 passed; zero failed or skipped | [Log](test-results/members/regression.log) |
| Production build | Passed | [Log](test-results/members/build.log) |
| Responsive and interaction audit | Passed in local Chromium fixture | [Browser evidence](test-results/members/browser-evidence.json), [log](test-results/members/browser.log) |
| Business logic preservation | Passed source comparison | [Preservation audit](test-results/members/preservation-audit.json) |

Keyboard checks cover Enter and Space activation, Tab and Shift+Tab containment in the permission modal, Escape dismissal, Close button dismissal, and focus restoration. Member sections, controls, dialog titles, and ownership controls have accessible names. Status includes text rather than relying on color alone. A manual screen-reader session and a comprehensive WCAG audit were not performed.

Interaction tests captured the existing payloads for role change, suspend, remove, reactivate, invite, resend, cancel, and ownership transfer. Owner protections and read-only disabled controls passed. Sole-member guidance remains available. The permission modal renders actual catalog permissions, including Billing for the owner fixture.

The preservation audit confirms unchanged invitation role picker, role options, role details, and Roles page functions against the saved starting source. Organization actions, service, role catalog, permission policy, and validation files match their existing repository versions. There are zero new queries.

## Remaining verification

No implementation blocker was found in the local UI checks. Production verification remains pending: no authenticated QA session was supplied for `https://vayon.online`, and these changes were not deployed. The browser fixture captures form submissions; it does not prove live database mutations or invitation delivery. Firefox, Safari, real-device testing, and manual assistive-technology testing were not performed.

The local results therefore certify the tested presentation and form wiring only, not the complete production member-management lifecycle.
