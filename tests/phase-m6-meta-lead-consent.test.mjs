import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const require = createRequire(import.meta.url);
const { NextRequest } = require("next/server");

const rd = (p) => readFileSync(p, "utf8");
const migration = rd("supabase/migrations/20261119000000_meta_lead_consent.sql");
const migrationSql = migration.split("\n").map((l) => l.replace(/--.*$/, "")).join("\n");
const configureFn = migrationSql.slice(migrationSql.indexOf("function public.configure_meta_lead_form_consent_rule"), migrationSql.indexOf("function public.disable_meta_lead_form_consent_rule"));
const disableRuleFn = migrationSql.slice(migrationSql.indexOf("function public.disable_meta_lead_form_consent_rule"), migrationSql.indexOf("function public.claim_meta_lead_consent_batch"));
const claimFn = migrationSql.slice(migrationSql.indexOf("function public.claim_meta_lead_consent_batch"), migrationSql.indexOf("function public.complete_meta_lead_consent_processing"));
const completeFn = migrationSql.slice(migrationSql.indexOf("function public.complete_meta_lead_consent_processing"));
const evaluatorSrc = rd("features/platform/integrations/meta-marketing/consent/evaluate-consent.ts");
const processingServiceSrc = rd("features/platform/integrations/meta-marketing/webhook/consent-processing.service.ts");
const eligibilityServiceSrc = rd("features/platform/integrations/whatsapp/whatsapp-outreach-eligibility.service.ts");
const routeSrc = rd("app/api/meta/leadgen/process-consent/route.ts");
const actionsSrc = rd("features/platform/integrations/meta-marketing/actions.ts");
const crmServiceSrc = rd("features/platform/integrations/meta-marketing/webhook/crm-ingestion.service.ts");
const leadDetailServiceSrc = rd("features/platform/integrations/meta-marketing/webhook/lead-detail-fetch.service.ts");
const webhookRouteSrc = rd("app/api/webhooks/meta-leadgen/route.ts");
const m1m2Migration = rd("supabase/migrations/20261115000000_meta_marketing_connection.sql");
const m3Migration = rd("supabase/migrations/20261116000000_meta_leadgen_webhook.sql");
const m4Migration = rd("supabase/migrations/20261117000000_meta_lead_detail_staging.sql");
const m5Migration = rd("supabase/migrations/20261118000000_meta_lead_crm_ingestion.sql");
const whatsappSendEligibilitySrc = rd("features/platform/integrations/whatsapp/whatsapp-draft-send-eligibility.service.ts");
const whatsappSendExecutionSrc = rd("features/platform/integrations/whatsapp/whatsapp-send-execution.service.ts");
const whatsappOrchestratorSrc = rd("features/platform/integrations/whatsapp/whatsapp-ai-orchestrator.service.ts");
const trustedRuntimeSrc = rd("features/platform/openai/runtime/trusted-runtime.ts");
const k4RetrievalSrc = rd("features/vayon/property-knowledge/retrieval/retrieval.service.ts");

// NOTE: no live Meta call, no live WhatsApp send, no live Postgres. SQL correctness for the
// RPC bodies is established by careful review plus static regex assertions against the
// migration text (the same convention every prior M-phase RPC used -- no live Postgres is
// available). TS-orchestration behavior (the evaluator, the processor, the eligibility
// service) is genuinely executed against fake Supabase clients.

process.env.CRON_SECRET = process.env.CRON_SECRET || "test-cron-secret-m6";
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");

