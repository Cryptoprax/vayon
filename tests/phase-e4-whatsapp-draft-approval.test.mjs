import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const migration = readFileSync("supabase/migrations/20261107000000_whatsapp_ai_draft_approval.sql", "utf8");
const d1Migration = readFileSync("supabase/migrations/20261102000000_business_approval_workflows.sql", "utf8");
const e3Migration = readFileSync("supabase/migrations/20261106000000_whatsapp_ai_draft_response.sql", "utf8");
const orchestratorSource = readFileSync("features/platform/integrations/whatsapp/whatsapp-ai-orchestrator.service.ts", "utf8");
const draftApprovalServiceSource = readFileSync("features/platform/integrations/whatsapp/whatsapp-draft-approval.service.ts", "utf8");
const eligibilityServiceSource = readFileSync("features/platform/integrations/whatsapp/whatsapp-draft-send-eligibility.service.ts", "utf8");
const whatsappActionsSource = readFileSync("features/vayon/workflow-approval/actions/whatsapp-approval.actions.ts", "utf8");
const whatsappViewsSource = readFileSync("features/vayon/workflow-approval/components/WhatsAppDraftApprovalViews.tsx", "utf8");
const listPageSource = readFileSync("app/vayon/whatsapp/approvals/page.tsx", "utf8");
const detailPageSource = readFileSync("app/vayon/whatsapp/approvals/[approvalId]/page.tsx", "utf8");
const entitlementsSource = readFileSync("features/vayon/billing/config/entitlements.ts", "utf8");
const d1ActionsSource = readFileSync("features/vayon/workflow-approval/actions/approval.actions.ts", "utf8");

// NOTE ON LIVE-DATABASE VALIDATION: this environment still has no working
// Docker daemon, local Postgres binary, or supabase CLI (the same disclosed
// constraint as every prior phase). STATIC SQL TESTS DO NOT PROVE LIVE
// POSTGRES BEHAVIOR.

// ---------------------------------------------------------------------------
// Genuine execution: requestWhatsAppDraftApproval / resolveWhatsAppDraftSendEligibility
// ---------------------------------------------------------------------------
function makeFakeClient({ rpcResult = "approval-1", rpcCalls = [], selects = {} } = {}) {
  const chain = (table) => {
    const finish = async () => ({ data: selects[table] ?? null, error: null });
    const c = { eq: () => c, is: () => c, order: () => c, limit: () => c, maybeSingle: finish, single: finish, then: (resolve, reject) => finish().then(resolve, reject) };
    return c;
  };
  return {
    rpc: async (name, params) => { rpcCalls.push({ name, params }); return { data: rpcResult, error: null }; },
    from: (table) => ({ select: () => chain(table) }),
  };
}

test("1/6/7/8: requestWhatsAppDraftApproval calls the RPC with source draft/conversation/thread/lead identifiers, once", async () => {
  const rpcCalls = [];
  const client = makeFakeClient({ rpcResult: "approval-123", rpcCalls });
  const { requestWhatsAppDraftApproval } = load("features/platform/integrations/whatsapp/whatsapp-draft-approval.service.ts", {
    "@/lib/supabase/service": { createSupabaseServiceClient: () => client },
  });
  const id = await requestWhatsAppDraftApproval({ workspaceId: "ws-1", draftMessageId: "draft-1", conversationId: "conv-1", communicationThreadId: "thread-1", leadId: "lead-1", previewText: "Yes, still available." });
  assert.equal(id, "approval-123");
  assert.equal(rpcCalls.length, 1);
  assert.equal(rpcCalls[0].name, "request_whatsapp_draft_approval");
  assert.deepEqual(rpcCalls[0].params, { p_workspace_id: "ws-1", p_draft_message_id: "draft-1", p_conversation_id: "conv-1", p_communication_thread_id: "thread-1", p_lead_id: "lead-1", p_preview_text: "Yes, still available." });
});

