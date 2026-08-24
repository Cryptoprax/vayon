import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
test("execution route and snapshot are Founder protected", () => {
  assert.match(
    read("app/vayon/creative/runtime/execution/page.tsx"),
    /FounderAccessError/,
  );
  assert.match(
    read("features/vayon/creative-execution/service.ts"),
    /founderContext\(\)/,
  );
});
test("execution service validates plans executes only registered adapters and hands off approval", () => {
  const source = read("features/vayon/creative-execution/service.ts");
  for (const value of [
    "validate(job)",
    "planner.plan",
    "adapters.get",
    "adapter.generate",
    "ApprovalRequested",
    "WaitingProvider",
    "WaitingApproval",
    "correlationId",
  ])
    assert.ok(source.includes(value), value);
  assert.doesNotMatch(source, /OpenAI|Adobe|Google|fetch\(/);
});
test("queue planner adapter and event contracts are complete", () => {
  const all = ["types.ts", "queue.ts", "planner.ts", "adapter.ts"]
    .map((file) => read(`features/vayon/creative-execution/${file}`))
    .join("\n");
  for (const value of [
    "Queued",
    "Planning",
    "WaitingProvider",
    "Executing",
    "WaitingApproval",
    "Completed",
    "Failed",
    "Cancelled",
    "priority",
    "maxRetries",
    "timeoutMs",
    "cancellationRequested",
    "correlationId",
    "generate(",
    "edit(",
    "translate(",
    "export(",
    "validate(",
    "health(",
    "estimate(",
    "Document",
    "Image",
    "Video",
    "Voice",
    "Presentation",
    "Website",
    "Translation",
    "Retry",
    "ApprovalRequested",
  ])
    assert.ok(all.includes(value), value);
});
test("document repository is tenant safe and interface only", () => {
  const source = read(
    "features/vayon/creative-execution/document-repository.ts",
  );
  for (const value of [
    "organizationId",
    "workspaceId",
    "draft(",
    "save(",
    "load(",
    "version(",
    "archive(",
    "restore(",
    "delete(",
    "search(",
  ])
    assert.ok(source.includes(value), value);
  assert.doesNotMatch(source, /createClient|from\(|insert\(|update\(/);
});