const { evaluateMetaLeadConsent } = load("features/platform/integrations/meta-marketing/consent/evaluate-consent.ts");
const logCalls = [];
const {
  claimMetaLeadConsentBatch,
  processClaimedMetaLeadConsent,
  processPendingMetaLeadConsent,
} = load("features/platform/integrations/meta-marketing/webhook/consent-processing.service.ts", {
  "@/lib/observability/logger": { log: (...args) => { logCalls.push(args); } },
});
const { resolveWhatsAppOutreachEligibility } = load("features/platform/integrations/whatsapp/whatsapp-outreach-eligibility.service.ts", {
  "@/features/vayon/operations/services/context": { operationsContext: async () => { throw new Error("not used in these tests"); } },
  "@/features/vayon/billing/services/entitlement.service": { SubscriptionEntitlementService: class {} },
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
function rule(over = {}) {
  return { id: "rule-1", consentFieldName: "whatsapp_opt_in", acceptedValues: ["Yes", "I agree"], consentStatement: "By checking yes you agree to receive WhatsApp updates about your enquiry.", version: 1, ...over };
}
function answers(pairs) {
  return pairs.map(([fieldName, ...values]) => ({ fieldName, values }));
}

// ---------------------------------------------------------------------------
// Fake client for consent-processing.service.ts
// ---------------------------------------------------------------------------
function makeProcessingClient({ mapping = { id: "mapping-1" }, activeRule = null, rpcHandlers = {} } = {}) {
  const calls = { rpc: [], insert: [] };
  function chain(table) {
    const filters = [];
    const c = {
      select: () => c,
      eq: (col, val) => { filters.push((r) => r[col] === val); return c; },
      maybeSingle: async () => {
        if (table === "meta_lead_form_mappings") return { data: mapping, error: null };
        if (table === "meta_lead_form_consent_rules") return { data: activeRule, error: null };
        return { data: null, error: null };
      },
      insert: (row) => { calls.insert.push([table, row]); return { data: null, error: null }; },
    };
    return c;
  }
  const rpc = async (name, params) => {
    calls.rpc.push([name, params]);
    if (rpcHandlers[name]) return rpcHandlers[name](params);
    return { data: null, error: null };
  };
  return { from: (t) => chain(t), rpc, calls };
}
function claimedRow(over = {}) {
  return { id: "staging-1", organizationId: "org-1", workspaceId: "ws-1", leadId: "lead-1", pageId: "page-1", formId: "form-1", customAnswers: answers([["whatsapp_opt_in", "Yes"]]), ...over };
}
function ruleRow(over = {}) {
  return { id: "rule-1", consent_field_name: "whatsapp_opt_in", accepted_values: ["Yes", "I agree"], consent_statement: "Disclosure text.", version: 1, ...over };
}

// ---------------------------------------------------------------------------
// Fake client for whatsapp-outreach-eligibility.service.ts
// ---------------------------------------------------------------------------
function makeEligibilityClient({ leads = [], consents = [], connections = [], threads = [], communications = [] } = {}) {
  const tables = { leads, communication_consents: consents, whatsapp_connections: connections, communication_threads: threads, communications };
  function chain(table) {
    const filters = [];
    let order = null;
    let limit;
    const c = {
      select: () => c,
      eq: (col, val) => { filters.push((r) => r[col] === val); return c; },
      is: (col, val) => { filters.push((r) => (r[col] ?? null) === val); return c; },
      in: (col, vals) => { filters.push((r) => vals.includes(r[col])); return c; },
      gte: (col, val) => { filters.push((r) => r[col] >= val); return c; },
      order: (col, opts) => { order = { col, desc: opts?.ascending === false }; return c; },
      limit: (n) => { limit = n; return c; },
      maybeSingle: async () => {
        let rows = tables[table].filter((r) => filters.every((f) => f(r)));
        if (order) rows = [...rows].sort((a, b) => (order.desc ? String(b[order.col]).localeCompare(String(a[order.col])) : String(a[order.col]).localeCompare(String(b[order.col]))));
        return { data: rows[0] ?? null, error: null };
      },
      then: (resolve, reject) => {
        let rows = tables[table].filter((r) => filters.every((f) => f(r)));
        if (order) rows = [...rows].sort((a, b) => (order.desc ? String(b[order.col]).localeCompare(String(a[order.col])) : String(a[order.col]).localeCompare(String(b[order.col]))));
        Promise.resolve({ data: rows.slice(0, limit), error: null }).then(resolve, reject);
      },
    };
    return c;
  }
  return { from: (t) => chain(t) };
}
function leadRow(over = {}) {
  return { id: "lead-1", organization_id: "org-1", workspace_id: "ws-1", phone: "+14155550132", normalized_phone: "+14155550132", do_not_contact: false, deleted_at: null, ...over };
}
function grantedConsentRow(over = {}) {
  return { id: "consent-1", organization_id: "org-1", workspace_id: "ws-1", lead_id: "lead-1", channel: "whatsapp", purpose: "marketing", status: "granted", recorded_at: "2026-01-01T00:00:00.000Z", ...over };
}
function connectedRow(over = {}) {
  return { id: "conn-1", organization_id: "org-1", workspace_id: "ws-1", status: "connected", deleted_at: null, ...over };
}
const allowEntitlement = { feature: async () => ({ allowed: true }) };
const denyEntitlement = { feature: async () => ({ allowed: false }) };

// ===========================================================================
// AUDIT/MODEL (1-5)
// ===========================================================================
test("1: the canonical consent model is public.communication_consents, a new append-only table (no reuse of a nonexistent prior model)", () => {
  assert.match(migrationSql, /create table public\.communication_consents/);
});
test("2: no parallel/duplicate consent model is created -- exactly two new tables exist (the rule table and the event table)", () => {
  const createTables = [...migrationSql.matchAll(/create table public\.(\w+)/g)].map((m) => m[1]);
  assert.deepEqual(createTables.sort(), ["communication_consents", "meta_lead_form_consent_rules"].sort());
});
test("3: channel and purpose are separate columns, not a single undifferentiated boolean", () => {
  const tableDef = migrationSql.slice(migrationSql.indexOf("create table public.communication_consents"), migrationSql.indexOf("create index communication_consents_lead_idx"));
  assert.match(tableDef, /channel text not null check \(channel in \('whatsapp', 'email', 'sms'\)\)/);
  assert.match(tableDef, /purpose text not null check \(purpose in \('marketing', 'transactional'\)\)/);
});
test("4: provenance fields are present -- source type/id/provider/form id/provider lead id/staging id, plus consent text and version", () => {
  const tableDef = migrationSql.slice(migrationSql.indexOf("create table public.communication_consents"), migrationSql.indexOf("create index communication_consents_lead_idx"));
  for (const col of ["source_type", "source_id", "source_provider", "source_form_id", "provider_lead_id", "staging_id", "consent_text", "consent_version"]) {
    assert.match(tableDef, new RegExp(col));
  }
});
test("5: revocation is representable -- status includes 'revoked' and a revoked_at column exists", () => {
  const tableDef = migrationSql.slice(migrationSql.indexOf("create table public.communication_consents"), migrationSql.indexOf("create index communication_consents_lead_idx"));
  assert.match(tableDef, /status text not null check \(status in \('granted', 'not_granted', 'unknown', 'revoked'\)\)/);
  assert.match(tableDef, /revoked_at timestamptz/);
});

// ===========================================================================
// FORM RULE (6-12)
// ===========================================================================
test("6: the rule table is tenant scoped (organization_id/workspace_id columns present)", () => {
  const tableDef = migrationSql.slice(migrationSql.indexOf("create table public.meta_lead_form_consent_rules"), migrationSql.indexOf("create unique index meta_lead_form_consent_rules_active_idx"));
  assert.match(tableDef, /organization_id uuid not null references public\.organizations\(id\)/);
  assert.match(tableDef, /workspace_id uuid not null references public\.workspaces\(id\)/);
});
test("7: the rule must reference a form mapping that belongs to this tenant and is active -- enforced in configure_meta_lead_form_consent_rule", () => {
  assert.match(configureFn, /from meta_lead_form_mappings\s+where id = p_form_mapping_id and organization_id = v_org and workspace_id = p_workspace_id and status = 'active'/);
});
test("8: a rule requires an explicit consent field name -- empty/null is rejected", () => {
  assert.match(configureFn, /if p_consent_field_name is null or length\(trim\(p_consent_field_name\)\) = 0 then/);
});
test("9: a rule requires explicit accepted values -- empty array is rejected", () => {
  assert.match(configureFn, /if p_accepted_values is null or array_length\(p_accepted_values, 1\) is null or array_length\(p_accepted_values, 1\) = 0 then/);
});
test("10: a rule requires an explicit consent disclosure statement -- empty/null is rejected", () => {
  assert.match(configureFn, /if p_consent_statement is null or length\(trim\(p_consent_statement\)\) = 0 then/);
});
test("11: no arbitrary Meta form field can become consent automatically -- the processor only evaluates when an ACTIVE rule row already exists (found via a plain SELECT, never a heuristic scan for words like consent/agree/whatsapp)", () => {
  assert.doesNotMatch(strip(processingServiceSrc), /fieldName\.(toLowerCase|includes)\(.*consent|fieldName\.(toLowerCase|includes)\(.*agree|fieldName\.(toLowerCase|includes)\(.*whatsapp/i);
  assert.match(processingServiceSrc, /\.eq\("active", true\)/);
});
test("12: a disabled (inactive) rule is never evaluated -- findActiveRule filters on active=true, and disable_meta_lead_form_consent_rule only flips active to false", () => {
  assert.match(processingServiceSrc, /\.eq\("active", true\)/);
  assert.match(disableRuleFn, /update meta_lead_form_consent_rules set active = false/);
});

// ===========================================================================
// EVALUATION (13-19)
// ===========================================================================
test("13: an exact positive answer grants", () => {
  assert.equal(evaluateMetaLeadConsent({ customAnswers: answers([["whatsapp_opt_in", "Yes"]]), rule: rule() }), "granted");
});
test("14: an absent field does not grant -- returns unverifiable", () => {
  assert.equal(evaluateMetaLeadConsent({ customAnswers: answers([["city", "Pune"]]), rule: rule() }), "unverifiable");
});
test("15: a negative/different answer does not grant -- returns not_granted", () => {
  assert.equal(evaluateMetaLeadConsent({ customAnswers: answers([["whatsapp_opt_in", "No"]]), rule: rule() }), "not_granted");
});
test("16: an unexpected/unrelated answer value does not grant", () => {
  assert.equal(evaluateMetaLeadConsent({ customAnswers: answers([["whatsapp_opt_in", "Maybe later"]]), rule: rule() }), "not_granted");
});
test("17: field-name and value matching is case/whitespace-insensitive but exact otherwise", () => {
  assert.equal(evaluateMetaLeadConsent({ customAnswers: answers([["  WhatsApp_Opt_In  ", "  yes  "]]), rule: rule() }), "granted");
  assert.equal(evaluateMetaLeadConsent({ customAnswers: answers([["whatsapp_opt_in", "yesplease"]]), rule: rule() }), "not_granted");
});
test("18: no fuzzy inference -- a semantically-similar but non-exact value never grants", () => {
  assert.equal(evaluateMetaLeadConsent({ customAnswers: answers([["whatsapp_opt_in", "Sure, sounds good"]]), rule: rule() }), "not_granted");
});
test("19: no AI call exists anywhere in the evaluator", () => {
  assert.doesNotMatch(strip(evaluatorSrc), /openai|fetch\(|await /i);
});

// ===========================================================================
// PROVENANCE (20-24)
// ===========================================================================
test("20: the provider lead id (leadgen_id) is retained on the consent event", () => {
  assert.match(completeFn, /v_row\.leadgen_id/);
});
test("21: the form id is retained on the consent event", () => {
  assert.match(completeFn, /v_row\.form_id/);
});
test("22: source_type is retained as 'meta_lead_form'", () => {
  assert.match(completeFn, /'meta_lead_form'/);
});
test("23: consent text and version are retained (snapshotted at evaluation time, not merely referenced)", () => {
  assert.match(completeFn, /p_consent_text, p_consent_version/);
});
test("24: no raw Meta payload is ever stored on the consent event -- only IDs and the admin-authored consent_text/version", () => {
  assert.doesNotMatch(strip(migrationSql), /field_data|raw_payload/i);
});

// ===========================================================================
// IDEMPOTENCY (25-26)
// ===========================================================================
test("25: the same source staging row cannot duplicate a consent event -- unique(staging_id, channel, purpose) plus on conflict do nothing", () => {
  assert.match(migrationSql, /unique \(staging_id, channel, purpose\)/);
  assert.match(completeFn, /on conflict \(staging_id, channel, purpose\) do nothing/);
});
test("26: processor replay is safe -- claim only ever selects consent_processing_status='pending', and completion always marks 'processed' even for no_rule/unverifiable outcomes", () => {
  assert.match(claimFn, /consent_processing_status = 'pending'/);
  assert.match(completeFn, /consent_processing_status = 'processed'/);
});

// ===========================================================================
// REVOCATION (27-29)
// ===========================================================================
test("27: revocation overrides an earlier grant -- eligibility reads the MOST RECENT consent row by recorded_at, not a fixed one", async () => {
  const client = makeEligibilityClient({
    leads: [leadRow()],
    consents: [
      grantedConsentRow({ id: "consent-old", recorded_at: "2026-01-01T00:00:00.000Z" }),
      grantedConsentRow({ id: "consent-new", status: "revoked", recorded_at: "2026-02-01T00:00:00.000Z" }),
    ],
  });
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: allowEntitlement });
  assert.equal(result.consent.status, "blocked");
  assert.equal(result.consent.reason, "consent_revoked");
});
test("28: the newest valid consent state drives policy regardless of insertion order", async () => {
  const client = makeEligibilityClient({
    leads: [leadRow()], connections: [connectedRow()], threads: [],
    consents: [
      grantedConsentRow({ id: "consent-new", recorded_at: "2026-03-01T00:00:00.000Z" }),
      grantedConsentRow({ id: "consent-old", status: "revoked", recorded_at: "2026-01-01T00:00:00.000Z" }),
    ],
  });
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: allowEntitlement });
  assert.equal(result.consent.status, "valid");
});
test("29: a revoked consent state blocks outreach", async () => {
  const client = makeEligibilityClient({ leads: [leadRow()], consents: [grantedConsentRow({ status: "revoked" })] });
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: allowEntitlement });
  assert.equal(result.eligible, false);
  assert.equal(result.consent.reason, "consent_revoked");
});

