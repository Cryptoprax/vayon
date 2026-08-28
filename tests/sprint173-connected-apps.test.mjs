import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";
const read = (file) => readFileSync(file, "utf8");
test("Connected Apps product audit passes", () => { const result = spawnSync(process.execPath, ["scripts/audit-connected-apps.mjs"], { encoding: "utf8" }); assert.equal(result.status, 0, result.stderr || result.stdout); });
test("tabs use one server model and URL-addressable navigation", () => { const page = read("app/vayon/settings/integrations/page.tsx"), ui = read("features/platform/integrations/center/IntegrationCenter.tsx"); assert.match(page, /IntegrationCenterService\(\)\.model/); assert.doesNotMatch(page, /IntegrationPlatformService/); for (const tab of ["overview", "connected", "permissions", "activity", "marketplace", "advanced"]) assert.match(ui, new RegExp(`\\[?tab=\\$\\{id\\}|\\[\"${tab}\"`)); });
test("AI insights are conditional on verified model evidence", () => { const ui = read("features/platform/integrations/center/IntegrationCenter.tsx"); assert.match(ui, /item\.connected && !item\.lastSync/); assert.match(ui, /environmentMode === "Sandbox"/); assert.doesNotMatch(ui, /42%/); });
test("future apps use early access instead of missing routes", () => { const ui = read("features/platform/integrations/center/IntegrationCenter.tsx"); assert.match(ui, /displayStatus === "Coming Soon"/); assert.match(ui, /Join Early Access/); assert.match(ui, /contact\?intent=/); });
