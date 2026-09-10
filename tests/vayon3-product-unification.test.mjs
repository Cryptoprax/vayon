import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { auditUnification, loadPureModule } from "../scripts/audit-product-unification.mjs";

test("VAYON 3 navigation, search and journey source audit passes", () => {
  assert.deepEqual(auditUnification().issues, []);
});

test("search matches multi-word actions and never exposes actions from an empty permitted catalog", () => {
  const { StaticNavigationSearchProvider } = loadPureModule("features/vayon/universal-bar/providers/static-navigation.provider.ts");
  const provider = new StaticNavigationSearchProvider([{id:"properties", label:"Properties", href:"/vayon/properties", visible:true}]);
  assert.ok(provider.search({query:"create property",scopes:provider.scopes}).some(item=>item.href==="/vayon/properties/new"));
  assert.equal(provider.search({query:"create company",scopes:provider.scopes}).length,0);
});

test("history and frequent items are isolated between workspaces", () => {
  const { LocalUniversalBarHistory } = loadPureModule("features/vayon/universal-bar/storage/local-history.store.ts");
  const values=new Map();
  globalThis.window={localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}};
  try {
    const first=new LocalUniversalBarHistory("user:workspace-a"), second=new LocalUniversalBarHistory("user:workspace-b");
    const item={id:"property-1",label:"Villa",href:"/vayon/properties/1",kind:"recently-opened",recordedAt:"2026-09-08T00:00:00Z"};
    first.record(item);first.record(item);
    assert.equal(first.list()[0].visits,2);
    assert.equal(second.list().length,0);
  } finally { delete globalThis.window; }
});

test("canonical creative destinations render their implementation instead of redirecting back", () => {
  for(const section of ["assets","templates","calendar"]) {
    const source=readFileSync(`app/vayon/creative/${section}/page.tsx`,"utf8");
    assert.match(source,/export \{ default \} from/);
    assert.doesNotMatch(source,/redirect\(/);
  }
});

test("record search authenticates once at entry and retains tenant service boundaries", () => {
  const source=readFileSync("features/vayon/universal-bar/actions/search.actions.ts","utf8");
  assert.match(source,/WorkspacePermissionService\(\)\.context\(\)/);
  assert.match(source,/evaluateWorkspacePermission/);
  assert.match(source,/canViewPath/);
  assert.match(source,/query\.length > 100/);
  assert.doesNotMatch(source,/\.from\(|\.rpc\(|new GovernanceService|service_role/);
});

test("Product Bible search puts Create Property ahead of documentation and records", () => {
  const { rankUniversalResults } = loadPureModule("features/vayon/universal-bar/services/universal-search.service.ts");
  const { quickCreateActions } = loadPureModule("features/vayon/universal-bar/config/quick-create.ts");
  const action = quickCreateActions.find(item => item.id === "create-property");
  const record = { ...action, id: "record-1", kind: "record", label: "Create Property guide", href: "/vayon/properties/one" };
  const docs = { ...action, id: "docs-1", kind: "navigation", label: "Create Property", href: "/docs/properties" };
  for (const query of ["Create Property", "new property", "ADD PROPERTY"]) {
    const results = rankUniversalResults([docs, record, action], query);
    assert.equal(results[0].label, "Create Property");
    assert.equal(results[0].href, "/vayon/properties/new");
    assert.equal(results[0].kind, "quick-create");
  }
});

test("Product Bible deduplicates destinations without discarding distinct list records", () => {
  const { rankUniversalResults } = loadPureModule("features/vayon/universal-bar/services/universal-search.service.ts");
  const base = { scope:"tasks", keywords:[], description:"", href:"/vayon/tasks" };
  const results = rankUniversalResults([
    {...base,id:"page",label:"Tasks",kind:"navigation"},
    {...base,id:"action",label:"Create Task",kind:"quick-create"},
    {...base,id:"task-a",label:"Call buyer",kind:"record"},
    {...base,id:"task-b",label:"Arrange viewing",kind:"record"},
  ], "Create Task");
  assert.equal(results[0].id,"action");
  assert.equal(results.length,3);
  assert.ok(results.some(item=>item.id==="task-a"));
  assert.ok(results.some(item=>item.id==="task-b"));
});

test("Product Bible onboarding does not claim completion from a partial activity window", () => {
  const source = readFileSync("features/vayon/dashboard/components/GettingStartedChecklist.tsx","utf8");
  assert.doesNotMatch(source, /percentage|% complete|Workspace completion/);
  assert.match(source,/Suggested next step/);
  assert.ok(source.indexOf('"Create First Task"') < source.indexOf('"Promote a Property"'));
  assert.match(source,/<details/);
});
