import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(path)=>readFileSync(path,"utf8");
const types=read("features/platform/permissions/runtime/types.ts");
const policy=read("features/platform/permissions/runtime/policy.ts");
const service=read("features/platform/permissions/runtime/permission.service.ts");
const http=read("features/platform/permissions/runtime/http.ts");
const navigation=read("features/platform/permissions/runtime/navigation.ts");
const gate=read("features/platform/permissions/runtime/PermissionGate.tsx");
const roles=read("features/platform/organization/config/workspace-role-catalog.ts");

test("permission model covers every action and platform module",()=>{
  for(const action of ["view","create","update","delete","approve","export","manage","admin"])assert.match(types,new RegExp(`\"${action}\"`));
  for(const permissionModule of ["crm","leads","contacts","companies","deals","calendar","marketing","campaigns","creative_studio","knowledge","customer_success","billing","invoices","reports","analytics","ai_employees","workflow_automation","integrations","team_management","organization_settings"])assert.match(types,new RegExp(`\"${permissionModule}\"`));
});

test("every catalog role has exactly one centralized permission profile",()=>{
  const codes=[...roles.matchAll(/role\(\{code:"([a-z_]+)"/g)].map(match=>match[1]);
  assert.equal(codes.length,25);
  for(const code of codes)assert.match(policy,new RegExp(`\\b${code}:`),code);
  assert.match(policy,/workspaceRoleByCode/);
});

test("sensitive example roles are least privilege and escalation safe",()=>{
  assert.match(policy,/sales_representative:\{crm:read,leads:work,contacts:work,companies:read,deals:work,calendar:work,ai_employees:work\}/);
  assert.match(policy,/marketing_specialist:\{marketing:work,campaigns:work,creative_studio:work,ai_employees:work\}/);
  assert.match(policy,/finance_manager:\{billing:manage,invoices:manage,reports:/);
  assert.match(policy,/viewer:Object\.fromEntries\(permissionModules\.map\(module=>\[module,read\]\)\)/);
  assert.match(policy,/role==="guest"&&!request\.explicitlyShared/);
  assert.match(policy,/owner_scope_required/);
});

test("server checks are tenant scoped default deny and audited",()=>{
  for(const value of ["organization_id","workspace_id","user_id","status","authorization.permission_denied","actorId","role","permission","module"])assert.match(service,new RegExp(value));
  assert.match(service,/WorkspacePermissionError/);
  assert.match(service,/throw new WorkspacePermissionError/);
  assert.doesNotMatch(service,/app_metadata|user_metadata|super_admin|founder/);
});

test("page and API enforcement produce explicit 403 behavior",()=>{
  assert.match(http,/forbidden\(\)/);
  assert.match(http,/status:403/);
  assert.match(http,/error:"Forbidden"/);
  assert.match(read("next.config.ts"),/authInterrupts:\s*true/);
  assert.match(read("app/forbidden.tsx"),/403 · Access restricted/);
  assert.match(read("app/api/ai/workforce/chat/route.ts"),/enforceApiPermission\("ai_employees","create"\)/);
  assert.match(read("app/api/ai/workforce/collaborate/route.ts"),/enforceApiPermission\("ai_employees","create"\)/);
});

test("navigation and component gates share the same evaluator",()=>{
  assert.match(navigation,/evaluateWorkspacePermission/);
  assert.match(navigation,/filterNavigationForRole/);
  assert.match(read("features/vayon/product-shell/ShellSidebar.tsx"),/filterNavigationForRole/);
  assert.match(gate,/evaluateWorkspacePermission/);
  assert.match(gate,/mode\?:"hide"\|"disable"/);
});

test("organization server mutations use centralized enforcement",()=>{
  const organization=read("features/platform/organization/services/organization.service.ts");
  for(const permission of [["organization_settings","update"],["organization_settings","admin"],["team_management","create"],["team_management","update"],["team_management","delete"],["team_management","manage"]])assert.match(organization,new RegExp(`requireWorkspacePermission\\(\"${permission[0]}\",\"${permission[1]}\"\\)`));
  assert.match(read("app/vayon/settings/members/page.tsx"),/enforcePagePermission\("team_management"\)/);
  assert.match(read("app/vayon/settings/billing/page.tsx"),/enforcePagePermission\("billing"\)/);
  assert.match(read("app/vayon/settings/integrations/page.tsx"),/enforcePagePermission\("integrations"\)/);
});
