import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
export default function transform(source) {
  if (this.resourceQuery === '?before') source=readFileSync(`test-results/layout-system/before/${relative(process.cwd(),this.resourcePath).replaceAll('\\','/')}.txt`,'utf8');
  return ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,esModuleInterop:true},fileName:this.resourcePath}).outputText;
}