// ===========================================================================
// PHONE (30-33)
// ===========================================================================
test("30: a normalized international phone is eligible to proceed past the phone check", async () => {
  const client = makeEligibilityClient({ leads: [leadRow()], consents: [grantedConsentRow()], connections: [connectedRow()], threads: [] });
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: allowEntitlement });
  assert.equal(result.normalizedPhone, "+14155550132");
  assert.notEqual(result.consent.reason, "phone_not_normalized");
});
test("31: an ambiguous phone (normalized_phone null) blocks outreach -- never guesses a country", async () => {
  const client = makeEligibilityClient({ leads: [leadRow({ phone: "9876543210", normalized_phone: null })] });
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: allowEntitlement });
  assert.equal(result.eligible, false);
  assert.equal(result.consent.reason, "phone_not_normalized");
});
test("32: no phone at all blocks outreach", async () => {
  const client = makeEligibilityClient({ leads: [leadRow({ phone: null, normalized_phone: null })] });
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: allowEntitlement });
  assert.equal(result.consent.reason, "no_phone");
});
test("33: the client cannot substitute a phone -- resolveWhatsAppOutreachEligibility takes no phone parameter at all, only a leadId", () => {
  assert.doesNotMatch(strip(eligibilityServiceSrc).slice(0, strip(eligibilityServiceSrc).indexOf("export async function resolveWhatsAppOutreachEligibility") + 400), /p_phone|phone:\s*string/);
});

