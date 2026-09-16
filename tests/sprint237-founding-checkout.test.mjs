import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, test } from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

let before;
beforeEach(()=>{before={...process.env}; for(const plan of ['STARTER','PROFESSIONAL','BUSINESS','BUSINESS_PLUS']) {
  process.env[`PADDLE_PRODUCT_${plan}`]=`pro_${plan.toLowerCase().replaceAll('_','')}`;
  process.env[`PADDLE_PRICE_${plan}_MONTHLY`]=`pri_${plan.toLowerCase().replaceAll('_','')}monthly`;
  process.env[`PADDLE_PRICE_${plan}_ANNUAL`]=`pri_${plan.toLowerCase().replaceAll('_','')}annual`;
}process.env.PADDLE_PRICE_PROFESSIONAL_FOUNDING_MONTHLY='pri_founding';});
afterEach(()=>{for(const k of Object.keys(process.env))if(!(k in before))delete process.env[k];Object.assign(process.env,before);});

function checkout({eligible=true,current=null,creationFails=false,patchFails=false}={}) {
  const calls=[];
  const catalog=load('features/vayon/billing/providers/paddle/paddle-catalog.ts');
  const {PaddleCheckoutService}=load('features/vayon/billing/services/paddle-checkout.service.ts',{
    '@/lib/observability/logger':{log(){}},
    '../providers/paddle/paddle.provider':{PaddleBillingProvider:class{async createCheckout(input){calls.push(['create',catalog.paddleCatalogEntry(input.planCode,input.billingPeriod).priceId,input]);if(creationFails)throw Error('transaction failed');return{url:'https://checkout.example/transaction',transactionId:'txn_test'};}}},
    '../repositories/subscription.repository':{SubscriptionRepository:class{async current(){return current;}}},
    './billing-context':{async billingContext(){return{client:{},organizationId:'organization',workspaceId:'workspace'};}},
    './paddle-catalog.service':{PaddleCatalogService:class{resolve(plan,period){return{plan,period,...catalog.paddleCatalogEntry(plan,period)};}}},
    './paddle-customer.service':{PaddleCustomerService:class{async getOrCreate(){return'ctm_test';}}},
    './founding-member.service':{FoundingMemberService:class{
      async assertCheckoutAllowed(id){calls.push(['validate',id]);}
      async reserve(input){calls.push(['reserve',input]);return eligible?{reservation_id:'reservation'}:null;}
      async applyPrice(){calls.push(['founding',catalog.foundingMonthlyPriceId()]);if(patchFails)throw Error('patch failed');}
      async cancelReservation(){calls.push(['cancel']);}
    }},
  });
  return {calls,run:(plan='professional',period='monthly')=>new PaddleCheckoutService().create(plan,period,1,'https://example.test')};
}
test('eligible Professional monthly starts standard, durably reserves, then selects founding',async()=>{
  const c=checkout();await c.run();assert.deepEqual(c.calls.map(c=>c[0]),['validate','create','reserve','founding']);
  assert.equal(c.calls[1][1],'pri_professionalmonthly');assert.equal(c.calls[3][1],'pri_founding');
  assert.equal(c.calls[2][1].organizationId,'organization');
});
for(const reason of ['ineligible','sold out'])test(`Professional monthly ${reason} retains the standard $149 mapping`,async()=>{
  const c=checkout({eligible:false});await c.run();assert.equal(c.calls.find(c=>c[0]==='create')[1],'pri_professionalmonthly');assert.equal(c.calls.some(c=>c[0]==='founding'),false);
});
test('Professional annual always uses its standard annual mapping and never reserves',async()=>{
  const c=checkout();await c.run('professional','annual');assert.equal(c.calls.find(c=>c[0]==='create')[1],'pri_professionalannual');assert.equal(c.calls.some(c=>c[0]==='reserve'),false);
});
for(const plan of ['starter','business','business_plus'])test(`${plan} monthly and annual mappings are unchanged`,async()=>{
  for(const period of ['monthly','annual']){const c=checkout();await c.run(plan,period);assert.equal(c.calls[0][1],`pri_${plan.replaceAll('_','')}${period}`);assert.equal(c.calls.length,1);}
});
test('missing founding configuration retains standard checkout and consumes no slot',async()=>{
  delete process.env.PADDLE_PRICE_PROFESSIONAL_FOUNDING_MONTHLY;
  const c=checkout();await c.run();assert.equal(c.calls.some(c=>c[0]==='reserve'),false);assert.equal(c.calls.find(c=>c[0]==='create')[1],'pri_professionalmonthly');
});
test('invalid or identical founding mapping is treated as unavailable',()=>{
  const catalog=load('features/vayon/billing/providers/paddle/paddle-catalog.ts');
  for(const value of ['bad',process.env.PADDLE_PRICE_PROFESSIONAL_MONTHLY]){process.env.PADDLE_PRICE_PROFESSIONAL_FOUNDING_MONTHLY=value;assert.equal(catalog.foundingMonthlyPriceId(),null);}
});
test('existing paid Professional checkout is refused without migration or allocation',async()=>{
  const c=checkout({current:{providerSubscriptionId:'sub_paid',status:'active'}});await assert.rejects(c.run(),/existing subscription/);assert.equal(c.calls.length,0);
});
test('failed transaction creation never reaches allocation',async()=>{
  const c=checkout({creationFails:true});await assert.rejects(c.run(),/transaction failed/);assert.equal(c.calls.some(c=>c[0]==='reserve'),false);
});
test('ambiguous price PATCH failure cancels the tracked reservation before returning error',async()=>{
  const c=checkout({patchFails:true});await assert.rejects(c.run(),/patch failed/);assert.equal(c.calls.at(-1)[0],'cancel');
});

