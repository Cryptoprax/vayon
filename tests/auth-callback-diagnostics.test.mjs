import assert from 'node:assert/strict';
import test from 'node:test';
import { load } from './helpers/sprint237-load.mjs';

const message = "We couldn't complete sign-in from this link. If you've already confirmed your email, sign in with your password.";
const secret = 'PRIVATE_AUTH_SENTINEL';
const key = 'sb-project-auth-token-code-verifier';
async function run({query = {code: secret, next: '/vayon'}, error = null, thrown = false, user = {email_confirmed_at:'confirmed',app_metadata:{provider:'email'}}, names = [key], unavailable = false} = {}) {
  const logs = [], calls = [], audits = [];
  const {GET} = load('app/auth/callback/route.ts', {
    'next/headers': {cookies: async () => { if (unavailable) throw Error(secret); return {has: name => names.includes(name)}; }},
    '@/lib/supabase/config': {getSupabaseConfig: () => ({url:'https://project.supabase.co',key:secret})},
    '@/lib/supabase/server': {createSupabaseServerClient: async () => ({
      auth: {
        exchangeCodeForSession: async code => { calls.push(['exchange',code]); if(thrown) throw error; return {error,data:{session:{access_token:secret,refresh_token:secret}}}; },
        getUser: async () => { calls.push(['getUser']); return {data:{user},error:user ? null : {message:secret}}; },
      },
      rpc: async (...args) => { audits.push(args); return {}; },
    })},
  });
  const original = console.info;
  console.info = (...args) => logs.push(args);
  let response;
  try {
    response = await GET(new Request('https://www.vayon.online/auth/callback?' + new URLSearchParams(query), {headers:{cookie:`${key}=${secret}; session=${secret}`,authorization:`Bearer ${secret}`}}));
  } finally { console.info = original; }
  assert.doesNotMatch(JSON.stringify(logs), new RegExp(secret));
  const allowed = new Set(['requestId','hostname','pathname','hasCode','hasNext','hasVerifierCookie','stage','exchangeResult','errorCode','errorName','status','getUserSucceeded','redirectCategory']);
  for(const [tag,entry] of logs) {
    assert.equal(tag,'auth_callback');
    for(const field of Object.keys(entry)) assert.ok(allowed.has(field),field);
    assert.match(entry.requestId,/^[a-f0-9-]{36}$/);
    assert.equal(entry.requestId,logs[0][1].requestId);
  }
  return {url:new URL(response.headers.get('location')),logs:logs.map(x=>x[1]),calls,audits};
}

test('successful email exchange preserves audit, session lookup and /vayon onboarding entry',async()=>{
  const r=await run();assert.equal(r.url.pathname,'/vayon');
  assert.deepEqual(r.calls,[['exchange',secret],['getUser']]);
  assert.deepEqual(r.audits,[['record_identity_audit',{p_event_type:'email.verified',p_metadata:{provider:'email'}}]]);
  assert.ok(r.logs.some(x=>x.exchangeResult==='success'));
  assert.ok(r.logs.some(x=>x.getUserSucceeded===true));
  assert.equal(r.logs.at(-1).redirectCategory,'app_entry');
});
for(const code of ['bad_code_verifier','flow_state_expired','flow_state_not_found']) test(`exchange failure ${code} stays on login with accurate copy`,async()=>{
  const r=await run({error:{code,name:'AuthApiError',status:400,message:secret,session:secret}});
  assert.equal(r.url.pathname,'/login');assert.equal(r.url.searchParams.get('error'),message);
  assert.equal(r.calls.length,1);assert.equal(r.audits.length,0);
  assert.equal(r.logs.at(-1).errorCode,code);assert.equal(r.logs.at(-1).status,400);
});
test('unknown provider fields and credential-shaped error names/codes are never logged',async()=>{
  const r=await run({error:{code:secret,name:secret,status:secret,message:secret,access_token:secret,refresh_token:secret}});
  assert.equal(r.logs.at(-1).errorCode,'other');assert.equal(r.logs.at(-1).errorName,'other');
  assert.ok(!('status' in r.logs.at(-1)));
});
test('thrown exchange/network errors use the safe failure path',async()=>{
  const r=await run({error:{name:'AuthRetryableFetchError',message:secret,status:0},thrown:true});
  assert.equal(r.url.searchParams.get('error'),message);assert.equal(r.calls.length,1);
  assert.equal(r.logs.at(-1).errorName,'AuthRetryableFetchError');assert.ok(!('status' in r.logs.at(-1)));
});
test('missing and empty codes do not attempt exchange',async()=>{
  for(const query of [{},{code:''}]) {const r=await run({query});assert.equal(r.url.searchParams.get('error'),'Missing authentication code.');assert.equal(r.calls.length,0);}
});
test('Google provider denial remains differentiated and never logs provider descriptions',async()=>{
  const r=await run({query:{error_description:secret,code:secret}});
  assert.equal(r.url.searchParams.get('error'),'Google authentication was cancelled or denied.');assert.equal(r.calls.length,0);
});
test('Google success preserves provider audit and default destination',async()=>{
  const r=await run({query:{code:secret},user:{email_confirmed_at:'confirmed',app_metadata:{provider:'google'}}});
  assert.equal(r.url.pathname,'/vayon/dashboard');assert.equal(r.audits[0][1].p_metadata.provider,'google');
});
test('password recovery and email change retain destinations and audit behavior',async()=>{
  const r=await run({query:{code:secret,next:'/reset-password'}});assert.equal(r.url.pathname,'/reset-password');assert.equal(r.logs.at(-1).redirectCategory,'password_recovery');
  const changed=await run({query:{code:secret,next:'/vayon',type:'email_change'}});assert.equal(changed.audits[0][1].p_event_type,'email.changed');
});
test('safe next routing is preserved without logging sensitive paths, queries or fragments',async()=>{
  for(const next of ['https://evil.test','//evil.test','/\\evil.test']) {const r=await run({query:{code:secret,next}});assert.equal(r.url.pathname,'/vayon/dashboard');assert.equal(r.url.hostname,'www.vayon.online');}
  const r=await run({query:{code:secret,next:`/vayon/${secret}?token=${secret}#${secret}`}});
  assert.equal(r.url.pathname,`/vayon/${secret}`);assert.equal(r.logs.at(-1).redirectCategory,'other_internal');
});
test('missing authenticated user cannot reach app or identity audit',async()=>{
  const r=await run({user:null});assert.equal(r.url.pathname,'/login');assert.equal(r.audits.length,0);assert.ok(r.logs.some(x=>x.getUserSucceeded===false));
});
test('verifier presence matches only this projects fixed key or first SSR chunk',async()=>{
  for(const [names,expected] of [[[key],true],[[`${key}.0`],true],[[],false],[['sb-other-auth-token-code-verifier',`${key}.1`,'sb-project-auth-token-flows-code-verifier','sb-project-auth-token-flow-abcdefgh-code-verifier'],false]]) {
    const r=await run({names});assert.equal(r.logs[0].hasVerifierCookie,expected);
  }
  const r=await run({unavailable:true});assert.ok(!('hasVerifierCookie' in r.logs[0]));assert.equal(r.url.pathname,'/vayon');
});
