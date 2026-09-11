import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {createRequire} from 'node:module';import {loadPureModule} from '../scripts/audit-product-unification.mjs';
const require=createRequire(import.meta.url);
const {shellNavigation}=loadPureModule('features/vayon/product-shell/navigation.ts');
const {StaticNavigationSearchProvider}=loadPureModule('features/vayon/universal-bar/providers/static-navigation.provider.ts');
const {rankUniversalResults}=loadPureModule('features/vayon/universal-bar/services/universal-search.service.ts');
const {resolveOperatingSystemCommand}=loadPureModule('features/vayon/cross-module-intelligence/command-router.ts');
const tasks=[['Export Report','/vayon/analytics/executive'],['Create Property','/vayon/properties/new'],['Create Lead','/vayon/leads/new'],['Invite Team Members','/vayon/settings/members'],['Create Campaign','/vayon/creative/campaigns'],['Generate Brochure','/vayon/creative/documents'],['Schedule Viewing','/vayon/site-visits'],['Send WhatsApp','/vayon/communications'],['Create Task','/vayon/tasks']];
test('common broker tasks return the existing task destination first',()=>{
 const provider=new StaticNavigationSearchProvider(shellNavigation.flatMap(g=>g.items).map(x=>({...x,id:x.href,visible:true})));
 for(const [query,href] of tasks){const results=rankUniversalResults(provider.search({query,scopes:provider.scopes}),query);assert.equal(results[0]?.href,href,query);assert.equal(results[0]?.label,query,query);}
});
test('task shortcuts do not appear without permitted navigation',()=>{const provider=new StaticNavigationSearchProvider([]);for(const [query] of tasks)assert.deepEqual(provider.search({query,scopes:provider.scopes}),[]);});
test('specific next steps bypass generic hubs without executing a mutation',()=>{for(const [query,expected] of [['Generate Brochure','/vayon/creative/documents'],['Generate Agreement','/vayon/creative/documents'],['Create Follow-up','/vayon/tasks'],['Schedule Viewing','/vayon/site-visits'],['WhatsApp Lead','/vayon/communications'],['Create Campaign','/vayon/creative/campaigns'],['Recommend Properties','/vayon/property-matching']]){const command=resolveOperatingSystemCommand(query);assert.equal(new URL(command.route,'https://test.invalid').pathname,expected);assert.equal(command.workspaceRequired,true);}});
test('record next steps retain encoded context and reveal alternatives only on demand',()=>{
 const source=fs.readFileSync('features/vayon/cross-module-intelligence/ContextualAIActions.tsx','utf8');const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;const mod={exports:{}};new Function('require','module','exports',code)(name=>name==='./command-router'?{resolveOperatingSystemCommand}:name==='next/link'?{__esModule:true,default:({children,...props})=>React.createElement('a',props,children)}:require(name),mod,mod.exports);
 const html=renderToStaticMarkup(React.createElement(mod.exports.ContextualAIActions,{kind:'property',recordId:'record / one',recordLabel:'Lake House',evidence:{description:'Lakefront home'},heading:'Continue with this property'}));
 const hrefs=[...html.matchAll(/href="([^"]+)"/g)].map(m=>new URL(m[1].replaceAll('&amp;','&'),'https://test.invalid'));
 assert.equal(hrefs[0].pathname,'/vayon/creative/documents');assert.equal(hrefs[0].searchParams.get('propertyId'),'record / one');assert.deepEqual(hrefs.slice(1,4).map(u=>u.pathname),['/vayon/creative/documents','/vayon/property-matching','/vayon/site-visits']);for(const url of hrefs.slice(1))assert.equal(url.searchParams.get('propertyId'),'record / one');assert.match(html,/<details/);assert.match(html,/Continue with this property/);
 const next=mod.exports.nextEntityAction;
 assert.equal(next('property','p',{description:''}).href,'/vayon/properties/p/edit');
 assert.equal(next('lead','l',{}).href,'/vayon/leads/l/edit');
 assert.equal(next('lead','l',{phone:'123'}).href,'/vayon/tasks?leadId=l');
 assert.equal(next('deal','d',{stage:'completed'}).href,'/vayon/creative/documents?dealId=d');
 assert.equal(next('client','c',{leadId:'l'}).href,'/vayon/leads/l');
 assert.equal(next('property','p'),undefined);
 assert.doesNotMatch(html,/Brochure Ready|Draft Ready|Review &amp; Send/);
 fs.mkdirSync('test-results/product-bible-phase3',{recursive:true});fs.writeFileSync('test-results/product-bible-phase3/next-steps-fixture.html',html);
});
test('photo previews and form failures no longer promise persistence or echo arbitrary errors',()=>{
 const media=fs.readFileSync('features/vayon/property-intelligence/components/MediaManager.tsx','utf8');assert.match(media,/not uploaded or saved with the property/);assert.doesNotMatch(media,/Drag \$|Drop-ready|placeholder|Upload images/);
 for(const path of ['property/components/PropertyWizard.tsx','lead/components/LeadWizard.tsx'])assert.doesNotMatch(fs.readFileSync('features/vayon/'+path,'utf8'),/>\{error\}<\/p>/);
 assert.doesNotMatch(fs.readFileSync('features/vayon/components/RouteStates.tsx','utf8'),/Your data is safe|records have not been changed/);
});


test('essential create flows skip only optional sections and preserve required sections',()=>{
  for(const [file,expected,last] of [['features/vayon/property/components/PropertyWizard.tsx',[1,2,3,4,10],10],['features/vayon/lead/components/LeadWizard.tsx',[1,3,6],6]]) {
    const source=fs.readFileSync(file,'utf8');const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let next;
    const walk=node=>{if(ts.isCallExpression(node)&&node.expression.getText(ast)==='setStep'&&node.arguments[0]?.getText(ast).includes('Math.min'))next=new Function('sections','return ('+node.arguments[0].getText(ast)+')')({length:10});ts.forEachChild(node,walk);};walk(ast);
    assert.ok(next);const path=[1];while(path.at(-1)!==last&&path.length<12)path.push(next(path.at(-1)));assert.deepEqual(path,expected);
    assert.match(source,/type="submit"/);assert.match(source,/required/);assert.doesNotMatch(source,/noValidate/);
  }
});
