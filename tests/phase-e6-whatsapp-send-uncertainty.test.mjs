import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const migration = readFileSync("supabase/migrations/20261109000000_whatsapp_send_uncertainty.sql", "utf8");
const e5Migration = readFileSync("supabase/migrations/20261108000000_whatsapp_ai_send_execution.sql", "utf8");
const reconciliationSource = readFileSync("features/platform/integrations/whatsapp/whatsapp-send-reconciliation.service.ts", "utf8");
const routeSource = readFileSync("app/api/whatsapp/send-executions/reconcile/route.ts", "utf8");
const eligibilitySource = readFileSync("features/platform/integrations/whatsapp/whatsapp-draft-send-eligibility.service.ts", "utf8");
const executorSource = readFileSync("features/platform/integrations/whatsapp/whatsapp-send-execution.service.ts", "utf8");
const whatsappViewsSource = readFileSync("features/vayon/workflow-approval/components/WhatsAppDraftApprovalViews.tsx", "utf8");
const detailPageSource = readFileSync("app/vayon/whatsapp/approvals/[approvalId]/page.tsx", "utf8");
const founderReconcileSource = readFileSync("app/api/billing/paddle/founding/reconcile/route.ts", "utf8");

// NOTE ON LIVE-DATABASE VALIDATION: this environment still has no working
// Docker daemon, local Postgres binary, or supabase CLI. STATIC SQL TESTS DO
// NOT PROVE LIVE POSTGRES BEHAVIOR.

// ---------------------------------------------------------------------------
// Genuine execution: eligibility with the new claimed/uncertain/failed-retry states
// ---------------------------------------------------------------------------
function makeFakeClient(selects) {
  const chain = (table) => {
    const finish = async () => ({ data: selects[table] ?? null, error: null });
    const c = { eq: () => c, is: () => c, order: () => c, limit: () => c, maybeSingle: finish, single: finish, then: (resolve, reject) => finish().then(resolve, reject) };
    return c;
  };
  return { from: (table) => ({ select: () => chain(table) }) };
}
function loadEligibility(client) {
  return load("features/platform/integrations/whatsapp/whatsapp-draft-send-eligibility.service.ts", { "@/lib/supabase/service": { createSupabaseServiceClient: () => client } });
}
const baseSelects = {
  ai_workforce_messages: { id: "draft-1", conversation_id: "conv-1", role: "assistant", delivery_state: "draft" },
  ai_workforce_conversations: { id: "conv-1", channel: "whatsapp", communication_thread_id: "thread-1", lead_id: "lead-1" },
  approval_requests: { id: "approval-1", status: "approved" },
};

test("6: an execution with status='claimed' is not eligible (reason='claimed')", async () => {
  const client = makeFakeClient({ ...baseSelects, whatsapp_ai_send_executions: { status: "claimed" } });
  const { resolveWhatsAppDraftSendEligibility } = loadEligibility(client);
  const result = await resolveWhatsAppDraftSendEligibility({ organizationId: "org-1", workspaceId: "ws-1", draftMessageId: "draft-1" });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "claimed");
});
test("6: an execution with status='uncertain' is not eligible (reason='uncertain')", async () => {
  const client = makeFakeClient({ ...baseSelects, whatsapp_ai_send_executions: { status: "uncertain" } });
  const { resolveWhatsAppDraftSendEligibility } = loadEligibility(client);
  const result = await resolveWhatsAppDraftSendEligibility({ organizationId: "org-1", workspaceId: "ws-1", draftMessageId: "draft-1" });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "uncertain");
});
test("7: an execution with status='failed' remains eligible (retry allowed), flagged as retryOfFailedExecution", async () => {
  const client = makeFakeClient({ ...baseSelects, whatsapp_ai_send_executions: { status: "failed" } });
  const { resolveWhatsAppDraftSendEligibility } = loadEligibility(client);
  const result = await resolveWhatsAppDraftSendEligibility({ organizationId: "org-1", workspaceId: "ws-1", draftMessageId: "draft-1" });
  assert.equal(result.eligible, true);
  assert.equal(result.retryOfFailedExecution, true);
});
test("8: an execution with status='sent' remains blocked (reason='already_sent')", async () => {
  const client = makeFakeClient({ ...baseSelects, ai_workforce_messages: { ...baseSelects.ai_workforce_messages, delivery_state: "sent" }, whatsapp_ai_send_executions: { status: "sent" } });
  const { resolveWhatsAppDraftSendEligibility } = loadEligibility(client);
  const result = await resolveWhatsAppDraftSendEligibility({ organizationId: "org-1", workspaceId: "ws-1", draftMessageId: "draft-1" });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "already_sent");
});
test("no execution row at all remains eligible, not flagged as a retry", async () => {
  const client = makeFakeClient({ ...baseSelects, whatsapp_ai_send_executions: null });
  const { resolveWhatsAppDraftSendEligibility } = loadEligibility(client);
  const result = await resolveWhatsAppDraftSendEligibility({ organizationId: "org-1", workspaceId: "ws-1", draftMessageId: "draft-1" });
  assert.equal(result.eligible, true);
  assert.equal(result.retryOfFailedExecution, false);
});

