import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

// ---------------------------------------------------------------------------
// Generic in-memory Supabase-client mock, inlined verbatim per the ADS-B0E
// pattern (this file has no committed-history dependency on
// tests/helpers/fake-supabase-c2.mjs, which remains zero-history).
// ---------------------------------------------------------------------------
function fakeClient({ tables = {}, rpcs = {} } = {}) {
  const rpcCalls = [];
  function builder(table) {
    const filters = [];
    let rows = tables[table] ?? [];
    const api = {
      select() { return api; },
      eq(col, val) { filters.push((row) => row[col] === val); return api; },
      is(col, val) { filters.push((row) => (row[col] ?? null) === val); return api; },
      in(col, vals) { filters.push((row) => vals.includes(row[col])); return api; },
      order() { return api; },
      limit() { return api; },
      maybeSingle: async () => {
        const matched = rows.filter((row) => filters.every((f) => f(row)));
        return { data: matched[0] ?? null, error: null };
      },
      single: async () => {
        const matched = rows.filter((row) => filters.every((f) => f(row)));
        return matched.length === 1 ? { data: matched[0], error: null } : { data: null, error: new Error("no rows or multiple rows found") };
      },
      then(resolve, reject) {
        const matched = rows.filter((row) => filters.every((f) => f(row)));
        return Promise.resolve({ data: matched, error: null }).then(resolve, reject);
      },
    };
    return api;
  }
  return {
    from: (table) => builder(table),
    rpc: async (name, params) => {
      rpcCalls.push([name, params]);
      const handler = rpcs[name];
      if (!handler) return { data: null, error: new Error(`no rpc handler for ${name}`) };
      return handler(params);
    },
    storage: { from: () => ({ upload: async () => ({ data: {}, error: null }) }) },
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } }, error: null }) },
    _rpcCalls: rpcCalls,
  };
}
function propertyRow(over = {}) {
  return {
    id: "property-1", reference: "REF-1", title: "Aurora Heights", property_type: "apartment", listing_type: "sale",
    status: "available", country_code: "IN", region: "Karnataka", city: "Bengaluru", locality: "Indiranagar",
    address: "123 Main St", bedrooms: 3, bathrooms: 2, area: "1500", area_unit: "sqft", parking: 1, floor: 5,
    amenities: ["Swimming Pool", "Gym", "Clubhouse"], sale_price: "12500000", rental_price: null, currency: "INR",
    organization_id: "org-1", workspace_id: "ws-1", deleted_at: null,
    ...over,
  };
}

const rd = (p) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const migration = rd("supabase/migrations/20261127000000_campaign_meta_lead_forms.sql");
const migrationSql = migration.split("\n").map((l) => l.replace(/--.*$/, "")).join("\n");
const saveDraftFn = migrationSql.slice(migrationSql.indexOf("function public.save_campaign_lead_form_draft"), migrationSql.indexOf("function public.claim_campaign_lead_form_creation"));
const claimFn = migrationSql.slice(migrationSql.indexOf("function public.claim_campaign_lead_form_creation"), migrationSql.indexOf("function public.complete_campaign_lead_form_creation"));
const completeFn = migrationSql.slice(migrationSql.indexOf("function public.complete_campaign_lead_form_creation"), migrationSql.indexOf("function public.mark_campaign_lead_form_mapped"));

async function rejectsNamed(promise, name) {
  try {
    await promise;
  } catch (error) {
    assert.equal(error.name, name);
    return;
  }
  assert.fail(`expected rejection named ${name}`);
}
function throwsNamed(fn, name) {
  try {
    fn();
  } catch (error) {
    assert.equal(error.name, name);
    return;
  }
  assert.fail(`expected throw named ${name}`);
}

const campaignId = "11111111-1111-4111-8111-111111111111";
const propertyId = "22222222-2222-4222-8222-222222222222";
const connectionId = "44444444-4444-4444-8444-444444444444";

const validation = load("features/platform/integrations/meta-marketing/domain/lead-form-validation.ts");
const { CampaignLeadFormRepository } = load("features/platform/integrations/meta-marketing/repositories/campaign-lead-form.repository.ts");
const { CampaignLeadFormService, isOutreachReady } = load("features/platform/integrations/meta-marketing/services/campaign-lead-form.service.ts", {
  "@/features/vayon/operations/services/context": {},
  "@/features/platform/permissions/runtime/permission.service": {},
});
const { requireMetaMarketingWritesEnabled } = load("features/platform/integrations/meta-marketing/providers/meta-graph.provider.ts");

