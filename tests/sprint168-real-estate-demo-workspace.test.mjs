import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("Prime Properties demo inventory is deterministic, isolated, and complete", () => {
  const repository = read(
    "features/vayon/demo-experience/repository/aurora-demo.repository.ts",
  );
  for (const evidence of [
    "Prime Properties Realty",
    "length: 500",
    "length: 1000",
    "seeded-json-fixtures",
    "readOnly: true",
  ])
    assert.match(repository, new RegExp(evidence));
  for (const type of [
    "apartment",
    "villa",
    "commercial office",
    "retail",
    "plot",
    "luxury home",
  ])
    assert.match(repository, new RegExp(type));
  for (const status of [
    "new",
    "qualified",
    "contacted",
    "appointment-scheduled",
    "property-visit",
    "negotiation",
    "won",
    "lost",
  ])
    assert.match(repository, new RegExp(status));
  assert.doesNotMatch(
    repository,
    /Math\.random|fetch\(|supabase|client\.from|insert\(|update\(|delete\(/,
  );
});

test("every requested real estate demo module has populated projections", () => {
  const source = read(
    "features/vayon/demo-experience/repository/aurora-enterprise.repository.ts",
  );
  for (const collection of [
    "aiEmployees",
    "calendar",
    "tasks",
    "communications",
    "marketingAssets",
    "executiveDashboard",
    "founderDashboard",
  ])
    assert.match(source, new RegExp(collection));
  for (const role of [
    "AI Sales Manager",
    "AI Marketing Manager",
    "AI Operations Manager",
    "AI Customer Success Manager",
    "AI Founder Assistant",
  ])
    assert.match(source, new RegExp(role));
  for (const asset of [
    "Property Brochure",
    "Instagram Post",
    "Facebook Ad",
    "Property Reel",
    "Presentation",
    "Email Banner",
  ])
    assert.match(source, new RegExp(asset));
  for (const metric of [
    "Monthly Revenue",
    "Lead sources",
    "Conversion Rate",
    "Appointments",
    "Property Views",
    "Deals Closed",
    "Commission",
    "Marketing ROI",
    "AI Productivity",
    "MRR",
    "ARR",
    "Executive Summary",
  ])
    assert.match(source, new RegExp(metric, "i"));
});

test("demo experience identifies sample data and provides deterministic lifecycle actions", () => {
  const ui = read(
    "features/vayon/demo-experience/components/DemoExperience.tsx",
  );
  for (const label of [
    "Demo Workspace",
    "Sample Data",
    "No production information",
    "Reset Demo",
    "Reload Demo",
    "Generate New Demo",
  ])
    assert.match(ui, new RegExp(label));
  assert.match(ui, /Prime Properties Realty/);
  assert.match(ui, /Residential \+ Commercial Brokerage/);
  assert.match(ui, /18 Agents/);
  assert.match(ui, /Established 2018/);
});

test("demo entry actions route only to the isolated sample workspace", () => {
  const source = read(
    "features/vayon/adaptive-workspace/AdaptiveWorkspace.tsx",
  );
  assert.match(source, /Explore Demo Workspace/);
  assert.match(source, /Use Sample Data/);
  assert.equal(source.match(/href="\/demo"/g)?.length, 2);
});