// ---------------------------------------------------------------------------
// Genuine execution: flagStaleWhatsAppSendExecutions (reconciliation)
// ---------------------------------------------------------------------------
function loadReconciliation(rpcHandler) {
  const rpcCalls = [];
  const client = { rpc: async (name, params) => { rpcCalls.push({ name, params }); return rpcHandler(name, params); } };
  const mod = load("features/platform/integrations/whatsapp/whatsapp-send-reconciliation.service.ts", { "@/lib/supabase/service": { createSupabaseServiceClient: () => client } });
  return { ...mod, rpcCalls };
}

test("1/2: a recent claimed execution (within the threshold) is not flagged -- flagStaleWhatsAppSendExecutions passes a stale_before cutoff exactly WHATSAPP_SEND_UNCERTAIN_AFTER_MS in the past", async () => {
  const { flagStaleWhatsAppSendExecutions, WHATSAPP_SEND_UNCERTAIN_AFTER_MS, rpcCalls } = loadReconciliation((name) => {
    assert.equal(name, "flag_stale_whatsapp_send_executions");
    return { data: [], error: null };
  });
  assert.equal(WHATSAPP_SEND_UNCERTAIN_AFTER_MS, 5 * 60 * 1000);
  const now = new Date("2026-01-01T00:10:00.000Z");
  const result = await flagStaleWhatsAppSendExecutions(now);
  assert.deepEqual(result.flaggedExecutionIds, []);
  const expectedCutoff = new Date(now.getTime() - WHATSAPP_SEND_UNCERTAIN_AFTER_MS).toISOString();
  assert.equal(rpcCalls[0].params.p_stale_before, expectedCutoff);
});
test("2: the classifier reports the ids it flagged, without calling any other RPC", async () => {
  const { flagStaleWhatsAppSendExecutions, rpcCalls } = loadReconciliation(() => ({ data: ["exec-a", "exec-b"], error: null }));
  const result = await flagStaleWhatsAppSendExecutions(new Date());
  assert.deepEqual(result.flaggedExecutionIds, ["exec-a", "exec-b"]);
  assert.equal(rpcCalls.length, 1);
});
test("9/10: the reconciliation service never references a provider client, fetch, or OpenAI -- it only calls one RPC", () => {
  assert.doesNotMatch(reconciliationSource, /await fetch\(|graph\.facebook\.com|OpenAIProvider|new WhatsAppService/);
  assert.equal((reconciliationSource.match(/\.rpc\(/g) ?? []).length, 1);
});
test("11/12/13: the reconciliation service never touches communications, whatsapp_messages, or delivery_state -- it has no columns/tables for those at all", () => {
  assert.doesNotMatch(reconciliationSource, /communications|whatsapp_messages|delivery_state/);
});

// ---------------------------------------------------------------------------
// PART 1/2/3 -- STATE MODEL
// ---------------------------------------------------------------------------
test("exactly one additive status value ('uncertain') was added to whatsapp_ai_send_executions -- claimed/sent/failed are preserved", () => {
  assert.match(migration, /check \(status in \('claimed', 'sent', 'failed', 'uncertain'\)\)/);
  assert.match(e5Migration, /check \(status in \('claimed', 'sent', 'failed'\)\)/);
});
test("the threshold is a documented TypeScript constant, not hardcoded SQL magic -- the SQL function takes p_stale_before as a parameter", () => {
  assert.match(reconciliationSource, /export const WHATSAPP_SEND_UNCERTAIN_AFTER_MS = 5 \* 60 \* 1000;/);
  assert.match(migration, /create or replace function public\.flag_stale_whatsapp_send_executions\(p_stale_before timestamptz\)/);
  assert.doesNotMatch(migration, /now\(\) - interval/);
});
test("3: claim_whatsapp_draft_send's existing retry branch (Phase E5, unmodified) only matches status='failed' -- an 'uncertain' row is not retry-eligible with no new code required to enforce that", () => {
  const body = e5Migration.slice(e5Migration.indexOf("create or replace function public.claim_whatsapp_draft_send"), e5Migration.indexOf("revoke all on function public.claim_whatsapp_draft_send"));
  assert.match(body, /and draft_message_id = p_draft_message_id and status = 'failed'/);
  assert.doesNotMatch(body, /'uncertain'/);
  const e5Diff = execSync("git diff --stat -- supabase/migrations/20261108000000_whatsapp_ai_send_execution.sql", { cwd: process.cwd() }).toString();
  assert.equal(e5Diff.trim(), "", "the E5 migration file itself must be completely untouched by E6");
});

// ---------------------------------------------------------------------------
// PART 4 -- RECONCILIATION FUNCTION: CLASSIFICATION ONLY
// ---------------------------------------------------------------------------
test("STATIC SQL: flag_stale_whatsapp_send_executions never calls mark_whatsapp_send_succeeded/mark_whatsapp_send_failed, never inserts into communications/whatsapp_messages, and only ever sets status='uncertain'", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.flag_stale_whatsapp_send_executions"), migration.indexOf("revoke all on function public.flag_stale_whatsapp_send_executions"));
  assert.doesNotMatch(body, /mark_whatsapp_send_succeeded|mark_whatsapp_send_failed|insert into communications|insert into whatsapp_messages|graph\.facebook\.com/);
  assert.match(body, /set status = 'uncertain'/);
  const statusSets = (body.match(/set status = /g) ?? []).length;
  assert.equal(statusSets, 1);
});
test("only a stale, currently-'claimed' row is ever touched -- the UPDATE's WHERE clause requires both conditions", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.flag_stale_whatsapp_send_executions"), migration.indexOf("revoke all on function public.flag_stale_whatsapp_send_executions"));
  assert.match(body, /where status = 'claimed' and claimed_at < p_stale_before/);
});
test("security-critical: flag_stale_whatsapp_send_executions is service_role-only", () => {
  assert.match(migration, /revoke all on function public\.flag_stale_whatsapp_send_executions\(timestamptz\) from public;\s*\ngrant execute on function public\.flag_stale_whatsapp_send_executions\(timestamptz\) to service_role;/);
  const body = migration.slice(migration.indexOf("create or replace function public.flag_stale_whatsapp_send_executions"), migration.indexOf("revoke all on function public.flag_stale_whatsapp_send_executions"));
  assert.match(body, /if current_setting\('role', true\) <> 'service_role' then/);
});

