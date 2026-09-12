import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(file, stubs = {}) {
 const filename=resolve(file), mod={exports:{}};
 const code=ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 new Function('require','module','exports',code)(name=>{
  if(Object.hasOwn(stubs,name))return stubs[name];
  if(name==='server-only')return {};
  if(name.startsWith('@/')||name.startsWith('.')){const stem=name.startsWith('@/')?resolve(name.slice(2)):resolve(dirname(filename),name);return load(existsSync(stem+'.ts')?stem+'.ts':stem+'.tsx',stubs);}
  return require(name);
 },mod,mod.exports);return mod.exports;
}
const contract=load('features/vayon/billing/services/subscription-write-contract.ts');
function fixture({status='trialing',decision={allowed:true},error=null,user={id:'actor'},missing=false}={}){
 const calls=[], filters=[];
 const client={auth:{getUser:async()=>({data:{user},error:null})},from(table){assert.equal(table,'subscriptions');const q={select(){return q;},eq(k,v){filters.push([k,v]);return q;},is(){return q;},maybeSingle:async()=>({data:missing?null:{status},error:null})};return q;},rpc:async(name,args)=>{calls.push({name,args});return{data:decision,error};}};
 const stubs={'@/features/vayon/operations/services/context':{operationsContext:async()=>({client,organizationId:'org',workspaceId:'selected'})},'@/features/authentication/services/authentication.service':{AuthenticationService:class{async user(){return user;}}},'next/navigation':{redirect(path){const e=new Error('Redirect');e.digest=`NEXT_REDIRECT;replace;${path};307;`;throw e;}}};
 return {client,calls,filters,stubs,service:new (load('features/vayon/billing/services/subscription-write.service.ts',stubs).SubscriptionWriteService)(),guard:load('features/vayon/billing/services/subscription-write-guard.ts',stubs)};
}
test('trial guard uses selected workspace, shared database policy and normalized invitation email',async()=>{
 const f=fixture();assert.deepEqual(await f.service.check('members',' PERSON@EXAMPLE.COM '),{allowed:true});
 assert.deepEqual(f.calls,[{name:'check_workspace_subscription_write',args:{p_workspace_id:'selected',p_resource:'members',p_email:'person@example.com'}}]);assert.deepEqual(f.filters,[['organization_id','org'],['workspace_id','selected']]);
});
test('existing non-trial subscription behavior is unchanged and does not depend on the new RPC',async()=>{
 for(const status of ['active','past_due','canceled','paused']){const f=fixture({status,error:new Error('RPC unavailable')});assert.equal((await f.service.check('properties')).allowed,true);assert.equal(f.calls.length,0);}
});
test('missing subscription and failed policy verification block writes without inventing trial state',async()=>{
 for(const options of [{missing:true},{error:new Error('unavailable')},{decision:null}]){const f=fixture(options);assert.equal((await f.service.check()).code,'SUBSCRIPTION_UNVERIFIED');}
});
test('trusted founder bypass remains supported and unauthenticated callers cannot use write guard',async()=>{
 const f=fixture({user:{id:'founder',app_metadata:{role:'founder'}}});assert.equal((await f.service.check()).allowed,true);assert.equal(f.calls.length,0);
 await assert.rejects(fixture({user:null}).service.check(),/Authentication required/);
});
test('every commercial decision sends actions to the in-app Subscription Center',async()=>{
 for(const code of ['TRIAL_EXPIRED','TRIAL_LIMIT_REACHED','SUBSCRIPTION_UNVERIFIED']){
  const f=fixture({decision:{allowed:false,code,resource:'properties'}});
  await assert.rejects(f.guard.guardSubscriptionAction('properties'),error=>error.digest.includes('/vayon/settings/billing?subscription=')&&!error.digest.includes('https:'));
  const response=await f.guard.guardSubscriptionApi();assert.equal(response.status,402);const body=await response.json();assert.equal(body.code,code);assert.match(body.subscriptionCenter,/^\/vayon\/settings\/billing\?/);assert.ok(body.message.length>30);
 }
 assert.equal((await fixture({user:null}).guard.guardSubscriptionApi()).status,401);
 assert.equal(await fixture({status:'active'}).guard.guardSubscriptionApi(),null);
});
test('database race rejections redirect without disguising ordinary permission errors',()=>{
 const {guard}=fixture();for(const message of ['TRIAL_EXPIRED:write','TRIAL_LIMIT_REACHED:members'])assert.throws(()=>guard.redirectSubscriptionFailure(new Error(message)),e=>e.digest.includes('/vayon/settings/billing?subscription='));
 assert.equal(contract.subscriptionFailure(new Error('Permission denied')),null);assert.doesNotThrow(()=>guard.redirectSubscriptionFailure(new Error('Permission denied')));
 const nested={digest:'NEXT_REDIRECT;replace;/vayon/settings/billing?subscription=expired;307;'};assert.throws(()=>guard.redirectSubscriptionFailure(nested),e=>e===nested);
});
test('worker enforcement uses the claimed target workspace and stops expired generation',async()=>{
 const f=fixture({decision:{allowed:false,code:'TRIAL_EXPIRED',resource:'write'}});await assert.rejects(f.service.requireJobWorkspace(f.client,'job-workspace'),/read-only/);assert.equal(f.calls[0].args.p_workspace_id,'job-workspace');
});
test('real property action stops before persistence and invalidates no cache when trial limit is reached',async()=>{
 const f=fixture({decision:{allowed:false,code:'TRIAL_LIMIT_REACHED',resource:'properties'}});let writes=0;
 const actions=load('features/vayon/property/actions/property.actions.ts',{...f.stubs,'@/features/vayon/property/services/property.service':{PropertyService:class{async create(){writes++;}}},'next/cache':{revalidatePath(){writes++;}}});
 await assert.rejects(actions.createPropertyAction(new FormData()),e=>e.digest.includes('subscription=limit'));assert.equal(writes,0);
});
test('expired trials retain existing read capabilities without gaining founder features',()=>{
 const {evaluateFeatureEntitlement}=load('features/vayon/billing/services/entitlement-policy.ts');const context={plan:'starter',subscriptionStatus:'trialing',expiresAt:'2000-01-01T00:00:00Z'};
 for(const feature of ['basic_ai','creative_studio','advanced_analytics'])assert.equal(evaluateFeatureEntitlement(context,feature).allowed,true);
 assert.equal(evaluateFeatureEntitlement(context,'founder_tools').allowed,false);
});
test('inventory keeps protected entry points wired to the shared guard',()=>{
 const inventory=JSON.parse(readFileSync('test-results/trial-enforcement/guarded-paths.json','utf8'));
 for(const entry of inventory.protectedActions){const source=ts.createSourceFile(entry.path,readFileSync(entry.path,'utf8'),ts.ScriptTarget.Latest,true);const fn=source.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text===entry.name);assert.ok(fn,entry.name);assert.match(fn.body.statements[0].getText(source),/await guardSubscriptionAction\(/,entry.path+':'+entry.name);}
});