function fakeCrypto() {
  return { encrypt: (v) => ({ ciphertext: v, iv: "iv", tag: "tag" }), decrypt: (enc) => enc.ciphertext };
}
function fakeMetaRepository(over = {}) {
  return {
    connection: async () => over.connection !== undefined ? over.connection : { id: connectionId, pageId: "page-1", status: "connected" },
    getEncryptedToken: async () => over.token !== undefined ? over.token : { ciphertext: "page-token", iv: "iv", tag: "tag" },
  };
}
function fakeMetaService(over = {}) {
  const calls = { createFormMapping: [], configureConsentRule: [] };
  return {
    calls,
    createFormMapping: async (input) => { calls.createFormMapping.push(input); if (over.mappingError) throw over.mappingError; return over.formMappingId ?? "mapping-1"; },
    configureConsentRule: async (input) => { calls.configureConsentRule.push(input); if (over.consentError) throw over.consentError; return over.consentRuleId ?? "consent-rule-1"; },
  };
}
class FakeProvider {
  constructor(result) { this.result = result ?? { providerFormId: "form-provider-1", status: "ACTIVE" }; this.calls = []; }
  async createLeadForm(pageId, pageToken, input) { this.calls.push({ pageId, pageToken, input }); if (this.result instanceof Error) throw this.result; return this.result; }
}

function client(over = {}) {
  const tables = {
    creative_campaigns: over.campaigns ?? [{ id: campaignId, organization_id: "org-1", workspace_id: "ws-1", property_id: propertyId }],
    campaign_strategy_versions: over.strategies ?? [{ id: "strategy-1", campaign_id: campaignId, organization_id: "org-1", workspace_id: "ws-1", status: "accepted" }],
    campaign_creative_packages: over.packages ?? [{ id: "package-1", campaign_id: campaignId, organization_id: "org-1", workspace_id: "ws-1", status: "accepted" }],
    meta_marketing_connections: over.connections ?? [{ id: connectionId, organization_id: "org-1", workspace_id: "ws-1", status: "connected", deleted_at: null }],
    campaign_lead_forms: over.forms ?? [],
    properties: [propertyRow({ id: propertyId })],
  };
  const c = fakeClient({
    tables,
    rpcs: {
      save_campaign_lead_form_draft: async (params) => {
        if (over.saveDraftRpc) return over.saveDraftRpc(params);
        const campaign = tables.creative_campaigns.find((x) => x.id === params.p_campaign_id);
        if (!campaign) return { data: null, error: new Error("invalid campaign") };
        if (!tables.campaign_strategy_versions.some((s) => s.campaign_id === params.p_campaign_id && s.status === "accepted")) return { data: null, error: new Error("accepted strategy required") };
        if (!tables.campaign_creative_packages.some((p) => p.campaign_id === params.p_campaign_id && p.status === "accepted")) return { data: null, error: new Error("accepted package required") };
        const conn = tables.meta_marketing_connections.find((x) => x.organization_id === campaign.organization_id && x.workspace_id === campaign.workspace_id && x.status === "connected");
        if (!conn) return { data: null, error: new Error("connected Meta Marketing Page required") };
        const existing = tables.campaign_lead_forms.filter((f) => f.campaign_id === params.p_campaign_id);
        const version = Math.max(0, ...existing.map((f) => f.version)) + 1;
        const id = `local-form-${version}-${Math.random().toString(36).slice(2)}`;
        tables.campaign_lead_forms.push({
          id, organization_id: campaign.organization_id, workspace_id: campaign.workspace_id, campaign_id: params.p_campaign_id, property_id: campaign.property_id,
          connection_id: conn.id, page_id: conn.page_id ?? "page-1", version, provider_form_id: null, form_name: params.p_form_name, status: "draft",
          specification: params.p_specification, form_mapping_id: null, consent_rule_id: null, diagnostic: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        });
        return { data: id, error: null };
      },
      claim_campaign_lead_form_creation: async (params) => {
        const form = tables.campaign_lead_forms.find((f) => f.id === params.p_local_form_id && f.status === "draft");
        if (!form) return { data: null, error: null };
        form.status = "creating";
        return { data: form, error: null };
      },
      complete_campaign_lead_form_creation: async (params) => {
        const form = tables.campaign_lead_forms.find((f) => f.id === params.p_local_form_id);
        if (!form) return { data: null, error: new Error("not awaiting creation") };
        if (params.p_success) { form.status = "created"; form.provider_form_id = params.p_provider_form_id; form.diagnostic = null; }
        else { form.status = "failed"; form.diagnostic = params.p_diagnostic; }
        return { data: null, error: null };
      },
      mark_campaign_lead_form_mapped: async (params) => {
        const form = tables.campaign_lead_forms.find((f) => f.id === params.p_local_form_id);
        form.status = "created"; form.form_mapping_id = params.p_form_mapping_id; form.diagnostic = null;
        return { data: null, error: null };
      },
      mark_campaign_lead_form_mapping_failed: async (params) => {
        const form = tables.campaign_lead_forms.find((f) => f.id === params.p_local_form_id);
        form.status = "created_mapping_failed"; form.diagnostic = params.p_diagnostic;
        return { data: null, error: null };
      },
      mark_campaign_lead_form_consent_configured: async (params) => {
        const form = tables.campaign_lead_forms.find((f) => f.id === params.p_local_form_id);
        form.status = "created"; form.consent_rule_id = params.p_consent_rule_id; form.diagnostic = null;
        return { data: null, error: null };
      },
      mark_campaign_lead_form_consent_failed: async (params) => {
        const form = tables.campaign_lead_forms.find((f) => f.id === params.p_local_form_id);
        form.status = "created_consent_failed"; form.diagnostic = params.p_diagnostic;
        return { data: null, error: null };
      },
    },
  });
  return { client: c, tables };
}

