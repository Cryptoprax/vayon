import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

// Mirrors phase-ads-b0-safety-attribution.test.mjs's own inline fakeClient
// (ADS-B0E) -- same small, generic, feature-agnostic utility, duplicated
// rather than imported from a zero-history helper for the same reason.
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
const migration = rd("supabase/migrations/20261204000000_ads_b1_cross_channel_campaign_domain.sql");
const migrationSql = migration.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");

function repo(overrides = {}) {
  const { CampaignChannelsRepository } = load("features/vayon/campaign-channels/campaign-channels.repository.ts", overrides);
  return CampaignChannelsRepository;
}

// ---------------------------------------------------------------------------
// Tenant isolation / cross-tenant rejection (static source check -- every
// ADS-B1 RPC derives organization_id/workspace_id exclusively from the
// caller's own active workspace_members row via auth.uid(), then re-checks
// every referenced campaign/execution/intent against that same org/workspace
// -- never trusting a client-supplied tenant id).
// ---------------------------------------------------------------------------
test("every ADS-B1 write RPC derives org/workspace from the caller's own workspace_members row, never from client input", () => {
  for (const fn of [
    "create_campaign_channel_execution", "transition_campaign_channel_execution",
    "save_campaign_budget_intent", "accept_campaign_budget_intent", "save_campaign_targeting_intent",
  ]) {
    const body = migrationSql.slice(migrationSql.indexOf(`function public.${fn}(`));
    assert.match(body.slice(0, body.indexOf("$$;") + 3), /wm\.user_id = auth\.uid\(\) and wm\.status = 'active'/, `${fn} must derive tenant from auth.uid()`);
  }
});

test("create_campaign_channel_execution re-checks the campaign belongs to the caller's own organization/workspace before creating an execution", () => {
  assert.match(migrationSql, /select \* into c from public\.creative_campaigns where id = p_campaign_id and organization_id = o and workspace_id = w for update;/);
});

test("save_campaign_budget_intent and save_campaign_targeting_intent re-check campaign ownership the same way", () => {
  assert.match(migrationSql, /select \* into c from public\.creative_campaigns where id = p_campaign_id and organization_id = o and workspace_id = w for update;\s*\n\s*if not found then\s*\n\s*raise exception 'invalid campaign';/);
  assert.match(migrationSql, /if not exists \(select 1 from public\.creative_campaigns where id = p_campaign_id and organization_id = o and workspace_id = w\) then\s*\n\s*raise exception 'invalid campaign';/);
});

test("transition_campaign_channel_execution scopes the execution row to the caller's own org/workspace for non-service callers", () => {
  assert.match(migrationSql, /select \* into e from public\.campaign_channel_executions where id = p_execution_id and organization_id = o and workspace_id = w for update;/);
});

// ---------------------------------------------------------------------------
// Provider execution uniqueness
// ---------------------------------------------------------------------------
test("campaign_channel_executions enforces exactly one execution row per (campaign_id, provider)", () => {
  assert.match(migrationSql, /unique\(campaign_id, provider\)/);
});

test("create_campaign_channel_execution is idempotent -- an existing row for the same campaign/provider is returned, not duplicated", () => {
  const body = migrationSql.slice(migrationSql.indexOf("function public.create_campaign_channel_execution("));
  assert.match(body, /select id into v_id from public\.campaign_channel_executions\s*\n\s*where campaign_id = p_campaign_id and provider = p_provider;\s*\n\s*if v_id is not null then\s*\n\s*return v_id;/);
});

// ---------------------------------------------------------------------------
// Budget validation
// ---------------------------------------------------------------------------
test("campaign_budget_intents requires at least one of daily_budget/lifetime_budget and a sane date range", () => {
  assert.match(migrationSql, /check \(daily_budget is not null or lifetime_budget is not null\)/);
  assert.match(migrationSql, /check \(end_at is null or start_at is null or end_at > start_at\)/);
  assert.match(migrationSql, /currency text not null check \(currency ~ '\^\[A-Z\]\{3\}\$'\)/);
});