function route() {
  let creations=0;
  const {POST}=load('app/api/billing/paddle/checkout/route.ts',{
    'next/server':{NextResponse:{json:(value,init)=>Response.json(value,init)}},
    '@/lib/observability/logger':{log(){},logError(){}},
    '@/features/vayon/billing/services/paddle-checkout.service':{PaddleCheckoutService:class{async create(){creations++;return{url:'https://checkout.example',transactionId:'txn_test',correlationId:'correlation'};}}},
  });
  return{POST,creations:()=>creations};
}
for(const input of [{founding:true},{promo:true},{priceId:'pri_founding'},{discount:70},{slot:20}])test(`browser cannot submit ${Object.keys(input)[0]}`,async()=>{
  const r=route();const result=await r.POST(new Request('https://example.test/api',{method:'POST',body:JSON.stringify({planCode:'professional',billingPeriod:'monthly',seatQuantity:1,...input})}));
  assert.equal(result.status,400);assert.equal(r.creations(),0);
});
test('malformed null request returns sanitized JSON instead of throwing in error handler',async()=>{
  const r=route();const result=await r.POST(new Request('https://example.test/api',{method:'POST',body:'null'}));assert.equal(result.status,400);
});
test('checkout response carries no price IDs, allocation records, or server credentials',async()=>{
  const r=route();const result=await r.POST(new Request('https://example.test/api',{method:'POST',body:JSON.stringify({planCode:'professional',billingPeriod:'monthly'})}));
  assert.equal(result.status,200);assert.doesNotMatch(await result.text(),/pri_|priceId|reservation|secret|token|apiKey/i);
});
test('founding price resolution remains Professional monthly without changing standard mapping',()=>{
  const catalog=load('features/vayon/billing/providers/paddle/paddle-catalog.ts');
  assert.deepEqual(catalog.planForPaddlePrice('pri_founding'),{plan:'professional',period:'monthly'});
  assert.equal(catalog.paddleCatalogEntry('professional','monthly').priceId,'pri_professionalmonthly');
});
test('public and authenticated display defaults to $149; only server availability enables $79',()=>{
  const {commercialPricingPlans,commercialDisplayPrice}=load('features/platform/commercial-pricing.ts');
  const plan=commercialPricingPlans.find(p=>p.code==='professional');
  assert.equal(commercialDisplayPrice(plan,'monthly').price,149);assert.equal(commercialDisplayPrice(plan,'monthly',false).promotional,false);
  assert.equal(commercialDisplayPrice(plan,'monthly',true).price,79);assert.equal(commercialDisplayPrice(plan,'annual',true).price,119.2);
  assert.equal(Number((commercialDisplayPrice(plan,'annual',true).price*12).toFixed(2)),1430.4);
});
test('all public founding claims are gated by server global availability',()=>{
  const read=p=>readFileSync(p,'utf8');
  assert.match(read('features/marketing/components/FoundingOffer.tsx'),/if \(!available\) return null/);
  assert.match(read('features/marketing/components/PricingTable.tsx'),/commercialDisplayPrice\(plan, annual \? "annual" : "monthly", available\)/);
  assert.doesNotMatch(read('features/marketing/components/Homepage.tsx'),/FOUNDING_MEMBER_ENABLED/);
  assert.match(read('features/vayon/billing/components/CommercialPlatform.tsx'),/offer\.eligible \|\| offer\.applicable/);
});
test('public availability response contains no organization data and is not cached',async()=>{
  const {GET}=load('app/api/billing/paddle/founding/availability/route.ts',{
    'next/server':{NextResponse:{json:(v,i)=>Response.json(v,i)}},
    '@/features/vayon/billing/services/founding-member.service':{async foundingAvailability(){return{eligible:false,remaining:0,organizationId:'private'};}},
  });
  const result=await GET();assert.deepEqual(await result.json(),{available:false});assert.equal(result.headers.get('cache-control'),'no-store');
});
test('Paddle signature verification rejects bad signatures and expired replay before allocation processing',async()=>{
  process.env.PADDLE_WEBHOOK_SECRET='test-secret';
  const {PaddleBillingProvider}=load('features/vayon/billing/providers/paddle/paddle.provider.ts');
  const provider=new PaddleBillingProvider();const payload=JSON.stringify({event_id:'evt_test',event_type:'transaction.completed',data:{id:'txn_test'}});
  const timestamp=Math.floor(Date.now()/1000);const signature=createHmac('sha256','test-secret').update(`${timestamp}:${payload}`).digest('hex');
  assert.equal((await provider.verifyWebhook(payload,`ts=${timestamp};h1=${signature}`)).eventId,'evt_test');
  await assert.rejects(provider.verifyWebhook(payload,`ts=${timestamp};h1=bad`),/signature/);
  await assert.rejects(provider.verifyWebhook(payload,`ts=${timestamp-1000};h1=${signature}`),/expired/);
});
test('reconciler requires its server-only cron secret',async()=>{
  process.env.CRON_SECRET='test-cron';let ran=false;
  const {GET}=load('app/api/billing/paddle/founding/reconcile/route.ts',{
    'next/server':{NextResponse:{json:(v,i)=>Response.json(v,i)}},
    '@/features/vayon/billing/services/founding-member.service':{FoundingMemberService:class{async reconcile(){ran=true;}}},
  });
  assert.equal((await GET(new Request('https://example.test'))).status,401);assert.equal(ran,false);
  assert.equal((await GET(new Request('https://example.test',{headers:{authorization:'Bearer test-cron'}}))).status,200);assert.equal(ran,true);
});
test('catalog identifiers are removed before billing page props cross to client components',()=>{
  const page=readFileSync('app/vayon/settings/billing/page.tsx','utf8');
  assert.doesNotMatch(page,/catalog=\{snapshot\.catalog\}/);assert.match(page,/catalog=\{publicCatalog\}/);
  assert.match(readFileSync('features/vayon/billing/providers/paddle/paddle-catalog.ts','utf8'),/^import "server-only"/);
});
test('updating the same Professional monthly subscription preserves its founding price',async()=>{
  let body;
  const {PaddleBillingProvider}=load('features/vayon/billing/providers/paddle/paddle.provider.ts',{
    './paddle-client':{async paddleRequest(_p,init){body=JSON.parse(init.body);}},
    '../../services/founding-member.service':{FoundingMemberService:class{async withSubscriptionMutation(_id,operation){return operation({status:'confirmed',successful_periods:4,standard_price_id:'pri_standard',founding_price_id:'pri_founding'});}}},
  });
  await new PaddleBillingProvider().changeSubscription({subscriptionId:'sub_test',planCode:'professional',priceId:'pri_standard',quantity:2});
  assert.deepEqual(body.items,[{price_id:'pri_founding',quantity:2}]);
});
test('resuming a subscription first completes any pending founding transition',async()=>{
  const calls=[];
  const {PaddleBillingProvider}=load('features/vayon/billing/providers/paddle/paddle.provider.ts',{
    './paddle-client':{async paddleRequest(_p,init){calls.push(init?'resume':'read');return{status:'paused'};}},
    '../../services/founding-member.service':{FoundingMemberService:class{async prepareResume(){calls.push('transition');}}},
  });
  await new PaddleBillingProvider().reactivateSubscription('sub_test');assert.deepEqual(calls,['transition','read','resume']);
});
