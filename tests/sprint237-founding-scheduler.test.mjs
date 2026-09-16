import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";
import yaml from "js-yaml";
import { load } from "./helpers/sprint237-load.mjs";

const source = readFileSync(".github/workflows/founding-reconciliation.yml", "utf8");
const workflow = yaml.load(source);
const step = workflow.jobs.reconcile.steps[0];
const bash = process.platform === "win32" ? "C:/Program Files/Git/bin/bash.exe" : "bash";

test("Hobby scheduler uses only scheduled/manual GitHub execution with least privilege", () => {
  assert.equal(Object.hasOwn(JSON.parse(readFileSync("vercel.json", "utf8")), "crons"), false);
  assert.deepEqual(Object.keys(workflow.on).sort(), ["schedule", "workflow_dispatch"]);
  assert.deepEqual(workflow.on.schedule, [{ cron: "7,22,37,52 * * * *" }]);
  assert.deepEqual(workflow.permissions, { contents: "read" });
  assert.deepEqual(workflow.concurrency, { group: "vayon-founding-reconciliation", "cancel-in-progress": false });
  assert.match(workflow.jobs.reconcile.if, /github\.repository == 'Cryptoprax\/vayon'/);
  assert.match(workflow.jobs.reconcile.if, /github\.ref == 'refs\/heads\/main'/);
  assert.equal(workflow.jobs.reconcile["timeout-minutes"], 7);
  assert.equal(workflow.jobs.reconcile.steps.length, 1);
  assert.deepEqual(step.env, { RECONCILIATION_SECRET: "${{ secrets.VAYON_RECONCILIATION_SECRET }}" });
  assert.match(step.run, /https:\/\/www\.vayon\.online\/api\/billing\/paddle\/founding\/reconcile/);
  assert.doesNotMatch(step.run, /https:\/\/vayon\.online\/api\/billing\/paddle\/founding\/reconcile/);
  assert.match(step.run, /--request GET/);
  assert.match(step.run, /--header @-/);
  assert.match(step.run, /--connect-timeout 15 --max-time 330/);
  assert.match(step.run, /jq -e 'type == "object" and \.ok == true'/);
  assert.doesNotMatch(step.run, /--verbose|--location|--retry|set -x|--insecure|(?:^|\s)-[a-zA-Z]*[Lv](?:\s|$)/);
  assert.doesNotMatch(source, /PADDLE_API_KEY|SUPABASE_SERVICE_ROLE_KEY|actions\/checkout/);
});

// Execute the actual Bash step with local command doubles; no HTTP requests.
for (const [name, secret, status, body, networkExit, success] of [
  ["success", "scheduler-test-only", "200", '{"ok":true}', 0, true],
  ["missing secret", "", "200", '{"ok":true}', 0, false],
  ["header injection", "scheduler-test-only\nInjected: true", "200", '{"ok":true}', 0, false],
  ["network failure", "scheduler-test-only", "000", "", 6, false],
  ["timeout after headers", "scheduler-test-only", "200", "", 28, false],
  ["unauthorized", "scheduler-test-only", "401", '{"error":"Unauthorized"}', 22, false],
  ["service failure", "scheduler-test-only", "503", '{"error":"retry"}', 22, false],
  ["redirect", "scheduler-test-only", "308", '{"ok":true}', 0, false],
  ["unsuccessful body", "scheduler-test-only", "200", '{"ok":false}', 0, false],
  ["missing confirmation", "scheduler-test-only", "200", '{}', 0, false],
  ["malformed status", "scheduler-test-only", "308 injected-status", 'private-response-body', 0, false],
  ["malformed failed status", "scheduler-test-only", "401 injected-status", 'private-response-body', 22, false],
  ["out of range status", "scheduler-test-only", "999", 'private-response-body', 0, false],
  ["invalid JSON", "scheduler-test-only", "200", '<html>error</html>', 0, false],
]) test(`scheduler shell: ${name}`, { skip: process.platform === "win32" && !existsSync(bash) }, () => {
  const doubles = `
curl() {
  local header output=''
  IFS= read -r header
  [[ "$header" == "Authorization: Bearer $RECONCILIATION_SECRET" ]] || return 99
  while (( $# )); do
    if [[ "$1" == '--output' ]]; then output="$2"; shift; fi
    shift
  done
  printf '%s' "$TEST_BODY" > "$output"
  printf '%s' "$TEST_STATUS"
  return "$TEST_NETWORK_EXIT"
}
jq() {
  node -e 'try { const x=JSON.parse(process.env.TEST_BODY); process.exit(x && !Array.isArray(x) && x.ok === true ? 0 : 1); } catch { process.exit(1); }'
}
`;
  const result = spawnSync(bash, ["--noprofile", "--norc", "-c", doubles + step.run], {
    encoding: "utf8", timeout: 15000,
    env: { ...process.env, RECONCILIATION_SECRET: secret, TEST_STATUS: status, TEST_BODY: body, TEST_NETWORK_EXIT: String(networkExit) },
  });
  assert.ifError(result.error);
  assert.equal(result.status === 0, success, result.stderr + result.stdout);
  const output = result.stdout + result.stderr;
  assert.doesNotMatch(output, /scheduler-test-only|Injected: true|<html>|"ok"|"error"|injected-status|private-response-body|Authorization:/);
  if (["redirect", "unauthorized", "service failure"].includes(name)) {
    assert.equal(output.trim(), `::error::Reconciliation returned HTTP ${status}.`);
  } else if (name === "network failure" || name === "timeout after headers" || name === "malformed failed status") {
    assert.equal(output.trim(), "::error::Reconciliation request failed.");
  } else if (name === "malformed status" || name === "out of range status") {
    assert.equal(output.trim(), "::error::Reconciliation returned an invalid HTTP status.");
  }
});

test("route rejects missing/wrong authorization before reconciliation and reports service failure", async () => {
  const original = process.env.CRON_SECRET;
  let calls = 0;
  let fail = false;
  try {
    const { GET } = load("app/api/billing/paddle/founding/reconcile/route.ts", {
      "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
      "@/features/vayon/billing/services/founding-member.service": { FoundingMemberService: class {
        async reconcile() { calls++; if (fail) throw new Error("private provider details"); }
      } },
    });
    process.env.CRON_SECRET = "scheduler-test-only";
    for (const authorization of [null, "Bearer wrong", "Bearer scheduler-test-onlX"]) {
      const response = await GET(new Request("https://example.test", { headers: authorization ? { authorization } : {} }));
      assert.equal(response.status, 401);
    }
    delete process.env.CRON_SECRET;
    assert.equal((await GET(new Request("https://example.test", { headers: { authorization: "Bearer scheduler-test-only" } }))).status, 401);
    assert.equal(calls, 0);
    process.env.CRON_SECRET = "scheduler-test-only";
    const request = () => new Request("https://example.test", { headers: { authorization: "Bearer scheduler-test-only" } });
    assert.deepEqual(await (await GET(request())).json(), { ok: true });
    fail = true;
    const response = await GET(request());
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "Reconciliation requires retry" });
    assert.equal(calls, 2);
    assert.match(readFileSync("app/api/billing/paddle/founding/reconcile/route.ts", "utf8"), /timingSafeEqual\(actual, expected\)/);
  } finally {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
  }
});
