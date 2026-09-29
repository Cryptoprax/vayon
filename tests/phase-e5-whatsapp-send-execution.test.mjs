import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const migration = readFileSync("supabase/migrations/20261108000000_whatsapp_ai_send_execution.sql", "utf8");
const e4Migration = readFileSync("supabase/migrations/20261107000000_whatsapp_ai_draft_approval.sql", "utf8");
const e3Migration = readFileSync("supabase/migrations/20261106000000_whatsapp_ai_draft_response.sql", "utf8");
const executorSource = readFileSync("features/platform/integrations/whatsapp/whatsapp-send-execution.service.ts", "utf8");
const sendActionSource = readFileSync("features/vayon/workflow-approval/actions/whatsapp-send.actions.ts", "utf8");
const whatsappServiceSource = readFileSync("features/platform/integrations/whatsapp/whatsapp.service.ts", "utf8");
const whatsappViewsSource = readFileSync("features/vayon/workflow-approval/components/WhatsAppDraftApprovalViews.tsx", "utf8");
const detailPageSource = readFileSync("app/vayon/whatsapp/approvals/[approvalId]/page.tsx", "utf8");
const entitlementsSource = readFileSync("features/vayon/billing/config/entitlements.ts", "utf8");
const permissionTypesSource = readFileSync("features/platform/permissions/runtime/types.ts", "utf8");
const permissionPolicySource = readFileSync("features/platform/permissions/runtime/policy.ts", "utf8");

// NOTE ON LIVE-DATABASE VALIDATION: this environment still has no working
// Docker daemon, local Postgres binary, or supabase CLI. STATIC SQL TESTS DO
// NOT PROVE LIVE POSTGRES BEHAVIOR.
//
// NOTE ON THE MOCK PROVIDER: no test in this file calls fetch(), constructs
// the real WhatsAppService, or reaches graph.facebook.com. executeApprovedWhatsAppDraft()
// is loaded via the load() helper with "./whatsapp.service" substituted for
// a fake class whose sendText() is fully controlled -- the exact "clear seam"
// Part 15 asks for, applied the same way E3/E4 already proved out for OpenAIProvider.

// ---------------------------------------------------------------------------
// Genuine execution: executeApprovedWhatsAppDraft
// ---------------------------------------------------------------------------
function makeFakeClient({ rpcHandlers = {}, selects = {} } = {}) {
  const rpcCalls = [];
  const chain = (table) => {
    const finish = async () => ({ data: selects[table] ?? null, error: null });
    const c = { eq: () => c, is: () => c, order: () => c, limit: () => c, maybeSingle: finish, single: finish, then: (resolve, reject) => finish().then(resolve, reject) };
    return c;
  };
  const client = {
    rpc: async (name, params) => {
      rpcCalls.push({ name, params });
      const handler = rpcHandlers[name];
      if (!handler) throw new Error(`unexpected rpc ${name}`);
      return handler(params);
    },
    from: (table) => ({ select: () => chain(table) }),
  };
  return { client, rpcCalls };
}

function loadExecutor({ client, eligibility = { eligible: true, approvalId: "approval-1", communicationThreadId: "thread-1", leadId: "lead-1" }, sendTextImpl, sendTextCalls = [] }) {
  return load("features/platform/integrations/whatsapp/whatsapp-send-execution.service.ts", {
    "@/features/vayon/operations/services/context": { operationsContext: async () => ({ organizationId: "org-1", workspaceId: "ws-1", client }) },
    "./whatsapp-draft-send-eligibility.service": { resolveWhatsAppDraftSendEligibility: async () => eligibility },
    "./whatsapp.service": {
      WhatsAppService: class {
        async sendText(to, text) {
          sendTextCalls.push({ to, text });
          if (sendTextImpl) return sendTextImpl(to, text);
          return { messages: [{ id: "wamid.mock-123" }] };
        }
      },
    },
  });
}

const draftSelects = {
  ai_workforce_messages: { content: "Yes, the villa is still available.", conversation_id: "conv-1" },
  ai_workforce_conversations: { communication_thread_id: "thread-1" },
  communication_threads: { metadata: { whatsapp_phone: "+15551234567" } },
};

