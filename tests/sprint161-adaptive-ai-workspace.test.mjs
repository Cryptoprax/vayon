import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const adaptive = read("features/vayon/adaptive-workspace/AdaptiveWorkspace.tsx");

test("dashboard adapts to the selected business type", () => {
  for (const business of ["real estate", "marketing agency", "construction", "healthcare", "retail"])
    assert.match(adaptive, new RegExp(business, "i"));
  for (const moduleName of ["Properties", "Buyers", "Campaigns", "Clients", "Projects", "Contracts", "Patients", "Products", "Orders"])
    assert.match(adaptive, new RegExp(moduleName));
  assert.match(read("app/vayon/home/page.tsx"), /configuration\?\.businessType/);
});

test("adaptive home leads with one recommended objective and remembers layout locally", () => {
  for (const value of ["Your recommended objective", "Made for you", "Continue where you left off", "localStorage", "pinned", "hidden", "recents"])
    assert.match(adaptive, new RegExp(value));
  assert.match(adaptive, /aria-pressed/);
  assert.match(adaptive, /motion-reduce:transition-none/);
});

test("global Create consolidates common creation journeys", () => {
  const create = read("features/vayon/product-shell/QuickCreate.tsx");
  for (const item of ["Customer", "Proposal", "Campaign", "AI Employee", "Image", "Video", "Meeting", "Task", "Workflow", "Website", "Presentation"])
    assert.match(create, new RegExp(`label:\"${item}\"`));
  assert.match(create, />Create</);
  assert.match(create, /aria-haspopup="menu"/);
});

test("UX Constitution governs future product experience", () => {
  assert.ok(existsSync("docs/UX_CONSTITUTION.md"));
  const constitution = read("docs/UX_CONSTITUTION.md");
  for (const rule of ["Never ask twice", "Detect automatically", "Recommend everything", "Hide advanced settings", "One primary action", "Fewer than five inputs", "Setup under 60 seconds", "AI should always guide", "Reduce clicks every sprint"])
    assert.match(constitution, new RegExp(rule, "i"));
});
