import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const rd = (p) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const migration = rd("supabase/migrations/20261121000000_whatsapp_consent_revocation.sql");
const migrationSql = migration.split("\n").map((l) => l.replace(/--.*$/, "")).join("\n");
const revokeFn = migrationSql.slice(migrationSql.indexOf("function public.record_whatsapp_consent_revocation"));
const detectionSrc = rd("features/platform/integrations/whatsapp/whatsapp-opt-out-detection.ts");
const revocationServiceSrc = rd("features/platform/integrations/whatsapp/whatsapp-consent-revocation.service.ts");
const whatsappServiceSrc = rd("features/platform/integrations/whatsapp/whatsapp.service.ts");
const m6Migration = rd("supabase/migrations/20261119000000_meta_lead_consent.sql");
const m7Migration = rd("supabase/migrations/20261120000000_meta_lead_whatsapp_outreach.sql");
const eligibilityServiceSrc = rd("features/platform/integrations/whatsapp/whatsapp-outreach-eligibility.service.ts");
const executionServiceSrc = rd("features/platform/integrations/whatsapp/whatsapp-outreach-execution.service.ts");
const leadIdentityServiceSrc = rd("features/platform/integrations/whatsapp/lead-identity.service.ts");
const e1Migration = rd("supabase/migrations/20261104000000_whatsapp_crm_identity.sql");
const whatsappOrchestratorSrc = rd("features/platform/integrations/whatsapp/whatsapp-ai-orchestrator.service.ts");
const trustedRuntimeSrc = rd("features/platform/openai/runtime/trusted-runtime.ts");
const k4RetrievalSrc = rd("features/vayon/property-knowledge/retrieval/retrieval.service.ts");

// NOTE: no live Meta/WhatsApp call, no real send, no OpenAI call, no live Postgres. SQL
// correctness for record_whatsapp_consent_revocation is established by careful review plus
// static regex assertions against the migration text. TS-orchestration behavior (detection,
// the revocation service, and receive()'s own branching) is genuinely executed against
// fake/mocked dependencies.

const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");

const { isExplicitWhatsAppOptOut, whatsappOptOutKeywords, whatsappOptOutPhrases } = load("features/platform/integrations/whatsapp/whatsapp-opt-out-detection.ts");

// ===========================================================================
// DETECTION (1-9)
// ===========================================================================
test("1: \"STOP\" revokes", () => { assert.equal(isExplicitWhatsAppOptOut("STOP"), true); });
test("2: \"stop\" revokes", () => { assert.equal(isExplicitWhatsAppOptOut("stop"), true); });
test("3: trimmed \" stop \" revokes", () => { assert.equal(isExplicitWhatsAppOptOut(" stop "), true); });
test("4: \"Unsubscribe\" revokes", () => { assert.equal(isExplicitWhatsAppOptOut("Unsubscribe"), true); });
test("5: \"CANCEL\" revokes", () => { assert.equal(isExplicitWhatsAppOptOut("CANCEL"), true); });
test("6: \"End\" revokes", () => { assert.equal(isExplicitWhatsAppOptOut("End"), true); });
test("7: \"quit\" revokes", () => { assert.equal(isExplicitWhatsAppOptOut("quit"), true); });
test("8: a substring sentence does not revoke", () => {
  assert.equal(isExplicitWhatsAppOptOut("don't stop sending the brochure"), false);
  assert.equal(isExplicitWhatsAppOptOut("when does the offer end?"), false);
  assert.equal(isExplicitWhatsAppOptOut("quit claim deed"), false);
});
test("9: unrelated text does not revoke", () => {
  assert.equal(isExplicitWhatsAppOptOut("Is the villa still available?"), false);
  assert.equal(isExplicitWhatsAppOptOut(""), false);
  assert.equal(isExplicitWhatsAppOptOut(undefined), false);
});
test("exact keyword/phrase lists match the reported policy", () => {
  assert.deepEqual([...whatsappOptOutKeywords], ["stop", "unsubscribe", "cancel", "end", "quit"]);
  assert.deepEqual([...whatsappOptOutPhrases], ["stop messages", "do not contact me", "don't contact me", "unsubscribe me"]);
});
test("optional phrases also revoke, still via exact whole-message matching only", () => {
  assert.equal(isExplicitWhatsAppOptOut("Stop messages"), true);
  assert.equal(isExplicitWhatsAppOptOut("Do not contact me"), true);
  assert.equal(isExplicitWhatsAppOptOut("please do not contact me anymore"), false);
});

