import ts from "typescript";
import { readFileSync } from "node:fs";
export default function transform(source) {
  if (this.resourceQuery === "?before") source = readFileSync("test-results/members/before-source.txt", "utf8");
  return ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, esModuleInterop: true }, fileName: this.resourcePath }).outputText;
}
