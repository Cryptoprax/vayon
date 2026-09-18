import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";
import yaml from "js-yaml";

const source = readFileSync(".github/workflows/founding-invoice-recovery.yml", "utf8");
const workflow = yaml.load(source);
const step = workflow.jobs.recover.steps[0];
const bash = process.platform === "win32" ? "C:/Program Files/Git/bin/bash.exe" : "bash";

test("temporary recovery workflow is manual-only, least privilege, and reuses the existing reconciliation secret", () => {
  assert.deepEqual(workflow.name, "Founding invoice recovery");
  assert.deepEqual(Object.keys(workflow.on).sort(), ["workflow_dispatch"]);
  assert.equal(workflow.on.workflow_dispatch, null);
  assert.equal("schedule" in workflow.on, false);
  assert.equal("push" in workflow.on, false);
  assert.equal("pull_request" in workflow.on, false);
  assert.equal("repository_dispatch" in workflow.on, false);
  assert.deepEqual(workflow.permissions, { contents: "read" });
  assert.deepEqual(workflow.concurrency, { group: "vayon-founding-invoice-recovery", "cancel-in-progress": false });
  assert.match(workflow.jobs.recover.if, /github\.repository == 'Cryptoprax\/vayon'/);
  assert.match(workflow.jobs.recover.if, /github\.ref == 'refs\/heads\/main'/);
  assert.equal(workflow.jobs.recover.steps.length, 1);
  // Reuses the exact existing GitHub secret reference; no new secret is introduced.
  assert.deepEqual(step.env, { RECOVERY_SECRET: "${{ secrets.VAYON_RECONCILIATION_SECRET }}" });
  assert.match(step.run, /https:\/\/www\.vayon\.online\/api\/billing\/paddle\/founding\/recover-invoice/);
  assert.doesNotMatch(step.run, /https:\/\/vayon\.online\/api\/billing\/paddle\/founding\/recover-invoice/);
  assert.match(step.run, /--request GET/);
  assert.match(step.run, /--header @-/);
  assert.match(step.run, /--connect-timeout 15 --max-time 330/);
  assert.match(step.run, /jq -e 'type == "object" and \.ok == true'/);
  assert.doesNotMatch(step.run, /--verbose|--location|--retry|set -x|--insecure|(?:^|\s)-[a-zA-Z]*[Lv](?:\s|$)/);
  assert.doesNotMatch(source, /PADDLE_API_KEY|SUPABASE_SERVICE_ROLE_KEY|actions\/checkout|VAYON_RECONCILIATION_SECRET\s*=/);
});

test("the existing reconciliation workflow is untouched", () => {
  const reconciliation = readFileSync(".github/workflows/founding-reconciliation.yml", "utf8");
  assert.match(reconciliation, /https:\/\/www\.vayon\.online\/api\/billing\/paddle\/founding\/reconcile'/);
  assert.match(reconciliation, /secrets\.VAYON_RECONCILIATION_SECRET/);
});

// Execute the actual Bash step with local command doubles; no HTTP requests.
for (const [name, secret, status, body, networkExit, success] of [
  ["success", "recovery-test-only", "200", '{"ok":true}', 0, true],
  ["success with alreadyRecovered flag", "recovery-test-only", "200", '{"ok":true,"alreadyRecovered":true}', 0, true],
  ["missing secret", "", "200", '{"ok":true}', 0, false],
  ["header injection", "recovery-test-only\nInjected: true", "200", '{"ok":true}', 0, false],
  ["network failure", "recovery-test-only", "000", "", 6, false],
  ["timeout after headers", "recovery-test-only", "200", "", 28, false],
  ["unauthorized", "recovery-test-only", "401", '{"error":"Unauthorized"}', 22, false],
  ["service failure", "recovery-test-only", "503", '{"error":"Invoice recovery requires retry"}', 22, false],
  ["redirect", "recovery-test-only", "308", '{"ok":true}', 0, false],
  ["unsuccessful body", "recovery-test-only", "200", '{"ok":false}', 0, false],
  ["missing confirmation", "recovery-test-only", "200", '{}', 0, false],
  ["malformed status", "recovery-test-only", "308 injected-status", 'private-response-body', 0, false],
  ["malformed failed status", "recovery-test-only", "401 injected-status", 'private-response-body', 22, false],
  ["out of range status", "recovery-test-only", "999", 'private-response-body', 0, false],
  ["invalid JSON", "recovery-test-only", "200", '<html>error</html>', 0, false],
]) test(`recovery workflow shell: ${name}`, { skip: process.platform === "win32" && !existsSync(bash) }, () => {
  const doubles = `
curl() {
  local header output=''
  IFS= read -r header
  [[ "$header" == "Authorization: Bearer $RECOVERY_SECRET" ]] || return 99
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
    env: { ...process.env, RECOVERY_SECRET: secret, TEST_STATUS: status, TEST_BODY: body, TEST_NETWORK_EXIT: String(networkExit) },
  });
  assert.ifError(result.error);
  assert.equal(result.status === 0, success, result.stderr + result.stdout);
  const output = result.stdout + result.stderr;
  assert.doesNotMatch(output, /recovery-test-only|Injected: true|<html>|"ok"|"error"|injected-status|private-response-body|Authorization:/);
  if (["redirect", "unauthorized", "service failure"].includes(name)) {
    assert.equal(output.trim(), `::error::Invoice recovery returned HTTP ${status}.`);
  } else if (name === "network failure" || name === "timeout after headers" || name === "malformed failed status") {
    assert.equal(output.trim(), "::error::Invoice recovery request failed.");
  } else if (name === "malformed status" || name === "out of range status") {
    assert.equal(output.trim(), "::error::Invoice recovery returned an invalid HTTP status.");
  } else if (success) {
    assert.equal(output.trim(), "Founding invoice recovery completed successfully.");
  }
});
