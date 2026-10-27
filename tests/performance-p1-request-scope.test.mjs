// PERFORMANCE P1: request-scoped identity memoization, proxy query reduction, dashboard column narrowing,
// and the shell/login/homepage contracts. Offline only: every Supabase client is a local double, and the
// request-scope tests run the services inside React's real server (Flight) renderer, which is what gives
// React cache() its per-request scope in Next.js.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { createRequire, Module } from "node:module";
import { AsyncLocalStorage } from "node:async_hooks";
import { Writable } from "node:stream";
import ts from "typescript";

const require = createRequire(import.meta.url);
const read = (path) => readFileSync(path, "utf8");

// React's server build (the "react-server" condition Next.js uses for Server Components).
const reactServer = join(process.cwd(), "node_modules/next/dist/compiled/react/react.react-server.js");
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  return request === "react" ? reactServer : resolveFilename.call(this, request, ...rest);
};
const React = require(reactServer);
const { renderToPipeableStream } = require(join(process.cwd(), "node_modules/next/dist/compiled/react-server-dom-webpack/server.node.js"));

function load(file, mocks = {}, cache = new Map()) {
  const filename = resolve(file);
  if (cache.has(filename)) return cache.get(filename).exports;
  const mod = { exports: {} };
  cache.set(filename, mod);
  const code = ts.transpileModule(read(filename), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function("require", "module", "exports", code)((name) => {
    if (name in mocks) return mocks[name];
    if (name === "server-only") return {};
    if (name === "react") return React;
    if (name.startsWith(".") || name.startsWith("@/")) {
      const stem = name.startsWith("@/") ? resolve(name.slice(2)) : resolve(dirname(filename), name);
      return load(existsSync(stem + ".ts") ? stem + ".ts" : stem + ".tsx", mocks, cache);
    }
    return require(name);
  }, mod, mod.exports);
  return mod.exports;
}

// One server request = one Flight render, run inside the request's own "cookie" (the signed-in user).
const session = new AsyncLocalStorage();
function renderRequest(user, body) {
  return session.run({ user }, () => new Promise((done, fail) => {
    const results = {};
    async function Page() { Object.assign(results, await body()); return "ok"; }
    const stream = renderToPipeableStream(React.createElement(Page), {}, { onError: fail });
    stream.pipe(new Writable({ write(_chunk, _encoding, next) { next(); }, final(next) { done(results); next(); } }));
  }));
}

// Per-tenant database double. Counts auth round trips and context reads; rows are keyed by user id.
function identityWorld() {
  const counts = { getUser: 0, context: 0, membership: 0 };
  const tenants = {
    "user-a": { organization: { id: "org-a", name: "Org A" }, workspace: { id: "ws-a", name: "Workspace A" }, role: "organization_owner" },
    "user-b": { organization: { id: "org-b", name: "Org B" }, workspace: { id: "ws-b", name: "Workspace B" }, role: "sales_representative" },
  };
  const client = () => {
    const user = session.getStore()?.user ?? null;
    return {
      auth: { async getUser() { counts.getUser++; await new Promise((r) => setTimeout(r, 2)); return { data: { user: user ? { id: user, app_metadata: {} } : null }, error: user ? null : new Error("no session") }; } },
      from(table) {
        const filters = {};
        const query = {
          select() { return query; }, eq(column, value) { filters[column] = value; return query; }, limit() { return query; },
          async maybeSingle() {
            await new Promise((r) => setTimeout(r, 2));
            const tenant = tenants[filters.user_id];
            if (table === "user_organization_context") { counts.context++; return { data: tenant ? { organizations: tenant.organization, workspaces: tenant.workspace } : null }; }
            if (table === "workspace_members") {
              counts.membership++;
              const ok = tenant && filters.organization_id === tenant.organization.id && filters.workspace_id === tenant.workspace.id;
              return { data: ok ? { roles: { code: tenant.role } } : null, error: null };
            }
            return { data: null };
          },
        };
        return query;
      },
    };
  };
  const mocks = { "@/lib/supabase/server": { createSupabaseServerClient: async () => client() }, "@/lib/observability/logger": { log() {} } };
  const shared = new Map();
  const services = {
    ...load("features/onboarding/services/organization.service.ts", mocks, shared),
    ...load("features/onboarding/services/workspace.service.ts", mocks, shared),
    ...load("features/platform/permissions/runtime/permission.service.ts", mocks, shared),
    ...load("lib/supabase/request-identity.ts", mocks, shared),
    ...load("features/vayon/operations/services/context.ts", mocks, shared),
  };
  return { counts, services, tenants };
}

// What one shell + page render asks for: the shell's user/organization/permission lookups and a page's
// operationsContext()/permission check, several times over as independent components do.
async function shellAndPage({ OrganizationService, WorkspaceService, WorkspacePermissionService, requestAuthUser, operationsContext }) {
  const [user, organization, workspace, authorization] = await Promise.all([
    requestAuthUser(), new OrganizationService().current(), new WorkspaceService().first(), new WorkspacePermissionService().context(),
  ]);
  const pageContexts = await Promise.all([operationsContext(), operationsContext(), operationsContext()]);
  const pagePermission = await new WorkspacePermissionService().require("leads", "view");
  return { user: user?.id, organization: organization?.id, workspace: workspace?.id, role: authorization.role, actor: authorization.actorId, pageWorkspaces: pageContexts.map((c) => c.workspaceId), pageActor: pagePermission.actorId };
}

test("identity is resolved once per request: one getUser, one context read, one membership read", async () => {
  const { counts, services } = identityWorld();
  const result = await renderRequest("user-a", () => shellAndPage(services));
  assert.deepEqual(result, { user: "user-a", organization: "org-a", workspace: "ws-a", role: "organization_owner", actor: "user-a", pageWorkspaces: ["ws-a", "ws-a", "ws-a"], pageActor: "user-a" });
  // Before P1 the same calls made 1 + 3 (operationsContext: org + workspace) x 5 + permission getUser x 2.
  assert.equal(counts.getUser, 2, "the shared request user plus the permission context's own session read");
  assert.equal(counts.context, 2, "organization and workspace context each read once");
  assert.equal(counts.membership, 1, "the permission context is read once and reused by require()");
});

test("separate requests never share identity: each re-verifies with Supabase", async () => {
  const { counts, services } = identityWorld();
  await renderRequest("user-a", () => shellAndPage(services));
  const first = { ...counts };
  await renderRequest("user-a", () => shellAndPage(services));
  assert.deepEqual({ getUser: counts.getUser - first.getUser, context: counts.context - first.context, membership: counts.membership - first.membership }, first, "a second request repeats every lookup");
});

test("cross-tenant isolation: concurrent requests for two tenants each see only their own identity", async () => {
  const { services } = identityWorld();
  const [a, b, anonymous] = await Promise.all([
    renderRequest("user-a", () => shellAndPage(services)),
    renderRequest("user-b", () => shellAndPage(services)),
    renderRequest(null, async () => ({ user: (await services.requestAuthUser())?.id ?? null, organization: (await new services.OrganizationService().current())?.id ?? null })),
  ]);
  assert.deepEqual(a, { user: "user-a", organization: "org-a", workspace: "ws-a", role: "organization_owner", actor: "user-a", pageWorkspaces: ["ws-a", "ws-a", "ws-a"], pageActor: "user-a" });
  assert.deepEqual(b, { user: "user-b", organization: "org-b", workspace: "ws-b", role: "sales_representative", actor: "user-b", pageWorkspaces: ["ws-b", "ws-b", "ws-b"], pageActor: "user-b" });
  assert.deepEqual(anonymous, { user: null, organization: null });
});

test("outside a server render nothing is memoized (route handlers, plain calls)", async () => {
  const { counts, services } = identityWorld();
  await session.run({ user: "user-a" }, async () => { await services.requestAuthUser(); await services.requestAuthUser(); });
  assert.equal(counts.getUser, 2);
});

test("a missing organization is not kept, so a lookup after an in-request bootstrap sees the new tenant", async () => {
  const { services, tenants } = identityWorld();
  const saved = tenants["user-a"];
  delete tenants["user-a"];
  const result = await renderRequest("user-a", async () => {
    const before = await new services.OrganizationService().current();
    tenants["user-a"] = saved; // WorkspaceBootstrapService provisions inside the same request.
    const after = await new services.OrganizationService().current();
    const context = await services.operationsContext();
    return { before, after: after?.id, workspace: context.workspaceId };
  });
  assert.deepEqual(result, { before: null, after: "org-a", workspace: "ws-a" });
});

test("permission failures are not kept: every denied check re-reads membership and is re-audited", async () => {
  const { counts, services, tenants } = identityWorld();
  tenants["user-a"].role = "not-a-role";
  const denials = await renderRequest("user-a", async () => {
    const outcomes = [];
    for (let i = 0; i < 2; i++) outcomes.push(await new services.WorkspacePermissionService().context().then(() => "allowed", (error) => error.name));
    return { outcomes };
  });
  assert.deepEqual(denials.outcomes, ["WorkspacePermissionError", "WorkspacePermissionError"]);
  assert.equal(counts.membership, 2);
});

test("returned identity objects are copies, so one caller cannot alter another's view", async () => {
  const { services } = identityWorld();
  const result = await renderRequest("user-a", async () => {
    const first = await new services.OrganizationService().current();
    first.id = "tampered";
    return { second: (await new services.OrganizationService().current()).id };
  });
  assert.equal(result.second, "org-a");
});

test("request memo keeps no module-level identity state", () => {
  const source = read("lib/supabase/request-identity.ts");
  assert.match(source, /import \{ cache \} from "react"/);
  assert.match(source, /const slot = cache\(/);
  assert.doesNotMatch(source.replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, ""), /new Map|globalThis|let \w+\s*[:=]/);
  for (const file of ["features/onboarding/services/organization.service.ts", "features/onboarding/services/workspace.service.ts"]) {
    assert.match(read(file), /requestAuthUser\(\)/);
    assert.doesNotMatch(read(file), /auth\.getUser\(\)/);
  }
});

// ---- Proxy: skipped visibility queries never change a decision.
const policy = load("features/platform/visibility/policy.ts");
const platformRoles = [undefined, "founder", "platform_owner", "super_admin", "super_platform_admin", "member", "workspace-member"];
const workspaceRoles = [undefined, "organization_owner", "organization_admin", "manager", "sales_representative", "agent", "viewer", "employee", "unknown"];
const industries = [undefined, ...policy.allIndustries, "unknown"];
const paths = [...new Set([...policy.platformVisibilityRules.flatMap((rule) => [rule.pathPrefix, `${rule.pathPrefix}/child`]), "/vayon", "/vayon/dashboard", "/vayon/leads/123", "/vayon/team/members", "/elsewhere"])];

test("visibility inputs: replacing a skipped input with any value never changes canViewPath()", () => {
  let skippedRole = 0, skippedIndustry = 0;
  for (const path of paths) for (const platformRole of platformRoles) {
    const needs = policy.visibilityInputsForPath(platformRole, path);
    if (!needs.workspaceRole) skippedRole++;
    if (!needs.industry) skippedIndustry++;
    for (const workspaceRole of workspaceRoles) for (const industry of industries) {
      const decide = (w, i) => { const role = policy.normalizeVisibilityRole(platformRole, w); return policy.canViewPath({ role, founder: role === "Founder" || role === "Super Admin", industry: policy.normalizeIndustry(i) }, path); };
      const full = decide(workspaceRole, industry);
      for (const w of needs.workspaceRole ? [workspaceRole] : workspaceRoles) for (const i of needs.industry ? [industry] : industries)
        assert.equal(decide(w, i), full, `${path} ${platformRole} ${workspaceRole} ${industry}`);
    }
  }
  assert.ok(skippedRole > 0 && skippedIndustry > 0, "the reduction applies to real paths");
  assert.deepEqual(policy.visibilityInputsForPath(undefined, "/vayon/dashboard"), { workspaceRole: false, industry: true });
  assert.deepEqual(policy.visibilityInputsForPath(undefined, "/vayon/team"), { workspaceRole: true, industry: false });
  assert.deepEqual(policy.visibilityInputsForPath("founder", "/vayon/settings"), { workspaceRole: false, industry: false });
});

function proxyWorld({ user, membership = { workspace_id: "ws-a", roles: { code: "sales_representative" } }, industry = "REAL_ESTATE" }) {
  const queries = [];
  class Response { constructor(kind, target, init) { this.kind = kind; this.target = target; this.status = init?.status ?? (kind === "redirect" ? 307 : 200); this.cookies = { set() {} }; } }
  const mocks = {
    "@supabase/ssr": { createServerClient: () => ({
      auth: { async getUser() { return { data: { user } }; } },
      from(table) { queries.push(table); const q = { select() { return q; }, eq() { return q; }, limit() { return q; }, async maybeSingle() { return { data: table === "workspace_members" ? membership : { industry } }; } }; return q; },
    }) },
    "next/server": { NextResponse: { next: () => new Response("next"), redirect: (target) => new Response("redirect", target), rewrite: (target, init) => new Response("rewrite", target, init) } },
    "./config": { getSupabaseConfig: () => ({ url: "https://project.invalid", key: "anon" }) },
  };
  const { refreshSession } = load("lib/supabase/proxy.ts", mocks);
  const request = (path) => ({ nextUrl: { pathname: path, clone() { return { pathname: path, search: "", searchParams: new URLSearchParams() }; } }, cookies: { getAll: () => [], set() {} } });
  return { queries, run: async (path) => { const response = await refreshSession(request(path)); return { kind: response.kind, status: response.status, to: response.target?.pathname }; } };
}

test("proxy: customer paths keep the industry check, role-only paths skip the industry read, founders skip both", async () => {
  const member = { id: "user-a", app_metadata: {} };
  let world = proxyWorld({ user: member });
  assert.deepEqual(await world.run("/vayon/dashboard"), { kind: "next", status: 200, to: undefined });
  assert.deepEqual(world.queries, ["workspace_members", "workspace_industry"]);
  world = proxyWorld({ user: member });
  assert.deepEqual(await world.run("/vayon/team"), { kind: "rewrite", status: 404, to: "/_not-found" }, "an Agent still cannot open /vayon/team");
  assert.deepEqual(world.queries, ["workspace_members"]);
  world = proxyWorld({ user: member, industry: "HEALTHCARE" });
  assert.deepEqual(await world.run("/vayon/leads"), { kind: "rewrite", status: 404, to: "/_not-found" }, "the industry restriction is still enforced");
  world = proxyWorld({ user: { id: "founder", app_metadata: { role: "founder" } } });
  assert.deepEqual(await world.run("/vayon/brain"), { kind: "next", status: 200, to: undefined });
  assert.deepEqual(world.queries, []);
  world = proxyWorld({ user: member });
  assert.deepEqual(await world.run("/vayon/brain"), { kind: "rewrite", status: 404, to: "/_not-found" }, "founder-only 404 is unchanged");
  world = proxyWorld({ user: null });
  assert.deepEqual(await world.run("/vayon/dashboard"), { kind: "redirect", status: 307, to: "/login" });
  world = proxyWorld({ user: member });
  assert.deepEqual(await world.run("/login"), { kind: "redirect", status: 307, to: "/vayon" });
});

test("proxy matcher skips only static assets and public metadata routes", () => {
  const source = read("proxy.ts");
  const matcher = new RegExp(`^${JSON.parse(source.match(/matcher:\s*(\[[\s\S]*?\])/u)[1].replace(/,\s*\]$/u, "]"))[0]}$`, "u");
  for (const path of ["/robots.txt", "/sitemap.xml", "/manifest.webmanifest", "/favicon.ico", "/assets/brand/logo-dark.png", "/api/ai/chat"]) assert.equal(matcher.test(path), false, path);
  for (const path of ["/", "/login", "/vayon", "/vayon/dashboard", "/vayon/robots.txt-notes", "/robots.txtx", "/platform"]) assert.equal(matcher.test(path), true, path);
});

// ---- Dashboard: the narrowed selects cover every column load() reads, and the output is unchanged.
function dashboardRows() {
  const now = Date.now(), at = (days) => new Date(now - days * 86400000).toISOString();
  const wide = (extra) => ({ id: `id-${Math.random().toString(36).slice(2)}`, organization_id: "org-a", workspace_id: "ws-a", description: "x".repeat(200), metadata: { big: true }, ...extra });
  return {
    leads: [0, 1, 3, 9, 40, 200].flatMap((d, i) => [wide({ status: ["new", "converted", "lost", "qualified", "archived", "contacted"][i], created_at: at(d) })]),
    deals: [0, 2, 8, 30, 90].map((d, i) => wide({ status: i % 2 ? "won" : "open", stage_id: ["new_lead", "qualified", "completed", "negotiation", "completed"][i], value: 1000 * (i + 1), currency: "EUR", created_at: at(d + 1), updated_at: at(d) })),
    properties: [0, 3, 10].map((d) => wide({ title: "Villa", created_at: at(d) })),
    invoices: [0, 2, 9, 60].map((d, i) => wide({ status: i === 3 ? "open" : "paid", total: 500 * (i + 1), subtotal: 1, currency: "EUR", paid_at: at(d), created_at: at(d + 1) })),
  };
}
const narrowed = { leads: "id,status,created_at", deals: "id,status,stage_id,value,currency,created_at,updated_at", properties: "id,created_at", invoices: "id,status,total,currency,paid_at" };

function dashboardWorld(rows, { project = false, track = null } = {}) {
  const selected = {};
  const client = {
    from(table) {
      let columns = "*";
      const q = {
        select(value = "*") { columns = value; (selected[table] ??= []).push(value); return q; },
        eq() { return q; }, neq() { return q; }, gte() { return q; }, lte() { return q; }, lt() { return q; }, is() { return q; }, not() { return q; }, order() { return q; }, limit() { return q; },
        async maybeSingle() { return { data: null, error: null }; },
        then(resolveResult, reject) {
          let data = (rows[table] ?? []).map((row) => ({ ...row }));
          if (project && columns !== "*") { const keep = columns.split(","); data = data.map((row) => Object.fromEntries(keep.filter((k) => k in row).map((k) => [k, row[k]]))); }
          if (track && table in narrowed) data = data.map((row) => new Proxy(row, { get(target, key) { if (typeof key === "string") track(table, key); return target[key]; }, ownKeys(target) { track(table, "*spread*"); return Reflect.ownKeys(target); } }));
          return Promise.resolve({ data, error: null, count: 3 }).then(resolveResult, reject);
        },
      };
      return q;
    },
  };
  const mocks = {
    "@/features/vayon/operations/services/context": { operationsContext: async () => ({ client, organizationId: "org-a", workspaceId: "ws-a" }) },
    "@/features/onboarding/services/organization.service": { OrganizationService: class { async current() { return { id: "org-a", name: "Org A" }; } } },
    "@/features/onboarding/services/workspace.service": { WorkspaceService: class { async first() { return { id: "ws-a", name: "Workspace A" }; } } },
  };
  const { ExecutiveDashboardService } = load("features/vayon/dashboard/services/executive-dashboard.service.ts", mocks);
  return { selected, load: () => new ExecutiveDashboardService().load() };
}

test("dashboard: every column load() reads from the four narrowed tables is selected", async () => {
  const read = {};
  const world = dashboardWorld(dashboardRows(), { track: (table, key) => (read[table] ??= new Set()).add(key) });
  await world.load();
  for (const [table, columns] of Object.entries(narrowed)) {
    assert.deepEqual(world.selected[table], [columns], `${table} select list`);
    const used = [...(read[table] ?? [])].filter((key) => !["then", "toJSON", "constructor"].includes(key));
    assert.ok(!used.includes("*spread*"), `${table} rows are never spread`);
    for (const key of used) assert.ok(columns.split(",").includes(key), `${table}.${key} is read but not selected`);
  }
});

test("dashboard: output with narrowed columns is identical to output with full rows", async () => {
  const rows = dashboardRows();
  const full = await dashboardWorld(rows).load();
  const projected = await dashboardWorld(rows, { project: true }).load();
  assert.deepEqual(projected, full);
  assert.ok(full.kpis.find((k) => k.key === "revenue").value > 0 && full.kpis.find((k) => k.key === "pipeline").value > 0, "fixture exercises revenue and pipeline");
  assert.equal(full.currency, "EUR");
});

test("dashboard: every narrowed column exists in the baseline schema", () => {
  const baseline = read("supabase/migrations/20260813000000_sprint22_production_baseline.sql");
  for (const [table, columns] of Object.entries(narrowed)) {
    const definition = baseline.match(new RegExp(`create table public\\.${table}\\(([\\s\\S]*?)\\);`))?.[1];
    assert.ok(definition, table);
    for (const column of columns.split(",")) assert.match(definition, new RegExp(`(^|,)${column} `), `${table}.${column}`);
  }
});

// ---- Shell, login and homepage contracts.
test("shell: bootstrap precedes permission/visibility, which run in parallel; the trial banner streams", () => {
  const shell = read("features/vayon/components/VayonShell.tsx");
  const bootstrap = shell.indexOf("new WorkspaceBootstrapService().ensure(user)");
  const parallel = shell.indexOf("const [authorization, visibility] = await Promise.all([");
  assert.ok(bootstrap > 0 && parallel > bootstrap);
  assert.ok(shell.indexOf("getWorkspaceTrial()") > parallel, "the trial snapshot starts only after bootstrap");
  assert.match(shell, /<Suspense fallback=\{null\}><ShellTrialNotice trial=\{trial\}/);
  assert.doesNotMatch(shell, /await getWorkspaceTrial\(\)/);
  assert.match(read("features/platform/visibility/service.ts"), /new WorkspacePermissionService\(\)\.context\(\)/);
});

test("navigation: sidebar links show an in-place pending hint without layout shift", () => {
  const hint = read("features/vayon/product-shell/LinkPendingHint.tsx"), sidebar = read("features/vayon/product-shell/ShellSidebar.tsx");
  assert.match(hint, /useLinkStatus\(\)/);
  assert.match(hint, /absolute/);
  assert.match(hint, /opacity-0/);
  assert.equal((sidebar.match(/<LinkPendingHint\/>/g) ?? []).length, 3);
  assert.equal((sidebar.match(/focus-ring relative/g) ?? []).length, 3);
});

test("homepage: theme logo pair is never double-preloaded and every logo is sized", () => {
  const logo = read("components/brand/BrandLogo.tsx");
  assert.equal((logo.match(/sizes=\{sizes\}/g) ?? []).length, 3);
  const pair = logo.slice(logo.indexOf('if (variant !== "auto")'));
  const pairImages = pair.slice(pair.indexOf("<span")).match(/<Image[^>]*>/g);
  assert.equal(pairImages.length, 2);
  for (const image of pairImages) { assert.doesNotMatch(image, /priority|preload|loading=/); assert.match(image, /fetchPriority=\{fetchPriority\}/); }
});

test("homepage: founding availability polls only while visible and re-checks on return", () => {
  const offer = read("features/marketing/components/FoundingOffer.tsx");
  assert.match(offer, /visibilitychange/);
  assert.match(offer, /document\.visibilityState === "visible"\) \{ void refresh\(\); start\(\); \} else stop\(\)/);
  assert.match(offer, /removeEventListener\("visibilitychange"/);
  assert.match(read("app/api/billing/paddle/founding/availability/route.ts"), /"Cache-Control": "no-store"/);
  const hero = read("features/marketing/components/EnterpriseExperience.tsx");
  assert.match(hero, /looping = useInView\(frame\) && !reduced/);
  assert.match(hero, /animate=\{reduced \? undefined : looping/);
});
