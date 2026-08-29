import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("floating surfaces share centralized ordering and a single responsive dock", async () => {
  const [manager, css] = await Promise.all([
    read("features/vayon/floating-layout/FloatingLayoutManager.tsx"),
    read("app/globals.css"),
  ]);
  for (const kind of ["banner", "walkthrough", "toast", "assistant", "action", "help"])
    assert.match(manager, new RegExp(`${kind}:\\s*\\d+`));
  assert.match(manager, /ResizeObserver/);
  assert.match(manager, /visualViewport/);
  assert.match(manager, /mutation\.observe\(dock/);
  assert.doesNotMatch(manager, /mutation\.observe\(document\.body|addEventListener\("scroll"/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /env\(safe-area-inset-right\)/);
  assert.match(css, /gap:16px/);
  assert.match(css, /overflow-y:auto/);
  assert.match(css, /max-width:calc\(100vw/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test("VAYON launchers, cards, notices and demo actions register with the dock", async () => {
  const files = await Promise.all([
    read("features/vayon/components/ProductExperience.tsx"),
    read("features/vayon/product-shell/QuickCreate.tsx"),
    read("features/vayon/intelligence-core/components/VayonIntelligence.tsx"),
    read("features/vayon/demo-experience/components/DemoExperience.tsx"),
    read("features/vayon/creative-studio-2/CreativeStudioHome.tsx"),
  ]);
  for (const source of files) assert.match(source, /Floating(LayoutManager|Surface)/);
  assert.doesNotMatch(files[4], /fixed bottom-|fixed right-/);
});

test("expanded surfaces preserve keyboard dismissal and mobile containment", async () => {
  const [assistant, create, css] = await Promise.all([
    read("features/vayon/intelligence-core/components/VayonIntelligence.tsx"),
    read("features/vayon/product-shell/QuickCreate.tsx"),
    read("app/globals.css"),
  ]);
  assert.match(create, /event\.key==="Escape"/);
  assert.match(assistant, /aria-label="Minimize VAYON Copilot"/);
  assert.match(css, /data-expanded/);
  assert.match(css, /height:100dvh/);
});
