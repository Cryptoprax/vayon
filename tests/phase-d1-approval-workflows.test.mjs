import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const { subscriptionEntitlementCatalog } = load("features/vayon/billing/config/entitlements.ts");
function hasFeature(plan) { return subscriptionEntitlementCatalog[plan].features.includes("approvals"); }

const migration = readFileSync("supabase/migrations/20261102000000_business_approval_workflows.sql", "utf8");
const repositorySource = readFileSync("features/vayon/workflow-approval/repositories/supabase-approval.repository.ts", "utf8");
const serviceSource = readFileSync("features/vayon/workflow-approval/services/governance.service.ts", "utf8");
const actionsSource = readFileSync("features/vayon/workflow-approval/actions/approval.actions.ts", "utf8");
const approvalsPage = readFileSync("app/vayon/approvals/page.tsx", "utf8");
const approvalDetailPage = readFileSync("app/vayon/approvals/[approvalId]/page.tsx", "utf8");
const executionsPage = readFileSync("app/vayon/executions/page.tsx", "utf8");
const workflowDetailPage = readFileSync("app/vayon/workflows/[workflowId]/page.tsx", "utf8");
const founderApprovalsPage = readFileSync("app/vayon/founder/approvals/page.tsx", "utf8");
const permissionTypes = readFileSync("features/platform/permissions/runtime/types.ts", "utf8");
const permissionPolicy = readFileSync("features/platform/permissions/runtime/policy.ts", "utf8");
const oldGovernanceServiceModelsFile = "features/vayon/workflow-approval/domain/models.ts";
const oldInMemoryRepoFile = "features/vayon/workflow-approval/repositories/in-memory.repository.ts";

// NOTE ON PART 20 (disposable local database validation): this environment has
// no working Docker daemon, no local Postgres binary, and no supabase CLI
// installed (confirmed: `docker run` fails with "cannot connect to the Docker
// API", Docker Desktop's executable is not present at its expected path, and
// no pg-mem/pglite/psql/pg_ctl exists anywhere on this machine). The migration
// was therefore NOT applied to any database, disposable or otherwise, in this
// session. The tests below marked "STATIC SQL VERIFICATION" inspect the exact
// migration source text for the required RLS/RPC guarantees (predicate shape,
// SECURITY DEFINER + search_path hardening, row locking, version/self-approval
// checks) as the best available substitute given that constraint -- they are
// NOT a substitute for a real behavioral run against Postgres before this
// migration is ever applied anywhere, which should happen before Phase D1 is
// considered production-ready.

// ---------------------------------------------------------------------------
// ENTITLEMENT (28-33)
// ---------------------------------------------------------------------------
test("28-30: approvals -- Starter, Professional, and Founding Professional (plan_code-based) denied", () => {
  assert.equal(hasFeature("starter"), false);
  assert.equal(hasFeature("professional"), false);
  const entitlementsSource = readFileSync("features/vayon/billing/config/entitlements.ts", "utf8");
  assert.doesNotMatch(entitlementsSource, /founding/i, "founding must never influence feature access -- plan_code is the only signal");
});
test("31-33: approvals -- Business, Business Plus, Enterprise allowed", () => {
  for (const plan of ["business", "business_plus", "enterprise"]) assert.equal(hasFeature(plan), true);
});
test("approvals entitlement tier placement was pre-existing and is unchanged by this phase", () => {
  const entitlementsSource = readFileSync("features/vayon/billing/config/entitlements.ts", "utf8");
  assert.doesNotMatch(execSync("git diff --stat -- features/vayon/billing/config/entitlements.ts", { cwd: process.cwd() }).toString(), /\d+ insertion|\d+ deletion/, "entitlements.ts must not be modified in this phase");
  void entitlementsSource;
});