test("save_campaign_budget_intent fails closed when neither budget field is provided", () => {
  assert.match(migrationSql, /if p_daily_budget is null and p_lifetime_budget is null then\s*\n\s*raise exception 'BUDGET_CONFIGURATION_ERROR/);
});

test("campaign_budget_intents allows exactly one approved version per campaign at a time", () => {
  assert.match(migrationSql, /create unique index if not exists campaign_budget_intent_one_approved_idx\s*\n\s*on public\.campaign_budget_intents\(campaign_id\) where status = 'approved';/);
});

// ---------------------------------------------------------------------------
// Approval binding (Part 5 invariant): no transition into publishing/active
// without a decided-'approved' D1 approval_requests row for the exact
// (source_type, source_id, action_type) triple.
// ---------------------------------------------------------------------------
test("transition_campaign_channel_execution blocks publishing/active without an approved D1 approval", () => {
  assert.match(migrationSql, /if p_status in \('publishing', 'active'\) then\s*\n\s*if not public\.is_source_approved\(e\.organization_id, e\.workspace_id, 'campaign_channel_execution', e\.id, 'campaign_channel_publish'\) then\s*\n\s*raise exception 'APPROVAL_REQUIRED/);
});

test("accept_campaign_budget_intent requires an approved D1 approval for campaign_budget_change before activating a budget version", () => {
  assert.match(migrationSql, /if not public\.is_source_approved\(o, w, 'campaign_budget_intent', b\.id, 'campaign_budget_change'\) then\s*\n\s*raise exception 'APPROVAL_REQUIRED/);
});

test("is_source_approved checks the most recent decided request for the exact source/action, not any historical approval", () => {
  const body = migrationSql.slice(migrationSql.indexOf("function public.is_source_approved("));
  assert.match(body, /order by requested_at desc\s*\n\s*limit 1/);
  assert.match(body, /status = 'approved'/);
});

test("is_source_approved and transition_campaign_channel_execution reuse D1's existing approval_requests table unmodified -- no new approval table is created", () => {
  assert.doesNotMatch(migrationSql, /create table.*approval/i);
});

// ---------------------------------------------------------------------------
// Creative linkage / attribution keys / nullable provider IDs before publish
// ---------------------------------------------------------------------------
test("creative_assets gains nullable channel_execution_id and provider_ad_id, additive only", () => {
  assert.match(migrationSql, /alter table public\.creative_assets\s*\n\s*add column if not exists channel_execution_id uuid references public\.campaign_channel_executions\(id\);/);
  assert.match(migrationSql, /alter table public\.creative_assets\s*\n\s*add column if not exists provider_ad_id text;/);
  assert.doesNotMatch(migrationSql, /channel_execution_id uuid not null/);
  assert.doesNotMatch(migrationSql, /provider_ad_id text not null/);
});

test("provider_account_id and provider_campaign_id are nullable -- an execution can exist before any real publish attempt", () => {
  assert.doesNotMatch(migrationSql, /provider_account_id text not null/);
  assert.doesNotMatch(migrationSql, /provider_campaign_id text not null/);
});

test("no secret or token column is introduced anywhere in this migration", () => {
  assert.doesNotMatch(migrationSql, /token|secret|ciphertext/i);
});

// ---------------------------------------------------------------------------
// Shared campaign state / status transitions
// ---------------------------------------------------------------------------
const expectedStates = "'draft','ready_for_review','approved','publishing','active','paused','completed','failed','uncertain'";
test("creative_campaigns.publishing_status and campaign_channel_executions.status share the same 9-value provider-neutral vocabulary", () => {
  const occurrences = migrationSql.split(expectedStates).length - 1;
  assert.ok(occurrences >= 2, `expected the exact 9-value state list to appear at least twice (campaign + execution), found ${occurrences}`);
});

test("publishing_status defaults to draft and is additive to creative_campaigns", () => {
  assert.match(migrationSql, /add column if not exists publishing_status text not null default 'draft'/);
});

test("transition_campaign_channel_execution rejects an unrecognized status (fail closed)", () => {
  assert.match(migrationSql, /if p_status not in \(\s*\n?\s*'draft','ready_for_review','approved','publishing','active','paused','completed','failed','uncertain'\s*\n?\s*\) then\s*\n\s*raise exception 'EXECUTION_CONFIGURATION_ERROR/);
});

// ---------------------------------------------------------------------------
// RLS / no anon access
// ---------------------------------------------------------------------------
test("every new ADS-B1 table enables RLS with read/write policies scoped through creative_studio_member/creative_studio_manage, and no anon policy exists", () => {
  for (const [table, policyStem] of [
    ["campaign_channel_executions", "campaign_channel_execution"],
    ["campaign_budget_intents", "campaign_budget_intent"],
    ["campaign_targeting_intents", "campaign_targeting_intent"],
  ]) {
    assert.match(migrationSql, new RegExp(`alter table public\\.${table} enable row level security;`));
    assert.match(migrationSql, new RegExp(`create policy "${policyStem}_read" on public\\.${table}\\s*\\n\\s*for select to authenticated\\s*\\n\\s*using \\(public\\.creative_studio_member\\(organization_id, workspace_id\\)\\);`));
    assert.match(migrationSql, new RegExp(`create policy "${policyStem}_write" on public\\.${table}\\s*\\n\\s*for all to authenticated\\s*\\n\\s*using \\(public\\.creative_studio_member\\(organization_id, workspace_id\\) and public\\.creative_studio_manage\\(workspace_id\\)\\)`));
  }
  assert.doesNotMatch(migrationSql, /to anon/);
});

test("every new RPC explicitly revokes public/anon and grants only authenticated (and service_role where the caller model requires it)", () => {
  for (const fn of [
    ["create_campaign_channel_execution(uuid, text)", false],
    ["save_campaign_budget_intent(uuid, text, numeric, numeric, timestamptz, timestamptz)", false],
    ["accept_campaign_budget_intent(uuid)", false],
    ["save_campaign_targeting_intent(uuid, text, text, text, text, text, text, numeric, numeric, text)", false],
    ["is_source_approved(uuid, uuid, text, uuid, text)", true],
    ["transition_campaign_channel_execution(uuid, text, text, text)", true],
  ]) {
    const [sig, expectServiceRole] = fn;
    assert.match(migrationSql, new RegExp(`revoke all on function public\\.${sig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} from public;`));
    assert.match(migrationSql, new RegExp(`revoke all on function public\\.${sig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} from anon;`));
    assert.match(migrationSql, new RegExp(`grant execute on function public\\.${sig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} to authenticated;`));
    if (expectServiceRole) {
      assert.match(migrationSql, new RegExp(`grant execute on function public\\.${sig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} to service_role;`));
    }
  }
});

// ---------------------------------------------------------------------------
// TS repository/service layer -- behavioral (fakeClient), no provider calls.
// ---------------------------------------------------------------------------
test("CampaignChannelsRepository.createChannelExecution calls create_campaign_channel_execution with exactly campaignId/provider", async () => {
  const client = fakeClient({ rpcs: { create_campaign_channel_execution: async () => ({ data: "exec-1", error: null }) } });
  const Repository = repo();
  const r = new Repository(client, "org-1", "ws-1");
  const id = await r.createChannelExecution("campaign-1", "meta");
  assert.equal(id, "exec-1");
  assert.deepEqual(client._rpcCalls[0], ["create_campaign_channel_execution", { p_campaign_id: "campaign-1", p_provider: "meta" }]);
});

test("CampaignChannelsRepository.transitionChannelExecution passes through status and optional error fields", async () => {
  const client = fakeClient({ rpcs: { transition_campaign_channel_execution: async () => ({ data: null, error: null }) } });
  const Repository = repo();
  const r = new Repository(client, "org-1", "ws-1");
  await r.transitionChannelExecution("exec-1", "failed", "PROVIDER_TIMEOUT", "Provider request timed out");
  assert.deepEqual(client._rpcCalls[0], [
    "transition_campaign_channel_execution",
    { p_execution_id: "exec-1", p_status: "failed", p_error_code: "PROVIDER_TIMEOUT", p_error_message: "Provider request timed out" },
  ]);
});

test("CampaignChannelsRepository.isSourceApproved calls is_source_approved with the tenant and exact source/action triple, returns a strict boolean", async () => {
  const client = fakeClient({ rpcs: { is_source_approved: async () => ({ data: true, error: null }) } });
  const Repository = repo();
  const r = new Repository(client, "org-1", "ws-1");
  const approved = await r.isSourceApproved("campaign_channel_execution", "exec-1", "campaign_channel_publish");
  assert.equal(approved, true);
  assert.deepEqual(client._rpcCalls[0], [
    "is_source_approved",
    { p_organization_id: "org-1", p_workspace_id: "ws-1", p_source_type: "campaign_channel_execution", p_source_id: "exec-1", p_action_type: "campaign_channel_publish" },
  ]);
});

test("CampaignChannelsRepository.saveBudgetIntent and acceptBudgetIntent call the correct RPCs with the correct params", async () => {
  const client = fakeClient({
    rpcs: {
      save_campaign_budget_intent: async () => ({ data: "intent-1", error: null }),
      accept_campaign_budget_intent: async () => ({ data: null, error: null }),
    },
  });
  const Repository = repo();
  const r = new Repository(client, "org-1", "ws-1");
  const id = await r.saveBudgetIntent({ campaignId: "campaign-1", currency: "INR", dailyBudget: "5000", lifetimeBudget: null, startAt: null, endAt: null });
  assert.equal(id, "intent-1");
  assert.deepEqual(client._rpcCalls[0], [
    "save_campaign_budget_intent",
    { p_campaign_id: "campaign-1", p_currency: "INR", p_daily_budget: "5000", p_lifetime_budget: null, p_start_at: null, p_end_at: null },
  ]);
  await r.acceptBudgetIntent("intent-1");
  assert.deepEqual(client._rpcCalls[1], ["accept_campaign_budget_intent", { p_intent_id: "intent-1" }]);
});

test("CampaignChannelsRepository never calls a provider directly -- it only ever calls Supabase RPC/table methods on the injected client", () => {
  const source = rd("features/vayon/campaign-channels/campaign-channels.repository.ts");
  assert.doesNotMatch(source, /fetch\(|OpenAI|MetaGraph|GoogleAds|https?:\/\//i);
});

test("CampaignChannelsService, actions.ts and the UI panel never import a provider SDK or call fetch", () => {
  for (const file of [
    "features/vayon/campaign-channels/campaign-channels.service.ts",
    "features/vayon/campaign-channels/actions.ts",
    "features/vayon/campaign-channels/components/CampaignChannelPanel.tsx",
  ]) {
    const source = rd(file);
    assert.doesNotMatch(source, /fetch\(|OpenAI|MetaGraph|GoogleAds|meta-graph|createLiveCreativeExecutionService/i);
  }
});

test("no live publish button exists in the UI foundation -- only draft/ready_for_review transitions and channel selection are wired", () => {
  const source = rd("features/vayon/campaign-channels/components/CampaignChannelPanel.tsx");
  assert.doesNotMatch(source, /value="publishing"|value="active"|Publish now|Go live/i);
});

test("the deferred zero-history campaign-video-generation.service.ts is not referenced by any ADS-B1 file", () => {
  for (const file of [
    "features/vayon/campaign-channels/campaign-channels.repository.ts",
    "features/vayon/campaign-channels/campaign-channels.service.ts",
    "features/vayon/campaign-channels/actions.ts",
  ]) {
    assert.doesNotMatch(rd(file), /campaign-video-generation/);
  }
});

test("migration is fresh-replay safe: no ALTER DEFAULT PRIVILEGES, no migration-history statement, no provider/network reference", () => {
  assert.doesNotMatch(migrationSql, /alter default privileges/i);
  assert.doesNotMatch(migrationSql, /deployment_migration_history|schema_migrations/i);
  assert.doesNotMatch(migrationSql, /fetch\(|https?:\/\/|OpenAI|MetaGraph|GoogleAds/i);
});

test("no parallel campaign source of truth is introduced -- creative_campaigns remains the only campaign primary key referenced", () => {
  assert.doesNotMatch(migrationSql, /create table.*ads_campaigns/i);
  const fkOccurrences = migrationSql.split("campaign_id uuid not null references public.creative_campaigns(id) on delete cascade").length - 1;
  assert.equal(fkOccurrences, 3, "expected all three new tables (channel executions, budget intents, targeting intents) to reference creative_campaigns(id) directly");
});
