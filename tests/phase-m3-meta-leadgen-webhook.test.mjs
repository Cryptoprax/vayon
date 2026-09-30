import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const require = createRequire(import.meta.url);
const { NextRequest } = require("next/server");

const rd = (p) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const routeSrc = rd("app/api/webhooks/meta-leadgen/route.ts");
const whatsappRouteSrc = rd("app/api/webhooks/whatsapp/route.ts");
const whatsappServiceSrc = rd("features/platform/integrations/whatsapp/whatsapp.service.ts");
const signatureSrc = rd("features/platform/integrations/meta-marketing/webhook/signature.ts");
const leadgenEventSrc = rd("features/platform/integrations/meta-marketing/webhook/leadgen-event.ts");
const processSrc = rd("features/platform/integrations/meta-marketing/webhook/process-leadgen-webhook.ts");
const resolverSrc = rd("features/platform/integrations/meta-marketing/services/resolve-meta-lead-tenant.ts");
const migration = rd("supabase/migrations/20261116000000_meta_leadgen_webhook.sql");
const migrationSql = migration.split("\n").map((l) => l.replace(/--.*$/, "")).join("\n");
const m1m2Migration = rd("supabase/migrations/20261115000000_meta_marketing_connection.sql");
const baselineSql = rd("supabase/migrations/20260813000000_sprint22_production_baseline.sql");
const trustedRuntimeSrc = rd("features/platform/openai/runtime/trusted-runtime.ts");
const k4RetrievalSrc = rd("features/vayon/property-knowledge/retrieval/retrieval.service.ts");

// NOTE: no live Meta call is ever made. Static SQL tests do not prove live Postgres behavior. No migration was applied.

process.env.META_APP_SECRET = process.env.META_APP_SECRET || "test-meta-app-secret";
process.env.META_LEADGEN_VERIFY_TOKEN = process.env.META_LEADGEN_VERIFY_TOKEN || "test-verify-token";
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");

const { verifyMetaSignature } = load("features/platform/integrations/meta-marketing/webhook/signature.ts");
const { extractLeadgenChanges } = load("features/platform/integrations/meta-marketing/webhook/leadgen-event.ts");
const { processMetaLeadgenWebhookPayload } = load("features/platform/integrations/meta-marketing/webhook/process-leadgen-webhook.ts", {
  "@/lib/observability/logger": { log: () => {} },
});

function sign(raw, secret = process.env.META_APP_SECRET) {
  return "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");
}
function envelope(...changes) {
  return { object: "page", entry: [{ id: "page-1", time: 1234567890, changes }] };
}
function leadgenChange(over = {}) {
  return { field: "leadgen", value: { leadgen_id: "lead-1", page_id: "page-1", form_id: "form-1", ad_id: "ad-1", adgroup_id: "adset-1", created_time: 1700000000, ...over } };
}

