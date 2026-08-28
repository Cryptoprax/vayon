import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";
const read = (file) => readFileSync(file, "utf8");

test("Integration Center production status audit passes", () => { const result = spawnSync(process.execPath, ["scripts/audit-integration-status.mjs"], { encoding: "utf8" }); assert.equal(result.status, 0, result.stderr || result.stdout); });
test("provider health stays evidence safe and workspace isolated", () => { const source = read("features/platform/integrations/center/service.ts"); assert.match(source, /integration_health/); assert.match(source, /organization_id/); assert.match(source, /workspace_id/); assert.doesNotMatch(source, /select\([^)]*(secret|token)/i); });
test("WhatsApp customer setup exposes no technical credential inputs", () => { const source = read("features/platform/integrations/whatsapp/WhatsAppConnectCard.tsx"); assert.match(source, /Registration Pending/); assert.match(source, /Coming Soon/); assert.doesNotMatch(source, /accessToken|phoneNumberId|businessAccountId/); });
test("billing and email health are registered without new APIs", () => { const registry = read("features/platform/integrations/center/registry.ts"); for (const value of ["Paddle Billing", "Transactional Email", "provider-health", "settings/email"]) assert.match(registry, new RegExp(value)); });
