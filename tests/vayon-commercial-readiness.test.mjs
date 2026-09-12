import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("authenticated Vayon routes inherit the commercial product baseline", () => {
  const shell = read("features/vayon/components/ProductExperience.tsx");
  const css = read("app/globals.css");
  assert.match(shell, /vayon-product/);
  for (const contract of [/#main-content/, /max-width:100rem/, /padding:2rem 1rem/, /min-height:2\.75rem/, /text-wrap:balance/, /tbody tr\):hover/]) assert.match(css, contract);
});

test("VDS actions surfaces fields and tables use shared commercial contracts", () => {
  const actions = read("features/platform/design-system/components/core/Actions.tsx");
  const surfaces = read("features/platform/design-system/components/core/Surfaces.tsx");
  const fields = read("features/platform/design-system/components/forms/Fields.tsx");
  const data = read("features/platform/design-system/components/data/Data.tsx");
  assert.match(actions, /text-vds-on-accent/);
  assert.match(actions, /h-11/);
  assert.match(surfaces, /sm:p-6/);
  assert.match(fields, /min-h-11/);
  assert.match(data, /sticky top-0/);
  assert.match(data, /WorkspaceTable/);
});

test("overlays and feedback are responsive accessible and motion aware", () => {
  const disclosure = read("features/platform/design-system/components/disclosure/Disclosure.tsx");
  const feedback = read("features/platform/design-system/components/feedback/Feedback.tsx");
  const css = read("features/platform/design-system/tokens/vds.css");
  for (const contract of [/aria-modal="true"/, /Escape/, /useFocusTrap/, /max-h-\[calc\(100dvh-2rem\)\]/, /sm:p-6/, /min-h-11/]) assert.match(disclosure, contract);
  for (const state of ["EmptyState", "ErrorState", "LoadingState", "Toast", "Skeleton"]) assert.match(feedback, new RegExp(state));
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test("semantic accent and product icon enforcement are release contracts", () => {
  const css = read("features/platform/design-system/tokens/vds.css");
  const tokens = read("features/platform/design-system/tokens/tokens.ts");
  const audit = read("scripts/audit-commercial-readiness.mjs");
  assert.match(css, /--vds-color-on-accent/);
  assert.match(tokens, /onAccent/);
  assert.match(audit, /16,18,20,24/);
  assert.match(read("package.json"), /audit:ux/);
});

test("release infrastructure is UI-only and documented", () => {
  const source = [
    read("features/platform/design-system/components/core/Actions.tsx"),
    read("features/platform/design-system/components/core/Surfaces.tsx"),
    read("features/platform/design-system/components/forms/Fields.tsx"),
    read("features/platform/design-system/components/data/Data.tsx"),
    read("features/platform/design-system/layout/Layouts.tsx"),
  ].join("\n");
  assert.doesNotMatch(source, /createClient|supabase|fetch\(|axios|\.from\(|\.rpc\(|openai|anthropic|gemini/i);
  assert.match(read("docs/RELEASE_1_9_COMMERCIAL_READINESS.md"), /Release 1\.9/);
});
