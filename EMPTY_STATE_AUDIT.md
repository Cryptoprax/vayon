# Empty State Audit

Final state: **Needs Verification** for live tenant data and all conditional states.

| Workspace / primary route | Business question | Empty-state decision and action | Evidence / remaining limit |
| --- | --- | --- | --- |
| Properties `/vayon/properties` | Which property needs attention? | Existing no-properties guidance refers to Create Property above and Clear filters | Source reviewed; earlier property fixture evidence retained, no new live write |
| Leads `/vayon/leads` | Who should I follow up with? | No leads in this view; adjust filters or use Create Lead above. Removed unrelated Settings escape from this empty state | Source reviewed; existing toolbar supplies creation |
| Clients `/vayon/crm/contacts` | Who are my clients? | Explain lead-backed client profiles; Go to Leads. Search misses offer Clear client search instead | SSR regression tests; source sync migration inspected, deployment unverified |
| Companies `/vayon/crm/companies` | Which company relationship should I work on? | Existing Create Company empty action stays in Companies | Source reviewed; creation route exists, live creation unverified |
| Deals `/vayon/deals` | Which transaction needs a next closing step? | Existing Create Deal above; removed separate leads/properties buttons from empty state | Source reviewed; no mutation change |
| Tasks `/vayon/tasks` | What should I do next? | Replaced generic work-queue copy with guidance to the task form above | Source reviewed; existing task form/action retained |
| Calendar `/vayon/calendar` | What is scheduled? | Explain that connected Google Calendar displays events and supplies the meeting form; removed provider-contract claims from form guidance | Source reviewed; provider connection and live scheduling unverified |
| Marketing `/vayon/growth` | What should the next campaign achieve? | Removed empty metric cards; existing lead-generation, campaign and document destinations supply concrete tasks | Source reviewed; no generation or publication success claimed |
| Approvals `/vayon/approvals` | What needs my approval? | Existing no-approvals state explains where future requests appear; no invented Create approval action | Source reviewed; request data provenance/live processing unverified |
| Settings `/vayon/settings` | What should I configure? | Existing section destinations; no invented no-data state. Simplified security/department descriptions | Source reviewed; authorization unchanged |

## Shared corrections

`UniversalEmptyState` no longer injects an AI onboarding pitch or unrelated property/lead/campaign/help actions. `WorkspaceEmptyState` no longer fabricates Create-to-Dashboard or demo destinations. `SmartEmptyState` omits a primary button when neither a destination nor handler exists. Explicit, context-specific caller actions remain available.

This audit covers the ten requested primary workspaces and inspected direct/shared components. It does not certify every error branch, nested record tab, imported provider state or tenant-specific empty result. Generic panels without working actions retain informational copy; no feature was created to satisfy an empty state.

Before/after rationale, validation and outstanding blockers are also recorded in WORKFLOW_CONSISTENCY_CERTIFICATION.md. No measured 80% work reduction or complete runtime certification is claimed.

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
