import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = path => readFileSync(path, "utf8");
const trial = read("features/vayon/billing/config/trial.ts");
const banner = read("features/vayon/billing/components/WorkspaceTrialBanner.tsx");
const billing = read("features/vayon/billing/components/BillingUI.tsx");
const snapshot = read("features/vayon/billing/services/workspace-trial.ts");

test("trial presentation uses persisted expiry and VAYON3DAY redemption metadata", () => {
  assert.match(trial, /if \(!Number\.isFinite\(end\)\) return \{ trial: false/);
  assert.match(trial, /redeemedAt/);
  assert.match(snapshot, /workspace_promo_redemptions/);
  assert.match(snapshot, /redeemed_at,access_ends_at/);
  assert.match(banner, /snapshot\.source === "vayon3day"/);
  assert.match(billing, /trialSnapshot/);
  assert.doesNotMatch(trial, /4 - daysRemaining/);
});

test("no-entitlement records do not gain an implicit trial through entitlement fallback", () => {
  const entitlement = read("features/vayon/billing/services/entitlement.service.ts");
  const policy = read("features/vayon/billing/services/entitlement-policy.ts");
  assert.match(entitlement, /"unverified"/);
  assert.match(policy, /subscriptionStatus === "unverified"/);
});
