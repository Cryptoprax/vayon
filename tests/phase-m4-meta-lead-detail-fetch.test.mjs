import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const require = createRequire(import.meta.url);
const { NextRequest } = require("next/server");

const rd = (p) => readFileSync(p, "utf8");
const serviceSrc = rd("features/platform/integrations/meta-marketing/webhook/lead-detail-fetch.service.ts");
const normalizeSrc = rd("features/platform/integrations/meta-marketing/webhook/normalize-lead.ts");
const providerSrc = rd("features/platform/integrations/meta-marketing/providers/meta-graph.provider.ts");
const readModelSrc = rd("features/platform/integrations/meta-marketing/webhook/normalized-lead-read-model.ts");
const routeSrc = rd("app/api/meta/leadgen/process-pending/route.ts");
const migration = rd("supabase/migrations/20261117000000_meta_lead_detail_staging.sql");
const migrationSql = migration.split("\n").map((l) => l.replace(/--.*$/, "")).join("\n");
const m3Migration = rd("supabase/migrations/20261116000000_meta_leadgen_webhook.sql");
const m1m2Migration = rd("supabase/migrations/20261115000000_meta_marketing_connection.sql");
const oauthStateSrc = rd("features/platform/integrations/meta-marketing/services/meta-oauth-state.service.ts");
const actionsSrc = rd("features/platform/integrations/meta-marketing/actions.ts");
const callbackSrc = rd("app/integrations/meta/callback/route.ts");
const webhookRouteSrc = rd("app/api/webhooks/meta-leadgen/route.ts");
const signatureSrc = rd("features/platform/integrations/meta-marketing/webhook/signature.ts");
const leadgenEventSrc = rd("features/platform/integrations/meta-marketing/webhook/leadgen-event.ts");
const processLeadgenSrc = rd("features/platform/integrations/meta-marketing/webhook/process-leadgen-webhook.ts");
const resolverSrc = rd("features/platform/integrations/meta-marketing/services/resolve-meta-lead-tenant.ts");
const trustedRuntimeSrc = rd("features/platform/openai/runtime/trusted-runtime.ts");
const k4RetrievalSrc = rd("features/vayon/property-knowledge/retrieval/retrieval.service.ts");

// NOTE: no live Meta call is ever made -- every test uses a mocked provider. Static SQL tests do not prove live Postgres behavior. No migration was applied.

process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || "test-key-for-m4-suite";
process.env.CRON_SECRET = process.env.CRON_SECRET || "test-cron-secret-m4";
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");