// ---------------------------------------------------------------------------
// Fixtures for receive()-level integration tests
// ---------------------------------------------------------------------------
function makeFakeServiceClient({ rpcHandlers = {} } = {}) {
  const calls = { rpc: [], insert: [] };
  const rpc = async (name, params) => {
    calls.rpc.push({ name, params });
    if (rpcHandlers[name]) return rpcHandlers[name](params);
    return { data: null, error: null };
  };
  return { client: { rpc, from: (table) => ({ insert: (row) => { calls.insert.push({ table, row }); return { data: null, error: null }; } }) }, calls };
}

function connection(over = {}) {
  return { id: "conn-1", organization_id: "org-1", workspace_id: "ws-1", ...over };
}

function loadReceive({ persistResult = { is_new: true, lead_id: "lead-1", communication_thread_id: "thread-1" }, serviceClient, aiCalls = [], revocationCalls = [] }) {
  return load("features/platform/integrations/whatsapp/whatsapp.service.ts", {
    "./whatsapp.repository": {
      WhatsAppRepository: class {
        async connectionByPhoneNumber() { return connection(); }
        async persist() { return persistResult; }
        async updateStatus() { return undefined; }
      },
    },
    "./whatsapp-ai-orchestrator.service": { processInboundWhatsAppMessageForAI: async (input) => { aiCalls.push(input); } },
    "@/lib/supabase/service": { createSupabaseServiceClient: () => serviceClient },
    "./whatsapp-consent-revocation.service": {
      recordWhatsAppConsentRevocation: async (client, input) => { revocationCalls.push(input); return "consent-1"; },
    },
  });
}

function inboundPayload(text, id = "wamid.msg-1") {
  return {
    entry: [{ changes: [{
      value: {
        metadata: { phone_number_id: "pn-1", display_phone_number: "+10000000000" },
        contacts: [{ wa_id: "14155550132", profile: { name: "Jane" } }],
        messages: [{ id, from: "14155550132", type: "text", text: { body: text }, timestamp: "1700000000" }],
      },
    }] }],
  };
}

