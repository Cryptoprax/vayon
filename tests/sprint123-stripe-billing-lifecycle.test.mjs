import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read=(path)=>readFileSync(path,"utf8");
const provider=read("features/vayon/billing/providers/stripe.provider.ts");
const service=read("features/vayon/billing/services/subscription.service.ts")+read("features/vayon/billing/services/stripe.service.ts");
const route=read("app/api/webhooks/stripe/route.ts");
const sql=read("supabase/migrations/20260921000000_sprint123_stripe_billing_lifecycle.sql");

test("Stripe checkout is server-side and accepts only catalog plans",()=>{assert.match(service,/isSubscriptionPlanCode/);assert.match(provider,/configuredPrice/);assert.match(provider,/STRIPE_SECRET_KEY/);assert.doesNotMatch(read("features/vayon/billing/actions/stripe.actions.ts"),/STRIPE_SECRET_KEY|monthlyUsd|monthlyPrice/)});
test("all required lifecycle webhooks are signed and supported",()=>{for(const event of ["checkout.session.completed","customer.subscription.created","customer.subscription.updated","customer.subscription.deleted","invoice.paid","invoice.payment_failed","invoice.finalized","customer.subscription.trial_will_end"])assert.match(provider+sql,new RegExp(event.replaceAll(".","\\.")));assert.match(provider,/constructEvent/);assert.match(route,/StripeWebhookSignatureError/);assert.match(route,/status:500/)});
test("webhook projection is idempotent tenant scoped and entitlement compatible",()=>{for(const value of ["on conflict(provider, provider_event_id) do nothing","organization_id","workspace_id","plan_id = coalesce","organization_limits","on conflict(workspace_id,metric)"])assert.match(sql,new RegExp(value.replace(/[()]/g,"\\$&"),"i"));assert.match(sql,/if not found then return/)});
test("subscription states and recovery transitions are complete",()=>{for(const state of ["trialing","active","past_due","paused","cancelled","expired"])assert.match(sql,new RegExp(`'${state}'`));assert.match(sql,/invoice\.payment_failed[\s\S]*status='past_due'/);assert.match(sql,/invoice\.paid[\s\S]*status='active'/)});
test("local state changes wait for Stripe webhook confirmation",()=>{const subscription=read("features/vayon/billing/services/subscription.service.ts");assert.doesNotMatch(subscription,/repo\.change\(|repo\.cancel\(|repo\.reactivate\(/);assert.match(provider,/cancel_at_period_end:true/);assert.match(provider,/cancel_at_period_end:false/)});
test("Business plan and Founder commercial KPIs are represented",()=>{assert.match(read("features/vayon/billing/validation/index.ts"),/planCodes/);const founder=read("features/platform/founder/services/founder.service.ts")+read("features/platform/founder/repositories/founder.repository.ts");for(const value of ["Monthly Recurring Revenue","Annual Recurring Revenue","Active Subscriptions","Trial Organizations","Failed Payments","revenueTrend"])assert.match(founder,new RegExp(value))});
