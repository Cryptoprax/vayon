import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, after, beforeEach, describe, test } from "node:test";
import { foundingDatabase, databaseClient } from "./helpers/sprint237-database.mjs";
import { load } from "./helpers/sprint237-load.mjs";

describe("Sprint 237 founding invoice recovery (real PostgreSQL)", { skip: !process.env.SPRINT237_POSTGRES_PORT }, () => {
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
    return (await db.pool.query("select reserve_professional_founding($1,$2,$3,$4,'pri_founding','pri_standard') a", [o.org, o.workspace, o.customer, o.transaction])).rows[0].a;
  }
  const record = p => db.pool.query("select record_professional_founding_payment($1) a", [p]).then(r => r.rows[0].a);
  function foundingPayment(o, changes = {}) {
    return { id: o.transaction, status: "completed", customer_id: o.customer, subscription_id: o.subscription,
      origin: "api", custom_data: { organization_id: o.org, workspace_id: o.workspace, plan_code: "professional" },
      billing_period: { starts_at: new Date(Date.UTC(2026, 0, 1)).toISOString(), ends_at: new Date(Date.UTC(2026, 1, 1)).toISOString() },
      items: [{ price: { id: "pri_founding", billing_cycle: { interval: "month", frequency: 1 } }, quantity: 1, proration: null }],
      details: { line_items: [{ price_id: "pri_founding", totals: { total: "7900" }, proration: null }] }, ...changes };
  }
  function fetchedTransaction(o, changes = {}) {
    return { id: o.transaction, status: "completed", customer_id: o.customer, subscription_id: o.subscription,
      items: [{ price: { id: "pri_founding" }, quantity: 1 }], invoice_id: `inv_${o.org}`, ...changes };
  }
  function realProjectionMocks(request) {
    return { "@/lib/observability/logger": { log() {} },
      "@/lib/supabase/service": { createSupabaseServiceClient: () => databaseClient(db.pool) },
      "../providers/paddle/paddle-client": { paddleRequest: request } };
  }
  function service(request) {
    const { FoundingMemberService } = load("features/vayon/billing/services/founding-member.service.ts", realProjectionMocks(request));
    return new FoundingMemberService(databaseClient(db.pool), request);
  }
  function serviceWithLogSpy(request) {
    const logs = [];
    const mocks = { ...realProjectionMocks(request), "@/lib/observability/logger": { log(event, fields) { logs.push({ event, ...fields }); } } };
    const { FoundingMemberService } = load("features/vayon/billing/services/founding-member.service.ts", mocks);
    return { service: new FoundingMemberService(databaseClient(db.pool), request), logs };
  }
  // Every value that must never leak into a diagnostic log for this scenario.
  function secretValues(o) {
    return [o.org, o.workspace, o.customer, o.transaction, o.subscription, "pri_founding", `inv_${o.org}`];
  }
  function assertNoSecrets(logs, o) {
    const serialized = JSON.stringify(logs);
    for (const value of secretValues(o)) assert.ok(!serialized.includes(value), `leaked secret-like value: ${value}`);
  }
  async function confirmedOrganization() {
    const o = await organization();
    await reserve(o);
    await record(foundingPayment(o));
    return o;
  }
  async function invoiceCount(workspace) {
    return Number((await db.pool.query("select count(*) n from invoices where workspace_id=$1", [workspace])).rows[0].n);
  }
  async function successfulPeriods(org) {
    return (await db.pool.query("select successful_periods from professional_founding_allocations where organization_id=$1", [org])).rows[0].successful_periods;
  }

  test("A/B: performs exactly one GET /transactions/:id; any call carrying a write-shaped init fails the test", async () => {
    const o = await confirmedOrganization();
    const calls = [];
    const request = async (path, init) => {
      assert.equal(init, undefined, "recovery must never send a Paddle request init (method/body)");
      calls.push(path);
      return fetchedTransaction(o);
    };
    const result = await service(request).recoverFoundingInvoice(o.org);
    assert.deepEqual(calls, [`/transactions/${o.transaction}`]);
    assert.equal(result.recovered, true);
  });

  test("C/D/E: reuses the existing transaction/subscription; no checkout-shaped call is made", async () => {
    const o = await confirmedOrganization();
    const seen = [];
    const request = async path => { seen.push(path); return fetchedTransaction(o); };
    await service(request).recoverFoundingInvoice(o.org);
    assert.deepEqual(seen, [`/transactions/${o.transaction}`]);
    assert.ok(!seen.some(path => /checkout|subscriptions\?|\/subscriptions$/i.test(path)));
  });

  test("F: successful_periods starts at 1 and remains exactly 1 after recovery", async () => {
    const o = await confirmedOrganization();
    assert.equal(await successfulPeriods(o.org), 1);
    await service(async () => fetchedTransaction(o)).recoverFoundingInvoice(o.org);
    assert.equal(await successfulPeriods(o.org), 1);
  });

  test("G/H: invoice count goes from 0 to exactly 1 with the correct provider invoice identity", async () => {
    const o = await confirmedOrganization();
    assert.equal(await invoiceCount(o.workspace), 0);
    await service(async () => fetchedTransaction(o)).recoverFoundingInvoice(o.org);
    const invoices = (await db.pool.query("select * from invoices where workspace_id=$1", [o.workspace])).rows;
    assert.equal(invoices.length, 1);
    assert.equal(invoices[0].provider_invoice_id, `inv_${o.org}`);
    assert.equal(invoices[0].status, "paid");
  });

  test("I: billing_events receives the deterministic founding-invoice-recover event", async () => {
    const o = await confirmedOrganization();
    await service(async () => fetchedTransaction(o)).recoverFoundingInvoice(o.org);
    const events = (await db.pool.query("select * from billing_events where workspace_id=$1", [o.workspace])).rows;
    assert.equal(events.length, 1);
    assert.equal(events[0].provider_event_id, `founding-invoice-recover:${o.transaction}`);
    assert.equal(events[0].event_type, "transaction.completed");
    assert.equal(events[0].status, "processed");
  });

  test("J/R: calling recovery twice remains exactly one invoice via an idempotent no-op", async () => {
    const o = await confirmedOrganization();
    const request = async () => fetchedTransaction(o);
    const first = await service(request).recoverFoundingInvoice(o.org);
    const second = await service(request).recoverFoundingInvoice(o.org);
    assert.equal(first.recovered, true);
    assert.equal(second.recovered, false);
    assert.equal(await invoiceCount(o.workspace), 1);
    assert.equal(await successfulPeriods(o.org), 1);
  });

  test("K: a mismatched transaction ID is rejected before any DB write, logging only the safe stage", async () => {
    const o = await confirmedOrganization();
    const { service: svc, logs } = serviceWithLogSpy(async () => fetchedTransaction(o, { id: "txn_other" }));
    const error = await svc.recoverFoundingInvoice(o.org).catch(e => e);
    assert.match(error.message, /Unexpected founding transaction identity/);
    assert.ok(!error.message.includes(o.transaction) && !error.message.includes("txn_other"));
    assert.equal(await invoiceCount(o.workspace), 0);
    assert.deepEqual(logs, [{ event: "founding_invoice_recovery.failed", stage: "transaction_identity_validation", errorCategory: "Error" }]);
    assertNoSecrets(logs, o);
  });

  test("L: a mismatched customer ID is rejected before any DB write, logging only the safe stage", async () => {
    const o = await confirmedOrganization();
    const { service: svc, logs } = serviceWithLogSpy(async () => fetchedTransaction(o, { customer_id: "ctm_other" }));
    const error = await svc.recoverFoundingInvoice(o.org).catch(e => e);
    assert.match(error.message, /customer mismatch/);
    assert.ok(!error.message.includes(o.customer) && !error.message.includes("ctm_other"));
    assert.equal(await invoiceCount(o.workspace), 0);
    assert.deepEqual(logs, [{ event: "founding_invoice_recovery.failed", stage: "customer_validation", errorCategory: "Error" }]);
    assertNoSecrets(logs, o);
  });

  test("M: a mismatched subscription ID is rejected before any DB write, logging only the safe stage", async () => {
    const o = await confirmedOrganization();
    const { service: svc, logs } = serviceWithLogSpy(async () => fetchedTransaction(o, { subscription_id: "sub_other" }));
    const error = await svc.recoverFoundingInvoice(o.org).catch(e => e);
    assert.match(error.message, /subscription mismatch/);
    assert.ok(!error.message.includes(o.subscription) && !error.message.includes("sub_other"));
    assert.equal(await invoiceCount(o.workspace), 0);
    assert.deepEqual(logs, [{ event: "founding_invoice_recovery.failed", stage: "subscription_validation", errorCategory: "Error" }]);
    assertNoSecrets(logs, o);
  });

  test("N: a transaction missing the founding price is rejected before any DB write, logging only the safe stage", async () => {
    const o = await confirmedOrganization();
    const { service: svc, logs } = serviceWithLogSpy(async () => fetchedTransaction(o, { items: [{ price: { id: "pri_other" } }] }));
    const error = await svc.recoverFoundingInvoice(o.org).catch(e => e);
    assert.match(error.message, /founding price/);
    assert.equal(await invoiceCount(o.workspace), 0);
    assert.deepEqual(logs, [{ event: "founding_invoice_recovery.failed", stage: "founding_price_validation", errorCategory: "Error" }]);
    assertNoSecrets(logs, o);
  });

  test("O: a non-completed transaction is rejected before any DB write, logging only the safe stage", async () => {
    const o = await confirmedOrganization();
    const { service: svc, logs } = serviceWithLogSpy(async () => fetchedTransaction(o, { status: "paid" }));
    const error = await svc.recoverFoundingInvoice(o.org).catch(e => e);
    assert.match(error.message, /not completed/);
    assert.equal(await invoiceCount(o.workspace), 0);
    assert.deepEqual(logs, [{ event: "founding_invoice_recovery.failed", stage: "transaction_status_validation", errorCategory: "Error" }]);
    assertNoSecrets(logs, o);
  });

  test("P: a non-confirmed allocation is rejected without ever calling Paddle, logging only the safe stage", async () => {
    const o = await organization();
    await reserve(o); // status is "reserved", never confirmed
    let called = false;
    const { service: svc, logs } = serviceWithLogSpy(async () => { called = true; return fetchedTransaction(o); });
    const error = await svc.recoverFoundingInvoice(o.org).catch(e => e);
    assert.match(error.message, /not confirmed/);
    assert.equal(called, false);
    assert.deepEqual(logs, [{ event: "founding_invoice_recovery.failed", stage: "allocation_lookup", errorCategory: "Error" }]);
    assertNoSecrets(logs, o);
  });

  test("Q: an organization with no allocation at all cannot be targeted, logging only the safe stage", async () => {
    const other = await organization();
    let called = false;
    const { service: svc, logs } = serviceWithLogSpy(async () => { called = true; return fetchedTransaction(other); });
    const error = await svc.recoverFoundingInvoice(other.org).catch(e => e);
    assert.match(error.message, /not confirmed/);
    assert.equal(called, false);
    assert.deepEqual(logs, [{ event: "founding_invoice_recovery.failed", stage: "allocation_lookup", errorCategory: "Error" }]);
    assertNoSecrets(logs, other);
  });

  test("Q: a data-integrity workspace/organization mismatch is rejected before any DB write, logging only the safe stage", async () => {
    const o = await confirmedOrganization();
    const decoy = await organization();
    await db.pool.query("update workspaces set organization_id=$1 where id=$2", [decoy.org, o.workspace]);
    const { service: svc, logs } = serviceWithLogSpy(async () => fetchedTransaction(o));
    const error = await svc.recoverFoundingInvoice(o.org).catch(e => e);
    assert.match(error.message, /organization\/workspace mismatch/);
    assert.equal(await invoiceCount(o.workspace), 0);
    assert.deepEqual(logs, [{ event: "founding_invoice_recovery.failed", stage: "workspace_validation", errorCategory: "Error" }]);
    assertNoSecrets(logs, o);
  });

  test("successful recovery emits no failure diagnostic", async () => {
    const o = await confirmedOrganization();
    const { service: svc, logs } = serviceWithLogSpy(async () => fetchedTransaction(o));
    const result = await svc.recoverFoundingInvoice(o.org);
    assert.equal(result.recovered, true);
    // The pre-existing PaddleSubscriptionSyncService success log is unrelated and unchanged;
    // only the new failure diagnostic must never fire on a successful run.
    assert.ok(!logs.some(entry => entry.event === "founding_invoice_recovery.failed"));
  });

  test("an idempotent no-op recovery emits no failure diagnostic", async () => {
    const o = await confirmedOrganization();
    await service(async () => fetchedTransaction(o)).recoverFoundingInvoice(o.org);
    const { service: svc, logs } = serviceWithLogSpy(async () => fetchedTransaction(o));
    const result = await svc.recoverFoundingInvoice(o.org);
    assert.equal(result.recovered, false);
    assert.deepEqual(logs, []);
  });
});

