import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { load } from './helpers/sprint237-load.mjs';

const valid = () => { const form = new FormData(); for (const [k,v] of Object.entries({name:'Test User',email:'person@example.test',password:'strong-password'})) form.set(k,v); return form; };
function action(result, throws = false) {
  let calls = 0, logouts = 0;
  const { signUpAction } = load('features/authentication/actions/auth.actions.ts', {
    'next/cache': { revalidatePath() {} },
    'next/headers': { headers: async () => new Headers({origin:'https://www.vayon.online'}) },
    'next/navigation': { redirect() { throw Error('Unexpected redirect'); } },
    '../security/oauth': { trustedApplicationOrigin: x => x, safeAuthenticatedPath: x => x },
    '@/lib/supabase/server': {},
    '../services/authentication.service': { AuthenticationService: class {
      async signUp(...args) { calls++; assert.deepEqual(args,['Test User','person@example.test','strong-password','https://www.vayon.online']); if (throws) throw Error('private network details'); return result; }
      async logout() { logouts++; }
    } },
  });
  return { run: signUpAction, calls: () => calls, logouts: () => logouts };
}
const user = {id:'user',identities:[{id:'identity'}]};
test('confirmation signup returns only the email and never redirects or authenticates', async () => {
  const a=action({data:{user,session:null},error:null});
  assert.deepEqual(await a.run(valid()),{status:'confirmation',email:'person@example.test'});
  assert.equal(a.logouts(),0);
});
test('validation rejects invalid input before calling Supabase', async () => {
  const a=action(null); const f=valid();f.set('password','short');
  assert.equal((await a.run(f)).status,'error');assert.equal(a.calls(),0);
});
for (const [name,result,throws] of [
  ['provider error',{error:{message:'Signup unavailable'}},false],
  ['existing account error',{error:{message:'User already registered'}},false],
  ['obfuscated duplicate',{data:{user:{...user,identities:[]},session:null}},false],
  ['empty response',{data:{user:null,session:null}},false],
  ['network failure',null,true],
]) test(`signup handles ${name} without claiming account creation`, async () => {
  const state=await action(result,throws).run(valid());assert.equal(state.status,'error');
  assert.doesNotMatch(state.message,/private network details|created successfully/);
});
test('unexpected session is signed out rather than bypassing confirmation', async () => {
  const a=action({data:{user,session:{access_token:'test-only'}}});
  assert.equal((await a.run(valid())).status,'error');assert.equal(a.logouts(),1);
});
test('signup preserves metadata and PKCE callback while canonicalizing production origin', async () => {
  for (const [origin,expected] of [['https://vayon.online','https://www.vayon.online'],['https://www.vayon.online','https://www.vayon.online'],['http://localhost:3000','http://localhost:3000']]) {
    let input;
    const {AuthenticationService}=load('features/authentication/services/authentication.service.ts',{
      '@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{signUp:async x=>{input=x;return {data:{user,session:null}};}}})},
      '../security/oauth':{safeAuthenticatedPath:x=>x},
      });
    await new AuthenticationService().signUp('Test User','person@example.test','strong-password',origin);
    assert.deepEqual(input,{email:'person@example.test',password:'strong-password',options:{data:{name:'Test User'},emailRedirectTo:expected+'/auth/callback?next=/vayon'}});
  }
});
test('verification landing stays public, while app routes stay protected',()=>{
  const {isPublicWebsiteRoute}=load('lib/supabase/proxy.ts',{
    '@supabase/ssr':{},'next/server':{},'./config':{},'@/features/platform/visibility/policy':{},
  });
  assert.equal(isPublicWebsiteRoute('/verify-email'),true);
  assert.equal(isPublicWebsiteRoute('/vayon/settings'),false);
  assert.match(readFileSync('lib/supabase/server.ts','utf8'),/flowType:"pkce"/);
  assert.match(readFileSync('app/auth/callback/route.ts','utf8'),/exchangeCodeForSession\(code\)/);
});
function render(state,pending=false) {
  const {SignupForm}=load('features/authentication/components/SignupForm.tsx',{
    react:{...React,useActionState:()=>[state,()=>{},pending],useEffect:()=>{},useRef:()=>({current:null})},
    'next/link':{default:({children,href})=>React.createElement('a',{href},children)},
    '@/features/platform/design-system':{
      Button:({children,disabled})=>React.createElement('button',{disabled},children),
      ButtonLink:({children,href})=>React.createElement('a',{href},children),
    },
    '../actions/auth.actions':{},
    './AuthForm':{
      AuthShell:({title,children})=>React.createElement('main',null,React.createElement('h1',null,title),children),
      AuthFields:()=>React.createElement('button',{type:'submit'},'Create account'),
      FormNotice:({error})=>React.createElement('p',null,error),
    },
  });
  return renderToStaticMarkup(React.createElement(SignupForm));
}
test('confirmation renders exact copy, escaped email and explicit sign-in link without signup form',()=>{
  const html=render({status:'confirmation',email:'person@example.test'});
  assert.match(html,/Check your email/);assert.match(html,/Your account has been created successfully/);
  assert.match(html,/We&#x27;ve sent a verification link to/);assert.match(html,/person@example.test/);
  assert.match(html,/Please confirm your email before signing in/);
  assert.match(html,/<a href="\/login">OK, go to Sign In<\/a>/);assert.doesNotMatch(html,/<form/);
  assert.match(render({status:'confirmation',email:'<script>'}),/&lt;script&gt;/);
});
test('pending signup disables submission and exposes busy status',()=>{
  const html=render(null,true);assert.match(html,/<fieldset disabled=""/);assert.match(html,/aria-busy="true"/);assert.match(html,/Creating your account/);
});
test('signup errors remain visible on the form',()=>{
  const html=render({status:'error',message:'Please try again'});assert.match(html,/role="alert"/);assert.match(html,/Please try again/);assert.match(html,/<form/);assert.doesNotMatch(html,/Check your email/);
});