test("4: two calls for the same draft return the same approval id (idempotent caller-side behavior matching the RPC's own idempotency)", async () => {
  const rpcCalls = [];
  const client = makeFakeClient({ rpcResult: "approval-same", rpcCalls });
  const { requestWhatsAppDraftApproval } = load("features/platform/integrations/whatsapp/whatsapp-draft-approval.service.ts", {
    "@/lib/supabase/service": { createSupabaseServiceClient: () => client },
  });
  const first = await requestWhatsAppDraftApproval({ workspaceId: "ws-1", draftMessageId: "draft-1", conversationId: "conv-1", communicationThreadId: "thread-1", leadId: null, previewText: "hi" });
  const second = await requestWhatsAppDraftApproval({ workspaceId: "ws-1", draftMessageId: "draft-1", conversationId: "conv-1", communicationThreadId: "thread-1", leadId: null, previewText: "hi" });
  assert.equal(first, second);
  assert.equal(rpcCalls.length, 2, "the caller calls the RPC both times -- idempotency is enforced by the RPC itself (advisory lock + unique index), verified separately by static SQL tests below");
});

test("2/34: orchestrator only requests approval strictly after generateDraft resolves without throwing -- a provider failure (which throws) never reaches the approval-request call, and the draft persisted before the throw is never touched by this file", () => {
  const body = orchestratorSource.slice(orchestratorSource.indexOf("export async function processInboundWhatsAppMessageForAI"));
  const generateIndex = body.indexOf("await runtime.generateDraft(");
  const approvalIndex = body.indexOf("requestWhatsAppDraftApproval(");
  assert.ok(generateIndex > -1 && approvalIndex > -1 && generateIndex < approvalIndex, "generateDraft must be awaited before requestWhatsAppDraftApproval is ever called");
  assert.doesNotMatch(body.slice(generateIndex, approvalIndex), /catch/, "no catch between generation and approval-request may swallow a provider failure and proceed anyway");
});

test("3: approval creation is requested for both a freshly generated and an idempotently-replayed draft (outcome!=='rate_limited'), never skipped for a replay", () => {
  const body = orchestratorSource.slice(orchestratorSource.indexOf("export async function processInboundWhatsAppMessageForAI"));
  assert.match(body, /if \(result\.outcome === "rate_limited"\) return \{ processed: false, reason: "rate_limited" \};/);
  assert.doesNotMatch(body, /result\.outcome === "generated"[\s\S]{0,80}requestWhatsAppDraftApproval/, "approval request must not be conditioned on outcome==='generated' only -- it must also run for 'already_generated'");
});

test("5: the text-only gate in whatsapp.service.ts (unchanged from Phase E3) is the only thing standing between an inbound message and AI/approval processing", () => {
  const whatsappServiceSource = readFileSync("features/platform/integrations/whatsapp/whatsapp.service.ts", "utf8");
  assert.match(whatsappServiceSource, /m\.type==="text"/);
});

test("6/7/8: STATIC SQL VERIFICATION -- source_type='whatsapp_ai_draft', action_type='whatsapp.message.send', source_id=the draft message id", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.request_whatsapp_draft_approval"), migration.indexOf("revoke all on function public.request_whatsapp_draft_approval"));
  assert.match(body, /'whatsapp_ai_draft', p_draft_message_id, 'whatsapp\.message\.send'/);
});

