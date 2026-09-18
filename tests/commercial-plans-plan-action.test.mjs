import assert from "node:assert/strict";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const { resolvePlanAction } = load("features/vayon/billing/services/plan-action.ts");

const base = { checkoutEnabled: true, hasClientToken: true };

// 1-4: no active subscription -> normal self-service checkout for every self-service plan.
for (const plan of ["starter", "professional", "business", "business_plus"])
  test(`1-4: unsubscribed user can choose ${plan}`, () => {
    assert.equal(resolvePlanAction({ ...base, planCode: plan, currentPlanCode: null, hasActiveSubscription: false }), "checkout");
  });

test("5: Professional subscriber sees Professional as Current Plan", () => {
  assert.equal(resolvePlanAction({ ...base, planCode: "professional", currentPlanCode: "professional", hasActiveSubscription: true }), "current");
});

test("6: Professional subscriber can see Upgrade to Business", () => {
  assert.equal(resolvePlanAction({ ...base, planCode: "business", currentPlanCode: "professional", hasActiveSubscription: true }), "upgrade");
});

test("7: Professional subscriber can see Upgrade to Business Plus", () => {
  assert.equal(resolvePlanAction({ ...base, planCode: "business_plus", currentPlanCode: "professional", hasActiveSubscription: true }), "upgrade");
});

test("8: Business subscriber sees Business as Current Plan", () => {
  assert.equal(resolvePlanAction({ ...base, planCode: "business", currentPlanCode: "business", hasActiveSubscription: true }), "current");
});

test("9: Business subscriber sees Upgrade to Business Plus", () => {
  assert.equal(resolvePlanAction({ ...base, planCode: "business_plus", currentPlanCode: "business", hasActiveSubscription: true }), "upgrade");
});

test("10: Business Plus subscriber sees Business Plus as Current Plan", () => {
  assert.equal(resolvePlanAction({ ...base, planCode: "business_plus", currentPlanCode: "business_plus", hasActiveSubscription: true }), "current");
});

test("11: Enterprise is always Contact Sales, regardless of subscription state", () => {
  for (const currentPlanCode of [null, "starter", "professional", "business", "business_plus", "enterprise"])
    for (const hasActiveSubscription of [false, true])
      for (const checkoutEnabled of [false, true])
        assert.equal(resolvePlanAction({ planCode: "enterprise", currentPlanCode, hasActiveSubscription, checkoutEnabled, hasClientToken: true }), "contact");
});

test("1: a lower target plan resolves to the non-mutating 'manage' action, never 'downgrade'", () => {
  assert.equal(resolvePlanAction({ ...base, planCode: "starter", currentPlanCode: "business", hasActiveSubscription: true }), "manage");
  assert.equal(resolvePlanAction({ ...base, planCode: "business", currentPlanCode: "business_plus", hasActiveSubscription: true }), "manage");
  assert.notEqual(resolvePlanAction({ ...base, planCode: "starter", currentPlanCode: "business", hasActiveSubscription: true }), "downgrade");
});

test("2: a higher target plan still resolves to 'upgrade'", () => {
  assert.equal(resolvePlanAction({ ...base, planCode: "business_plus", currentPlanCode: "business", hasActiveSubscription: true }), "upgrade");
});

test("checkout is unavailable when server configuration disallows it, even for a new subscriber", () => {
  assert.equal(resolvePlanAction({ planCode: "professional", currentPlanCode: null, hasActiveSubscription: false, checkoutEnabled: false, hasClientToken: true }), "unavailable");
});

test("new-subscription checkout requires a client token; plan changes on an existing subscription do not", () => {
  assert.equal(resolvePlanAction({ planCode: "professional", currentPlanCode: null, hasActiveSubscription: false, checkoutEnabled: true, hasClientToken: false }), "unavailable");
  assert.equal(resolvePlanAction({ planCode: "business", currentPlanCode: "professional", hasActiveSubscription: true, checkoutEnabled: true, hasClientToken: false }), "upgrade");
});

test("25: an active subscription with an unrecognized/stale current plan code fails closed to unavailable, never guesses a direction", () => {
  assert.equal(resolvePlanAction({ ...base, planCode: "business", currentPlanCode: null, hasActiveSubscription: true }), "unavailable");
});
