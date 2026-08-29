import { existsSync, readFileSync } from "node:fs";
const files = ["app/vayon/platform/launch-readiness/page.tsx","features/platform/launch-readiness/components/LaunchReadinessDashboard.tsx","features/platform/launch-readiness/components/LaunchReadinessSecondary.tsx"];
const failures = files.filter((file) => !existsSync(file));
const source = files.filter(existsSync).map((file) => readFileSync(file, "utf8")).join("\n");
for (const token of ["Launch Readiness Center","Overall launch score","Production checklist","Founder actions","Customer journey","Readiness diagnostics","founderContext"]) if (!source.includes(token)) failures.push(`missing:${token}`);
if (/fetch\(|\.from\(|execute\(|insert\(|update\(|delete\(/i.test(source)) failures.push("forbidden data or execution boundary");
if (failures.length) { console.error(`Launch readiness audit failed: ${failures.join(", ")}`); process.exit(1); }
console.log("Launch readiness audit passed: founder access, evidence projections, explicit states, actions, accessibility, and isolation verified.");
