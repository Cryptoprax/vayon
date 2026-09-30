import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const rd = (p) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const migration = rd("supabase/migrations/20261115000000_meta_marketing_connection.sql");
const migrationSql = migration.split("\n").map((l) => l.replace(/--.*$/, "")).join("\n");
const providerSrc = rd("features/platform/integrations/meta-marketing/providers/meta-graph.provider.ts");
const oauthStateSrc = rd("features/platform/integrations/meta-marketing/services/meta-oauth-state.service.ts");
const serviceSrc = rd("features/platform/integrations/meta-marketing/services/meta-marketing.service.ts");
const repositorySrc = rd("features/platform/integrations/meta-marketing/repositories/meta-marketing.repository.ts");
const resolverSrc = rd("features/platform/integrations/meta-marketing/services/resolve-meta-lead-tenant.ts");
const actionsSrc = rd("features/platform/integrations/meta-marketing/actions.ts");
const callbackSrc = rd("app/integrations/meta/callback/route.ts");
const uiSrc = rd("features/platform/integrations/meta-marketing/components/MetaMarketingSettings.tsx");
const registrySrc = rd("features/platform/integrations/center/registry.ts");
const trustedRuntimeSrc = rd("features/platform/openai/runtime/trusted-runtime.ts");
const k4RetrievalSrc = rd("features/vayon/property-knowledge/retrieval/retrieval.service.ts");

// NOTE: no live Meta call is ever made -- every test uses a mocked provider. Static SQL tests do not prove live Postgres behavior. No migration was applied.

// ---------------------------------------------------------------------------
// In-memory fake Supabase client (tables + RPCs used by this phase only)
// ---------------------------------------------------------------------------
function makeFakeClient({ states = [], connections = [], mappings = [], rpcOverrides = {}, calls = [] } = {}) {
  const tables = { meta_oauth_states: states, meta_marketing_connections: connections, meta_lead_form_mappings: mappings };
  function chain(table) {
    const filters = [];
    let mode = "select";
    let payload = null;
    const c = {
      select: (...a) => { calls.push(["select", table, a[0]]); return c; },
      eq: (col, val) => { filters.push((r) => r[col] === val); return c; },
      is: (col, val) => { filters.push((r) => (r[col] ?? null) === val); return c; },
      gt: (col, val) => { filters.push((r) => r[col] > val); return c; },
      order: () => c,
      limit: (n) => { filters.push(() => true); c._limit = n; return c; },
      insert: (row) => { mode = "insert"; payload = row; return c; },
      update: (row) => { mode = "update"; payload = row; return c; },
      maybeSingle: async () => finish(true),
      then: (resolve, reject) => finish(false).then(resolve, reject),
    };
    function rows() { return tables[table].filter((r) => filters.every((f) => f(r))); }
    async function finish(single) {
      calls.push([mode, table, payload]);
      if (mode === "insert") {
        tables[table].push({ ...payload });
        return { data: null, error: null };
      }
      if (mode === "update") {
        const matched = rows();
        for (const row of matched) Object.assign(row, payload);
        const result = single ? (matched[0] ?? null) : matched;
        return { data: result, error: null };
      }
      const matched = rows().slice(0, c._limit ?? undefined);
      return { data: single ? (matched[0] ?? null) : matched, error: null };
    }
    return c;
  }
  const rpc = async (name, params) => {
    calls.push(["rpc", name, params]);
    if (rpcOverrides[name]) return rpcOverrides[name](params);
    return { data: null, error: new Error("unexpected rpc " + name) };
  };
  return {
    from: (table) => chain(table),
    rpc,
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
    calls,
    tables,
  };
}

const ORG = "org-1", WS = "ws-1", USER = "user-1";
const tenant = { organizationId: ORG, workspaceId: WS, userId: USER };
const { MetaOAuthStateService, OAuthStateError } = load("features/platform/integrations/meta-marketing/services/meta-oauth-state.service.ts");
const { MetaMarketingRepository } = load("features/platform/integrations/meta-marketing/repositories/meta-marketing.repository.ts");
const { resolveMetaLeadTenant } = load("features/platform/integrations/meta-marketing/services/resolve-meta-lead-tenant.ts");
const { MetaMarketingService, MetaConnectError } = load("features/platform/integrations/meta-marketing/services/meta-marketing.service.ts", {
  "@/features/vayon/operations/services/context": { operationsContext: async () => { throw new Error("unused"); } },
});
const { TokenCryptoService } = load("features/platform/integrations/google/services/token-crypto.service.ts");

