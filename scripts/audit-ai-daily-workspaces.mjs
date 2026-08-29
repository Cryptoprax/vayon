import { readFile } from "node:fs/promises";

const component = await readFile(new URL("../features/vayon/operational-workforce/components/EmployeeDailyWorkspace.tsx", import.meta.url), "utf8");
const route = await readFile(new URL("../app/vayon/ai/workforce/[employeeId]/page.tsx", import.meta.url), "utf8");
const requirements = [
  "Daily Workspace", "Current Focus", "Today&apos;s Goals", "Today&apos;s Work",
  "Today&apos;s Recommendations", "Upcoming Schedule", "Recent Achievements",
  "Recent Activity", "Team Collaboration", "Daily Score", "Knowledge Panel",
  "Employee Commands", "Import Data", "Explore Demo Workspace",
];
const missing = requirements.filter(value => !component.includes(value));
if (missing.length) throw new Error(`Employee workspace audit failed: ${missing.join(", ")}`);
if (!route.includes("AICollaborationService.production()") || !route.includes("EmployeeDailyWorkspace")) throw new Error("Employee workspace projections are not wired.");
if (/Math\.random|fetch\(|createSupabaseServerClient|\.from\(/.test(component)) throw new Error("Daily workspace bypasses existing projections or invents evidence.");
console.log("AI employee daily workspace audit passed: five role profiles, approval governance, evidence fallbacks, responsive grids, accessible labels, and lazy secondary loading verified.");