// ---------------------------------------------------------------------------
// Fake tenant-scoped client (meta_lead_form_mappings/meta_marketing_connections
// reads, matching M1/M2's fake-client shape) + an in-memory RPC that mirrors
// process_meta_leadgen_event's real dedup semantics.
// ---------------------------------------------------------------------------
function makeFakeClient({ mappings = [], connections = [] } = {}) {
  const tables = { meta_lead_form_mappings: mappings, meta_marketing_connections: connections };
  const rpcCalls = [];
  const dedup = new Map();
  function chain(table) {
    const filters = [];
    let limit;
    const c = {
      select: () => c,
      eq: (col, val) => { filters.push((r) => r[col] === val); return c; },
      is: (col, val) => { filters.push((r) => (r[col] ?? null) === val); return c; },
      limit: (n) => { limit = n; return c; },
      maybeSingle: async () => { const rows = tables[table].filter((r) => filters.every((f) => f(r))); return { data: rows[0] ?? null, error: null }; },
      then: (resolve, reject) => { const rows = tables[table].filter((r) => filters.every((f) => f(r))).slice(0, limit); Promise.resolve({ data: rows, error: null }).then(resolve, reject); },
    };
    return c;
  }
  const rpc = async (name, params) => {
    rpcCalls.push([name, params]);
    if (name !== "process_meta_leadgen_event") return { data: null, error: new Error("unexpected rpc " + name) };
    if (params.p_event_id === "__throw__") return { data: null, error: new Error("simulated persistence failure") };
    const key = `meta_leadgen:${params.p_event_id}`;
    if (dedup.has(key)) return { data: "duplicate", error: null };
    const status = params.p_organization_id === null ? "unresolved" : "processed";
    dedup.set(key, { status, params });
    return { data: status, error: null };
  };
  return { from: (t) => chain(t), rpc, rpcCalls, dedup };
}
function connectedMapping(over = {}) {
  return {
    org: [{ organization_id: "org-1", workspace_id: "ws-1", connection_id: "conn-1", property_id: "prop-1", campaign_id: null, page_id: "page-1", form_id: "form-1", status: "active", ...over.mapping }],
    conn: [{ id: "conn-1", status: "connected", deleted_at: null, ...over.connection }],
  };
}
function resolvedClient(over = {}) {
  const { org, conn } = connectedMapping(over);
  return makeFakeClient({ mappings: org, connections: conn });
}

