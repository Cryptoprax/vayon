import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import ts from 'typescript';
const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(p,e.name)):[join(p,e.name).replaceAll('\\','/')]);
const read=p=>readFileSync(p,'utf8');
const root=process.cwd();
const localPath=p=>p.replace(root+'\\','').replace(root+'/','').replaceAll('\\','/');
function imports(path){
 const file=ts.createSourceFile(path,read(path),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),paths=[];
 for(const node of file.statements){
  if((!ts.isImportDeclaration(node)&&!ts.isExportDeclaration(node))||!node.moduleSpecifier||!ts.isStringLiteral(node.moduleSpecifier))continue;
  const name=node.moduleSpecifier.text;if(!name.startsWith('@/')&&!name.startsWith('.'))continue;
  const base=name.startsWith('@/')?resolve(name.slice(2)):resolve(dirname(path),name);
  const found=[base+'.tsx',base+'.ts',base+'/index.ts',base+'/index.tsx'].find(existsSync);
  if(found)paths.push(localPath(found));
 }
 return paths;
}
const dependencies=new Map();
function closure(path,seen=new Set()){
 if(seen.has(path))return seen;seen.add(path);
 if(!dependencies.has(path))dependencies.set(path,imports(path));
 for(const next of dependencies.get(path)){
  // Audit presentation ownership, not the implementation of protected services.
  if(/\/(services|repositories|actions|validation|types|config|design-system)\/|\/(service|repository|actions|domain|contracts)\.ts$/.test(next))continue;
  closure(next,seen);
 }
 return seen;
}
const pages=[...walk('app/vayon'),...walk('app/platform')].filter(p=>p.endsWith('/page.tsx')).map(path=>{
 const source=read(path),sources=[...closure(path)],presentation=sources.map(read).join('\n');
 return{path,route:path.replace(/^app/,'').replace(/\/page.tsx$/,''),redirect:/\bredirect\(/.test(source)&&!/<[A-Z][A-Za-z]+\s|<main|<div/.test(source),sharedShell:true,sharedHeader:/WorkspaceHeader|PageHeader|OperationsHeader|CrmShell|OrganizationHeader/.test(presentation),sharedFilters:/WorkspaceFilters/.test(presentation),sharedTable:/WorkspaceTable/.test(presentation),presentationSources:sources.filter(p=>p.endsWith('.tsx'))};
});
const saved=walk('test-results/layout-system/before').filter(p=>p.endsWith('.tsx.txt'));
function protectedPresentation(source){
 const file=ts.createSourceFile('source.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),attributes=[],calls=[];
 function visit(node){
  if(ts.isJsxAttribute(node)&&/^(action|formAction|on[A-Z]|name|value|defaultValue|checked|defaultChecked|disabled|href|method|required|type)$/.test(node.name.getText(file)))attributes.push(node.getText(file).replace(/\s+/g,' '));
  if(ts.isCallExpression(node))calls.push(node.expression.getText(file).replace(/\s+/g,' '));
  ts.forEachChild(node,visit);
 }visit(file);return{attributes:attributes.sort(),calls:calls.sort()};
}
const modified=saved.map(path=>{const target=path.replace('test-results/layout-system/before/','').replace(/\.txt$/,'');return{path:target,before:read(path),after:read(target)};}).filter(x=>x.before!==x.after);
const preservation=modified.map(x=>({path:x.path,formAndEventBindingsPreserved:JSON.stringify(protectedPresentation(x.before).attributes)===JSON.stringify(protectedPresentation(x.after).attributes),existingCallTargetsPreserved:JSON.stringify(protectedPresentation(x.before).calls)===JSON.stringify(protectedPresentation(x.after).calls)}));
const remaining=pages.filter(p=>!p.redirect&&!p.sharedHeader).map(p=>({route:p.route,reason:'No statically traceable shared header. Dynamic import, specialized view, or legacy adapter needs runtime review.'}));
const paths=modified.map(x=>x.path);
const manual=['features/vayon/components/ProductExperience.tsx','features/dashboard/components/MissionControlLayout.tsx','features/platform/design-system/components/data/Data.tsx','features/platform/design-system/layout/WorkspaceLayouts.tsx','features/platform/design-system/layout/workspace.css','features/platform/design-system/layout/WorkspaceTable.tsx'];
writeFileSync('test-results/layout-system/source-audit.json',JSON.stringify({evidence:'Static source inventory, not authenticated page-render certification.',pages,remaining,preservation,modifiedPresentationFiles:[...new Set([...paths,...manual])].sort()},null,2));
console.log(`${pages.length} page routes inventoried; ${pages.filter(x=>x.sharedHeader).length} traceable shared headers; ${remaining.length} specialized/legacy routes need review.`);
const changedBindings=preservation.filter(x=>!x.formAndEventBindingsPreserved||!x.existingCallTargetsPreserved);
console.log('Binding differences:',JSON.stringify(changedBindings));
if(changedBindings.length)process.exitCode=1;
