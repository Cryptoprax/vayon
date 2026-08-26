import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Universal Bar is the single always-visible global entry point", () => {
  const shell = read("features/vayon/components/ProductExperience.tsx"), layout = read("app/vayon/layout.tsx"), bar = read("features/vayon/universal-bar/components/UniversalBar.tsx");
  assert.match(shell, /<UniversalBar navigation=\{vayonNavigation\}/);
  assert.match(bar, /Open Vayon Universal Bar/);
  assert.match(bar, /aria-label="Vayon Universal Bar"/);
  assert.doesNotMatch(layout, /SearchOverlay/);
});

test("search contracts support every approved scope without an index", () => {
  const source = read("features/vayon/universal-bar/domain/contracts.ts");
  for (const scope of ["properties", "leads", "deals", "contacts", "companies", "campaigns", "meetings", "tasks", "documents", "communications", "universal-objects", "business-timeline", "executive-home", "growth", "settings"]) assert.match(source, new RegExp(`\"${scope}\"`));
  const service = read("features/vayon/universal-bar/services/universal-search.service.ts");
  assert.doesNotMatch(service, /createClient|supabase|fetch\(|axios|index/i);
});

test("intent routing is deterministic and covers every approved intent", () => {
  const source = read("features/vayon/universal-bar/services/deterministic-intent-router.ts");
  for (const intent of ["search", "open", "create", "navigate", "recent", "favorites"]) assert.match(source, new RegExp(`type: \"${intent}\"`));
  assert.doesNotMatch(source, /openai|anthropic|gemini|prompt|nlp|fetch\(/i);
});

test("quick create only navigates to existing workflows", () => {
  const source = read("features/vayon/universal-bar/config/quick-create.ts");
  for (const action of ["New Lead", "New Deal", "New Property", "New Campaign", "New Meeting", "New Task", "New Contact", "New Company", "New Document"]) assert.match(source, new RegExp(action));
  assert.doesNotMatch(source, /action:|onSubmit|create[A-Z].*\(|\.rpc\(|fetch\(/);
});

test("local history supports recent pinned and favorites without remote persistence", () => {
  const contracts = read("features/vayon/universal-bar/domain/contracts.ts"), storage = read("features/vayon/universal-bar/storage/local-history.store.ts");
  for (const kind of ["recently-viewed", "recently-opened", "recently-searched", "pinned", "favorites"]) assert.match(contracts, new RegExp(kind));
  assert.match(storage, /window\.localStorage/);
  assert.doesNotMatch(storage, /createClient|supabase|fetch\(|axios|\.rpc\(/i);
});

test("preview contracts cover supported objects using supplied view models", () => {
  const source = read("features/vayon/universal-bar/domain/contracts.ts");
  for (const type of ["property", "lead", "deal", "company", "contact", "campaign", "meeting", "task", "document", "timeline-event"]) assert.match(source, new RegExp(`\"${type}\"`));
  assert.match(read("features/vayon/universal-bar/components/UniversalPreviewCard.tsx"), /UniversalPreviewModel/);
});

test("adaptive suggestions are configurable and contain every approved example", () => {
  const source = read("features/vayon/universal-bar/config/adaptive-suggestions.ts");
  for (const suggestion of ["Search properties", "Create a lead", "Open Executive Home", "Find documents", "Schedule meeting", "Open Timeline", "Open Growth Hub"]) assert.match(source, new RegExp(suggestion));
  assert.match(read("features/vayon/universal-bar/components/UniversalBar.tsx"), /suggestions = defaultAdaptiveSuggestions/);
});

test("keyboard model covers shortcuts navigation selection and focus restoration", () => {
  const source = read("features/vayon/universal-bar/components/UniversalBar.tsx");
  assert.match(source, /event\.metaKey \|\| event\.ctrlKey/);
  for (const key of ["Escape", "ArrowDown", "ArrowUp", "Enter"]) assert.match(source, new RegExp(`event.key === \"${key}\"`));
  assert.match(source, /trigger\.current\?\.focus\(\)/);
  assert.match(source, /onMouseEnter/);
  assert.match(source, /role="combobox"/);
});

test("Ask connects the third mode to the local context-aware Copilot", () => {
  const source = read("features/vayon/universal-bar/components/UniversalBar.tsx");
  assert.match(source, /"search", "actions", "ask"/);
  assert.doesNotMatch(source, /disabled=\{item === "ask"\}/);
  assert.match(source, /vayon:copilot:open/);
  assert.match(source, /Actions remain user initiated\./);
  assert.doesNotMatch(source, /openai|anthropic|gemini|fetch\(|axios/i);
});

test("release documentation and ADR are registered", () => {
  assert.match(read("docs/RELEASE_1_6_UNIVERSAL_BAR.md"), /Release 1\.6/);
  assert.match(read("docs/adr/ADR-0016-universal-bar.md"), /# ADR-0016/);
});