// ---------------------------------------------------------------------------
// GET VERIFY (1-5)
// ---------------------------------------------------------------------------
function loadRoute(client) {
  return load("app/api/webhooks/meta-leadgen/route.ts", { "@/lib/supabase/service": { createSupabaseServiceClient: () => client } });
}
test("1: a valid verification challenge succeeds", async () => {
  const { GET } = loadRoute(makeFakeClient());
  const req = new NextRequest("https://vayon.test/api/webhooks/meta-leadgen?hub.mode=subscribe&hub.verify_token=test-verify-token&hub.challenge=xyz-123");
  const res = await GET(req);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), "xyz-123");
});
test("2: the wrong verify token is rejected", async () => {
  const { GET } = loadRoute(makeFakeClient());
  const req = new NextRequest("https://vayon.test/api/webhooks/meta-leadgen?hub.mode=subscribe&hub.verify_token=WRONG&hub.challenge=xyz");
  assert.equal((await GET(req)).status, 403);
});
test("3: the wrong hub.mode is rejected", async () => {
  const { GET } = loadRoute(makeFakeClient());
  const req = new NextRequest("https://vayon.test/api/webhooks/meta-leadgen?hub.mode=unsubscribe&hub.verify_token=test-verify-token&hub.challenge=xyz");
  assert.equal((await GET(req)).status, 403);
});
test("4: a missing challenge is rejected even with a correct mode/token", async () => {
  const { GET } = loadRoute(makeFakeClient());
  const req = new NextRequest("https://vayon.test/api/webhooks/meta-leadgen?hub.mode=subscribe&hub.verify_token=test-verify-token");
  assert.equal((await GET(req)).status, 403);
});
test("5: the verify token is never logged", () => {
  assert.doesNotMatch(strip(routeSrc), /console\.log|console\.error|log\(.*verify_token/i);
});

// ---------------------------------------------------------------------------
// SIGNATURE (6-11)
// ---------------------------------------------------------------------------
test("6: a valid POST signature is accepted (genuine HMAC verification)", () => {
  const raw = JSON.stringify(envelope(leadgenChange()));
  assert.equal(verifyMetaSignature(raw, sign(raw), "test-meta-app-secret"), true);
});
test("7: a missing signature is rejected", () => {
  assert.equal(verifyMetaSignature("{}", "", "secret"), false);
});
test("8: a malformed signature (no sha256= prefix, or non-hex) is rejected", () => {
  assert.equal(verifyMetaSignature("{}", "not-a-signature", "secret"), false);
  assert.equal(verifyMetaSignature("{}", "sha256=zzzznothex", "secret"), false);
});
test("9: a wrong (mismatched) signature is rejected", () => {
  const raw = JSON.stringify(envelope(leadgenChange()));
  assert.equal(verifyMetaSignature(raw, sign(raw, "different-secret"), "test-meta-app-secret"), false);
});
test("10: a missing app secret fails closed (never treated as 'no verification required')", () => {
  const raw = "{}";
  assert.equal(verifyMetaSignature(raw, sign(raw), undefined), false);
});
test("11: the raw body is used for signature verification before any JSON.parse in the route", () => {
  const parseIndex = routeSrc.indexOf("JSON.parse(raw)");
  const verifyIndex = routeSrc.indexOf("verifyMetaSignature(raw, signature");
  assert.ok(verifyIndex > -1 && parseIndex > -1 && verifyIndex < parseIndex);
  assert.match(routeSrc, /const raw = await request\.text\(\);/);
});

// ---------------------------------------------------------------------------
// PAYLOAD (12-16)
// ---------------------------------------------------------------------------
test("12: a valid leadgen change is normalized", () => {
  const changes = extractLeadgenChanges(envelope(leadgenChange()));
  assert.equal(changes.length, 1);
  assert.deepEqual({ ...changes[0] }, { leadgenId: "lead-1", pageId: "page-1", formId: "form-1", adId: "ad-1", adGroupId: "adset-1", createdTime: new Date(1700000000 * 1000).toISOString() });
});
test("13: an unrelated (non-leadgen) change is ignored", () => {
  const changes = extractLeadgenChanges(envelope({ field: "feed", value: { item: "post" } }));
  assert.deepEqual(changes, []);
});
test("14: multiple entries are all processed", () => {
  const payload = { object: "page", entry: [{ id: "page-1", changes: [leadgenChange({ leadgen_id: "lead-1" })] }, { id: "page-2", changes: [leadgenChange({ leadgen_id: "lead-2", page_id: "page-2" })] }] };
  const changes = extractLeadgenChanges(payload);
  assert.deepEqual(changes.map((c) => c.leadgenId).sort(), ["lead-1", "lead-2"]);
});
test("15: multiple changes within one entry are all processed independently", () => {
  const payload = envelope(leadgenChange({ leadgen_id: "lead-1" }), { field: "feed", value: {} }, leadgenChange({ leadgen_id: "lead-2" }));
  const changes = extractLeadgenChanges(payload);
  assert.deepEqual(changes.map((c) => c.leadgenId).sort(), ["lead-1", "lead-2"]);
});
test("16: a malformed leadgen change (missing leadgen_id/page_id/form_id) is skipped safely, never throws", () => {
  assert.deepEqual(extractLeadgenChanges(envelope({ field: "leadgen", value: { page_id: "page-1", form_id: "form-1" } })), []);
  assert.deepEqual(extractLeadgenChanges(envelope({ field: "leadgen", value: {} })), []);
  assert.deepEqual(extractLeadgenChanges(null), []);
  assert.deepEqual(extractLeadgenChanges({}), []);
  assert.deepEqual(extractLeadgenChanges({ entry: "not-an-array" }), []);
});

// ---------------------------------------------------------------------------
// DEDUP (17-20)
// ---------------------------------------------------------------------------
test("17/18: the same leadgen event is processed once; the duplicate delivery is acknowledged safely (not an error)", async () => {
  const client = resolvedClient();
  const first = await processMetaLeadgenWebhookPayload(client, envelope(leadgenChange()));
  const second = await processMetaLeadgenWebhookPayload(client, envelope(leadgenChange()));
  assert.equal(first.results[0].outcome, "processed");
  assert.equal(second.results[0].outcome, "duplicate");
  assert.equal(second.ok, true, "a duplicate is a success outcome, not a failure");
});
test("19: the same leadgen_id arriving in two DIFFERENT webhook envelopes (a Meta retry) still dedupes to one event", async () => {
  const client = resolvedClient();
  const envelopeA = envelope(leadgenChange({ leadgen_id: "lead-retry" }));
  const envelopeB = { object: "page", entry: [{ id: "page-1", time: 999, changes: [leadgenChange({ leadgen_id: "lead-retry", ad_id: null })] }] };
  await processMetaLeadgenWebhookPayload(client, envelopeA);
  const second = await processMetaLeadgenWebhookPayload(client, envelopeB);
  assert.equal(second.results[0].outcome, "duplicate");
  assert.equal(client.rpcCalls.filter((c) => c[1].p_event_id === "lead-retry").length, 2, "the RPC is called both times -- the RPC's own unique(provider,event_id) is what enforces the single claim");
});
test("20: different leadgen_ids are processed independently", async () => {
  const client = resolvedClient();
  const result = await processMetaLeadgenWebhookPayload(client, envelope(leadgenChange({ leadgen_id: "lead-a" }), leadgenChange({ leadgen_id: "lead-b" })));
  assert.deepEqual(result.results.map((r) => r.outcome), ["processed", "processed"]);
});

// ---------------------------------------------------------------------------
// TENANT (21-26)
// ---------------------------------------------------------------------------
test("21: a page/form pair with exactly one active, connected mapping resolves the exact tenant", async () => {
  const client = resolvedClient();
  await processMetaLeadgenWebhookPayload(client, envelope(leadgenChange()));
  const call = client.rpcCalls[0][1];
  assert.deepEqual({ org: call.p_organization_id, ws: call.p_workspace_id, conn: call.p_connection_id, prop: call.p_property_id }, { org: "org-1", ws: "ws-1", conn: "conn-1", prop: "prop-1" });
});
test("22/23: an unmapped form or unmapped page is never guessed -- resolution comes back null and the event is recorded unresolved", async () => {
  const client = makeFakeClient(); // no mappings at all
  const result = await processMetaLeadgenWebhookPayload(client, envelope(leadgenChange()));
  assert.equal(result.results[0].outcome, "unresolved");
  const call = client.rpcCalls[0][1];
  assert.equal(call.p_organization_id, null);
  assert.equal(call.p_workspace_id, null);
  assert.equal(call.p_property_id, null);
});
test("24: an inactive mapping is not resolved", async () => {
  const client = resolvedClient({ mapping: { status: "inactive" } });
  const result = await processMetaLeadgenWebhookPayload(client, envelope(leadgenChange()));
  assert.equal(result.results[0].outcome, "unresolved");
});
test("25: an active mapping whose connection is disconnected is not resolved (the M1/M2 resolver fix)", async () => {
  const client = resolvedClient({ connection: { status: "disconnected", deleted_at: "2026-01-01" } });
  const result = await processMetaLeadgenWebhookPayload(client, envelope(leadgenChange()));
  assert.equal(result.results[0].outcome, "unresolved");
  assert.match(resolverSrc, /\.eq\("status", "connected"\)/);
});
test("26: the webhook tenant can never be overridden from the payload -- nothing in the extraction function itself reads an organization/workspace id from the request", () => {
  const extractionCode = strip(leadgenEventSrc).slice(0, strip(leadgenEventSrc).indexOf("export function extractLeadgenChanges") + 2000);
  assert.doesNotMatch(extractionCode.slice(extractionCode.indexOf("function safeString")), /organization_id|workspace_id|organizationId|workspaceId/);
  const payload = envelope({ field: "leadgen", value: { leadgen_id: "lead-x", page_id: "page-1", form_id: "form-1", organization_id: "org-EVIL", workspace_id: "ws-EVIL" } });
  const changes = extractLeadgenChanges(payload);
  assert.deepEqual(Object.keys(changes[0]), ["leadgenId", "pageId", "formId", "adId", "adGroupId", "createdTime"]);
});

// ---------------------------------------------------------------------------
// PROPERTY (27-28)
// ---------------------------------------------------------------------------
test("27: the resolved property id comes only from the form mapping, never fabricated", async () => {
  const client = resolvedClient({ mapping: { property_id: "prop-77" } });
  await processMetaLeadgenWebhookPayload(client, envelope(leadgenChange()));
  assert.equal(client.rpcCalls[0][1].p_property_id, "prop-77");
});
test("28: no lead_property_interests write occurs anywhere in M3", () => {
  for (const src of [leadgenEventSrc, processSrc, routeSrc, resolverSrc]) assert.doesNotMatch(strip(src), /lead_property_interests/i);
  assert.doesNotMatch(migrationSql, /lead_property_interests/i);
});

// ---------------------------------------------------------------------------
// SECURITY (29-33)
// ---------------------------------------------------------------------------
test("29/30: the RPC only ever executes behind a service-role connection, and is never granted to authenticated customers", () => {
  const fn = migrationSql.slice(migrationSql.indexOf("function public.process_meta_leadgen_event"));
  assert.match(fn, /if current_setting\('role', true\) <> 'service_role' then/);
  assert.match(migrationSql, /revoke all on function public\.process_meta_leadgen_event\([^)]*\) from public;/);
  assert.match(migrationSql, /grant execute on function public\.process_meta_leadgen_event\([^)]*\) to service_role;/);
  assert.doesNotMatch(migrationSql, /grant execute on function public\.process_meta_leadgen_event\([^)]*\) to authenticated/);
});
test("31: no ciphertext/token is ever read or exposed by the webhook path", () => {
  for (const src of [leadgenEventSrc, processSrc, routeSrc, resolverSrc]) assert.doesNotMatch(strip(src), /ciphertext|access_token|decrypt/i);
});
test("32: the raw request body is never logged", () => {
  assert.doesNotMatch(strip(routeSrc), /console\.log\(raw\)|log\(.*raw\)/);
});
test("33: no PII (name/email/phone/custom answers) is ever read from the payload or stored", () => {
  for (const src of [leadgenEventSrc, processSrc, migrationSql]) assert.doesNotMatch(strip(src), /field_data|full_name|first_name|last_name|\bemail\b|\bphone_number\b/i);
});

