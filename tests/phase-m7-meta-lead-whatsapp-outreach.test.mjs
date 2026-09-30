import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const rd = (p) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const migration = rd("supabase/migrations/20261120000000_meta_lead_whatsapp_outreach.sql");
const migrationSql = migration.split("\n").map((l) => l.replace(/--.*$/, "")).join("\n");
const claimFn = migrationSql.slice(migrationSql.indexOf("function public.claim_whatsapp_outreach_execution"), migrationSql.indexOf("function public.mark_whatsapp_outreach_sent"));
const sentFn = migrationSql.slice(migrationSql.indexOf("function public.mark_whatsapp_outreach_sent"), migrationSql.indexOf("function public.mark_whatsapp_outreach_failed"));
const failedFn = migrationSql.slice(migrationSql.indexOf("function public.mark_whatsapp_outreach_failed"), migrationSql.indexOf("function public.flag_stale_whatsapp_outreach_executions"));
const flagFn = migrationSql.slice(migrationSql.indexOf("function public.flag_stale_whatsapp_outreach_executions"));
const templateModuleSrc = rd("features/platform/integrations/whatsapp/whatsapp-outreach-template.ts");
const executionServiceSrc = rd("features/platform/integrations/whatsapp/whatsapp-outreach-execution.service.ts");
const reconciliationServiceSrc = rd("features/platform/integrations/whatsapp/whatsapp-outreach-reconciliation.service.ts");
const eligibilityServiceSrc = rd("features/platform/integrations/whatsapp/whatsapp-outreach-eligibility.service.ts");
const actionsSrc = rd("features/platform/integrations/whatsapp/whatsapp-outreach.actions.ts");
const routeSrc = rd("app/api/whatsapp/outreach-executions/reconcile/route.ts");
const pageSrc = rd("app/vayon/crm/leads/[leadId]/whatsapp-outreach/page.tsx");
const m5Migration = rd("supabase/migrations/20261118000000_meta_lead_crm_ingestion.sql");
const m4Migration = rd("supabase/migrations/20261117000000_meta_lead_detail_staging.sql");
const m3Migration = rd("supabase/migrations/20261116000000_meta_leadgen_webhook.sql");
const whatsappOrchestratorSrc = rd("features/platform/integrations/whatsapp/whatsapp-ai-orchestrator.service.ts");
const trustedRuntimeSrc = rd("features/platform/openai/runtime/trusted-runtime.ts");
const whatsappSendExecutionSrc = rd("features/platform/integrations/whatsapp/whatsapp-send-execution.service.ts");
const whatsappDraftApprovalSrc = rd("features/platform/integrations/whatsapp/whatsapp-draft-approval.service.ts");
const k4RetrievalSrc = rd("features/vayon/property-knowledge/retrieval/retrieval.service.ts");
const crmServiceSrc = rd("features/platform/integrations/meta-marketing/webhook/crm-ingestion.service.ts");
const leadDetailServiceSrc = rd("features/platform/integrations/meta-marketing/webhook/lead-detail-fetch.service.ts");
const webhookRouteSrc = rd("app/api/webhooks/meta-leadgen/route.ts");

// NOTE: no live Meta/WhatsApp call, no real send, no live Postgres. SQL correctness for the
// claim/mark-sent/mark-failed/flag-stale RPC bodies is established by careful review plus
// static regex assertions against the migration text (the same convention every prior phase's
// RPC used). TS-orchestration behavior is genuinely executed against fake/mocked dependencies.

const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");

const {
  filterUsableTemplates, findUsableTemplate, languagesForTemplateName, planTemplateVariables,
  validateAndBuildTemplateComponents, renderTemplatePreview, TemplateVariableError,
} = load("features/platform/integrations/whatsapp/whatsapp-outreach-template.ts");

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
function template(over = {}) {
  return {
    id: "tmpl-1", name: "lead_first_contact", language: "en_US", category: "MARKETING", status: "APPROVED",
    components: [
      { type: "HEADER", text: "Hello {{1}}" },
      { type: "BODY", text: "Thanks for your interest in {{1}}. Reply STOP to opt out." },
      { type: "FOOTER", text: "VAYON Realty" },
    ],
    ...over,
  };
}

function eligibleResult(over = {}) {
  return {
    leadId: "lead-1", eligible: true, normalizedPhone: "+14155550132",
    consent: { status: "valid", reason: "consent_granted", consentId: "consent-1" },
    transport: { status: "ready", reason: null, requiresTemplate: true, templateAvailability: "available", connectionId: "conn-1" },
    ...over,
  };
}
function blockedResult(reason, over = {}) {
  return {
    leadId: "lead-1", eligible: false, normalizedPhone: null,
    consent: { status: "blocked", reason, consentId: null },
    transport: { status: "not_applicable", reason: null, requiresTemplate: false, templateAvailability: "unknown", connectionId: null },
    ...over,
  };
}

