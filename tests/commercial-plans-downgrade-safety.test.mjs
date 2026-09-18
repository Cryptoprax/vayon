import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const platform = readFileSync("features/vayon/billing/components/CommercialPlatform.tsx", "utf8");
const management = readFileSync("features/vayon/billing/components/SubscriptionManagement.tsx", "utf8");

test('5: CommercialPlatform "manage" (lower-plan) branch cannot invoke changePlan, checkout, or any mutation', () => {
  const manageBranch = platform.split('action === "manage" ?')[1]?.split(': <p className="text-sm text-vds-muted">Online checkout')[0];
  assert.ok(manageBranch, "expected to find the manage branch in the render ternary");
  assert.doesNotMatch(manageBranch, /changePlan\(|checkout\(|manageSubscription|fetch\(/);
  assert.match(manageBranch, /Downgrades are managed separately/);
});

test('6: SubscriptionManagement cannot submit manageSubscription("change") for a lower/unlisted plan', () => {
  assert.match(management, /resolvePlanAction/, "must reuse the canonical decision function, not duplicate plan-ordering logic");
  assert.match(management, /planAction\(plan\) === "upgrade"/);
  assert.match(management, /upgradeablePlans[^)]*\)\.includes\(plan\)/);
  assert.match(management, /That plan change is not available here\. Contact support to downgrade\./);
});

test("7: SubscriptionManagement still offers the mutating change form when an upgrade target exists", () => {
  assert.match(management, /upgradeablePlans\.length > 0 && <form action=\{submit\}/);
  assert.match(management, /input type="hidden" name="intent" value="change"/);
});

test("SubscriptionManagement fails closed for an unrecognized/stale current plan (no upgrade options offered)", () => {
  assert.match(management, /isSubscriptionPlanCode\(subscription\.planCode\)/);
  // currentPlanCode becomes null for a stale/unmapped plan code; resolvePlanAction
  // itself returns "unavailable" (never "upgrade") whenever currentPlanCode is null
  // while hasActiveSubscription is true -- proven directly in plan-action tests.
  assert.match(management, /currentPlanCode = subscription\.planCode && isSubscriptionPlanCode/);
});

test("13: no scheduled-downgrade behavior is represented anywhere in either component", () => {
  for (const source of [platform, management]) {
    assert.doesNotMatch(source, /scheduled/i);
    assert.doesNotMatch(source, /next billing period/i);
    assert.doesNotMatch(source, /downgrade.*(?:will|is) (?:take effect|scheduled|apply)/i);
  }
});

test("14: no Paddle Customer Portal dependency is introduced by the downgrade-safety change", () => {
  for (const source of [platform, management]) {
    assert.doesNotMatch(source, /\/api\/billing\/paddle\/portal/);
    assert.doesNotMatch(source, /PaddlePortalButton|openPaddlePortalAction|PaddleBilling/);
  }
});

test("the backend changeSubscription/manageSubscription mechanism itself is untouched by this pass", () => {
  const provider = readFileSync("features/vayon/billing/providers/paddle/paddle.provider.ts", "utf8");
  const actions = readFileSync("features/vayon/billing/actions/subscription-center.actions.ts", "utf8");
  assert.match(provider, /proration_billing_mode: "prorated_immediately"/);
  assert.match(actions, /await service\.change\(plan, period, subscription\.seatQuantity, version\)/);
});