const logCalls = [];
const { TokenCryptoService } = load("features/platform/integrations/google/services/token-crypto.service.ts");
// The test loader (sprint237-load.mjs) re-evaluates every relative import fresh on each load() call, with no
// module cache -- so classes from two independent load() calls of the same file are NOT the same identity.
// To let `error instanceof GraphHttpError` inside the service under test recognize errors constructed in this
// test file, the provider and normalize-lead modules are loaded once and injected as mocks for the exact
// relative specifiers lead-detail-fetch.service.ts imports them by, so both sides share one class identity.
const providerModule = load("features/platform/integrations/meta-marketing/providers/meta-graph.provider.ts");
const normalizeLeadModule = load("features/platform/integrations/meta-marketing/webhook/normalize-lead.ts");
const { GraphHttpError, GraphTimeoutError, graphLeadFetchTimeoutMs } = providerModule;
const { validateGraphLeadResponse, normalizeLeadFields, InvalidLeadResponseError, maxCustomAnswers } = normalizeLeadModule;
const {
  claimMetaLeadDetailBatch,
  processClaimedLeadDetail,
  processPendingMetaLeadgenEvents,
} = load("features/platform/integrations/meta-marketing/webhook/lead-detail-fetch.service.ts", {
  "@/lib/observability/logger": { log: (...args) => { logCalls.push(args); } },
  "../providers/meta-graph.provider": providerModule,
  "./normalize-lead": normalizeLeadModule,
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
function connectionRow(over = {}) {
  const crypto = new TokenCryptoService();
  const enc = crypto.encrypt(over.plaintextToken ?? "secret-page-token-xyz");
  return {
    id: over.id ?? "conn-1",
    organization_id: over.organizationId ?? "org-1",
    workspace_id: over.workspaceId ?? "ws-1",
    page_id: over.pageId ?? "page-1",
    status: over.status ?? "connected",
    deleted_at: over.deletedAt === undefined ? null : over.deletedAt,
    access_token_ciphertext: enc.ciphertext,
    access_token_iv: enc.iv,
    access_token_tag: enc.tag,
  };
}
function claimedRow(over = {}) {
  return {
    id: "staging-1",
    organizationId: "org-1",
    workspaceId: "ws-1",
    connectionId: "conn-1",
    propertyId: "prop-1",
    campaignId: null,
    leadgenId: "lead-1",
    pageId: "page-1",
    formId: "form-1",
    adId: "ad-1",
    adGroupId: "adset-1",
    ...over,
  };
}
function fakeProvider(getLead) {
  return { getLead: getLead ?? (async () => ({ id: "lead-1", field_data: [] })) };
}
function makeFakeClient({ connections = [], rpcHandlers = {} } = {}) {
  const calls = { rpc: [], insert: [] };
  function chain(table) {
    const filters = [];
    const c = {
      select: () => c,
      eq: (col, val) => { filters.push((r) => r[col] === val); return c; },
      maybeSingle: async () => {
        const rows = connections.filter((r) => filters.every((f) => f(r)));
        return { data: rows[0] ?? null, error: null };
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
function fieldData(fields) {
  return { id: "lead-1", field_data: fields.map(([name, ...values]) => ({ name, values })) };
}

// ===========================================================================
// CONNECTION (1-5): revalidation happens against the CURRENT connection row,
// never the M3-time resolution.
// ===========================================================================
test("1: a same-tenant, same-page, connected connection is accepted", async () => {
  const client = makeFakeClient({ connections: [connectionRow()] });
  const outcome = await processClaimedLeadDetail(client, claimedRow(), fakeProvider(), new TokenCryptoService());
  assert.equal(outcome.outcome, "fetched");
});
test("2: a connection belonging to a different tenant is blocked", async () => {
  const client = makeFakeClient({ connections: [connectionRow({ organizationId: "org-EVIL" })] });
  const outcome = await processClaimedLeadDetail(client, claimedRow(), fakeProvider(), new TokenCryptoService());
  assert.equal(outcome.outcome, "unresolved_connection");
  assert.deepEqual(client.calls.rpc[0], ["fail_meta_lead_detail_fetch", { p_staging_id: "staging-1", p_status: "unresolved_connection", p_error_code: null }]);
});
test("3: a connection whose page_id no longer matches the claimed row's page is blocked", async () => {
  const client = makeFakeClient({ connections: [connectionRow({ pageId: "page-DIFFERENT" })] });
  const outcome = await processClaimedLeadDetail(client, claimedRow(), fakeProvider(), new TokenCryptoService());
  assert.equal(outcome.outcome, "unresolved_connection");
});
test("4: a disconnected connection is blocked", async () => {
  const client = makeFakeClient({ connections: [connectionRow({ status: "error" })] });
  const outcome = await processClaimedLeadDetail(client, claimedRow(), fakeProvider(), new TokenCryptoService());
  assert.equal(outcome.outcome, "unresolved_connection");
});
test("5: a soft-deleted connection is blocked", async () => {
  const client = makeFakeClient({ connections: [connectionRow({ deletedAt: "2026-01-01T00:00:00.000Z" })] });
  const outcome = await processClaimedLeadDetail(client, claimedRow(), fakeProvider(), new TokenCryptoService());
  assert.equal(outcome.outcome, "unresolved_connection");
});

// ===========================================================================
// TOKEN (6-8)
// ===========================================================================
test("6: the Page token is decrypted server-side via TokenCryptoService and passed to the Graph call", async () => {
  const client = makeFakeClient({ connections: [connectionRow({ plaintextToken: "the-real-page-token" })] });
  let seenToken;
  const provider = fakeProvider(async (_leadgenId, token) => { seenToken = token; return { id: "lead-1", field_data: [] }; });
  await processClaimedLeadDetail(client, claimedRow(), provider, new TokenCryptoService());
  assert.equal(seenToken, "the-real-page-token");
});
test("7: the outcome returned to the caller never contains the token/ciphertext", async () => {
  const client = makeFakeClient({ connections: [connectionRow()] });
  const outcome = await processClaimedLeadDetail(client, claimedRow(), fakeProvider(), new TokenCryptoService());
  const serialized = JSON.stringify(outcome);
  assert.doesNotMatch(serialized, /token|ciphertext|secret-page-token/i);
});
test("8: the decrypted token is never passed to log()", async () => {
  logCalls.length = 0;
  const client = makeFakeClient({ connections: [connectionRow({ plaintextToken: "must-not-be-logged-token" })] });
  await processClaimedLeadDetail(client, claimedRow(), fakeProvider(), new TokenCryptoService());
  assert.doesNotMatch(JSON.stringify(logCalls), /must-not-be-logged-token/);
  assert.doesNotMatch(strip(serviceSrc), /log\(.*pageToken|log\(.*access_token/i);
});

// ===========================================================================
// FETCH (9-13)
// ===========================================================================
test("9: Graph is called with the exact claimed leadgen_id, never a different id", async () => {
  const client = makeFakeClient({ connections: [connectionRow()] });
  let seenId;
  const provider = fakeProvider(async (leadgenId) => { seenId = leadgenId; return { id: "lead-1", field_data: [] }; });
  await processClaimedLeadDetail(client, claimedRow({ leadgenId: "lead-1" }), provider, new TokenCryptoService());
  assert.equal(seenId, "lead-1");
});
test("10: a successful fetch persists normalized fields via complete_meta_lead_detail_fetch", async () => {
  const client = makeFakeClient({ connections: [connectionRow()] });
  const provider = fakeProvider(async () => fieldData([["full_name", "Jane Doe"], ["email", "jane@example.com"]]));
  await processClaimedLeadDetail(client, claimedRow(), provider, new TokenCryptoService());
  const call = client.calls.rpc.find((c) => c[0] === "complete_meta_lead_detail_fetch");
  assert.ok(call);
  assert.equal(call[1].p_full_name, "Jane Doe");
  assert.equal(call[1].p_email, "jane@example.com");
});
test("11: the lead-detail Graph call passes the documented bounded timeout constant, not an unbounded fetch", () => {
  assert.match(providerSrc, /getLead\([^)]*\)[\s\S]{0,300}graphLeadFetchTimeoutMs\)/);
  assert.equal(graphLeadFetchTimeoutMs, 10_000);
});
test("12: a Graph HTTP failure is classified and recorded as fetch_failed, never thrown out uncaught", async () => {
  const client = makeFakeClient({ connections: [connectionRow()] });
  const provider = fakeProvider(async () => { throw new GraphHttpError(500, "server error"); });
  const outcome = await processClaimedLeadDetail(client, claimedRow(), provider, new TokenCryptoService());
  assert.equal(outcome.outcome, "fetch_failed");
});
test("13: a network-level throw (non-Graph error) is still classified, never crashes the caller", async () => {
  const client = makeFakeClient({ connections: [connectionRow()] });
  const provider = fakeProvider(async () => { throw new TypeError("fetch failed"); });
  const outcome = await processClaimedLeadDetail(client, claimedRow(), provider, new TokenCryptoService());
  assert.equal(outcome.outcome, "fetch_failed");
});

// ===========================================================================
// STANDARD FIELDS (14-21)
// ===========================================================================
test("14: full_name is taken verbatim when Meta sends it", () => {
  const n = normalizeLeadFields(fieldData([["full_name", "Jane Q Doe"]]).field_data);
  assert.equal(n.fullName, "Jane Q Doe");
});
test("15: full_name is composed from first+last only when Meta did not send full_name", () => {
  const n = normalizeLeadFields(fieldData([["first_name", "Jane"], ["last_name", "Doe"]]).field_data);
  assert.equal(n.fullName, "Jane Doe");
});
test("16: full_name is null when nothing is present -- never fabricated", () => {
  const n = normalizeLeadFields([]);
  assert.equal(n.fullName, null);
  assert.equal(n.firstName, null);
  assert.equal(n.lastName, null);
});
test("17: a valid email is lowercased and trimmed", () => {
  const n = normalizeLeadFields(fieldData([["email", "  Jane@Example.COM  "]]).field_data);
  assert.equal(n.email, "jane@example.com");
});
test("18: an invalid email becomes null, never a guessed/fixed value", () => {
  const n = normalizeLeadFields(fieldData([["email", "not-an-email"]]).field_data);
  assert.equal(n.email, null);
});
test("19: an ambiguous (no country signal) phone number normalizes to null, never a guessed country", () => {
  const n = normalizeLeadFields(fieldData([["phone_number", "9876543210"]]).field_data);
  assert.equal(n.phoneRaw, "9876543210");
  assert.equal(n.phone, null);
});
test("20: a phone number with an explicit country code normalizes to E.164", () => {
  const n = normalizeLeadFields(fieldData([["phone_number", "+1 415-555-0132"]]).field_data);
  assert.equal(n.phone, "+14155550132");
});
test("21: city is taken as-is from the standard field", () => {
  const n = normalizeLeadFields(fieldData([["city", "Bengaluru"]]).field_data);
  assert.equal(n.city, "Bengaluru");
});

// ===========================================================================
// CUSTOM ANSWERS (22-25)
// ===========================================================================
test("22: a non-standard field is captured as a custom answer", () => {
  const n = normalizeLeadFields(fieldData([["budget_range", "50L-1Cr"]]).field_data);
  assert.deepEqual(n.customAnswers, [{ fieldName: "budget_range", values: ["50L-1Cr"] }]);
});
test("23: standard fields are never duplicated into custom answers", () => {
  const n = normalizeLeadFields(fieldData([["email", "jane@example.com"], ["full_name", "Jane"]]).field_data);
  assert.deepEqual(n.customAnswers, []);
});
test("24: custom answers are bounded at maxCustomAnswers", () => {
  const many = Array.from({ length: maxCustomAnswers + 10 }, (_, i) => [`custom_${i}`, "v"]);
  const n = normalizeLeadFields(fieldData(many).field_data);
  assert.equal(n.customAnswers.length, maxCustomAnswers);
});
test("25: custom answers is an empty array when only standard fields are present", () => {
  const n = normalizeLeadFields(fieldData([["city", "Pune"]]).field_data);
  assert.deepEqual(n.customAnswers, []);
});

// ===========================================================================
// VALIDATION / RESPONSE-AS-UNTRUSTED-DATA (extra, feeds into ERRORS below)
// ===========================================================================
test("validateGraphLeadResponse rejects non-array field_data as MALFORMED_RESPONSE", () => {
  assert.throws(() => validateGraphLeadResponse({ id: "lead-1", field_data: "not-an-array" }, "lead-1"), InvalidLeadResponseError);
});
test("validateGraphLeadResponse rejects an id mismatch as RESPONSE_ID_MISMATCH", () => {
  try {
    validateGraphLeadResponse({ id: "lead-OTHER", field_data: [] }, "lead-1");
    assert.fail("expected throw");
  } catch (error) {
    assert.equal(error.code, "RESPONSE_ID_MISMATCH");
  }
});
test("validateGraphLeadResponse strips control characters from values", () => {
  const fields = validateGraphLeadResponse({ id: "lead-1", field_data: [{ name: "full_name", values: ["Jane\x00\x1fDoe"] }] }, "lead-1");
  assert.equal(fields[0].values[0], "JaneDoe");
});

// ===========================================================================
// PII (26-29)
// ===========================================================================
test("26: no name/email/phone/custom-answer value is ever passed to log()", async () => {
  logCalls.length = 0;
  const client = makeFakeClient({ connections: [connectionRow()] });
  const provider = fakeProvider(async () => fieldData([["full_name", "SECRET_NAME"], ["email", "secret@example.com"], ["phone_number", "+14155550132"]]));
  await processClaimedLeadDetail(client, claimedRow(), provider, new TokenCryptoService());
  const serialized = JSON.stringify(logCalls);
  assert.doesNotMatch(serialized, /SECRET_NAME|secret@example\.com|4155550132/);
});
test("27: the success activity_events insert carries no PII -- only identifiers/type/title", async () => {
  const client = makeFakeClient({ connections: [connectionRow()] });
  const provider = fakeProvider(async () => fieldData([["full_name", "SECRET_NAME"], ["email", "secret@example.com"]]));
  await processClaimedLeadDetail(client, claimedRow(), provider, new TokenCryptoService());
  const insertCall = client.calls.insert.find((c) => c[0] === "activity_events");
  assert.ok(insertCall);
  assert.doesNotMatch(JSON.stringify(insertCall[1]), /SECRET_NAME|secret@example\.com/);
});
test("28: the failure activity_events insert metadata is only { errorCode } -- no PII, no raw error message", async () => {
  const client = makeFakeClient({ connections: [connectionRow()] });
  const provider = fakeProvider(async () => { throw new GraphHttpError(500, "server said something with a token abc123"); });
  await processClaimedLeadDetail(client, claimedRow(), provider, new TokenCryptoService());
  const insertCall = client.calls.insert.find((c) => c[0] === "activity_events");
  assert.ok(insertCall);
  assert.deepEqual(Object.keys(insertCall[1].metadata), ["errorCode"]);
  assert.doesNotMatch(JSON.stringify(insertCall[1]), /abc123/);
});
test("29: the processor route's JSON response is counts-only -- no leadgenId, no PII, no normalized field", async () => {
  const { GET } = load("app/api/meta/leadgen/process-pending/route.ts", {
    "@/lib/supabase/service": { createSupabaseServiceClient: () => ({}) },
    "@/features/platform/integrations/meta-marketing/webhook/lead-detail-fetch.service": {
      processPendingMetaLeadgenEvents: async () => ({ claimed: 1, results: [{ stagingId: "s1", leadgenId: "lead-1", outcome: "fetched" }] }),
    },
  });
  const req = new NextRequest("https://vayon.test/api/meta/leadgen/process-pending", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
  const res = await GET(req);
  const body = await res.json();
  assert.deepEqual(Object.keys(body).sort(), ["claimed", "fetched", "failed", "ok"].sort());
});

// ===========================================================================
// IDEMPOTENCY (30-32)
// ===========================================================================
test("30: claimMetaLeadDetailBatch calls the claim RPC with p_limit and maps snake_case rows to the camelCase shape", async () => {
  const client = makeFakeClient({
    rpcHandlers: { claim_meta_lead_detail_batch: () => ({ data: [{ id: "staging-1", organization_id: "org-1", workspace_id: "ws-1", connection_id: "conn-1", property_id: "prop-1", campaign_id: null, leadgen_id: "lead-1", page_id: "page-1", form_id: "form-1", ad_id: null, ad_group_id: null }], error: null }) },
  });
  const rows = await claimMetaLeadDetailBatch(client, 5);
  assert.equal(client.calls.rpc[0][1].p_limit, 5);
  assert.deepEqual(rows[0], claimedRow({ adId: null, adGroupId: null }));
});
test("31: the atomic claim (INSERT...ON CONFLICT DO NOTHING + UPDATE...WHERE) is enforced by the RPC itself, not by JS-side locking", () => {
  const fn = migrationSql.slice(migrationSql.indexOf("function public.claim_meta_lead_detail_batch"));
  assert.match(fn, /on conflict \(leadgen_id\) do nothing/);
  assert.match(fn, /update meta_lead_ingestion_staging m\s+set status = 'fetching'/);
  assert.doesNotMatch(strip(serviceSrc), /setInterval|mutex|Lock\(/i);
});
test("32: a batch of multiple claimed rows are each processed independently with their own outcome", async () => {
  const client = makeFakeClient({
    connections: [connectionRow({ id: "conn-1" })],
    rpcHandlers: {
      claim_meta_lead_detail_batch: () => ({
        data: [
          { id: "s1", organization_id: "org-1", workspace_id: "ws-1", connection_id: "conn-1", property_id: "prop-1", campaign_id: null, leadgen_id: "lead-1", page_id: "page-1", form_id: "form-1", ad_id: null, ad_group_id: null },
          { id: "s2", organization_id: "org-1", workspace_id: "ws-1", connection_id: "conn-1", property_id: "prop-1", campaign_id: null, leadgen_id: "lead-2", page_id: "page-1", form_id: "form-1", ad_id: null, ad_group_id: null },
        ],
        error: null,
      }),
    },
  });
  const provider = fakeProvider(async (leadgenId) => ({ id: leadgenId, field_data: [] }));
  const result = await processPendingMetaLeadgenEvents(client, { provider, crypto: new TokenCryptoService() });
  assert.equal(result.claimed, 2);
  assert.deepEqual(result.results.map((r) => r.outcome), ["fetched", "fetched"]);
});

// ===========================================================================
// ERRORS (33-38)
// ===========================================================================
async function outcomeFor(status) {
  const client = makeFakeClient({ connections: [connectionRow()] });
  const provider = fakeProvider(async () => { throw new GraphHttpError(status, "err"); });
  await processClaimedLeadDetail(client, claimedRow(), provider, new TokenCryptoService());
  return client.calls.rpc.find((c) => c[0] === "fail_meta_lead_detail_fetch")[1].p_error_code;
}
test("33: HTTP status codes classify to the documented error codes (400/401/403/404/429/5xx)", async () => {
  assert.equal(await outcomeFor(400), "INVALID_LEAD_ID");
  assert.equal(await outcomeFor(401), "TOKEN_INVALID");
  assert.equal(await outcomeFor(403), "TOKEN_INVALID");
  assert.equal(await outcomeFor(404), "LEAD_NOT_FOUND");
  assert.equal(await outcomeFor(429), "RATE_LIMITED");
  assert.equal(await outcomeFor(503), "PROVIDER_ERROR");
});
test("34: a GraphTimeoutError classifies as TIMEOUT", async () => {
  const client = makeFakeClient({ connections: [connectionRow()] });
  const provider = fakeProvider(async () => { throw new GraphTimeoutError(); });
  await processClaimedLeadDetail(client, claimedRow(), provider, new TokenCryptoService());
  assert.equal(client.calls.rpc.find((c) => c[0] === "fail_meta_lead_detail_fetch")[1].p_error_code, "TIMEOUT");
});
test("35: a non-Graph throw classifies as NETWORK_ERROR", async () => {
  const client = makeFakeClient({ connections: [connectionRow()] });
  const provider = fakeProvider(async () => { throw new Error("dns failure"); });
  await processClaimedLeadDetail(client, claimedRow(), provider, new TokenCryptoService());
  assert.equal(client.calls.rpc.find((c) => c[0] === "fail_meta_lead_detail_fetch")[1].p_error_code, "NETWORK_ERROR");
});
test("36: a malformed Graph response (non-array field_data) is recorded as invalid_payload/MALFORMED_RESPONSE", async () => {
  const client = makeFakeClient({ connections: [connectionRow()] });
  const provider = fakeProvider(async () => ({ id: "lead-1", field_data: "oops" }));
  const outcome = await processClaimedLeadDetail(client, claimedRow(), provider, new TokenCryptoService());
  assert.equal(outcome.outcome, "invalid_payload");
  assert.equal(client.calls.rpc.find((c) => c[0] === "fail_meta_lead_detail_fetch")[1].p_error_code, "MALFORMED_RESPONSE");
});
test("37: a Graph response id mismatch is recorded as invalid_payload/RESPONSE_ID_MISMATCH", async () => {
  const client = makeFakeClient({ connections: [connectionRow()] });
  const provider = fakeProvider(async () => ({ id: "lead-WRONG", field_data: [] }));
  const outcome = await processClaimedLeadDetail(client, claimedRow({ leadgenId: "lead-1" }), provider, new TokenCryptoService());
  assert.equal(outcome.outcome, "invalid_payload");
  assert.equal(client.calls.rpc.find((c) => c[0] === "fail_meta_lead_detail_fetch")[1].p_error_code, "RESPONSE_ID_MISMATCH");
});
test("38: only TOKEN_INVALID triggers mark_meta_connection_token_invalid -- other failures never touch connection status", async () => {
  const client401 = makeFakeClient({ connections: [connectionRow()] });
  await processClaimedLeadDetail(client401, claimedRow(), fakeProvider(async () => { throw new GraphHttpError(401, "x"); }), new TokenCryptoService());
  assert.ok(client401.calls.rpc.some((c) => c[0] === "mark_meta_connection_token_invalid"));

  const client500 = makeFakeClient({ connections: [connectionRow()] });
  await processClaimedLeadDetail(client500, claimedRow(), fakeProvider(async () => { throw new GraphHttpError(500, "x"); }), new TokenCryptoService());
  assert.ok(!client500.calls.rpc.some((c) => c[0] === "mark_meta_connection_token_invalid"));
});

// ===========================================================================
// M3 HANDOFF (39-41)
// ===========================================================================
test("39: the claim RPC only stages M3 events that already resolved a tenant (organization_id is not null)", () => {
  const fn = migrationSql.slice(migrationSql.indexOf("function public.claim_meta_lead_detail_batch"));
  assert.match(fn, /w\.organization_id is not null/);
});
test("40: the claim RPC sources exclusively from provider_webhook_events where provider = 'meta_leadgen' and status = 'processed'", () => {
  const fn = migrationSql.slice(migrationSql.indexOf("function public.claim_meta_lead_detail_batch"));
  assert.match(fn, /from provider_webhook_events w/);
  assert.match(fn, /w\.provider = 'meta_leadgen'/);
  assert.match(fn, /w\.status = 'processed'/);
});
test("41: a leadgen_id already present in staging (any status) is never re-staged by the claim RPC", () => {
  const fn = migrationSql.slice(migrationSql.indexOf("function public.claim_meta_lead_detail_batch"));
  assert.match(fn, /not exists \(select 1 from meta_lead_ingestion_staging s where s\.leadgen_id = w\.event_id\)/);
  assert.match(migrationSql, /unique \(leadgen_id\)/);
});

// ===========================================================================
// NO CRM WRITE (42-45)
// ===========================================================================
const m4Sources = [serviceSrc, normalizeSrc, providerSrc, readModelSrc, routeSrc];
test("42: no lead_property_interests write exists anywhere in the M4 diff", () => {
  for (const src of m4Sources) assert.doesNotMatch(strip(src), /lead_property_interests/i);
  assert.doesNotMatch(migrationSql, /lead_property_interests/i);
});
test("43: no leads table insert / create_lead call exists anywhere in the M4 diff", () => {
  for (const src of m4Sources) assert.doesNotMatch(strip(src), /\.from\("leads"\)|create_lead/i);
  assert.doesNotMatch(migrationSql, /insert into leads\b/i);
});
test("44: no WhatsApp send is triggered from the M4 diff", () => {
  for (const src of m4Sources) assert.doesNotMatch(strip(src), /sendText|whatsapp/i);
});
test("45: no consent record is created anywhere in the M4 diff", () => {
  // providerSrc (meta-graph.provider.ts) is shared with the later, separately-authorized Phase C6
  // (createLeadForm's own consent-disclosure payload) -- scope this check to getLead(), M4's own
  // method, rather than the whole shared provider file.
  const getLeadOnly = strip(providerSrc).slice(strip(providerSrc).indexOf("async getLead"), strip(providerSrc).indexOf("async createLeadForm") === -1 ? undefined : strip(providerSrc).indexOf("async createLeadForm"));
  assert.doesNotMatch(getLeadOnly, /consent|opt_in/i);
  for (const src of [serviceSrc, normalizeSrc, readModelSrc, routeSrc]) assert.doesNotMatch(strip(src), /consent|opt_in/i);
  assert.doesNotMatch(migrationSql, /consent|opt_in/i);
});

// ===========================================================================
// PROCESSOR (46-49)
// ===========================================================================
function loadRouteWithMocks(processMock) {
  return load("app/api/meta/leadgen/process-pending/route.ts", {
    "@/lib/supabase/service": { createSupabaseServiceClient: () => ({}) },
    "@/features/platform/integrations/meta-marketing/webhook/lead-detail-fetch.service": { processPendingMetaLeadgenEvents: processMock },
  });
}
test("46: a missing or wrong CRON_SECRET returns 401 and never invokes processing", async () => {
  let invoked = false;
  const { GET } = loadRouteWithMocks(async () => { invoked = true; return { claimed: 0, results: [] }; });
  const reqMissing = new NextRequest("https://vayon.test/api/meta/leadgen/process-pending");
  assert.equal((await GET(reqMissing)).status, 401);
  const reqWrong = new NextRequest("https://vayon.test/api/meta/leadgen/process-pending", { headers: { authorization: "Bearer wrong-secret" } });
  assert.equal((await GET(reqWrong)).status, 401);
  assert.equal(invoked, false);
});
test("47: a correct CRON_SECRET triggers processing and returns ok/claimed/fetched/failed counts", async () => {
  const { GET } = loadRouteWithMocks(async () => ({ claimed: 3, results: [{ outcome: "fetched" }, { outcome: "fetched" }, { outcome: "fetch_failed" }] }));
  const req = new NextRequest("https://vayon.test/api/meta/leadgen/process-pending", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
  const res = await GET(req);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.deepEqual(body, { ok: true, claimed: 3, fetched: 2, failed: 1 });
});
test("48: the processor route declares maxDuration = 300, matching the existing reconcile-route pattern", () => {
  assert.match(routeSrc, /export const maxDuration = 300;/);
});
test("49: an unexpected throw during processing returns a retryable 503, never an unhandled crash", async () => {
  const { GET } = loadRouteWithMocks(async () => { throw new Error("db unavailable"); });
  const req = new NextRequest("https://vayon.test/api/meta/leadgen/process-pending", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
  assert.equal((await GET(req)).status, 503);
});

// ===========================================================================
// REGRESSION (50-53)
// ===========================================================================
test("50: M1/M2's OAuth state service, actions, and callback route are unmodified by M4 -- no lead-detail/staging references", () => {
  for (const src of [oauthStateSrc, actionsSrc, callbackSrc]) {
    assert.doesNotMatch(src, /meta_lead_ingestion_staging|getLead\(|leadIngestionSummary/);
  }
  assert.doesNotMatch(m1m2Migration, /meta_lead_ingestion_staging/);
});
test("51: M3's webhook route/signature/event-extraction/resolver are unmodified by M4", () => {
  for (const src of [webhookRouteSrc, signatureSrc, leadgenEventSrc, processLeadgenSrc, resolverSrc]) {
    assert.doesNotMatch(src, /meta_lead_ingestion_staging|graphLeadFetchTimeoutMs|getLead\(/);
  }
  assert.doesNotMatch(m3Migration, /meta_lead_ingestion_staging/);
});
test("52: no Meta lead-detail-fetch file imports the WhatsApp AI-orchestration runtime (E1-E6) -- the two integrations remain uncoupled, and the (committed) K-series trusted OpenAI runtime makes no reference to Meta lead-detail fetch either", () => {
  for (const src of m4Sources) {
    assert.doesNotMatch(src, /whatsapp-ai-orchestrator/i);
  }
  assert.doesNotMatch(trustedRuntimeSrc, /meta_lead_ingestion_staging|lead_detail_fetch|leadIngestionSummary/i);
});
test("53: K1-K6 property-knowledge retrieval makes no reference to Meta lead-detail fetch", () => {
  assert.doesNotMatch(k4RetrievalSrc, /meta_lead_ingestion_staging|lead_detail_fetch/i);
});

// ---------------------------------------------------------------------------
// Security / RLS / migration sequencing
// ---------------------------------------------------------------------------
test("the staging table has RLS enabled with zero select/insert/update policies", () => {
  assert.match(migrationSql, /alter table public\.meta_lead_ingestion_staging enable row level security;/);
  assert.doesNotMatch(migrationSql, /create policy[^;]*meta_lead_ingestion_staging/i);
});
test("claim/complete/fail/mark-invalid RPCs are service-role-only; only the summary RPC is granted to authenticated", () => {
  for (const fnName of ["claim_meta_lead_detail_batch", "complete_meta_lead_detail_fetch", "fail_meta_lead_detail_fetch", "mark_meta_connection_token_invalid"]) {
    const fn = migrationSql.slice(migrationSql.indexOf(`function public.${fnName}`));
    assert.match(fn.slice(0, fn.indexOf("$$;")), /if current_setting\('role', true\) <> 'service_role' then/);
  }
  assert.match(migrationSql, /grant execute on function public\.get_meta_lead_ingestion_summary\(uuid\) to authenticated;/);
  assert.doesNotMatch(migrationSql, /grant execute on function public\.claim_meta_lead_detail_batch\([^)]*\) to authenticated/);
});
test("get_meta_lead_ingestion_summary never selects a PII column", () => {
  const fn = migrationSql.slice(migrationSql.indexOf("function public.get_meta_lead_ingestion_summary"));
  assert.doesNotMatch(fn, /normalized_full_name|normalized_first_name|normalized_last_name|normalized_email|normalized_phone|normalized_city|custom_answers/);
});
test("migration is strictly after M3, adds exactly one new table, and only extends meta_marketing_connections' status (no new column on it)", () => {
  assert.ok("20261117000000" > "20261116000000");
  assert.equal((migrationSql.match(/create table/gi) ?? []).length, 1);
  assert.doesNotMatch(migrationSql, /alter table public\.meta_marketing_connections add column/i);
});