// ---------------------------------------------------------------------------
// DATABASE / RLS -- STATIC SQL VERIFICATION (1-6)
// ---------------------------------------------------------------------------
test("1-2: RLS is enabled on both new tables", () => {
  assert.match(migration, /alter table public\.approval_requests enable row level security/);
  assert.match(migration, /alter table public\.approval_events enable row level security/);
});
test("3: no policy uses a broad USING(true)", () => {
  const policyBlocks = migration.match(/create policy[^;]+;/gs) ?? [];
  assert.ok(policyBlocks.length >= 2, "expected at least 2 policies");
  for (const block of policyBlocks) assert.doesNotMatch(block, /using\s*\(\s*true\s*\)/i);
});
test("4: SELECT policies are tenant-scoped via is_organization_member + current_workspace_role", () => {
  assert.match(migration, /create policy "approval_requests_workspace_read" on public\.approval_requests\s*\n\s*for select to authenticated\s*\n\s*using \(public\.is_organization_member\(organization_id\) and public\.current_workspace_role\(workspace_id\) is not null\)/);
  assert.match(migration, /create policy "approval_events_workspace_read" on public\.approval_events\s*\n\s*for select to authenticated\s*\n\s*using \(public\.is_organization_member\(organization_id\) and public\.current_workspace_role\(workspace_id\) is not null\)/);
});
test("5: no direct INSERT/UPDATE/DELETE policy exists for authenticated users -- writes are RPC-only", () => {
  const policyBlocks = migration.match(/create policy[^;]+;/gs) ?? [];
  assert.equal(policyBlocks.length, 2, "expected exactly the two SELECT policies and nothing else");
  for (const block of policyBlocks) assert.match(block, /for select/i);
});
test("6: every new function hardens search_path and uses security definer", () => {
  for (const fn of ["can_manage_approvals", "request_approval", "decide_approval", "cancel_approval"]) {
    const start = migration.indexOf(`create or replace function public.${fn}(`);
    assert.ok(start !== -1, `missing function ${fn}`);
    const body = migration.slice(start, migration.indexOf("$$", migration.indexOf("as $$", start) + 5));
    assert.match(body, /security definer/);
    assert.match(body, /set search_path = public/);
  }
});
test("grants: execute is revoked from public and granted only to authenticated for every new function", () => {
  for (const fn of ["can_manage_approvals(uuid)", "request_approval(uuid, jsonb)", "decide_approval(uuid, integer, text, text)", "cancel_approval(uuid, integer)"]) {
    assert.match(migration, new RegExp(`revoke all on function public\\.${fn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} from public`));
    assert.match(migration, new RegExp(`grant execute on function public\\.${fn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} to authenticated`));
  }
});
test("can_manage_approvals uses only role codes present in the current, authoritative role catalog (not the stale 'branch_manager' legacy set)", () => {
  const { workspaceRoleCodes } = load("features/platform/organization/config/workspace-role-catalog.ts");
  const match = migration.match(/current_workspace_role\(p_workspace_id\) in \(([^)]+)\)/);
  assert.ok(match, "expected can_manage_approvals role list");
  const roles = match[1].split(",").map((s) => s.trim().replace(/'/g, ""));
  assert.doesNotMatch(migration, /workspace-approver/, "must not invent the nonexistent demo role name");
  for (const role of roles) assert.ok(workspaceRoleCodes.includes(role), `${role} must exist in the current role catalog`);
});

// ---------------------------------------------------------------------------
// TENANT ISOLATION -- STATIC SQL VERIFICATION (7-10)
// ---------------------------------------------------------------------------
test("7-8-9: decide_approval and cancel_approval derive their tenant scope from the locked row itself, never from client input, and gate on can_manage_approvals(a.workspace_id)", () => {
  const decideBody = migration.slice(migration.indexOf("create or replace function public.decide_approval"), migration.indexOf("create or replace function public.cancel_approval"));
  assert.match(decideBody, /select \* into a from approval_requests where id = p_approval_id for update/);
  assert.match(decideBody, /not public\.can_manage_approvals\(a\.workspace_id\)/);
  const cancelBody = migration.slice(migration.indexOf("create or replace function public.cancel_approval"), migration.indexOf("-- ====", migration.indexOf("create or replace function public.cancel_approval") + 10));
  assert.match(cancelBody, /select \* into a from approval_requests where id = p_approval_id for update/);
  assert.match(cancelBody, /not public\.can_manage_approvals\(a\.workspace_id\)/);
});
test("10: raw approval UUID alone cannot bypass the tenant boundary -- SELECT RLS requires organization membership even when the row id is known, and every repository read filters organization_id/workspace_id explicitly (defense in depth)", () => {
  assert.match(repositorySource, /\.eq\("organization_id", this\.organizationId\)\s*\n\s*\.eq\("workspace_id", this\.workspaceId\)/);
  const getBlock = repositorySource.slice(repositorySource.indexOf("async get("), repositorySource.indexOf("async events("));
  assert.match(getBlock, /\.eq\("id", id\)/);
  assert.match(getBlock, /\.eq\("organization_id", this\.organizationId\)/);
  assert.match(getBlock, /\.eq\("workspace_id", this\.workspaceId\)/);
});

// ---------------------------------------------------------------------------
// REQUEST -- STATIC SQL VERIFICATION (11-15)
// ---------------------------------------------------------------------------
test("11-12: request_approval requires an active workspace_members row -- non-members are rejected", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.request_approval"), migration.indexOf("create or replace function public.decide_approval"));
  assert.match(body, /where workspace_id = p_workspace_id\s*\n\s*and user_id = v_user\s*\n\s*and status = 'active'/);
  assert.match(body, /if v_org is null then\s*\n\s*raise exception 'insufficient approval permission'/);
});
test("13: requested_by is set from auth.uid(), never from client input", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.request_approval"), migration.indexOf("create or replace function public.decide_approval"));
  assert.match(body, /v_user uuid := auth\.uid\(\)/);
  assert.match(body, /v_org, p_workspace_id, v_source_type, v_source_id, v_action_type, v_payload, v_user/);
  assert.doesNotMatch(body, /p_input->>'requestedBy'|p_input->>'organizationId'/);
});
test("14: organization_id is derived server-side from the caller's own membership row, never accepted from the client", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.request_approval"), migration.indexOf("create or replace function public.decide_approval"));
  assert.doesNotMatch(body, /p_organization_id|p_input->>'organizationId'/);
  assert.match(body, /select organization_id into v_org/);
});
test("15: requesting creates an approval.requested event, and also an activity_events entry using the established schema/pattern", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.request_approval"), migration.indexOf("create or replace function public.decide_approval"));
  assert.match(body, /insert into approval_events[\s\S]*?'approval\.requested'/);
  assert.match(body, /insert into activity_events \(organization_id, workspace_id, event_type, title, actor_id, related_type, related_id\)/);
});
test("malformed JSON (missing sourceType/actionType, non-object payload, invalid sourceId uuid) is rejected before any row is written", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.request_approval"), migration.indexOf("create or replace function public.decide_approval"));
  assert.match(body, /if v_source_type is null or v_action_type is null then\s*\n\s*raise exception 'sourceType and actionType are required'/);
  assert.match(body, /if jsonb_typeof\(v_payload\) <> 'object' then\s*\n\s*raise exception 'payload must be a JSON object'/);
  assert.match(body, /exception when invalid_text_representation then\s*\n\s*raise exception 'sourceId must be a valid uuid'/);
});

