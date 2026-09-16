import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";
const require = createRequire(import.meta.url);
function load(file, environment) {
  const filename = resolve(file), mod = { exports: {} };
  const source = readFileSync(filename, "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const before = { ...process.env }; Object.assign(process.env, environment);
  try { new Function("require", "module", "exports", code)(name => { if (name === "server-only") return {}; if (name.startsWith(".")) { const stem = resolve(dirname(filename), name); return load(existsSync(stem + ".ts") ? stem + ".ts" : stem, environment); } return require(name); }, mod, mod.exports); return mod.exports; }
  finally { for (const key of Object.keys(process.env)) if (!(key in before)) delete process.env[key]; Object.assign(process.env, before); }
}
const server = "features/vayon/billing/providers/paddle/paddle-client.ts";
function environmentValue(environment) {
  const before = { ...process.env }; Object.assign(process.env, environment);
  try { return load(server, environment).paddleEnvironment(); }
  finally { for (const key of Object.keys(process.env)) if (!(key in before)) delete process.env[key]; Object.assign(process.env, before); }
}
const overlay = readFileSync("features/vayon/billing/components/checkout-overlay.ts", "utf8");

test("an explicitly configured sandbox is permitted in a production runtime", () => {
  assert.equal(environmentValue({ APP_ENV: "production", PADDLE_ENVIRONMENT: "sandbox" }), "sandbox");
});
test("live remains explicit and invalid values fail without fallback", () => {
  assert.equal(environmentValue({ APP_ENV: "production", PADDLE_ENVIRONMENT: "live" }), "live");
  assert.throws(() => environmentValue({ APP_ENV: "production", PADDLE_ENVIRONMENT: "preview" }), /explicitly set/);
});
test("server and browser choose the matching explicit Paddle environment", () => {
  const source = readFileSync(server, "utf8");
  assert.match(source, /sandbox-api\.paddle\.com/);
  assert.match(source, /https:\/\/api\.paddle\.com/);
  assert.match(overlay, /environment === "sandbox"/);
  assert.match(overlay, /paddle\.Environment\.set\("sandbox"\)/);
  assert.doesNotMatch(source + overlay, /PADDLE_API_KEY.*NEXT_PUBLIC|PADDLE_WEBHOOK_SECRET.*NEXT_PUBLIC/);
});
