import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { loadPureModule } from '../scripts/audit-product-unification.mjs';
const require=createRequire(import.meta.url);
function load(file){const filename=resolve(file),mod={exports:{}};const code=ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',code)(name=>name.startsWith('@/')?load(name.slice(2)+'.ts'):name.startsWith('.')?load(resolve(dirname(filename),name+'.ts')):require(name),mod,mod.exports);return mod.exports;}
const {evaluateWorkspacePermission}=load('features/platform/permissions/runtime/policy.ts');
const {StaticNavigationSearchProvider}=loadPureModule('features/vayon/universal-bar/providers/static-navigation.provider.ts');
const {rankUniversalResults}=loadPureModule('features/vayon/universal-bar/services/universal-search.service.ts');
const {shellNavigation}=loadPureModule('features/vayon/product-shell/navigation.ts');
test('all team synonyms return the canonical invitation action first',()=>{const provider=new StaticNavigationSearchProvider(shellNavigation.flatMap(g=>g.items).map(p=>({...p,id:p.href,visible:true})));for(const query of ['Invite','Team','Members','User','Employee','Staff']){const results=rankUniversalResults(provider.search({query,scopes:provider.scopes}),query);assert.equal(results[0].label,'Invite Team Members',query);assert.equal(results[0].href,'/vayon/settings/members');assert.equal(results.filter(r=>r.href==='/vayon/settings/members').length,1);}});
test('a settings ancestor cannot expose the invitation action when members navigation is absent',()=>{const provider=new StaticNavigationSearchProvider([{id:'settings',href:'/vayon/settings',label:'Settings',visible:true}]);for(const query of ['Invite','Team','Employee'])assert.ok(provider.search({query,scopes:provider.scopes}).every(r=>r.id!=='invite-team'));});
test('existing RBAC grants owners and admins and denies agents; manager mismatch stays explicit',()=>{for(const role of ['organization_owner','organization_admin'])assert.equal(evaluateWorkspacePermission(role,{module:'team_management',action:'create'}).allowed,true);for(const role of ['agent','sales_representative','manager'])assert.equal(evaluateWorkspacePermission(role,{module:'team_management',action:'create'}).allowed,false);});
test('legacy invitation action delegates to the canonical server action',()=>{const source=readFileSync('features/identity-workspace/actions/settings.actions.ts','utf8');assert.match(source,/return inviteMemberAction\(form\)/);assert.doesNotMatch(source,/repository\.invite/);});
test('onboarding persists owner in both existing membership tables',()=>{const sql=readFileSync('supabase/migrations/20260814000000_sprint43_google_identity_workspace.sql','utf8');assert.match(sql,/where code='organization_owner'/);assert.match(sql,/organization_members\(organization_id,user_id,role_id\) values\(v_org,v_user,v_owner_role\)/);assert.match(sql,/workspace_members\(workspace_id,organization_id,user_id,role_id\) values\(v_workspace,v_org,v_user,v_owner_role\)/);});
test('acceptance requires authenticated matching email and live invitation before assigning stored role',()=>{const sql=readFileSync('supabase/migrations/20260820000000_sprint51_enterprise_organization.sql','utf8');const acceptance=sql.slice(sql.indexOf('create or replace function public.accept_organization_invitation'),sql.indexOf('create or replace function public.change_organization_member_role'));for(const evidence of ['auth.uid()','lower(email)=v_email',"status='pending'",'expires_at>now()','for update',"v_inv.role_id,'active'","status='accepted'"])assert.ok(acceptance.includes(evidence),evidence);});

test('password login resumes invitation acceptance and rejects external return URLs',async()=>{
 const source=readFileSync('features/authentication/actions/auth.actions.ts','utf8');const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const mod={exports:{}};const {safeAuthenticatedPath}=loadPureModule('features/authentication/security/oauth.ts');
 new Function('require','module','exports',code)(name=>{
  if(name==='next/navigation')return {redirect:url=>{throw new Error('REDIRECT '+url)}};
  if(name==='next/cache')return {revalidatePath:()=>{}};
  if(name==='next/headers')return {headers:async()=>new Headers()};
  if(name==='../validation/auth')return {loginSchema:{safeParse:()=>({success:true,data:{email:'invited@example.invalid',password:'example'}})}};
  if(name==='../services/authentication.service')return {AuthenticationService:class{async login(){return {error:null}}}};
  if(name==='../security/oauth')return {safeAuthenticatedPath};
  if(name==='@/lib/supabase/server')return {createSupabaseServerClient:async()=>({rpc:async()=>({error:null})})};
  throw new Error('Unexpected dependency '+name);
 },mod,mod.exports);
 for(const [next,expected] of [['/accept-invitation','/accept-invitation'],['https://attacker.invalid','/vayon/dashboard'],['//attacker.invalid','/vayon/dashboard']]){const form=new FormData();form.set('next',next);await assert.rejects(mod.exports.loginAction(form),error=>error.message==='REDIRECT '+expected);}
});