// ---------------------------------------------------------------------------
// DECISION -- STATIC SQL VERIFICATION (16-22)
// ---------------------------------------------------------------------------
test("16-17: decide_approval accepts 'approved' and 'rejected' only", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.decide_approval"), migration.indexOf("create or replace function public.cancel_approval"));
  assert.match(body, /if p_decision not in \('approved', 'rejected'\) then/);
});
test("18: an ordinary member (not in can_manage_approvals' role list) is rejected by the same gate used for approve/reject", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.decide_approval"), migration.indexOf("create or replace function public.cancel_approval"));
  assert.match(body, /if not found or not public\.can_manage_approvals\(a\.workspace_id\) then\s*\n\s*raise exception 'insufficient approval permission'/);
});
test("19: self-approval is forbidden regardless of role", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.decide_approval"), migration.indexOf("create or replace function public.cancel_approval"));
  assert.match(body, /if a\.requested_by = v_user then\s*\n\s*raise exception 'approval policy forbids self approval'/);
});
test("20: a stale expected_version is rejected", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.decide_approval"), migration.indexOf("create or replace function public.cancel_approval"));
  assert.match(body, /if a\.version <> p_expected_version then\s*\n\s*raise exception 'approval changed by another user'/);
});
test("21: an already-decided (non-pending) approval cannot be decided again", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.decide_approval"), migration.indexOf("create or replace function public.cancel_approval"));
  assert.match(body, /if a\.status <> 'pending' then\s*\n\s*raise exception 'approval is not pending'/);
});
test("22: a decision writes status/approver_id/reason/decided_at/version and an approval.<decision> event", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.decide_approval"), migration.indexOf("create or replace function public.cancel_approval"));
  assert.match(body, /set status = p_decision,\s*\n\s*approver_id = v_user,\s*\n\s*reason = p_reason,\s*\n\s*decided_at = now\(\),\s*\n\s*version = version \+ 1/);
  assert.match(body, /'approval\.' \|\| p_decision/);
});

