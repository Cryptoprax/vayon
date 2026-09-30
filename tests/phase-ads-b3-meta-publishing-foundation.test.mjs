import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

function fakeClient({ tables = {}, rpcs = {} } = {}) {
  const rpcCalls = [];
  function builder(table) {
    const filters = [];
    let rows = tables[table] ?? [];
    const api = {
      select() { return api; },
      eq(col, val) { filters.push((row) => row[col] === val); return api; },
      order() { return api; },
      limit() { return api; },
      maybeSingle: async () => {
        const matched = rows.filter((row) => filters.every((f) => f(row)));
        return { data: matched[0] ?? null, error: null };
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
    _rpcCalls: rpcCalls,
  };
}

const rd = (p) => readFileSync(p, "utf8");
const migration = rd("supabase/migrations/20261206000000_ads_b3_meta_publishing_foundation.sql");
const migrationSql = migration.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");

function loadRepository(overrides = {}) {
  const { MetaAdsRepository } = load("features/vayon/meta-ads/meta-ads.repository.ts", overrides);
  return MetaAdsRepository;
}
function loadTargetingTranslation() {
  return load("features/vayon/meta-ads/targeting-translation.ts", {});
}
function loadCreativeTranslation() {
  return load("features/vayon/meta-ads/creative-translation.ts", {});
}
function loadLeadFormBinding() {
  return load("features/vayon/meta-ads/lead-form-binding.ts", {});
}
function loadFakeProvider() {
  return load("features/vayon/meta-ads/providers/meta-ads.provider.ts", {});
}
function loadGraphProviderGuard() {
  return load("features/platform/integrations/meta-marketing/providers/meta-graph.provider.ts", {});
}

// ---------------------------------------------------------------------------
// PART 24: no real Meta writes, under every flag state.
// ---------------------------------------------------------------------------
test("requireMetaMarketingWritesEnabled (REUSED from the existing C6 guard, not duplicated) denies when unset", () => {
  const original = process.env.META_MARKETING_WRITES_ENABLED;
  delete process.env.META_MARKETING_WRITES_ENABLED;
  try {
    const { requireMetaMarketingWritesEnabled, MetaMarketingWritesDisabledError } = loadGraphProviderGuard();
    assert.throws(() => requireMetaMarketingWritesEnabled(), MetaMarketingWritesDisabledError);
  } finally {
    if (original === undefined) delete process.env.META_MARKETING_WRITES_ENABLED; else process.env.META_MARKETING_WRITES_ENABLED = original;
  }
});

test("requireMetaMarketingWritesEnabled denies 'false', 'TRUE', '1', 'yes' -- only the literal string \"true\" may proceed", () => {
  const original = process.env.META_MARKETING_WRITES_ENABLED;
  try {
    const { requireMetaMarketingWritesEnabled, MetaMarketingWritesDisabledError } = loadGraphProviderGuard();
    for (const value of ["false", "TRUE", "1", "yes", "True", " true", "true "]) {
      process.env.META_MARKETING_WRITES_ENABLED = value;
      assert.throws(() => requireMetaMarketingWritesEnabled(), MetaMarketingWritesDisabledError, `expected "${value}" to be denied`);
    }
    process.env.META_MARKETING_WRITES_ENABLED = "true";
    assert.doesNotThrow(() => requireMetaMarketingWritesEnabled());
  } finally {
    if (original === undefined) delete process.env.META_MARKETING_WRITES_ENABLED; else process.env.META_MARKETING_WRITES_ENABLED = original;
  }
});

test("MetaPublishWorker.processOne calls the centralized write guard before claiming or touching the provider at all", () => {
  const source = rd("features/vayon/meta-ads/meta-ads.service.ts");
  const processOneBody = source.slice(source.indexOf("async processOne("));
  const guardIndex = processOneBody.indexOf("requireMetaMarketingWritesEnabled()");
  const claimIndex = processOneBody.indexOf("this.repository.claimPublish");
  assert.ok(guardIndex > -1 && claimIndex > -1 && guardIndex < claimIndex, "the write guard must run before the worker ever claims a row");
});

test("MetaPublishWorker imports requireMetaMarketingWritesEnabled from the existing meta-marketing provider file -- it does not define a second guard", () => {
  const source = rd("features/vayon/meta-ads/meta-ads.service.ts");
  assert.match(source, /import \{ requireMetaMarketingWritesEnabled \} from "@\/features\/platform\/integrations\/meta-marketing\/providers\/meta-graph\.provider"/);
  assert.doesNotMatch(source, /function requireMetaMarketingWritesEnabled/);
});

test("FakeMetaAdsProvider never calls fetch or reads an env var -- fully deterministic, no network", () => {
  const source = rd("features/vayon/meta-ads/providers/meta-ads.provider.ts");
  const fakeClassBody = source.slice(source.indexOf("export class FakeMetaAdsProvider"));
  assert.doesNotMatch(fakeClassBody, /fetch\(|process\.env|graph\.facebook\.com/);
});

test("FakeMetaAdsProvider produces deterministic, distinct provider object ids across create calls", async () => {
  const { FakeMetaAdsProvider } = loadFakeProvider();
  const provider = new FakeMetaAdsProvider();
  const campaign = await provider.createCampaign({ adAccountId: "act_1", name: "C", objective: "lead_generation", specialAdCategory: null });
  const adSet = await provider.createAdSet({ providerCampaignId: campaign.providerObjectId, name: "AS", dailyBudgetMinorUnits: null, lifetimeBudgetMinorUnits: null, targetingSpec: {} });
  assert.notEqual(campaign.providerObjectId, adSet.providerObjectId);
  assert.match(campaign.providerObjectId, /^fake:/);
});

// ---------------------------------------------------------------------------
// MIGRATION STATIC CHECKS -- caller model, prerequisite gate, idempotency,
// partial failure, uncertain state, tenant isolation, fail-closed.
// ---------------------------------------------------------------------------
test("ACL: request_meta_campaign_publish is Model A (authenticated only, service_role explicitly revoked)", () => {
  const sig = "request_meta_campaign_publish(uuid, jsonb)";
  assert.match(migrationSql, new RegExp(`revoke all on function public\\.${sig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} from service_role;`));
  assert.match(migrationSql, new RegExp(`grant execute on function public\\.${sig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} to authenticated;`));
});

test("ACL: claim/upsert/complete/mark_uncertain are all Model B (service_role only, authenticated explicitly revoked, anon revoked)", () => {
  for (const sig of [
    "claim_meta_campaign_publish(uuid)",
    "upsert_meta_provider_object(uuid, text, uuid, uuid, text, text, text, text, jsonb)",
    "complete_meta_campaign_publish(uuid, boolean, text, text, text)",
    "mark_meta_campaign_publish_uncertain(uuid, text)",
  ]) {
    const escaped = sig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(migrationSql, new RegExp(`revoke all on function public\\.${escaped} from authenticated;`));
    assert.match(migrationSql, new RegExp(`revoke all on function public\\.${escaped} from anon;`));
    assert.match(migrationSql, new RegExp(`grant execute on function public\\.${escaped} to service_role;`));
    assert.doesNotMatch(migrationSql, new RegExp(`grant execute on function public\\.${escaped} to authenticated;`));
  }
});

test("prerequisite gate: request_meta_campaign_publish checks provider='meta', channel approval, approved+approved-budget, all-passed creatives, active connection with ad_account_id, and targeting intent -- in that order, fail closed", () => {
  const body = migrationSql.slice(migrationSql.indexOf("function public.request_meta_campaign_publish("), migrationSql.indexOf("function public.claim_meta_campaign_publish("));
  const order = [
    "if e.provider <> 'meta' then",
    "is_source_approved(o, w, 'campaign_channel_execution', e.id, 'campaign_channel_publish')",
    "status = 'approved'",
    "is_source_approved(o, w, 'campaign_budget_intent', v_budget.id, 'campaign_budget_change')",
    "are_required_creatives_evaluated(e.campaign_id, e.id)",
    "status = 'connected' and deleted_at is null",
    "v_connection.ad_account_id is null",
    "campaign_targeting_intents",
  ];
  let cursor = 0;
  for (const marker of order) {
    const idx = body.indexOf(marker, cursor);
    assert.ok(idx > -1, `expected to find "${marker}" in request_meta_campaign_publish`);
    cursor = idx;
  }
});

test("trusted-worker re-check (Part 7, no service_role bypass): claim_meta_campaign_publish re-verifies channel approval, budget approval, and creative readiness independently of request-time checks", () => {
  const body = migrationSql.slice(migrationSql.indexOf("function public.claim_meta_campaign_publish("));
  assert.match(body, /is_source_approved\(x\.organization_id, x\.workspace_id, 'campaign_channel_execution', x\.channel_execution_id, 'campaign_channel_publish'\)/);
  assert.match(body, /is_source_approved\(x\.organization_id, x\.workspace_id, 'campaign_budget_intent', b\.id, 'campaign_budget_change'\)/);
  assert.match(body, /CREATIVE_NOT_READY/);
});

test("claim_meta_campaign_publish inlines the readiness check rather than calling the Model-A-only are_required_creatives_evaluated RPC (which would fail under service_role)", () => {
  const body = migrationSql.slice(migrationSql.indexOf("function public.claim_meta_campaign_publish("), migrationSql.indexOf("function public.upsert_meta_provider_object("));
  assert.doesNotMatch(body, /public\.are_required_creatives_evaluated\(/);
  assert.match(body, /bool_and\(ce\.status = 'passed'\)/);
});

test("idempotency: at most one in-flight publish execution per channel execution", () => {
  assert.match(migrationSql, /create unique index if not exists meta_publish_execution_one_inflight_idx/);
  assert.match(migrationSql, /where status in \('pending','claimed','publishing'\)/);
});

test("idempotency: provider objects are keyed per (publish_execution_id, object_type, creative_asset_id) so repeated worker execution cannot create duplicates", () => {
  assert.match(migrationSql, /create unique index if not exists meta_provider_object_idempotency_idx/);
  assert.match(migrationSql, /on public\.meta_provider_objects\(publish_execution_id, object_type, coalesce\(creative_asset_id, '00000000-0000-0000-0000-000000000000'::uuid\)\)/);
});

test("upsert_meta_provider_object is idempotent via ON CONFLICT on the same key, and never regresses a real provider_object_id back to null", () => {
  const body = migrationSql.slice(migrationSql.indexOf("function public.upsert_meta_provider_object("));
  assert.match(body, /on conflict \(publish_execution_id, object_type, coalesce\(creative_asset_id, '00000000-0000-0000-0000-000000000000'::uuid\)\)/);
  assert.match(body, /provider_object_id = coalesce\(excluded\.provider_object_id, meta_provider_objects\.provider_object_id\)/);
});

test("partial failure model: complete_meta_campaign_publish accepts 'partial_failure' as a genuine terminal status distinct from 'succeeded' and ordinary 'failed'", () => {
  assert.match(migrationSql, /check \(status in \('pending','claimed','publishing','succeeded','partial_failure','failed','uncertain'\)\)/);
  const body = migrationSql.slice(migrationSql.indexOf("function public.complete_meta_campaign_publish("));
  assert.match(body, /if p_status not in \('succeeded', 'partial_failure'\) then/);
});

test("uncertain outcome is a distinct RPC from ordinary completion, and a row marked uncertain is not claimable by claim_meta_campaign_publish (no blind retry)", () => {
  assert.match(migrationSql, /function public\.mark_meta_campaign_publish_uncertain\(/);
  const claimBody = migrationSql.slice(migrationSql.indexOf("function public.claim_meta_campaign_publish("), migrationSql.indexOf("function public.upsert_meta_provider_object("));
  assert.match(claimBody, /where id = p_publish_execution_id and \(status = 'pending' or \(status = 'failed' and attempts < max_attempts\)\)/);
  assert.doesNotMatch(claimBody, /'uncertain'/);
});

test("fail-closed on ordinary failure: complete_meta_campaign_publish never reads a caller-supplied status for the p_success=false branch", () => {
  const body = migrationSql.slice(migrationSql.indexOf("function public.complete_meta_campaign_publish("));
  const failBranch = body.slice(body.indexOf("if not p_success then"), body.indexOf("if p_status not in"));
  assert.doesNotMatch(failBranch, /p_status\b/);
});

test("worker claim concurrency: claim_meta_campaign_publish uses FOR UPDATE SKIP LOCKED", () => {
  const body = migrationSql.slice(migrationSql.indexOf("function public.claim_meta_campaign_publish("));
  assert.match(body, /for update skip locked/);
});

test("tenant isolation: request_meta_campaign_publish derives org/workspace exclusively from the caller's own workspace_members row, and re-scopes the channel execution to it", () => {
  const body = migrationSql.slice(migrationSql.indexOf("function public.request_meta_campaign_publish("));
  assert.match(body, /wm\.user_id = auth\.uid\(\) and wm\.status = 'active'/);
  assert.match(body, /where id = p_channel_execution_id and organization_id = o and workspace_id = w for update;/);
});

test("RLS: both new tables have a tenant-scoped read policy and no direct write policy -- every write is RPC-only", () => {
  for (const [table, policy] of [["meta_campaign_publish_executions", "meta_publish_execution_read"], ["meta_provider_objects", "meta_provider_object_read"]]) {
    assert.match(migrationSql, new RegExp(`alter table public\\.${table} enable row level security;`));
    assert.match(migrationSql, new RegExp(`create policy "${policy}" on public\\.${table}\\s*\\n\\s*for select to authenticated\\s*\\n\\s*using \\(public\\.creative_studio_member\\(organization_id, workspace_id\\)\\);`));
    assert.doesNotMatch(migrationSql, new RegExp(`create policy.*${table}.*for (insert|update|delete|all)`, "i"));
  }
});

test("provider_object_id can only ever be written by a trusted worker -- authenticated has zero execute on upsert_meta_provider_object", () => {
  assert.match(migrationSql, /revoke all on function public\.upsert_meta_provider_object\([^)]*\) from authenticated;/);
});

test("no secret or token column is introduced anywhere in this migration (Part 21: token security)", () => {
  assert.doesNotMatch(migrationSql, /token|secret|ciphertext|access_token/i);
});

test("no provider/network reference, no ALTER DEFAULT PRIVILEGES, no migration-history statement -- fresh-replay safe", () => {
  assert.doesNotMatch(migrationSql, /alter default privileges/i);
  assert.doesNotMatch(migrationSql, /deployment_migration_history|schema_migrations/i);
  assert.doesNotMatch(migrationSql, /fetch\(|https?:\/\/|graph\.facebook\.com|new OpenAI\(/i);
});

test("meta_campaign_publish_executions and meta_provider_objects status vocabularies are each independent from creative_evaluations and campaign_channel_executions (Part 19)", () => {
  assert.doesNotMatch(migrationSql, /'passed','needs_review'/);
  assert.doesNotMatch(migrationSql, /'draft','ready_for_review'/);
});

test("no ads_campaigns-style parallel source of truth: every new table references creative_campaigns and campaign_channel_executions by id", () => {
  assert.match(migrationSql, /campaign_id uuid not null references public\.creative_campaigns\(id\) on delete cascade/);
  const channelRefs = migrationSql.split("channel_execution_id uuid not null references public.campaign_channel_executions(id) on delete cascade").length - 1;
  assert.equal(channelRefs, 2, "expected both meta_campaign_publish_executions and meta_provider_objects to reference campaign_channel_executions directly");
});

// ---------------------------------------------------------------------------
// PURE FUNCTION TESTS -- targeting/creative translation, lead form binding
// ---------------------------------------------------------------------------
test("translateTargetingIntent never returns 'verified' for any field -- no authoritative Meta targeting spec exists in this repo", () => {
  const { translateTargetingIntent } = loadTargetingTranslation();
  const result = translateTargetingIntent({ country: "US", region: null, city: "Austin", language: "en", buyerPersona: "first-time buyer", propertyType: "apartment", objective: "lead_generation" });
  for (const field of Object.values(result.fields)) {
    assert.notEqual(field.status, "verified");
  }
  assert.equal(result.metaTargetingSpec, null);
});

test("translateTargetingIntent with no intent at all returns external_policy_verification_required", () => {
  const { translateTargetingIntent } = loadTargetingTranslation();
  const result = translateTargetingIntent(null);
  assert.equal(result.overallStatus, "external_policy_verification_required");
});

test("translateCreativeForMeta returns null (never fabricated) when the creative has no storage_path", () => {
  const { translateCreativeForMeta } = loadCreativeTranslation();
  const result = translateCreativeForMeta({ id: "a1", category: "image", storagePath: null }, { status: "passed" });
  assert.equal(result, null);
});

test("translateCreativeForMeta returns null when the creative has not passed evaluation", () => {
  const { translateCreativeForMeta } = loadCreativeTranslation();
  assert.equal(translateCreativeForMeta({ id: "a1", category: "image", storagePath: "s3://x" }, { status: "needs_review" }), null);
  assert.equal(translateCreativeForMeta({ id: "a1", category: "image", storagePath: "s3://x" }, null), null);
});

test("translateCreativeForMeta maps a passed image creative to single_image format", () => {
  const { translateCreativeForMeta } = loadCreativeTranslation();
  const result = translateCreativeForMeta({ id: "a1", category: "image", storagePath: "s3://x" }, { status: "passed" });
  assert.equal(result?.format, "single_image");
});

test("resolveLeadFormRequirement: no configured lead form -> not required", () => {
  const { resolveLeadFormRequirement } = loadLeadFormBinding();
  assert.deepEqual(resolveLeadFormRequirement(null), { required: false, reason: "no_lead_form_configured" });
});

test("resolveLeadFormRequirement: created with a mapping -> reusable, not required again", () => {
  const { resolveLeadFormRequirement } = loadLeadFormBinding();
  const result = resolveLeadFormRequirement({ status: "created", providerFormId: "form1", formMappingId: "map1" });
  assert.equal(result.required, false);
  assert.equal(result.reason, "reusable");
});

test("resolveLeadFormRequirement: created but unmapped -> mapping needed, never a real form re-created", () => {
  const { resolveLeadFormRequirement } = loadLeadFormBinding();
  const result = resolveLeadFormRequirement({ status: "created", providerFormId: "form1", formMappingId: null });
  assert.equal(result.required, true);
  assert.equal(result.reason, "mapping_needed");
});

test("resolveLeadFormRequirement: draft/failed -> creation still needed", () => {
  const { resolveLeadFormRequirement } = loadLeadFormBinding();
  assert.equal(resolveLeadFormRequirement({ status: "draft", providerFormId: null, formMappingId: null }).reason, "creation_needed");
  assert.equal(resolveLeadFormRequirement({ status: "failed", providerFormId: null, formMappingId: null }).reason, "creation_needed");
});

// ---------------------------------------------------------------------------
// TS repository layer -- behavioral (fakeClient), no provider calls.
// ---------------------------------------------------------------------------
test("MetaAdsRepository.requestPublish calls request_meta_campaign_publish with exactly channelExecutionId/plan", async () => {
  const client = fakeClient({ rpcs: { request_meta_campaign_publish: async () => ({ data: "exec-1", error: null }) } });
  const Repository = loadRepository();
  const r = new Repository(client, "org-1", "ws-1");
  const plan = { objective: "lead_generation", budget: { currency: "USD", dailyBudget: null, lifetimeBudget: null, startAt: null, endAt: null }, targeting: {}, creativeMapping: [], leadFormRequired: false, leadFormMappingId: null, specialAdCategory: null, placementIntent: null, trackingIdentifiers: {} };
  const id = await r.requestPublish("channel-1", plan);
  assert.equal(id, "exec-1");
  assert.deepEqual(client._rpcCalls[0], ["request_meta_campaign_publish", { p_channel_execution_id: "channel-1", p_plan: plan }]);
});

test("MetaAdsRepository.claimPublish, upsertProviderObject, completePublish, markUncertain all call their exact corresponding RPC with the correct params", async () => {
  const client = fakeClient({
    rpcs: {
      claim_meta_campaign_publish: async () => ({ data: { id: "exec-1", status: "claimed", attempts: 1, max_attempts: 3, plan: {}, requested_at: "2026-01-01", campaign_id: "c1", channel_execution_id: "ch1", connection_id: "conn1" }, error: null }),
      upsert_meta_provider_object: async () => ({ data: "obj-1", error: null }),
      complete_meta_campaign_publish: async () => ({ data: null, error: null }),
      mark_meta_campaign_publish_uncertain: async () => ({ data: null, error: null }),
    },
  });
  const Repository = loadRepository();
  const r = new Repository(client, "org-1", "ws-1");

  const claimed = await r.claimPublish("exec-1");
  assert.equal(claimed?.status, "claimed");
  assert.deepEqual(client._rpcCalls[0], ["claim_meta_campaign_publish", { p_publish_execution_id: "exec-1" }]);

  await r.upsertProviderObject({ publishExecutionId: "exec-1", objectType: "campaign", parentObjectId: null, creativeAssetId: null, providerObjectId: "fake:1", status: "created", errorCode: null, errorMessage: null, responseMetadata: {} });
  assert.equal(client._rpcCalls[1][0], "upsert_meta_provider_object");
  assert.equal(client._rpcCalls[1][1].p_object_type, "campaign");

  await r.completePublish("exec-1", true, "succeeded", null, null);
  assert.deepEqual(client._rpcCalls[2], ["complete_meta_campaign_publish", { p_publish_execution_id: "exec-1", p_success: true, p_status: "succeeded", p_error_code: null, p_error_message: null }]);

  await r.markUncertain("exec-1", "timeout");
  assert.deepEqual(client._rpcCalls[3], ["mark_meta_campaign_publish_uncertain", { p_publish_execution_id: "exec-1", p_diagnostic: "timeout" }]);
});

test("MetaAdsRepository never calls a provider directly -- only Supabase RPC/table methods on the injected client", () => {
  const source = rd("features/vayon/meta-ads/meta-ads.repository.ts");
  assert.doesNotMatch(source, /fetch\(|graph\.facebook\.com|https?:\/\//i);
});

// ---------------------------------------------------------------------------
// PART 25: mock end-to-end publish, using fakeClient + FakeMetaAdsProvider
// only. Proves the full state machine (request -> claim -> progressive
// provider-object creation -> complete -> transition_campaign_channel_
// execution) without any network call.
// ---------------------------------------------------------------------------
test("mock end-to-end: MetaPublishWorker.processOne claims, creates campaign/ad_set/creative/ad progressively via the fake provider, and completes as succeeded", async () => {
  const upserts = [];
  const client = fakeClient({
    rpcs: {
      claim_meta_campaign_publish: async () => ({
        data: {
          id: "exec-1", status: "claimed", attempts: 1, max_attempts: 3,
          plan: { objective: "lead_generation", specialAdCategory: null, targeting: {}, creativeMapping: [{ creativeAssetId: "asset-1", format: "single_image" }] },
          requested_at: "2026-01-01", campaign_id: "camp-1", channel_execution_id: "ch-1", connection_id: "conn-1",
        }, error: null,
      }),
      upsert_meta_provider_object: async (params) => { upserts.push(params); return { data: `obj-${upserts.length}`, error: null }; },
      complete_meta_campaign_publish: async () => ({ data: null, error: null }),
    },
    tables: {
      meta_campaign_publish_executions: [{ id: "exec-1", organization_id: "org-1", workspace_id: "ws-1", status: "succeeded", campaign_id: "camp-1", channel_execution_id: "ch-1", connection_id: "conn-1", plan: {}, attempts: 1, max_attempts: 3, requested_at: "2026-01-01" }],
    },
  });
  const { MetaPublishWorker } = load("features/vayon/meta-ads/meta-ads.service.ts", {
    "@/features/vayon/creative-studio/access.service": { creativeStudioAccess: async () => null },
    "@/features/platform/integrations/meta-marketing/providers/meta-graph.provider": {
      requireMetaMarketingWritesEnabled() {}, // write flag treated as enabled ONLY inside this isolated unit test's mock -- proves the orchestration logic; Part 24's own tests separately prove the real guard fail-closes.
    },
  });
  const worker = MetaPublishWorker.withClient(client, "org-1", "ws-1");
  const result = await worker.processOne("exec-1");

  assert.equal(result?.status, "succeeded");
  const objectTypes = upserts.map((u) => u.p_object_type);
  assert.deepEqual(objectTypes, ["campaign", "ad_set", "creative", "ad"]);
  assert.ok(upserts.every((u) => typeof u.p_provider_object_id === "string" && u.p_provider_object_id.startsWith("fake:")));
  const completeCall = client._rpcCalls.find((c) => c[0] === "complete_meta_campaign_publish");
  assert.equal(completeCall[1].p_success, true);
  assert.equal(completeCall[1].p_status, "succeeded");
});

test("mock end-to-end: a creative failure produces partial_failure, not succeeded, while campaign/ad_set upserts still occurred", async () => {
  const upserts = [];
  class FailingCreativeProvider {
    async createCampaign() { return { providerObjectId: "fake:campaign:1", status: "PAUSED" }; }
    async createAdSet() { return { providerObjectId: "fake:adset:1", status: "PAUSED" }; }
    async createCreative() { throw new Error("simulated creative failure"); }
    async createAd() { throw new Error("unreachable"); }
    async pauseCampaign() {}
    async resumeCampaign() {}
    async getCampaignStatus() { return { providerObjectId: "x", status: "PAUSED", reviewFeedback: null }; }
  }
  const client = fakeClient({
    rpcs: {
      claim_meta_campaign_publish: async () => ({
        data: { id: "exec-1", status: "claimed", attempts: 1, max_attempts: 3, plan: { objective: "lead_generation", specialAdCategory: null, targeting: {}, creativeMapping: [{ creativeAssetId: "asset-1", format: "single_image" }] }, requested_at: "2026-01-01", campaign_id: "camp-1", channel_execution_id: "ch-1", connection_id: "conn-1" }, error: null,
      }),
      upsert_meta_provider_object: async (params) => { upserts.push(params); return { data: `obj-${upserts.length}`, error: null }; },
      complete_meta_campaign_publish: async () => ({ data: null, error: null }),
    },
    tables: { meta_campaign_publish_executions: [{ id: "exec-1", organization_id: "org-1", workspace_id: "ws-1", status: "partial_failure", campaign_id: "camp-1", channel_execution_id: "ch-1", connection_id: "conn-1", plan: {}, attempts: 1, max_attempts: 3, requested_at: "2026-01-01" }] },
  });
  const { MetaPublishWorker } = load("features/vayon/meta-ads/meta-ads.service.ts", {
    "@/features/vayon/creative-studio/access.service": { creativeStudioAccess: async () => null },
    "@/features/platform/integrations/meta-marketing/providers/meta-graph.provider": { requireMetaMarketingWritesEnabled() {} },
  });
  const worker = new MetaPublishWorker(client, new (loadRepository())(client, "org-1", "ws-1"), new FailingCreativeProvider());
  const result = await worker.processOne("exec-1");

  assert.equal(result?.status, "partial_failure");
  const failedUpsert = upserts.find((u) => u.p_object_type === "creative");
  assert.equal(failedUpsert.p_status, "failed");
  assert.ok(upserts.some((u) => u.p_object_type === "campaign" && u.p_status === "created"), "campaign upsert must still have been persisted despite the later creative failure");
  const completeCall = client._rpcCalls.find((c) => c[0] === "complete_meta_campaign_publish");
  assert.equal(completeCall[1].p_status, "partial_failure");
});

// ---------------------------------------------------------------------------
// PART 26: failure tests
// ---------------------------------------------------------------------------
test("no provider call is ever reachable before requireMetaMarketingWritesEnabled -- confirmed by source ordering (see write-guard tests above) and by the worker never importing the real MetaGraphMarketingProvider", () => {
  const source = rd("features/vayon/meta-ads/meta-ads.service.ts");
  assert.doesNotMatch(source, /MetaGraphMarketingProvider/);
});

test("authenticated cannot spoof a completed publish or a provider id -- complete_meta_campaign_publish and upsert_meta_provider_object are both service_role-only (re-verified from the ACL section above)", () => {
  for (const sig of ["complete_meta_campaign_publish(uuid, boolean, text, text, text)", "upsert_meta_provider_object(uuid, text, uuid, uuid, text, text, text, text, jsonb)"]) {
    const escaped = sig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(migrationSql, new RegExp(`revoke all on function public\\.${escaped} from authenticated;`));
  }
});

test("cross-tenant provider object access denied structurally: meta_provider_objects RLS scopes read to creative_studio_member(organization_id, workspace_id), same as the execution table", () => {
  assert.match(migrationSql, /create policy "meta_provider_object_read" on public\.meta_provider_objects\s*\n\s*for select to authenticated\s*\n\s*using \(public\.creative_studio_member\(organization_id, workspace_id\)\);/);
});

test("the deferred zero-history campaign-video-generation.service.ts is not referenced by any ADS-B3 file", () => {
  for (const file of ["features/vayon/meta-ads/meta-ads.repository.ts", "features/vayon/meta-ads/meta-ads.service.ts", "features/vayon/meta-ads/actions.ts"]) {
    assert.doesNotMatch(rd(file), /campaign-video-generation/);
  }
});

test("no live publish control exists in the UI foundation", () => {
  const source = rd("features/vayon/meta-ads/components/MetaPublishPanel.tsx");
  assert.doesNotMatch(source, /Publish now|Go live/i);
});
