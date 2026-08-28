import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const files = {
  welcome: await read("features/onboarding/components/PremiumWelcomeExperience.tsx"),
  dashboard: await read("features/vayon/dashboard/components/AIWorkforceGrid.tsx"),
  team: await read("features/vayon/operational-workforce/components/WorkforceViews.tsx"),
  identities: await read("features/vayon/operational-workforce/repositories/workforce-data.ts"),
  profile: await read("app/vayon/ai/workforce/[employeeId]/page.tsx"),
  homepage: await read("features/marketing/components/Homepage.tsx"),
  metadata: await read("app/layout.tsx"),
};
const requireText = (source, values, area) => { for (const value of values) if (!source.includes(value)) throw new Error(`${area} is missing: ${value}`); };
requireText(files.welcome, ["Building Your AI Real Estate Company", "Hiring Sales Manager", "Hiring Marketing Director", "Hiring Property Advisor", "Hiring Operations Manager", "Hiring Customer Success Manager", "Preparing Workspace", "Training AI Team", "Connecting Intelligence", "Meet Your AI Team", "prefers-reduced-motion", "Skip", "workspaceName"], "First login");
requireText(files.identities, ["Sarah", "Sales Manager", "Emma", "Property Advisor", "Alex", "Marketing Director", "David", "Operations Manager", "Olivia", "Customer Success Manager"], "Default team");
requireText(files.dashboard, ["Current task", "Completed", "Recommendation", "Open Workspace"], "Dashboard team cards");
requireText(files.team, ["Overview", "Today&apos;s Work", "Assigned Customers", "Assigned Properties", "Recommendations", "Activity Feed", "Performance", "Upcoming Tasks", "Recent Achievements", "Working Style", "Strengths", "Communication Style", "Experience", "Mission"], "Employee profiles");
requireText(files.profile, ["Conversation", "What should I follow up today?", "Which buyers are hottest?", "Which deals are at risk?", "prepares actions only"], "Employee conversation");
requireText(files.homepage, ["Meet Your AI Team", "Sarah · Sales Manager", "Open Headquarters"], "Homepage");
requireText(files.metadata, ["Meet Your AI Team | VAYON", "Hire an entire AI Real Estate Team in under five minutes"], "SEO");
console.log("AI Team experience audit passed.");