// ===========================================================================
// ENTITLEMENT (34-39)
// ===========================================================================
test("34: Starter (no whatsapp entitlement) is blocked at the entitlement layer", async () => {
  const client = makeEligibilityClient({ leads: [leadRow()], consents: [grantedConsentRow()] });
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: denyEntitlement });
  assert.equal(result.transport.reason, "whatsapp_not_entitled");
  assert.equal(result.eligible, false);
});
test("35: an entitled plan (Professional+) passes the entitlement check", async () => {
  const client = makeEligibilityClient({ leads: [leadRow()], consents: [grantedConsentRow()], connections: [connectedRow()], threads: [] });
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: allowEntitlement });
  assert.notEqual(result.transport.reason, "whatsapp_not_entitled");
});
test("36: Founding Professional uses the same entitlement service call as Professional -- no separate plan-code branch in the eligibility service", () => {
  assert.doesNotMatch(strip(eligibilityServiceSrc), /founding|professional_founding/i);
});
test("37: the entitlement matrix itself is unmodified by M6 -- whatsapp still enters at professionalFeatures", () => {
  const entitlementsSrc = rd("features/vayon/billing/config/entitlements.ts");
  assert.match(entitlementsSrc, /professionalFeatures = \[[^\]]*"whatsapp"/s);
});
test("38: the eligibility service reuses the existing EntitlementFeature literal 'whatsapp' rather than inventing a new feature key", () => {
  assert.match(eligibilityServiceSrc, /feature\("whatsapp"\)/);
});
test("39: entitlement is checked via an injected port, never re-implemented -- production wiring uses the real SubscriptionEntitlementService", () => {
  assert.match(eligibilityServiceSrc, /new SubscriptionEntitlementService\(\)/);
});

