import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("floating manager registers and measures every shared surface", () => {
  const manager = read("features/vayon/floating-layout/FloatingLayoutManager.tsx");
  for (const value of ["ResizeObserver", "visualViewport", "MutationObserver", "priority", "expanded", "createPortal"])
    assert.match(manager, new RegExp(value));
});

test("assistant quick create feedback and demo use the centralized manager", () => {
  const sources = [
    read("features/vayon/intelligence-core/components/VayonIntelligence.tsx"),
    read("features/vayon/product-shell/QuickCreate.tsx"),
    read("features/vayon/components/ProductExperience.tsx"),
    read("features/vayon/demo-experience/components/DemoExperience.tsx"),
  ];
  for (const source of sources) assert.match(source, /FloatingSurface|FloatingLayoutManager/);
  assert.doesNotMatch(sources.join("\n"), /fixed bottom-/);
});

test("layout reserves safe content and supports mobile fullscreen reduced motion", () => {
  const css = read("app/globals.css");
  assert.match(css, /gap:16px/);
  assert.match(css, /--vayon-floating-safe-bottom/);
  assert.match(css, /--vayon-floating-safe-right/);
  assert.match(css, /height:100dvh/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test("universal empty state provides onboarding resources and scoped dismissal", () => {
  const empty = read("features/vayon/empty-states/UniversalEmptyState.tsx");
  for (const value of ["data-empty-state", "Primary", "Watch tutorial", "Documentation", "workspace", "user", "localStorage"])
    assert.match(empty, new RegExp(value, "i"));
  assert.match(read("features/vayon/workspace-engine/components/WorkspaceEngine.tsx"), /UniversalEmptyState/);
});

test("required UX audit documentation exists", () => {
  for (const path of ["docs/UNIVERSAL_LAYOUT_AUDIT.md", "docs/FLOATING_COMPONENT_GUIDELINES.md", "docs/EMPTY_STATE_GUIDELINES.md"])
    assert.ok(read(path).length > 500);
});
