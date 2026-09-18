import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { load } from "./helpers/sprint237-load.mjs";

const pricingTable = readFileSync("features/marketing/components/PricingTable.tsx", "utf8");
const commercialPlatform = readFileSync("features/vayon/billing/components/CommercialPlatform.tsx", "utf8");
const billingPage = readFileSync("app/vayon/settings/billing/page.tsx", "utf8");
const foundingService = readFileSync("features/vayon/billing/services/founding-member.service.ts", "utf8");

// ---------------------------------------------------------------------------
// Task A: pricing CTA preserves plan + period
// ---------------------------------------------------------------------------
for (const plan of ["starter", "professional", "business", "business_plus"])
  for (const period of ["monthly", "annual"])
    test(`1-8: ${plan} ${period} CTA preserves plan and period`, () => {
      const annual = period === "annual";
      const href = `/signup?plan=${plan}&period=${annual ? "annual" : "monthly"}`;
      assert.equal(href, `/signup?plan=${plan}&period=${period}`);
    });
test("pricing CTA source builds the exact plan+period query, and Enterprise is never self-service", () => {
  assert.match(pricingTable, /\/signup\?plan=\$\{plan\.code\}&period=\$\{annual \? "annual" : "monthly"\}/);
  assert.match(pricingTable, /plan\.name === "Enterprise"\s*\n\s*\? "\/contact\?intent=sales"/);
});

// ---------------------------------------------------------------------------
// Task B: /signup page validation
// ---------------------------------------------------------------------------
async function renderSignupPage(searchParams) {
  let captured;
  const { default: Page } = load("app/signup/page.tsx", {
    "@/features/authentication/components/SignupForm": { SignupForm: (props) => { captured = props; return null; } },
  });
  const element = await Page({ searchParams: Promise.resolve(searchParams) });
  renderToStaticMarkup(element);
  return captured;
}
test("9: generic signup (no plan/period) forces no intent", async () => {
  const props = await renderSignupPage({});
  assert.equal(props.plan, undefined);
  assert.equal(props.period, undefined);
});
test("a valid plan and period are passed through validated", async () => {
  const props = await renderSignupPage({ plan: "business_plus", period: "annual" });
  assert.equal(props.plan, "business_plus");
  assert.equal(props.period, "annual");
});
test("10: invalid plan fails closed to no intent without throwing", async () => {
  const props = await renderSignupPage({ plan: "gold", period: "monthly" });
  assert.equal(props.plan, undefined);
  assert.equal(props.period, "monthly");
});
test("invalid plan spelling (business-pro) fails closed", async () => {
  const props = await renderSignupPage({ plan: "business-pro" });
  assert.equal(props.plan, undefined);
});
test("11: invalid period fails closed to no period while keeping a valid plan", async () => {
  for (const period of ["weekly", "biweekly"]) {
    const props = await renderSignupPage({ plan: "business", period });
    assert.equal(props.plan, "business");
    assert.equal(props.period, undefined);
  }
});
test("12: Enterprise injection attempt fails closed -- never treated as self-service intent", async () => {
  const props = await renderSignupPage({ plan: "enterprise", period: "monthly" });
  assert.equal(props.plan, undefined);
});
test("initialError is still passed through unaffected by intent validation", async () => {
  const props = await renderSignupPage({ error: "Something went wrong" });
  assert.equal(props.initialError, "Something went wrong");
});

// ---------------------------------------------------------------------------
// Task C: SignupForm hidden-field propagation (no storage, no auto-navigation)
// ---------------------------------------------------------------------------
function renderSignupForm(plan, period) {
  const { SignupForm } = load("features/authentication/components/SignupForm.tsx", {
    react: { ...React, useActionState: () => [null, () => {}, false], useEffect: () => {}, useRef: () => ({ current: null }) },
    "next/link": { default: ({ children, href }) => React.createElement("a", { href }, children) },
    "@/features/platform/design-system": {
      Button: ({ children, disabled }) => React.createElement("button", { disabled }, children),
      ButtonLink: ({ children, href }) => React.createElement("a", { href }, children),
    },
    "../actions/auth.actions": {},
    "./AuthForm": {
      AuthShell: ({ title, children }) => React.createElement("main", null, React.createElement("h1", null, title), children),
      AuthFields: () => React.createElement("button", { type: "submit" }, "Create account"),
      FormNotice: () => null,
    },
  });
  return renderToStaticMarkup(React.createElement(SignupForm, { plan, period }));
}
test("13/17 support: SignupForm renders hidden plan+period fields in both the email and Google forms when valid", () => {
  const html = renderSignupForm("business_plus", "annual");
  assert.equal((html.match(/name="plan" value="business_plus"/g) || []).length, 2, "expected the hidden plan field in both forms");
  assert.equal((html.match(/name="period" value="annual"/g) || []).length, 2, "expected the hidden period field in both forms");
});
test("generic signup renders no hidden intent fields at all", () => {
  const html = renderSignupForm(undefined, undefined);
  assert.doesNotMatch(html, /name="plan"/);
  assert.doesNotMatch(html, /name="period"/);
});
test("a plan without a period renders only the plan hidden field", () => {
  const html = renderSignupForm("starter", undefined);
  assert.match(html, /name="plan" value="starter"/);
  assert.doesNotMatch(html, /name="period"/);
});
test("SignupForm never introduces localStorage, sessionStorage, cookies, or a direct Paddle navigation", () => {
  const source = readFileSync("features/authentication/components/SignupForm.tsx", "utf8");
  assert.doesNotMatch(source, /localStorage|sessionStorage|document\.cookie|paddle\.com|openCheckoutOverlay/i);
});