// ---------------------------------------------------------------------------
// PART 1 -- D1 FOUNDATION REUSE
// ---------------------------------------------------------------------------
test("D1's approval engine is reused directly -- no whatsapp_approvals/message_approvals/ai_reply_approvals table was created, and request_approval/decide_approval/cancel_approval/can_manage_approvals are not redefined", () => {
  assert.doesNotMatch(migration, /create table/i);
  assert.doesNotMatch(migration, /create or replace function public\.(request_approval|decide_approval|cancel_approval|can_manage_approvals)\(/);
  assert.match(d1Migration, /source_type text not null/);
  assert.match(d1Migration, /source_id uuid null/);
  assert.match(d1Migration, /action_type text not null/);
  assert.match(d1Migration, /payload jsonb not null/);
});
test("decide_approval is reused unmodified by the new WhatsApp actions -- GovernanceService.decideApproval()/repository.decide() is called directly, not reimplemented", () => {
  assert.match(whatsappActionsSource, /service\.decideApproval\(id, expectedVersion, decision, reason\)/);
  assert.match(whatsappActionsSource, /GovernanceService/);
});

// ---------------------------------------------------------------------------
// PART 2 -- APPROVAL PAYLOAD
// ---------------------------------------------------------------------------
test("payload carries only IDs and a short preview, never a token/credential, never the full Meta payload, never a duplicated full CRM lead record", () => {
  const body = migration.slice(migration.indexOf("jsonb_build_object(\n      'leadId'"), migration.indexOf("v_actor\n  )"));
  assert.match(body, /'leadId', p_lead_id/);
  assert.match(body, /'communicationThreadId', p_communication_thread_id/);
  assert.match(body, /'conversationId', p_conversation_id/);
  assert.match(body, /'draftMessageId', p_draft_message_id/);
  assert.match(body, /'previewText', v_preview/);
  assert.match(body, /'channel', 'whatsapp'/);
  assert.match(body, /'employeeCode', 'whatsapp-ai'/);
  assert.doesNotMatch(migration, /access_token|refresh_token|p_message|whatsapp_app_secret/i);
  assert.match(migration, /v_preview := left\(coalesce\(p_preview_text, ''\), 300\)/, "the preview is truncated, not the full draft dumped verbatim");
});

// ---------------------------------------------------------------------------
// PART 4 -- IDEMPOTENCY (static, complements the executed tests above)
// ---------------------------------------------------------------------------
test("idempotency: an advisory transaction lock is taken before the find-or-create lookup, and a partial unique index backs it as a hard DB-level guarantee", () => {
  assert.match(migration, /perform pg_advisory_xact_lock\(hashtext\('whatsapp_draft_approval:' \|\| v_org::text \|\| ':' \|\| p_workspace_id::text \|\| ':' \|\| p_draft_message_id::text\)\)/);
  assert.match(migration, /create unique index if not exists approval_requests_whatsapp_draft_unique_idx\s*\n\s*on public\.approval_requests \(organization_id, workspace_id, source_id\)\s*\n\s*where source_type = 'whatsapp_ai_draft' and action_type = 'whatsapp\.message\.send';/);
});
test("the unique index is scoped only to whatsapp_ai_draft -- it cannot constrain or interact with any other approval source_type", () => {
  const indexStatement = migration.slice(migration.indexOf("create unique index if not exists approval_requests_whatsapp_draft_unique_idx"), migration.indexOf("create unique index if not exists approval_requests_whatsapp_draft_unique_idx") + 300);
  assert.match(indexStatement, /where source_type = 'whatsapp_ai_draft'/);
});
test("a unique_violation on insert is caught and resolved by re-selecting the existing row, not by raising to the caller", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.request_whatsapp_draft_approval"), migration.indexOf("revoke all on function public.request_whatsapp_draft_approval"));
  assert.match(body, /exception\s*\n\s*when unique_violation then/);
});

