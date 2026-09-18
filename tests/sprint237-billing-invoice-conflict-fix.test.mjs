import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, after, beforeEach, describe, test } from "node:test";
import { foundingDatabase } from "./helpers/sprint237-database.mjs";

// Regression coverage for the invoice ON CONFLICT(provider_invoice_id) fix.
// Production's only uniqueness guarantee on that column is a partial unique
// index (see 20260815020000_sprint50_stripe_billing_platform.sql), so an
// unpredicated ON CONFLICT raised SQLSTATE 42P10 on every invoice upsert
// through both the Paddle and Stripe billing-event processors.
describe("Billing invoice provider-conflict-target fix (real PostgreSQL)", { skip: !process.env.SPRINT237_POSTGRES_PORT }, () => {
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
    return { org, workspace, customer, transaction: `txn_${randomUUID()}` };
  }
  function paddleTransaction(o, changes = {}) {
    return { id: o.transaction, status: "completed", customer_id: o.customer,
      custom_data: { organization_id: o.org, workspace_id: o.workspace },
      invoice_id: `inv_${o.org}`, details: { totals: { subtotal: "7900", tax: "0" } },
      billed_at: new Date().toISOString(), invoice_url: null, ...changes };
  }
  function stripeInvoice(o, changes = {}) {
    return { id: `in_${o.org}`, number: `INV-${o.org}`, customer: o.customer,
      metadata: { organization_id: o.org, workspace_id: o.workspace },
      currency: "usd", subtotal: 7900, total_tax_amounts: [{ amount: 0 }],
      created: Math.floor(Date.now() / 1000), due_date: null,
      hosted_invoice_url: null, payment_intent: null, ...changes };
  }
  const projectPaddle = (eventId, eventType, payload) =>
    db.pool.query("select process_paddle_billing_event($1,$2,$3)", [eventId, eventType, payload]);
  const projectStripe = (eventId, eventType, payload) =>
    db.pool.query("select process_stripe_billing_event($1,$2,$3)", [eventId, eventType, payload]);
  async function invoices(workspace) {
    return (await db.pool.query("select * from invoices where workspace_id=$1", [workspace])).rows;
  }

  test("A/C: a transaction.completed projection with no existing invoice inserts exactly one invoice, no 42P10", async () => {
    const o = await organization();
    await projectPaddle(randomUUID(), "transaction.completed", paddleTransaction(o));
    const rows = await invoices(o.workspace);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].provider_invoice_id, `inv_${o.org}`);
    assert.equal(rows[0].status, "paid");
  });

  test("B/D: replaying the same provider invoice identity updates in place, never duplicates", async () => {
    const o = await organization();
    await projectPaddle(randomUUID(), "transaction.completed", paddleTransaction(o));
    // A distinct event ID (as a real retried/renewal webhook would carry) reprocessing
    // the SAME provider_invoice_id must hit the upsert path, not insert a second row.
    await projectPaddle(randomUUID(), "transaction.completed", paddleTransaction(o, { billed_at: new Date(Date.now() + 1000).toISOString() }));
    const rows = await invoices(o.workspace);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].provider_invoice_id, `inv_${o.org}`);
  });

  test("D: uniqueness semantics remain intact across distinct organizations", async () => {
    const a = await organization(), b = await organization();
    await projectPaddle(randomUUID(), "transaction.completed", paddleTransaction(a));
    await projectPaddle(randomUUID(), "transaction.completed", paddleTransaction(b));
    assert.equal((await invoices(a.workspace)).length, 1);
    assert.equal((await invoices(b.workspace)).length, 1);
    assert.notEqual((await invoices(a.workspace))[0].provider_invoice_id, (await invoices(b.workspace))[0].provider_invoice_id);
  });

  test("payment.failed projects a failed invoice without a paid_at, no 42P10", async () => {
    const o = await organization();
    await projectPaddle(randomUUID(), "payment.failed", paddleTransaction(o, { status: "completed" }));
    const rows = await invoices(o.workspace);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, "failed");
    assert.equal(rows[0].paid_at, null);
  });

  test("G: Stripe invoice.paid projection inserts exactly one invoice and is idempotent, no 42P10", async () => {
    const o = await organization();
    await projectStripe(randomUUID(), "invoice.paid", stripeInvoice(o));
    let rows = await invoices(o.workspace);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].provider_invoice_id, `in_${o.org}`);
    assert.equal(rows[0].status, "paid");

    await projectStripe(randomUUID(), "invoice.payment_failed", stripeInvoice(o));
    rows = await invoices(o.workspace);
    assert.equal(rows.length, 1, "must update the existing row, not insert a second one");
    assert.equal(rows[0].status, "failed");
  });
});