// ---------------------------------------------------------------------------
// CANCEL -- STATIC SQL VERIFICATION (23-27)
// ---------------------------------------------------------------------------
test("23-24: cancel is permitted for the original requester OR a manage-capable role", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.cancel_approval"), migration.length);
  assert.match(body, /a\.requested_by <> v_user and not public\.can_manage_approvals\(a\.workspace_id\)/);
});
test("25: an unrelated member (neither requester nor manage-capable) cannot cancel", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.cancel_approval"), migration.length);
  assert.match(body, /if not found or \(a\.requested_by <> v_user and not public\.can_manage_approvals\(a\.workspace_id\)\) then\s*\n\s*raise exception 'insufficient approval permission'/);
});
test("26: a decided (non-pending) approval cannot be cancelled", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.cancel_approval"), migration.length);
  assert.match(body, /if a\.status <> 'pending' then\s*\n\s*raise exception 'approval is not pending'/);
});
test("27: cancel sets status='cancelled' (no hard delete) and writes an approval.cancelled event", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.cancel_approval"), migration.length);
  assert.match(body, /set status = 'cancelled',\s*\n\s*version = version \+ 1/);
  assert.match(body, /'approval\.cancelled'/);
  assert.doesNotMatch(body, /delete from approval_requests/);
});

// ---------------------------------------------------------------------------
// PERMISSION MODULE (application layer)
// ---------------------------------------------------------------------------
test("approvals was added to the existing PermissionModule union -- no second permission system introduced", () => {
  assert.match(permissionTypes, /"organization_settings","approvals"/);
});
test("organization_admin and legacy manager (both present in can_manage_approvals) get the manage grant; domain managers get view+request only, matching the DB-level restriction", () => {
  assert.match(permissionPolicy, /organization_admin:\{[^}]*approvals:manage/);
  assert.match(permissionPolicy, /\n  manager:\{[^}]*approvals:manage/);
  for (const role of ["operations_manager", "sales_manager", "marketing_manager", "customer_success_manager"]) {
    const re = new RegExp(`${role}:\\{[^}]*approvals:work`);
    assert.match(permissionPolicy, re, `${role} should get view+request (work), not manage`);
  }
});
test("guest gets no approvals grant (matches its existing empty grant everywhere else)", () => {
  assert.match(permissionPolicy, /guest:\{\},/);
});