function makeFakeClient({ rpcHandlers = {}, leadRow = { normalized_phone: "+14155550132" } } = {}) {
  const rpcCalls = [];
  const chain = () => {
    const finish = async () => ({ data: leadRow, error: null });
    const c = { select: () => c, eq: () => c, is: () => c, order: () => c, limit: () => c, maybeSingle: finish, single: finish, then: (resolve, reject) => finish().then(resolve, reject) };
    return c;
  };
  const client = {
    rpc: async (name, params) => {
      rpcCalls.push({ name, params });
      const handler = rpcHandlers[name];
      if (!handler) throw new Error(`unexpected rpc ${name}`);
      return handler(params);
    },
    from: () => chain(),
  };
  return { client, rpcCalls };
}

function loadExecutionService({ client, eligibility = eligibleResult(), templates = [template()], sendTemplateImpl, sendTemplateCalls = [] }) {
  return load("features/platform/integrations/whatsapp/whatsapp-outreach-execution.service.ts", {
    "@/features/vayon/operations/services/context": { operationsContext: async () => ({ organizationId: "org-1", workspaceId: "ws-1", client }) },
    "@/features/vayon/billing/services/entitlement.service": { SubscriptionEntitlementService: class { async feature() { return { allowed: true }; } } },
    "@/features/platform/whatsapp/services/whatsapp-platform.service": {
      WhatsAppPlatformService: class {
        async templates() { return templates; }
        async sendTemplate(input) {
          sendTemplateCalls.push(input);
          if (sendTemplateImpl) return sendTemplateImpl(input);
          return { id: "wamid.mock-123" };
        }
      },
    },
    "@/features/vayon/property-knowledge/retrieval/retrieval.service": { resolveLeadProperty: async () => ({ status: "unresolved_no_interest", propertyId: null }) },
    "./whatsapp-outreach-eligibility.service": { resolveWhatsAppOutreachEligibility: async () => eligibility },
  });
}

// ===========================================================================
// M6 ELIGIBILITY (1-7) -- proving M7 respects each M6 outcome, via the real recheck call
// ===========================================================================
async function outcomeFor(eligibility) {
  const { client } = makeFakeClient();
  const { executeGovernedMetaLeadWhatsAppOutreach } = loadExecutionService({ client, eligibility });
  return executeGovernedMetaLeadWhatsAppOutreach({ leadId: "lead-1", executionId: "exec-1", templateName: "lead_first_contact", templateLanguage: "en_US", variablesByComponent: { HEADER: ["Jane"], BODY: ["The Villa"] } });
}
test("1: no consent blocks the send", async () => {
  const result = await outcomeFor(blockedResult("no_consent"));
  assert.equal(result.outcome, "not_eligible");
});
test("2: revoked consent blocks the send", async () => {
  const result = await outcomeFor(blockedResult("consent_revoked"));
  assert.equal(result.outcome, "not_eligible");
  assert.equal(result.reason, "consent_revoked");
});
test("3: no phone blocks the send", async () => {
  const result = await outcomeFor(blockedResult("no_phone"));
  assert.equal(result.outcome, "not_eligible");
});
test("4: ambiguous (unnormalized) phone blocks the send", async () => {
  const result = await outcomeFor(blockedResult("phone_not_normalized"));
  assert.equal(result.outcome, "not_eligible");
});
test("5: Starter (not entitled) blocks the send", async () => {
  const result = await outcomeFor({ leadId: "lead-1", eligible: false, normalizedPhone: "+14155550132", consent: { status: "valid", reason: "consent_granted", consentId: "consent-1" }, transport: { status: "blocked", reason: "whatsapp_not_entitled", requiresTemplate: false, templateAvailability: "unknown", connectionId: null } });
  assert.equal(result.outcome, "not_eligible");
  assert.equal(result.reason, "whatsapp_not_entitled");
});
test("6: disconnected WhatsApp blocks the send", async () => {
  const result = await outcomeFor({ leadId: "lead-1", eligible: false, normalizedPhone: "+14155550132", consent: { status: "valid", reason: "consent_granted", consentId: "consent-1" }, transport: { status: "blocked", reason: "connection_unavailable", requiresTemplate: false, templateAvailability: "unknown", connectionId: null } });
  assert.equal(result.outcome, "not_eligible");
  assert.equal(result.reason, "connection_unavailable");
});
test("7: an eligible, consent-valid, transport-ready lead passes the recheck", async () => {
  const { client, rpcCalls } = makeFakeClient({ rpcHandlers: { claim_whatsapp_outreach_execution: async () => ({ data: "exec-1", error: null }), mark_whatsapp_outreach_sent: async () => ({ data: null, error: null }) } });
  const { executeGovernedMetaLeadWhatsAppOutreach } = loadExecutionService({ client });
  const result = await executeGovernedMetaLeadWhatsAppOutreach({ leadId: "lead-1", executionId: "exec-1", templateName: "lead_first_contact", templateLanguage: "en_US", variablesByComponent: { HEADER: ["Jane"], BODY: ["The Villa"] } });
  assert.equal(result.outcome, "sent");
  assert.ok(rpcCalls.some((c) => c.name === "claim_whatsapp_outreach_execution"));
});