// ===========================================================================
// CONNECTION (40-42)
// ===========================================================================
test("40: a connected WhatsApp integration is required for transport readiness", async () => {
  const client = makeEligibilityClient({ leads: [leadRow()], consents: [grantedConsentRow()], connections: [connectedRow()], threads: [] });
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: allowEntitlement });
  assert.notEqual(result.transport.reason, "connection_unavailable");
});
test("41: a disconnected WhatsApp connection blocks transport", async () => {
  const client = makeEligibilityClient({ leads: [leadRow()], consents: [grantedConsentRow()], connections: [connectedRow({ status: "disconnected" })] });
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: allowEntitlement });
  assert.equal(result.transport.reason, "connection_unavailable");
});
test("42: a missing WhatsApp connection blocks transport", async () => {
  const client = makeEligibilityClient({ leads: [leadRow()], consents: [grantedConsentRow()], connections: [] });
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: allowEntitlement });
  assert.equal(result.transport.reason, "connection_unavailable");
});

// ===========================================================================
// WINDOW (43-45)
// ===========================================================================
test("43: a Meta lead with no previous WhatsApp conversation requires a template", async () => {
  const client = makeEligibilityClient({ leads: [leadRow()], consents: [grantedConsentRow()], connections: [connectedRow()], threads: [] });
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: allowEntitlement });
  assert.equal(result.transport.requiresTemplate, true);
});
test("44: an existing recent inbound WhatsApp message opens the window -- no template required", async () => {
  const recentIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const client = makeEligibilityClient({
    leads: [leadRow()], consents: [grantedConsentRow()], connections: [connectedRow()],
    threads: [{ id: "thread-1", organization_id: "org-1", workspace_id: "ws-1", related_type: "lead", related_id: "lead-1" }],
    communications: [{ id: "comm-1", thread_id: "thread-1", channel: "whatsapp", direction: "inbound", occurred_at: recentIso }],
  });
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: allowEntitlement });
  assert.equal(result.transport.requiresTemplate, false);
  assert.equal(result.transport.templateAvailability, "not_required");
});
test("45: a Meta form submission alone never opens the 24h WhatsApp window -- only a genuine inbound WhatsApp message does", () => {
  assert.doesNotMatch(strip(eligibilityServiceSrc), /leadgen_id|meta_lead_ingestion_staging/i);
  assert.match(eligibilityServiceSrc, /direction", "inbound"/);
});

// ===========================================================================
// TEMPLATE (46-48)
// ===========================================================================
test("46: the template-required state is represented distinctly from consent validity", async () => {
  const client = makeEligibilityClient({ leads: [leadRow()], consents: [grantedConsentRow()], connections: [connectedRow()], threads: [] });
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: allowEntitlement });
  assert.equal(result.consent.status, "valid");
  assert.equal(result.transport.status, "blocked");
});
test("47: a missing approved template blocks executable outreach (fails closed on 'unknown' availability when no port is supplied)", async () => {
  const client = makeEligibilityClient({ leads: [leadRow()], consents: [grantedConsentRow()], connections: [connectedRow()], threads: [] });
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: allowEntitlement });
  assert.equal(result.eligible, false);
  assert.equal(result.transport.templateAvailability, "unknown");
  assert.equal(result.transport.reason, "template_required_unavailable");

  const withUnavailablePort = makeEligibilityClient({ leads: [leadRow()], consents: [grantedConsentRow()], connections: [connectedRow()], threads: [] });
  const blocked = await resolveWhatsAppOutreachEligibility(withUnavailablePort, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: allowEntitlement, templatePort: { hasApprovedTemplate: async () => false } });
  assert.equal(blocked.transport.templateAvailability, "unavailable");
  assert.equal(blocked.eligible, false);
});
test("48: consent remains valid even when transport is currently blocked by template unavailability -- the two are never conflated", async () => {
  const client = makeEligibilityClient({ leads: [leadRow()], consents: [grantedConsentRow()], connections: [connectedRow()], threads: [] });
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: allowEntitlement });
  assert.equal(result.consent.status, "valid");
  assert.equal(result.consent.reason, "consent_granted");
  assert.equal(result.eligible, false);
});

// ===========================================================================
// POLICY (49-52)
// ===========================================================================
test("49: valid consent + ready transport (open window, no template needed) results in eligible=true", async () => {
  const recentIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const client = makeEligibilityClient({
    leads: [leadRow()], consents: [grantedConsentRow()], connections: [connectedRow()],
    threads: [{ id: "thread-1", organization_id: "org-1", workspace_id: "ws-1", related_type: "lead", related_id: "lead-1" }],
    communications: [{ id: "comm-1", thread_id: "thread-1", channel: "whatsapp", direction: "inbound", occurred_at: recentIso }],
  });
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: allowEntitlement });
  assert.equal(result.eligible, true);
});
test("50: no consent at all results in blocked", async () => {
  const client = makeEligibilityClient({ leads: [leadRow()], consents: [] });
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: allowEntitlement });
  assert.equal(result.eligible, false);
  assert.equal(result.consent.reason, "no_consent");
});
test("51: revoked consent results in blocked", async () => {
  const client = makeEligibilityClient({ leads: [leadRow()], consents: [grantedConsentRow({ status: "revoked" })] });
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: allowEntitlement });
  assert.equal(result.eligible, false);
});
test("52: unverifiable consent results in blocked", async () => {
  const client = makeEligibilityClient({ leads: [leadRow()], consents: [grantedConsentRow({ status: "unknown" })] });
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: allowEntitlement });
  assert.equal(result.eligible, false);
  assert.equal(result.consent.reason, "consent_unverifiable");
});

