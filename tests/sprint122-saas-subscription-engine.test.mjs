import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read=(path)=>readFileSync(path,"utf8");
const catalog=read("features/vayon/billing/config/entitlements.ts");
const policy=read("features/vayon/billing/services/entitlement-policy.ts");
const service=read("features/vayon/billing/services/entitlement.service.ts");
const gate=read("features/vayon/billing/components/EntitlementGate.tsx");

test("one typed catalog defines all commercial plans, features, and quotas",()=>{
  for(const plan of ["starter","professional","business","enterprise"])assert.match(catalog,new RegExp(`${plan}: \\{`));
  for(const quota of ["workspaces","users","storage_gb","ai_requests","exports","reports","workflows","automations","integrations","knowledge_articles","creative_assets","api_calls"])assert.match(catalog,new RegExp(`"${quota}"|${quota}:`));
  assert.match(catalog,/starter:[\s\S]*users: 3/); assert.match(catalog,/professional:[\s\S]*users: 10/); assert.match(catalog,/business:[\s\S]*users: 50/); assert.match(catalog,/enterprise:[\s\S]*users: null/);
});
test("policy supports lifecycle and quota states without scattered plan checks",()=>{
  for(const state of ["enabled","disabled","limited","quota","expiration","trial"])assert.match(policy,new RegExp(`"${state}"`));
  assert.match(policy,/subscriptionEntitlementCatalog\[context\.plan\]/);
  assert.match(policy,/Founder accounts are exempt/);
});
test("server authority is workspace and organization scoped with trusted founder bypass",()=>{
  for(const value of ["organization_id","workspace_id","deleted_at","isFounder","app_metadata"])assert.match(service+read("features/platform/founder/services/founder-context.ts"),new RegExp(value));
  assert.doesNotMatch(service,/user_metadata/);
  assert.match(service,/SubscriptionEntitlementError/);
});
test("upgrade experience explains and compares plans",()=>{
  for(const value of ["Upgrade to continue","Current plan","Recommended plan","Compare plans","<Dialog"])assert.match(gate,new RegExp(value));
});
test("existing marketing licensing uses the central entitlement authority",()=>{
  const access=read("features/vayon/creative-studio/access.service.ts");
  const adapter=read("features/vayon/billing/services/feature-licensing.service.ts");
  assert.match(access,/FeatureLicensingService/); assert.match(access,/licensed\("marketing_studio"\)/);
  assert.match(adapter,/SubscriptionEntitlementService/); assert.match(adapter,/feature\(mapped\)/);
});
test("legacy usage metering delegates catalog quotas to the central authority",()=>{
  const limits=read("features/vayon/billing/services/subscription-limit.service.ts");
  assert.match(limits,/centralizedMetrics/); assert.match(limits,/SubscriptionEntitlementService/); assert.match(limits,/\.quota\(quota,result\.usage,increment\)/);
});