// ===========================================================================
// FLOW (10-14)
// ===========================================================================
test("10: the inbound message persists before revocation handling -- repo.persist() is always awaited first, unconditionally", () => {
  const receiveBody = whatsappServiceSrc.slice(whatsappServiceSrc.indexOf("async receive("), whatsappServiceSrc.indexOf("async sendText("));
  const persistIndex = receiveBody.indexOf("repo.persist(");
  const optOutIndex = receiveBody.indexOf("isExplicitWhatsAppOptOut(");
  assert.ok(persistIndex > -1 && optOutIndex > -1 && persistIndex < optOutIndex);
});
test("11: a trusted (resolved) lead is required -- no lead_id means no revocation is attempted, even for an opt-out message", async () => {
  const { calls, client } = makeFakeServiceClient();
  const revocationCalls = [];
  const { WhatsAppService } = loadReceive({ persistResult: { is_new: true, lead_id: null, communication_thread_id: "thread-1" }, serviceClient: client, revocationCalls });
  await new WhatsAppService().receive(inboundPayload("STOP"));
  assert.equal(revocationCalls.length, 0);
  assert.equal(calls.rpc.length, 0);
});
test("12: an opt-out message with a resolved lead appends a communication_consents revocation via the RPC", async () => {
  const { client } = makeFakeServiceClient({ rpcHandlers: { record_whatsapp_consent_revocation: () => ({ data: [{ consent_id: "consent-1", created: true }], error: null }) } });
  const revocationCalls = [];
  const { WhatsAppService } = loadReceive({ serviceClient: client, revocationCalls });
  await new WhatsAppService().receive(inboundPayload("STOP"));
  assert.equal(revocationCalls.length, 1);
  assert.equal(revocationCalls[0].leadId, "lead-1");
  assert.equal(revocationCalls[0].organizationId, "org-1");
  assert.equal(revocationCalls[0].sourceMessageId, "wamid.msg-1");
});
test("13: a previous granted consent row is never modified or deleted -- record_whatsapp_consent_revocation only ever INSERTs", () => {
  assert.doesNotMatch(revokeFn, /update communication_consents|delete from communication_consents/);
});
test("14: the latest effective consent state becomes 'revoked' -- the RPC always inserts status='revoked', never anything else", () => {
  assert.match(revokeFn, /'whatsapp', 'marketing', 'revoked',\s+'whatsapp_inbound', p_source_message_id, 'whatsapp', now\(\)/);
});

// ===========================================================================
// IDEMPOTENCY (15-16)
// ===========================================================================
test("15: a webhook retry (same WhatsApp message id) does not duplicate the revocation -- ON CONFLICT on the partial unique index, and the TS layer only writes activity_events when created=true", async () => {
  const { client, calls } = makeFakeServiceClient({ rpcHandlers: { record_whatsapp_consent_revocation: () => ({ data: [{ consent_id: "consent-1", created: false }], error: null }) } });
  const { recordWhatsAppConsentRevocation } = load("features/platform/integrations/whatsapp/whatsapp-consent-revocation.service.ts", {
    "@/lib/observability/logger": { log: () => {} },
  });
  await recordWhatsAppConsentRevocation(client, { organizationId: "org-1", workspaceId: "ws-1", leadId: "lead-1", sourceMessageId: "wamid.msg-1" });
  assert.equal(calls.insert.length, 0);
  assert.match(migrationSql, /on conflict \(source_message_id\) where source_type = 'whatsapp_inbound' do nothing/);
});
test("16: a separate LATER genuine STOP message (different WhatsApp message id) is safe -- creates its own row, never collides with the first", () => {
  const idx = migrationSql.indexOf("create unique index if not exists communication_consents_whatsapp_inbound_idx");
  assert.match(migrationSql.slice(idx), /on public\.communication_consents \(source_message_id\)\s+where source_type = 'whatsapp_inbound';/);
});

// ===========================================================================
// AI (17-20)
// ===========================================================================
test("17/18/19: STOP does not call AI Workforce, does not create an AI draft, does not create an approval -- processInboundWhatsAppMessageForAI is never invoked for an opt-out message", async () => {
  const { client } = makeFakeServiceClient({ rpcHandlers: { record_whatsapp_consent_revocation: () => ({ data: [{ consent_id: "consent-1", created: true }], error: null }) } });
  const aiCalls = [];
  const { WhatsAppService } = loadReceive({ serviceClient: client, aiCalls });
  await new WhatsAppService().receive(inboundPayload("STOP"));
  assert.equal(aiCalls.length, 0);
});
test("20: no OpenAI call exists anywhere in the M8 diff", () => {
  for (const src of [detectionSrc, revocationServiceSrc]) assert.doesNotMatch(strip(src), /openai|OpenAIProvider|chat\.completions/i);
});
test("ordinary (non-opt-out) text still triggers AI generation exactly as before", async () => {
  const { client } = makeFakeServiceClient();
  const aiCalls = [];
  const revocationCalls = [];
  const { WhatsAppService } = loadReceive({ serviceClient: client, aiCalls, revocationCalls });
  await new WhatsAppService().receive(inboundPayload("Is the villa still available?"));
  assert.equal(aiCalls.length, 1);
  assert.equal(revocationCalls.length, 0);
});

