import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const walk = (directory) => readdirSync(join(root, directory), { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name).replaceAll("\\", "/");
  return entry.isDirectory() ? walk(path) : [path];
});
const sourceFiles = [...walk("app/vayon"), ...walk("features/vayon")].filter((path) => /\.(tsx|css)$/.test(path));
const violations = sourceFiles.flatMap((path) => {
  const source = read(path);
  return /(?:fixed[^"'\n]{0,80}\bbottom-|sticky\s+bottom-)/.test(source) ? [path] : [];
});
const manager = read("features/vayon/floating-layout/FloatingLayoutManager.tsx");
const css = read("app/globals.css");
const experience = read("features/vayon/components/ProductExperience.tsx");
const demo = read("features/vayon/demo-experience/components/DemoExperience.tsx");
const empty = read("features/vayon/empty-states/UniversalEmptyState.tsx");
const authenticatedPages = walk("app/vayon").filter((path) => path.endsWith("/page.tsx")).length;
const checks = {
  centralizedRegistration: /register\(\{ id, kind, priority, expanded \}\)/.test(manager),
  measuredDock: /ResizeObserver/.test(manager) && /visualViewport/.test(manager),
  environmentAwareness: /floatingViewport/.test(manager) && /floatingZoom/.test(manager) && /floatingSidebar/.test(manager),
  safeContent: /--vayon-floating-safe-bottom/.test(css) && /--vayon-floating-safe-right/.test(css),
  sixteenPixelStack: /gap:16px/.test(css),
  mobileFullscreen: /max-width:767px/.test(css) && /height:100dvh/.test(css),
  reducedMotion: /prefers-reduced-motion:reduce/.test(css),
  applicationManaged: /FloatingLayoutManager/.test(experience),
  demoManaged: /FloatingLayoutManager/.test(demo),
  accessibleEmptyState: /data-empty-state/.test(empty) && /aria-labelledby/.test(empty),
  rememberedDismissal: /workspace.*user.*module/.test(empty) && /localStorage/.test(empty),
  documentation: ["docs/UNIVERSAL_LAYOUT_AUDIT.md", "docs/FLOATING_COMPONENT_GUIDELINES.md", "docs/EMPTY_STATE_GUIDELINES.md"].every((path) => { try { read(path); return true; } catch { return false; } }),
};
console.log(`Floating layout audit: ${authenticatedPages} authenticated routes source-audited.`);
console.log(`Unmanaged bottom-floating surfaces: ${violations.length}.`);
for (const [name, passed] of Object.entries(checks)) console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
if (violations.length) console.error(violations.join("\n"));
if (violations.length || Object.values(checks).some((passed) => !passed)) process.exitCode = 1;