process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || "test-key-for-m1-m2-suite";
process.env.META_OAUTH_REDIRECT_URI = process.env.META_OAUTH_REDIRECT_URI || "https://example.test/integrations/meta/callback";
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");

function fakeProvider(overrides = {}) {
  const calls = [];
  return {
    calls,
    authorizationUrl: (state, redirectUri) => { calls.push(["authorizationUrl", state, redirectUri]); return `https://facebook.com/dialog/oauth?state=${state}`; },
    exchangeCode: async (code, redirectUri) => { calls.push(["exchangeCode", code, redirectUri]); return overrides.exchangeCode ?? { accessToken: "short-lived-token", expiresInSeconds: 3600 }; },
    exchangeLongLivedToken: async (short) => { calls.push(["exchangeLongLivedToken", short]); return overrides.exchangeLongLivedToken ?? { accessToken: "long-lived-user-token", expiresInSeconds: 5184000 }; },
    listPages: async (userToken) => { calls.push(["listPages", userToken]); return overrides.listPages ?? [{ id: "page-1", name: "Sea View Realty", accessToken: "page-1-token" }]; },
    listAdAccounts: async (userToken) => { calls.push(["listAdAccounts", userToken]); if (overrides.listAdAccountsThrows) throw new Error("permission denied"); return overrides.listAdAccounts ?? [{ id: "act_1", name: "Main Ad Account" }]; },
    listInstagramAccount: async (pageId, pageToken) => { calls.push(["listInstagramAccount", pageId, pageToken]); if (overrides.listInstagramThrows) throw new Error("permission denied"); return overrides.listInstagramAccount === undefined ? { id: "ig-1" } : overrides.listInstagramAccount; },
    listLeadForms: async (pageId, pageToken) => { calls.push(["listLeadForms", pageId, pageToken]); return overrides.listLeadForms ?? [{ id: "form-1", name: "3BHK Enquiry", status: "ACTIVE" }]; },
  };
}
function makeService({ client, provider = fakeProvider(), crypto = new TokenCryptoService(), org = ORG, ws = WS, user = USER } = {}) {
  return new MetaMarketingService(
    new MetaMarketingRepository(client, org, ws),
    new MetaOAuthStateService(client),
    provider,
    crypto,
    org,
    ws,
    user,
  );
}

