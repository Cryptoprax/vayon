import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
test("pipeline route reuses licensed Creative Studio", () => {
  const service = read("features/vayon/creative-pipeline/service.ts"),
    page = read("app/vayon/creative/pipelines/page.tsx");
  assert.match(service, /CreativeStudioService\.production/);
  assert.match(page, /CreativePipelineService\.production/);
  assert.doesNotMatch(service, /createClient|fetch\(|service_role/i);
});
test("planner contains all ordered independently observable stages", () => {
  const planner = read("features/vayon/creative-pipeline/planner.ts");
  for (const value of [
    "Campaign Planning",
    "Brand Resolution",
    "Content Planning",
    "Copywriting",
    "Creative Direction",
    "Image Assignment",
    "Layout Planning",
    "Document Assembly",
    "Internal Review",
    "Brand Validation",
    "Approval",
    "Export",
    "dependencies",
    "inputs",
    "outputs",
    "assignedDepartment",
    "durationEstimateMinutes",
    "retryCount",
    "runtimeOnly: true",
  ])
    assert.ok(planner.includes(value), value);
});
test("document copy layout review and export contracts are complete", () => {
  const all = ["types.ts", "contracts.ts", "review.ts"]
    .map((file) => read(`features/vayon/creative-pipeline/${file}`))
    .join("\n");
  for (const value of [
    "Headline",
    "Body copy",
    "Product description",
    "Call to action",
    "Feature list",
    "FAQ",
    "Testimonial",
    "Legal text",
    "A4",
    "A5",
    "Letter",
    "Presentation",
    "Square",
    "Landscape",
    "Portrait",
    "Social",
    "DocumentPage",
    "DocumentSection",
    "DocumentBlock",
    "brandReference",
    "PDF",
    "PPTX",
    "DOCX",
    "HTML",
    "INDD",
    "Editable Project",
    "automatedJudgement: false",
  ])
    assert.ok(all.includes(value), value);
});
test("pipeline architecture never invokes providers or generates documents", () => {
  const sources = ["planner.ts", "review.ts", "service.ts", "contracts.ts"]
    .map((file) => read(`features/vayon/creative-pipeline/${file}`))
    .join("\n");
  assert.doesNotMatch(
    sources,
    /fetch\(|openai|adobe|google|generateDocument|renderPdf/i,
  );
  assert.match(sources, /generated:\s*false/);
});
