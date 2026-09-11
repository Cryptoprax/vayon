# Layout Certification

Final state: **Needs Verification** for all authenticated primary pages; invitation layout has local browser evidence.

## Before / after

- Invite Team previously placed inputs and role search/catalog in a narrow two-column form with an internal scroll area. It now has a top form row, full-width summary and department groups spread across responsive columns. The General group uses the row width for its roles.
- Primary workspace pages previously combined a capped shell with additional centered containers and padding. The shell now allows the listed primary workspaces and Settings to expand, while the inspected CRM/Settings/page containers use one outer gutter.
- Existing table overflow containers are retained. Their horizontal scrolling does not expand the viewport; tables are not silently truncated.
- Search and filters remain adjacent to their records. Primary submit/create actions retain VDS primary styling; alternate navigation stays lower emphasis.

## Runtime evidence

Run `node scripts/audit-workflow-consistency-browser.mjs` after `npm.cmd run build`.

The fixture renders actual invitation UI, role catalog and VDS controls using production CSS. At 390, 768, 1440 and 1920px it verifies no document-width overflow, selectable roles, updated summary, exact submitted name/email/role fields, no invitation on Enter in role search, and disabled invitation without management access. Server actions are replaced with test callbacks. No email or database operation occurs.

Evidence: `test-results/workflow-consistency/invitation-browser-audit.json` and the four `invite-<width>.png` screenshots. The 1440px screenshot was visually reviewed to confirm the role groups use horizontal space rather than a narrow left column.

The remaining primary workspace layout changes were source-reviewed and covered by type/build/static checks. They were not all rendered with authenticated data. Full shell navigation, browser zoom, long translated labels, all tenant record sizes and role-specific states still require live verification. Static accessibility checks and keyboard-native controls do not constitute complete WCAG certification.

No claim is made that every nested page is certified. Before/after workflow rationale and outstanding blockers are in WORKFLOW_CONSISTENCY_CERTIFICATION.md.

## Every modified or added file

| File | Before/after rationale |
| --- | --- |
| `COMMERCIAL_UX_CERTIFICATION.md` | Requested audit report, scope and verification limits. |
| `EMPTY_STATE_AUDIT.md` | Requested audit report, scope and verification limits. |
| `LAYOUT_CERTIFICATION.md` | Requested audit report, scope and verification limits. |
| `WORKFLOW_CONSISTENCY_CERTIFICATION.md` | Requested audit report, scope and verification limits. |
| `app/vayon/approvals/page.tsx` | Use available primary-workspace width, consistent gutters or remove unrelated empty-state navigation. |
| `app/vayon/calendar/page.tsx` | Use available primary-workspace width, consistent gutters or remove unrelated empty-state navigation. |
| `app/vayon/crm/contacts/page.tsx` | Explain client origin and keep search-empty recovery inside Clients. |
| `app/vayon/deals/page.tsx` | Use available primary-workspace width, consistent gutters or remove unrelated empty-state navigation. |
| `app/vayon/leads/page.tsx` | Use available primary-workspace width, consistent gutters or remove unrelated empty-state navigation. |
| `app/vayon/settings/members/page.tsx` | Use available primary-workspace width, consistent gutters or remove unrelated empty-state navigation. |
| `app/vayon/settings/page.tsx` | Use task-specific business language without changing operations. |
| `app/vayon/tasks/page.tsx` | Use available primary-workspace width, consistent gutters or remove unrelated empty-state navigation. |
| `features/identity-workspace/components/SettingsShell.tsx` | Use available primary-workspace width, consistent gutters or remove unrelated empty-state navigation. |
| `features/platform/calendar/components/GoogleCalendarWorkspace.tsx` | Use task-specific business language without changing operations. |
| `features/platform/organization/components/RoleManagementUI.tsx` | Full-width invitation form, grouped roles and selected-role summary; unchanged access definitions. |
| `features/vayon/components/ProductExperience.tsx` | Use available primary-workspace width, consistent gutters or remove unrelated empty-state navigation. |
| `features/vayon/components/SmartEmptyState.tsx` | Remove generic unrelated or inert empty-state actions. |
| `features/vayon/crm-company/ContactDirectory.tsx` | Explain client origin and keep search-empty recovery inside Clients. |
| `features/vayon/crm-engine/components/CrmShell.tsx` | Use available primary-workspace width, consistent gutters or remove unrelated empty-state navigation. |
| `features/vayon/empty-states/UniversalEmptyState.tsx` | Remove generic unrelated or inert empty-state actions. |
| `features/vayon/growth-intelligence/GrowthOverview.tsx` | Replace unsupported metric placeholders with existing marketing tasks. |
| `features/vayon/operations/components/OperationsUI.tsx` | Use task-specific business language without changing operations. |
| `features/vayon/universal-bar/components/UniversalBar.tsx` | Prioritize current workspace, recent work and frequent actions without new fetching. |
| `features/vayon/universal-bar/config/adaptive-suggestions.ts` | Prioritize current workspace, recent work and frequent actions without new fetching. |
| `features/vayon/workflow-approval/components/GovernanceViews.tsx` | Use task-specific business language without changing operations. |
| `features/vayon/workspace-engine/components/WorkspaceEngine.tsx` | Remove generic unrelated or inert empty-state actions. |
| `scripts/audit-ai-team-brand.mjs` | Validate contextual UX; replace superseded placeholder/cross-workflow assertions. |
| `scripts/audit-workflow-consistency-browser.mjs` | Validate contextual UX; replace superseded placeholder/cross-workflow assertions. |
| `test-results/workflow-consistency/clients.html` | Local fixture evidence; no production data. |
| `test-results/workflow-consistency/invitation-browser-audit.json` | Local fixture evidence; no production data. |
| `test-results/workflow-consistency/invite-1440.png` | Local fixture evidence; no production data. |
| `test-results/workflow-consistency/invite-1920.png` | Local fixture evidence; no production data. |
| `test-results/workflow-consistency/invite-390.png` | Local fixture evidence; no production data. |
| `test-results/workflow-consistency/invite-768.png` | Local fixture evidence; no production data. |
| `tests/sprint163-growth-intelligence.test.mjs` | Validate contextual UX; replace superseded placeholder/cross-workflow assertions. |
| `tests/sprint164-ai-cmo-intelligence.test.mjs` | Validate contextual UX; replace superseded placeholder/cross-workflow assertions. |
| `tests/sprint195-real-estate-refocus.test.mjs` | Validate contextual UX; replace superseded placeholder/cross-workflow assertions. |
| `tests/sprint214-crm-workspace-reliability.test.mjs` | Validate contextual UX; replace superseded placeholder/cross-workflow assertions. |
| `tests/workflow-consistency.test.mjs` | Validate contextual UX; replace superseded placeholder/cross-workflow assertions. |
| `tests/sprint196-real-estate-experience.test.mjs` | Verify task-specific creation guidance instead of requiring unrelated secondary empty-state actions. |