// ---------------------------------------------------------------------------
// OAUTH STATE (1-7)
// ---------------------------------------------------------------------------
test("1/2/3: a secure, tenant- and user-bound state is generated", async () => {
  const client = makeFakeClient();
  const stateService = new MetaOAuthStateService(client);
  const state = await stateService.create(tenant, "/vayon/settings/integrations/meta-marketing");
  assert.ok(state.length >= 40, "state should carry at least 256 bits of entropy (base64url of 32 random bytes)");
  assert.match(state, /^[A-Za-z0-9_-]+$/);
  const stored = client.tables.meta_oauth_states[0];
  assert.equal(stored.organization_id, ORG);
  assert.equal(stored.workspace_id, WS);
  assert.equal(stored.created_by, USER);
  assert.equal(stored.consumed_at, undefined);
});
test("4: an expired state is rejected", async () => {
  const client = makeFakeClient({ states: [{ state: "s1", organization_id: ORG, workspace_id: WS, created_by: USER, expires_at: new Date(Date.now() - 1000).toISOString(), consumed_at: null }] });
  const stateService = new MetaOAuthStateService(client);
  await assert.rejects(() => stateService.consume("s1", tenant), (e) => e instanceof OAuthStateError && e.code === "STATE_INVALID_OR_EXPIRED");
});
test("5: a state is single-use -- the second consume fails", async () => {
  const client = makeFakeClient({ states: [{ state: "s1", organization_id: ORG, workspace_id: WS, created_by: USER, expires_at: new Date(Date.now() + 60000).toISOString(), consumed_at: null, pending_token_ciphertext: "c", pending_token_iv: "i", pending_token_tag: "t" }] });
  const stateService = new MetaOAuthStateService(client);
  const first = await stateService.consume("s1", tenant);
  assert.ok(first.token);
  await assert.rejects(() => stateService.consume("s1", tenant), (e) => e instanceof OAuthStateError && e.code === "STATE_INVALID_OR_EXPIRED");
});
test("6: a tampered/unknown state is rejected", async () => {
  const client = makeFakeClient();
  const stateService = new MetaOAuthStateService(client);
  await assert.rejects(() => stateService.consume("nonexistent-state", tenant), (e) => e instanceof OAuthStateError && e.code === "STATE_INVALID_OR_EXPIRED");
});
test("7: the callback can never override org/workspace/user -- a mismatched current tenant is rejected even for a valid, unexpired state, and handleCallback() takes no org/workspace input at all", async () => {
  const client = makeFakeClient({ states: [{ state: "s1", organization_id: "org-B", workspace_id: "ws-B", created_by: "user-B", expires_at: new Date(Date.now() + 60000).toISOString(), consumed_at: null }] });
  const stateService = new MetaOAuthStateService(client);
  await assert.rejects(() => stateService.storePendingToken("s1", tenant, { ciphertext: "c", iv: "i", tag: "t" }, null), (e) => e instanceof OAuthStateError && e.code === "STATE_TENANT_MISMATCH");
  const updates = client.calls.filter((c) => c[0] === "update" && c[1] === "meta_oauth_states");
  assert.equal(updates.length, 0, "no write happens once the tenant mismatch is detected");
  const signature = serviceSrc.slice(serviceSrc.indexOf("async handleCallback"), serviceSrc.indexOf("async discoverPendingPages"));
  assert.doesNotMatch(signature.slice(0, signature.indexOf("{")), /organizationId|workspaceId/i, "handleCallback's own input type carries no org/workspace field");
});

// ---------------------------------------------------------------------------
// TOKEN (8-12)
// ---------------------------------------------------------------------------
function connectClient(pendingOverrides = {}) {
  const states = [{ state: "s1", organization_id: ORG, workspace_id: WS, created_by: USER, expires_at: new Date(Date.now() + 60000).toISOString(), consumed_at: null, return_path: "/return", ...pendingOverrides }];
  const rpcCalls = [];
  const client = makeFakeClient({
    states,
    rpcOverrides: { connect_meta_marketing_page: (params) => { rpcCalls.push(params); return { data: "conn-1", error: null }; } },
  });
  return { client, rpcCalls };
}
async function primePending(client, provider = fakeProvider(), state = "s1") {
  const svc = makeService({ client, provider });
  await svc.handleCallback({ code: "auth-code-123", state, error: null });
  return svc;
}

