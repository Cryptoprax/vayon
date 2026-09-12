import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
function loader(stubs = {}) {
  const cache = new Map();
  function load(file) {
    const filename = [file, file + ".tsx", file + ".ts", file + "/index.ts"].map(value => resolve(value)).find(existsSync);
    if (!filename) throw new Error(`Missing fixture dependency: ${file}`);
    if (cache.has(filename)) return cache.get(filename).exports;
    const loadedModule = { exports: {} }; cache.set(filename, loadedModule);
    const code = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    new Function("require", "module", "exports", code)(name => {
      if (Object.hasOwn(stubs, name)) return stubs[name];
      if (name === "next/link") return function FixtureLink({ children, ...props }) { return React.createElement("a", props, children); };
      if (name === "@/features/platform/design-system") return load("features/platform/design-system/components/core/Actions.tsx");
      if (name.startsWith("@/")) return load(name.slice(2));
      if (name.startsWith(".")) return load(resolve(dirname(filename), name));
      return require(name);
    }, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }
  return load;
}
const load = loader(), layout = load("features/platform/design-system/layout/WorkspaceLayouts.tsx");
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));

test("commercial empty states expose guidance and exactly one optional primary action", () => {
  const html = render(layout.WorkspaceEmptyState, { title: "No clients yet", description: "No relationships have been recorded.", nextStep: "Record a relationship to plan the next conversation.", action: { href: "/vayon/leads/new", label: "Create Lead" } });
  assert.equal((html.match(/<a /g) || []).length, 1);
  assert.match(html, /aria-labelledby=/); assert.match(html, /Record a relationship/);
  const noAction = render(layout.WorkspaceEmptyState, { title: "No matching clients", description: "Adjust the current filters." });
  assert.doesNotMatch(noAction, /<a |<button|Unavailable|AI/);
});
test("pagination boundaries are disabled text instead of keyboard-accessible invalid links", () => {
  const html = render(layout.WorkspacePagination, { page: 1, pageCount: 2, total: 21, nextHref: "?page=2&search=buyer" });
  assert.match(html, /<span aria-disabled="true">Previous<\/span>/);
  assert.match(html, /href="\?page=2&amp;search=buyer"/);
  assert.doesNotMatch(html, /href="[^"]*page=0/);
});
test("shared assistant starts collapsed with an accessible toggle and hidden content", () => {
  const html = render(layout.WorkspaceAssistantDock, { children: React.createElement("input", { "aria-label": "Ask assistant" }) });
  assert.match(html, /aria-expanded="false"/); assert.match(html, /aria-controls=/);
  assert.match(html, /hidden=""/); assert.match(html, /Open assistant/);
  assert.equal((html.match(/data-workspace-assistant=/g) || []).length, 1);
});
test("Leads preserves filters during paging and performs one existing list call", async () => {
  let calls = 0;
  const scoped = loader({
    "@/features/vayon/lead/services/lead.service": { LeadService: class { async list(q) { calls++; return { items: [], count: 41, page: q.page }; } } },
    "@/features/vayon/lead/actions/lead.actions": { bulkLeadAction() {} },
    "@/features/vayon/lead/components/LeadList": { LeadCard: () => null, LeadTable: () => null },
  });
  const Page = scoped("app/vayon/leads/page.tsx").default;
  const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ search: "buyer", page: "2" }) }));
  assert.equal(calls, 1); assert.match(html, /search=buyer&amp;page=1/); assert.match(html, /search=buyer&amp;page=3/);
  assert.equal((html.match(/href="\/vayon\/leads\/new"/g) || []).length, 1);
  assert.match(html, /No leads in this view/);
});
test("all nine commercial primitives are reusable exports without data fetching", () => {
  for (const name of ["WorkspaceHeader", "WorkspaceActionBar", "WorkspaceAttentionPanel", "WorkspaceFilters", "WorkspaceContent", "WorkspaceEmptyState", "WorkspacePagination", "WorkspaceAssistantDock", "WorkspacePageLayout"]) assert.equal(typeof layout[name], "function", name);
  assert.doesNotMatch(readFileSync("features/platform/design-system/layout/WorkspaceLayouts.tsx", "utf8"), /fetch\(|supabase|Repository|Service/);
});