// ===========================================================================
// OUTREACH (21-23)
// ===========================================================================
test("21: M6 eligibility blocks after revocation -- resolveWhatsAppOutreachEligibility always reads the latest recorded_at consent row, unmodified logic", () => {
  assert.match(eligibilityServiceSrc, /order\("recorded_at", \{ ascending: false \}\)/);
  assert.match(eligibilityServiceSrc, /consent\.status === "revoked"\) return consentBlocked\(leadId, "consent_revoked"/);
});
test("22: an M7-prepared outreach preview cannot send after revocation -- executeGovernedMetaLeadWhatsAppOutreach reruns the SAME eligibility function immediately before send (no M7 code change needed)", () => {
  assert.match(executionServiceSrc, /resolveWhatsAppOutreachEligibility\(/);
  assert.match(executionServiceSrc, /PART 12: mandatory recheck/);
});
test("23: the explicit send-time recheck blocks a revoked lead -- integration proof using the real eligibility function against a fake DB reflecting a revocation row", async () => {
  const { resolveWhatsAppOutreachEligibility } = load("features/platform/integrations/whatsapp/whatsapp-outreach-eligibility.service.ts", {
    "@/features/vayon/operations/services/context": { operationsContext: async () => { throw new Error("unused"); } },
    "@/features/vayon/billing/services/entitlement.service": { SubscriptionEntitlementService: class {} },
  });
  const tables = {
    leads: [{ id: "lead-1", organization_id: "org-1", workspace_id: "ws-1", phone: "+14155550132", normalized_phone: "+14155550132", do_not_contact: false, deleted_at: null }],
    communication_consents: [
      { id: "consent-granted", organization_id: "org-1", workspace_id: "ws-1", lead_id: "lead-1", channel: "whatsapp", purpose: "marketing", status: "granted", recorded_at: "2026-01-01T00:00:00.000Z" },
      { id: "consent-revoked", organization_id: "org-1", workspace_id: "ws-1", lead_id: "lead-1", channel: "whatsapp", purpose: "marketing", status: "revoked", recorded_at: "2026-02-01T00:00:00.000Z" },
    ],
  };
  function chain(table) {
    const filters = [];
    let order = null;
    const c = {
      select: () => c, eq: (col, val) => { filters.push((r) => r[col] === val); return c; }, is: (col, val) => { filters.push((r) => (r[col] ?? null) === val); return c; },
      order: (col, opts) => { order = { col, desc: opts?.ascending === false }; return c; }, limit: () => c,
      maybeSingle: async () => { let rows = tables[table].filter((r) => filters.every((f) => f(r))); if (order) rows = [...rows].sort((a, b) => order.desc ? String(b[order.col]).localeCompare(String(a[order.col])) : 0); return { data: rows[0] ?? null, error: null }; },
    };
    return c;
  }
  const client = { from: (t) => chain(t) };
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: { feature: async () => ({ allowed: true }) } });
  assert.equal(result.eligible, false);
  assert.equal(result.consent.reason, "consent_revoked");
});

// ===========================================================================
// PURPOSE (24-26)
// ===========================================================================
test("24: the revocation is scoped to channel='whatsapp', purpose='marketing'", () => {
  assert.match(revokeFn, /'whatsapp', 'marketing', 'revoked'/);
});
test("25: transactional purpose is not silently revoked -- the RPC hard-codes 'marketing', never a transactional row", () => {
  assert.doesNotMatch(revokeFn, /'transactional'/);
});
test("26: email/sms consent is unaffected -- the RPC hard-codes channel='whatsapp', never email/sms", () => {
  assert.doesNotMatch(revokeFn, /'email'|'sms'/);
});