// Mocked-client coverage for stages that are impractical to trigger against a real
// database (construction, lookup errors, provider errors, RPC errors). No HTTP/DB access.
function mockedStageHarness({ failStage, error = new Error("mock failure"), organizationRow = { id: "org-mock" }, invoiceRow = null }) {
  const logs = [];
  const alloc = { organization_id: "org-mock", workspace_id: "ws-mock", status: "confirmed",
    paddle_transaction_id: "txn_mock", paddle_customer_id: "ctm_mock",
    paddle_subscription_id: "sub_mock", founding_price_id: "pri_mock" };
  const workspaceRow = { organization_id: alloc.organization_id };
  const transaction = { id: alloc.paddle_transaction_id, status: "completed", customer_id: alloc.paddle_customer_id,
    subscription_id: alloc.paddle_subscription_id, items: [{ price: { id: alloc.founding_price_id } }], invoice_id: "inv_mock" };
  const step = (name, value) => { if (failStage === name) throw error; return value; };
  const client = {
    from(name) {
      return { select: () => ({ eq: () => ({ async maybeSingle() {
        if (name === "organizations") return step("organization_lookup", { data: organizationRow, error: null });
        if (name === "professional_founding_allocations") return step("allocation_lookup", { data: alloc, error: null });
        if (name === "workspaces") return step("workspace_validation", { data: workspaceRow, error: null });
        if (name === "invoices") return step("invoice_lookup", { data: invoiceRow, error: null });
        throw new Error(`unmocked table ${name}`);
      } }) }) };
    },
  };
  const request = async () => step("paddle_transaction_fetch", transaction);
  const { FoundingMemberService } = load("features/vayon/billing/services/founding-member.service.ts", {
    "@/lib/observability/logger": { log(event, fields) { logs.push({ event, ...fields }); } },
    "@/lib/supabase/service": { createSupabaseServiceClient: () => { if (failStage === "service_init") throw error; return client; } },
    "./paddle-subscription-sync.service": { PaddleSubscriptionSyncService: class { async project() { return step("billing_projection"); } } },
  });
  return { FoundingMemberService, client, request, logs };
}