test("8/9: the access token is encrypted before persistence -- the raw page token is never present in the RPC params, and the ciphertext round-trips to the exact original", async () => {
  const { client, rpcCalls } = connectClient();
  const provider = fakeProvider({ listPages: [{ id: "page-1", name: "Sea View Realty", accessToken: "RAW-PAGE-TOKEN-SECRET" }] });
  const svc = await primePending(client, provider);
  await svc.saveConnection({ state: "s1", pageId: "page-1", adAccountId: null });
  assert.equal(rpcCalls.length, 1);
  const json = JSON.stringify(rpcCalls[0]);
  assert.ok(!json.includes("RAW-PAGE-TOKEN-SECRET"), "raw token must never appear in the RPC payload");
  const crypto = new TokenCryptoService();
  const decrypted = crypto.decrypt({ ciphertext: rpcCalls[0].p_token_ciphertext, iv: rpcCalls[0].p_token_iv, tag: rpcCalls[0].p_token_tag });
  assert.equal(decrypted, "RAW-PAGE-TOKEN-SECRET");
});
test("10/35: connection reads never select the ciphertext/iv/tag columns, and the UI component never references them", () => {
  const connectionColumnsLine = repositorySrc.slice(repositorySrc.indexOf("const connectionColumns"), repositorySrc.indexOf(";", repositorySrc.indexOf("const connectionColumns")));
  assert.doesNotMatch(connectionColumnsLine, /ciphertext/);
  const connectionMethodBody = repositorySrc.slice(repositorySrc.indexOf("async connection("), repositorySrc.indexOf("async getEncryptedToken("));
  assert.doesNotMatch(connectionMethodBody, /ciphertext/);
  assert.doesNotMatch(strip(uiSrc), /ciphertext|access_token|accessToken/i);
});
test("11: reconnecting rotates the encrypted token -- two saves produce two different ciphertexts for the same plaintext", async () => {
  const { client, rpcCalls } = connectClient();
  const svc = await primePending(client);
  await svc.saveConnection({ state: "s1", pageId: "page-1", adAccountId: null });
  // simulate a fresh OAuth round for reconnect
  client.tables.meta_oauth_states.push({ state: "s2", organization_id: ORG, workspace_id: WS, created_by: USER, expires_at: new Date(Date.now() + 60000).toISOString(), consumed_at: null });
  const svc2 = await primePending(client, fakeProvider({ listPages: [{ id: "page-1", name: "Sea View Realty", accessToken: "page-1-token" }] }), "s2");
  await svc2.saveConnection({ state: "s2", pageId: "page-1", adAccountId: null });
  assert.equal(rpcCalls.length, 2);
  assert.notEqual(rpcCalls[0].p_token_ciphertext, rpcCalls[1].p_token_ciphertext, "AES-GCM uses a fresh random IV per encryption, so ciphertext differs even for identical plaintext");
});
test("12: disconnect sets status='disconnected', soft-deletes the row, and deactivates every mapping tied to that connection (migration-level, so no future resolver can use it)", () => {
  const fn = migrationSql.slice(migrationSql.indexOf("function public.disconnect_meta_marketing"));
  assert.match(fn, /status = 'disconnected', deleted_at = now\(\)/);
  assert.match(fn, /update meta_lead_form_mappings\s*\n\s*set status = 'inactive'.*\n\s*where connection_id = v_connection_id and status = 'active'/);
});

// ---------------------------------------------------------------------------
// CONNECTION (13-16)
// ---------------------------------------------------------------------------
test("13/14: reads are tenant-scoped -- a same-tenant connection is visible, a cross-tenant one is hidden even by direct repository call", async () => {
  const connections = [
    { id: "conn-A", organization_id: ORG, workspace_id: WS, deleted_at: null, business_id: null, page_id: "page-1", page_name: "A", ad_account_id: null, ad_account_name: null, instagram_business_account_id: null, token_expires_at: null, scopes: [], status: "connected", connected_at: "t", updated_at: "t" },
    { id: "conn-B", organization_id: "org-B", workspace_id: "ws-B", deleted_at: null, business_id: null, page_id: "page-2", page_name: "B", ad_account_id: null, ad_account_name: null, instagram_business_account_id: null, token_expires_at: null, scopes: [], status: "connected", connected_at: "t", updated_at: "t" },
  ];
  const client = makeFakeClient({ connections });
  const repoA = new MetaMarketingRepository(client, ORG, WS);
  const repoOther = new MetaMarketingRepository(client, "org-other", "ws-other");
  assert.equal((await repoA.connection()).id, "conn-A");
  assert.equal(await repoOther.connection(), null);
});
test("15/16: a Page not returned by the provider's own discovery (arbitrary/unknown) is rejected", async () => {
  const { client } = connectClient();
  const svc = await primePending(client);
  await assert.rejects(() => svc.saveConnection({ state: "s1", pageId: "not-a-real-page", adAccountId: null }), (e) => e instanceof MetaConnectError && e.code === "PAGE_NOT_FOUND");
});
test("an ad account not returned by discovery is rejected the same way", async () => {
  const { client } = connectClient();
  const svc = await primePending(client);
  await assert.rejects(() => svc.saveConnection({ state: "s1", pageId: "page-1", adAccountId: "act_unknown" }), (e) => e instanceof MetaConnectError && e.code === "AD_ACCOUNT_NOT_FOUND");
});
test("ad account and Instagram discovery are best-effort -- a missing scope (thrown error) never fails the connect", async () => {
  const { client, rpcCalls } = connectClient();
  const svc = await primePending(client, fakeProvider({ listAdAccountsThrows: true, listInstagramThrows: true }));
  const result = await svc.saveConnection({ state: "s1", pageId: "page-1", adAccountId: null });
  assert.ok(result.connectionId);
  assert.equal(rpcCalls[0].p_ad_account_id, null);
  assert.equal(rpcCalls[0].p_instagram_business_account_id, null);
});