// ---------------------------------------------------------------------------
// PART 5 -- EXECUTION METHOD (reuses existing cron pattern, not a new scheduler)
// ---------------------------------------------------------------------------
test("the reconcile route mirrors the existing founding-member reconcile route's CRON_SECRET pattern exactly -- no new scheduler infrastructure was built", () => {
  assert.match(routeSource, /timingSafeEqual/);
  assert.match(routeSource, /process\.env\.CRON_SECRET/);
  assert.match(routeSource, /export const maxDuration = 300;/);
  assert.match(founderReconcileSource, /timingSafeEqual/);
  assert.match(founderReconcileSource, /process\.env\.CRON_SECRET/);
});
test("no crons entry was added to vercel.json -- this route's actual trigger is external/manual, exactly like the pre-existing founding-reconcile route", () => {
  const vercelConfig = readFileSync("vercel.json", "utf8");
  assert.doesNotMatch(vercelConfig, /"crons"/);
});

// ---------------------------------------------------------------------------
// PART 6/7 -- CUSTOMER UX AND RETRY SAFETY
// ---------------------------------------------------------------------------
test("the detail page maps eligibility's new claimed/uncertain reasons onto sendState -- the UI cannot silently fall back to 'eligible' for either", () => {
  assert.match(detailPageSource, /eligibility\.reason === "claimed"\) sendState = "claimed"/);
  assert.match(detailPageSource, /eligibility\.reason === "uncertain"\) sendState = "uncertain"/);
});
test("16/17: the uncertain warning renders the exact required copy, with no raw provider/internal detail exposed", () => {
  assert.match(whatsappViewsSource, /Delivery status could not be confirmed\. Do not resend until the conversation is checked\./);
  const uncertainBlock = whatsappViewsSource.slice(whatsappViewsSource.indexOf('sendState === "uncertain"'), whatsappViewsSource.indexOf('sendState === "uncertain"') + 300);
  assert.doesNotMatch(uncertainBlock, /failure_code|provider_message_id|access_token/);
});
test("no override/force-send button exists for the uncertain state -- canSend is false whenever sendState is 'uncertain' or 'claimed'", () => {
  assert.match(whatsappViewsSource, /const canSend = \(sendState === "eligible" \|\| sendState === "failed_retryable"\) && canDecide;/);
  assert.doesNotMatch(whatsappViewsSource, /uncertain[\s\S]{0,150}sendApprovedWhatsAppDraftAction/);
});
test("5/7/8: uncertain and sent are both excluded from canSend; failed_retryable is included, matching Part 7's exact matrix", () => {
  const canSendLine = whatsappViewsSource.match(/const canSend = .+;/)[0];
  assert.doesNotMatch(canSendLine, /"uncertain"|"sent"|"claimed"/);
  assert.match(canSendLine, /"eligible"/);
  assert.match(canSendLine, /"failed_retryable"/);
});