// ---------------------------------------------------------------------------
// DIRECT BYPASS (34-36) -- genuine JS-level behavioral proof
// ---------------------------------------------------------------------------
test("34: requestApprovalAction respects entitlement -- denied before any repository/RPC call runs", async () => {
  let repositoryCalled = false;
  class FeatureNotEntitledError extends Error {}
  const { requestApprovalAction } = load("features/vayon/workflow-approval/actions/approval.actions.ts", {
    "@/features/vayon/billing/services/subscription-write-guard": { guardSubscriptionAction: async () => {} },
    "@/features/vayon/billing/services/require-entitlement": { requireEntitlement: async () => { throw new FeatureNotEntitledError("denied"); }, FeatureNotEntitledError },
    "@/features/platform/permissions/runtime/permission.service": { requireWorkspacePermission: async () => { repositoryCalled = true; } },
    "../services/governance.service": { GovernanceService: { production: async () => ({ requestApproval: async () => { repositoryCalled = true; return "id"; } }) } },
    "next/cache": { revalidatePath() {} },
    "next/navigation": { redirect: (url) => { throw new Error(`redirect:${url}`); } },
  });
  const form = new FormData();
  form.set("sourceType", "marketing_campaign");
  form.set("actionType", "campaign.publish");
  await assert.rejects(() => requestApprovalAction(form), /FeatureNotEntitledError|denied/);
  assert.equal(repositoryCalled, false, "no permission check or repository call may run once entitlement is denied");
});
test("35: approveApprovalAction respects role permission -- denied before decideApproval runs, even when entitlement is granted", async () => {
  let decideCalled = false;
  const { approveApprovalAction } = load("features/vayon/workflow-approval/actions/approval.actions.ts", {
    "@/features/vayon/billing/services/subscription-write-guard": { guardSubscriptionAction: async () => {} },
    "@/features/vayon/billing/services/require-entitlement": { requireEntitlement: async () => ({ allowed: true }) },
    "@/features/platform/permissions/runtime/permission.service": { requireWorkspacePermission: async () => { throw new Error("insufficient approval permission"); } },
    "../services/governance.service": { GovernanceService: { production: async () => ({ decideApproval: async () => { decideCalled = true; } }) } },
    "next/cache": { revalidatePath() {} },
    "next/navigation": { redirect: (url) => { throw new Error(`redirect:${url}`); } },
  });
  const form = new FormData();
  form.set("approvalId", "00000000-0000-0000-0000-000000000000");
  form.set("version", "1");
  await assert.rejects(() => approveApprovalAction(form));
  assert.equal(decideCalled, false, "decideApproval must never run once the role permission check fails");
});
test("36: direct ID tampering remains tenant-safe -- the repository never queries by id alone, always id + organization_id + workspace_id", () => {
  assert.doesNotMatch(repositorySource, /\.eq\("id", id\)\s*\n\s*\.maybeSingle\(\)/, "get() must not query by id alone");
  const getBlock = repositorySource.slice(repositorySource.indexOf("async get("), repositorySource.indexOf("async events("));
  assert.match(getBlock, /\.eq\("organization_id", this\.organizationId\)/);
  assert.match(getBlock, /\.eq\("workspace_id", this\.workspaceId\)/);
});

// ---------------------------------------------------------------------------
// PRODUCTION DATA (37-39)
// ---------------------------------------------------------------------------
test("37-38: GovernanceService.production() uses SupabaseApprovalRepository via operationsContext(); no customer route constructs the old in-memory singleton", () => {
  assert.match(serviceSource, /static async production\(\)/);
  assert.match(serviceSource, /operationsContext\(\)/);
  assert.match(serviceSource, /new SupabaseApprovalRepository\(c\.client, c\.organizationId, c\.workspaceId\)/);
  for (const page of [approvalsPage, approvalDetailPage]) {
    assert.match(page, /GovernanceService\.production\(\)/);
    assert.doesNotMatch(page, /InMemoryGovernanceRepository|InMemoryApprovalRepository/);
  }
});
test("39: the fake governed-crm-actions demo workflow is not displayed as live tenant data anywhere in the customer production path", () => {
  for (const page of [approvalsPage, approvalDetailPage, executionsPage, workflowDetailPage]) {
    assert.doesNotMatch(page, /^(?!\s*\/\/).*governed-crm-actions/m, "must not reference the fixture outside an explanatory comment");
    assert.doesNotMatch(page, /import.*InMemoryGovernanceRepository/);
  }
  assert.match(executionsPage, /FeatureAvailabilityState/);
  assert.match(workflowDetailPage, /FeatureAvailabilityState/);
});
test("the old demo scaffold (GovernanceRepository interface, InMemoryGovernanceRepository, engines, old domain types) is retained, not deleted, and is no longer referenced by governance.service.ts", () => {
  assert.doesNotMatch(execSync(`git status --short -- ${oldInMemoryRepoFile} ${oldGovernanceServiceModelsFile}`, { cwd: process.cwd() }).toString(), /./s, "old demo files must be untouched, not deleted or modified");
  assert.doesNotMatch(serviceSource, /import.*(InMemoryGovernanceRepository|GovernanceRepository)/, "governance.service.ts must not import the old demo scaffold (mentioning it in a comment for context is fine)");
});

