import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const engine = read("features/vayon/growth-intelligence/strategy-engine.ts");
const workspace = read("features/vayon/growth-intelligence/StrategyWorkspace.tsx");
const overview = read("features/vayon/growth-intelligence/GrowthOverview.tsx");

test("real estate growth brief is personalized and evidence safe", () => {
  assert.match(overview, /Good morning, \{userName\}/);
  assert.match(overview, /No verified workspace data is available/);
  assert.match(overview, /Metrics appear only when workspace-scoped evidence is available/);
  assert.doesNotMatch(overview, /\d+%|followers|impressions:\s*\d/i);
});

test("marketing health explains status requirements recommendation and action", () => {
  for (const area of ["Brand Consistency", "Publishing Readiness", "Campaign Readiness", "Community Readiness", "Content Readiness", "SEO Readiness", "PR Readiness", "Referral Readiness", "Investor Communication"]) assert.match(engine, new RegExp(area));
  for (const field of ["status", "recommendation", "missingRequirements", "nextAction"]) assert.match(engine, new RegExp(field));
});

test("strategy engine covers every campaign planning field and supported strategy", () => {
  for (const strategy of ["Product Launch", "Feature Launch", "Educational Campaign", "Thought Leadership", "Founder Story", "Customer Story", "Case Study", "Recruitment", "Community Growth", "Referral Campaign", "Investor Update", "Product Comparison", "Webinar", "Podcast", "Conference", "Partnership"]) assert.match(engine, new RegExp(strategy));
  for (const field of ["goal", "targetAudience", "primaryMessage", "supportingMessages", "cta", "channels", "creativeRequirements", "timeline", "successCriteria", "dependencies", "approvals", "status", "estimatedEffort"]) assert.match(engine, new RegExp(field));
});

test("creative briefs, brand voices, investor updates and community plans enter review", () => {
  for (const asset of ["LinkedIn Carousel", "Instagram Reel", "YouTube Thumbnail", "Blog Hero", "Email Header", "Landing Page Hero", "Presentation Cover", "Ad Creative", "Banner"]) assert.match(engine, new RegExp(asset));
  for (const voice of ["Professional", "Visionary", "Friendly", "Luxury", "Enterprise", "Startup", "Educational"]) assert.match(engine, new RegExp(voice));
  for (const status of ["Draft", "Review", "Approved", "Rejected", "Archived"]) assert.match(engine + workspace, new RegExp(status));
  assert.doesNotMatch(workspace + engine, /fetch\(|\/api\//);
});
