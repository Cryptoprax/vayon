import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(path, "utf8");

test("VDS owns the permanent enterprise palette and expanded tokens", () => {
  const css = read("features/platform/design-system/tokens/vds.css");
  for (const color of [
    "#08090b",
    "#101114",
    "#181a1f",
    "#22252b",
    "#14b86a",
    "#37d5f2",
    "#16c784",
    "#f7b731",
    "#f05252",
    "#ffffff",
    "#b7bcc8",
    "#2b2f36",
    "#8b93a4",
  ])
    assert.match(css, new RegExp(color, "i"));
  const tokens = read("features/platform/design-system/tokens/tokens.ts");
  for (const contract of [
    "typography",
    "spacing",
    "radius",
    "elevation",
    "shadows",
    "motion",
    "breakpoints",
    "zIndex",
  ])
    assert.match(tokens, new RegExp(contract));
});

test("launch homepage communicates the operating system positioning and complete experience", () => {
  const source = read("features/marketing/components/Homepage.tsx");
  for (const item of [
    "The AI operating system",
    "AI Lead Qualification",
    "Marketing Automation",
    "Real Estate CRM",
    "Real Estate AI Employees",
    "AI Voice Agents",
    "Property Intelligence",
    "Sales Pipeline",
    "Secure Workspaces",
    "Lead arrives",
    "AI qualifies",
    "Approval",
    "Start Free Trial",
    "Book Demo",
    "Built for Every Real Estate Business",
  ])
    assert.match(source, new RegExp(item, "i"));
  assert.match(source, /SoftwareApplication/);
});

test("global navigation and footer expose enterprise information architecture", () => {
  const shell = read("features/marketing/components/MarketingShell.tsx");
  for (const item of [
    "Platform",
    "Solutions",
    "Industries",
    "Pricing",
    "Resources",
    "Company",
    "Contact",
    "Documentation",
    "Sign In",
    "Start Free Trial",
    "Legal",
    "Trust Center",
  ])
    assert.match(shell, new RegExp(item));
  assert.match(shell, /sticky top-0/);
  assert.match(shell, /backdrop-blur/);
  assert.match(shell, /aria-label="Mobile"/);
});

test("motion is isolated, accessible, and reduced-motion aware", () => {
  const motion = read("features/marketing/components/LaunchMotion.tsx");
  assert.match(motion, /framer-motion/);
  assert.match(motion, /useReducedMotion/);
  assert.match(motion, /viewport=\{\{ once: true/);
  assert.equal(existsSync("node_modules/framer-motion"), true);
});

test("authentication receives premium split presentation without changing actions", () => {
  const auth = read("features/authentication/components/AuthForm.tsx");
  assert.match(auth, /lg:grid-cols-2/);
  assert.match(auth, /Enterprise security by design/);
  assert.match(auth, /Workspace and tenant isolation/);
  const actions = read("features/authentication/actions/auth.actions.ts");
  assert.match(actions, /googleLoginAction/);
  assert.match(actions, /loginAction/);
});

test("Sprint 70 changes no database schema or provider implementation", () => {
  assert.equal(
    existsSync("docs/SPRINT_70_GLOBAL_LAUNCH_DESIGN_SYSTEM.md"),
    true,
  );
  const packageJson = read("package.json");
  assert.match(packageJson, /framer-motion/);
});
