import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
export function load(file, mocks = {}) {
  const filename = resolve(file), mod = { exports: {} };
  const code = ts.transpileModule(readFileSync(filename,"utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function("require","module","exports",code)(name => {
    if (name in mocks) return mocks[name];
    if (name === "server-only") return {};
    if (name.startsWith(".") || name.startsWith("@/")) {
      const stem = name.startsWith("@/") ? resolve(name.slice(2)) : resolve(dirname(filename),name);
      return load(existsSync(stem+".ts") ? stem+".ts" : stem+".tsx", mocks);
    }
    return require(name);
  },mod,mod.exports);
  return mod.exports;
}
