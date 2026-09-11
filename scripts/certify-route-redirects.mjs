import { request } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { loadPureModule } from "./audit-product-unification.mjs";

const baseURL = process.env.ROUTE_REDIRECT_BASE_URL ?? "http://127.0.0.1:3227";
const { canonicalRouteRedirects } = loadPureModule("config/canonical-routes.ts");
const client = await request.newContext({ baseURL });
const evidence = { generatedAt: new Date().toISOString(), baseURL, scope: "HTTP redirects only; destination rendering is not certified", redirects: [] };
try {
  for (const route of canonicalRouteRedirects) {
    const response = await client.get(`${route.source}?routeAudit=1`, { maxRedirects: 0 });
    const location = response.headers().location;
    const destination = location ? new URL(location, baseURL) : null;
    const passed = response.status() === 308 && destination?.pathname === route.destination && destination?.searchParams.get("routeAudit") === "1";
    evidence.redirects.push({ source: route.source, expected: route.destination, status: response.status(), destination: destination?.pathname, queryPreserved: destination?.searchParams.get("routeAudit") === "1", state: passed ? "Certified" : "Blocked" });
  }
} finally { await client.dispose(); }
mkdirSync("test-results/routes", { recursive: true });
writeFileSync("test-results/routes/redirect-audit.json", JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence, null, 2));
process.exitCode = evidence.redirects.every(item => item.state === "Certified") ? 0 : 1;
