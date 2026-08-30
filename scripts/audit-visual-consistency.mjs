import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [tokens, actions, surfaces, fields, layouts, metrics, feedback, data, shell] = await Promise.all([
  read("features/platform/design-system/tokens/vds.css"),
  read("features/platform/design-system/components/core/Actions.tsx"),
  read("features/platform/design-system/components/core/Surfaces.tsx"),
  read("features/platform/design-system/components/forms/Fields.tsx"),
  read("features/platform/design-system/layout/Layouts.tsx"),
  read("features/platform/design-system/components/metrics/Metrics.tsx"),
  read("features/platform/design-system/components/feedback/Feedback.tsx"),
  read("features/platform/design-system/components/data/Data.tsx"),
  read("features/vayon/components/ProductExperience.tsx"),
]);

for (const token of ["--vds-space-1", "--vds-space-16", "--vds-radius-card", "--vds-control-height", "--vds-duration-standard"]) {
  assert.match(tokens, new RegExp(token), `Missing enterprise token ${token}`);
}
assert.match(actions, /disabled:cursor-not-allowed/);
assert.match(actions, /\[&_svg\]:size-4/);
assert.match(surfaces, /vds-card-motion flex min-w-0 flex-col rounded-2xl p-5 sm:p-6/);
assert.match(fields, /aria-invalid:border-vds-danger/);
assert.match(layouts, /vds-page-header/);
assert.match(metrics, /min-h-40/);
assert.match(feedback, /justify-center gap-2/);
assert.match(data, /No rows available/);
assert.match(shell, /<AppShell/);
console.log("Visual consistency audit passed: shared enterprise UI primitives and authenticated shell are standardized.");