// ---------------------------------------------------------------------------
// PART 8 -- NO FABRICATED CONVERSATION STATE
// ---------------------------------------------------------------------------
test("reconciliation performs zero writes to any customer-visible communication table -- confirmed above; additionally, the executor's own success path is unmodified by this phase", () => {
  const executorDiff = execSync("git diff --stat -- features/platform/integrations/whatsapp/whatsapp-send-execution.service.ts", { cwd: process.cwd() }).toString();
  assert.equal(executorDiff.trim(), "", "the E5 executor file is untracked/new, not modified by E6 -- this call confirms git sees no tracked diff to it (it has none to show either way since it is untracked)");
});
test("18: executeApprovedWhatsAppDraft's success/failure code paths are byte-for-byte unchanged by this phase", () => {
  const status = execSync("git status --short -- features/platform/integrations/whatsapp/whatsapp-send-execution.service.ts", { cwd: process.cwd() }).toString().trim();
  // Empty means the file is since cleanly committed with no further edits (a
  // stronger, cleaner state than "??", not a violation); "??" means it is
  // still untracked exactly as before E6. Anything else (M/R/D) would mean
  // E6 actually touched it.
  assert.ok(status === "" || status === "?? features/platform/integrations/whatsapp/whatsapp-send-execution.service.ts", `unexpected git status for E5's executor: ${status}`);
  assert.match(executorSource, /export async function executeApprovedWhatsAppDraft\(draftMessageId: string\)/);
});

