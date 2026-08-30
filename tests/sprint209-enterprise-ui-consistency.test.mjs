import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("enterprise spacing, radii, motion, and control tokens are centralized", async () => {
  const css = await read("features/platform/design-system/tokens/vds.css");
  for (const contract of ["--vds-space-1", "--vds-space-16", "--vds-radius-control", "--vds-radius-card", "--vds-duration-fast", "--vds-duration-standard"]) assert.match(css, new RegExp(contract));
});

test("shared actions forms cards and metrics expose consistent interaction contracts", async () => {
  const source = (await Promise.all([
    read("features/platform/design-system/components/core/Actions.tsx"),
    read("features/platform/design-system/components/core/Surfaces.tsx"),
    read("features/platform/design-system/components/forms/Fields.tsx"),
    read("features/platform/design-system/components/metrics/Metrics.tsx"),
  ])).join("\n");
  assert.match(source, /disabled:cursor-not-allowed/);
  assert.match(source, /aria-invalid:border-vds-danger/);
  assert.match(source, /vds-card-motion flex min-w-0 flex-col/);
  assert.match(source, /min-h-40/);
});

test("page headers tables and empty states share accessible visual hierarchy", async () => {
  const source = (await Promise.all([
    read("features/platform/design-system/layout/Layouts.tsx"),
    read("features/platform/design-system/components/data/Data.tsx"),
    read("features/platform/design-system/components/feedback/Feedback.tsx"),
  ])).join("\n");
  assert.match(source, /vds-page-header/);
  assert.match(source, /role="status"/);
  assert.match(source, /justify-center gap-2/);
});