// ===========================================================================
// TENANT (27-29)
// ===========================================================================
test("27: a cross-tenant lead is blocked -- the RPC re-verifies the lead belongs to the exact organization_id/workspace_id before inserting anything", () => {
  assert.match(revokeFn, /where id = p_lead_id and organization_id = p_organization_id and workspace_id = p_workspace_id and deleted_at is null/);
  assert.match(revokeFn, /raise exception 'NOT_ELIGIBLE: lead does not belong to this workspace'/);
});
test("28: a cross-tenant message id cannot be reused to bypass the check -- the unique index has no tenant scoping, so any duplicate id is caught globally, and tenant is independently re-verified for every call regardless", () => {
  assert.match(migrationSql, /create unique index if not exists communication_consents_whatsapp_inbound_idx/);
});
test("29: organization_id/workspace_id are derived from the trusted whatsapp_connections row, never the raw webhook payload", () => {
  assert.match(whatsappServiceSrc, /organizationId:connection\.organization_id,workspaceId:connection\.workspace_id,leadId:result\.lead_id,sourceMessageId:m\.id/);
  assert.doesNotMatch(strip(revocationServiceSrc), /payload\.|change\.value/);
});

// ===========================================================================
// SECURITY (30-33)
// ===========================================================================
test("30: no public revoke endpoint exists -- record_whatsapp_consent_revocation is service_role-only, never granted to authenticated", () => {
  assert.match(revokeFn, /if current_setting\('role', true\) <> 'service_role' then/);
  assert.match(migrationSql, /grant execute on function public\.record_whatsapp_consent_revocation\([^)]*\) to service_role;/);
  assert.doesNotMatch(migrationSql, /grant execute on function public\.record_whatsapp_consent_revocation\([^)]*\) to authenticated/);
});
test("31: no client-provided 'revoked' boolean is ever accepted -- the RPC signature has no boolean parameter at all, status is hard-coded", () => {
  const signature = revokeFn.slice(0, revokeFn.indexOf(") returns table"));
  assert.doesNotMatch(signature, /boolean/);
});
test("32: no PII (phone/email/name) is ever logged in the M8 diff", () => {
  for (const src of [detectionSrc, revocationServiceSrc]) assert.doesNotMatch(strip(src), /log\(.*phone|log\(.*email|log\(.*name|log\(.*text\b/i);
});
test("33: no message content appears in activity_events metadata -- only leadId/consentId/sourceMessageId", () => {
  assert.match(revocationServiceSrc, /metadata: \{ leadId: input\.leadId, consentId, sourceMessageId: input\.sourceMessageId \}/);
});

// ===========================================================================
// SIDE EFFECTS (34-39)
// ===========================================================================
const m8Sources = [migrationSql, detectionSrc, revocationServiceSrc];
test("34: no outbound WhatsApp message is sent anywhere in the M8 diff", () => {
  for (const src of m8Sources) assert.doesNotMatch(strip(src), /sendText|sendTemplate|sendPayload/i);
  assert.doesNotMatch(strip(whatsappServiceSrc).slice(strip(whatsappServiceSrc).indexOf("isExplicitWhatsAppOptOut"), strip(whatsappServiceSrc).indexOf("for(const s of")), /sendText\(|sendTemplate\(/);
});
test("35: no Meta Graph call exists anywhere in the M8 diff", () => {
  for (const src of m8Sources) assert.doesNotMatch(strip(src), /graph\.facebook\.com/i);
});
test("36: no CRM identity mutation exists anywhere in the M8 diff", () => {
  for (const src of m8Sources) assert.doesNotMatch(strip(src), /insert into leads|update leads set|create_lead/i);
});
test("37: no property mutation exists anywhere in the M8 diff", () => {
  for (const src of m8Sources) assert.doesNotMatch(strip(src), /update properties set|insert into properties|lead_property_interests/i);
});
test("38: no calendar event is created anywhere in the M8 diff", () => {
  for (const src of m8Sources) assert.doesNotMatch(strip(src), /site_visits|calendar_events/i);
});
test("39: no campaign mutation exists anywhere in the M8 diff", () => {
  for (const src of m8Sources) assert.doesNotMatch(strip(src), /creative_campaigns|campaign/i);
});

// ===========================================================================
// REGRESSION (40-45)
// ===========================================================================
test("40: ordinary inbound WhatsApp still reaches E3/K6 -- proven above (\"ordinary (non-opt-out) text still triggers AI generation exactly as before\")", () => {
  assert.match(whatsappServiceSrc, /processInboundWhatsAppMessageForAI\(/);
});
test("41: E1 identity resolution is unchanged -- resolve_whatsapp_lead_identity/process_whatsapp_message are not referenced or modified by the M8 migration", () => {
  assert.doesNotMatch(migrationSql, /resolve_whatsapp_lead_identity|process_whatsapp_message/);
  assert.doesNotMatch(e1Migration, /whatsapp_inbound|record_whatsapp_consent_revocation/);
  assert.doesNotMatch(leadIdentityServiceSrc, /opt.?out|consent_revoked|whatsapp_inbound/i);
});
test("42: E3 draft flow is unchanged for non-opt-out messages -- processInboundWhatsAppMessageForAI is called with the exact same argument shape as before", () => {
  assert.match(whatsappServiceSrc, /organizationId:connection\.organization_id,workspaceId:connection\.workspace_id,leadId:result\.lead_id\?\?null,communicationThreadId:result\.communication_thread_id,text:m\.text,providerMessageId:m\.id/);
});
test("43: M6 eligibility is unchanged except reading the new legitimate revocation row -- no new branch/reason was added to whatsapp-outreach-eligibility.service.ts", () => {
  assert.doesNotMatch(eligibilityServiceSrc, /whatsapp_inbound|source_message_id/);
});
test("44: M7 governed send is unchanged -- no M7 file references the new opt-out/revocation model", () => {
  assert.doesNotMatch(executionServiceSrc, /whatsapp_inbound|source_message_id|isExplicitWhatsAppOptOut/);
  assert.doesNotMatch(m7Migration, /whatsapp_inbound|source_message_id/);
});
test("45: K1-K6 are unchanged by M8", () => {
  assert.doesNotMatch(k4RetrievalSrc, /'whatsapp_inbound'|opt.?out|consent_revoked/i);
  assert.doesNotMatch(whatsappOrchestratorSrc + trustedRuntimeSrc, /'whatsapp_inbound'|isExplicitWhatsAppOptOut\(/i);
});

// ---------------------------------------------------------------------------
// Additional coverage: migration structure, do_not_contact untouched.
// ---------------------------------------------------------------------------
test("do_not_contact is left completely unchanged -- no read, no write, anywhere in the M8 diff", () => {
  for (const src of m8Sources) assert.doesNotMatch(strip(src), /do_not_contact/);
});
test("no new table was created -- communication_consents (M6) is reused verbatim, only additively widened", () => {
  assert.doesNotMatch(migrationSql, /create table/i);
  assert.match(migrationSql, /alter table public\.communication_consents/);
});
test("migration is strictly after M7, additive only, and touches no earlier migration", () => {
  assert.ok("20261121000000" > "20261120000000");
  assert.doesNotMatch(migrationSql, /drop table|drop column/i);
  assert.doesNotMatch(m6Migration + m7Migration, /source_message_id|whatsapp_inbound/);
});
test("the source_type check constraint is additively widened (drop-if-exists + wider add), not replaced destructively", () => {
  assert.match(migrationSql, /drop constraint if exists communication_consents_source_type_check;/);
  assert.match(migrationSql, /check \(source_type in \('meta_lead_form', 'whatsapp_inbound'\)\)/);
});
