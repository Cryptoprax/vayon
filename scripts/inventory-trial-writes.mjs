import { readdir, readFile, writeFile } from 'node:fs/promises';
import ts from 'typescript';
async function walk(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(x=>x.isDirectory()?walk(`${dir}/${x.name}`):[`${dir}/${x.name}`]))).flat();}
const result=[];
for(const path of [...await walk('features'),...await walk('app')].filter(x=>x.endsWith('.ts')||x.endsWith('.tsx'))){
 const source=await readFile(path,'utf8');if(!source.includes('use server')&&!path.startsWith('app/api/'))continue;
 const ast=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true, path.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 for(const node of ast.statements)if(ts.isFunctionDeclaration(node)&&node.body&&node.modifiers?.some(x=>x.kind===ts.SyntaxKind.ExportKeyword))result.push({path,name:node.name?.text,parameters:node.parameters.map(p=>p.name.getText(ast)),serverAction:source.includes('use server'),calls:[...new Set([...node.body.getText(ast).matchAll(/(?:await\s+)?([\w.]+)\(/g)].map(x=>x[1]))]});
}
await writeFile('test-results/trial-enforcement/write-inventory.json',JSON.stringify(result,null,2));
console.log(result.map(x=>`${x.path}: ${x.name}`).join('\n'));
