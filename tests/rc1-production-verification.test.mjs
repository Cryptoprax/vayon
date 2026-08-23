import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = ["PLATFORM_INVENTORY.md","VERSION1_RELEASE_REPORT.md","MODULE_STATUS.md","FEATURE_STATUS.md","DATABASE_STATUS.md","INTEGRATION_STATUS.md","PRODUCTION_READINESS_SCORE.md"];
for (const file of files) test(`RC1 generates ${file}`, async () => assert.ok((await readFile(`docs/${file}`, "utf8")).length > 200));
test("RC1 never claims unexecuted live evidence", async () => { const report = await readFile("docs/VERSION1_RELEASE_REPORT.md", "utf8"); assert.match(report, /not executed/i); assert.match(report, /NO-GO/); assert.match(report, /BLOCKED/); });
test("production Intelligence default is consistent", async () => { const flags = await readFile("lib/infrastructure/feature-flags.ts", "utf8"); assert.match(flags, /key === "vayon_intelligence" \? configured !== "false"/); });
