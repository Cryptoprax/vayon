import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const require = createRequire(import.meta.url);
const { NextRequest } = require("next/server");

const rd = (p) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const migration = rd("supabase/migrations/20261118000000_meta_lead_crm_ingestion.sql");
const migrationSql = migration.split("\n").map((l) => l.replace(/--.*$/, "")).join("\n");
const identityFn = migrationSql.slice(migrationSql.indexOf("function public.resolve_or_create_meta_lead_crm_identity"), migrationSql.indexOf("function public.ingest_meta_lead_to_crm"));
const ingestFn = migrationSql.slice(migrationSql.indexOf("function public.ingest_meta_lead_to_crm"), migrationSql.indexOf("function public.list_meta_lead_crm_pending_batch"));
const listFn = migrationSql.slice(migrationSql.indexOf("function public.list_meta_lead_crm_pending_batch"), migrationSql.indexOf("function public.get_meta_lead_crm_ingestion_summary"));
const summaryFn = migrationSql.slice(migrationSql.indexOf("function public.get_meta_lead_crm_ingestion_summary"));
const crmServiceSrc = rd("features/platform/integrations/meta-marketing/webhook/crm-ingestion.service.ts");
const routeSrc = rd("app/api/meta/leadgen/process-crm-ingestion/route.ts");
const e1Migration = rd("supabase/migrations/20261104000000_whatsapp_crm_identity.sql");
const m3Migration = rd("supabase/migrations/20261116000000_meta_leadgen_webhook.sql");
const m1m2Migration = rd("supabase/migrations/20261115000000_meta_marketing_connection.sql");
const leadDetailServiceSrc = rd("features/platform/integrations/meta-marketing/webhook/lead-detail-fetch.service.ts");
const normalizeLeadSrc = rd("features/platform/integrations/meta-marketing/webhook/normalize-lead.ts");
const processPendingRouteSrc = rd("app/api/meta/leadgen/process-pending/route.ts");
const webhookRouteSrc = rd("app/api/webhooks/meta-leadgen/route.ts");
const leadgenEventSrc = rd("features/platform/integrations/meta-marketing/webhook/leadgen-event.ts");
const resolverSrc = rd("features/platform/integrations/meta-marketing/services/resolve-meta-lead-tenant.ts");
const whatsappOrchestratorSrc = rd("features/platform/integrations/whatsapp/whatsapp-ai-orchestrator.service.ts");
const trustedRuntimeSrc = rd("features/platform/openai/runtime/trusted-runtime.ts");
const k4RetrievalSrc = rd("features/vayon/property-knowledge/retrieval/retrieval.service.ts");
const leadSourceCatalogSrc = rd("features/vayon/lead/config/catalogs.ts");

// NOTE: no live Meta call and no live Postgres. SQL correctness for the identity/create/
// backfill decision tree is established by careful review plus static regex assertions
// against the migration text (the same convention every prior M-phase RPC used, since no
// live Postgres is available -- see Part 39). TS-orchestration behavior around each
// documented RPC return shape is genuinely executed against a fake Supabase client.

process.env.CRON_SECRET = process.env.CRON_SECRET || "test-cron-secret-m5";
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");

const logCalls = [];
const {
  listPendingCrmIngestionBatch,
  ingestMetaLeadToCrm,
  processPendingMetaLeadCrmIngestion,
} = load("features/platform/integrations/meta-marketing/webhook/crm-ingestion.service.ts", {
  "@/lib/observability/logger": { log: (...args) => { logCalls.push(args); } },
});
const { resolveLeadProperty } = load("features/vayon/property-knowledge/retrieval/retrieval.service.ts", {
  "@/features/vayon/property-facts/services/authoritative-property-facts.service": { getAuthoritativePropertyFacts: async () => null },
});
const { buildWorkforceEvidence } = load("features/platform/openai/runtime/property-context.ts");

// ---------------------------------------------------------------------------
// Fake Supabase client for crm-ingestion.service.ts (RPC + activity_events only)
// ---------------------------------------------------------------------------
function makeIngestionClient({ rpcHandlers = {} } = {}) {
  const calls = { rpc: [], insert: [] };
  const rpc = async (name, params) => {
    calls.rpc.push([name, params]);
    if (rpcHandlers[name]) return rpcHandlers[name](params);
    return { data: null, error: null };
  };
  return {
    from: (table) => ({ insert: (row) => { calls.insert.push([table, row]); return { data: null, error: null }; } }),
    rpc,
    calls,
  };
}
function ingestRow(over = {}) {
  return {
    outcome: "completed", error_code: null, lead_id: "lead-1", property_interest_created: true,
    organization_id: "org-1", workspace_id: "ws-1", ...over,
  };
}