// ---------------------------------------------------------------------------
// FOUNDER (40)
// ---------------------------------------------------------------------------
test("40: the founder approval system is untouched and remains completely separate", () => {
  assert.doesNotMatch(execSync("git status --short -- app/vayon/founder/approvals features/vayon/founder-approval-center", { cwd: process.cwd() }).toString(), /./s);
  assert.doesNotMatch(founderApprovalsPage, /GovernanceService|approval_requests|can_manage_approvals/);
});

// ---------------------------------------------------------------------------
// Pages: entitlement gate, dynamic rendering, real data (Part 12 requirements)
// ---------------------------------------------------------------------------
for (const [name, page] of [["approvals list", approvalsPage], ["approval detail", approvalDetailPage]]) {
  test(`${name} page: gated on requireEntitlement("approvals"), dynamic, and shows the upgrade state on denial`, () => {
    assert.match(page, /await requireEntitlement\("approvals"\)/);
    assert.match(page, /FeatureNotEntitledError/);
    assert.match(page, /EntitlementUpgradeRequired/);
    assert.match(page, /export const dynamic = "force-dynamic";/);
  });
}
test("no route/action outside the approvals feature newly calls requireEntitlement(\"approvals\")", () => {
  const output = execSync('git grep --untracked -l "requireEntitlement(\\"approvals\\")" -- ":!tests"', { cwd: process.cwd() }).toString();
  const found = output.trim().split("\n").filter(Boolean).sort();
  const expected = [
    "app/vayon/approvals/page.tsx",
    "app/vayon/approvals/[approvalId]/page.tsx",
    "features/vayon/workflow-approval/actions/approval.actions.ts",
  ].sort();
  assert.deepEqual(found, expected);
});

// ---------------------------------------------------------------------------
// No regression in unrelated systems
// ---------------------------------------------------------------------------
test("no regression: AI Workforce, Customer Success, Automation, and Phase C2 gates are unchanged", () => {
  const aiActions = readFileSync("features/vayon/ai-workforce/actions/ai.actions.ts", "utf8");
  const customerSuccessActions = readFileSync("features/platform/customer-success-workspace/actions/customer-success.actions.ts", "utf8");
  const workflowActions = readFileSync("features/platform/workflows/actions/index.ts", "utf8");
  const securityRoute = readFileSync("app/api/security/route.ts", "utf8");
  assert.match(aiActions, /await requireEntitlement\("ai_workforce"\)/);
  assert.match(customerSuccessActions, /await requireEntitlement\("customer_success"\)/);
  assert.match(workflowActions, /await requireEntitlement\("automation"\)/);
  assert.match(securityRoute, /await requireEntitlement\("api"\)/);
});
test("no regression: no pricing, Paddle, billing lifecycle, founding, quota, or check_subscription_limit file was touched in this phase", () => {
  const output = execSync("git status --short -- features/marketing/components/PricingTable.tsx features/platform/commercial-pricing.ts features/vayon/billing/providers features/vayon/billing/config/entitlements.ts", { cwd: process.cwd() }).toString();
  assert.equal(output.trim(), "");
  assert.doesNotMatch(migration, /organization_limits|check_subscription_limit|subscription_plans/i);
});
test("no checkout is triggered by any approval denial or mutation path", () => {
  for (const source of [approvalsPage, approvalDetailPage, actionsSource]) assert.doesNotMatch(source, /checkout\(|paddle\.com|openCheckoutOverlay/i);
});
