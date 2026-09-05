import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("premium welcome is brief, skippable, accessible, and shown once", () => {
  const welcome = read(
    "features/onboarding/components/PremiumWelcomeExperience.tsx",
  );
  const shell = read("features/vayon/components/ProductExperience.tsx");
  for (const value of [
    "Building Your AI Real Estate Company",
    "Hiring Sales Manager",
    "Training AI Team",
    "Connecting Intelligence",
    "Meet Your AI Team",
    "Skip",
    "650",
    "prefers-reduced-motion",
    "localStorage",
    "aria-live",
  ])
    assert.match(welcome, new RegExp(value));
  assert.match(shell, /PremiumWelcomeExperience/);
});

test("AI concierge and workspace health are personalized and evidence based", () => {
  const setup = read("features/onboarding/components/WorkspaceSetupCenter.tsx");
  for (const value of [
    "Welcome {userName}",
    "I've already prepared your workspace",
    "Brand",
    "Email",
    "Calendar",
    "Marketing",
    "AI Workforce",
    "Automation",
    "Security",
    "Billing",
    "Knowledge",
    "Complete",
    "Partial",
    "Not Configured",
  ])
    assert.match(setup, new RegExp(value.replace(/[{}]/g, "\\$&")));
});

test("new workspaces receive visual identity and actionable executive cards", () => {
  const switcher = read(
    "features/vayon/product-shell/WorkspaceSwitcher.tsx",
  );
  const shell = read("features/vayon/components/VayonShell.tsx");
  const cards = read(
    "features/vayon/executive-home/components/ExecutiveActivationCards.tsx",
  );
  assert.match(switcher, /slice\(0,2\)/);
  assert.match(switcher, /toUpperCase/);
  assert.match(switcher, /from-vds-primary to-vds-accent/);
  assert.match(shell, /AI business workspace/);
  for (const value of [
    "No revenue yet",
    "Create first opportunity",
    "Import contacts",
    "Create AI employee",
    "Generate campaign",
  ])
    assert.match(cards, new RegExp(value));
});

test("empty product modules offer direct, honest next actions", () => {
  const sources = [
    "features/vayon/crm-engine/components/CrmDirectory.tsx",
    "app/vayon/ai/workforce/page.tsx",
    "features/vayon/campaign-studio/CampaignStudio.tsx",
    "features/vayon/document-studio/DocumentStudio.tsx",
    "features/vayon/image-studio/ImageStudio.tsx",
    "features/vayon/video-studio/VideoStudio.tsx",
  ].map(read).join("\n");
  for (const value of [
    "Let's build your customer pipeline",
    "Sales Agent",
    "Marketing Agent",
    "Support Agent",
    "Create your first AI campaign",
    "Generate your first proposal",
    "Create your first campaign image",
    "Create your first marketing video",
    "Generate with AI",
  ])
    assert.match(sources, new RegExp(value));
});

test("Sprint 147 remains a presentation-layer change", () => {
  const state = read("features/vayon/components/SmartEmptyState.tsx");
  assert.doesNotMatch(state, /fetch\(|supabase|database|billing|provider/i);
  assert.match(state, /ButtonLink/);
  assert.match(state, /motion-reduce/);
});
