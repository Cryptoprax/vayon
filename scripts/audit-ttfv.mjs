import { readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const adaptive = read("features/vayon/adaptive-workspace/AdaptiveWorkspace.tsx");
const observer = read("features/vayon/ttfv/TTFVObserver.tsx");
const events = read("features/vayon/ttfv/ttfv-events.ts");
const home = read("app/vayon/home/page.tsx");
const failures = [];
const requireText = (source, pattern, message) => { if (!pattern.test(source)) failures.push(message); };

requireText(adaptive, /Your recommended objective/, "Home must present one recommended objective.");
requireText(adaptive, /ready to launch/, "Home must show launch readiness.");
requireText(adaptive, /aria-label="Contextual hint"/, "The contextual hint must be identifiable and non-blocking.");
requireText(adaptive, /Dismiss hint/, "The contextual hint must be dismissible.");
requireText(adaptive, /Explore Demo Workspace|Use Sample Data/, "A sample workspace path must be offered.");
requireText(events, /first_ai_employee.*first_crm_contact.*first_campaign.*first_proposal.*first_upgrade/s, "Required TTFV milestones must be declared.");
requireText(observer, /checkout.*success/s, "Successful first upgrades must be observed.");
requireText(home, /!onboarding\?\.completed_at.*WorkspaceSetupCenter/s, "First-run setup guidance must only render while onboarding is incomplete.");
for (const match of adaptive.matchAll(/journey:\s*\[(.*?)\], modules:/gs)) {
  const actions = (match[1].match(/id:/g) ?? []).length;
  if (actions > 5) failures.push(`A first-value journey has ${actions} actions; maximum is 5.`);
}
if (failures.length) { console.error(failures.map((failure) => `FAIL: ${failure}`).join("\n")); process.exit(1); }
console.log("TTFV audit passed: focused journeys, progress, hint, samples, and milestone instrumentation are present.");