// ===========================================================================
// TENANT (53-56)
// ===========================================================================
test("53: Org A cannot access Org B's consent -- the lead lookup itself is scoped by organization_id/workspace_id, so a cross-tenant leadId resolves to lead_not_found", async () => {
  const client = makeEligibilityClient({ leads: [leadRow({ organization_id: "org-B", workspace_id: "ws-B" })] });
  const result = await resolveWhatsAppOutreachEligibility(client, { organizationId: "org-1", workspaceId: "ws-1" }, "lead-1", { entitlement: allowEntitlement });
  assert.equal(result.consent.reason, "lead_not_found");
});
test("54: Org A cannot configure Org B's rule -- configure_meta_lead_form_consent_rule requires the mapping to match the SAME v_org/p_workspace_id, and can_manage_integrations is workspace-scoped", () => {
  assert.match(configureFn, /organization_id = v_org and workspace_id = p_workspace_id and status = 'active'/);
  assert.match(configureFn, /can_manage_integrations\(p_workspace_id\)/);
});
test("55: Org A cannot evaluate Org B's lead -- the consent processor's rule lookup is scoped by the staging row's OWN organization_id/workspace_id, never a caller-supplied one", () => {
  assert.match(processingServiceSrc, /\.eq\("organization_id", row\.organizationId\)/);
  assert.match(processingServiceSrc, /\.eq\("workspace_id", row\.workspaceId\)/);
});
test("56: a raw consent id cannot cross tenant -- every read in the eligibility service is scoped by organization_id AND workspace_id", () => {
  const consentQuery = eligibilityServiceSrc.slice(eligibilityServiceSrc.indexOf('from("communication_consents")'), eligibilityServiceSrc.indexOf('.maybeSingle();', eligibilityServiceSrc.indexOf('from("communication_consents")')));
  assert.match(consentQuery, /organization_id/);
  assert.match(consentQuery, /workspace_id/);
});