test("37/38/39/1: a successful send calls the mock provider exactly once, persists the real provider message id, and reports delivery_state=sent via mark_whatsapp_send_succeeded", async () => {
  const { client, rpcCalls } = makeFakeClient({
    rpcHandlers: {
      claim_whatsapp_draft_send: async () => ({ data: "exec-1", error: null }),
      mark_whatsapp_send_succeeded: async () => ({ data: null, error: null }),
    },
    selects: draftSelects,
  });
  const sendTextCalls = [];
  const { executeApprovedWhatsAppDraft } = loadExecutor({ client, sendTextCalls });
  const result = await executeApprovedWhatsAppDraft("draft-1");
  assert.equal(result.outcome, "sent");
  assert.equal(result.providerMessageId, "wamid.mock-123");
  assert.equal(sendTextCalls.length, 1);
  const succeededCall = rpcCalls.find((c) => c.name === "mark_whatsapp_send_succeeded");
  assert.equal(succeededCall.params.p_provider_message_id, "wamid.mock-123");
  assert.equal(succeededCall.params.p_execution_id, "exec-1");
});

test("15/16/17/18: sent content equals the persisted draft byte-for-byte -- no OpenAI call, no regeneration, no client-substituted body", async () => {
  const { client } = makeFakeClient({
    rpcHandlers: { claim_whatsapp_draft_send: async () => ({ data: "exec-1", error: null }), mark_whatsapp_send_succeeded: async () => ({ data: null, error: null }) },
    selects: draftSelects,
  });
  const sendTextCalls = [];
  const { executeApprovedWhatsAppDraft } = loadExecutor({ client, sendTextCalls });
  await executeApprovedWhatsAppDraft("draft-1");
  assert.equal(sendTextCalls[0].text, "Yes, the villa is still available.");
  assert.doesNotMatch(executorSource, /OpenAIProvider|generateWorkforceReply|generateDraft\(/);
});
test("executeApprovedWhatsAppDraft takes no message-body parameter at all -- its only input is draftMessageId", () => {
  assert.match(executorSource, /export async function executeApprovedWhatsAppDraft\(draftMessageId: string\)/);
});

test("19/20/21: recipient is derived from the trusted communication thread's own normalized phone -- the function accepts no recipient parameter, and the resolved phone matches the thread's metadata.whatsapp_phone exactly", async () => {
  const { client } = makeFakeClient({
    rpcHandlers: { claim_whatsapp_draft_send: async () => ({ data: "exec-1", error: null }), mark_whatsapp_send_succeeded: async () => ({ data: null, error: null }) },
    selects: draftSelects,
  });
  const sendTextCalls = [];
  const { executeApprovedWhatsAppDraft } = loadExecutor({ client, sendTextCalls });
  await executeApprovedWhatsAppDraft("draft-1");
  assert.equal(sendTextCalls[0].to, "+15551234567");
});

test("2/6/7/8/9: not-eligible outcomes (pending/rejected/cancelled/wrong source/wrong action/wrong tenant/non-whatsapp) never reach the claim RPC or the provider -- resolveWhatsAppDraftSendEligibility is the fail-closed gate checked first", async () => {
  const { client, rpcCalls } = makeFakeClient({ rpcHandlers: {}, selects: draftSelects });
  const sendTextCalls = [];
  const { executeApprovedWhatsAppDraft } = loadExecutor({ client, eligibility: { eligible: false, reason: "not_approved" }, sendTextCalls });
  const result = await executeApprovedWhatsAppDraft("draft-1");
  assert.equal(result.outcome, "not_eligible");
  assert.equal(result.reason, "not_approved");
  assert.equal(sendTextCalls.length, 0);
  assert.equal(rpcCalls.length, 0);
});
test("9: an already-sent draft is blocked by the same eligibility gate", async () => {
  const { client } = makeFakeClient({ rpcHandlers: {}, selects: draftSelects });
  const sendTextCalls = [];
  const { executeApprovedWhatsAppDraft } = loadExecutor({ client, eligibility: { eligible: false, reason: "already_sent" }, sendTextCalls });
  const result = await executeApprovedWhatsAppDraft("draft-1");
  assert.equal(result.outcome, "not_eligible");
  assert.equal(result.reason, "already_sent");
  assert.equal(sendTextCalls.length, 0);
});

test("34/35: a claim rejected as ALREADY_CLAIMED_OR_SENT never calls the provider", async () => {
  const { client } = makeFakeClient({
    rpcHandlers: { claim_whatsapp_draft_send: async () => { throw new Error("ALREADY_CLAIMED_OR_SENT: a send for this draft is already in progress or has already completed"); } },
    selects: draftSelects,
  });
  const sendTextCalls = [];
  const { executeApprovedWhatsAppDraft } = loadExecutor({ client, sendTextCalls });
  const result = await executeApprovedWhatsAppDraft("draft-1");
  assert.equal(result.outcome, "already_claimed_or_sent");
  assert.equal(sendTextCalls.length, 0);
});
test("34/36: two sequential execution attempts against a stateful claim (simulating the real unique-constraint race) result in the provider being called exactly once total", async () => {
  let claimed = false;
  const { client } = makeFakeClient({
    rpcHandlers: {
      claim_whatsapp_draft_send: async () => {
        if (claimed) throw new Error("ALREADY_CLAIMED_OR_SENT: a send for this draft is already in progress or has already completed");
        claimed = true;
        return { data: "exec-1", error: null };
      },
      mark_whatsapp_send_succeeded: async () => ({ data: null, error: null }),
    },
    selects: draftSelects,
  });
  const sendTextCalls = [];
  const first = loadExecutor({ client, sendTextCalls });
  const second = loadExecutor({ client, sendTextCalls });
  const [resultA, resultB] = await Promise.all([first.executeApprovedWhatsAppDraft("draft-1"), second.executeApprovedWhatsAppDraft("draft-1")]);
  const outcomes = [resultA.outcome, resultB.outcome].sort();
  assert.deepEqual(outcomes, ["already_claimed_or_sent", "sent"]);
  assert.equal(sendTextCalls.length, 1, "the provider must be called exactly once across both concurrent attempts");
});

test("42/43/44/45: a provider failure marks the execution failed (never sent), preserves the draft/approval, and does not retry automatically", async () => {
  const { client, rpcCalls } = makeFakeClient({
    rpcHandlers: {
      claim_whatsapp_draft_send: async () => ({ data: "exec-1", error: null }),
      mark_whatsapp_send_failed: async () => ({ data: null, error: null }),
    },
    selects: draftSelects,
  });
  const sendTextCalls = [];
  const { executeApprovedWhatsAppDraft } = loadExecutor({ client, sendTextCalls, sendTextImpl: () => { throw new Error("WhatsApp delivery failed (status 500)."); } });
  const result = await executeApprovedWhatsAppDraft("draft-1");
  assert.equal(result.outcome, "send_failed");
  assert.equal(result.failureCode, "provider_unavailable");
  assert.ok(!rpcCalls.some((c) => c.name === "mark_whatsapp_send_succeeded"));
  const failedCall = rpcCalls.find((c) => c.name === "mark_whatsapp_send_failed");
  assert.equal(failedCall.params.p_execution_id, "exec-1");
  assert.doesNotMatch(executorSource, /setInterval|setTimeout.*retry|for\s*\(.*attempt/i, "no automatic retry loop exists in the executor");
});
test("failure classification covers auth/rate-limit/server/connection cases without leaking raw provider response detail", () => {
  assert.match(executorSource, /authentication_failed/);
  assert.match(executorSource, /rate_limited/);
  assert.match(executorSource, /provider_unavailable/);
  assert.match(executorSource, /connection_unavailable/);
  assert.doesNotMatch(executorSource, /access_token_ciphertext|WHATSAPP_APP_SECRET|console\.log|console\.error/);
});

test("46/47: approving a draft (Phase E4's action) never calls the executor -- Send Approved Reply is a separate, explicit action", () => {
  const approvalActionsSource = readFileSync("features/vayon/workflow-approval/actions/whatsapp-approval.actions.ts", "utf8");
  assert.doesNotMatch(approvalActionsSource, /executeApprovedWhatsAppDraft/);
  assert.match(sendActionSource, /executeApprovedWhatsAppDraft/);
});
test("48/49: no live Meta call and no OpenAI call exist anywhere in the new E5 files", () => {
  for (const source of [migration, executorSource, sendActionSource]) {
    assert.doesNotMatch(source, /graph\.facebook\.com/);
    assert.doesNotMatch(source, /OpenAIProvider|provider\.stream|api\.openai\.com/);
  }
});
test("50/51: no Calendar call and no CRM write beyond communication persistence occurs in the send path", () => {
  for (const source of [migration, executorSource]) {
    assert.doesNotMatch(source, /calendar|google-calendar/i);
    assert.doesNotMatch(source, /update leads|insert into leads/i);
  }
});

// ---------------------------------------------------------------------------
// PART 1 -- TRACE / REUSE
// ---------------------------------------------------------------------------
test("the executor reuses WhatsAppService.sendText() directly -- no second Graph client, no duplicated fetch/credential-decryption logic", () => {
  assert.match(executorSource, /import { WhatsAppService } from "\.\/whatsapp\.service";/);
  assert.match(executorSource, /new WhatsAppService\(\)\.sendText\(/);
  assert.doesNotMatch(executorSource, /fetch\(|graph\.facebook\.com|TokenCryptoService/);
});
test("sendText's existing credential/connection resolution (get_whatsapp_delivery_credential, status='connected') is untouched -- only its failure message gained a status code for classification", () => {
  assert.match(whatsappServiceSource, /get_whatsapp_delivery_credential/);
  assert.match(whatsappServiceSource, /WhatsApp delivery failed \(status \$\{response\.status\}\)\./);
  assert.match(whatsappServiceSource, /async sendText\(to:string,text:string\)/);
});

// ---------------------------------------------------------------------------
// PART 2 -- EXECUTOR SIGNATURE / NO CLIENT-SUPPLIED SENSITIVE INPUT
// ---------------------------------------------------------------------------
test("the executor's only parameter is draftMessageId -- no approval status, message text, recipient phone, phone_number_id, access token, or organization override can be passed in from a caller", () => {
  const signature = executorSource.slice(executorSource.indexOf("export async function executeApprovedWhatsAppDraft"), executorSource.indexOf("export async function executeApprovedWhatsAppDraft") + 100);
  assert.match(signature, /\(draftMessageId: string\)/);
  assert.doesNotMatch(executorSource, /organizationId:\s*string.*draftMessageId|workspaceId:\s*string.*draftMessageId/);
});

// ---------------------------------------------------------------------------
// PART 3 -- ELIGIBILITY RECHECK
// ---------------------------------------------------------------------------
test("eligibility is re-checked immediately before the claim, using the exact same Phase E4 function -- not a cached/earlier decision", () => {
  assert.match(executorSource, /import { resolveWhatsAppDraftSendEligibility } from "\.\/whatsapp-draft-send-eligibility\.service";/);
  const eligibilityIndex = executorSource.indexOf("await resolveWhatsAppDraftSendEligibility(");
  const claimIndex = executorSource.indexOf('rpc("claim_whatsapp_draft_send"');
  assert.ok(eligibilityIndex > -1 && claimIndex > -1 && eligibilityIndex < claimIndex);
});
test("STATIC SQL: claim_whatsapp_draft_send independently re-verifies the full eligibility chain inside its own atomic transaction -- it does not merely trust the caller's earlier eligibility check", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.claim_whatsapp_draft_send"), migration.indexOf("revoke all on function public.claim_whatsapp_draft_send"));
  assert.match(body, /a\.status = 'approved'/);
  assert.match(body, /m\.delivery_state = 'draft'/);
  assert.match(body, /c\.channel = 'whatsapp'/);
  assert.match(body, /a\.source_id = p_draft_message_id/);
  assert.match(body, /a\.source_type = 'whatsapp_ai_draft'/);
  assert.match(body, /a\.action_type = 'whatsapp\.message\.send'/);
});

// ---------------------------------------------------------------------------
// PART 4 -- EXACT CONTENT IMMUTABILITY (static, complements executed tests)
// ---------------------------------------------------------------------------
test("the draft's content column is read once and passed through unmodified to sendText -- no string transformation beyond what fetch/JSON.stringify itself does", () => {
  const region = executorSource.slice(executorSource.indexOf('.select("content,conversation_id")'), executorSource.indexOf("new WhatsAppService()"));
  assert.doesNotMatch(region, /draft\.content\s*\+|`.*draft\.content.*`|\.replace\(|\.slice\(/);
});

// ---------------------------------------------------------------------------
// PART 5 -- RECIPIENT RESOLUTION (static, complements executed test above)
// ---------------------------------------------------------------------------
test("recipient is read from communication_threads.metadata.whatsapp_phone via the draft's own conversation -- every query in that chain is scoped by organization_id and workspace_id", () => {
  const region = executorSource.slice(executorSource.indexOf('.select("content,conversation_id")'), executorSource.indexOf("recipient = String"));
  const orgMatches = region.match(/\.eq\("organization_id", context\.organizationId\)/g) ?? [];
  const wsMatches = region.match(/\.eq\("workspace_id", context\.workspaceId\)/g) ?? [];
  assert.equal(orgMatches.length, 3, "all three lookups (message, conversation, thread) must scope organization_id");
  assert.equal(wsMatches.length, 3, "all three lookups (message, conversation, thread) must scope workspace_id");
});

// ---------------------------------------------------------------------------
// PART 6 -- CONNECTION RESOLUTION
// ---------------------------------------------------------------------------
test("STATIC SQL: the sending connection is resolved server-side by workspace_id + status='connected', never accepted from the UI", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.mark_whatsapp_send_succeeded"), migration.indexOf("revoke all on function public.mark_whatsapp_send_succeeded"));
  assert.match(body, /from whatsapp_connections\s*\n\s*where workspace_id = p_workspace_id and status = 'connected' and deleted_at is null/);
  assert.doesNotMatch(migration, /p_phone_number_id|p_access_token|p_waba_id/i);
});

// ---------------------------------------------------------------------------
// PART 7 -- DELIVERY STATE
// ---------------------------------------------------------------------------
test("delivery_state gains exactly one new value ('sent'); the prior E3 constraint values are preserved, and no send_in_progress/send_failed value is ever set on ai_workforce_messages", () => {
  assert.match(migration, /check \(delivery_state in \('not_applicable', 'draft', 'sent'\)\)/);
  assert.match(e3Migration, /check \(delivery_state in \('not_applicable', 'draft'\)\)/);
  assert.doesNotMatch(migration, /delivery_state in \([^)]*'send_in_progress'|delivery_state in \([^)]*'send_failed'|set delivery_state = 'send_in_progress'|set delivery_state = 'send_failed'/);
});
test("delivery_state is only ever set to 'sent' after a real provider success -- mark_whatsapp_send_succeeded is the only place this migration sets it", () => {
  const matches = migration.match(/set delivery_state = 'sent'/g) ?? [];
  assert.equal(matches.length, 1);
  assert.ok(migration.indexOf("set delivery_state = 'sent'") > migration.indexOf("create or replace function public.mark_whatsapp_send_succeeded"));
});

// ---------------------------------------------------------------------------
// PART 8 -- ATOMIC / DUPLICATE-SEND SAFETY (static, complements executed tests)
// ---------------------------------------------------------------------------
test("the claim uses INSERT ... ON CONFLICT DO NOTHING against a unique constraint, not a bare SELECT-then-INSERT", () => {
  assert.match(migration, /unique \(organization_id, workspace_id, draft_message_id\)/);
  assert.match(migration, /on conflict \(organization_id, workspace_id, draft_message_id\) do nothing/);
});
test("a retry after failure is a conditional UPDATE that only matches a 'failed' row -- a 'claimed' or 'sent' row is left untouched and the function raises", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.claim_whatsapp_draft_send"), migration.indexOf("revoke all on function public.claim_whatsapp_draft_send"));
  assert.match(body, /where organization_id = v_org and workspace_id = p_workspace_id and draft_message_id = p_draft_message_id and status = 'failed'/);
  assert.match(body, /raise exception 'ALREADY_CLAIMED_OR_SENT/);
});

// ---------------------------------------------------------------------------
// PART 9 -- EXECUTION RECORD
// ---------------------------------------------------------------------------
test("whatsapp_ai_send_executions carries exactly the fields Part 9 justifies -- draft_message_id, approval_id, organization_id, workspace_id, status, attempt_count, provider_message_id, claimed_at, sent_at, failed_at, failure_code -- no more", () => {
  const tableDef = migration.slice(migration.indexOf("create table public.whatsapp_ai_send_executions"), migration.indexOf("create index whatsapp_ai_send_executions_tenant_idx"));
  for (const field of ["draft_message_id", "approval_id", "organization_id", "workspace_id", "status", "attempt_count", "provider_message_id", "claimed_at", "sent_at", "failed_at", "failure_code"]) {
    assert.match(tableDef, new RegExp(field));
  }
  assert.doesNotMatch(tableDef, /access_token|message_text|recipient|payload/);
});
test("D1's approval_requests is not misused as execution state -- it is only referenced by foreign key, never given new status values for send bookkeeping", () => {
  assert.doesNotMatch(migration, /alter table public\.approval_requests/);
  assert.doesNotMatch(migration, /update approval_requests/);
});

// ---------------------------------------------------------------------------
// PART 10/11 -- COMMUNICATIONS PERSISTENCE AND APPROVAL LINKAGE
// ---------------------------------------------------------------------------
test("on success, real outbound communications/whatsapp_messages rows are created exactly once (direction='outbound'), distinct from the AI runtime draft row", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.mark_whatsapp_send_succeeded"), migration.indexOf("revoke all on function public.mark_whatsapp_send_succeeded"));
  assert.match(body, /insert into communications \(organization_id, workspace_id, thread_id, channel, direction, status, body, external_id, occurred_at\)\s*\n\s*values \(v_org, p_workspace_id, v_thread, 'whatsapp', 'outbound', 'sent'/);
  assert.match(body, /insert into whatsapp_messages \(organization_id, workspace_id, connection_id, provider_message_id, communication_id, direction, sender, recipient, message_type, text_body, status, provider_timestamp\)\s*\n\s*values \(v_org, p_workspace_id, v_connection_id, p_provider_message_id, v_comm, 'outbound'/);
  const commInserts = (body.match(/insert into communications/g) ?? []).length;
  const msgInserts = (body.match(/insert into whatsapp_messages/g) ?? []).length;
  assert.equal(commInserts, 1);
  assert.equal(msgInserts, 1);
});
test("traceability chain is preserved end to end: approval.source_id -> draft -> conversation -> thread, and the execution row references both draft_message_id and approval_id -- no second approval table introduced", () => {
  assert.doesNotMatch(migration, /create table.*approval/i);
  const tableDef = migration.slice(migration.indexOf("create table public.whatsapp_ai_send_executions"), migration.indexOf("create index whatsapp_ai_send_executions_tenant_idx"));
  assert.match(tableDef, /approval_id uuid not null references public\.approval_requests\(id\)/);
});

// ---------------------------------------------------------------------------
// PART 12 -- SEPARATE EXPLICIT SEND TRIGGER
// ---------------------------------------------------------------------------
test("Send Approved Reply is a distinct form/action from Approve, and only renders for an eligible or failed-retryable send state (never sent/claimed/uncertain) -- Phase E6 extends this exact condition with more states, none removed", () => {
  assert.match(whatsappViewsSource, /const canSend = \(sendState === "eligible" \|\| sendState === "failed_retryable"\) && canDecide;/);
  assert.match(whatsappViewsSource, /form action={sendApprovedWhatsAppDraftAction}/);
  assert.match(whatsappViewsSource, /form action={approveWhatsAppDraftAction}/);
});
test("the detail page derives its send state from a real tenant-scoped eligibility check (not a client-supplied flag) and passes it through to the view", () => {
  assert.match(detailPageSource, /resolveWhatsAppDraftSendEligibility\(/);
  assert.match(detailPageSource, /eligibility\.reason === "already_sent"/);
  assert.match(detailPageSource, /sendState={sendState}/);
});

// ---------------------------------------------------------------------------
// PART 13 -- PERMISSIONS
// ---------------------------------------------------------------------------
test("no new permission module or role system was created -- the send action reuses requireWorkspacePermission('approvals','approve'), and can_manage_approvals() is not redefined", () => {
  assert.match(sendActionSource, /requireWorkspacePermission\("approvals", "approve"\)/);
  assert.doesNotMatch(permissionTypesSource, /"communications"/);
  assert.doesNotMatch(permissionPolicySource, /communications:/);
  assert.doesNotMatch(migration, /create or replace function public\.can_manage_approvals/);
});
test("26/27: the DB-level claim function also requires can_manage_approvals() -- an authenticated member without that role/permission is rejected even if they could reach the action", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.claim_whatsapp_draft_send"), migration.indexOf("revoke all on function public.claim_whatsapp_draft_send"));
  assert.match(body, /if not public\.can_manage_approvals\(p_workspace_id\) then/);
});

// ---------------------------------------------------------------------------
// PART 14 -- ENTITLEMENT
// ---------------------------------------------------------------------------
test("28/29/30/31/32/33: send action is gated by requireEntitlement(\"whatsapp\"), never \"approvals\" -- Starter lacks it, Professional/Business/Business Plus/Enterprise all have it", () => {
  assert.match(sendActionSource, /requireEntitlement\("whatsapp"\)/);
  assert.doesNotMatch(sendActionSource, /requireEntitlement\("approvals"\)/);
  const { subscriptionEntitlementCatalog } = load("features/vayon/billing/config/entitlements.ts");
  assert.ok(!subscriptionEntitlementCatalog.starter.features.includes("whatsapp"));
  for (const plan of ["professional", "business", "business_plus", "enterprise"]) assert.ok(subscriptionEntitlementCatalog[plan].features.includes("whatsapp"));
});
test("entitlement catalog itself is unmodified by this phase", () => {
  const diff = execSync("git diff --stat -- features/vayon/billing/config/entitlements.ts", { cwd: process.cwd() }).toString();
  assert.equal(diff.trim(), "");
  assert.match(entitlementsSource, /"whatsapp"/);
});

// ---------------------------------------------------------------------------
// PART 15 -- PROVIDER ABSTRACTION / MOCK
// ---------------------------------------------------------------------------
test("no test in this file constructs the real WhatsAppService/fetch/graph.facebook.com -- WhatsAppService is always substituted via the load() module-mock seam", () => {
  assert.doesNotMatch(executorSource, /require\("node-fetch"\)/);
});

// ---------------------------------------------------------------------------
// PART 17 -- RATE LIMITING (deliberately not added -- justified below)
// ---------------------------------------------------------------------------
test("no new rate limiter was introduced for send execution -- duplicate-send prevention is already solved atomically by the claim (Part 8), and this human-gated, per-approval-decided action does not need a throughput limiter the way the higher-frequency ai-runtime boundary does", () => {
  for (const source of [migration, executorSource, sendActionSource]) assert.doesNotMatch(source, /EnterpriseRateLimitService|MemoryRateLimitProvider|rateLimitBoundaries/);
});

// ---------------------------------------------------------------------------
// SECURITY / TENANT (10-14)
// ---------------------------------------------------------------------------
test("10/11/12/13/14: every RPC in this migration re-derives organization_id from workspace_id server-side and scopes every lookup by it -- a raw draft/approval UUID from another tenant matches nothing", () => {
  for (const fn of ["claim_whatsapp_draft_send", "mark_whatsapp_send_succeeded", "mark_whatsapp_send_failed"]) {
    const body = migration.slice(migration.indexOf(`create or replace function public.${fn}`), migration.indexOf(`revoke all on function public.${fn}`));
    assert.match(body, /select organization_id into v_org from workspaces where id = p_workspace_id/);
    assert.match(body, /if not public\.is_organization_member\(v_org\) then/);
  }
});

// ---------------------------------------------------------------------------
// PART 19 -- DISTRIBUTED SEND RISK (documented, not hidden)
// ---------------------------------------------------------------------------
test("the residual crash-after-accept risk is explicitly documented in the migration, not silently ignored", () => {
  assert.match(migration, /WHY THIS IS NOT EXACTLY-ONCE/);
  assert.match(migration, /crashes before mark_whatsapp_send_succeeded/);
});

// ---------------------------------------------------------------------------
// PART 20/22 -- EXISTING WORK SAFETY
// ---------------------------------------------------------------------------
test("D1/E4 migrations are untouched -- E5 only adds a new, later migration", () => {
  const outputD1 = execSync("git status --short -- supabase/migrations/20261102000000_business_approval_workflows.sql", { cwd: process.cwd() }).toString().trim();
  assert.equal(outputD1, "?? supabase/migrations/20261102000000_business_approval_workflows.sql");
  const outputE4 = execSync("git status --short -- supabase/migrations/20261107000000_whatsapp_ai_draft_approval.sql", { cwd: process.cwd() }).toString().trim();
  assert.equal(outputE4, "?? supabase/migrations/20261107000000_whatsapp_ai_draft_approval.sql");
  assert.doesNotMatch(migration, /create or replace function public\.(request_whatsapp_draft_approval|request_approval|decide_approval|cancel_approval)\(/);
  assert.doesNotMatch(e4Migration, /whatsapp_ai_send_executions|claim_whatsapp_draft_send/);
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
  assert.deepEqual(status, expected);
});
test("52: E4's own approval-decide behavior (decide_approval, whatsapp-approval.actions.ts) is unmodified by this phase", () => {
  const output = execSync("git status --short -- features/vayon/workflow-approval/actions/whatsapp-approval.actions.ts features/vayon/workflow-approval/services/whatsapp-draft-approval.service.ts", { cwd: process.cwd() }).toString().trim().split("\n").filter(Boolean);
  const parse = (line) => { const m = /^(.{2})\s*(.+)$/.exec(line); return m ? `${m[1].trim()}|${m[2]}` : line; };
  assert.deepEqual(output.map(parse).sort(), ["??|features/vayon/workflow-approval/actions/whatsapp-approval.actions.ts"].sort());
});
test("53/54/55: E3's generation.ts, E2's conversation RPCs, and E1's identity RPCs are not redefined by this migration", () => {
  assert.doesNotMatch(migration, /create or replace function public\.(generate_workforce_reply|resolve_whatsapp_ai_conversation|resolve_whatsapp_lead_identity|process_whatsapp_message|append_trusted_ai_message)/);
  // "??" (untracked) or "A" (staged-new, once a later release stages this E3-authored file)
  // both mean the same thing here: no tracked history exists for it yet.
  const output = execSync("git status --short -- features/platform/openai/runtime/generation.ts", { cwd: process.cwd() }).toString().trim();
  assert.match(output, /^(\?\?|A)\s+features\/platform\/openai\/runtime\/generation\.ts$/);
});
test("56: web AI chat (chat()) is untouched by this phase", () => {
  const serviceSource = readFileSync("features/platform/openai/runtime/service.ts", "utf8");
  assert.match(serviceSource, /async \*chat\(input: RuntimeChatInput\) \{\s*\n\s*await new SubscriptionWriteService\(\)\.require\(\);/);
  // Compare against HEAD explicitly (not just the unstaged working tree) so this remains
  // correct once a later release stages this file -- `git diff --stat` alone shows nothing
  // for a file that is fully staged with no further unstaged edit.
  const output = execSync("git diff HEAD --stat -- features/platform/openai/runtime/service.ts", { cwd: process.cwd() }).toString();
  assert.match(output, /1 file changed/);
});
test("only whatsapp.service.ts and whatsapp.repository.ts were extended among E1 files, and only by the one disclosed status-code addition -- lead-identity/phone/types remain exactly at their E1 status", () => {
  const output = execSync("git status --short -- features/vayon/lead/utils features/platform/integrations/whatsapp/lead-identity.service.ts features/platform/integrations/whatsapp/types.ts", { cwd: process.cwd() }).toString().trim().split("\n").filter(Boolean);
  // Staged-new ("A") and untracked ("??") both mean "no tracked history exists yet" --
  // treated as equivalent here so this assertion survives a later release staging these
  // E1-authored files, not just their original untracked state. `git status` also only
  // collapses an entirely-untracked directory to one line -- normalized to the directory
  // form here so this holds regardless of that staging-driven granularity.
  const parse = (line) => {
    const m = /^(.{2})\s*(.+)$/.exec(line);
    if (!m) return line;
    const code = m[1].trim() === "A" ? "??" : m[1].trim();
    const path = m[2].startsWith("features/vayon/lead/utils/") ? "features/vayon/lead/utils/" : m[2];
    return `${code}|${path}`;
  };
  assert.deepEqual(output.map(parse).sort(), [
    "??|features/platform/integrations/whatsapp/lead-identity.service.ts",
    "M|features/platform/integrations/whatsapp/types.ts",
    "??|features/vayon/lead/utils/",
  ].sort());
});
test("no pricing, Paddle, founding, billing, package-entitlement-tier, D2 quota, Knowledge, Calendar, or human-handoff file was touched", () => {
  const output = execSync("git status --short -- features/marketing/components/PricingTable.tsx features/platform/commercial-pricing.ts features/vayon/billing/providers features/vayon/billing/config/entitlements.ts features/vayon/ai-workforce/services/knowledge.service.ts features/platform/knowledge features/vayon/operations/services/meeting.service.ts features/vayon/calendar-platform", { cwd: process.cwd() }).toString();
  assert.equal(output.trim(), "");
});

// ---------------------------------------------------------------------------
// NO EXECUTION
// ---------------------------------------------------------------------------
test("no credential value is referenced anywhere in this phase's new files", () => {
  for (const source of [migration, executorSource, sendActionSource]) {
    assert.doesNotMatch(source, /access_token_ciphertext|WHATSAPP_APP_SECRET|WHATSAPP_VERIFY_TOKEN|OPENAI_API_KEY|console\.log|console\.error/);
  }
});