test("service_init failure logs the safe stage without the raw message", () => {
  const error = new Error("service role key missing");
  const { FoundingMemberService, logs } = mockedStageHarness({ failStage: "service_init", error });
  assert.throws(() => FoundingMemberService.create(), /service role key missing/);
  assert.deepEqual(logs, [{ event: "founding_invoice_recovery.failed", stage: "service_init", errorCategory: "Error" }]);
});

test("organization_lookup DB error logs the safe stage without raw Supabase error details", async () => {
  const error = { code: "42501", message: "permission denied for table organizations" };
  const { FoundingMemberService, client, logs } = mockedStageHarness({ failStage: "organization_lookup", error });
  const svc = new FoundingMemberService(client, async () => { throw new Error("must not be called"); });
  await assert.rejects(svc.organizationIdByName("PRAKYATH VP Organization"), actual => actual === error);
  assert.deepEqual(logs, [{ event: "founding_invoice_recovery.failed", stage: "organization_lookup", errorCategory: "DatabaseError", sqlstate: "42501" }]);
  assert.ok(!JSON.stringify(logs).includes("permission denied"));
});

test("organization not found logs the safe stage without the searched name", async () => {
  const { FoundingMemberService, client, logs } = mockedStageHarness({ failStage: null, organizationRow: null });
  const svc = new FoundingMemberService(client, async () => { throw new Error("must not be called"); });
  const id = await svc.organizationIdByName("PRAKYATH VP Organization");
  assert.equal(id, null);
  assert.deepEqual(logs, [{ event: "founding_invoice_recovery.failed", stage: "organization_lookup", errorCategory: "Error" }]);
  assert.ok(!JSON.stringify(logs).includes("PRAKYATH"));
});

