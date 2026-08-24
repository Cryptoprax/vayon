import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const catalog = read("features/platform/organization/config/workspace-role-catalog.ts");
const ui = read("features/platform/organization/components/RoleManagementUI.tsx");
const validation = read("features/platform/organization/validation/index.ts");
const service = read("features/platform/organization/services/organization.service.ts");

const roles = ["organization_owner","organization_admin","operations_manager","sales_manager","sales_representative","marketing_manager","marketing_specialist","customer_success_manager","support_agent","finance_manager","hr_manager","knowledge_manager","product_manager","ai_manager","analyst","standard_member","viewer","guest"];

test("central catalog defines every enterprise role and department", () => {
  for (const role of roles) assert.match(catalog, new RegExp(`code:\"${role}\"`));
  for (const department of ["Executive","Sales","Marketing","Operations","Customer Success","Supported Services","Finance","Human Resources","Knowledge","Product","AI","General"]) assert.match(catalog, new RegExp(`\"${department}\"`));
  for (const field of ["description","permissions","restrictions","typicalUsers","icon","color","assignable"]) assert.match(catalog, new RegExp(`${field}:`));
});

test("Founder and super_admin are never workspace role codes", () => {
  assert.doesNotMatch(catalog, /code:\s*"(?:founder|super_admin)"/);
  assert.doesNotMatch(validation, /founder|super_admin/);
  assert.match(catalog, /code:"organization_owner"[\s\S]*?assignable:false/);
});

test("invite picker is searchable grouped and keyboard accessible", () => {
  assert.match(ui, /type="search"/);
  assert.match(ui, /aria-controls="invite-role-catalog"/);
  assert.match(ui, /aria-pressed=\{selected===role\.code\}/);
  assert.match(ui, /grouped\(filtered\)/);
  assert.match(ui, /name="role" value=\{selected\}/);
  assert.match(ui, /action=\{inviteMemberAction\}/);
});

test("member management preserves lifecycle actions and exposes role context", () => {
  for (const value of ["memberAction","suspend","reactivate","remove","Permission summary","Department","RoleOptions"]) assert.match(ui, new RegExp(value));
  assert.match(ui, /defaultValue=\{member\.role\}/);
  assert.match(ui, /action=\{transferOwnershipAction\}/);
});

test("role details expose capabilities restrictions and typical users", () => {
  for (const value of ["Capabilities","Restrictions","Typical users","RoleDetails","summarizePermissions"]) assert.match(ui, new RegExp(value));
  assert.match(service, /roles:workspaceRoleCatalog/);
  assert.match(validation, /assignableWorkspaceRoles/);
});
