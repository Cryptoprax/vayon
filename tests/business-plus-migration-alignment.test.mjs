import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, after, describe, test } from "node:test";
import { foundingDatabase } from "./helpers/sprint237-database.mjs";

const migrationPath = "supabase/migrations/20261101010000_align_business_plus_entitlements.sql";
const migrationSource = readFileSync(migrationPath, "utf8");
const seedSource = readFileSync("supabase/migrations/20260922000000_sprint143_paddle_billing_platform.sql", "utf8");

// The historical (pre-fix) business_plus limits, as literally seeded by the
// unmodified, immutable sprint143 migration -- this is a static fact about a
// historical file, not something that needs a live "before" database snapshot.
const historicalLimitsJson = seedSource.match(/'business_plus'.*?(\{[^']*\})'::jsonb/s)?.[1];
const historicalFeaturesMatch = seedSource.match(/array\[('crm'.*?'audit')\]/s)?.[1];
const historicalFeatures = historicalFeaturesMatch?.split(",").map(s => s.replaceAll("'", ""));

const approvedLimits = {
  workspaces: 25, users: 150, storage_gb: 1500, ai_requests: 150000, exports: 7500, reports: 7500,
  workflows: 3000, automations: 3000, integrations: 75, knowledge_articles: 30000, creative_assets: 7500, api_calls: 300000,
};

test("historical business_plus limits (pre-fix) were all null", () => {
  assert.ok(historicalLimitsJson, "expected to find the business_plus seed literal in sprint143");
  assert.deepEqual(JSON.parse(historicalLimitsJson), {
    workspaces: null, users: null, storage_gb: null, ai_requests: null, exports: null, reports: null,
    workflows: null, automations: null, integrations: null, knowledge_articles: null, creative_assets: null, api_calls: null,
  });
});

test("migration targets only code='business_plus' and only the limits column", () => {
  assert.match(migrationSource, /update public\.subscription_plans/);
  assert.match(migrationSource, /where code = 'business_plus'/);
  // No other WHERE/code literal, no second UPDATE statement, no other table touched.
  assert.equal((migrationSource.match(/update public\./g) ?? []).length, 1);
  assert.equal((migrationSource.match(/where code/gi) ?? []).length, 1);
  assert.doesNotMatch(migrationSource, /'starter'|'professional'|'business'(?!_plus)|'enterprise'/);
});

test("migration does not modify subscription_plans.features", () => {
  assert.doesNotMatch(migrationSource, /\bfeatures\s*=/);
});

test("migration never touches organization_limits directly", () => {
  // The migration's explanatory comment references organization_limits to
  // document how the projection works; only the executable SQL matters here.
  const executable = migrationSource.split("\n").filter(line => !line.trimStart().startsWith("--")).join("\n");
  assert.doesNotMatch(executable, /organization_limits/);
});

test("migration is free of Paddle IDs and secrets", () => {
  assert.doesNotMatch(migrationSource, /\b(?:pri|pro)_[a-z0-9]+\b/i);
  assert.doesNotMatch(migrationSource, /PADDLE_API_KEY|PADDLE_WEBHOOK_SECRET|SUPABASE_SERVICE_ROLE_KEY|CRON_SECRET/);
});

test("migration is transactional (begin/commit) and idempotent on repeated read", () => {
  assert.match(migrationSource, /^begin;/m);
  assert.match(migrationSource, /^commit;/m);
  // A plain UPDATE with static literal values naturally re-applies to the same
  // end state; confirmed empirically below against a live database.
});

describe("Business Plus subscription_plans migration (real PostgreSQL)", { skip: !process.env.SPRINT237_POSTGRES_PORT }, () => {
  let db;
  before(async () => { db = await foundingDatabase(); });
  after(async () => { if (db) await db.close(); });

  test("business_plus exists and its limits equal the approved finite values", async () => {
    const { rows } = await db.pool.query("select limits, features from subscription_plans where code='business_plus'");
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0].limits, approvedLimits);
  });

  test("business_plus features are unchanged from the historical seed", async () => {
    const { rows } = await db.pool.query("select features from subscription_plans where code='business_plus'");
    assert.deepEqual([...rows[0].features].sort(), [...historicalFeatures].sort());
  });

  test("starter and professional rows are untouched by a re-run of this migration", async () => {
    const before = (await db.pool.query("select code, limits, features, updated_at from subscription_plans where code in ('starter','professional') order by code")).rows;
    await db.owner.query(migrationSource);
    const after = (await db.pool.query("select code, limits, features, updated_at from subscription_plans where code in ('starter','professional') order by code")).rows;
    assert.deepEqual(after, before);
  });

  test("no organization_limits row exists after migration (nothing was directly written there)", async () => {
    const { rows } = await db.pool.query("select count(*) n from organization_limits");
    assert.equal(rows[0].n, "0");
  });

  test("running the migration again produces the same final state, no duplicate row, no error", async () => {
    await db.owner.query(migrationSource);
    const { rows } = await db.pool.query("select count(*) n, (array_agg(limits))[1] limits from subscription_plans where code='business_plus'");
    assert.equal(rows[0].n, "1");
    assert.deepEqual(rows[0].limits, approvedLimits);
  });

  test("process_paddle_billing_event_core237 reads the corrected business_plus limits into organization_limits", async () => {
    const { randomUUID } = await import("node:crypto");
    const org = randomUUID(), workspace = randomUUID(), customer = `ctm_${randomUUID()}`, subscriptionId = `sub_${randomUUID().replaceAll("-", "").slice(0, 26)}`;
    await db.pool.query("insert into organizations values($1)", [org]);
    await db.pool.query("insert into workspaces values($1,$2)", [workspace, org]);
    await db.pool.query("insert into billing_customers values($1,$2,'paddle',$3)", [org, workspace, customer]);
    await db.pool.query("insert into subscriptions(organization_id,workspace_id) values($1,$2)", [org, workspace]);
    const payload = {
      id: subscriptionId, status: "active", customer_id: customer, updated_at: "2026-11-01T00:00:00Z",
      custom_data: { organization_id: org, workspace_id: workspace, plan_code: "business_plus" },
      current_billing_period: { starts_at: "2026-11-01T00:00:00Z", ends_at: "2026-12-01T00:00:00Z" },
      items: [{ price: { id: "pri_businessplus001" }, quantity: 1 }],
    };
    await db.pool.query("select process_paddle_billing_event($1,'subscription.updated',$2)", [randomUUID(), payload]);
    const { rows } = await db.pool.query("select metric, limit_value from organization_limits where workspace_id=$1 order by metric", [workspace]);
    const projected = Object.fromEntries(rows.map(r => [r.metric, Number(r.limit_value)]));
    assert.deepEqual(projected, approvedLimits);
  });
});