test("paddle_transaction_fetch failure logs the safe stage with only allowlisted provider diagnostics", async () => {
  const error = Object.assign(new Error("Paddle API failed (500)."), { name: "PaddleApiError", status: 500, code: "internal_server_error" });
  const { FoundingMemberService, client, request, logs } = mockedStageHarness({ failStage: "paddle_transaction_fetch", error });
  const svc = new FoundingMemberService(client, request);
  await assert.rejects(svc.recoverFoundingInvoice("org-mock"), actual => actual === error);
  assert.deepEqual(logs, [{ event: "founding_invoice_recovery.failed", stage: "paddle_transaction_fetch",
    errorCategory: "PaddleApiError", providerHttpStatus: 500, providerErrorCode: "internal_server_error" }]);
  assert.ok(!JSON.stringify(logs).includes("txn_mock"));
});

test("invoice_lookup DB error logs the safe stage without the transaction identity", async () => {
  const error = { code: "08006", message: "connection failure" };
  const { FoundingMemberService, client, request, logs } = mockedStageHarness({ failStage: "invoice_lookup", error });
  const svc = new FoundingMemberService(client, request);
  await assert.rejects(svc.recoverFoundingInvoice("org-mock"), actual => actual === error);
  assert.deepEqual(logs, [{ event: "founding_invoice_recovery.failed", stage: "invoice_lookup", errorCategory: "DatabaseError", sqlstate: "08006" }]);
  assert.ok(!JSON.stringify(logs).includes("inv_mock") && !JSON.stringify(logs).includes("txn_mock"));
});

