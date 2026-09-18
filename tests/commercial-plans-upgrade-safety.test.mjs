import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, after, beforeEach, describe, test } from "node:test";
import { foundingDatabase, databaseClient } from "./helpers/sprint237-database.mjs";
import { load } from "./helpers/sprint237-load.mjs";

describe("Existing-subscriber plan change safety (real PostgreSQL)", { skip: !process.env.SPRINT237_POSTGRES_PORT }, () => {
  let db;
  before(async () => { db = await foundingDatabase(); });
  after(async () => { if (db) await db.close(); });
  beforeEach(async () => { await db.reset(); });

  async function organization() {
    const org = randomUUID(), workspace = randomUUID(), customer = `ctm_${randomUUID()}`;
    await db.pool.query("insert into organizations values($1)", [org]);
    await db.pool.query("insert into workspaces values($1,$2)", [workspace, org]);
    await db.pool.query("insert into billing_customers values($1,$2,'paddle',$3)", [org, workspace, customer]);
    await db.pool.query("insert into subscriptions(organization_id,workspace_id) values($1,$2)", [org, workspace]);
    return { org, workspace, customer, transaction: `txn_${randomUUID()}`, subscription: `sub_${randomUUID().replaceAll("-", "").slice(0, 26)}` };
  }
  async function reserve(o) {
    return (await db.pool.query("select reserve_professional_founding($1,$2,$3,$4,'pri_founding','pri_professional_std') a", [o.org, o.workspace, o.customer, o.transaction])).rows[0].a;
  }
  function foundingPayment(o, changes = {}) {
    return { id: o.transaction, status: "completed", customer_id: o.customer, subscription_id: o.subscription,
      origin: "api", custom_data: { organization_id: o.org, workspace_id: o.workspace, plan_code: "professional" },
      billing_period: { starts_at: new Date(Date.UTC(2026, 0, 1)).toISOString(), ends_at: new Date(Date.UTC(2026, 1, 1)).toISOString() },
      items: [{ price: { id: "pri_founding", billing_cycle: { interval: "month", frequency: 1 } }, quantity: 1, proration: null }],
      details: { line_items: [{ price_id: "pri_founding", totals: { total: "7900" }, proration: null }] }, ...changes };
  }
  const record = p => db.pool.query("select record_professional_founding_payment($1) a", [p]).then(r => r.rows[0].a);
  async function confirmedFoundingOrganization() {
    const o = await organization();
    await reserve(o);
    await record(foundingPayment(o));
    return o;
  }
  async function allocation(org) {
    return (await db.pool.query("select * from professional_founding_allocations where organization_id=$1", [org])).rows[0];
  }
  function providerMocks(request) {
    return {
      "@/lib/observability/logger": { log() {} },
      "@/lib/supabase/service": { createSupabaseServiceClient: () => databaseClient(db.pool) },
      "./paddle-client": { paddleRequest: request },
      "../providers/paddle/paddle-client": { paddleRequest: request },
    };
  }
  function loadProvider(request) {
    const { PaddleBillingProvider } = load("features/vayon/billing/providers/paddle/paddle.provider.ts", providerMocks(request));
    return new PaddleBillingProvider();
  }

  test("13/22: upgrading a Founding Professional subscriber to Business PATCHes the existing subscription with Business's own price, never the founding price", async () => {
    const o = await confirmedFoundingOrganization();
    const calls = [];
    const request = async (path, init) => { calls.push({ path, init }); return {}; };
    const provider = loadProvider(request);
    await provider.changeSubscription({ customerId: "linked", subscriptionId: o.subscription, planCode: "business", priceId: "pri_business_std", quantity: 1, prorationBehavior: "always_invoice" });
    assert.equal(calls.length, 1, "must issue exactly one Paddle call");
    assert.equal(calls[0].path, `/subscriptions/${o.subscription}`);
    assert.equal(calls[0].init.method, "PATCH");
    const body = JSON.parse(calls[0].init.body);
    assert.equal(body.items[0].price_id, "pri_business_std", "Business must never receive the founding price");
    assert.ok(!calls.some(c => c.path.startsWith("/transactions") || c.init?.method === "POST"), "must never create a new transaction/subscription");
  });

  test("22: Business Plus also never receives founding pricing on upgrade", async () => {
    const o = await confirmedFoundingOrganization();
    const calls = [];
    const provider = loadProvider(async (path, init) => { calls.push({ path, init }); return {}; });
    await provider.changeSubscription({ customerId: "linked", subscriptionId: o.subscription, planCode: "business_plus", priceId: "pri_business_plus_std", quantity: 1, prorationBehavior: "always_invoice" });
    const body = JSON.parse(calls[0].init.body);
    assert.equal(body.items[0].price_id, "pri_business_plus_std");
  });

  test("14: upgrading does not create a second local subscription row", async () => {
    const o = await confirmedFoundingOrganization();
    const provider = loadProvider(async () => ({}));
    await provider.changeSubscription({ customerId: "linked", subscriptionId: o.subscription, planCode: "business", priceId: "pri_business_std", quantity: 1, prorationBehavior: "always_invoice" });
    const rows = (await db.pool.query("select count(*) n from subscriptions where organization_id=$1", [o.org])).rows;
    assert.equal(rows[0].n, "1");
  });

  test("21: Founding allocation is untouched by an upgrade attempt that never reaches Paddle (lock contention safety)", async () => {
    const o = await confirmedFoundingOrganization();
    const before = await allocation(o.org);
    // A second, concurrent lock attempt must fail closed rather than silently proceeding.
    const provider = loadProvider(async () => ({}));
    await db.pool.query("update professional_founding_allocations set mutation_token=gen_random_uuid(), mutation_until=now()+interval '2 minutes' where organization_id=$1", [o.org]);
    await assert.rejects(
      provider.changeSubscription({ customerId: "linked", subscriptionId: o.subscription, planCode: "business", priceId: "pri_business_std", quantity: 1, prorationBehavior: "always_invoice" }),
      /mutation in progress/,
    );
    const after = await allocation(o.org);
    assert.equal(after.successful_periods, before.successful_periods);
    assert.equal(after.status, before.status);
  });

  test("17/18/19/20: webhook projects the new plan, correct entitlements, and Business Plus's finite organization_limits", async () => {
    const o = await confirmedFoundingOrganization();
    const payload = {
      id: o.subscription, status: "active", customer_id: o.customer, updated_at: "2026-11-01T00:00:00Z",
      custom_data: { organization_id: o.org, workspace_id: o.workspace, plan_code: "business_plus" },
      current_billing_period: { starts_at: "2026-11-01T00:00:00Z", ends_at: "2026-12-01T00:00:00Z" },
      items: [{ price: { id: "pri_businessplusstd" }, quantity: 1 }],
    };
    await db.pool.query("select process_paddle_billing_event($1,'subscription.updated',$2)", [randomUUID(), payload]);
    const sub = (await db.pool.query("select s.*, p.code from subscriptions s join subscription_plans p on p.id=s.plan_id where s.workspace_id=$1", [o.workspace])).rows[0];
    assert.equal(sub.code, "business_plus");
    assert.equal(sub.status, "active");
    const items = (await db.pool.query("select * from subscription_items where workspace_id=$1", [o.workspace])).rows;
    assert.equal(items.length, 1);
    assert.equal(items[0].provider_item_id, `paddle:${o.subscription}:pri_businessplusstd`);
    const limits = Object.fromEntries((await db.pool.query("select metric, limit_value from organization_limits where workspace_id=$1", [o.workspace])).rows.map(r => [r.metric, Number(r.limit_value)]));
    assert.deepEqual(limits, {
      workspaces: 25, users: 150, storage_gb: 1500, ai_requests: 150000, exports: 7500, reports: 7500,
      workflows: 3000, automations: 3000, integrations: 75, knowledge_articles: 30000, creative_assets: 7500, api_calls: 300000,
    });
  });

  test("Founding allocation ends (not deletes, not resets) when the webhook confirms the subscription moved off the founding price", async () => {
    const o = await confirmedFoundingOrganization();
    const before = await allocation(o.org);
    assert.equal(before.status, "confirmed");
    assert.equal(before.successful_periods, 1);
    const { FoundingMemberService } = load("features/vayon/billing/services/founding-member.service.ts", {
      "@/lib/observability/logger": { log() {} },
      "./paddle-subscription-sync.service": { PaddleSubscriptionSyncService: class { async project() {} } },
    });
    const service = new FoundingMemberService(databaseClient(db.pool), async () => ({
      id: o.subscription, status: "active", customer_id: o.customer, subscription_id: o.subscription,
      items: [{ price: { id: "pri_business_std" } }],
    }));
    await service.webhook("subscription.updated", { id: o.subscription, status: "active", customer_id: o.customer, items: [{ price: { id: "pri_business_std" } }] });
    const after = await allocation(o.org);
    assert.equal(after.status, "ended");
    assert.equal(after.successful_periods, before.successful_periods, "successful_periods must never be reset or incremented by an upgrade away from founding");
    const allocations = (await db.pool.query("select count(*) n from professional_founding_allocations where organization_id=$1", [o.org])).rows;
    assert.equal(allocations[0].n, "1", "no duplicate/new allocation may be created");
  });

  function subscriptionClientStub(row) {
    return {
      from(table) {
        if (table !== "subscriptions") throw new Error(`unexpected table ${table}`);
        const chain = { select() { return chain; }, eq() { return chain; }, is() { return chain; }, async maybeSingle() { return { data: row, error: null }; } };
        return chain;
      },
    };
  }
  const subscriptionRow = { id: randomUUID(), plan_id: randomUUID(), status: "active", trial_ends_at: null, current_period_ends_at: null, cancel_at_period_end: false, seat_quantity: 1, version: 3, provider_subscription_id: "sub_existing", subscription_plans: { code: "professional", name: "Professional" } };

  test("15/16: a stale version is rejected before any Paddle call or PaddleSubscriptionService construction", async () => {
    const calls = [];
    const { manageSubscription } = load("features/vayon/billing/actions/subscription-center.actions.ts", {
      "next/cache": { revalidatePath() {} },
      "../services/billing-context": { billingContext: async () => ({ client: subscriptionClientStub(subscriptionRow), organizationId: "org", workspaceId: "workspace" }) },
      "../services/paddle-subscription.service": { PaddleSubscriptionService: class { constructor() { calls.push("constructed"); } async change() { calls.push("change"); } } },
    });
    const form = new FormData();
    form.set("intent", "change"); form.set("plan", "business"); form.set("period", "monthly"); form.set("version", "1"); // real version is 3
    const result = await manageSubscription(form);
    assert.equal(result.ok, false);
    assert.match(result.message, /has changed/);
    assert.deepEqual(calls, [], "a stale version must never reach PaddleSubscriptionService");
  });

  test("24: an invalid plan code is rejected before the change is applied", async () => {
    const calls = [];
    const { manageSubscription } = load("features/vayon/billing/actions/subscription-center.actions.ts", {
      "next/cache": { revalidatePath() {} },
      "../services/billing-context": { billingContext: async () => ({ client: subscriptionClientStub(subscriptionRow), organizationId: "org", workspaceId: "workspace" }) },
      "../services/paddle-subscription.service": { PaddleSubscriptionService: class { async change() { calls.push("change"); } } },
    });
    const form = new FormData();
    form.set("intent", "change"); form.set("plan", "not_a_real_plan"); form.set("period", "monthly"); form.set("version", "3");
    const result = await manageSubscription(form);
    assert.equal(result.ok, false);
    assert.deepEqual(calls, [], "an invalid plan code must never reach service.change()");
  });

  test("valid change with the correct version reaches PaddleSubscriptionService.change() exactly once", async () => {
    const calls = [];
    const { manageSubscription } = load("features/vayon/billing/actions/subscription-center.actions.ts", {
      "next/cache": { revalidatePath() {} },
      "../services/billing-context": { billingContext: async () => ({ client: subscriptionClientStub(subscriptionRow), organizationId: "org", workspaceId: "workspace" }) },
      "../services/paddle-subscription.service": { PaddleSubscriptionService: class { async change(plan, period, seats, version) { calls.push({ plan, period, seats, version }); } } },
    });
    const form = new FormData();
    form.set("intent", "change"); form.set("plan", "business"); form.set("period", "monthly"); form.set("version", "3");
    const result = await manageSubscription(form);
    assert.equal(result.ok, true);
    assert.deepEqual(calls, [{ plan: "business", period: "monthly", seats: 1, version: 3 }]);
  });
});