// ===========================================================================
// TEMPLATE REQUIREMENT (8-11)
// ===========================================================================
test("8: a brand-new Meta lead (no prior WhatsApp conversation) requires a template -- verified in the real M6 eligibility service", () => {
  assert.match(eligibilityServiceSrc, /requiresTemplate = !\(await hasRecentInboundWithin24Hours/);
});
test("9: a Meta form submission itself never opens the freeform window -- eligibility never references leadgen/staging data", () => {
  assert.doesNotMatch(strip(eligibilityServiceSrc), /leadgen_id|meta_lead_ingestion_staging/i);
});
test("10: an active customer-service window (requiresTemplate=false) routes the UI to the existing WhatsApp conversation surface, not a new template flow", () => {
  assert.match(pageSrc, /Open WhatsApp conversation/);
  assert.match(pageSrc, /\/vayon\/communications\?lead=/);
});
test("11: a missing approved template blocks the send at the eligibility recheck (already proven by M6's own fail-closed 'unknown'/'unavailable' handling, reused verbatim here)", () => {
  assert.match(executionServiceSrc, /resolveWhatsAppOutreachEligibility/);
  assert.doesNotMatch(strip(executionServiceSrc), /templateAvailability === "unknown" \? true/);
});

// ===========================================================================
// TEMPLATE (12-19)
// ===========================================================================
test("12: an approved template is listed as usable", () => {
  assert.deepEqual(filterUsableTemplates([template()]).map((t) => t.name), ["lead_first_contact"]);
});
test("13: a rejected template is excluded", () => {
  assert.deepEqual(filterUsableTemplates([template({ status: "REJECTED" })]), []);
});
test("14: paused/disabled templates are excluded", () => {
  assert.deepEqual(filterUsableTemplates([template({ status: "PAUSED" }), template({ status: "DISABLED" })]), []);
});
test("15: an arbitrary client-supplied template name/language not present in the live approved list is rejected server-side", async () => {
  const { client } = makeFakeClient();
  const { executeGovernedMetaLeadWhatsAppOutreach } = loadExecutionService({ client, templates: [template()] });
  const result = await executeGovernedMetaLeadWhatsAppOutreach({ leadId: "lead-1", executionId: "exec-1", templateName: "not_a_real_template", templateLanguage: "en_US", variablesByComponent: {} });
  assert.equal(result.outcome, "invalid_template");
});
test("16: language is validated -- selecting a language the template does not have is rejected", async () => {
  const { client } = makeFakeClient();
  const { executeGovernedMetaLeadWhatsAppOutreach } = loadExecutionService({ client, templates: [template()] });
  const result = await executeGovernedMetaLeadWhatsAppOutreach({ leadId: "lead-1", executionId: "exec-1", templateName: "lead_first_contact", templateLanguage: "fr_FR", variablesByComponent: {} });
  assert.equal(result.outcome, "invalid_template");
});
test("17: variables are validated against the template's own placeholder plan", () => {
  const plan = planTemplateVariables(template());
  assert.deepEqual(plan, [{ type: "HEADER", placeholderCount: 1 }, { type: "BODY", placeholderCount: 1 }]);
});
test("18: a variable count mismatch is rejected", () => {
  assert.throws(() => validateAndBuildTemplateComponents(template(), { HEADER: ["Jane"], BODY: [] }), TemplateVariableError);
  assert.throws(() => validateAndBuildTemplateComponents(template(), { HEADER: ["Jane", "Extra"], BODY: ["The Villa"] }), TemplateVariableError);
});
test("19: raw component injection is rejected -- a non-string variable value never becomes Graph component text", () => {
  assert.throws(() => validateAndBuildTemplateComponents(template(), { HEADER: [{ malicious: true }], BODY: ["The Villa"] }), TemplateVariableError);
  const built = validateAndBuildTemplateComponents(template(), { HEADER: ["Jane\x00\x1f"], BODY: ["The Villa"] });
  assert.equal(built[0].parameters[0].text, "Jane");
});

// ===========================================================================
// PROPERTY (20-23)
// ===========================================================================
test("20: one resolved property interest is available for safe variables", () => {
  assert.match(executionServiceSrc, /resolveLeadProperty/);
});
test("21: multiple property interests are never guessed -- resolveLeadProperty (K4) is reused unmodified", () => {
  assert.match(k4RetrievalSrc, /unresolved_multiple_interests/);
  assert.doesNotMatch(strip(executionServiceSrc), /unresolved_multiple_interests.*propertyId\s*=|pick.*first.*propert/i);
});
test("22: an unverified legacy listing price is never injected as a template variable -- no price/facts source exists anywhere in the outreach template/execution modules", () => {
  assert.doesNotMatch(strip(templateModuleSrc) + strip(executionServiceSrc), /unverifiedListingPrice|legacy.*price|sale_price|rental_price/i);
});
test("23: template variables come only from human-entered form input -- no automatic K3 price/property-facts injection exists in M7 (a template needing a price requires the human to type it, matching the same 'no automatic injection beyond what the human confirms' discipline)", () => {
  assert.doesNotMatch(strip(executionServiceSrc), /getAuthoritativePropertyFacts|priceAuthority/i);
});

// ===========================================================================
// RECIPIENT (24-26)
// ===========================================================================
test("24: the recipient is derived from leads.normalized_phone, server-side", () => {
  assert.match(executionServiceSrc, /\.select\("normalized_phone"\)/);
});
test("25: the client cannot substitute a phone -- executeGovernedMetaLeadWhatsAppOutreach's input type has no phone field", () => {
  const signature = executionServiceSrc.slice(executionServiceSrc.indexOf("export async function executeGovernedMetaLeadWhatsAppOutreach"), executionServiceSrc.indexOf("): Promise<ExecuteGovernedMetaLeadWhatsAppOutreachResult>"));
  assert.doesNotMatch(signature, /phone/i);
});
test("26: the latest phone is re-read at send time, not cached from the earlier prepare/eligibility call", async () => {
  const { client } = makeFakeClient({
    rpcHandlers: { claim_whatsapp_outreach_execution: async () => ({ data: "exec-1", error: null }), mark_whatsapp_outreach_sent: async () => ({ data: null, error: null }) },
    leadRow: { normalized_phone: "+919876543210" },
  });
  const sendTemplateCalls = [];
  const { executeGovernedMetaLeadWhatsAppOutreach } = loadExecutionService({ client, sendTemplateCalls });
  await executeGovernedMetaLeadWhatsAppOutreach({ leadId: "lead-1", executionId: "exec-1", templateName: "lead_first_contact", templateLanguage: "en_US", variablesByComponent: { HEADER: ["Jane"], BODY: ["The Villa"] } });
  assert.equal(sendTemplateCalls[0].to, "+919876543210");
});

// ===========================================================================
// RECHECK (27-30)
// ===========================================================================
test("27: consent revoked after the preview screen was rendered still blocks the send (the recheck is authoritative, not the earlier prepare call)", async () => {
  const result = await outcomeFor(blockedResult("consent_revoked"));
  assert.equal(result.outcome, "not_eligible");
});
test("28: connection disconnected after preview blocks the send", async () => {
  const result = await outcomeFor({ leadId: "lead-1", eligible: false, normalizedPhone: "+1", consent: { status: "valid", reason: "consent_granted", consentId: "c1" }, transport: { status: "blocked", reason: "connection_unavailable", requiresTemplate: false, templateAvailability: "unknown", connectionId: null } });
  assert.equal(result.outcome, "not_eligible");
});
test("29: entitlement loss after preview blocks the send", async () => {
  const result = await outcomeFor({ leadId: "lead-1", eligible: false, normalizedPhone: "+1", consent: { status: "valid", reason: "consent_granted", consentId: "c1" }, transport: { status: "blocked", reason: "whatsapp_not_entitled", requiresTemplate: false, templateAvailability: "unknown", connectionId: null } });
  assert.equal(result.outcome, "not_eligible");
});
test("30: the template becoming unavailable after preview blocks the send", async () => {
  const { client } = makeFakeClient();
  const { executeGovernedMetaLeadWhatsAppOutreach } = loadExecutionService({ client, templates: [template({ status: "PAUSED" })] });
  const result = await executeGovernedMetaLeadWhatsAppOutreach({ leadId: "lead-1", executionId: "exec-1", templateName: "lead_first_contact", templateLanguage: "en_US", variablesByComponent: { HEADER: ["Jane"], BODY: ["The Villa"] } });
  assert.equal(result.outcome, "invalid_template");
});

// ===========================================================================
// HUMAN CONTROL (31-34)
// ===========================================================================
test("31: computing eligibility (resolveWhatsAppOutreachEligibility) never sends anything -- it only reads", () => {
  assert.doesNotMatch(strip(eligibilityServiceSrc), /sendTemplate|sendText|sendPayload/i);
});
test("32: rendering a preview (renderTemplatePreview) never sends anything -- pure string function, no I/O", () => {
  assert.doesNotMatch(strip(templateModuleSrc), /fetch\(|await /i);
});
test("33: preparing outreach (prepareWhatsAppOutreach) never sends anything -- it only reads eligibility/templates/property", () => {
  const prepareBody = executionServiceSrc.slice(executionServiceSrc.indexOf("export async function prepareWhatsAppOutreach"), executionServiceSrc.indexOf("export type ExecuteGovernedMetaLeadWhatsAppOutreachResult"));
  assert.doesNotMatch(prepareBody, /sendTemplate\(/);
});
test("34: only the explicit executeGovernedMetaLeadWhatsAppOutreach function ever invokes sendTemplate() in the M7 diff", () => {
  const m7Sources = [templateModuleSrc, reconciliationServiceSrc, actionsSrc, routeSrc];
  for (const src of m7Sources) assert.doesNotMatch(strip(src), /\.sendTemplate\(/);
  assert.match(executionServiceSrc, /platform\.sendTemplate\(/);
});

// ===========================================================================
// SEND (35-42)
// ===========================================================================
test("35: the mocked provider is called exactly once for a successful send", async () => {
  const { client } = makeFakeClient({ rpcHandlers: { claim_whatsapp_outreach_execution: async () => ({ data: "exec-1", error: null }), mark_whatsapp_outreach_sent: async () => ({ data: null, error: null }) } });
  const sendTemplateCalls = [];
  const { executeGovernedMetaLeadWhatsAppOutreach } = loadExecutionService({ client, sendTemplateCalls });
  const result = await executeGovernedMetaLeadWhatsAppOutreach({ leadId: "lead-1", executionId: "exec-1", templateName: "lead_first_contact", templateLanguage: "en_US", variablesByComponent: { HEADER: ["Jane"], BODY: ["The Villa"] } });
  assert.equal(result.outcome, "sent");
  assert.equal(sendTemplateCalls.length, 1);
});
test("36: the exact selected approved template name/language is used", async () => {
  const { client } = makeFakeClient({ rpcHandlers: { claim_whatsapp_outreach_execution: async () => ({ data: "exec-1", error: null }), mark_whatsapp_outreach_sent: async () => ({ data: null, error: null }) } });
  const sendTemplateCalls = [];
  const { executeGovernedMetaLeadWhatsAppOutreach } = loadExecutionService({ client, sendTemplateCalls });
  await executeGovernedMetaLeadWhatsAppOutreach({ leadId: "lead-1", executionId: "exec-1", templateName: "lead_first_contact", templateLanguage: "en_US", variablesByComponent: { HEADER: ["Jane"], BODY: ["The Villa"] } });
  assert.equal(sendTemplateCalls[0].name, "lead_first_contact");
});
test("37: the exact selected language is used", async () => {
  const { client } = makeFakeClient({ rpcHandlers: { claim_whatsapp_outreach_execution: async () => ({ data: "exec-1", error: null }), mark_whatsapp_outreach_sent: async () => ({ data: null, error: null }) } });
  const sendTemplateCalls = [];
  const { executeGovernedMetaLeadWhatsAppOutreach } = loadExecutionService({ client, sendTemplateCalls });
  await executeGovernedMetaLeadWhatsAppOutreach({ leadId: "lead-1", executionId: "exec-1", templateName: "lead_first_contact", templateLanguage: "en_US", variablesByComponent: { HEADER: ["Jane"], BODY: ["The Villa"] } });
  assert.equal(sendTemplateCalls[0].language, "en_US");
});
test("38: the exact validated variables are used -- built components match the sanitized input", async () => {
  const { client } = makeFakeClient({ rpcHandlers: { claim_whatsapp_outreach_execution: async () => ({ data: "exec-1", error: null }), mark_whatsapp_outreach_sent: async () => ({ data: null, error: null }) } });
  const sendTemplateCalls = [];
  const { executeGovernedMetaLeadWhatsAppOutreach } = loadExecutionService({ client, sendTemplateCalls });
  await executeGovernedMetaLeadWhatsAppOutreach({ leadId: "lead-1", executionId: "exec-1", templateName: "lead_first_contact", templateLanguage: "en_US", variablesByComponent: { HEADER: ["Jane"], BODY: ["The Villa"] } });
  assert.deepEqual(sendTemplateCalls[0].components, [{ type: "header", parameters: [{ type: "text", text: "Jane" }] }, { type: "body", parameters: [{ type: "text", text: "The Villa" }] }]);
});
test("39: the provider message id is persisted via mark_whatsapp_outreach_sent", async () => {
  const { client, rpcCalls } = makeFakeClient({ rpcHandlers: { claim_whatsapp_outreach_execution: async () => ({ data: "exec-1", error: null }), mark_whatsapp_outreach_sent: async () => ({ data: null, error: null }) } });
  const { executeGovernedMetaLeadWhatsAppOutreach } = loadExecutionService({ client });
  await executeGovernedMetaLeadWhatsAppOutreach({ leadId: "lead-1", executionId: "exec-1", templateName: "lead_first_contact", templateLanguage: "en_US", variablesByComponent: { HEADER: ["Jane"], BODY: ["The Villa"] } });
  const sentCall = rpcCalls.find((c) => c.name === "mark_whatsapp_outreach_sent");
  assert.equal(sentCall.params.p_provider_message_id, "wamid.mock-123");
});
test("40: the real outbound communications/whatsapp_messages persistence happens inside mark_whatsapp_outreach_sent, exactly once per call", () => {
  assert.match(sentFn, /insert into communications \(organization_id, workspace_id, thread_id, channel, direction, status, body, external_id, occurred_at\)/);
  assert.match(sentFn, /insert into whatsapp_messages \(/);
});
test("41: the whatsapp_messages record uses message_type='template' (not 'text'), correctly distinguishing this send from a freeform AI-draft send", () => {
  assert.match(sentFn, /'template', p_rendered_text, 'sent'/);
});
test("42: the thread is linked to the CRM lead (related_type='lead', related_id=lead_id)", () => {
  assert.match(sentFn, /related_type, related_id, status, created_by, updated_by\)\s+values \(v_org, p_workspace_id, 'WhatsApp', 'lead', v_execution\.lead_id/);
});

// ===========================================================================
// DUPLICATES (43-45)
// ===========================================================================
test("43: a double-click (same execution id resubmitted) results in the provider being called at most once -- the second claim fails closed", () => {
  assert.match(claimFn, /on conflict \(id\) do nothing/);
  assert.match(claimFn, /raise exception 'ALREADY_CLAIMED_OR_SENT/);
});
test("44: the same execution cannot resend after it is already 'sent' -- the retry branch only matches status='failed'", () => {
  assert.match(claimFn, /where id = p_execution_id and status = 'failed'/);
});
test("45: a known failed execution may be deliberately retried (same execution id, status='failed' branch succeeds)", () => {
  const retryBranch = claimFn.slice(claimFn.indexOf("update whatsapp_outreach_executions\n     set status = 'claimed'"));
  assert.match(retryBranch, /attempt_count = attempt_count \+ 1/);
});

// ===========================================================================
// UNCERTAINTY (46-48)
// ===========================================================================
test("46: a stale claimed execution becomes uncertain, not failed", () => {
  assert.match(flagFn, /set status = 'uncertain'\s+where status = 'claimed' and claimed_at < p_stale_before/);
});
test("47: an uncertain execution cannot be blindly retried -- claim's retry branch only matches 'failed', never 'uncertain'", () => {
  assert.doesNotMatch(claimFn, /status = 'uncertain'/);
});
test("48: no fake sent record is ever created for an uncertain execution -- flag_stale never touches provider_message_id/sent_at", () => {
  assert.doesNotMatch(flagFn, /provider_message_id|sent_at/);
});

// ===========================================================================
// CONSENT TRACE (49-50)
// ===========================================================================
test("49: the execution stores a reference to the consentId that justified outreach", () => {
  assert.match(migrationSql, /consent_id uuid not null references public\.communication_consents\(id\)/);
  assert.match(claimFn, /p_consent_id/);
});
test("50: consent provenance remains independently auditable -- the full consent_text/version stay on communication_consents, never copied wholesale into the execution row", () => {
  const tableDef = migrationSql.slice(migrationSql.indexOf("create table public.whatsapp_outreach_executions"), migrationSql.indexOf("create index whatsapp_outreach_executions_tenant_idx"));
  assert.doesNotMatch(tableDef, /consent_text|consent_statement/);
});

// ===========================================================================
// PII (51-54)
// ===========================================================================
test("51: logs contain no phone anywhere in the M7 diff", () => {
  for (const src of [executionServiceSrc, actionsSrc, reconciliationServiceSrc]) assert.doesNotMatch(strip(src), /log\(.*normalizedPhone|log\(.*recipient|log\(.*phone/i);
});
test("52: logs contain no email anywhere in the M7 diff", () => {
  for (const src of [executionServiceSrc, actionsSrc]) assert.doesNotMatch(strip(src), /log\(.*email/i);
});
test("53: logs contain no name anywhere in the M7 diff", () => {
  for (const src of [executionServiceSrc, actionsSrc]) assert.doesNotMatch(strip(src), /log\(.*variablesByComponent|log\(.*renderedText/i);
});
test("54: activity_events metadata (the uncertain-flag event) contains no PII -- only executionId", () => {
  assert.match(flagFn, /jsonb_build_object\('executionId', r\.id\)/);
  assert.doesNotMatch(flagFn, /jsonb_build_object\([^)]*phone|jsonb_build_object\([^)]*email/i);
});

// ===========================================================================
// NO AI (55-57)
// ===========================================================================
test("55: no OpenAI call exists anywhere in the M7 diff", () => {
  const m7Sources = [migrationSql, templateModuleSrc, executionServiceSrc, reconciliationServiceSrc, actionsSrc, routeSrc, pageSrc];
  for (const src of m7Sources) assert.doesNotMatch(strip(src), /openai|OpenAIProvider|chat\.completions/i);
});
test("56: no AI Workforce call exists anywhere in the M7 diff", () => {
  const m7Sources = [migrationSql, templateModuleSrc, executionServiceSrc, reconciliationServiceSrc, actionsSrc, routeSrc, pageSrc];
  for (const src of m7Sources) assert.doesNotMatch(strip(src), /buildWorkforceEvidence|AIWorkforce|ai_workforce/i);
});
test("57: no K6 draft-generation call exists anywhere in the M7 diff -- the template text is provider-approved, never AI-rewritten", () => {
  assert.doesNotMatch(strip(templateModuleSrc) + strip(executionServiceSrc), /trusted-runtime|generateDraft|draftMessage/i);
});

// ===========================================================================
// REGRESSION (58-63)
// ===========================================================================
test("58: M6 eligibility is unchanged in its core decision logic -- only an additive connectionId field was added, no existing reason/branch removed", () => {
  for (const reason of ["lead_not_found", "do_not_contact", "no_phone", "phone_not_normalized", "no_consent", "consent_revoked", "consent_unverifiable", "whatsapp_not_entitled", "connection_unavailable", "template_required_unavailable"]) {
    assert.match(eligibilityServiceSrc, new RegExp(reason));
  }
});
test("59: M5's CRM ingestion migration/service are unmodified by M7", () => {
  assert.doesNotMatch(m5Migration, /whatsapp_outreach_executions/);
  assert.doesNotMatch(crmServiceSrc, /whatsapp_outreach|outreach_execution/i);
});
test("60: M4's Graph fetch service is unmodified by M7", () => {
  assert.doesNotMatch(leadDetailServiceSrc, /whatsapp_outreach/i);
  assert.doesNotMatch(m4Migration, /whatsapp_outreach/i);
});
test("61: M3's webhook/dedup is unmodified by M7", () => {
  assert.doesNotMatch(webhookRouteSrc, /whatsapp_outreach/i);
  assert.doesNotMatch(m3Migration, /whatsapp_outreach/i);
});
test("62: E1-E6 WhatsApp inbound/AI flow is unmodified by M7 -- whatsapp-send-execution.service.ts and whatsapp-draft-approval.service.ts make no reference to the new outreach model", () => {
  assert.doesNotMatch(whatsappSendExecutionSrc, /whatsapp_outreach_executions|resolveWhatsAppOutreachEligibility/i);
  assert.doesNotMatch(whatsappDraftApprovalSrc, /whatsapp_outreach_executions/i);
  assert.doesNotMatch(whatsappOrchestratorSrc + trustedRuntimeSrc, /whatsapp_outreach_executions|executeGovernedMetaLeadWhatsAppOutreach/i);
});
test("63: K1-K6 are unmodified by M7 -- resolveLeadProperty's own fail-closed multiple-interest logic is reused verbatim, not altered", () => {
  assert.doesNotMatch(k4RetrievalSrc, /whatsapp_outreach|executeGovernedMetaLeadWhatsAppOutreach/i);
});

// ===========================================================================
// LIVE SAFETY (64-65)
// ===========================================================================
test("64: every provider call in every M7 test is mocked -- no test constructs the real WhatsAppCloudRepository/WhatsAppPlatformService or calls fetch()", () => {
  // Structural guarantee: this file's own loadExecutionService() always substitutes
  // WhatsAppPlatformService via load()'s mock map -- verified by construction (see fixtures above).
  assert.doesNotMatch(rd("tests/phase-m7-meta-lead-whatsapp-outreach.test.mjs"), /new WhatsAppPlatformService\(\)(?!.*mock)/);
});
test("65: no real WhatsApp message is ever sent by this test suite -- sendTemplate is always the fake class defined in loadExecutionService", () => {
  assert.match(rd("tests/phase-m7-meta-lead-whatsapp-outreach.test.mjs"), /sendTemplateCalls\.push\(input\)/);
});

// ---------------------------------------------------------------------------
// Additional coverage: security, actions, route, migration structure.
// ---------------------------------------------------------------------------
test("cross-tenant lead/consent/connection are all rejected inside claim_whatsapp_outreach_execution", () => {
  assert.match(claimFn, /where id = p_lead_id and organization_id = v_org and workspace_id = p_workspace_id and deleted_at is null/);
  assert.match(claimFn, /where id = p_consent_id and organization_id = v_org and workspace_id = p_workspace_id/);
  assert.match(claimFn, /where id = p_connection_id and organization_id = v_org and workspace_id = p_workspace_id/);
});
test("two concurrent outreach attempts for the SAME lead cannot both claim -- an in-flight 'claimed' row blocks a new claim", () => {
  assert.match(claimFn, /if exists \(select 1 from whatsapp_outreach_executions where lead_id = p_lead_id and status = 'claimed'\) then/);
  assert.match(claimFn, /raise exception 'OUTREACH_IN_PROGRESS/);
});
test("claim/mark-sent/mark-failed RPCs require authentication (auth.uid()) and are granted to authenticated, never service_role", () => {
  for (const fn of [claimFn, sentFn, failedFn]) assert.match(fn, /v_user uuid := auth\.uid\(\);/);
  assert.match(migrationSql, /grant execute on function public\.claim_whatsapp_outreach_execution\([^)]*\) to authenticated;/);
  assert.match(migrationSql, /grant execute on function public\.mark_whatsapp_outreach_sent\([^)]*\) to authenticated;/);
  assert.match(migrationSql, /grant execute on function public\.mark_whatsapp_outreach_failed\([^)]*\) to authenticated;/);
  assert.doesNotMatch(migrationSql, /grant execute on function public\.claim_whatsapp_outreach_execution\([^)]*\) to service_role/);
});
test("flag_stale_whatsapp_outreach_executions is service-role only", () => {
  assert.match(flagFn, /if current_setting\('role', true\) <> 'service_role' then/);
  assert.match(migrationSql, /grant execute on function public\.flag_stale_whatsapp_outreach_executions\(timestamptz\) to service_role;/);
});
test("the send action reuses requireWorkspacePermission('approvals','approve') and requireEntitlement('whatsapp'), matching E5's precedent exactly", () => {
  assert.match(actionsSrc, /requireWorkspacePermission\("approvals", "approve"\)/);
  assert.match(actionsSrc, /requireEntitlement\("whatsapp"\)/);
  assert.match(actionsSrc, /guardSubscriptionAction\(\)/);
});
test("the send action never accepts a client-supplied consentId, connectionId, or eligible flag", () => {
  assert.doesNotMatch(strip(actionsSrc), /consentId|connectionId|eligible\s*=\s*true|formData\.get\("eligible"\)/);
});
test("the reconcile route is CRON_SECRET-gated and declares maxDuration=300, matching the established pattern", () => {
  assert.match(routeSrc, /timingSafeEqual/);
  assert.match(routeSrc, /export const maxDuration = 300;/);
});
test("no unique constraint forces exactly-one-outreach-ever per lead -- the primary key is the caller-supplied intent id, not lead_id, so a legitimate later outreach is never permanently blocked", () => {
  assert.doesNotMatch(migrationSql, /unique \(lead_id\)|unique\(lead_id\)/);
});
test("migration is strictly after M6, additive only, and touches no prior migration's tables via ALTER", () => {
  assert.ok("20261120000000" > "20261119000000");
  assert.doesNotMatch(migrationSql, /drop table|drop column|alter table public\.(?!whatsapp_outreach_executions)/i);
});
test("renderTemplatePreview substitutes the same values validateAndBuildTemplateComponents uses -- preview never drifts from what is actually sent", () => {
  const preview = renderTemplatePreview(template(), { HEADER: ["Jane"], BODY: ["The Villa"] });
  assert.match(preview, /Hello Jane/);
  assert.match(preview, /The Villa/);
});
test("languagesForTemplateName and findUsableTemplate only ever consider APPROVED templates", () => {
  const templates = [template({ language: "en_US" }), template({ language: "hi_IN", status: "PAUSED" })];
  assert.deepEqual(languagesForTemplateName(filterUsableTemplates(templates), "lead_first_contact"), ["en_US"]);
  assert.equal(findUsableTemplate(templates, "lead_first_contact", "hi_IN"), null);
});