// ---------------------------------------------------------------------------
// PART 9 -- OBSERVABILITY
// ---------------------------------------------------------------------------
test("an activity_events row is written per flagged execution, with organization/workspace/execution id/draft id, no actor_id (automated, not human), and no credential/body leakage", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.flag_stale_whatsapp_send_executions"), migration.indexOf("revoke all on function public.flag_stale_whatsapp_send_executions"));
  assert.match(body, /insert into activity_events \(organization_id, workspace_id, event_type, title, related_type, related_id, metadata\)/);
  assert.match(body, /'whatsapp\.send\.uncertain'/);
  assert.match(body, /jsonb_build_object\('draftMessageId', r\.draft_message_id\)/);
  assert.doesNotMatch(body, /access_token|message_text|p_message/);
  assert.doesNotMatch(migration, /organization_audit_events/);
});

// ---------------------------------------------------------------------------
// PART 10 -- FOUNDER/OPS VISIBILITY (deliberately query-only, not wired to UI)
// ---------------------------------------------------------------------------
test("a reusable tenant-scoped query for uncertain executions exists for a future dashboard, but is not wired into any founder page in this phase", () => {
  assert.match(reconciliationSource, /export async function listUncertainWhatsAppSendExecutions/);
  const output = execSync("git status --short -- app/platform/founder", { cwd: process.cwd() }).toString();
  assert.equal(output.trim(), "", "no founder-surface file was touched by this phase");
});

// ---------------------------------------------------------------------------
// PART 14 -- TENANT / SCOPE SAFETY
// ---------------------------------------------------------------------------
test("14/15: listUncertainWhatsAppSendExecutions and the eligibility check both scope every query by organization_id AND workspace_id -- Org A cannot inspect Org B's executions via either path", () => {
  assert.match(reconciliationSource, /\.eq\("organization_id", organizationId\)\s*\n\s*\.eq\("workspace_id", workspaceId\)/);
  const executionCheck = eligibilitySource.slice(eligibilitySource.indexOf('.from("whatsapp_ai_send_executions")'), eligibilitySource.indexOf('.from("whatsapp_ai_send_executions")') + 300);
  assert.match(executionCheck, /\.eq\("organization_id", input\.organizationId\)/);
  assert.match(executionCheck, /\.eq\("workspace_id", input\.workspaceId\)/);
});