// ---------------------------------------------------------------------------
// Task E: Google OAuth preserves validated intent via the existing next= mechanism
// ---------------------------------------------------------------------------
async function runGoogleLogin(formEntries) {
  let capturedNext;
  const { googleLoginAction } = load("features/authentication/actions/auth.actions.ts", {
    "next/cache": { revalidatePath() {} },
    "next/headers": { headers: async () => new Headers({ origin: "https://www.vayon.online" }) },
    "next/navigation": { redirect() { throw new Error("REDIRECT"); } },
    "../services/authentication.service": {
      AuthenticationService: class {
        async googleLogin(_origin, next) { capturedNext = next; return { data: { url: "https://accounts.google.com/o/oauth2/auth?mock=1" }, error: null }; }
      },
    },
    "@/lib/supabase/server": {},
  });
  let form;
  if (formEntries) { form = new FormData(); for (const [key, val] of Object.entries(formEntries)) form.set(key, val); }
  try { await googleLoginAction(form); } catch (error) { if (error.message !== "REDIRECT") throw error; }
  return capturedNext;
}
test("17: Google OAuth preserves valid plan+period via the safe next= destination", async () => {
  const next = await runGoogleLogin({ plan: "business_plus", period: "annual" });
  assert.equal(next, "/vayon/dashboard?plan=business_plus&period=annual");
});
test("Google OAuth omits period when the plan is valid but the period is not", async () => {
  const next = await runGoogleLogin({ plan: "starter", period: "weekly" });
  assert.equal(next, "/vayon/dashboard?plan=starter");
});
test("Enterprise injection via Google OAuth fails closed -- never appears in next=", async () => {
  const next = await runGoogleLogin({ plan: "enterprise" });
  assert.equal(next, "/vayon/dashboard");
});
test("18: OAuth next= remains an internal, safe destination even with intent appended -- no external redirect", async () => {
  const next = await runGoogleLogin({ plan: "business", period: "monthly", next: "https://evil.test/steal" });
  assert.ok(next.startsWith("/"));
  assert.doesNotMatch(next, /evil\.test/);
  const parsed = new URL(next, "https://vayon.invalid");
  assert.equal(parsed.origin, "https://vayon.invalid");
});
test("generic Google sign-in with no form carries no intent", async () => {
  const next = await runGoogleLogin(undefined);
  assert.equal(next, "/vayon/dashboard");
});

// ---------------------------------------------------------------------------
// Task F: callback convergence -- re-validate before writing metadata, preserve
// unrelated existing metadata, never block sign-in on a metadata-write failure.
// ---------------------------------------------------------------------------
async function runCallback({ next = "/vayon", userMetadata = { name: "Test User" } } = {}) {
  const updateCalls = [];
  const { GET } = load("app/auth/callback/route.ts", {
    "next/headers": { cookies: async () => ({ has: () => false }) },
    "@/lib/supabase/config": { getSupabaseConfig: () => ({ url: "https://project.supabase.co", key: "k" }) },
    "@/lib/supabase/server": {
      createSupabaseServerClient: async () => ({
        auth: {
          exchangeCodeForSession: async () => ({ error: null, data: { session: { access_token: "t", refresh_token: "t" } } }),
          getUser: async () => ({ data: { user: { email_confirmed_at: "confirmed", app_metadata: { provider: "email" }, user_metadata: userMetadata } }, error: null }),
          updateUser: async (payload) => { updateCalls.push(payload); return { data: {}, error: null }; },
        },
        rpc: async () => ({}),
      }),
    },
  });
  const original = console.info; console.info = () => {};
  let response;
  try { response = await GET(new Request("https://www.vayon.online/auth/callback?" + new URLSearchParams({ code: "auth-code", next }))); }
  finally { console.info = original; }
  return { url: new URL(response.headers.get("location")), updateCalls };
}
test("19: callback re-validates before writing metadata -- an invalid plan in next= is rejected", async () => {
  const { updateCalls } = await runCallback({ next: "/vayon?plan=gold&period=monthly" });
  assert.equal(updateCalls.length, 0);
});
test("Enterprise injection via callback next= fails closed -- metadata is never written", async () => {
  const { updateCalls } = await runCallback({ next: "/vayon?plan=enterprise" });
  assert.equal(updateCalls.length, 0);
});
test("callback does not write metadata at all when next= carries no plan", async () => {
  const { updateCalls } = await runCallback({ next: "/vayon" });
  assert.equal(updateCalls.length, 0);
});
test("callback mirrors a valid plan+period from next= into user_metadata", async () => {
  const { updateCalls } = await runCallback({ next: "/vayon?plan=business_plus&period=annual" });
  assert.equal(updateCalls.length, 1);
  assert.deepEqual(updateCalls[0], { data: { name: "Test User", intendedPlan: "business_plus", intendedBillingPeriod: "annual" } });
});
test("20: callback preserves unrelated existing user_metadata when mirroring intent", async () => {
  const { updateCalls } = await runCallback({ next: "/vayon?plan=starter&period=monthly", userMetadata: { name: "Existing Name", otherField: 42 } });
  assert.deepEqual(updateCalls[0].data, { name: "Existing Name", otherField: 42, intendedPlan: "starter", intendedBillingPeriod: "monthly" });
});
test("a valid plan with an invalid period stores only the plan, never a fabricated period", async () => {
  const { updateCalls } = await runCallback({ next: "/vayon?plan=business&period=weekly" });
  assert.deepEqual(updateCalls[0].data, { name: "Test User", intendedPlan: "business" });
});

