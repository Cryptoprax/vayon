import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { certifyProduct } from "../scripts/audit-product-certification.mjs";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("every authenticated route receives an explicit evidence-safe certification status", async () => {
  const result = await certifyProduct();
  assert.equal(result.evidence.routeCount, 196);
  assert.equal(result.routes.length, 196);
  assert.equal(
    result.routes.every((item) =>
      ["PASS", "WARNING", "FAIL"].includes(item.status),
    ),
    true,
  );
  assert.equal(
    result.routes.every((item) => item.status === "WARNING"),
    true,
  );
});

test("certification records automated UI navigation and theme evidence", async () => {
  const result = await certifyProduct();
  assert.equal(result.evidence.themeAuditPassed, true);
  assert.equal(result.evidence.uxAuditPassed, true);
  assert.equal(result.evidence.ctaAuditPassed, true);
  assert.equal(result.evidence.shellNavigationPresent, true);
});

test("certification never fabricates browser or screenshot verification", async () => {
  const result = await certifyProduct();
  assert.equal(result.evidence.visualRuntimeVerified, false);
  assert.equal(result.evidence.screenshotsVerified, 0);
  const report = read("docs/PRODUCT_CERTIFICATION_REPORT.md");
  assert.match(report, /Screenshots verified: 0/);
  assert.match(report, /Provisional certification/);
});

test("performance heuristics identify large presentation boundaries without modifying them", async () => {
  const result = await certifyProduct();
  assert.equal(
    result.largeComponents.some((item) =>
      item.file.endsWith("UniversalBar.tsx"),
    ),
    true,
  );
  assert.match(
    read("docs/PRODUCT_CERTIFICATION_REPORT.md"),
    /UniversalBar\.tsx/,
  );
});