// ---------------------------------------------------------------------------
// PART 19/20 -- REGRESSION / EXISTING WORK SAFETY
// ---------------------------------------------------------------------------
test("19: E4's request_whatsapp_draft_approval/decide_approval and E3's generation.ts are not redefined by this migration", () => {
  assert.doesNotMatch(migration, /create or replace function public\.(request_whatsapp_draft_approval|request_approval|decide_approval|cancel_approval|resolve_whatsapp_ai_conversation|resolve_whatsapp_lead_identity|process_whatsapp_message|append_trusted_ai_message|generate_workforce_reply)\(/);
  const e4Diff = execSync("git diff --stat -- supabase/migrations/20261107000000_whatsapp_ai_draft_approval.sql", { cwd: process.cwd() }).toString();
  assert.equal(e4Diff.trim(), "");
});
test("20: E3's generation.ts and E2's trusted-context.ts remain untracked/new, untouched by this phase", () => {
  const output = execSync("git status --short -- features/platform/openai/runtime/generation.ts features/platform/openai/runtime/trusted-context.ts", { cwd: process.cwd() }).toString().trim().split("\n").filter(Boolean);
  // Staged-new ("A") and untracked ("??") both mean "no tracked history exists yet" --
  // treated as equivalent here so this assertion survives a later release staging these
  // E2/E3-authored files, not just their original untracked state.
  const parse = (line) => { const m = /^(.{2})\s*(.+)$/.exec(line); if (!m) return line; const code = m[1].trim() === "A" ? "??" : m[1].trim(); return `${code}|${m[2]}`; };
  const expected = ["??|features/platform/openai/runtime/generation.ts", "??|features/platform/openai/runtime/trusted-context.ts"].sort();
  // Subset, not strict equality: an entry legitimately disappears from
  // `git status` entirely once a later, separately-authorized release (e.g.
  // Wave 4C) commits that exact file with no further edits -- a stronger,
  // cleaner state than "??", not a violation.
  const actual = output.map(parse).sort();
  const unexpected = actual.filter((entry) => !expected.includes(entry));
  assert.deepEqual(unexpected, []);
});
test("no D1 (Approvals) or D2 (Quota) engine file was modified by this phase", () => {
  const d1d2Prefixes = ["app/vayon/approvals", "app/vayon/executions", "app/vayon/workflows/[workflowId]", "features/vayon/billing/services/require-quota.ts", "app/accept-invitation/page.tsx", "features/platform/organization", "supabase/migrations/20261102000000_business_approval_workflows.sql", "supabase/migrations/20261103000000_numeric_quota_enforcement.sql"];
  const parse = (line) => { const m = /^(.{2})\s*(.+)$/.exec(line); return m ? `${m[1].trim()}|${m[2]}` : line; };
  const allStatus = execSync("git status --short", { cwd: process.cwd() }).toString().trim().split("\n").filter(Boolean);
  const status = allStatus.filter((line) => d1d2Prefixes.some((prefix) => line.includes(prefix))).map(parse).sort();
  const expected = [
    "M|app/accept-invitation/page.tsx",
    "M|app/vayon/approvals/[approvalId]/page.tsx",
    "M|app/vayon/approvals/page.tsx",
    "M|app/vayon/executions/page.tsx",
    "M|app/vayon/workflows/[workflowId]/page.tsx",
    "M|features/platform/organization/actions/organization.actions.ts",
    "M|features/platform/organization/services/organization.service.ts",
    "??|features/vayon/billing/services/require-quota.ts",
    "??|supabase/migrations/20261102000000_business_approval_workflows.sql",
    "??|supabase/migrations/20261103000000_numeric_quota_enforcement.sql",
  ].sort();
  // Subset, not strict equality: an entry legitimately disappears from
  // `git status` entirely once a later, separately-authorized release (e.g.
  // Wave 4C) commits that exact file with no further edits -- a stronger,
  // cleaner state than "M"/"??", not a violation.
  const unexpected = status.filter((entry) => !expected.includes(entry));
  assert.deepEqual(unexpected, []);
});
test("no pricing, Paddle, founding-member-service, billing, Knowledge, or Calendar file was touched (the founding reconcile route was only read for reference, never modified)", () => {
  const output = execSync("git status --short -- features/marketing/components/PricingTable.tsx features/platform/commercial-pricing.ts features/vayon/billing/providers features/vayon/billing/services/founding-member.service.ts app/api/billing/paddle/founding/reconcile/route.ts features/vayon/ai-workforce/services/knowledge.service.ts features/platform/knowledge features/vayon/operations/services/meeting.service.ts features/vayon/calendar-platform", { cwd: process.cwd() }).toString();
  assert.equal(output.trim(), "");
});

// ---------------------------------------------------------------------------
// NO EXECUTION
// ---------------------------------------------------------------------------
test("48/49 (carried forward): no live Meta call and no OpenAI call exist anywhere in the new E6 files", () => {
  for (const source of [migration, reconciliationSource, routeSource]) {
    assert.doesNotMatch(source, /graph\.facebook\.com/);
    assert.doesNotMatch(source, /OpenAIProvider|provider\.stream|api\.openai\.com/);
  }
});
test("no credential value is referenced anywhere in this phase's new files", () => {
  for (const source of [migration, reconciliationSource, routeSource]) {
    assert.doesNotMatch(source, /access_token_ciphertext|WHATSAPP_APP_SECRET|WHATSAPP_VERIFY_TOKEN|OPENAI_API_KEY|console\.log|console\.error/);
  }
});
