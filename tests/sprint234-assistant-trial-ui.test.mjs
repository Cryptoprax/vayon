import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const layout = readFileSync("features/platform/design-system/layout/WorkspaceLayouts.tsx", "utf8");
const css = readFileSync("features/platform/design-system/layout/workspace.css", "utf8");

test("Sprint 234 uses one icon-only, labelled global assistant trigger", () => {
  assert.match(layout, /aria-label=\{open \? "Close VAYON assistant" : "Open VAYON assistant"\}/);
  assert.match(layout, /<Tooltip label="VAYON Assistant">/);
  assert.match(layout, /<MessageCircle aria-hidden="true"\/>/);
  assert.doesNotMatch(layout, />Open assistant</);
  assert.equal((layout.match(/data-workspace-assistant/g) || []).length, 1);
});

test("Sprint 234 keeps the assistant fixed and the trial notice in document flow", () => {
  assert.match(css, /\.vds-workspace-assistant \{ position:fixed/);
  assert.match(css, /bottom:max\(1rem,env\(safe-area-inset-bottom\)\)/);
  assert.doesNotMatch(css, /\.vds-workspace-page:has\(\.vds-workspace-notice aside\) \{ height:/);
  assert.doesNotMatch(css, /\.vds-workspace-page:has\(\.vds-workspace-notice aside\).*overflow-y:auto/);
  assert.match(css, /Trial status is normal page content/);
});
