import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const db=new PGlite();
const evidence={runtime:'PGlite PostgreSQL WASM, isolated in-memory QA schema. Actual migration SQL, representative tables and existing membership function. Not production; not a multi-connection concurrency certification.',checks:[],failures:[]};
const owner='11111111-1111-4111-8111-111111111111', second='22222222-2222-4222-8222-222222222222',third='33333333-3333-4333-8333-333333333333',org='44444444-4444-4444-8444-444444444444',workspace='55555555-5555-4555-8555-555555555555',other='66666666-6666-4666-8666-666666666666';
const q=(sql,args=[])=>db.query(sql,args);
async function check(name,fn){try{await fn();evidence.checks.push(name);console.log(`PASS ${name}`);}catch(error){evidence.failures.push({name,message:error.message});throw error;}}
async function denied(sql,params,code){await assert.rejects(q(sql,params),error=>error.message===code);}
try{
 await db.exec(`create schema auth; create role authenticated; create role service_role;
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.role() returns text language sql as $$select coalesce(nullif(current_setting('request.jwt.claim.role',true),''),'authenticated')$$;
 create function auth.jwt() returns jsonb language sql as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 create table auth.users(id uuid primary key,email text);
 create table roles(id uuid primary key default gen_random_uuid(),code text);
 create table organizations(id uuid primary key);
 create table workspaces(id uuid primary key,organization_id uuid,created_by uuid);
 create table workspace_members(id uuid primary key default gen_random_uuid(),workspace_id uuid,organization_id uuid,user_id uuid,role_id uuid,status text default 'active');
 create table invitations(id uuid primary key default gen_random_uuid(),workspace_id uuid,organization_id uuid,email text,status text default 'pending',expires_at timestamptz default now()+interval '7 days');
 create table subscription_plans(id uuid primary key default gen_random_uuid(),code text,limits jsonb default '{}');
 create table subscriptions(id uuid primary key default gen_random_uuid(),organization_id uuid,workspace_id uuid unique,plan_id uuid,status text default 'trialing',trial_ends_at timestamptz,current_period_ends_at timestamptz,seat_quantity integer,created_by uuid,updated_by uuid,deleted_at timestamptz);
 create table organization_limits(organization_id uuid,workspace_id uuid,metric text,limit_value numeric,unique(workspace_id,metric));
 create table organization_usage(organization_id uuid,workspace_id uuid,metric text,quantity numeric,period_start date,period_end date,unique(workspace_id,metric,period_start));`);
 const tables=['properties','leads','crm_companies','deals','tasks','creative_campaigns','creative_generation_jobs'];
 for(const table of tables)await db.exec(`create table ${table}(id uuid primary key default gen_random_uuid(),organization_id uuid,workspace_id uuid,deleted_at timestamptz,name text default 'QA record');`);
 const baseline=await readFile('supabase/migrations/20260813000000_sprint22_production_baseline.sql','utf8');
 const memberFunction=baseline.match(/create or replace function public.current_workspace_role\([\s\S]*?end\$\$;|create or replace function public.current_workspace_role\([\s\S]*?\$\$;/)?.[0];
 // The membership helper is a SQL function with one dollar-quoted body.
 const start=baseline.indexOf('create or replace function public.current_workspace_role('), end=baseline.indexOf('$$;',baseline.indexOf('as $$',start)+5)+3;
 assert.ok(memberFunction && start>=0 && end>start);await db.exec(baseline.slice(start,end));
 await db.exec(await readFile('supabase/migrations/20261030000000_sprint233_workspace_trial.sql','utf8'));
 await db.exec(await readFile('supabase/migrations/20261030010000_sprint233_trial_enforcement.sql','utf8'));
 await db.exec(`insert into roles(code) values('organization_owner');insert into subscription_plans(code) values('starter');`);
 await q('insert into auth.users(id,email) values($1,$2),($3,$4),($5,$6)',[owner,'owner@example.test',second,'second@example.test',third,'third@example.test']);
 await q('insert into organizations(id) values($1)',[org]);await q('insert into workspaces(id,organization_id,created_by) values($1,$2,$3),($4,$2,$3)',[workspace,org,owner,other]);
 await q("select set_config('request.jwt.claim.sub',$1,false)",[owner]);
 await check('new workspace receives one three-day trial; repeated provisioning does not reset it',async()=>{
  await q('select provision_workspace_billing($1,$2,$3)',[workspace,org,owner]);const before=(await q('select trial_ends_at,status from subscriptions where workspace_id=$1',[workspace])).rows[0];
  assert.equal(before.status,'trialing');assert.ok(Math.abs(Date.parse(before.trial_ends_at)-Date.now()-3*86400000)<5000);
  await q('select provision_workspace_billing($1,$2,$3)',[workspace,org,owner]);assert.deepEqual((await q('select trial_ends_at,status from subscriptions where workspace_id=$1',[workspace])).rows[0],before);
 });
 await q('select provision_workspace_billing($1,$2,$3)',[other,org,owner]);
 await q("insert into workspace_members(workspace_id,organization_id,user_id,role_id) select $1,$2,$3,id from roles limit 1",[workspace,org,owner]);
 await check('first property persists; second property is atomically rejected',async()=>{
  await q('insert into properties(workspace_id,organization_id) values($1,$2)',[workspace,org]);await denied('insert into properties(workspace_id,organization_id) values($1,$2)',[workspace,org],'TRIAL_LIMIT_REACHED:properties');assert.equal((await q('select count(*)::int n from properties')).rows[0].n,1);
 });
 await check('two leads persist; third is rejected and a batch over quota rolls back entirely',async()=>{
  await q('insert into leads(workspace_id) values($1),($1)',[workspace]);await denied('insert into leads(workspace_id) values($1)',[workspace],'TRIAL_LIMIT_REACHED:leads');
  await denied('insert into leads(workspace_id) values($1),($1),($1)',[other],'TRIAL_LIMIT_REACHED:leads');assert.equal((await q('select count(*)::int n from leads where workspace_id=$1',[other])).rows[0].n,0);
 });
 await check('one company persists; second company is rejected',async()=>{await q('insert into crm_companies(workspace_id) values($1)',[workspace]);await denied('insert into crm_companies(workspace_id) values($1)',[workspace],'TRIAL_LIMIT_REACHED:companies');});
 await check('pending invitation reserves one seat; acceptance consumes the reservation once',async()=>{
  await q('insert into invitations(workspace_id,email) values($1,$2)',[workspace,'second@example.test']);await denied('insert into invitations(workspace_id,email) values($1,$2)',[workspace,'third@example.test'],'TRIAL_LIMIT_REACHED:members');
  await q("update invitations set expires_at=now()+interval '8 days' where workspace_id=$1",[workspace]);
  await q("insert into workspace_members(workspace_id,organization_id,user_id,role_id) select $1,$2,$3,id from roles limit 1",[workspace,org,second]);await q("update invitations set status='accepted' where workspace_id=$1",[workspace]);
  await denied('insert into workspace_members(workspace_id,user_id) values($1,$2)',[workspace,third],'TRIAL_LIMIT_REACHED:members');
 });
 await check('soft-delete recovery cannot bypass record caps',async()=>{
  const old=(await q('update properties set deleted_at=now() where workspace_id=$1 returning id',[workspace])).rows[0].id;await q('insert into properties(workspace_id) values($1)',[workspace]);await denied('update properties set deleted_at=null where id=$1',[old],'TRIAL_LIMIT_REACHED:properties');
 });
 await check('expiry blocks create update delete campaigns generation and invitations while SELECT still works',async()=>{
  await q("update subscriptions set trial_ends_at=now()-interval '1 second' where workspace_id=$1",[workspace]);
  for(const table of tables){await denied(`insert into ${table}(workspace_id) values($1)`,[workspace],`TRIAL_EXPIRED:${['properties','leads','crm_companies'].includes(table)?table==='crm_companies'?'companies':table:'write'}`);}
  await denied('update properties set name=$1 where workspace_id=$2',['Changed',workspace],'TRIAL_EXPIRED:write');await denied('delete from properties where workspace_id=$1',[workspace],'TRIAL_EXPIRED:write');
  await denied('insert into invitations(workspace_id,email) values($1,$2)',[workspace,'third@example.test'],'TRIAL_EXPIRED:members');
  assert.equal((await q('select count(*)::int n from properties where workspace_id=$1',[workspace])).rows[0].n,2);
  await denied('update properties set workspace_id=$1 where workspace_id=$2',[other,workspace],'TRIAL_EXPIRED:write');
 });
 await check('upgrade immediately restores paid writes despite an old trial deadline and trial quotas',async()=>{
  await q("update subscriptions set status='active' where workspace_id=$1",[workspace]);await q('insert into properties(workspace_id) values($1),($1)',[workspace]);await q('update properties set name=$1 where workspace_id=$2',['Paid workspace',workspace]);
  assert.equal((await q('select check_workspace_subscription_write($1,$2,null) decision',[workspace,'properties'])).rows[0].decision.allowed,true);
 });
 await check('unknown trial deadline fails closed without hiding data',async()=>{await q("update subscriptions set trial_ends_at=null where workspace_id=$1",[other]);await denied('insert into tasks(workspace_id) values($1)',[other],'SUBSCRIPTION_UNVERIFIED:write');assert.equal((await q('select count(*)::int n from tasks where workspace_id=$1',[other])).rows[0].n,0);});
 await check('preflight rejects nonmembers and private policy is not granted to authenticated users',async()=>{
  await q("select set_config('request.jwt.claim.sub',$1,false)",[third]);await assert.rejects(q('select check_workspace_subscription_write($1)',[workspace]),error=>error.code==='42501');
  assert.equal((await q("select has_function_privilege('authenticated','public.workspace_subscription_write_policy(uuid,text,text)','EXECUTE') allowed")).rows[0].allowed,false);
 });
 await check('trusted worker checks target workspace without borrowing the current workspace',async()=>{await q("select set_config('request.jwt.claim.role','service_role',false)");const decision=(await q('select check_workspace_subscription_write($1) decision',[other])).rows[0].decision;assert.equal(decision.code,'SUBSCRIPTION_UNVERIFIED');});
 console.log(`PASS ${evidence.checks.length} PostgreSQL runtime scenarios`);
}finally{await writeFile('test-results/trial-enforcement/database-evidence.json',JSON.stringify(evidence,null,2));await db.close();}