// ---------------------------------------------------------------------------
// FORM MAPPING (17-23)
// ---------------------------------------------------------------------------
function connectedClient(overrides = {}) {
  const connections = [{ id: "conn-1", organization_id: ORG, workspace_id: WS, deleted_at: null, business_id: null, page_id: "page-1", page_name: "Sea View Realty", ad_account_id: null, ad_account_name: null, instagram_business_account_id: null, token_expires_at: null, scopes: [], status: "connected", connected_at: "t", updated_at: "t" }];
  const rpcCalls = [];
  const client = makeFakeClient({
    connections,
    rpcOverrides: { create_meta_lead_form_mapping: (params) => { rpcCalls.push(params); return { data: "mapping-1", error: null }; } },
    ...overrides,
  });
  return { client, rpcCalls };
}
test("17: a form the provider actually returned can be mapped", async () => {
  const { client, rpcCalls } = connectedClient();
  const crypto = new TokenCryptoService();
  const encrypted = crypto.encrypt("page-1-token");
  client.tables.meta_marketing_connections[0].access_token_ciphertext = encrypted.ciphertext;
  client.tables.meta_marketing_connections[0].access_token_iv = encrypted.iv;
  client.tables.meta_marketing_connections[0].access_token_tag = encrypted.tag;
  const svc = makeService({ client });
  const id = await svc.createFormMapping({ formId: "form-1", propertyId: "prop-1", campaignId: null });
  assert.equal(id, "mapping-1");
  assert.equal(rpcCalls[0].p_form_id, "form-1");
  assert.equal(rpcCalls[0].p_property_id, "prop-1");
});
test("18: an arbitrary/unknown form id is rejected before any RPC call", async () => {
  const { client, rpcCalls } = connectedClient();
  const crypto = new TokenCryptoService();
  const encrypted = crypto.encrypt("page-1-token");
  Object.assign(client.tables.meta_marketing_connections[0], { access_token_ciphertext: encrypted.ciphertext, access_token_iv: encrypted.iv, access_token_tag: encrypted.tag });
  const svc = makeService({ client });
  await assert.rejects(() => svc.createFormMapping({ formId: "form-does-not-exist", propertyId: "prop-1", campaignId: null }), (e) => e instanceof MetaConnectError && e.code === "FORM_NOT_FOUND");
  assert.equal(rpcCalls.length, 0);
});
test("19/20/22: property, connection and page ownership are all re-verified server-side in the RPC, scoped to the caller's own organization+workspace", () => {
  const fn = migrationSql.slice(migrationSql.indexOf("function public.create_meta_lead_form_mapping"));
  assert.match(fn, /from meta_marketing_connections\s*\n\s*where id = p_connection_id and organization_id = v_org and workspace_id = p_workspace_id\s*\n\s*and deleted_at is null and status = 'connected' and page_id = p_page_id/);
  assert.match(fn, /from properties\s*\n\s*where id = p_property_id and organization_id = v_org and workspace_id = p_workspace_id and deleted_at is null/);
  assert.match(fn, /PROPERTY_NOT_FOUND/);
  assert.match(fn, /CONNECTION_NOT_FOUND/);
});
test("21: resolveMetaLeadTenant() is deterministic -- zero or multiple active mappings for a form both return null, never a guess", async () => {
  const none = makeFakeClient({ mappings: [] });
  assert.equal(await resolveMetaLeadTenant(none, "page-1", "form-1"), null);
  const many = makeFakeClient({
    mappings: [
      { organization_id: ORG, workspace_id: WS, connection_id: "c1", property_id: "p1", campaign_id: null, page_id: "page-1", form_id: "form-1", status: "active" },
      { organization_id: "org-B", workspace_id: "ws-B", connection_id: "c2", property_id: "p2", campaign_id: null, page_id: "page-1", form_id: "form-1", status: "active" },
    ],
  });
  assert.equal(await resolveMetaLeadTenant(many, "page-1", "form-1"), null);
  const exactlyOne = makeFakeClient({
    mappings: [{ organization_id: ORG, workspace_id: WS, connection_id: "c1", property_id: "p1", campaign_id: "camp-1", page_id: "page-1", form_id: "form-1", status: "active" }],
    connections: [{ id: "c1", status: "connected", deleted_at: null }],
  });
  assert.deepEqual(await resolveMetaLeadTenant(exactlyOne, "page-1", "form-1"), { organizationId: ORG, workspaceId: WS, connectionId: "c1", propertyId: "p1", campaignId: "camp-1" });
  const disconnectedConnection = makeFakeClient({
    mappings: [{ organization_id: ORG, workspace_id: WS, connection_id: "c1", property_id: "p1", campaign_id: null, page_id: "page-1", form_id: "form-1", status: "active" }],
    connections: [{ id: "c1", status: "disconnected", deleted_at: "2026-01-01" }],
  });
  assert.equal(await resolveMetaLeadTenant(disconnectedConnection, "page-1", "form-1"), null, "an active mapping whose connection is no longer connected must not resolve");
});
test("23: an active mapping for a form_id is unique at the database level (partial unique index) and the RPC pre-checks it with a friendly error", () => {
  assert.match(migrationSql, /create unique index meta_lead_form_mappings_one_active_per_form\s*\n\s*on public\.meta_lead_form_mappings \(form_id\)\s*\n\s*where status = 'active'/);
  const fn = migrationSql.slice(migrationSql.indexOf("function public.create_meta_lead_form_mapping"));
  assert.match(fn, /FORM_ALREADY_MAPPED/);
});