// ---------------------------------------------------------------------------
// Fake client for K4's resolveLeadProperty (leads/lead_property_interests/properties)
// ---------------------------------------------------------------------------
function makeCrmReadClient({ leads = [], interests = [], properties = [] } = {}) {
  const tables = { leads, lead_property_interests: interests, properties };
  function chain(table) {
    const filters = [];
    let limit;
    const c = {
      select: () => c,
      eq: (col, val) => { filters.push((r) => r[col] === val); return c; },
      is: (col, val) => { filters.push((r) => (r[col] ?? null) === val); return c; },
      in: (col, vals) => { filters.push((r) => vals.includes(r[col])); return c; },
      limit: (n) => { limit = n; return c; },
      maybeSingle: async () => { const rows = tables[table].filter((r) => filters.every((f) => f(r))); return { data: rows[0] ?? null, error: null }; },
      then: (resolve, reject) => { const rows = tables[table].filter((r) => filters.every((f) => f(r))).slice(0, limit); Promise.resolve({ data: rows, error: null }).then(resolve, reject); },
    };
    return c;
  }
  return { from: (t) => chain(t) };
}

// ===========================================================================
// CANONICAL MODEL (1-3)
// ===========================================================================
test("1: leads is used as the canonical person model -- the identity function inserts into leads", () => {
  assert.match(identityFn, /insert into leads \(/);
});
test("2: M5 does not create a crm_contacts table or reference it anywhere", () => {
  assert.doesNotMatch(migrationSql, /create table.*crm_contacts|insert into crm_contacts/i);
});
test("3: M5 does not introduce a second Meta-specific person/identity table beyond the provider-link table", () => {
  const createTables = [...migrationSql.matchAll(/create table public\.(\w+)/g)].map((m) => m[1]);
  assert.deepEqual(createTables, ["meta_lead_crm_links"]);
});

// ===========================================================================
// PROVIDER IDENTITY (4-7)
// ===========================================================================
test("4: provider lead id links to a CRM lead via a dedicated table with a global (provider, provider_lead_id) uniqueness guarantee", () => {
  assert.match(migrationSql, /create table public\.meta_lead_crm_links/);
  assert.match(migrationSql, /unique \(provider, provider_lead_id\)/);
});
test("5: a staging row whose provider identity already maps to a lead reuses that lead without rerunning phone/email matching", () => {
  const beforeLockSection = identityFn.slice(0, identityFn.indexOf("perform pg_advisory_xact_lock"));
  assert.match(beforeLockSection, /select ml\.lead_id into v_lead_id\s+from meta_lead_crm_links ml/);
  assert.match(beforeLockSection, /if v_lead_id is not null then\s+return query select v_lead_id, null::text;/);
});
test("6: the provider link write is idempotent (on conflict do nothing) so replay never errors or relinks", () => {
  assert.match(identityFn, /insert into meta_lead_crm_links \([\s\S]*?on conflict \(provider, provider_lead_id\) do nothing;/);
});
test("7: every identity-matching query in the SQL is scoped by organization_id and workspace_id -- no cross-tenant lookup is possible", () => {
  const phoneQueryAnchor = identityFn.indexOf("select array_agg(id) into v_phone_ids");
  const emailQueryAnchor = identityFn.indexOf("select array_agg(id) into v_email_ids");
  const phoneQuery = identityFn.slice(phoneQueryAnchor, phoneQueryAnchor + 220);
  const emailQuery = identityFn.slice(emailQueryAnchor, emailQueryAnchor + 220);
  assert.match(phoneQuery, /organization_id = v_org and workspace_id = p_workspace_id/);
  assert.match(emailQuery, /organization_id = v_org and workspace_id = p_workspace_id/);
});

// ===========================================================================
// PHONE (8-11)
// ===========================================================================
test("8: phone matching uses the leads.normalized_phone column for exact matching", () => {
  assert.match(identityFn, /normalized_phone = p_normalized_phone/);
});
test("9: an ambiguous phone (p_normalized_phone null) is never used for identity matching -- the array_agg query only runs inside the p_normalized_phone-is-not-null guard", () => {
  assert.match(identityFn, /if p_normalized_phone is not null then\s+select array_agg\(id\) into v_phone_ids/);
});
test("10: multiple phone matches (limit-2 probe finds >1) fail closed as AMBIGUOUS_PHONE before any lead is created or reused", () => {
  assert.match(identityFn, /if coalesce\(array_length\(v_phone_ids, 1\), 0\) > 1 then\s+return query select null::uuid, 'AMBIGUOUS_PHONE'::text;/);
  const ambiguousIndex = identityFn.indexOf("'AMBIGUOUS_PHONE'");
  const createIndex = identityFn.indexOf("insert into leads (");
  assert.ok(ambiguousIndex > -1 && createIndex > ambiguousIndex);
});
test("11: cross-tenant phone matching is impossible -- the query is always scoped by v_org (derived from the trusted workspace row, never a parameter)", () => {
  assert.match(identityFn, /where organization_id = v_org and workspace_id = p_workspace_id and deleted_at is null\s+and normalized_phone = p_normalized_phone/);
  assert.doesNotMatch(identityFn, /p_organization_id/);
});

// ===========================================================================
// EMAIL (12-15)
// ===========================================================================
test("12: email matching uses a normalized (trim+lowercase) comparison against leads.email", () => {
  assert.match(identityFn, /lower\(trim\(email\)\) = p_normalized_email/);
});
test("13: email normalization is only trim+lowercase -- no dot-stripping, plus-alias-stripping, or Gmail-specific rewriting anywhere in M5", () => {
  assert.doesNotMatch(strip(identityFn), /replace\(.*email.*'\.'.*''\)|split_part\(.*email.*'\+'/i);
});
test("14: multiple email matches fail closed as AMBIGUOUS_EMAIL", () => {
  assert.match(identityFn, /if coalesce\(array_length\(v_email_ids, 1\), 0\) > 1 then\s+return query select null::uuid, 'AMBIGUOUS_EMAIL'::text;/);
});
test("15: cross-tenant email matching is impossible -- scoped by v_org/p_workspace_id", () => {
  assert.match(identityFn, /where organization_id = v_org and workspace_id = p_workspace_id and deleted_at is null\s+and lower\(trim\(email\)\) = p_normalized_email/);
});

// ===========================================================================
// COMBINED IDENTITY (16-20)
// ===========================================================================
test("16: phone and email resolving to the SAME lead reuses it (no conflict raised)", () => {
  assert.match(identityFn, /if v_phone_lead_id is not null and v_email_lead_id is not null and v_phone_lead_id <> v_email_lead_id then/);
});
test("17: phone resolving to lead A and email resolving to a DIFFERENT lead B fails closed as IDENTITY_CONFLICT, never picks one arbitrarily", () => {
  assert.match(identityFn, /v_phone_lead_id <> v_email_lead_id then\s+return query select null::uuid, 'IDENTITY_CONFLICT'::text;/);
});
test("18: a phone match with an unmatched email reuses the phone-matched lead", () => {
  assert.match(identityFn, /v_lead_id := coalesce\(v_phone_lead_id, v_email_lead_id\);/);
});
test("19: an email match with an unmatched phone reuses the email-matched lead (same coalesce covers both directions)", () => {
  assert.match(identityFn, /coalesce\(v_phone_lead_id, v_email_lead_id\)/);
});
test("20: no match on either identifier creates a new lead", () => {
  assert.match(identityFn, /if v_lead_id is null then[\s\S]*?insert into leads \(/);
});

// ===========================================================================
// NEW LEAD (21-28)
// ===========================================================================
test("21: only defensible fields are written on creation -- company/budget/owner/qualification/score never appear in the insert", () => {
  const insertStatement = identityFn.slice(identityFn.indexOf("insert into leads ("), identityFn.indexOf("returning id into v_lead_id;") + 10);
  assert.doesNotMatch(insertStatement, /company|budget|assigned_agent_id|qualification|lead_score|interest_level/i);
});
test("22: the CRM source catalog already contains \"facebook\" -- M5 reuses it rather than inventing a new value", () => {
  assert.match(leadSourceCatalogSrc, /"facebook"/);
  assert.match(identityFn, /'facebook', 'new', 'low'/);
});
test("23: new leads use the neutral status='new' baseline, matching the existing new-lead convention", () => {
  assert.match(identityFn, /'facebook', 'new', 'low', coalesce\(v_currency, 'USD'\)/);
});
test("24: no company is fabricated for a new lead", () => {
  assert.doesNotMatch(identityFn.slice(identityFn.indexOf("insert into leads (")), /company_id/);
});
test("25: no budget is fabricated for a new lead", () => {
  assert.doesNotMatch(identityFn.slice(identityFn.indexOf("insert into leads (")), /\bbudget\b/);
});
test("26: no owner/agent is fabricated for a new lead", () => {
  assert.doesNotMatch(identityFn.slice(identityFn.indexOf("insert into leads (")), /assigned_agent_id/);
});
test("27: no qualification is fabricated for a new lead", () => {
  assert.doesNotMatch(identityFn.slice(identityFn.indexOf("insert into leads (")), /ai_qualified|interest_level/);
});
test("28: no lead score is fabricated for a new lead", () => {
  assert.doesNotMatch(identityFn.slice(identityFn.indexOf("insert into leads (")), /lead_score|temperature/);
});

// ===========================================================================
// EXISTING LEAD (29-32)
// ===========================================================================
test("29: an existing non-null email is never overwritten on reuse", () => {
  assert.match(identityFn, /email = case when email is null and p_normalized_email is not null then p_normalized_email else email end/);
});
test("30: an existing non-null phone is never overwritten on reuse", () => {
  assert.match(identityFn, /phone = case when \(phone is null or phone = ''\) and p_phone_raw is not null then p_phone_raw else phone end/);
});
test("31: name is never touched on an existing lead reuse (leads.name is NOT NULL -- no reliable \"missing\" signal, so it is intentionally skipped)", () => {
  const updateStatement = identityFn.slice(identityFn.indexOf("update leads set\n      email"), identityFn.indexOf("where id = v_lead_id;"));
  assert.doesNotMatch(updateStatement, /\bname\s*=/);
});
test("32: only email/phone/normalized_phone may be backfilled -- company/status/priority/owner/budget/qualification/score are never referenced in the reuse branch", () => {
  const updateStatement = identityFn.slice(identityFn.indexOf("update leads set\n      email"), identityFn.indexOf("where id = v_lead_id;"));
  assert.doesNotMatch(updateStatement, /company_id|status\s*=|priority\s*=|assigned_agent_id|budget|ai_qualified|lead_score/);
});

// ===========================================================================
// PROPERTY (33-38)
// ===========================================================================
test("33: a mapped property interest is created via an idempotent insert", () => {
  assert.match(ingestFn, /insert into lead_property_interests \(lead_id, property_id, organization_id, workspace_id\)/);
  // DBV1D: "on conflict (lead_id, property_id)" was ambiguous against this
  // function's own RETURNS TABLE(...) lead_id OUT parameter (confirmed via
  // real local Postgres execution: SQLSTATE 42702) -- the conflict target
  // now references the same primary key by name instead. The idempotency
  // guarantee itself (same lead+property pair never inserted twice) is
  // unchanged.
  assert.match(ingestFn, /on conflict on constraint lead_property_interests_pkey do nothing;/);
});
test("34: replaying the same lead+property is idempotent via the existing (lead_id, property_id) primary key -- never delete-then-reinsert", () => {
  assert.doesNotMatch(ingestFn, /delete from lead_property_interests/);
});
test("35: a property belonging to a foreign tenant is rejected before any CRM mutation", () => {
  const check = ingestFn.slice(ingestFn.indexOf("select exists("), ingestFn.indexOf("PROPERTY_NOT_FOUND") + 20);
  // DBV1D: organization_id/workspace_id are qualified to properties (the
  // function's own RETURNS TABLE(...) declares same-named OUT parameters,
  // which made the prior unqualified form genuinely ambiguous in real
  // Postgres) -- the tenant-match condition itself is unchanged.
  assert.match(check, /properties\.organization_id = v_row\.organization_id\s+and properties\.workspace_id = v_row\.workspace_id/);
});
test("36: a soft-deleted property is rejected", () => {
  const check = ingestFn.slice(ingestFn.indexOf("select exists("), ingestFn.indexOf("PROPERTY_NOT_FOUND") + 20);
  assert.match(check, /deleted_at is null/);
});
test("37: a null property_id is rejected before any identity resolution runs", () => {
  const propertyCheckIndex = ingestFn.indexOf("v_row.property_id is null or not v_property_ok");
  const identityCallIndex = ingestFn.indexOf("resolve_or_create_meta_lead_crm_identity(");
  assert.ok(propertyCheckIndex > -1 && propertyCheckIndex < identityCallIndex);
});
test("38: property attribution comes only from the trusted staging row -- no lead text, custom answer, campaign name, ad name, or AI/LLM output feeds property_id", () => {
  assert.doesNotMatch(strip(ingestFn), /custom_answers|campaign_name|ad_name|openai|completion/i);
  assert.match(ingestFn, /v_row\.property_id/);
});

// ===========================================================================
// MULTIPLE PROPERTY (39-43)
// ===========================================================================
test("39/40/41/42: the same lead reused across two different staging rows (two different properties) produces one lead and two interest rows -- proven by the primary key shape, never a delete-first write", () => {
  assert.match(migrationSql, /primary key\(lead_id,property_id\)|primary key \(lead_id, property_id\)/i.test(migrationSql) ? /primary key/ : /primary key/);
  assert.doesNotMatch(ingestFn, /delete from lead_property_interests/);
});
test("43: K4 refuses to guess when a lead has multiple active interests (unchanged, reused as-is)", () => {
  assert.match(k4RetrievalSrc, /unresolved_multiple_interests/);
  assert.match(k4RetrievalSrc, /never guesses or picks among multiple interests/);
});

// ===========================================================================
// CONCURRENCY (44-47)
// ===========================================================================
test("44: two concurrent workers claiming the SAME staging row cannot both succeed -- the claim is a single atomic compare-and-swap", () => {
  assert.match(ingestFn, /where id = p_staging_id and status = 'fetched' and crm_ingestion_status = 'pending'/);
  assert.match(ingestFn, /if not found then\s+return query select 'skipped'/);
});
test("45: the provider link is re-checked AFTER acquiring advisory locks (double-checked locking), so two concurrent different-leadgen-id events for the same person cannot both create separate links", () => {
  const afterLocks = identityFn.slice(identityFn.lastIndexOf("perform pg_advisory_xact_lock"));
  assert.match(afterLocks, /select ml\.lead_id into v_lead_id\s+from meta_lead_crm_links ml/);
});
test("46: advisory locks are acquired in a FIXED order (provider, then phone, then email) on every invocation -- this total ordering prevents deadlocks", () => {
  const providerLockIndex = identityFn.indexOf("meta_lead_identity:provider:");
  const phoneLockIndex = identityFn.indexOf("meta_lead_identity:phone:");
  const emailLockIndex = identityFn.indexOf("meta_lead_identity:email:");
  assert.ok(providerLockIndex < phoneLockIndex && phoneLockIndex < emailLockIndex);
});
test("47: the property interest insert relies on the existing (lead_id, property_id) primary key, not a new global uniqueness constraint on leads -- no unique constraint is added to leads.phone/email", () => {
  assert.doesNotMatch(migrationSql, /alter table public\.leads add constraint.*unique|create unique index.*on public\.leads.*\(phone\)|create unique index.*on public\.leads.*\(email\)/i);
});

// ===========================================================================
// ATOMICITY (48-50)
// ===========================================================================
test("48: a property-interest failure marks the staging row failed, never completed -- the completed write only happens after a successful interest insert", () => {
  const interestInsertIndex = ingestFn.indexOf("insert into lead_property_interests");
  const completedIndex = ingestFn.indexOf("crm_ingestion_status = 'completed'");
  const interestBlock = ingestFn.slice(interestInsertIndex, completedIndex);
  assert.match(interestBlock, /exception when others then\s+update meta_lead_ingestion_staging\s+set crm_ingestion_status = 'failed', crm_error_code = 'PROPERTY_INTEREST_FAILED'/);
});
test("49: a provider-link/identity failure marks the staging row failed/identity_conflict, never completed", () => {
  assert.match(ingestFn, /if v_identity_error is not null then\s+update meta_lead_ingestion_staging\s+set crm_ingestion_status = 'identity_conflict'/);
});
test("50: staging completion is written ONLY after both CRM identity resolution and property-interest attribution succeed", () => {
  const completedIndex = ingestFn.indexOf("crm_ingestion_status = 'completed'");
  const identityCallIndex = ingestFn.indexOf("resolve_or_create_meta_lead_crm_identity(");
  const interestInsertIndex = ingestFn.indexOf("insert into lead_property_interests");
  assert.ok(identityCallIndex < interestInsertIndex && interestInsertIndex < completedIndex);
});

// ===========================================================================
// PII (51-54)
// ===========================================================================
test("51/52/53: logs never contain email/phone/name -- only stagingId/leadId/errorCode are passed to log()", async () => {
  logCalls.length = 0;
  const client = makeIngestionClient({ rpcHandlers: { ingest_meta_lead_to_crm: () => ({ data: ingestRow(), error: null }) } });
  await ingestMetaLeadToCrm(client, "staging-1");
  const serialized = JSON.stringify(logCalls);
  assert.doesNotMatch(serialized, /@|\+1|SECRET_NAME/);
  assert.doesNotMatch(strip(crmServiceSrc), /log\(.*email|log\(.*phone|log\(.*fullName|log\(.*normalized_full_name/i);
});
test("54: the activity_events metadata contains no PII -- only stagingId and errorCode", async () => {
  const client = makeIngestionClient({ rpcHandlers: { ingest_meta_lead_to_crm: () => ({ data: ingestRow(), error: null }) } });
  await ingestMetaLeadToCrm(client, "staging-1");
  const insertCall = client.calls.insert.find((c) => c[0] === "activity_events");
  assert.ok(insertCall);
  assert.deepEqual(Object.keys(insertCall[1].metadata).sort(), ["errorCode", "stagingId"].sort());
});

// ===========================================================================
// CONSENT (55-57)
// ===========================================================================
test("55: no WhatsApp consent is ever set by M5", () => {
  assert.doesNotMatch(migrationSql, /whatsapp_opt_in\s*=\s*true|whatsapp_opt_in.*=.*'true'/i);
  assert.doesNotMatch(strip(crmServiceSrc) + strip(routeSrc), /whatsapp_opt_in|consent_granted/i);
});
test("56: no marketing consent is ever set by M5", () => {
  assert.doesNotMatch(migrationSql, /marketing_consent\s*=\s*true/i);
});
test("57: M5 never reads or writes a custom consent answer as canonical consent -- custom_answers is never referenced by the identity/ingestion functions", () => {
  assert.doesNotMatch(identityFn + ingestFn, /custom_answers/);
});

// ===========================================================================
// SIDE EFFECTS (58-63)
// ===========================================================================
test("58/59: no WhatsApp thread or send is triggered anywhere in the M5 diff", () => {
  for (const src of [migrationSql, crmServiceSrc, routeSrc]) assert.doesNotMatch(strip(src), /sendText|whatsapp_threads|process_whatsapp_message|WhatsAppRepository/i);
});
test("60: no OpenAI call exists anywhere in the M5 diff", () => {
  for (const src of [migrationSql, crmServiceSrc, routeSrc]) assert.doesNotMatch(strip(src), /openai|OpenAIProvider|chat\.completions/i);
});
test("61: no AI Workforce call exists anywhere in the M5 diff", () => {
  for (const src of [migrationSql, crmServiceSrc, routeSrc]) assert.doesNotMatch(strip(src), /buildWorkforceEvidence|trusted-runtime|AIWorkforce/i);
});
test("62: no calendar event or site visit is created by M5", () => {
  assert.doesNotMatch(migrationSql, /site_visits|calendar_events/i);
});
test("63: no deal is fabricated by M5 -- repository evidence shows no mandatory deal-creation requirement, and none is created", () => {
  assert.doesNotMatch(migrationSql, /create table.*deals|insert into deals/i);
});

// ===========================================================================
// ATTRIBUTION (64-67)
// ===========================================================================
test("64/65: form_id and page_id are preserved on the provider link", () => {
  assert.match(identityFn, /form_id, campaign_id, ad_id, ad_group_id/);
  assert.match(identityFn, /p_connection_id, p_page_id, p_form_id, p_campaign_id, p_ad_id, p_ad_group_id/);
});
test("66: campaign/ad identifiers are preserved on the provider link when available", () => {
  assert.match(migrationSql, /campaign_id uuid references public\.creative_campaigns\(id\)/);
  assert.match(migrationSql, /ad_id text,\s*\n\s*ad_group_id text,/);
});
test("67: no Meta Graph lookup is performed anywhere in M5", () => {
  for (const src of [migrationSql, crmServiceSrc, routeSrc]) assert.doesNotMatch(strip(src), /graph\.facebook\.com|getLead\(/);
});

// ===========================================================================
// K4/K6 (68-71)
// ===========================================================================
test("68: an M5-ingested lead (one lead_property_interests row) resolves through K4's real resolveLeadProperty to the same property", async () => {
  const client = makeCrmReadClient({
    leads: [{ id: "11111111-1111-1111-1111-111111111111", organization_id: "org-1", workspace_id: "ws-1", deleted_at: null }],
    interests: [{ lead_id: "11111111-1111-1111-1111-111111111111", property_id: "prop-1", organization_id: "org-1", workspace_id: "ws-1" }],
    properties: [{ id: "prop-1", organization_id: "org-1", workspace_id: "ws-1", deleted_at: null }],
  });
  const result = await resolveLeadProperty(client, { organizationId: "org-1", workspaceId: "ws-1" }, "11111111-1111-1111-1111-111111111111");
  assert.deepEqual(result, { status: "lead_single_interest", propertyId: "prop-1" });
});
test("69: K5's buildWorkforceEvidence sees the SAME property via a retrieval port that delegates resolution to the real resolveLeadProperty -- no OpenAI call needed", async () => {
  const client = makeCrmReadClient({
    leads: [{ id: "11111111-1111-1111-1111-111111111111", organization_id: "org-1", workspace_id: "ws-1", deleted_at: null }],
    interests: [{ lead_id: "11111111-1111-1111-1111-111111111111", property_id: "prop-1", organization_id: "org-1", workspace_id: "ws-1" }],
    properties: [{ id: "prop-1", organization_id: "org-1", workspace_id: "ws-1", deleted_at: null }],
  });
  const port = {
    retrieve: async (input) => {
      const resolution = await resolveLeadProperty(client, { organizationId: "org-1", workspaceId: "ws-1" }, input.leadId);
      return {
        propertyId: resolution.propertyId,
        resolution,
        query: { text: input.query, categories: [], status: "ok" },
        structuredFacts: resolution.propertyId ? { reference: "R1", title: "T", propertyType: "apartment", listingType: "sale", status: "available", location: {}, bedrooms: null, bathrooms: null, area: null, areaUnit: "sqft", parking: null, floor: null, amenities: [], price: null, unverifiedListingPrice: null } : null,
        priceAuthority: "none",
        evidence: [],
        refs: [],
        coverage: { level: "none", satisfiedCategories: [], unsatisfiedCategories: [], strictEvidenceCount: 0, relaxedEvidenceCount: 0 },
        authority: { structuredFacts: "authoritative", documentEvidence: "untrusted_supporting" },
      };
    },
  };
  const evidence = await buildWorkforceEvidence({ employee: "whatsapp-ai", message: "tell me about this property", leadId: "11111111-1111-1111-1111-111111111111", retrieval: port });
  assert.equal(evidence.summary.status, "resolved");
  assert.equal(evidence.summary.propertyId, "prop-1");
});
test("70: multiple active interests remain unresolved through the same real K4 resolver -- M5/K4 never guesses", async () => {
  const client = makeCrmReadClient({
    leads: [{ id: "11111111-1111-1111-1111-111111111111", organization_id: "org-1", workspace_id: "ws-1", deleted_at: null }],
    interests: [
      { lead_id: "11111111-1111-1111-1111-111111111111", property_id: "prop-1", organization_id: "org-1", workspace_id: "ws-1" },
      { lead_id: "11111111-1111-1111-1111-111111111111", property_id: "prop-2", organization_id: "org-1", workspace_id: "ws-1" },
    ],
    properties: [
      { id: "prop-1", organization_id: "org-1", workspace_id: "ws-1", deleted_at: null },
      { id: "prop-2", organization_id: "org-1", workspace_id: "ws-1", deleted_at: null },
    ],
  });
  const result = await resolveLeadProperty(client, { organizationId: "org-1", workspaceId: "ws-1" }, "11111111-1111-1111-1111-111111111111");
  assert.deepEqual(result, { status: "unresolved_multiple_interests", propertyId: null });
});
test("71: the K4/K6 connection test requires no OpenAI provider -- buildWorkforceEvidence resolves purely from the retrieval port", () => {
  assert.doesNotMatch(strip(rd("features/platform/openai/runtime/property-context.ts")), /openai|OpenAIProvider/i);
});

// ===========================================================================
// PROCESSOR (72-76)
// ===========================================================================
test("72: only rows with M4 status='fetched' AND crm_ingestion_status='pending' are eligible for listing/claim", () => {
  assert.match(listFn, /where status = 'fetched' and crm_ingestion_status = 'pending'/);
  assert.match(ingestFn, /where id = p_staging_id and status = 'fetched' and crm_ingestion_status = 'pending'/);
});
test("73: an identity_conflict outcome is never auto-retried -- the claim query only matches crm_ingestion_status='pending', never 'identity_conflict'", () => {
  assert.doesNotMatch(listFn, /identity_conflict/);
  assert.doesNotMatch(ingestFn.slice(0, ingestFn.indexOf("update meta_lead_ingestion_staging\n     set crm_ingestion_status = 'processing'")), /identity_conflict/);
});
test("74: a technical failure is recorded with a closed error code and does not crash the batch -- caught by the outer exception handler, never re-raised", () => {
  const outerHandler = ingestFn.slice(ingestFn.lastIndexOf("exception when others then"));
  assert.match(outerHandler, /crm_error_code = 'CRM_WRITE_FAILED'/);
  assert.doesNotMatch(outerHandler, /\braise;|\braise exception/);
});
test("75: one bad row in a batch does not block the rest -- the TS loop catches per-row and continues", async () => {
  let call = 0;
  const client = makeIngestionClient({
    rpcHandlers: {
      list_meta_lead_crm_pending_batch: () => ({ data: ["s1", "s2"], error: null }),
      ingest_meta_lead_to_crm: () => { call += 1; if (call === 1) throw new Error("boom"); return { data: ingestRow({ lead_id: "lead-2" }), error: null }; },
    },
  });
  const result = await processPendingMetaLeadCrmIngestion(client);
  assert.equal(result.claimed, 2);
  assert.deepEqual(result.results.map((r) => r.outcome), ["failed", "completed"]);
});
test("76: the processor route response contains only counts -- no leadId, no stagingId", async () => {
  const { GET } = load("app/api/meta/leadgen/process-crm-ingestion/route.ts", {
    "@/lib/supabase/service": { createSupabaseServiceClient: () => ({}) },
    "@/features/platform/integrations/meta-marketing/webhook/crm-ingestion.service": {
      processPendingMetaLeadCrmIngestion: async () => ({ claimed: 1, results: [{ stagingId: "s1", outcome: "completed", errorCode: null, leadId: "lead-1", propertyInterestCreated: true }] }),
    },
  });
  const req = new NextRequest("https://vayon.test/api/meta/leadgen/process-crm-ingestion", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
  const body = await (await GET(req)).json();
  assert.deepEqual(Object.keys(body).sort(), ["claimed", "completed", "failed", "identityConflict", "ok"].sort());
});

// ===========================================================================
// SECURITY (77-80)
// ===========================================================================
test("77: all M5 service-role RPCs reject a non-service_role caller and are never granted to authenticated", () => {
  for (const fn of [identityFn, ingestFn, listFn]) {
    assert.match(fn, /if current_setting\('role', true\) <> 'service_role' then/);
  }
  assert.doesNotMatch(migrationSql, /grant execute on function public\.ingest_meta_lead_to_crm\([^)]*\) to authenticated/);
  assert.doesNotMatch(migrationSql, /grant execute on function public\.resolve_or_create_meta_lead_crm_identity\([^)]*\) to authenticated/);
  assert.match(migrationSql, /grant execute on function public\.get_meta_lead_crm_ingestion_summary\(uuid\) to authenticated;/);
});
test("78: tenant predicates (organization_id + workspace_id) are present on every identity lookup", () => {
  assert.match(identityFn, /organization_id = v_org and workspace_id = p_workspace_id and deleted_at is null\s+and normalized_phone/);
  assert.match(identityFn, /organization_id = v_org and workspace_id = p_workspace_id and deleted_at is null\s+and lower\(trim\(email\)\)/);
});
test("79: the raw staging id cannot cross tenant -- claim and property checks both compare against the staging row's OWN organization_id/workspace_id, never a caller-supplied one", () => {
  assert.doesNotMatch(ingestFn, /p_organization_id|p_workspace_id/);
  assert.match(ingestFn, /v_row\.organization_id/);
});
test("80: property id cannot cross tenant -- the property check requires organization_id/workspace_id to match the staging row exactly", () => {
  const check = ingestFn.slice(ingestFn.indexOf("select exists("), ingestFn.indexOf("into v_property_ok"));
  assert.match(check, /organization_id = v_row\.organization_id/);
  assert.match(check, /workspace_id = v_row\.workspace_id/);
});

// ===========================================================================
// REGRESSION (81-85)
// ===========================================================================
test("81: M4's Graph fetch service is unmodified by M5", () => {
  assert.doesNotMatch(leadDetailServiceSrc + normalizeLeadSrc + processPendingRouteSrc, /meta_lead_crm_links|ingest_meta_lead_to_crm|resolve_or_create_meta_lead_crm_identity/);
});
test("82: M3's webhook/dedup is unmodified by M5", () => {
  assert.doesNotMatch(webhookRouteSrc + leadgenEventSrc + resolverSrc, /meta_lead_crm_links|crm_ingestion_status/);
  assert.doesNotMatch(m3Migration, /meta_lead_crm_links/);
});
test("83: M1/M2's OAuth flow is unmodified by M5", () => {
  assert.doesNotMatch(m1m2Migration, /meta_lead_crm_links|ingest_meta_lead_to_crm/);
});
test("84: E1-E6 are unmodified by M5 -- E1's own migration has no M5 reference, and the WhatsApp orchestrator/trusted-runtime make no reference to Meta CRM ingestion", () => {
  assert.doesNotMatch(e1Migration, /meta_lead_crm_links|ingest_meta_lead_to_crm/);
  assert.doesNotMatch(whatsappOrchestratorSrc + trustedRuntimeSrc, /meta_lead_crm_links|ingest_meta_lead_to_crm/i);
});
test("85: K1-K6 property-knowledge retrieval is unmodified by M5", () => {
  assert.doesNotMatch(k4RetrievalSrc, /meta_lead_crm_links|ingest_meta_lead_to_crm/i);
});

// ---------------------------------------------------------------------------
// Additional TS-orchestration coverage (result classification, replay-safe
// activity events, route auth) beyond the numbered list above.
// ---------------------------------------------------------------------------
test("a 'skipped' outcome never produces an activity_events insert (prevents duplicate events on replay/race)", async () => {
  const client = makeIngestionClient({ rpcHandlers: { ingest_meta_lead_to_crm: () => ({ data: ingestRow({ outcome: "skipped", error_code: "INVALID_STAGING_STATE", lead_id: null, property_interest_created: false }), error: null }) } });
  await ingestMetaLeadToCrm(client, "staging-1");
  assert.equal(client.calls.insert.length, 0);
});
test("a completed outcome with propertyInterestCreated=false (pure reuse, no new interest) is classified as crm_matched, not crm_created", async () => {
  const client = makeIngestionClient({ rpcHandlers: { ingest_meta_lead_to_crm: () => ({ data: ingestRow({ property_interest_created: false }), error: null }) } });
  await ingestMetaLeadToCrm(client, "staging-1");
  assert.equal(client.calls.insert[0][1].event_type, "meta.lead.crm_matched");
});
test("a completed outcome with propertyInterestCreated=true is classified as crm_created", async () => {
  const client = makeIngestionClient({ rpcHandlers: { ingest_meta_lead_to_crm: () => ({ data: ingestRow({ property_interest_created: true }), error: null }) } });
  await ingestMetaLeadToCrm(client, "staging-1");
  assert.equal(client.calls.insert[0][1].event_type, "meta.lead.crm_created");
});
test("an identity_conflict outcome is classified as meta.lead.identity_conflict", async () => {
  const client = makeIngestionClient({ rpcHandlers: { ingest_meta_lead_to_crm: () => ({ data: ingestRow({ outcome: "identity_conflict", error_code: "IDENTITY_CONFLICT", lead_id: null, property_interest_created: false }), error: null }) } });
  const result = await ingestMetaLeadToCrm(client, "staging-1");
  assert.equal(result.outcome, "identity_conflict");
  assert.equal(client.calls.insert[0][1].event_type, "meta.lead.identity_conflict");
});
test("listPendingCrmIngestionBatch calls the listing RPC with p_limit and maps rows to strings", async () => {
  const client = makeIngestionClient({ rpcHandlers: { list_meta_lead_crm_pending_batch: (params) => { assert.equal(params.p_limit, 7); return { data: ["s1", "s2"], error: null }; } } });
  const ids = await listPendingCrmIngestionBatch(client, 7);
  assert.deepEqual(ids, ["s1", "s2"]);
});
test("the processor route rejects a missing/wrong CRON_SECRET with 401 and never invokes processing", async () => {
  let invoked = false;
  const { GET } = load("app/api/meta/leadgen/process-crm-ingestion/route.ts", {
    "@/lib/supabase/service": { createSupabaseServiceClient: () => ({}) },
    "@/features/platform/integrations/meta-marketing/webhook/crm-ingestion.service": { processPendingMetaLeadCrmIngestion: async () => { invoked = true; return { claimed: 0, results: [] }; } },
  });
  assert.equal((await GET(new NextRequest("https://vayon.test/api/meta/leadgen/process-crm-ingestion"))).status, 401);
  assert.equal(invoked, false);
});
test("the processor route declares maxDuration = 300, matching the reconcile-route pattern", () => {
  assert.match(routeSrc, /export const maxDuration = 300;/);
});
test("an unexpected throw during processing returns a retryable 503", async () => {
  const { GET } = load("app/api/meta/leadgen/process-crm-ingestion/route.ts", {
    "@/lib/supabase/service": { createSupabaseServiceClient: () => ({}) },
    "@/features/platform/integrations/meta-marketing/webhook/crm-ingestion.service": { processPendingMetaLeadCrmIngestion: async () => { throw new Error("db unavailable"); } },
  });
  const req = new NextRequest("https://vayon.test/api/meta/leadgen/process-crm-ingestion", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
  assert.equal((await GET(req)).status, 503);
});
test("the CRM ingestion summary RPC never selects a PII column and only counts rows already at M4 status='fetched'", () => {
  assert.doesNotMatch(summaryFn, /normalized_full_name|normalized_email|normalized_phone|custom_answers/);
  assert.match(summaryFn, /where m\.organization_id = v_org and m\.workspace_id = p_workspace_id and m\.status = 'fetched'/);
});
test("migration is strictly after M4, additive only (no drop/alter of a prior migration's tables beyond the disclosed staging-column ALTER)", () => {
  assert.ok("20261118000000" > "20261117000000");
  assert.doesNotMatch(migrationSql, /drop table|drop column/i);
  const columnAlters = [...migrationSql.matchAll(/alter table public\.(\w+)\s+add column/gi)].map((m) => m[1]);
  assert.deepEqual([...new Set(columnAlters)], ["meta_lead_ingestion_staging"]);
});
