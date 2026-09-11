# Final business-critical beta certification

Status: Blocked

Product Bible v1.0 is frozen. This milestone audited the existing implementation and added the mandatory completion gate. It did not add product features, pages, services, repositories, schemas, APIs, or navigation changes.

## Decision

33 required workflows are documented: 0 Certified, 19 Blocked, 14 Needs Verification. No production or first-time-customer completion evidence was available. No workflow is promoted to Certified because local technical checks succeeded.

BUSINESS_WORKFLOW_MATRIX.md records entry/navigation, permissions, success, failure, recovery, next action, status and source evidence for every required workflow. PRODUCT_BIBLE_V1_COMPLETION_GATE.md records all seven mandatory conditions for future completion decisions.

## Acceptance criteria

| Criterion | Status | Evidence/limitation |
| --- | --- | --- |
| Owner exists immediately after signup | Blocked | Ownership is provisioned by onboarding, not auth signup |
| Invite Team fully functional | Blocked | Manager denied; email delivery unverified |
| Team joining certified | Blocked | Invitation targeting and joined-workspace selection incomplete |
| RBAC certified | Blocked | Runtime/visibility/service/SQL mismatches recorded |
| Password recovery certified | Blocked | Provider error ignored; production reset path unverified |
| Workspace recovery certified | Blocked | Switcher cannot select workspaces; selected-context recovery incomplete |
| Search certified | Blocked | Required customer tasks absent or misranked; five-second observation missing |
| Every critical workflow documented | Certified | 33 entries, each with seven workflow checkpoints and allowed status |
| Every workflow has an allowed status | Certified | Inventory uses only Certified, Blocked, Needs Verification |
| No duplicate functionality | Needs Verification | No functionality added; existing onboarding/invitation and module overlaps remain documented |
| No new architecture/services/repositories/schemas | Certified | Only reports, local audit script and evidence artifacts changed this milestone |

The Certified entries above concern this milestone's documentary/scope checks, not production business workflows. The business-workflow Certified count remains zero.

## Highest-priority blockers

1. Ownership creation depends on onboarding. Selected workspace and effective live Owner permissions before first dashboard require evidence.
2. Invitation SQL permits Owner/Admin only. Manager acceptance criterion is unmet; HR-manager runtime grant conflicts with SQL.
3. Acceptance chooses the newest pending invitation by email and ignores the returned workspace ID. Actual invite-link session establishment and delivery are unverified.
4. Legacy agent versus sales_representative role mismatch; property/lead/viewing role allowlists and actor lookups require reconciliation and live denial tests.
5. Founder-only Creative visibility overrides customer access. Canonical campaign Save is disabled. Missing publish-property, lead-conversion and direct client-create handoffs are recorded against the primary customer flows.
6. Password-reset submission ignores provider failure before presenting a sent-link message. Workspace switcher/recovery cannot complete selection.
7. Customer-role search has missing Campaign, Generate Brochure and Call Buyer static actions; Deal ranks Create Company first.

These are source findings. No unauthorized access, live data loss or production outcome is inferred from a source mismatch alone.

## Validation evidence

| Check | Technical result | Certification limit |
| --- | --- | --- |
| TypeScript | Exit 0 | Compilation only |
| ESLint | Exit 0, zero warnings; new audit script also checked | Static lint only |
| Regression tests | 1,632 completed, zero failures | Does not observe production customer workflows |
| Production build | Exit 0 | Local production artifact, not deployment |
| Navigation audit | Exit 0; 68 destinations, 346 page files | Source catalog/route integrity |
| Search audit | Existing script exit 0 | General queries omit the role-specific blockers |
| RBAC audit | Executed; Blocked | Six role variants; grants/navigation extracted; live RLS not exercised |
| Workspace audit | Executed; Blocked | Source selection/ownership/acceptance findings; live memberships unverified |
| Customer journey audit | Existing script exit 0 | Source routes, not first-time-customer observation |
| Interaction audit | Existing script exit 0 | Static contracts, not all real mutations |
| Accessibility audit | Existing script exit 0 | No comprehensive screen-reader or contrast certification |
| Responsive audit | Existing script exit 0; 16 local public-page browser checks | Authenticated pages not browser-certified |
| Commercial UX audit | Existing script exit 0 | No unassisted customer completion study |

Read-only Chromium checks used the local production build at widths 320, 768, 1440 and 2560 for home, signup, login with invitation return path, and forgot password. All 16 checks returned HTTP 200 with no page errors or horizontal overflow. Unauthenticated acceptance redirected to login with next=/accept-invitation. No forms were submitted. No user account, invitation, email, database record or workspace was mutated.

The added audit script executes 84 static search cases across six role variants. Millisecond calculation timings exclude typing, browser rendering, remote results, decision time and execution. They do not prove five-second discovery.

## Evidence still required

An existing QA environment/session was requested; none was supplied during this run, and PLAYWRIGHT_AUTH_STATE was not configured. Production identity-provider/email/tenant behavior and a real first-time customer were not observed. Do not replace this missing evidence with mocked success. Capture permitted role, environment, starting state, result, failure/recovery and next action for each remaining workflow before changing its status.

## Modified/new files in this milestone

- BUSINESS_WORKFLOW_MATRIX.md
- OWNER_CERTIFICATION.md
- TEAM_CERTIFICATION.md
- RBAC_CERTIFICATION.md
- RECOVERY_CERTIFICATION.md
- SEARCH_CERTIFICATION.md
- FINAL_BETA_CERTIFICATION.md
- PRODUCT_BIBLE_V1_COMPLETION_GATE.md
- scripts/audit-business-workflow-certification.mjs
- test-results/business-certification/source-audit.json
- test-results/business-certification/workflow-inventory.json
- test-results/business-certification/validation-audits.json
- test-results/business-certification/browser-audit.json
- test-results/business-certification/modified-files.json

SEARCH_CERTIFICATION.md is intentionally updated with this stricter milestone's findings. Earlier uncommitted application changes and previous audit artifacts are preserved. Regression tests regenerated their existing fixture files with no intentional fixture-content change. No application code was modified in this milestone.

No commit. No deployment.
