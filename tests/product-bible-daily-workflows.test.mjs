import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadPureModule } from '../scripts/audit-product-unification.mjs';
const require = createRequire(import.meta.url);
const root = process.cwd();
// Exercise presentation with fixture data. Service/auth boundaries are not mocked into a signed-in test.
function loadView(file) {
  const filename = path.resolve(root, file);
  const source = fs.readFileSync(filename, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions:{module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022, jsx:ts.JsxEmit.ReactJSX, esModuleInterop:true} }).outputText;
  const mod={exports:{}};
  const link=({children,...props})=>{ delete props.prefetch; return React.createElement('a',props,children); };
  const design={ButtonLink:({variant='primary',children,...props})=>React.createElement('a',{'data-variant':variant,...props},children), Button:({variant='primary',children,...props})=>React.createElement('button',{'data-variant':variant,...props},children)};
  const localRequire=name=>{
    if(name==='next/link')return {__esModule:true,default:link};
    if(name==='@/features/platform/design-system')return design;
    if(name.endsWith('RevenueChartLoader'))return {RevenueChartLoader:()=>null};
    if(name==='@/features/vayon/empty-states/UniversalEmptyState')return {UniversalEmptyState:()=>null};
    if(name.startsWith('.')||name.startsWith('@/')) {
      const resolved=name.startsWith('@/')?path.resolve(root,name.slice(2)):path.resolve(path.dirname(filename),name);
      return loadView(fs.existsSync(resolved+'.tsx')?resolved+'.tsx':resolved+'.ts');
    }
    return require(name);
  };
  new Function('require','module','exports',code)(localRequire,mod,mod.exports);
  return mod.exports;
}
const empty={organizationName:'Test business',workspaceName:'Test workspace',currency:'USD',kpis:[],pipeline:[],charts:[],activities:[],calendar:[],ai:{recommendations:0},aiWorkforce:[],whatsappConversations:[],notifications:[],usage:[],isEmpty:true};

test('daily search ranks create, recent, frequent, other records, pages, then settings',()=>{
  const {rankUniversalResults}=loadPureModule('features/vayon/universal-bar/services/universal-search.service.ts');
  const base={label:'Property',description:'',keywords:[],scope:'properties'};
  const items=[['settings','navigation','/vayon/settings/organization'],['page','navigation','/vayon/properties'],['other','record','/vayon/properties/other'],['frequent','record','/vayon/properties/frequent'],['recent','record','/vayon/properties/recent'],['create','quick-create','/vayon/properties/new']].map(([id,kind,href])=>({...base,id,kind,href}));
  const history=[{id:'recent',kind:'recently-opened',recordedAt:'2026-09-08T00:00:00Z',visits:1},{id:'frequent',kind:'recently-opened',recordedAt:'2026-08-01T00:00:00Z',visits:8}];
  assert.deepEqual(rankUniversalResults(items,'Property',history,Date.parse('2026-09-08T12:00:00Z')).map(i=>i.id),['create','recent','frequent','other','page','settings']);
  assert.equal(rankUniversalResults(items,'Property',[],Date.parse('2026-09-08T12:00:00Z'))[0].id,'create');
  assert.equal(items[0].id,'settings');
});

test('record history never promotes another record sharing the same list destination',()=>{
  const {rankUniversalResults}=loadPureModule('features/vayon/universal-bar/services/universal-search.service.ts');
  const base={label:'Follow up',description:'',keywords:[],scope:'tasks',kind:'record',href:'/vayon/tasks'};
  const history=[{id:'b',kind:'recently-opened',recordedAt:'2026-09-08T00:00:00Z',visits:2}];
  assert.deepEqual(rankUniversalResults([{...base,id:'a'},{...base,id:'b'}],'Follow up',history,Date.parse('2026-09-08T01:00:00Z')).map(i=>i.id),['b','a']);
});

test('empty dashboard has one primary action, unique destinations, and valid section targets',()=>{
  const {DashboardShell}=loadView('features/vayon/dashboard/components/DashboardShell.tsx');
  const html=renderToStaticMarkup(React.createElement(DashboardShell,{data:empty,userName:'Broker'}));
  assert.equal((html.match(/data-variant="primary"/g)||[]).length,1);
  const hrefs=[...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(hrefs).size,hrefs.length,hrefs.join('\n'));
  for(const href of hrefs.filter(h=>h.startsWith('#')))assert.ok(html.includes(`id="${href.slice(1)}"`));
  assert.match(html,/<details[^>]*><summary/);
  assert.doesNotMatch(html,/Create an AI employee|Import CRM|Owner.*Unavailable/);
  fs.mkdirSync('test-results/product-bible-phase2',{recursive:true});
  fs.writeFileSync('test-results/product-bible-phase2/dashboard-fixture.html',html);
});

test('record actions preserve usable links and put alternatives behind disclosure',()=>{
  const {WorkspaceActions}=loadView('features/vayon/workspace-engine/components/WorkspaceEngine.tsx');
  const html=renderToStaticMarkup(React.createElement(WorkspaceActions,{actions:[{id:'edit',label:'Edit property',href:'/vayon/properties/one/edit',kind:'navigation'},{id:'market',label:'Market property',href:'/vayon/creative/campaigns',kind:'navigation'},{id:'placeholder',label:'Not wired',kind:'placeholder'}]}));
  assert.equal((html.match(/data-variant="primary"/g)||[]).length,1);
  assert.match(html,/<details><summary/);
  assert.doesNotMatch(html,/Not wired/);
  assert.match(html,/href="\/vayon\/creative\/campaigns"/);
});


test('populated dashboard preserves repeated activity text without duplicate destination links',()=>{
  const {DashboardShell}=loadView('features/vayon/dashboard/components/DashboardShell.tsx');
  const data={...empty,isEmpty:false,kpis:[{key:'pipeline',value:100,displayValue:'$100',trend:0,sparkline:[]}],calendar:[{id:'task',kind:'task',title:'Call buyer',startsAt:'2026-09-08T12:00:00Z',meta:'Follow up',href:'/vayon/tasks'}],activities:[{id:'a',eventType:'lead.created',title:'Lead created',occurredAt:'2026-09-08T10:00:00Z',workspace:'Test',href:'/vayon/leads/one'},{id:'b',eventType:'lead.updated',title:'Lead updated',occurredAt:'2026-09-08T11:00:00Z',workspace:'Test',href:'/vayon/leads/one'}]};
  const html=renderToStaticMarkup(React.createElement(DashboardShell,{data,userName:'Broker'}));
  const hrefs=[...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(hrefs).size,hrefs.length,hrefs.join('\n'));
  assert.match(html,/Lead created/);assert.match(html,/Lead updated/);assert.match(html,/Call buyer/);
  assert.equal((html.match(/data-variant="primary"/g)||[]).length,1);
});


test('team checklist depends on membership count, never invitation activity',()=>{
 const {GettingStartedChecklist}=loadView('features/vayon/dashboard/components/GettingStartedChecklist.tsx');
 for(const count of [undefined,0,1,2,8]) {
  const html=renderToStaticMarkup(React.createElement(GettingStartedChecklist,{data:{...empty,workspaceMemberCount:count,activities:[{eventType:'team.invited'}]}}));
  assert.equal(html.includes('Invite Your Team'),count===1);
 }
});
