import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("theme architecture exposes provider context and all production modes", () => {
  const contracts = read("features/platform/design-system/theme/contracts.ts"), provider = read("features/platform/design-system/theme/ThemeProvider.tsx");
  for (const mode of ["dark", "light", "system"]) assert.match(contracts, new RegExp(`\"${mode}\"`));
  assert.match(provider, /export const ThemeContext/);
  assert.match(provider, /export function VdsThemeProvider/);
  assert.match(provider, /export function useVdsTheme/);
});

test("system theme detection is automatic and live", () => {
  const provider = read("features/platform/design-system/theme/ThemeProvider.tsx"), bootstrap = read("features/platform/design-system/theme/ThemeBootstrap.tsx");
  assert.match(provider, /prefers-color-scheme: dark/);
  assert.match(provider, /matchMedia/);
  assert.match(provider, /addEventListener\("change"/);
  assert.match(bootstrap, /matchMedia\('\(prefers-color-scheme: dark\)'\)/);
});

test("theme preference persists only in browser local storage", () => {
  const provider = read("features/platform/design-system/theme/ThemeProvider.tsx");
  assert.match(provider, /window\.localStorage\.setItem/);
  assert.match(provider, /window\.localStorage\.getItem/);
  assert.doesNotMatch(provider, /createClient|supabase|fetch\(|axios|\.rpc\(|\.from\(/i);
});

test("bootstrap applies appearance before hydrated content", () => {
  const layout = read("app/layout.tsx"), bootstrap = read("features/platform/design-system/theme/ThemeBootstrap.tsx");
  assert.match(layout, /<head>\s*<ThemeBootstrap \/>\s*<\/head>/);
  assert.match(layout, /suppressHydrationWarning/);
  assert.match(bootstrap, /document\.documentElement\.dataset\.vdsTheme/);
});

test("light theme uses premium warm neutrals without pure black or white", () => {
  const css = read("features/platform/design-system/tokens/vds.css"), light = css.slice(css.indexOf('[data-vds-theme="light"]'), css.indexOf(":root { --background"));
  for (const value of ["#eeeae2", "#f7f3ec", "#e7e1d7", "#292722"]) assert.match(light, new RegExp(value));
  assert.doesNotMatch(light, /#000(?:000)?\b|#fff(?:fff)?\b/i);
});

test("header theme toggle is accessible and mode aware", () => {
  const toggle = read("features/platform/design-system/theme/ThemeToggle.tsx"), header = read("features/vayon/components/ProductExperience.tsx");
  assert.match(toggle, /Moon/);
  assert.match(toggle, /Sun/);
  assert.match(toggle, /Laptop/);
  assert.match(toggle, /aria-label=/);
  assert.match(header, /<ThemeToggle compact\/>/);
});

test("Appearance Settings exposes accessible dark light and system choices", () => {
  const page = read("app/vayon/settings/appearance/page.tsx"), settings = read("features/platform/design-system/theme/AppearanceSettings.tsx"), navigation = read("features/platform/builder/config/vayon-navigation.ts");
  assert.match(page, /AppearanceSettings/);
  assert.match(settings, /role="radiogroup"/);
  assert.match(settings, /role="radio"/);
  assert.match(settings, /aria-checked/);
  assert.match(navigation, /href: "\/vayon\/settings\/appearance"/);
});

test("theme transitions respect reduced motion and accessible semantic tokens", () => {
  const css = read("features/platform/design-system/tokens/vds.css");
  assert.match(css, /vds-theme-ready/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  for (const token of ["foreground", "muted", "primary", "success", "warning", "danger", "info", "border", "focus"]) assert.match(css, new RegExp(`--vds-color-${token}`));
});

test("theme release has no backend database or AI integration", () => {
  const files = ["theme/contracts.ts", "theme/ThemeProvider.tsx", "theme/ThemeBootstrap.tsx", "theme/ThemeToggle.tsx", "theme/AppearanceSettings.tsx"].map(file => read(`features/platform/design-system/${file}`)).join("\n");
  assert.doesNotMatch(files, /createClient|supabase|fetch\(|axios|\.rpc\(|\.from\(|insert\(|update\(|delete\(|upsert\(|openai|anthropic|gemini/i);
});
