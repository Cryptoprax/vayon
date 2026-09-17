import assert from "node:assert/strict";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

function harness(failAt, error = new Error("private message"), options = {}) {
  const logs = [], calls = [];
  const allocation = { status: "confirmed", successful_periods: 1, paddle_subscription_id: "sub_private", founding_price_id: "pri_private" };
  const subscription = { status: "active", items: [{ price: { id: "pri_private" } }] };
  const step = (name, value) => { calls.push(name); if (failAt === name) throw error; return value; };
  const client = {
    from() { return { select() { return { async in() { return step("allocation_query", { data: [allocation], error: options.queryError }); } }; } }; },
    async rpc() { return step("payment_record", { data: null, error: options.rpcError }); },
  };
  let fetches = 0;
  const { FoundingMemberService } = load("features/vayon/billing/services/founding-member.service.ts", {
    "@/lib/observability/logger": { log(event, fields) { if (options.loggerThrows) throw Error("logger failure"); logs.push({ event, ...fields }); } },
    "./paddle-subscription-sync.service": { PaddleSubscriptionSyncService: class { async project() { return step("projection"); } } },
  });
  const service = new FoundingMemberService(client, async path => path.startsWith("/transactions?")
    ? step("transaction_list", [{}])
    : step(++fetches === 1 ? "subscription_fetch" : "sync_fetch", subscription));
  return { service, logs, calls, FoundingMemberService };
}

for (const [failure, stage] of [
  ["transaction_list", "transaction_list"], ["payment_record", "payment_record"],
  ["subscription_fetch", "subscription_fetch"], ["sync_fetch", "subscription_sync"],
  ["projection", "subscription_sync"],
]) test(`reports ${failure} at ${stage} and still throws`, async () => {
  const h = harness(failure);
  await assert.rejects(h.service.reconcile(), /^Error: Founding reconciliation requires retry\.$/);
  assert.deepEqual(h.logs, [{ event: "billing.founding_offer.reconciliation_failed", stage, errorCategory: "Error" }]);
  assert.equal(h.calls.at(-1), failure);
});

test("retains only allowlisted Paddle diagnostics", async () => {
  const error = Object.assign(new Error("Bearer credential txn_private customer@example.test"), {
    name: "PaddleApiError", status: 403, code: "authorization_denied", stack: "private stack",
    customer_id: "ctm_private", subscription_id: "sub_private", token: "credential",
  });
  const h = harness("transaction_list", error);
  await assert.rejects(h.service.reconcile());
  assert.deepEqual(h.logs, [{ event: "billing.founding_offer.reconciliation_failed", stage: "transaction_list",
    errorCategory: "PaddleApiError", providerHttpStatus: 403, providerErrorCode: "authorization_denied" }]);
});

test("retains SQLSTATE from a returned RPC error without its payload", async () => {
  const h = harness(null, undefined, { rpcError: { code: "23502", message: "secret", details: "sub_private", hint: "credential" } });
  await assert.rejects(h.service.reconcile());
  assert.deepEqual(h.logs, [{ event: "billing.founding_offer.reconciliation_failed", stage: "payment_record",
    errorCategory: "DatabaseError", sqlstate: "23502" }]);
});

for (const unsafe of ["sub_private", "txn_private", "ctm_private", "pri_private", "Bearer credential", "customer@example.test", "https://private.test", "arbitrary_free_form"]) {
  test(`discards unsafe diagnostic fields: ${unsafe.split("_")[0]}`, async () => {
    for (const error of [{ name: unsafe, code: unsafe, message: unsafe, status: "403" }, { name: "PaddleApiError", code: unsafe, status: 999, message: unsafe }]) {
      const h = harness("transaction_list", error);
      await assert.rejects(h.service.reconcile());
      assert.deepEqual(h.logs[0], { event: "billing.founding_offer.reconciliation_failed", stage: "transaction_list",
        errorCategory: error.name === "PaddleApiError" ? "PaddleApiError" : "UnknownError" });
    }
  });
}

test("allocation query errors preserve original exception identity", async () => {
  const error = { code: "42501", message: "private" };
  for (const h of [harness("allocation_query", error), harness(null, undefined, { queryError: error })]) {
    await assert.rejects(h.service.reconcile(), actual => actual === error);
    assert.equal(h.logs[0].stage, "allocation_query");
    assert.equal(h.logs[0].sqlstate, "42501");
  }
});

test("diagnostic getters and logger failures cannot replace reconciliation failure", async () => {
  const error = { get name() { throw Error("private getter"); } };
  for (const options of [{}, { loggerThrows: true }]) {
    const h = harness("transaction_list", error, options);
    await assert.rejects(h.service.reconcile(), /Founding reconciliation requires retry/);
  }
});

test("already-recorded payment preserves operation ordering and successful return", async () => {
  const h = harness();
  assert.equal(await h.service.reconcile(), undefined);
  assert.deepEqual(h.calls, ["allocation_query", "transaction_list", "payment_record", "subscription_fetch", "sync_fetch", "projection"]);
  assert.deepEqual(h.logs, []);
});

test("instrumented service failure still produces the unchanged HTTP 503", async () => {
  const h = harness("projection");
  const original = process.env.CRON_SECRET;
  try {
    process.env.CRON_SECRET = "diagnostics-test-only";
    const { GET } = load("app/api/billing/paddle/founding/reconcile/route.ts", {
      "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
      "@/features/vayon/billing/services/founding-member.service": { FoundingMemberService: class { reconcile() { return h.service.reconcile(); } } },
    });
    const response = await GET(new Request("https://example.test", { headers: { authorization: "Bearer diagnostics-test-only" } }));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "Reconciliation requires retry" });
    assert.equal(h.logs[0].stage, "subscription_sync");
  } finally {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
  }
});