test("billing_projection RPC failure logs the safe stage without the SQL error message or payload", async () => {
  const error = { code: "23502", message: "null value in column provider_item_id violates not-null constraint" };
  const { FoundingMemberService, client, request, logs } = mockedStageHarness({ failStage: "billing_projection", error });
  const svc = new FoundingMemberService(client, request);
  await assert.rejects(svc.recoverFoundingInvoice("org-mock"), actual => actual === error);
  assert.deepEqual(logs, [{ event: "founding_invoice_recovery.failed", stage: "billing_projection", errorCategory: "DatabaseError", sqlstate: "23502" }]);
  assert.ok(!JSON.stringify(logs).includes("provider_item_id") && !JSON.stringify(logs).includes("txn_mock"));
});

test("S: recover-invoice route requires CRON_SECRET and calls recovery exactly once when authorized", async () => {
  const original = process.env.CRON_SECRET;
  try {
    process.env.CRON_SECRET = "recover-invoice-test-only";
    const calls = [];
    const { GET } = load("app/api/billing/paddle/founding/recover-invoice/route.ts", {
      "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
      "@/features/vayon/billing/services/founding-member.service": {
        FoundingMemberService: class {
          static create() { return new this(); }
          async organizationIdByName(name) { calls.push(["organizationIdByName", name]); return "org-under-test"; }
          async recoverFoundingInvoice(id) { calls.push(["recoverFoundingInvoice", id]); return { recovered: true }; }
        },
      },
    });
    const missing = await GET(new Request("https://example.test"));
    assert.equal(missing.status, 401);
    assert.deepEqual(await missing.json(), { error: "Unauthorized" });

    const wrong = await GET(new Request("https://example.test", { headers: { authorization: "Bearer wrong-secret" } }));
    assert.equal(wrong.status, 401);
    assert.equal(calls.length, 0);

    const ok = await GET(new Request("https://example.test", { headers: { authorization: "Bearer recover-invoice-test-only" } }));
    assert.equal(ok.status, 200);
    assert.deepEqual(await ok.json(), { ok: true, alreadyRecovered: false });
    assert.deepEqual(calls, [["organizationIdByName", "PRAKYATH VP Organization"], ["recoverFoundingInvoice", "org-under-test"]]);
  } finally {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
  }
});

test("S: recover-invoice route returns a sanitized 503 on failure, never a provider payload", async () => {
  const original = process.env.CRON_SECRET;
  try {
    process.env.CRON_SECRET = "recover-invoice-test-only";
    const { GET } = load("app/api/billing/paddle/founding/recover-invoice/route.ts", {
      "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
      "@/features/vayon/billing/services/founding-member.service": {
        FoundingMemberService: class {
          static create() { return new this(); }
          async organizationIdByName() { return "org-under-test"; }
          async recoverFoundingInvoice() { throw Object.assign(new Error("Bearer secret_token txn_private"), { name: "PaddleApiError", status: 500 }); }
        },
      },
    });
    const response = await GET(new Request("https://example.test", { headers: { authorization: "Bearer recover-invoice-test-only" } }));
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.deepEqual(body, { error: "Invoice recovery requires retry" });
    assert.ok(!JSON.stringify(body).includes("secret_token") && !JSON.stringify(body).includes("txn_private"));
  } finally {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
  }
});

test("T: rejection messages never embed the request's Authorization header or CRON_SECRET", async () => {
  const original = process.env.CRON_SECRET;
  try {
    process.env.CRON_SECRET = "should-never-appear-in-any-response";
    const { GET } = load("app/api/billing/paddle/founding/recover-invoice/route.ts", {
      "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
      "@/features/vayon/billing/services/founding-member.service": { FoundingMemberService: class {} },
    });
    for (const response of [
      await GET(new Request("https://example.test")),
      await GET(new Request("https://example.test", { headers: { authorization: "Bearer not-it" } })),
    ]) {
      const text = await response.text();
      assert.ok(!text.includes(process.env.CRON_SECRET));
      assert.ok(!text.includes("not-it"));
    }
  } finally {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
  }
});
