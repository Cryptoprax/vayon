import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const read = path => readFileSync(path, 'utf8');
const source = ts.transpileModule(read('features/vayon/billing/config/trial.ts'), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { trialState, workspaceTrialLimits } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
test('trial changes days at exact 24-hour boundaries and expires at 72 hours', () => {
  const start=Date.parse('2026-01-01T00:00:00Z'),end='2026-01-04T00:00:00Z';
  assert.deepEqual(trialState('trialing',end,start),{trial:true,expired:false,daysRemaining:3,day:1});
  assert.equal(trialState('trialing',end,start+86400000).day,2);
  assert.equal(trialState('trialing',end,start+2*86400000).day,3);
  assert.equal(trialState('trialing',end,start+3*86400000-1).expired,false);
  assert.equal(trialState('trialing',end,start+3*86400000).expired,true);
  assert.equal(trialState('trialing',end,start+4*86400000).daysRemaining,0);
});
test('paid subscriptions do not expire from an old trial timestamp; missing dates are not invented',()=>{
  assert.equal(trialState('active','2020-01-01').expired,false);
  assert.equal(trialState('trialing',null).daysRemaining,null);
  assert.equal(trialState('trialing','invalid').day,null);
  assert.deepEqual(workspaceTrialLimits,{properties:1,leads:2,companies:1,members:1});
});
test('new-workspace provisioning retains existing trial idempotency and grants',()=>{
  const sql=read('supabase/migrations/20261030000000_sprint233_workspace_trial.sql');
  assert.match(sql,/interval '3 days'/);
  assert.match(sql,/on conflict\(workspace_id\) do nothing/);
  assert.doesNotMatch(sql,/update subscriptions|delete from|grant .* authenticated/i);
  assert.match(sql,/revoke all on function public.provision_workspace_billing/);
});
test('billing authority checks the authenticated actor in the selected workspace',()=>{
  const context=read('features/vayon/billing/services/billing-context.ts');
  for(const check of ['.eq("user_id",user.id)','.eq("workspace_id",c.workspaceId)','.eq("organization_id",c.organizationId)','.eq("status","active")'])assert.ok(context.includes(check));
  const action=read('features/vayon/billing/actions/subscription-center.actions.ts');
  assert.match(action,/billingContext\("manage"\)/);
  assert.match(action,/version !== subscription.version/);
  assert.match(action,/subscription.seatQuantity/);
  assert.doesNotMatch(action,/form.get\("subscriptionId"\)/);
});
test('payment completion waits for authoritative subscription state and never enables a plan locally',()=>{
  const client=read('features/vayon/billing/components/CommercialPlatform.tsx');
  assert.match(client,/refreshSubscriptionState\(workspaceId\)/);
  assert.match(client,/current.status === "active"/);
  assert.match(client,/attempt < 10/);
  assert.doesNotMatch(client,/localStorage|location.assign|location.href/);
});
test('customer billing routes use one canonical subscription center',()=>{
  for(const route of ['subscription','plans','billing/provider-health'])assert.match(read(`app/vayon/settings/${route}/page.tsx`),/redirect\("\/vayon\/settings\/billing"\)/);
  const page=read('app/vayon/settings/billing/page.tsx');
  assert.doesNotMatch(page,/href="\/(pricing|contact)"|PaddlePortalButton|BillingRecoveryState|ProviderHealthGrid/);
  const search=read('features/vayon/universal-bar/providers/static-navigation.provider.ts');
  for(const term of ['billing','upgrade','subscription','plan','pricing','trial','payment'])assert.ok(search.includes(`"${term}"`));
});