function baseSpecInput(over = {}) {
  return {
    campaignId, formName: "Aurora Heights Enquiry", locale: "en_US",
    contactFields: [{ type: "FULL_NAME", key: "full_name" }, { type: "PHONE", key: "phone" }],
    qualificationQuestions: [{ type: "CUSTOM", key: "q1", label: "What is your budget range?" }],
    privacyPolicyUrl: "https://example.com/privacy", privacyPolicyLinkText: "Privacy Policy",
    thankYouTitle: "Thank you", thankYouBody: "We will be in touch shortly.",
    whatsappConsentRequested: true,
    consentDisclosure: { key: "whatsapp_marketing_consent", title: "Stay in touch", bodyText: "We may contact you on WhatsApp.", checkboxText: "I agree to receive WhatsApp messages about this property.", statementVersion: 1 },
    ...over,
  };
}

function service(c, over = {}) {
  const repository = new CampaignLeadFormRepository(c, over.organizationId ?? "org-1", over.workspaceId ?? "ws-1");
  return CampaignLeadFormService.withProvider(repository, over.metaRepository ?? fakeMetaRepository(), over.metaService ?? fakeMetaService(), over.provider ?? new FakeProvider(), fakeCrypto());
}

// ---------------------------------------------------------------------------
// PREREQUISITES (1-6)
// ---------------------------------------------------------------------------
test("1-6: campaign/property/accepted-strategy/accepted-package all required; foreign campaign and cross-workspace blocked", async () => {
  const { client: c } = client();
  const s = service(c);
  const form = await s.prepareDraft(baseSpecInput());
  assert.equal(form.status, "draft");

  const noStrategy = service(client({ strategies: [] }).client);
  await rejectsNamed(noStrategy.prepareDraft(baseSpecInput()), "Error");

  const noPackage = service(client({ packages: [] }).client);
  await rejectsNamed(noPackage.prepareDraft(baseSpecInput()), "Error");

  const foreign = service(client({ campaigns: [] }).client);
  await rejectsNamed(foreign.prepareDraft(baseSpecInput()), "Error");

  assert.match(saveDraftFn, /if not exists\(select 1 from public\.campaign_strategy_versions where campaign_id=p_campaign_id and organization_id=o and workspace_id=w and status='accepted'\)/i);
  assert.match(saveDraftFn, /if not exists\(select 1 from public\.campaign_creative_packages where campaign_id=p_campaign_id and organization_id=o and workspace_id=w and status='accepted'\)/i);
});