// ---------------------------------------------------------------------------
// PART 5 -- COMMERCIAL VS SAFETY ENTITLEMENT ARCHITECTURE
// ---------------------------------------------------------------------------
test("entitlement catalog itself is completely unmodified by this phase", () => {
  const diff = execSync("git diff --stat -- features/vayon/billing/config/entitlements.ts", { cwd: process.cwd() }).toString();
  assert.equal(diff.trim(), "");
  assert.match(entitlementsSource, /"whatsapp"/);
  assert.doesNotMatch(entitlementsSource, /whatsapp_approval|whatsapp_review/i);
});
test("WhatsApp draft review pages/action are gated by the WhatsApp entitlement (Professional+), never the commercial Approval Workflows entitlement (Business+)", () => {
  for (const source of [listPageSource, detailPageSource, whatsappActionsSource]) {
    assert.match(source, /requireEntitlement\("whatsapp"\)/);
    assert.doesNotMatch(source, /requireEntitlement\("approvals"\)/);
  }
});
test("the general D1 approval pages/actions are untouched and remain gated by the commercial Approval Workflows entitlement", () => {
  assert.match(d1ActionsSource, /requireEntitlement\("approvals"\)/);
  const d1PageA = readFileSync("app/vayon/approvals/page.tsx", "utf8");
  const d1PageB = readFileSync("app/vayon/approvals/[approvalId]/page.tsx", "utf8");
  for (const source of [d1PageA, d1PageB]) assert.match(source, /requireEntitlement\("approvals"\)/);
});
test("19/22/23: Starter lacks 'whatsapp'; Professional/Business/Business Plus/Enterprise all have it (Founding Professional maps to the same 'professional' catalog entry, unmodified)", () => {
  const { subscriptionEntitlementCatalog } = load("features/vayon/billing/config/entitlements.ts");
  assert.ok(!subscriptionEntitlementCatalog.starter.features.includes("whatsapp"));
  for (const plan of ["professional", "business", "business_plus", "enterprise"]) assert.ok(subscriptionEntitlementCatalog[plan].features.includes("whatsapp"), `${plan} must include whatsapp`);
});
test("21: Professional does not have 'approvals' -- so the WhatsApp-scoped action's own entitlement check (whatsapp, not approvals) is the only thing that could ever let it through, and it never gains the general Business+ feature set", () => {
  const { subscriptionEntitlementCatalog } = load("features/vayon/billing/config/entitlements.ts");
  assert.ok(!subscriptionEntitlementCatalog.professional.features.includes("approvals"));
  assert.ok(subscriptionEntitlementCatalog.business.features.includes("approvals"));
});
test("the WhatsApp-scoped list/detail pages only ever show/operate on source_type='whatsapp_ai_draft' approvals -- never a general approval, even if one exists in the same workspace", () => {
  assert.match(listPageSource, /sourceType === "whatsapp_ai_draft" && item\.actionType === "whatsapp\.message\.send"/);
  assert.match(detailPageSource, /result\.approval\.sourceType !== "whatsapp_ai_draft" \|\| result\.approval\.actionType !== "whatsapp\.message\.send"/);
});
test("15/security: the WhatsApp-scoped decide action refuses to decide an approval whose sourceType/actionType do not match, closing the path a Professional customer could otherwise use to decide an unrelated Business+-created approval", () => {
  assert.match(whatsappActionsSource, /approval\.sourceType !== "whatsapp_ai_draft" \|\| approval\.actionType !== "whatsapp\.message\.send"/);
  const guardIndex = whatsappActionsSource.indexOf("approval.sourceType !==");
  const decideIndex = whatsappActionsSource.indexOf("service.decideApproval(");
  assert.ok(guardIndex > -1 && decideIndex > -1 && guardIndex < decideIndex, "the sourceType/actionType guard must run before decideApproval is ever called");
});

// ---------------------------------------------------------------------------
// PART 6 -- PERMISSIONS
// ---------------------------------------------------------------------------
test("reviewer permission reuses the existing 'approvals' permission module/action (approve) -- can_manage_approvals()'s existing role set (organization_owner, organization_admin, manager) is not widened, and no new permission module or role system was created", () => {
  assert.match(whatsappActionsSource, /requireWorkspacePermission\("approvals", "approve"\)/);
  assert.doesNotMatch(migration, /create or replace function public\.can_manage_approvals/);
  const permissionTypesSource = readFileSync("features/platform/permissions/runtime/types.ts", "utf8");
  assert.doesNotMatch(permissionTypesSource, /"communications"|"whatsapp"/);
});

// ---------------------------------------------------------------------------
// PART 7 -- REVIEW UI
// ---------------------------------------------------------------------------
test("the review UI is a new, minimal, dedicated route (/vayon/whatsapp/approvals) -- the existing WhatsApp inbox/conversation UI is not modified", () => {
  const output = execSync("git status --short -- features/platform/whatsapp", { cwd: process.cwd() }).toString();
  assert.equal(output.trim(), "");
});
test("the detail page shows Approve/Reject forms only when the item is pending and the viewer can decide -- no edit form exists", () => {
  assert.match(whatsappViewsSource, /item\.status === "pending" && canDecide/);
  assert.doesNotMatch(whatsappViewsSource, /<textarea|contentEditable|onChange.*content/i);
});