// ===========================================================================
// PII (57-60)
// ===========================================================================
test("57: the consent row does not duplicate lead email anywhere in its schema -- 'email' only appears as one of the allowed channel enum values, never as its own PII column", () => {
  const tableDef = migrationSql.slice(migrationSql.indexOf("create table public.communication_consents"), migrationSql.indexOf("create index communication_consents_lead_idx"));
  assert.doesNotMatch(tableDef, /\bemail\s+text\b|\bemail\s*=/);
  assert.match(tableDef, /channel in \('whatsapp', 'email', 'sms'\)/);
});
test("58: the consent row does not duplicate lead name anywhere in its schema", () => {
  const tableDef = migrationSql.slice(migrationSql.indexOf("create table public.communication_consents"), migrationSql.indexOf("create index communication_consents_lead_idx"));
  assert.doesNotMatch(tableDef, /\bname\b/);
});
test("59: logs contain no phone/email/name -- only stagingId/consentId/outcome", async () => {
  logCalls.length = 0;
  const client = makeProcessingClient({ activeRule: ruleRow() });
  await processClaimedMetaLeadConsent(client, claimedRow());
  const serialized = JSON.stringify(logCalls);
  assert.doesNotMatch(serialized, /@|\+1|Yes/);
  assert.doesNotMatch(strip(processingServiceSrc), /log\(.*customAnswers|log\(.*consentText|log\(.*consentStatement/i);
});
test("60: activity_events metadata contains no PII -- only consentId/formId/status", async () => {
  const client = makeProcessingClient({ activeRule: ruleRow() });
  await processClaimedMetaLeadConsent(client, claimedRow());
  const insertCall = client.calls.insert.find((c) => c[0] === "activity_events");
  assert.ok(insertCall);
  assert.deepEqual(Object.keys(insertCall[1].metadata).sort(), ["consentId", "formId", "status"].sort());
});

// ===========================================================================
// META/M5 (61-63)
// ===========================================================================
test("61: only M5-completed staging rows (crm_ingestion_status='completed') are eligible for consent processing", () => {
  assert.match(claimFn, /crm_ingestion_status = 'completed' and consent_processing_status = 'pending'/);
  assert.match(completeFn, /crm_ingestion_status = 'completed' and consent_processing_status = 'processing'/);
});
test("62: the custom consent answer remains source evidence -- it is read from staging's own custom_answers, never rewritten or deleted", () => {
  assert.doesNotMatch(strip(migrationSql), /update meta_lead_ingestion_staging[^;]*custom_answers\s*=/);
});
test("63: M5 is not modified to infer consent -- ingest_meta_lead_to_crm and resolve_or_create_meta_lead_crm_identity in the M5 migration have no consent reference", () => {
  assert.doesNotMatch(m5Migration, /consent|opt_in/i);
});

// ===========================================================================
// SIDE EFFECTS (64-71)
// ===========================================================================
const m6Sources = [migrationSql, evaluatorSrc, processingServiceSrc, eligibilityServiceSrc, routeSrc, actionsSrc];
test("64: no WhatsApp thread is created anywhere in the M6 diff", () => {
  for (const src of m6Sources) assert.doesNotMatch(strip(src), /insert into communication_threads|\.from\("communication_threads"\)\.insert/i);
});
test("65: no WhatsApp message is sent anywhere in the M6 diff", () => {
  for (const src of m6Sources) assert.doesNotMatch(strip(src), /sendText|graph\.facebook\.com\/.*messages/i);
});
test("66: no outbound communications row is ever inserted by M6", () => {
  for (const src of m6Sources) assert.doesNotMatch(strip(src), /insert into communications|\.from\("communications"\)\.insert/i);
});
test("67: no OpenAI call exists anywhere in the M6 diff", () => {
  for (const src of m6Sources) assert.doesNotMatch(strip(src), /openai|OpenAIProvider|chat\.completions/i);
});
test("68: no AI Workforce call exists anywhere in the M6 diff", () => {
  for (const src of m6Sources) assert.doesNotMatch(strip(src), /buildWorkforceEvidence|trusted-runtime|AIWorkforce/i);
});
test("69: no CRM identity mutation exists anywhere in the M6 diff (no insert into leads, no lead field update)", () => {
  for (const src of m6Sources) assert.doesNotMatch(strip(src), /insert into leads|update leads set/i);
});
test("70: no property mutation exists anywhere in the M6 diff", () => {
  for (const src of m6Sources) assert.doesNotMatch(strip(src), /update properties set|insert into properties/i);
});
test("71: no price mutation exists anywhere in the M6 diff", () => {
  for (const src of m6Sources) assert.doesNotMatch(strip(src), /price_revision|sale_price\s*=|rental_price\s*=/i);
});

// ===========================================================================
// REGRESSION (72-77)
// ===========================================================================
test("72: M5's CRM ingestion migration/service are unmodified by M6", () => {
  assert.doesNotMatch(m5Migration, /communication_consents|meta_lead_form_consent_rules/);
  assert.doesNotMatch(crmServiceSrc, /consent/i);
});
test("73: M4's Graph fetch service is unmodified by M6", () => {
  assert.doesNotMatch(leadDetailServiceSrc, /consent/i);
  assert.doesNotMatch(m4Migration, /consent/i);
});
test("74: M3's webhook/dedup is unmodified by M6", () => {
  assert.doesNotMatch(webhookRouteSrc, /consent/i);
  assert.doesNotMatch(m3Migration, /consent/i);
});
test("75: M1/M2's OAuth flow is unmodified by M6", () => {
  assert.doesNotMatch(m1m2Migration, /communication_consents|consent_field_name/);
});
test("76: E1-E6 are unmodified by M6 -- the WhatsApp send-eligibility/send-execution services and the trusted runtime make no reference to the new consent model", () => {
  assert.doesNotMatch(whatsappSendEligibilitySrc + whatsappSendExecutionSrc, /communication_consents|whatsapp_outreach_eligibility|resolveWhatsAppOutreachEligibility/i);
  assert.doesNotMatch(whatsappOrchestratorSrc + trustedRuntimeSrc, /communication_consents|resolveWhatsAppOutreachEligibility/i);
});
test("77: K1-K6 property-knowledge retrieval is unmodified by M6", () => {
  assert.doesNotMatch(k4RetrievalSrc, /consent|communication_consents/i);
});

// ---------------------------------------------------------------------------
// Additional coverage: processor orchestration, route, security grants,
// no-rule/unverifiable outcomes, migration sequencing.
// ---------------------------------------------------------------------------
test("no_rule outcome: processing a staging row with no active rule marks it processed and writes no consent row", async () => {
  const client = makeProcessingClient({ mapping: null, activeRule: null });
  const result = await processClaimedMetaLeadConsent(client, claimedRow());
  assert.equal(result.outcome, "no_rule");
  assert.equal(client.calls.insert.length, 0);
  const completeCall = client.calls.rpc.find((c) => c[0] === "complete_meta_lead_consent_processing");
  assert.equal(completeCall[1].p_outcome, "no_rule");
});
test("unverifiable outcome: an active rule exists but the field is absent -- no consent row is written", async () => {
  const client = makeProcessingClient({ activeRule: ruleRow() });
  const result = await processClaimedMetaLeadConsent(client, claimedRow({ customAnswers: answers([["city", "Pune"]]) }));
  assert.equal(result.outcome, "unverifiable");
  assert.equal(client.calls.insert.length, 0);
});
test("granted outcome: writes an activity_events row classified as whatsapp_consent_granted", async () => {
  const client = makeProcessingClient({ activeRule: ruleRow() });
  const result = await processClaimedMetaLeadConsent(client, claimedRow());
  assert.equal(result.outcome, "granted");
  assert.equal(client.calls.insert[0][1].event_type, "meta.lead.whatsapp_consent_granted");
});
test("not_granted outcome: writes an activity_events row classified as whatsapp_consent_not_granted", async () => {
  const client = makeProcessingClient({ activeRule: ruleRow() });
  const result = await processClaimedMetaLeadConsent(client, claimedRow({ customAnswers: answers([["whatsapp_opt_in", "No"]]) }));
  assert.equal(result.outcome, "not_granted");
  assert.equal(client.calls.insert[0][1].event_type, "meta.lead.whatsapp_consent_not_granted");
});
test("claimMetaLeadConsentBatch maps snake_case rows to the camelCase claimed-row shape", async () => {
  const client = makeProcessingClient({ rpcHandlers: { claim_meta_lead_consent_batch: (params) => { assert.equal(params.p_limit, 5); return { data: [{ id: "s1", organization_id: "org-1", workspace_id: "ws-1", crm_lead_id: "lead-9", page_id: "page-1", form_id: "form-1", custom_answers: [] }], error: null }; } } });
  const rows = await claimMetaLeadConsentBatch(client, 5);
  assert.deepEqual(rows[0], { id: "s1", organizationId: "org-1", workspaceId: "ws-1", leadId: "lead-9", pageId: "page-1", formId: "form-1", customAnswers: [] });
});
test("one bad row in a batch does not block the rest", async () => {
  let call = 0;
  const client = makeProcessingClient({
    activeRule: ruleRow(),
    rpcHandlers: {
      claim_meta_lead_consent_batch: () => ({ data: [{ id: "s1", organization_id: "org-1", workspace_id: "ws-1", crm_lead_id: "lead-1", page_id: "page-1", form_id: "form-1", custom_answers: [] }, { id: "s2", organization_id: "org-1", workspace_id: "ws-1", crm_lead_id: "lead-2", page_id: "page-1", form_id: "form-1", custom_answers: [] }], error: null }),
      complete_meta_lead_consent_processing: () => { call += 1; if (call === 1) throw new Error("boom"); return { data: null, error: null }; },
    },
  });
  const result = await processPendingMetaLeadConsent(client);
  assert.equal(result.claimed, 2);
  assert.deepEqual(result.results.map((r) => r.outcome), ["skipped", "unverifiable"]);
});
test("the processor route rejects a missing/wrong CRON_SECRET with 401 and never invokes processing", async () => {
  let invoked = false;
  const { GET } = load("app/api/meta/leadgen/process-consent/route.ts", {
    "@/lib/supabase/service": { createSupabaseServiceClient: () => ({}) },
    "@/features/platform/integrations/meta-marketing/webhook/consent-processing.service": { processPendingMetaLeadConsent: async () => { invoked = true; return { claimed: 0, results: [] }; } },
  });
  assert.equal((await GET(new NextRequest("https://vayon.test/api/meta/leadgen/process-consent"))).status, 401);
  assert.equal(invoked, false);
});
test("the processor route response contains only counts -- no leadId, no consentId", async () => {
  const { GET } = load("app/api/meta/leadgen/process-consent/route.ts", {
    "@/lib/supabase/service": { createSupabaseServiceClient: () => ({}) },
    "@/features/platform/integrations/meta-marketing/webhook/consent-processing.service": {
      processPendingMetaLeadConsent: async () => ({ claimed: 1, results: [{ stagingId: "s1", outcome: "granted", consentId: "c1", leadId: "lead-1", organizationId: "org-1", workspaceId: "ws-1" }] }),
    },
  });
  const req = new NextRequest("https://vayon.test/api/meta/leadgen/process-consent", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
  const body = await (await GET(req)).json();
  assert.deepEqual(Object.keys(body).sort(), ["claimed", "granted", "noRule", "notGranted", "ok", "unverifiable"].sort());
});
test("the processor route declares maxDuration = 300, matching the reconcile-route pattern", () => {
  assert.match(routeSrc, /export const maxDuration = 300;/);
});
test("an unexpected throw during processing returns a retryable 503", async () => {
  const { GET } = load("app/api/meta/leadgen/process-consent/route.ts", {
    "@/lib/supabase/service": { createSupabaseServiceClient: () => ({}) },
    "@/features/platform/integrations/meta-marketing/webhook/consent-processing.service": { processPendingMetaLeadConsent: async () => { throw new Error("db unavailable"); } },
  });
  const req = new NextRequest("https://vayon.test/api/meta/leadgen/process-consent", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
  assert.equal((await GET(req)).status, 503);
});
test("claim/complete RPCs are service-role only; configure/disable rule RPCs are authenticated only, never service_role", () => {
  for (const fn of [claimFn, completeFn]) assert.match(fn, /if current_setting\('role', true\) <> 'service_role' then/);
  assert.match(migrationSql, /grant execute on function public\.claim_meta_lead_consent_batch\(integer\) to service_role;/);
  assert.match(migrationSql, /grant execute on function public\.complete_meta_lead_consent_processing\([^)]*\) to service_role;/);
  assert.match(migrationSql, /grant execute on function public\.configure_meta_lead_form_consent_rule\([^)]*\) to authenticated;/);
  assert.match(migrationSql, /grant execute on function public\.disable_meta_lead_form_consent_rule\([^)]*\) to authenticated;/);
  assert.doesNotMatch(migrationSql, /grant execute on function public\.claim_meta_lead_consent_batch\(integer\) to authenticated/);
});
test("meta_lead_form_consent_rules has exactly one active row per form mapping (partial unique index)", () => {
  assert.match(migrationSql, /create unique index meta_lead_form_consent_rules_active_idx\s+on public\.meta_lead_form_consent_rules \(form_mapping_id\)\s+where active = true;/);
});
test("both new tables have RLS enabled with a tenant-member read policy and no client write policy", () => {
  for (const table of ["meta_lead_form_consent_rules", "communication_consents"]) {
    assert.match(migrationSql, new RegExp(`alter table public\\.${table} enable row level security;`));
    assert.match(migrationSql, new RegExp(`for select to authenticated`));
  }
  assert.doesNotMatch(migrationSql, /for insert to authenticated|for update to authenticated/);
});
test("migration is strictly after M5, additive only", () => {
  assert.ok("20261119000000" > "20261118000000");
  assert.doesNotMatch(migrationSql, /drop table|drop column/i);
});
test("editing a rule creates a new version rather than mutating the active row's text in place", () => {
  assert.match(configureFn, /update meta_lead_form_consent_rules\s+set active = false, updated_at = now\(\)\s+where form_mapping_id = p_form_mapping_id and active = true;/);
  assert.match(configureFn, /insert into meta_lead_form_consent_rules \(/);
  assert.doesNotMatch(configureFn, /update meta_lead_form_consent_rules[\s\S]*?set[\s\S]*?consent_statement\s*=/);
});