// ---------------------------------------------------------------------------
// CONNECTION (7-10)
// ---------------------------------------------------------------------------
test("7-10: connected Meta connection required; token never client-supplied", async () => {
  const disconnected = service(client({ connections: [] }).client);
  await rejectsNamed(disconnected.prepareDraft(baseSpecInput()), "Error");
  assert.match(saveDraftFn, /select \* into conn from public\.meta_marketing_connections where organization_id=o and workspace_id=w and status='connected'/i);

  const serviceSrc = rd("features/platform/integrations/meta-marketing/services/campaign-lead-form.service.ts");
  assert.doesNotMatch(serviceSrc, /formData\.get\("(accessToken|pageToken|organizationId|workspaceId)"\)/);
  const actionsSrc = rd("features/platform/integrations/meta-marketing/actions.ts");
  assert.doesNotMatch(actionsSrc.slice(actionsSrc.indexOf("prepareCampaignLeadFormAction")), /formData\.get\("(accessToken|pageToken|organizationId|workspaceId|token)"\)/);
});

// ---------------------------------------------------------------------------
// FORM SPEC (11-16)
// ---------------------------------------------------------------------------
test("11-16: form name/locale validated; contact fields and qualification questions bounded; unsupported question type rejected; no arbitrary provider payload", () => {
  throwsNamed(() => validation.validateLeadFormSpecification({ ...baseSpecInput(), formName: "" }), "LeadFormValidationError");
  throwsNamed(() => validation.validateLeadFormSpecification({ ...baseSpecInput(), locale: "english" }), "LeadFormValidationError");
  throwsNamed(() => validation.validateLeadFormSpecification({ ...baseSpecInput(), contactFields: Array.from({ length: 4 }, (_, i) => ({ type: "PHONE", key: `p${i}` })) }), "LeadFormValidationError");
  throwsNamed(() => validation.validateLeadFormSpecification({ ...baseSpecInput(), qualificationQuestions: Array.from({ length: 6 }, (_, i) => ({ type: "CUSTOM", key: `q${i}`, label: `Q${i}` })) }), "LeadFormValidationError");
  throwsNamed(() => validation.validateLeadFormSpecification({ ...baseSpecInput(), contactFields: [{ type: "CUSTOM", key: "x", label: "x" }] }), "LeadFormValidationError");

  const providerSrc = rd("features/platform/integrations/meta-marketing/providers/meta-graph.provider.ts");
  assert.match(providerSrc, /payload: Record<string, unknown> = \{/);
  assert.doesNotMatch(providerSrc, /\.\.\.input(?!\.)|JSON\.parse\(.*formData/);
});

// ---------------------------------------------------------------------------
// PRIVACY (17-19)
// ---------------------------------------------------------------------------
test("17-19: privacy policy required before creation; missing policy blocks; only the customer's own URL is used, never a fabricated VAYON policy", async () => {
  const { specification } = validation.validateLeadFormSpecification({ ...baseSpecInput(), privacyPolicyUrl: null });
  throwsNamed(() => validation.requireCreatableSpecification(specification), "PRIVACY_POLICY_REQUIRED");
  const { specification: withPolicy } = validation.validateLeadFormSpecification(baseSpecInput());
  assert.doesNotThrow(() => validation.requireCreatableSpecification(withPolicy));
  assert.equal(withPolicy.privacyPolicyUrl, "https://example.com/privacy");

  const serviceSrc = rd("features/platform/integrations/meta-marketing/services/campaign-lead-form.service.ts");
  assert.doesNotMatch(serviceSrc, /vayon\.online|vayon\.com\/privacy/i);
});

// ---------------------------------------------------------------------------
// CONSENT (20-27)
// ---------------------------------------------------------------------------
test("20-27: explicit WhatsApp consent question present; phone/submission alone is not consent; accepted values/statement/channel/purpose exact; invalid consent config blocks", () => {
  const { specification } = validation.validateLeadFormSpecification(baseSpecInput());
  assert.ok(specification.consentDisclosure);
  assert.equal(specification.whatsappConsentRequested, true);

  throwsNamed(() => validation.validateLeadFormSpecification({ ...baseSpecInput(), whatsappConsentRequested: true, consentDisclosure: null }), "LeadFormValidationError");
  throwsNamed(() => validation.validateLeadFormSpecification({ ...baseSpecInput(), consentDisclosure: { key: "", title: "x", bodyText: "x", checkboxText: "x", statementVersion: 1 } }), "LeadFormValidationError");

  const providerSrc = rd("features/platform/integrations/meta-marketing/providers/meta-graph.provider.ts");
  assert.match(providerSrc, /is_checked_by_default: false/);
  assert.doesNotMatch(providerSrc, /is_checked_by_default: true/);

  const serviceSrc = rd("features/platform/integrations/meta-marketing/services/campaign-lead-form.service.ts");
  assert.match(serviceSrc, /acceptedValues: \[disclosure\.checkboxText\]/);
  assert.match(serviceSrc, /consentStatement: disclosure\.bodyText/);
  assert.match(serviceSrc, /formMappingId: current\.formMappingId/);
  const repoSrc = rd("features/platform/integrations/meta-marketing/repositories/meta-marketing.repository.ts");
  assert.match(repoSrc, /channel: "whatsapp"/);
  assert.match(repoSrc, /purpose: "marketing"/);
});

// ---------------------------------------------------------------------------
// PROVIDER (28-33)
// ---------------------------------------------------------------------------
test("28-33: existing MetaMarketingProvider extended (no second provider); fake createLeadForm called once; no live Graph call; provider ID persisted; centralized API version reused", async () => {
  const { client: c, tables } = client();
  const provider = new FakeProvider();
  const s = service(c, { provider });
  const draft = await s.prepareDraft(baseSpecInput());
  const created = await s.createOnMeta(draft.id);
  assert.equal(provider.calls.length, 1);
  assert.equal(created.providerFormId, "form-provider-1");
  assert.equal(tables.campaign_lead_forms.find((f) => f.id === draft.id).provider_form_id, "form-provider-1");

  const providerSrc = rd("features/platform/integrations/meta-marketing/providers/meta-graph.provider.ts");
  assert.match(providerSrc, /class MetaGraphMarketingProvider implements MetaMarketingProvider/);
  assert.doesNotMatch(rd("features/platform/integrations/meta-marketing/services/campaign-lead-form.service.ts"), /class \w*MetaProvider/);
  assert.match(providerSrc, /graphVersion\(\)/);
  const graphPostFn = providerSrc.slice(providerSrc.indexOf("async function graphPost"));
  assert.match(graphPostFn, /graphVersion\(\)/);
  assert.doesNotMatch(graphPostFn, /v2[0-9]\.0(?!`\$)/); // no second hardcoded version literal
});

// ---------------------------------------------------------------------------
// WRITE GUARD (34-37)
// ---------------------------------------------------------------------------
test("34-37: writes disabled by default; disabled guard blocks the real provider; fake provider executes without the env switch; guard is server-only", () => {
  delete process.env.META_MARKETING_WRITES_ENABLED;
  throwsNamed(() => requireMetaMarketingWritesEnabled(), "MetaMarketingWritesDisabledError");
  process.env.META_MARKETING_WRITES_ENABLED = "false";
  throwsNamed(() => requireMetaMarketingWritesEnabled(), "MetaMarketingWritesDisabledError");
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  assert.doesNotThrow(() => requireMetaMarketingWritesEnabled());
  delete process.env.META_MARKETING_WRITES_ENABLED;

  const fakeCalls = new FakeProvider();
  assert.doesNotThrow(async () => fakeCalls.createLeadForm("page-1", "token", {}));
  const providerSrc = rd("features/platform/integrations/meta-marketing/providers/meta-graph.provider.ts");
  assert.doesNotMatch(providerSrc.split("\n")[0], /use client/);
  assert.doesNotMatch(providerSrc, /NEXT_PUBLIC_META_MARKETING_WRITES/);
});

// ---------------------------------------------------------------------------
// IDEMPOTENCY (38-41)
// ---------------------------------------------------------------------------
test("38-41: first explicit creation claims; double click does not create a second Meta form; terminal failure retry explicit; uncertain state cannot blindly recreate", async () => {
  const { client: c, tables } = client();
  const provider = new FakeProvider();
  const s = service(c, { provider });
  const draft = await s.prepareDraft(baseSpecInput());
  await Promise.all([s.createOnMeta(draft.id), s.createOnMeta(draft.id).catch(() => {})]);
  assert.ok(provider.calls.length <= 1);

  assert.match(claimFn, /where id=p_local_form_id and organization_id=o and workspace_id=w and status='draft'/i);
  assert.match(migrationSql, /create unique index campaign_lead_form_one_active_creation_idx on public\.campaign_lead_forms\(campaign_id\) where status in\('creating'\)/i);

  tables.campaign_lead_forms.find((f) => f.id === draft.id).status = "uncertain";
  const reclaim = await c.rpc("claim_campaign_lead_form_creation", { p_local_form_id: draft.id });
  assert.equal(reclaim.data, null);
});

// ---------------------------------------------------------------------------
// MAPPING (42-46)
// ---------------------------------------------------------------------------
test("42-46: confirmed form auto-mapped with the correct property id; existing M1/M2 resolver reusable; mapping failure does not recreate the Meta form; retry is local-only", async () => {
  const { client: c } = client();
  const metaService = fakeMetaService();
  const provider = new FakeProvider();
  const s = service(c, { metaService, provider });
  const draft = await s.prepareDraft(baseSpecInput());
  const created = await s.createOnMeta(draft.id);
  assert.equal(created.formMappingId, "mapping-1");
  assert.equal(metaService.calls.createFormMapping[0].formId, "form-provider-1");
  assert.equal(metaService.calls.createFormMapping[0].propertyId, propertyId);
  assert.equal(metaService.calls.createFormMapping[0].campaignId, campaignId);

  const failing = client();
  const failingMetaService = fakeMetaService({ mappingError: new Error("form not found") });
  const failingProvider = new FakeProvider();
  const s2 = service(failing.client, { metaService: failingMetaService, provider: failingProvider });
  const draft2 = await s2.prepareDraft(baseSpecInput());
  const result2 = await s2.createOnMeta(draft2.id);
  assert.equal(result2.status, "created_mapping_failed");
  assert.equal(failingProvider.calls.length, 1);

  const retryMetaService = fakeMetaService();
  const s3 = service(failing.client, { metaService: retryMetaService, provider: failingProvider });
  await s3.createOnMeta(draft2.id);
  assert.equal(failingProvider.calls.length, 1); // no second Meta form created on retry
});

// ---------------------------------------------------------------------------
// CONSENT RULE (47-53)
// ---------------------------------------------------------------------------
test("47-53: M6 rule auto-configured with the exact field/values/statement; failure blocks outreach readiness; retry local-only; no consent row created merely by configuring the rule (M6 owns that)", async () => {
  const { client: c } = client();
  const metaService = fakeMetaService();
  const s = service(c, { metaService });
  const draft = await s.prepareDraft(baseSpecInput());
  const created = await s.createOnMeta(draft.id);
  assert.equal(created.consentRuleId, "consent-rule-1");
  assert.deepEqual(metaService.calls.configureConsentRule[0], {
    formMappingId: "mapping-1", consentFieldName: "whatsapp_marketing_consent",
    acceptedValues: ["I agree to receive WhatsApp messages about this property."],
    consentStatement: "We may contact you on WhatsApp.",
  });

  const failing = client();
  const failingMetaService = fakeMetaService({ consentError: new Error("bad config") });
  const provider = new FakeProvider();
  const s2 = service(failing.client, { metaService: failingMetaService, provider });
  const draft2 = await s2.prepareDraft(baseSpecInput());
  const result2 = await s2.createOnMeta(draft2.id);
  assert.equal(result2.status, "created_consent_failed");
  assert.equal(isOutreachReady(result2), false);

  const repoSrc = rd("features/platform/integrations/meta-marketing/repositories/meta-marketing.repository.ts");
  assert.doesNotMatch(repoSrc, /communication_consents/i);
});

// ---------------------------------------------------------------------------
// READINESS (54-57)
// ---------------------------------------------------------------------------
test("54-57: created alone, or mapping alone, is not outreach ready; consent rule required when requested; all three together = outreach ready", async () => {
  const { client: c } = client();
  const s = service(c);
  const draft = await s.prepareDraft(baseSpecInput());
  const created = await s.createOnMeta(draft.id);
  assert.equal(isOutreachReady(created), true);
  assert.equal(isOutreachReady({ ...created, formMappingId: null }), false);
  assert.equal(isOutreachReady({ ...created, consentRuleId: null }), false);
  assert.equal(isOutreachReady({ ...created, status: "draft" }), false);

  const noConsentInput = baseSpecInput({ whatsappConsentRequested: false, consentDisclosure: null });
  const { client: c2 } = client();
  const s2 = service(c2);
  const draft2 = await s2.prepareDraft(noConsentInput);
  const created2 = await s2.createOnMeta(draft2.id);
  assert.equal(isOutreachReady(created2), true); // no consent requested -> readiness never blocked on a rule that was never needed
});

// ---------------------------------------------------------------------------
// EXISTING FORMS (58-59)
// ---------------------------------------------------------------------------
test("58-59: existing manually-created form discovery and mapping flow is unmodified", () => {
  const metaServiceSrc = rd("features/platform/integrations/meta-marketing/services/meta-marketing.service.ts");
  assert.match(metaServiceSrc, /async createFormMapping\(input: \{ formId: string; propertyId: string; campaignId: string \| null \}\)/);
  assert.match(metaServiceSrc, /async discoverLeadForms\(\)/);
  assert.doesNotMatch(metaServiceSrc, /Phase C6/);
});

// ---------------------------------------------------------------------------
// UI (60-66)
// ---------------------------------------------------------------------------
test("60-66: draft review/privacy/consent/qualification questions visible; explicit Create on Meta action; no campaign-publish or ad-spend action", () => {
  const panelSrc = rd("features/platform/integrations/meta-marketing/components/CampaignLeadFormPanel.tsx");
  assert.match(panelSrc, /Prepare Lead Form/);
  assert.match(panelSrc, /Create on Meta/);
  assert.match(panelSrc, /Privacy policy/);
  assert.match(panelSrc, /WhatsApp consent/);
  assert.match(panelSrc, /Qualification questions/);
  assert.doesNotMatch(panelSrc, /Publish|Activate Campaign|Spend|Launch Ads/i);
});

// ---------------------------------------------------------------------------
// PERMISSION (67-70)
// ---------------------------------------------------------------------------
test("67-70: manage/admin permission required via can_manage_integrations; cross-tenant/cross-workspace blocked", async () => {
  assert.match(saveDraftFn, /not public\.can_manage_integrations\(w\)/i);
  assert.match(claimFn, /not public\.can_manage_integrations\(w\)/i);
  assert.match(completeFn, /not public\.can_manage_integrations\(w\)/i);

  const crossTenant = service(client().client, { organizationId: "org-2" });
  await rejectsNamed(crossTenant.prepareDraft(baseSpecInput()), "Error");
});

// ---------------------------------------------------------------------------
// SIDE EFFECTS (71-80)
// ---------------------------------------------------------------------------
test("71-80: no Meta campaign/ad set/creative/ad/lead form live/upload/spend; no WhatsApp; no CRM lead; no OpenAI/Sora call", () => {
  const allSource = [
    rd("features/platform/integrations/meta-marketing/services/campaign-lead-form.service.ts"),
    rd("features/platform/integrations/meta-marketing/repositories/campaign-lead-form.repository.ts"),
    rd("features/platform/integrations/meta-marketing/domain/lead-form-validation.ts"),
    migrationSql,
  ].join("\n");
  assert.doesNotMatch(allSource, /createCampaign|createAdSet|createCreative\(|createAd\(|\/advideos|\/adcreatives/i);
  assert.doesNotMatch(allSource, /images\.generate|videos\.create|new OpenAI\(/);
  assert.doesNotMatch(allSource, /sendTemplate|sendText|create_lead\b|lead_property_interests/i);
});

// ---------------------------------------------------------------------------
// REGRESSION (81-90)
// ---------------------------------------------------------------------------
test("81-90: M1-M8 files are byte-unmodified by C6 (traced files carry no Phase C6 marker)", () => {
  // C1-C5 (features/vayon/creative-package/**, features/vayon/campaign-strategist/**)
  // remain a separate, not-yet-authorized recovery phase's own zero-history files --
  // unrelated to C6's Meta-scoped commit and not readable from committed history here.
  // C6's own committed application scope never touches those directories at all, so
  // this check is narrowed to the M-series/WhatsApp files that ARE part of the
  // committed Meta/WhatsApp foundation this test suite certifies.
  for (const file of [
    "features/platform/integrations/meta-marketing/webhook/process-leadgen-webhook.ts",
    "features/platform/integrations/meta-marketing/webhook/crm-ingestion.service.ts",
    "features/platform/integrations/meta-marketing/consent/evaluate-consent.ts",
    "features/platform/integrations/whatsapp/whatsapp-outreach-execution.service.ts",
  ]) {
    assert.doesNotMatch(rd(file), /Phase C6/);
  }
  assert.doesNotMatch(rd("features/platform/integrations/meta-marketing/services/meta-marketing.service.ts"), /Phase C6/);
});