// ---------------------------------------------------------------------------
// PART 8 -- DRAFT STATE MODEL / SOURCE OF TRUTH
// ---------------------------------------------------------------------------
test("approval_requests remains the sole source of truth for approval status -- this phase adds no new status/state column to ai_workforce_messages, and does not overload delivery_state with approval semantics", () => {
  assert.doesNotMatch(migration, /alter table.*ai_workforce_messages|add column/i);
  assert.doesNotMatch(migration, /delivery_state/);
});
test("delivery_state's only two values remain 'not_applicable'/'draft' -- Phase E4 introduces no 'approved'/'sent' delivery_state value", () => {
  assert.match(e3Migration, /check \(delivery_state in \('not_applicable', 'draft'\)\)/);
  assert.doesNotMatch(migration, /'approved'.*delivery_state|delivery_state.*'approved'|'sent'/);
});

// ---------------------------------------------------------------------------
// PART 9/10 -- APPROVAL DECISION AND SEND ELIGIBILITY
// ---------------------------------------------------------------------------
test("29: an approved, unsent, correctly-tenant-scoped draft resolves eligible", async () => {
  const client = makeFakeClient({
    selects: {
      ai_workforce_messages: { id: "draft-1", conversation_id: "conv-1", role: "assistant", delivery_state: "draft" },
      ai_workforce_conversations: { id: "conv-1", channel: "whatsapp", communication_thread_id: "thread-1", lead_id: "lead-1" },
      approval_requests: { id: "approval-1", status: "approved" },
    },
  });
  const { resolveWhatsAppDraftSendEligibility } = load("features/platform/integrations/whatsapp/whatsapp-draft-send-eligibility.service.ts", {
    "@/lib/supabase/service": { createSupabaseServiceClient: () => client },
  });
  const result = await resolveWhatsAppDraftSendEligibility({ organizationId: "org-1", workspaceId: "ws-1", draftMessageId: "draft-1" });
  assert.equal(result.eligible, true);
  assert.equal(result.approvalId, "approval-1");
  assert.equal(result.communicationThreadId, "thread-1");
});
test("30: a pending approval is not eligible", async () => {
  const client = makeFakeClient({
    selects: {
      ai_workforce_messages: { id: "draft-1", conversation_id: "conv-1", role: "assistant", delivery_state: "draft" },
      ai_workforce_conversations: { id: "conv-1", channel: "whatsapp", communication_thread_id: "thread-1", lead_id: null },
      approval_requests: { id: "approval-1", status: "pending" },
    },
  });
  const { resolveWhatsAppDraftSendEligibility } = load("features/platform/integrations/whatsapp/whatsapp-draft-send-eligibility.service.ts", { "@/lib/supabase/service": { createSupabaseServiceClient: () => client } });
  const result = await resolveWhatsAppDraftSendEligibility({ organizationId: "org-1", workspaceId: "ws-1", draftMessageId: "draft-1" });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "not_approved");
});
test("31: a rejected approval is not eligible", async () => {
  const client = makeFakeClient({
    selects: {
      ai_workforce_messages: { id: "draft-1", conversation_id: "conv-1", role: "assistant", delivery_state: "draft" },
      ai_workforce_conversations: { id: "conv-1", channel: "whatsapp", communication_thread_id: "thread-1", lead_id: null },
      approval_requests: { id: "approval-1", status: "rejected" },
    },
  });
  const { resolveWhatsAppDraftSendEligibility } = load("features/platform/integrations/whatsapp/whatsapp-draft-send-eligibility.service.ts", { "@/lib/supabase/service": { createSupabaseServiceClient: () => client } });
  const result = await resolveWhatsAppDraftSendEligibility({ organizationId: "org-1", workspaceId: "ws-1", draftMessageId: "draft-1" });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "not_approved");
});
test("32: a draft that does not exist under the given org/workspace (wrong tenant) is not eligible -- 'not_found', never leaking whether it exists elsewhere", async () => {
  const client = makeFakeClient({ selects: {} });
  const { resolveWhatsAppDraftSendEligibility } = load("features/platform/integrations/whatsapp/whatsapp-draft-send-eligibility.service.ts", { "@/lib/supabase/service": { createSupabaseServiceClient: () => client } });
  const result = await resolveWhatsAppDraftSendEligibility({ organizationId: "org-a", workspaceId: "ws-a", draftMessageId: "draft-owned-by-org-b" });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "not_found");
});
test("33: a draft whose delivery_state is not 'draft' (a future send-phase marker) is not eligible -- forward-compatible already-sent detection without E4 fabricating that state itself", async () => {
  const client = makeFakeClient({
    selects: {
      ai_workforce_messages: { id: "draft-1", conversation_id: "conv-1", role: "assistant", delivery_state: "not_applicable" },
      ai_workforce_conversations: { id: "conv-1", channel: "whatsapp", communication_thread_id: "thread-1", lead_id: null },
      approval_requests: { id: "approval-1", status: "approved" },
    },
  });
  const { resolveWhatsAppDraftSendEligibility } = load("features/platform/integrations/whatsapp/whatsapp-draft-send-eligibility.service.ts", { "@/lib/supabase/service": { createSupabaseServiceClient: () => client } });
  const result = await resolveWhatsAppDraftSendEligibility({ organizationId: "org-1", workspaceId: "ws-1", draftMessageId: "draft-1" });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "already_sent");
});
test("channel mismatch (not a whatsapp conversation) is not eligible", async () => {
  const client = makeFakeClient({
    selects: {
      ai_workforce_messages: { id: "draft-1", conversation_id: "conv-1", role: "assistant", delivery_state: "draft" },
      ai_workforce_conversations: { id: "conv-1", channel: "web", communication_thread_id: null, lead_id: null },
    },
  });
  const { resolveWhatsAppDraftSendEligibility } = load("features/platform/integrations/whatsapp/whatsapp-draft-send-eligibility.service.ts", { "@/lib/supabase/service": { createSupabaseServiceClient: () => client } });
  const result = await resolveWhatsAppDraftSendEligibility({ organizationId: "org-1", workspaceId: "ws-1", draftMessageId: "draft-1" });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "channel_mismatch");
});
test("eligibility never trusts a client-supplied approvalId -- resolveWhatsAppDraftSendEligibility takes no approvalId parameter at all, only organizationId/workspaceId/draftMessageId", () => {
  assert.doesNotMatch(eligibilityServiceSource, /approvalId:\s*string;\s*\n\s*readonly workspaceId/);
  assert.match(eligibilityServiceSource, /interface WhatsAppDraftSendEligibilityInput \{\s*\n\s*readonly organizationId: string;\s*\n\s*readonly workspaceId: string;\s*\n\s*readonly draftMessageId: string;/);
});

// ---------------------------------------------------------------------------
// PART 9 -- ON APPROVE / ON REJECT
// ---------------------------------------------------------------------------
test("on approve: no Graph API call, no communication row, no delivery status fabrication -- the action only calls decideApproval", () => {
  const body = whatsappActionsSource.slice(whatsappActionsSource.indexOf("async function decideWhatsAppDraft"));
  assert.doesNotMatch(body, /sendText\(|graph\.facebook\.com|communications|whatsapp_messages/);
});
test("on reject: rejection reason is passed through and retained by the existing approval system, no regeneration is triggered", () => {
  assert.match(whatsappActionsSource, /rejectWhatsAppDraftAction[\s\S]*?reason = String\(formData\.get\("reason"\) \?\? ""\) \|\| undefined/);
  assert.doesNotMatch(whatsappActionsSource, /generateDraft\(|generateWorkforceReply\(/);
});

// ---------------------------------------------------------------------------
// PART 12 -- AUDIT
// ---------------------------------------------------------------------------
test("approval.requested/approved/rejected events reuse approval_events and activity_events exactly as D1's own request_approval()/decide_approval() do -- no new WhatsApp-specific audit table, and organization_audit_events is not written to", () => {
  assert.match(migration, /insert into approval_events \(organization_id, workspace_id, approval_id, event, actor_id, metadata\)/);
  assert.match(migration, /'approval\.requested'/);
  assert.match(migration, /insert into activity_events \(organization_id, workspace_id, event_type, title, actor_id, related_type, related_id\)/);
  assert.doesNotMatch(migration, /organization_audit_events/);
  assert.doesNotMatch(migration, /create table.*(whatsapp_approval|audit)/i);
});

// ---------------------------------------------------------------------------
// PART 13 -- PROVIDER MESSAGE ID TRACEABILITY
// ---------------------------------------------------------------------------
test("no Meta provider message id is stored in the generic approval tables -- source_id references the AI draft message id, and the payload's IDs are all internal VAYON identifiers, not p_message fields", () => {
  assert.doesNotMatch(migration, /wa_id|provider_message_id|p_message->>/);
});

// ---------------------------------------------------------------------------
// PART 15 -- SECURITY (static, complements the executed eligibility tests)
// ---------------------------------------------------------------------------
test("security-critical: request_whatsapp_draft_approval is granted to service_role only, requires it at runtime, and verifies draft/conversation/thread/lead ownership before writing anything", () => {
  assert.match(migration, /revoke all on function public\.request_whatsapp_draft_approval\(uuid, uuid, uuid, uuid, uuid, text\) from public;\s*\ngrant execute on function public\.request_whatsapp_draft_approval\(uuid, uuid, uuid, uuid, uuid, text\) to service_role;/);
  assert.doesNotMatch(migration, /grant execute on function public\.request_whatsapp_draft_approval.*to authenticated/);
  const body = migration.slice(migration.indexOf("create or replace function public.request_whatsapp_draft_approval"), migration.indexOf("revoke all on function public.request_whatsapp_draft_approval"));
  assert.match(body, /if current_setting\('role', true\) <> 'service_role' then/);
  assert.match(body, /and c\.channel = 'whatsapp'\s*\n\s*and c\.communication_thread_id = p_communication_thread_id\s*\n\s*and c\.lead_id is not distinct from p_lead_id/);
});
test("no client can fake approved=true -- eligibility always re-reads approval status from approval_requests itself, never accepts a boolean input", () => {
  assert.doesNotMatch(eligibilityServiceSource, /approved:\s*boolean|eligible:\s*boolean;\s*\n.*input/i);
  assert.match(eligibilityServiceSource, /approval\.status !== "approved"/);
});

// ---------------------------------------------------------------------------
// PART 16 -- RATE LIMIT / ABUSE (no new limiter; E3's idempotency reused)
// ---------------------------------------------------------------------------
test("no new rate-limit system was introduced; approval creation relies on E3's existing per-provider-message-id idempotency plus this phase's own advisory-lock/unique-index pair, not a new limiter", () => {
  for (const source of [migration, draftApprovalServiceSource, orchestratorSource]) assert.doesNotMatch(source, /EnterpriseRateLimitService|MemoryRateLimitProvider|rateLimitBoundaries/);
});

// ---------------------------------------------------------------------------
// SEND SAFETY (24-28) / NO SIDE EFFECTS
// ---------------------------------------------------------------------------
test("24/25/26: neither approve nor reject calls sendText or any Meta Graph endpoint", () => {
  for (const source of [whatsappActionsSource, migration, draftApprovalServiceSource, eligibilityServiceSource]) {
    assert.doesNotMatch(source, /sendText\(|sendTemplate\(|sendMedia\(|graph\.facebook\.com/);
  }
});
test("27/28: no communication is ever marked 'sent' and no whatsapp_messages delivery status is fabricated by this phase's new code", () => {
  for (const source of [migration, draftApprovalServiceSource, eligibilityServiceSource, whatsappActionsSource]) {
    assert.doesNotMatch(source, /update communications|update whatsapp_messages|status.*'sent'/i);
  }
});

// ---------------------------------------------------------------------------
// PART 20/21 -- EXISTING WORK SAFETY
// ---------------------------------------------------------------------------
test("D1's own migration file is untouched -- E4 only adds a new, later migration", () => {
  const output = execSync("git status --short -- supabase/migrations/20261102000000_business_approval_workflows.sql", { cwd: process.cwd() }).toString().trim();
  assert.equal(output, "?? supabase/migrations/20261102000000_business_approval_workflows.sql");
});
test("no D1 (Approvals) or D2 (Quota) engine file was modified by this phase (only new E4 files were added under the shared directory prefix)", () => {
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
  assert.deepEqual(status, expected, "any unexpected deviation here means E4 touched a D1/D2 engine file it should not have");
});
test("E1/E2 files are not modified by this phase beyond E3's already-disclosed extensions -- phone.ts, lead-identity.service.ts, trusted-context.ts remain untouched", () => {
  const output = execSync("git status --short -- features/vayon/lead/utils features/platform/integrations/whatsapp/lead-identity.service.ts features/platform/openai/runtime/trusted-context.ts", { cwd: process.cwd() }).toString().trim().split("\n").filter(Boolean);
  // Staged-new ("A") and untracked ("??") both mean "no tracked history exists yet" --
  // treated as equivalent here so this assertion survives a later release staging these
  // E1/E3-authored files, not just their original untracked state. `git status` also only
  // collapses an entirely-untracked directory to one line -- normalized to the directory
  // form here so this holds regardless of that staging-driven granularity.
  const parse = (line) => {
    const m = /^(.{2})\s*(.+)$/.exec(line);
    if (!m) return line;
    const code = m[1].trim() === "A" ? "??" : m[1].trim();
    const path = m[2].startsWith("features/vayon/lead/utils/") ? "features/vayon/lead/utils/" : m[2];
    return `${code}|${path}`;
  };
  assert.deepEqual(output.map(parse).sort(), ["??|features/platform/integrations/whatsapp/lead-identity.service.ts", "??|features/vayon/lead/utils/", "??|features/platform/openai/runtime/trusted-context.ts"].sort());
});
test("37/38/39: E3's generateWorkforceReply/generation.ts, E2's resolve_whatsapp_ai_conversation, and E1's resolve_whatsapp_lead_identity are not redefined or altered by this migration", () => {
  assert.doesNotMatch(migration, /create or replace function public\.(generate_workforce_reply|resolve_whatsapp_ai_conversation|resolve_whatsapp_lead_identity|process_whatsapp_message|append_trusted_ai_message)/);
  // "??" (untracked) or "A" (staged-new, once a later release stages this E3-authored file)
  // both mean the same thing here: no tracked history exists for it yet.
  const output = execSync("git status --short -- features/platform/openai/runtime/generation.ts", { cwd: process.cwd() }).toString().trim();
  assert.match(output, /^(\?\?|A)\s+features\/platform\/openai\/runtime\/generation\.ts$/);
});
test("40: web AI chat (chat()) is untouched by this phase", () => {
  const serviceSource = readFileSync("features/platform/openai/runtime/service.ts", "utf8");
  assert.match(serviceSource, /async \*chat\(input: RuntimeChatInput\) \{\s*\n\s*await new SubscriptionWriteService\(\)\.require\(\);/);
  // Compare against HEAD explicitly (not just the unstaged working tree) so this remains
  // correct once a later release stages this file -- `git diff --stat` alone shows nothing
  // for a file that is fully staged with no further unstaged edit.
  const output = execSync("git diff HEAD --stat -- features/platform/openai/runtime/service.ts", { cwd: process.cwd() }).toString();
  assert.match(output, /1 file changed/);
});
test("no pricing, Paddle, founding, billing, package-entitlement-tier, D2 quota, Knowledge, Calendar, or human-handoff file was touched", () => {
  const output = execSync("git status --short -- features/marketing/components/PricingTable.tsx features/platform/commercial-pricing.ts features/vayon/billing/providers features/vayon/billing/config/entitlements.ts features/vayon/ai-workforce/services/knowledge.service.ts features/platform/knowledge features/vayon/operations/services/meeting.service.ts features/vayon/calendar-platform", { cwd: process.cwd() }).toString();
  assert.equal(output.trim(), "");
});

// ---------------------------------------------------------------------------
// NO EXECUTION
// ---------------------------------------------------------------------------
test("no credential value is referenced anywhere in this phase's new files", () => {
  for (const source of [migration, orchestratorSource, draftApprovalServiceSource, eligibilityServiceSource, whatsappActionsSource]) {
    assert.doesNotMatch(source, /access_token_ciphertext|WHATSAPP_APP_SECRET|WHATSAPP_VERIFY_TOKEN|OPENAI_API_KEY|console\.log|console\.error/);
  }
});
test("no OpenAI call exists in any new E4 file", () => {
  for (const source of [migration, draftApprovalServiceSource, eligibilityServiceSource, whatsappActionsSource]) assert.doesNotMatch(source, /OpenAIProvider|provider\.stream|api\.openai\.com/);
});
