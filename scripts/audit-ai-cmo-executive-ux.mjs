import { readFileSync } from "node:fs";
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const overview = read("features/vayon/growth-intelligence/GrowthOverview.tsx");
const strategy = read("features/vayon/growth-intelligence/StrategyWorkspace.tsx");
const engine = read("features/vayon/growth-intelligence/strategy-engine.ts");
const failures = [];
const requireText = (source, value) => { if (!source.includes(value)) failures.push(`Missing executive UX requirement: ${value}`); };
for (const value of ["Good morning", "Marketing Health", "Today's Priorities", "Upcoming Launches", "Brand Opportunities", "Content Queue", "Investor Communication", "Community Activity", "Marketing Risks"]) requireText(overview.replaceAll("&apos;", "'"), value);
for (const value of ["Goal", "Target audience", "Primary message", "CTA", "Channels", "Creative requirements", "Timeline", "Success criteria", "Dependencies", "Approvals", "Estimated effort"]) requireText(strategy, value);
for (const value of ["Why suggested", "Evidence used", "Missing information", "Confidence", "Dependencies", "Draft", "Review", "Approved", "Rejected", "Archived"]) requireText(strategy + engine, value);
for (const forbidden of [/fetch\(/, /\/api\//, /publish\(/, /lorem ipsum/i, /\d+%/]) if (forbidden.test(overview + strategy + engine)) failures.push(`Forbidden executive UX pattern: ${forbidden}`);
if (failures.length) { console.error(failures.map((item) => `FAIL: ${item}`).join("\n")); process.exit(1); }
console.log("AI CMO executive UX audit passed: evidence, planning, explanation, approval, and non-execution boundaries are explicit.");
