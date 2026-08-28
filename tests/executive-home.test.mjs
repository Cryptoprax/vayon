import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Founder Command Center route and default landing are registered", () => {
  assert.match(read("app/vayon/home/page.tsx"), /FounderCommandCenter/);
  assert.match(read("app/vayon/page.tsx"), /redirect\(query\.welcome === "1" \? "\/vayon\/home\?welcome=1" : "\/vayon\/home"\)/);
  const navigation = read("features/platform/builder/config/vayon-navigation.ts");
  assert.match(navigation, /label: "Home", href: "\/vayon\/home"/);
});

test("Executive Home contains every requested experience section", () => {
  const model = read("features/vayon/executive-home/view-models/executive-home.ts");
  for (const section of ["Morning Brief", "Today's Priorities", "Opportunity Center", "Risk Center", "Timeline Highlights", "Calendar Snapshot", "Workforce Activity", "Growth Snapshot", "Communication Snapshot", "Financial Snapshot"]) assert.match(model, new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  const component = read("features/vayon/executive-home/components/ExecutiveHome.tsx");
  assert.match(read("features/vayon/executive-home/components/NarrativePanel.tsx"), /Executive Narrative/);
  assert.match(component, /BusinessHealth/);
});

test("narrative engine is structured rules only and awaits real data", () => {
  const source = read("features/vayon/executive-home/services/narrative-engine.ts");
  assert.match(source, /Awaiting connected business data\./);
  assert.match(source, /generatedBy: "structured-rules"/);
  assert.doesNotMatch(source, /openai|anthropic|gemini|prompt|completion|generateText|fetch\(/i);
});

test("business health exposes future score calculation and confidence without values", () => {
  const contracts = read("features/vayon/executive-home/domain/contracts.ts");
  const model = read("features/vayon/executive-home/view-models/executive-home.ts");
  for (const field of ["score?", "confidence?", "calculationStatus"]) assert.match(contracts, new RegExp(field.replace("?", "\\?")));
  assert.match(model, /calculationStatus: "not-configured"/);
  assert.doesNotMatch(model, /score:\s*\d|confidence:\s*\d/);
});

test("executive cards and context widgets are reusable", () => {
  assert.match(read("features/vayon/executive-home/components/ExecutiveCard.tsx"), /export function ExecutiveCard/);
  assert.match(read("features/vayon/executive-home/components/ContextWidget.tsx"), /export function ContextWidget/);
  assert.match(read("features/vayon/executive-home/components/AwaitingData.tsx"), /AWAITING_BUSINESS_DATA/);
});

test("layout engine supports role layouts but cannot persist", () => {
  const contracts = read("features/vayon/executive-home/layout/contracts.ts");
  const service = read("features/vayon/executive-home/layout/executive-layout.service.ts");
  for (const role of ["executive", "sales-leader", "operations-leader", "custom"]) assert.match(contracts, new RegExp(role));
  assert.match(service, /accepted: false/);
  assert.match(service, /persistence-unavailable/);
  assert.doesNotMatch(service, /localStorage|createClient|supabase|fetch\(/i);
});

test("Executive Home has no APIs AI schema access or fabricated metrics", () => {
  const files = ["domain/contracts.ts", "services/narrative-engine.ts", "layout/executive-layout.service.ts", "view-models/executive-home.ts", "components/ExecutiveHome.tsx"].map(file => read(`features/vayon/executive-home/${file}`)).join("\n");
  assert.doesNotMatch(files, /fetch\(|axios|createClient|supabase|\.from\(|\.rpc\(|openai|anthropic|gemini|revenue:\s*\d|conversion:\s*\d|pipeline:\s*\d/i);
});

test("release documentation and ADR are registered", () => {
  assert.match(read("docs/RELEASE_1_4_EXECUTIVE_HOME.md"), /Release 1\.4/);
  assert.match(read("docs/adr/ADR-0014-executive-home.md"), /# ADR-0014/);
});