// ---------------------------------------------------------------------------
// UI (24-30)
// ---------------------------------------------------------------------------
test("24: the Meta Marketing card is real and connectable (not a coming-soon placeholder)", () => {
  const entry = registrySrc.slice(registrySrc.indexOf('provider("meta_ads"'), registrySrc.indexOf('provider("meta_ads"') + 200);
  assert.match(entry, /"Meta Marketing \/ Lead Ads"/);
  assert.match(entry, /settingsHref: "\/vayon\/settings\/integrations\/meta-marketing"/);
  assert.match(entry, /available: true/);
});
test("25/26/27/28: connection status, provider-backed Page selection, provider-backed Lead Form selection, and property mapping are all rendered from server-supplied props", () => {
  assert.match(uiSrc, /\{connection\.status\}/);
  assert.match(uiSrc, /pendingPages\.map\(\(page, index\)/);
  assert.match(uiSrc, /type="radio" name="pageId" value=\{page\.id\}/);
  assert.match(uiSrc, /unmappedForms\.map\(\(form\)/);
  assert.match(uiSrc, /properties\.map\(\(property\)/);
});
test("29/30: no campaign publish control and no ad-spend control exist anywhere in the UI", () => {
  assert.doesNotMatch(strip(uiSrc), /publish|create campaign|launch campaign|ad spend|budget|daily spend/i);
});

// ---------------------------------------------------------------------------
// SECURITY (31-35)
// ---------------------------------------------------------------------------
test("31/32: no access token or authorization code is ever logged -- Graph errors are sanitized before surfacing", () => {
  for (const src of [providerSrc, serviceSrc, oauthStateSrc, actionsSrc, callbackSrc]) {
    assert.doesNotMatch(strip(src), /console\.log|console\.error|captureException\([^)]*token/i);
  }
  assert.match(providerSrc, /function sanitizeGraphError/);
  const sanitize = providerSrc.slice(providerSrc.indexOf("function sanitizeGraphError"), providerSrc.indexOf("async function graphGet"));
  assert.doesNotMatch(sanitize, /access_token|code/);
  assert.match(callbackSrc, /captureException\(error, \{ operation: "meta_marketing_oauth_callback" \}\)/);
});
test("33: a raw connection/token id cannot cross tenants -- getEncryptedToken scopes by organization AND workspace, not id alone", async () => {
  const connections = [{ id: "conn-shared-id", organization_id: "org-B", workspace_id: "ws-B", deleted_at: null, access_token_ciphertext: "c", access_token_iv: "i", access_token_tag: "t" }];
  const client = makeFakeClient({ connections });
  const repo = new MetaMarketingRepository(client, ORG, WS);
  assert.equal(await repo.getEncryptedToken("conn-shared-id"), null);
});
test("34: a CSRF/state failure closes the flow before anything is persisted", async () => {
  const { client, rpcCalls } = connectClient({ organization_id: "org-B", workspace_id: "ws-B", created_by: "user-B" });
  const svc = makeService({ client });
  await assert.rejects(() => svc.handleCallback({ code: "auth-code", state: "s1", error: null }), (e) => e instanceof OAuthStateError);
  assert.equal(rpcCalls.length, 0, "no connection RPC is ever reached");
});
test("Part 22: missing code, provider denial, and a missing state all fail closed without any provider/RPC call", async () => {
  const { client: c1, rpcCalls: r1 } = connectClient();
  await assert.rejects(() => makeService({ client: c1 }).handleCallback({ code: null, state: "s1", error: null }), (e) => e instanceof MetaConnectError && e.code === "OAUTH_CODE_MISSING");
  assert.equal(r1.length, 0);
  const { client: c2, rpcCalls: r2 } = connectClient();
  await assert.rejects(() => makeService({ client: c2 }).handleCallback({ code: null, state: "s1", error: "access_denied" }), (e) => e instanceof MetaConnectError && e.code === "OAUTH_DENIED");
  assert.equal(r2.length, 0);
  assert.match(callbackSrc, /if \(!state\) \{/);
});
test("Part 22: a token-exchange failure never reaches storePendingToken/persists nothing", async () => {
  const { client, rpcCalls } = connectClient();
  const failingProvider = fakeProvider({ exchangeCode: undefined });
  failingProvider.exchangeCode = async () => { throw new Error("Meta Graph API request failed."); };
  const svc = makeService({ client, provider: failingProvider });
  await assert.rejects(() => svc.handleCallback({ code: "auth-code", state: "s1", error: null }));
  assert.equal(client.tables.meta_oauth_states[0].pending_token_ciphertext, undefined);
  assert.equal(rpcCalls.length, 0);
});

// ---------------------------------------------------------------------------
// SIDE EFFECTS (36-41)
// ---------------------------------------------------------------------------
test("36/37/38/39/40/41: no CRM lead, no property interest, no WhatsApp send, no Meta ad publishing, no ad-spend control, no OpenAI call exist anywhere in M1/M2", () => {
  // M6 (a later, separately-authorized phase) legitimately extended repositorySrc/uiSrc with a
  // WhatsApp *consent-rule* channel value ("whatsapp" as data, e.g. channel: "whatsapp") and UI
  // copy ("WhatsApp outreach consent") -- neither is a send. The narrower send-specific terms
  // below (sendText, a literal WhatsApp Graph messages call, whatsapp_messages table writes)
  // are what this test actually guards against.
  for (const src of [providerSrc, serviceSrc, repositorySrc, actionsSrc, resolverSrc, oauthStateSrc, uiSrc]) {
    assert.doesNotMatch(strip(src), /\.from\("leads"\)|create_lead|lead_property_interests|sendText|whatsapp_messages|graph\.facebook\.com\/[^"'`]*\/(messages|campaigns|adsets|ads|adcreatives)\b|openai|OpenAIProvider/i);
  }
  assert.doesNotMatch(migrationSql, /\binsert into leads\b|\blead_property_interests\b/i);
  assert.doesNotMatch(providerSrc, /\/campaigns|\/adsets|\/adcreatives|"\/ads"/);
});

// ---------------------------------------------------------------------------
// PROPERTY MODEL (Model A only)
// ---------------------------------------------------------------------------
test("the form-mapping table points at public.properties (Model A), never property_projects (Model B)", () => {
  assert.match(migrationSql, /property_id uuid not null references public\.properties\(id\)/);
  assert.doesNotMatch(migrationSql, /property_projects/);
});

// ---------------------------------------------------------------------------
// PERMISSIONS / ENTITLEMENT
// ---------------------------------------------------------------------------
test("connecting/disconnecting/mapping all require integrations:manage at the app layer plus can_manage_integrations() at the DB layer -- no second role system", () => {
  assert.match(actionsSrc, /requireWorkspacePermission\("integrations", "manage"\)/);
  for (const fnName of ["connect_meta_marketing_page", "disconnect_meta_marketing", "create_meta_lead_form_mapping", "disable_meta_lead_form_mapping"]) {
    const fn = migrationSql.slice(migrationSql.indexOf(`function public.${fnName}`));
    assert.match(fn, /can_manage_integrations\(p_workspace_id\)/);
  }
  assert.doesNotMatch(strip(actionsSrc), /requireEntitlement\(/);
});
test("all four write RPCs are revoked from public and granted only to authenticated", () => {
  for (const [name, args] of [
    ["connect_meta_marketing_page", "uuid, text, text, text, text, text, text, text, text, text, timestamptz, text\\[\\]"],
    ["disconnect_meta_marketing", "uuid"],
    ["create_meta_lead_form_mapping", "uuid, uuid, text, text, text, uuid, uuid"],
    ["disable_meta_lead_form_mapping", "uuid, uuid"],
  ]) {
    assert.match(migrationSql, new RegExp(`revoke all on function public\\.${name}\\(${args}\\) from public;`));
    assert.match(migrationSql, new RegExp(`grant execute on function public\\.${name}\\(${args}\\) to authenticated;`));
  }
});

// ---------------------------------------------------------------------------
// SCOPES
// ---------------------------------------------------------------------------
test("only the minimal M1/M2 discovery scopes are requested by default", () => {
  const { metaMarketingOAuthScopes } = load("features/platform/integrations/meta-marketing/domain/types.ts");
  assert.deepEqual([...metaMarketingOAuthScopes], ["pages_show_list", "leads_retrieval"]);
  assert.doesNotMatch(strip(providerSrc), /ads_management|instagram_basic|business_management/);
});

// ---------------------------------------------------------------------------
// REGRESSION (42-44)
// ---------------------------------------------------------------------------
test("42: no Meta Marketing file imports the WhatsApp AI-orchestration runtime (E1-E6) -- the two integrations remain uncoupled, and the (committed) K-series trusted OpenAI runtime makes no reference to Meta Marketing either", () => {
  for (const src of [providerSrc, serviceSrc, repositorySrc, actionsSrc, resolverSrc, oauthStateSrc, uiSrc, callbackSrc, registrySrc]) {
    assert.doesNotMatch(src, /whatsapp-ai-orchestrator/i);
  }
  assert.doesNotMatch(trustedRuntimeSrc, /meta-marketing|meta_marketing/i);
});
test("43: K1-K6 property-knowledge retrieval makes no reference to Meta Marketing", () => {
  assert.doesNotMatch(k4RetrievalSrc, /meta-marketing|meta_marketing/i);
});
test("44: only the meta_ads registry entry changed -- every other integration entry is untouched", () => {
  for (const untouched of ['provider("whatsapp_business"', 'provider("google_identity"', 'provider("facebook", "Facebook", "social")', 'provider("instagram", "Instagram", "social")']) {
    assert.ok(registrySrc.includes(untouched), untouched);
  }
});

// ---------------------------------------------------------------------------
// MIGRATION SEQUENCING
// ---------------------------------------------------------------------------
test("migration is strictly after K6 and does not modify any earlier migration", () => {
  assert.ok("20261115000000" > "20261114000000");
  const earlier = readdirSync("supabase/migrations").filter((f) => f < "20261115000000_meta_marketing_connection.sql" && f.startsWith("2026111"));
  for (const file of earlier) assert.doesNotMatch(rd(`supabase/migrations/${file}`), /meta_marketing_connections|meta_lead_form_mappings|meta_oauth_states/);
});
