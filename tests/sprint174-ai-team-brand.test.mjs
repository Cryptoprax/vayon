import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";
const read = (file) => readFileSync(file, "utf8");
test("AI Team brand audit passes", () => { const result = spawnSync(process.execPath, ["scripts/audit-ai-team-brand.mjs"], { encoding: "utf8" }); assert.equal(result.status, 0, result.stderr || result.stdout); });
test("homepage remains server rendered and reuses lazy motion", () => { const source = read("features/marketing/components/Homepage.tsx"); assert.doesNotMatch(source, /^"use client"/); assert.match(source, /Reveal/); assert.match(source, /motion-safe:animate-pulse/); });
test("brand transformation does not touch protected platform boundaries", () => { const changed = ["app/layout.tsx", "features/marketing/components/Homepage.tsx", "features/onboarding/components/EnterpriseOnboardingWizard.tsx", "features/vayon/executive-home/components/ExecutiveGreeting.tsx", "features/vayon/empty-states/UniversalEmptyState.tsx", "features/vayon/operational-workforce/components/WorkforceViews.tsx", "app/vayon/ai/employees/page.tsx"]; for (const file of changed) assert.doesNotMatch(read(file), /PaddleCheckoutService|createSupabaseServerClient|AIProvider|workflow runtime/i); });