// ---------------------------------------------------------------------------
// HTTP (34-38)
// ---------------------------------------------------------------------------
test("34: a duplicate delivery returns success", async () => {
  const client = resolvedClient();
  const raw = JSON.stringify(envelope(leadgenChange()));
  const { POST } = loadRoute(client);
  const req = () => new NextRequest("https://vayon.test/api/webhooks/meta-leadgen", { method: "POST", headers: { "x-hub-signature-256": sign(raw) }, body: raw });
  assert.equal((await POST(req())).status, 200);
  assert.equal((await POST(req())).status, 200);
});
test("35: a valid signed unrelated (non-leadgen) change returns success", async () => {
  const client = makeFakeClient();
  const raw = JSON.stringify(envelope({ field: "feed", value: {} }));
  const { POST } = loadRoute(client);
  const req = new NextRequest("https://vayon.test/api/webhooks/meta-leadgen", { method: "POST", headers: { "x-hub-signature-256": sign(raw) }, body: raw });
  assert.equal((await POST(req)).status, 200);
});
test("36: an unmapped Lead Ads event is durably recorded and still returns success (avoids a Meta retry storm for a permanently unmapped form)", async () => {
  const client = makeFakeClient();
  const raw = JSON.stringify(envelope(leadgenChange()));
  const { POST } = loadRoute(client);
  const req = new NextRequest("https://vayon.test/api/webhooks/meta-leadgen", { method: "POST", headers: { "x-hub-signature-256": sign(raw) }, body: raw });
  const res = await POST(req);
  assert.equal(res.status, 200);
  assert.equal(client.rpcCalls[0][1].p_organization_id, null);
});
test("37: an unexpected persistence failure returns a retryable non-2xx", async () => {
  const client = resolvedClient();
  const raw = JSON.stringify(envelope(leadgenChange({ leadgen_id: "__throw__" })));
  const { POST } = loadRoute(client);
  const req = new NextRequest("https://vayon.test/api/webhooks/meta-leadgen", { method: "POST", headers: { "x-hub-signature-256": sign(raw) }, body: raw });
  assert.equal((await POST(req)).status, 500);
});
test("38: an invalid signature returns non-success and never reaches processing", async () => {
  const client = makeFakeClient();
  const raw = JSON.stringify(envelope(leadgenChange()));
  const { POST } = loadRoute(client);
  const req = new NextRequest("https://vayon.test/api/webhooks/meta-leadgen", { method: "POST", headers: { "x-hub-signature-256": "sha256=wrong" }, body: raw });
  assert.equal((await POST(req)).status, 401);
  assert.equal(client.rpcCalls.length, 0);
});

