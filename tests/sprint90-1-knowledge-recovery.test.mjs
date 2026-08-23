import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const recovery = await readFile("features/platform/knowledge/services/knowledge-recovery.ts", "utf8");
const service = await readFile("features/platform/knowledge/services/knowledge.service.ts", "utf8");
const page = await readFile("app/vayon/knowledge/page.tsx", "utf8");
const boundary = await readFile("app/vayon/knowledge/error.tsx", "utf8");
const report = await readFile("docs/SPRINT90_1_KNOWLEDGE_RECOVERY.md", "utf8");

test("missing Knowledge table is diagnosed and recovered", () => { assert.match(recovery, /42P01/); assert.match(recovery, /missing_table/); assert.match(page, /loadSnapshot/); });
test("missing Knowledge RPC is diagnosed", () => { assert.match(recovery, /PGRST202/); assert.match(recovery, /missing_rpc/); });
test("empty knowledge base is a valid service result", () => { assert.match(service, /"empty" as const/); assert.match(page, /KnowledgeCenter/); });
test("missing organization receives guided tenant recovery", () => { assert.match(recovery, /tenant_context_missing/); assert.match(recovery, /organization and workspace required/i); });
test("missing workspace receives guided tenant recovery", () => { assert.match(recovery, /complete_organization_and_workspace_setup/); assert.match(page, /KnowledgeRecovery/); });
test("subscription failure is explicit", () => { assert.match(recovery, /subscription_unavailable/); assert.match(recovery, /verify_subscription_entitlement/); });
test("permission denial preserves RBAC and RLS", () => { assert.match(recovery, /42501/); assert.match(recovery, /verify_membership_role_and_rls/); });
test("timeout is retryable", () => { assert.match(recovery, /ETIMEDOUT/); assert.match(recovery, /retry_with_backoff/); });
test("provider unavailability is sanitized", () => { assert.match(recovery, /provider_unavailable/); assert.match(recovery, /\[redacted\]/); });
test("successful and cached retrieval still use the existing service", () => { assert.match(service, /this\.cache\.remember/); assert.match(service, /status: "ready"/); assert.match(service, /KnowledgeEngine/); });
test("route recovery page keeps navigation and support available", () => { for (const value of ["Retry", "Documentation", "Support", "AI Assistant"]) assert.match(boundary, new RegExp(value)); });
test("dependency report records the proven production failure", () => { assert.match(report, /knowledge_articles.*MISSING/); assert.match(report, /42P01/); assert.match(report, /No production SQL was executed/); });
