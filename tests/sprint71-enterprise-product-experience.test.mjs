import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
const read = path => readFileSync(path, "utf8");

test("premium hero cycles through every enterprise product view", () => {
  const source = read("features/marketing/components/EnterpriseExperience.tsx");
  for (const view of ["CRM", "AI Workforce", "Analytics", "Calendar", "WhatsApp", "Workflow Automation", "Executive Dashboard"]) assert.match(source, new RegExp(view));
  assert.match(source, /setInterval/); assert.match(source, /clearInterval/); assert.match(source, /aria-live/); assert.match(source, /aria-pressed/);
});

test("AI Workforce visualization contains Vayon Core and all eight employees", () => {
  const source = read("features/marketing/components/EnterpriseExperience.tsx");
  for (const item of ["VAYON CORE", "AI Sales Assistant", "AI CRM Manager", "AI Marketing Strategist", "AI WhatsApp Assistant", "AI Voice Agent", "AI Property Advisor", "AI Operations Manager", "AI Executive Assistant"]) assert.match(source, new RegExp(item));
  assert.match(source, /whileHover/);
});

test("architecture and dashboard previews cover required layers and modules", () => {
  const source = read("features/marketing/components/EnterpriseExperience.tsx");
  for (const layer of ["Users", "AI Employees", "Workflow Engine", "Knowledge Layer", "Integrations", "CRM", "Analytics", "Security", "Infrastructure"]) assert.match(source, new RegExp(layer));
  for (const tab of ["Dashboard", "CRM", "Messages", "Calendar", "Analytics", "AI", "Deals", "Documents", "Revenue", "Meetings", "Pipeline", "Lead Sources", "Tasks", "Conversation volume"]) assert.match(source, new RegExp(tab));
});

test("homepage includes focused features workflow trust pricing and customer proof", () => {
  const source = read("features/marketing/components/Homepage.tsx");
  for (const item of ["AI employees", "Real Estate CRM", "WhatsApp Automation", "Property Intelligence", "Secure Workspaces", "Human approval controls", "Cloud-native infrastructure", "Built Specifically For Real Estate", "LandingRoiCalculator", "Testimonials", "PricingTable"]) assert.match(source, new RegExp(item));
  for (const step of ["Lead enters", "AI qualifies", "Property matching", "Appointment booked", "Agent assigned", "Follow up", "Offer sent", "Deal won"]) assert.match(source, new RegExp(step));
});

test("FAQ, metadata, schema and footer contracts remain accessible", () => {
  const homepage = read("features/marketing/components/Homepage.tsx"), experience = read("features/marketing/components/EnterpriseExperience.tsx"), footer = read("features/marketing/components/MarketingShell.tsx");
  assert.match(homepage, /FAQPage/); assert.match(homepage, /SoftwareApplication/); assert.match(experience, /aria-expanded/); assert.match(experience, /useReducedMotion/);
  for (const item of ["Platform", "Solutions", "Resources", "Developers", "Legal", "Documentation", "Status", "Privacy", "Terms"]) assert.match(footer, new RegExp(item));
});

test("experience preserves evidence boundaries and introduces no backend artifacts", () => {
  const homepage = read("features/marketing/components/Homepage.tsx"), docs = read("docs/SPRINT_71_ENTERPRISE_PRODUCT_EXPERIENCE.md");
  assert.match(homepage, /hasCustomerTestimonials = false/i); assert.match(homepage, /Why Real Estate Teams Choose VAYON/i); assert.doesNotMatch(homepage, /pending verification|customer story placeholders/i); assert.match(docs, /database schema.*untouched/i);
  assert.equal(existsSync("supabase/migrations/20260903000000_sprint71.sql"), false);
});
