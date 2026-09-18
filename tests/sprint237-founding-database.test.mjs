import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { before, after, beforeEach, describe, test } from "node:test";
import { foundingDatabase, databaseClient } from "./helpers/sprint237-database.mjs";
import { load } from "./helpers/sprint237-load.mjs";

describe("Sprint 237 real PostgreSQL allocation and payment lifecycle", { skip: !process.env.SPRINT237_POSTGRES_PORT }, () => {
  let db;
  before(async () => { db = await foundingDatabase(); });
  after(async () => { if (db) await db.close(); });
  beforeEach(async () => { await db.reset(); });
  async function organization() {
    const org = randomUUID(), workspace = randomUUID(), customer = `ctm_${randomUUID()}`;
    await db.pool.query("insert into organizations values($1)",[org]);
    await db.pool.query("insert into workspaces values($1,$2)",[workspace,org]);
    await db.pool.query("insert into billing_customers values($1,$2,'paddle',$3)",[org,workspace,customer]);
    await db.pool.query("insert into subscriptions(organization_id,workspace_id) values($1,$2)",[org,workspace]);
    return { org, workspace, customer, transaction: `txn_${randomUUID()}`, subscription: `sub_${randomUUID().replaceAll('-', '').slice(0,26)}` };
  }
  async function reserve(o, connection = db.pool) {
    return (await connection.query("select reserve_professional_founding($1,$2,$3,$4,'pri_founding','pri_standard') a",[o.org,o.workspace,o.customer,o.transaction])).rows[0].a;
  }
  async function eligibility(o) { return (await db.pool.query("select professional_founding_eligibility($1) a",[o?.org??null])).rows[0].a; }
  const record = p => db.pool.query("select record_professional_founding_payment($1) a",[p]).then(r=>r.rows[0].a);
  function payment(o, month = 0, changes = {}) {
    return { id: month === 0 ? o.transaction : `txn_${o.org}_${month}`, status: "completed", customer_id: o.customer, subscription_id: o.subscription,
      origin: month === 0 ? "api" : "subscription_recurring", custom_data: { organization_id: o.org, workspace_id: o.workspace, plan_code: "professional" },
      billing_period: { starts_at: new Date(Date.UTC(2026,month,1)).toISOString(), ends_at: new Date(Date.UTC(2026,month+1,1)).toISOString() },
      items: [{ price: { id: "pri_founding", billing_cycle: { interval: "month", frequency: 1 } }, quantity: 1, proration: null }],
      details: { line_items: [{ price_id: "pri_founding", totals: { total: "7900" }, proration: null }] }, ...changes };
  }
  function service(request) {
    const { FoundingMemberService } = load("features/vayon/billing/services/founding-member.service.ts", {
      "@/lib/observability/logger": { log(){} },
      "./paddle-subscription-sync.service": { PaddleSubscriptionSyncService: class { async project() {} } },
    });
    return new FoundingMemberService(databaseClient(db.pool), request);
  }
  function subscription(o, changes = {}) {
    return { id:o.subscription, customer_id:o.customer, status:'active', updated_at:'2026-09-17T17:00:00Z',
      custom_data:{organization_id:o.org,workspace_id:o.workspace,plan_code:'professional'},
      current_billing_period:{starts_at:'2026-09-17T16:00:00Z',ends_at:'2026-10-17T16:00:00Z'},
      items:[{price:{id:'pri_founding'},quantity:1}], ...changes };
  }
  const project = (payload, event = randomUUID()) => db.pool.query(
    "select process_paddle_billing_event($1,'subscription.updated',$2)", [event,payload]);
  async function assertProjected(o) {
    const s=(await db.pool.query('select s.*,p.code from subscriptions s join subscription_plans p on p.id=s.plan_id where s.workspace_id=$1',[o.workspace])).rows[0];
    assert.equal(s.code,'professional'); assert.equal(s.status,'active'); assert.equal(s.provider,'paddle');
    assert.equal(s.provider_customer_id,o.customer); assert.equal(s.provider_subscription_id,o.subscription);
    assert.equal(s.current_period_ends_at.toISOString(),'2026-10-17T16:00:00.000Z'); assert.equal(s.cancel_at_period_end,false);
    const items=(await db.pool.query('select * from subscription_items where workspace_id=$1',[o.workspace])).rows;
    assert.equal(items.length,1); assert.equal(items[0].provider_item_id,`paddle:${o.subscription}:pri_founding`);
    assert.equal((await db.pool.query('select count(*) n from paddle_subscription_projection_versions where workspace_id=$1',[o.workspace])).rows[0].n,'1');
  }
  test('production NOT NULL item identity and Paddle-shaped projection are compatible', async()=>{
    const o=await organization(); await reserve(o); await record(payment(o));
    const column=(await db.owner.query("select is_nullable from information_schema.columns where table_schema='public' and table_name='subscription_items' and column_name='provider_item_id'")).rows[0];
    assert.equal(column.is_nullable,'NO');
    const payload=subscription(o); assert.equal(Object.hasOwn(payload.items[0],'id'),false);
    await project(payload); await assertProjected(o);
  });
  test('same and newer snapshots retain deterministic identity without duplicating payment or subscription', async()=>{
    const o=await organization(); await reserve(o); await record(payment(o));
    await project(subscription(o),'evt_repeat'); await project(subscription(o),'evt_repeat');
    await project(subscription(o,{updated_at:'2026-09-17T18:00:00Z'})); await assertProjected(o);
    assert.equal((await eligibility(o)).successfulPeriods,1);
    assert.equal((await db.pool.query('select count(*) n from subscriptions where workspace_id=$1',[o.workspace])).rows[0].n,'1');
  });
  test('different subscriptions sharing a price never collide', async()=>{
    const a=await organization(),b=await organization();
    await project(subscription(a)); await project(subscription(b));
    const keys=(await db.pool.query('select provider_item_id from subscription_items')).rows.map(r=>r.provider_item_id);
    assert.equal(keys.length,2); assert.equal(new Set(keys).size,2);
  });
  for(const [name,changes] of [
    ['missing price',{items:[{price:{},quantity:1}]}],
    ['null price',{items:[{price:{id:null},quantity:1}]}],
    ['empty price',{items:[{price:{id:''},quantity:1}]}],
    ['malformed price',{items:[{price:{id:'pri_invalid:component'},quantity:1}]}],
    ['missing subscription',{id:undefined}], ['null subscription',{id:null}],
    ['empty subscription',{id:''}], ['malformed subscription',{id:'sub_invalid:component'}],
  ]) test(`${name} fails atomically through the public projection RPC`,async()=>{
    const o=await organization(); const before=(await db.pool.query('select * from subscriptions where workspace_id=$1',[o.workspace])).rows[0];
    await assert.rejects(project(subscription(o,changes)),e=>e.code==='22023');
    assert.deepEqual((await db.pool.query('select * from subscriptions where workspace_id=$1',[o.workspace])).rows[0],before);
    for(const table of ['subscription_items','billing_events','paddle_subscription_projection_versions'])
      assert.equal((await db.pool.query(`select count(*) n from ${table} where workspace_id=$1`,[o.workspace])).rows[0].n,'0');
  });
  function realProjectionMocks(request) {
    return { '@/lib/observability/logger':{log(){}},
      '@/lib/supabase/service':{createSupabaseServiceClient:()=>databaseClient(db.pool)},
      '../providers/paddle/paddle-client':{paddleRequest:request} };
  }
  test('confirmed first payment recovers through real subscription sync and RPC without invoice projection',async()=>{
    const o=await organization(); await reserve(o); await record(payment(o)); const calls=[];
    const request=async(path,init)=>{assert.equal(init,undefined); calls.push(path); return path.startsWith('/transactions?')?[payment(o)]:subscription(o);};
    const {FoundingMemberService}=load('features/vayon/billing/services/founding-member.service.ts',realProjectionMocks(request));
    await new FoundingMemberService().reconcile(); await assertProjected(o);
    assert.equal(calls.length,3); assert.equal((await eligibility(o)).successfulPeriods,1);
    assert.equal((await db.pool.query('select count(*) n from invoices')).rows[0].n,'0');
  });
  test('verified subscription.updated webhook reaches real corrected projection',async()=>{
    const o=await organization(); await reserve(o); await record(payment(o));
    const mocks=realProjectionMocks(async()=>subscription(o));
    mocks['../providers/paddle/paddle.provider']={PaddleBillingProvider:class{async verifyWebhook(){return{eventId:'evt_projection',type:'subscription.updated',data:subscription(o)};}}};
    const {PaddleWebhookService}=load('features/vayon/billing/services/paddle-webhook.service.ts',mocks);
    await new PaddleWebhookService().process('test-only','test-only'); await assertProjected(o);
    assert.equal((await eligibility(o)).successfulPeriods,1);
  });
  test('migration rerun preserves public RPC access and private core restrictions',async()=>{
    await db.owner.query(readFileSync('supabase/migrations/20261031010000_fix_paddle_subscription_item_projection.sql','utf8'));
    for(const role of ['anon','authenticated','service_role']) {
      const result=(await db.owner.query("select has_function_privilege($1,'public.process_paddle_billing_event_core237(text,text,jsonb)','EXECUTE') allowed",[role])).rows[0];
      assert.equal(result.allowed,false);
    }
    assert.equal((await db.owner.query("select has_function_privilege('service_role','public.process_paddle_billing_event(text,text,jsonb)','EXECUTE') allowed")).rows[0].allowed,true);
    // Replaying this older migration reverts core237 to its pre-fix invoice ON CONFLICT
    // clause; reapply the current migration so later tests run against the latest state,
    // exactly as Production's ordered migration history would leave it.
    await db.owner.query(readFileSync('supabase/migrations/20261101000000_fix_billing_invoice_provider_conflict_target.sql','utf8'));
    const o=await organization(); await project(subscription(o)); await assertProjected(o);
  });
  test("viewing global and organization eligibility allocates nothing", async () => {
    const o = await organization();
    assert.equal((await eligibility(o)).eligible,true); assert.equal((await eligibility()).remaining,20);
    assert.equal((await db.pool.query("select count(*) n from professional_founding_allocations")).rows[0].n,"0");
  });
  test("20 organizations confirm exactly 20 slots; slot 21 is unavailable", async () => {
    for(let i=0;i<20;i++) { const o=await organization(); assert.equal((await reserve(o)).slot,i+1); await record(payment(o)); }
    assert.equal(await reserve(await organization()),null);
    assert.equal((await eligibility()).remaining,0);
    assert.equal((await db.pool.query("select count(*) n from professional_founding_allocations where confirmed_at is not null")).rows[0].n,"20");
  });
  test("two independent transactions competing for slot 20 are serialized", async () => {
    for(let i=0;i<19;i++) await reserve(await organization());
    const a=await organization(),b=await organization();
    const first=await db.pool.connect(),second=await db.pool.connect();
    try {
      await first.query("begin"); assert.equal((await reserve(a,first)).slot,20);
      let finished=false; const pending=reserve(b,second).then(value=>{finished=true;return value;});
      await new Promise(r=>setTimeout(r,50)); assert.equal(finished,false,"second connection waits for the allocation lock");
      await first.query("commit"); assert.equal(await pending,null);
    } finally { await first.query("rollback"); first.release(); second.release(); }
  });
  test("same organization across workspaces cannot reserve twice", async () => {
    const o=await organization(); await reserve(o);
    const workspace=randomUUID(); await db.pool.query("insert into workspaces values($1,$2)",[workspace,o.org]);
    await assert.rejects(reserve({...o,transaction:'txn_duplicate'}),/already reserved/);
    await record(payment(o)); assert.equal(await reserve({...o,transaction:'txn_again'}),null);
    assert.equal((await eligibility()).remaining,19);
  });
  test("direct SQL cannot create slot 21 or duplicate a slot", async () => {
    const a=await organization(),b=await organization();await reserve(a);await reserve(b);
    await assert.rejects(db.pool.query("update professional_founding_allocations set slot=21 where organization_id=$1",[a.org]),/check constraint/);
    await assert.rejects(db.pool.query("update professional_founding_allocations set slot=1 where organization_id=$1",[b.org]),/unique constraint/);
  });
  test("authenticated and anonymous callers cannot access allocations or call reservation RPC", async () => {
    for(const role of ['anon','authenticated']) {
      await db.owner.query(`set role ${role}`);
      try {
        await assert.rejects(db.owner.query("select * from professional_founding_allocations"),/permission denied/);
        await assert.rejects(db.owner.query("select professional_founding_eligibility(null)"),/permission denied/);
      } finally { await db.owner.query("reset role"); }
    }
  });
  test("reservation time alone never frees a still-payable checkout", async () => {
    const o=await organization();await reserve(o);
    await db.pool.query("update professional_founding_allocations set reserved_until=now()-interval '1 hour'");
    assert.equal((await eligibility()).remaining,19);
    assert.equal((await eligibility(o)).status,'reserved');
  });
  test("abandoned checkout is canceled before its slot can be reused", async () => {
    const o=await organization(),a=await reserve(o);let canceled=false;
    await service(async (_path,init)=>{if(init){assert.deepEqual(JSON.parse(init.body),{status:'canceled'});canceled=true;}return {id:o.transaction,status:canceled?'canceled':'ready'};}).cancelReservation(a);
    assert.equal((await eligibility()).remaining,20);assert.equal((await eligibility(o)).status,'expired');
    assert.equal((await reserve(o)).slot,1);
  });
  test("cancellation API failure retains the reservation for deterministic retry", async () => {
    const o=await organization(),a=await reserve(o);
    await assert.rejects(service(async (_p,init)=>{if(init)throw Error('timeout');return {status:'ready'};}).cancelReservation(a));
    assert.equal((await eligibility()).remaining,19);
  });
  test("immutable completed standard-price checkout releases its unused founding reservation", async () => {
    const o=await organization(),a=await reserve(o);
    await service(async()=>payment(o,0,{items:[{price:{id:'pri_standard'}}]})).cancelReservation(a);
    assert.equal((await eligibility()).remaining,20);
  });
  test("payment winning an expiration race confirms instead of releasing", async () => {
    const o=await organization(),a=await reserve(o);
    await service(async ()=>payment(o)).cancelReservation(a);
    assert.equal((await eligibility(o)).status,'confirmed'); assert.equal((await eligibility()).remaining,19);
  });
  test("paid-but-processing transaction retains its reserved slot", async () => {
    const o=await organization(),a=await reserve(o);
    await service(async ()=>({status:'paid'})).cancelReservation(a);
    assert.equal((await eligibility(o)).status,'reserved');
  });
  test("verified completed payment confirms; duplicate events and transaction IDs count once", async () => {
    const o=await organization();await reserve(o);
    const results=await Promise.all(Array.from({length:8},()=>record(payment(o))));
    assert.ok(results.every(a=>a.successful_periods===1));
    await record(payment(o,0,{id:'txn_same_period'}));
    assert.equal((await eligibility(o)).successfulPeriods,1);
  });
  test("failed payment, past due, wrong price, wrong customer and proration never confirm", async () => {
    const o=await organization();await reserve(o);
    for(const changes of [{status:'past_due'},{status:'paid'},{status:'ready'},{customer_id:'ctm_other'},{items:[{price:{id:'pri_standard'}}]},
      {origin:'subscription_charge'},{items:[{price:{id:'pri_founding',billing_cycle:{interval:'month',frequency:1}},proration:{rate:'0.5'}}]}]) {
      assert.equal(await record(payment(o,0,changes)),null);
    }
    assert.equal((await eligibility(o)).status,'reserved');
  });
  test("payment without a Paddle billing boundary fails closed", async () => {
    const o=await organization();await reserve(o);
    await assert.rejects(record(payment(o,0,{billing_period:null})),/authoritative founding billing period/);
    assert.equal((await eligibility(o)).status,'reserved');
  });
  test("12 successful periods, delivered out of order, produce the authoritative end boundary", async () => {
    const o=await organization();await reserve(o);await record(payment(o));
    for(const m of [11,4,3,2,1,10,9,8,7,6,5])await record(payment(o,m));
    const state=await eligibility(o);assert.equal(state.successfulPeriods,12);assert.equal(state.status,'transition_pending');
    assert.equal(Date.parse(state.promotionalEnd),Date.UTC(2027,0,1));
    assert.equal((await record(payment(o,11))).successful_periods,12);
  });
  test("pause/failed collection does not advance clock; full paid resume period counts", async () => {
    const o=await organization();await reserve(o);await record(payment(o));
    assert.equal(await record(payment(o,1,{status:'past_due'})),null);
    const resumed=payment(o,2,{origin:'subscription_update'});await record(resumed);
    assert.equal((await eligibility(o)).successfulPeriods,2);
  });
  test("existing paid Professional and canceled paid subscribers cannot newly claim founding", async () => {
    const o=await organization();
    await db.pool.query("update subscriptions set provider_subscription_id=$1,status='active' where organization_id=$2",[o.subscription,o.org]);
    assert.equal(await reserve(o),null);
    await db.pool.query("update subscriptions set status='cancelled' where organization_id=$1",[o.org]);
    assert.equal(await reserve(o),null);
  });
  test("cancellation consumes no new allocation and never releases a confirmed slot", async () => {
    const o=await organization(),a=await reserve(o);await record(payment(o));
    await db.pool.query("update professional_founding_allocations set status='ended' where organization_id=$1",[o.org]);
    await db.pool.query("select release_professional_founding($1,$2)",[a.reservation_id,o.transaction]);
    assert.equal(await reserve({...o,transaction:'txn_new'}),null); assert.equal((await eligibility()).remaining,19);
  });
  test("transition uses do_not_bill, preserves all quantities, and is retry-idempotent", async () => {
    const o=await organization();await reserve(o);let a;
    for(let m=0;m<12;m++)a=await record(payment(o,m));
    let patches=0,current={id:o.subscription,status:'active',customer_id:o.customer,items:[{price:{id:'pri_founding'},quantity:3},{price:{id:'pri_addon'},quantity:2}]};
    const worker=service(async(_p,init)=>{if(init){patches++;const body=JSON.parse(init.body);assert.equal(body.proration_billing_mode,'do_not_bill');assert.deepEqual(body.items,[{price_id:'pri_standard',quantity:3},{price_id:'pri_addon',quantity:2}]);assert.equal('next_billed_at' in body,false);current={...current,items:body.items.map(i=>({price:{id:i.price_id},quantity:i.quantity}))};}return current;});
    await worker.transition(a);await worker.transition(a);assert.equal(patches,1);assert.equal((await eligibility(o)).status,'transitioned');
  });
  test("failed transition stays pending and succeeds on retry without another payment", async () => {
    const o=await organization();await reserve(o);let a;for(let m=0;m<12;m++)a=await record(payment(o,m));
    const current={id:o.subscription,status:'active',customer_id:o.customer,items:[{price:{id:'pri_founding'},quantity:1}]};
    await assert.rejects(service(async(_p,init)=>{if(init)throw Error('timeout');return current;}).transition(a));
    assert.equal((await eligibility(o)).status,'transition_pending');
    await service(async()=>current).transition(a);assert.equal((await eligibility(o)).status,'transitioned');
  });
  test("renewal webhook without custom_data uses the durable subscription binding", async () => {
    const o=await organization();await reserve(o);await record(payment(o));
    await service(async()=>payment(o,1,{custom_data:null})).webhook('transaction.completed',{id:'txn_renewal'});
    assert.equal((await eligibility(o)).successfulPeriods,2);
  });
  test("subscription activation before payment confirmation cannot grant paid access", async () => {
    const o=await organization(),a=await reserve(o);
    const sub={id:o.subscription,status:'active',customer_id:o.customer,items:[{price:{id:'pri_founding'}}],custom_data:{founding_reservation:a.reservation_id}};
    await assert.rejects(service(async(path)=>path.startsWith('/subscriptions/')?sub:{...payment(o),status:'paid'}).webhook('subscription.activated',sub),/confirmation pending/);
  });
  test("unallocated browser-forced founding transaction is rejected", async () => {
    process.env.PADDLE_PRICE_PROFESSIONAL_FOUNDING_MONTHLY='pri_founding';
    try {const o=await organization();await assert.rejects(service(async()=>payment(o)).webhook('transaction.completed',payment(o)),/Unallocated/);}
    finally {delete process.env.PADDLE_PRICE_PROFESSIONAL_FOUNDING_MONTHLY;}
  });
  test("stale subscription events and delayed completed payments cannot revive cancellation", async () => {
    const o=await organization();
    const payload={id:o.subscription,customer_id:o.customer,status:'canceled',updated_at:'2026-02-01T00:00:00Z',custom_data:{workspace_id:o.workspace,organization_id:o.org,plan_code:'professional'},items:[]};
    await db.pool.query("select process_paddle_billing_event('evt_new','subscription.canceled',$1)",[payload]);
    await db.pool.query("select process_paddle_billing_event('evt_old','subscription.activated',$1)",[{...payload,status:'active',updated_at:'2026-01-01T00:00:00Z'}]);
    await db.pool.query("select process_paddle_billing_event('evt_paid','transaction.completed',$1)",[payment(o)]);
    assert.equal((await db.pool.query("select status from subscriptions where organization_id=$1",[o.org])).rows[0].status,'cancelled');
  });
  test("confirmed founding slots remain owned even when all 20 spots are exhausted", async () => {
    const first=await organization();await reserve(first);await record(payment(first));
    for(let i=1;i<20;i++)await reserve(await organization());
    const state=await eligibility(first);assert.equal(state.remaining,0);assert.equal(state.ownsAllocation,true);assert.equal(state.applicable,true);assert.equal(state.eligible,false);
  });
  test("mutation lease prevents a plan update from racing the renewal price transition", async () => {
    const o=await organization();await reserve(o);await record(payment(o));
    const locked=(await db.pool.query("select lock_professional_founding_subscription($1) a",[o.subscription])).rows[0].a;
    await assert.rejects(db.pool.query("select lock_professional_founding_subscription($1)",[o.subscription]),/mutation in progress/);
    await db.pool.query("select unlock_professional_founding_subscription($1,$2)",[locked.reservation_id,randomUUID()]);
    await assert.rejects(db.pool.query("select lock_professional_founding_subscription($1)",[o.subscription]),/mutation in progress/);
    await db.pool.query("select unlock_professional_founding_subscription($1,$2)",[locked.reservation_id,locked.mutation_token]);
    assert.ok((await db.pool.query("select lock_professional_founding_subscription($1) a",[o.subscription])).rows[0].a.mutation_token);
  });
  test("scheduled reconciliation recovers a missed twelfth payment and retries expired checkouts", async () => {
    const o=await organization();await reserve(o);for(let m=0;m<11;m++)await record(payment(o,m));
    const abandoned=await organization();await reserve(abandoned);
    await db.pool.query("update professional_founding_allocations set reserved_until=now()-interval '1 hour' where organization_id=$1",[abandoned.org]);
    let patched=false,canceled=false;
    await service(async(path,init)=>{
      if(path.startsWith('/transactions?')){assert.match(path,/per_page=30/);return[payment(o,11)];}
      if(path.includes(abandoned.transaction)){if(init)canceled=true;return {status:canceled?'canceled':'ready'};}
      if(init)patched=true;
      return{id:o.subscription,status:'active',customer_id:o.customer,items:[{price:{id:patched?'pri_standard':'pri_founding'},quantity:1}],updated_at:'2026-12-01T00:00:00Z'};
    }).reconcile();
    assert.equal((await eligibility(o)).status,'transitioned');assert.equal((await eligibility(abandoned)).status,'expired');assert.equal(patched,true);assert.equal(canceled,true);
  });
  test("checkout custom data and discounted price come only from the persisted reservation", async () => {
    const o=await organization(),a=await reserve(o);let body;
    await service(async(_path,init)=>{body=JSON.parse(init.body);return{};}).applyPrice(a,1);
    assert.equal(body.items[0].price_id,'pri_founding');assert.equal(body.custom_data.organization_id,o.org);
    assert.equal(body.custom_data.founding_reservation,a.reservation_id);assert.equal(body.custom_data.founding_offer,true);
  });
  test("missing worker authentication disables new promotional reservations without hiding existing owners", async () => {
    const o=await organization();await reserve(o);await record(payment(o));
    const previous=process.env.CRON_SECRET;delete process.env.CRON_SECRET;
    try {const worker=service(async()=>({}));assert.equal((await worker.availability(o.org)).eligible,false);assert.equal((await worker.availability(o.org)).applicable,true);assert.equal(await worker.reserve({}),null);}
    finally {if(previous)process.env.CRON_SECRET=previous;}
  });
  test("VAYON3DAY cannot overwrite paused or past-due confirmed founding billing", async () => {
    await db.owner.query(`create schema auth;create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated;
      create table user_organization_context(user_id uuid,organization_id uuid,workspace_id uuid);
      create function current_workspace_role(uuid) returns text language sql as $$select 'organization_owner'::text$$;
      alter table subscriptions add column trial_ends_at timestamptz,add column updated_by uuid;`);
    await db.owner.query(readFileSync('supabase/migrations/20261030030000_sprint236_vayon3day_redemption.sql','utf8'));
    const o=await organization();await reserve(o);await record(payment(o));const user=randomUUID();
    await db.owner.query('insert into auth.users values($1)',[user]);
    await db.owner.query('insert into user_organization_context values($1,$2,$3)',[user,o.org,o.workspace]);
    await db.owner.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);
    for(const status of ['paused','past_due']){
      await db.pool.query('update subscriptions set status=$1,provider_subscription_id=$2 where organization_id=$3',[status,o.subscription,o.org]);
      await db.owner.query('set role authenticated');
      try {await assert.rejects(db.owner.query("select redeem_vayon3day('VAYON3DAY')"),/paid founding subscriptions/);}
      finally {await db.owner.query('reset role');}
      assert.equal((await db.pool.query('select status from subscriptions where organization_id=$1',[o.org])).rows[0].status,status);
    }
    assert.equal((await db.owner.query('select count(*) n from workspace_promo_redemptions')).rows[0].n,'0');
  });
});
