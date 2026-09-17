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

  test("K: a mismatched transaction ID is rejected before any DB write", async () => {
    const o = await confirmedOrganization();
    const error = await service(async () => fetchedTransaction(o, { id: "txn_other" })).recoverFoundingInvoice(o.org).catch(e => e);
    assert.match(error.message, /Unexpected founding transaction identity/);
    assert.ok(!error.message.includes(o.transaction) && !error.message.includes("txn_other"));
    assert.equal(await invoiceCount(o.workspace), 0);
  });

  test("L: a mismatched customer ID is rejected before any DB write", async () => {
    const o = await confirmedOrganization();
    const error = await service(async () => fetchedTransaction(o, { customer_id: "ctm_other" })).recoverFoundingInvoice(o.org).catch(e => e);
    assert.match(error.message, /customer mismatch/);
    assert.ok(!error.message.includes(o.customer) && !error.message.includes("ctm_other"));
    assert.equal(await invoiceCount(o.workspace), 0);
  });

  test("M: a mismatched subscription ID is rejected before any DB write", async () => {
    const o = await confirmedOrganization();
    const error = await service(async () => fetchedTransaction(o, { subscription_id: "sub_other" })).recoverFoundingInvoice(o.org).catch(e => e);
    assert.match(error.message, /subscription mismatch/);
    assert.ok(!error.message.includes(o.subscription) && !error.message.includes("sub_other"));
    assert.equal(await invoiceCount(o.workspace), 0);
  });

  test("N: a transaction missing the founding price is rejected before any DB write", async () => {
    const o = await confirmedOrganization();
    const error = await service(async () => fetchedTransaction(o, { items: [{ price: { id: "pri_other" } }] })).recoverFoundingInvoice(o.org).catch(e => e);
    assert.match(error.message, /founding price/);
    assert.equal(await invoiceCount(o.workspace), 0);
  });

  test("O: a non-completed transaction is rejected before any DB write", async () => {
    const o = await confirmedOrganization();
    const error = await service(async () => fetchedTransaction(o, { status: "paid" })).recoverFoundingInvoice(o.org).catch(e => e);
    assert.match(error.message, /not completed/);
    assert.equal(await invoiceCount(o.workspace), 0);
  });

  test("P: a non-confirmed allocation is rejected without ever calling Paddle", async () => {
    const o = await organization();
    await reserve(o); // status is "reserved", never confirmed
    let called = false;
    const error = await service(async () => { called = true; return fetchedTransaction(o); }).recoverFoundingInvoice(o.org).catch(e => e);
    assert.match(error.message, /not confirmed/);
    assert.equal(called, false);
  });

  test("Q: an organization with no allocation at all cannot be targeted", async () => {
    const other = await organization();
    let called = false;
    const error = await service(async () => { called = true; return fetchedTransaction(other); }).recoverFoundingInvoice(other.org).catch(e => e);
    assert.match(error.message, /not confirmed/);
    assert.equal(called, false);
  });

  test("Q: a data-integrity workspace/organization mismatch is rejected before any DB write", async () => {
    const o = await confirmedOrganization();
    const decoy = await organization();
    await db.pool.query("update workspaces set organization_id=$1 where id=$2", [decoy.org, o.workspace]);
    const error = await service(async () => fetchedTransaction(o)).recoverFoundingInvoice(o.org).catch(e => e);
    assert.match(error.message, /organization\/workspace mismatch/);
    assert.equal(await invoiceCount(o.workspace), 0);
  });
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
