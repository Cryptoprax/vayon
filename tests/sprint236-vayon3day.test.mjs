import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const migration = read("supabase/migrations/20261030030000_sprint236_vayon3day_redemption.sql");
const action = read("features/vayon/billing/actions/vayon3day.actions.ts");
const ui = read("features/vayon/billing/components/SubscriptionCenter.tsx");

test("VAYON3DAY is server-authoritative and records one redemption per user, organization, and workspace", () => {
  for (const key of ["unique (code, user_id)", "unique (code, organization_id)", "unique (code, workspace_id)", "for update", "clock_timestamp()", "interval '3 days'", "upper(btrim(coalesce(p_code,'')))"]) assert.match(migration, new RegExp(key.replace(/[()]/g, "\\$&")));
  assert.match(migration, /when unique_violation then/);
  assert.match(migration, /status='active'.*PAID_SUBSCRIPTION/);
  assert.match(migration, /trial_ends_at is not null.*LEGACY_TRIAL_USED/);
  const redemption = migration.slice(migration.indexOf("create or replace function public.redeem_vayon3day"), migration.indexOf("-- Preserve the required subscription row"));
  assert.doesNotMatch(redemption, /p_user|p_workspace|p_organization|p_expiry/i);
});

test("new workspace provisioning preserves its subscription row without starting a trial clock", () => {
  const provisioning = migration.slice(migration.lastIndexOf("create or replace function public.provision_workspace_billing"));
  assert.match(provisioning, /values\(p_organization,p_workspace,v_plan.id,null,null/);
  assert.doesNotMatch(provisioning, /now\(\)\+interval.*3 days/i);
});

test("the redemption action and Subscription Center never grant browser-authoritative access", () => {
  assert.match(action, /billingContext\("manage"\)/);
  assert.match(action, /rpc\("redeem_vayon3day", \{ p_code: code \}\)/);
  assert.doesNotMatch(action, /workspaceId|organizationId|userId|endsAt/);
  assert.match(ui, /Use 3-Day Access Code/);
  assert.match(ui, /redeemVayon3Day\(accessCode\)/);
  assert.match(ui, /router\.refresh\(\).*router\.push\("\/vayon\/dashboard"\)/);
});

test("VAYON3DAY RPC execution is restricted and does not invoke Paddle", () => {
  assert.match(migration, /revoke all on function public\.redeem_vayon3day\(text\) from public;/);
  assert.match(migration, /revoke execute on function public\.redeem_vayon3day\(text\) from anon;/);
  assert.match(migration, /grant execute on function public\.redeem_vayon3day\(text\) to authenticated;/);
  assert.doesNotMatch(`${migration}\n${action}`, /paddle|transaction|provider_subscription_id/i);
});