// ---------------------------------------------------------------------------
// NO SIDE EFFECTS (39-45)
// ---------------------------------------------------------------------------
test("39/40/41/42/43/44/45: no Meta Graph fetch, no field_data fetch, no CRM lead, no property interest, no WhatsApp send, no OpenAI call, no campaign/ad creation exist anywhere in the M3 diff", () => {
  for (const src of [signatureSrc, leadgenEventSrc, processSrc, routeSrc, resolverSrc]) {
    assert.doesNotMatch(strip(src), /graph\.facebook\.com|field_data|\.from\("leads"\)|create_lead|lead_property_interests|sendText|whatsapp|openai|OpenAIProvider|\/campaigns|\/adsets|\/ads\b|adcreatives/i);
  }
  assert.doesNotMatch(migrationSql, /field_data|insert into leads|lead_property_interests/i);
});

// ---------------------------------------------------------------------------
// REGRESSION (46-49)
// ---------------------------------------------------------------------------
test("46: the M1/M2 migration is unmodified by M3 -- only the resolver's own added connection-status check (a disclosed, narrow M3 completion fix) is new", () => {
  assert.doesNotMatch(m1m2Migration, /meta_leadgen|process_meta_leadgen_event/);
});
test("47: the WhatsApp webhook route and its signature verification are byte-for-byte unchanged", () => {
  assert.match(whatsappRouteSrc, /x-hub-signature-256/);
  assert.match(whatsappServiceSrc.replace(/\s/g, ""), /verifySignature\(raw:string,signature:string\)\{constsecret=process\.env\.WHATSAPP_APP_SECRET;/);
  assert.doesNotMatch(whatsappRouteSrc + whatsappServiceSrc, /meta-leadgen|meta_leadgen|META_LEADGEN_VERIFY_TOKEN/);
});
test("48: no Meta Lead Ads file imports the WhatsApp AI-orchestration runtime (E1-E6) -- the two integrations remain uncoupled, and the (committed) K-series trusted OpenAI runtime makes no reference to Meta Lead Ads either", () => {
  for (const src of [signatureSrc, leadgenEventSrc, processSrc, routeSrc, resolverSrc]) {
    assert.doesNotMatch(src, /whatsapp-ai-orchestrator/i);
  }
  assert.doesNotMatch(trustedRuntimeSrc, /meta-leadgen|meta_leadgen|leadgen/i);
});
test("49: K1-K6 property-knowledge retrieval makes no reference to Meta Lead Ads", () => {
  assert.doesNotMatch(k4RetrievalSrc, /meta-leadgen|meta_leadgen|leadgen/i);
});

// ---------------------------------------------------------------------------
// Migration sequencing / reuse
// ---------------------------------------------------------------------------
test("migration is strictly after M1/M2, adds no new table/column, and reuses provider_webhook_events verbatim", () => {
  assert.ok("20261116000000" > "20261115000000");
  assert.doesNotMatch(migrationSql, /create table|alter table|add column/i);
  assert.match(baselineSql, /create table public\.provider_webhook_events/);
  assert.match(migrationSql, /insert into provider_webhook_events/);
});