// ---------------------------------------------------------------------------
// Task G/H: downstream reader -- read only without an active subscription,
// re-validate at read time, active subscription always takes precedence.
// ---------------------------------------------------------------------------
test("21: signup intent is read from user_metadata only for a customer without an active subscription", () => {
  assert.match(billingPage, /const hasActiveSubscription = Boolean\(data\.subscription\?\.providerSubscriptionId && data\.subscription\.status !== "cancelled"\);/);
  assert.match(billingPage, /if \(!hasActiveSubscription\) \{/);
  assert.match(billingPage, /initialPlan=\{intendedPlan\} initialPeriod=\{intendedPeriod\}/);
});
test("22: stored metadata is re-validated at read time against the canonical Paddle allowlist", () => {
  assert.match(billingPage, /isPaddlePlanCode\(rawPlan\)/);
  assert.match(billingPage, /isPaddleBillingPeriod\(rawPeriod\)/);
});
test("23: active subscription ignores stale signup intent for both the highlighted plan and the period toggle", () => {
  assert.match(commercialPlatform, /const highlightedPlan = hasActiveSubscription \? undefined : initialPlan;/);
  assert.match(commercialPlatform, /useState<Period>\(!hasActiveSubscription && initialPeriod \? initialPeriod : "monthly"\)/);
});
function effectBodies(source) {
  const bodies = [];
  let index = 0;
  for (;;) {
    const start = source.indexOf("useEffect(", index);
    if (start === -1) break;
    const end = source.indexOf("}, [", start);
    bodies.push(source.slice(start, end));
    index = end + 1;
  }
  return bodies;
}
test("24: checkout() is only ever triggered by an explicit click, never from mount/effect", () => {
  const bodies = effectBodies(commercialPlatform);
  assert.ok(bodies.length >= 2, "expected to find both useEffect blocks");
  for (const body of bodies) assert.doesNotMatch(body, /checkout\(/);
  assert.match(commercialPlatform, /onClick=\{\(\) => checkout\(displayPlan\.code\)\}/);
  assert.equal((commercialPlatform.match(/checkout\(displayPlan\.code\)/g) || []).length, 1);
});
test("25: changePlan()/manageSubscription is only ever triggered by an explicit click, never automatically", () => {
  for (const body of effectBodies(commercialPlatform)) assert.doesNotMatch(body, /changePlan\(/);
  assert.match(commercialPlatform, /onClick=\{\(\) => changePlan\(displayPlan\.code\)\}/);
  assert.equal((commercialPlatform.match(/changePlan\(displayPlan\.code\)/g) || []).length, 1);
});
test("26: signup intent never reaches resolvePlanAction -- it cannot influence entitlement/action resolution", () => {
  assert.match(commercialPlatform, /resolvePlanAction\(\{ planCode: displayPlan\.code, currentPlanCode, hasActiveSubscription, checkoutEnabled, hasClientToken: Boolean\(clientToken\) \}\)/);
  assert.doesNotMatch(commercialPlatform, /resolvePlanAction\([^)]*(initialPlan|highlightedPlan)/);
});

// ---------------------------------------------------------------------------
// Task J: Professional Founding stays entirely server-side, uncoupled from intent.
// ---------------------------------------------------------------------------
test("27: Professional Founding eligibility/allocation logic is untouched and uncoupled from signup intent", () => {
  assert.doesNotMatch(foundingService, /intendedPlan|intendedBillingPeriod|searchParams/);
});
test("a stored intent of professional never implies Founding eligibility -- the offer is always fetched independently", () => {
  assert.match(commercialPlatform, /refreshFoundingAvailability\(workspaceId\)/);
  assert.doesNotMatch(commercialPlatform, /highlightedPlan[^\n]*founding/i);
});
