import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (path) => fs.readFileSync(path, "utf8");
test("Creative Home performs deterministic multi-output intent analysis", () => {
  const intent = read("features/vayon/creative-studio-2/intent.ts");
  for (const output of [
    "Brand",
    "Company Profile",
    "Brochure",
    "Catalogue",
    "Pitch Deck",
    "Website",
    "Landing Page",
    "Marketing Campaign",
    "Email Campaign",
    "Images",
    "Product Mockups",
    "Social Media",
    "Advertisement",
    "Video",
    "CRM Setup",
    "Business Launch Project",
  ])
    assert.match(intent, new RegExp(`"${output}"`));
  assert.match(intent, /analyzeCreativeIntent/);
  assert.match(intent, /launchBundle/);
});
test("automatic routing covers every production studio and Business Launch", () => {
  const source = read("features/vayon/creative-studio-2/intent.ts");
  for (const route of [
    "/vayon/creative/brand",
    "/vayon/creative/documents",
    "/vayon/creative/images",
    "/vayon/creative/videos",
    "/vayon/creative/campaigns",
    "/onboarding/business-launch",
  ])
    assert.match(source, new RegExp(route));
  const home = read("features/vayon/creative-studio-2/CreativeStudioHome.tsx");
  assert.match(home, /router\.push\(plan\.primaryRoute\)/);
});
test("execution plan exposes cost providers approvals stages and provider diagnostics", () => {
  const home = read("features/vayon/creative-studio-2/CreativeStudioHome.tsx"),
    intent = read("features/vayon/creative-studio-2/intent.ts"),
    service = read("features/vayon/creative-studio-2/service.ts");
  for (const evidence of [
    "Execution Plan",
    "estimated",
    "approvals",
    "Creative Director\\s*→\\s*Pipeline\\s*→\\s*Runtime\\s*→\\s*Execution Engine\\s*→\\s*Provider Adapter",
    "Retry later",
    "no\\s+output\\s+will\\s+be\\s+fabricated",
  ])
    assert.match(home, new RegExp(evidence, "i"));
  for (const stage of [
    "Queued",
    "Planning",
    "Generating Documents",
    "Generating Images",
    "Generating Videos",
    "Reviewing",
    "Completed",
    "Waiting Provider",
    "Retry",
    "Cancelled",
  ])
    assert.match(intent, new RegExp(`"${stage}"`));
  assert.match(service, /OPENAI_API_KEY/);
  assert.match(service, /providerReason/);
});
test("session memory results and follow ups are connected without legacy draft messaging", () => {
  const home = read("features/vayon/creative-studio-2/CreativeStudioHome.tsx");
  assert.match(home, /sessionStorage\.setItem\("vayon\.creative\.prompt"/);
  assert.match(home, /sessionStorage\.setItem\(\s*"vayon\.creative\.plan"/);
  for (const next of [
    "Generate Website",
    "Generate Sales Proposal",
    "Generate WhatsApp Campaign",
    "Generate LinkedIn Campaign",
    "Generate Google Ads",
    "Generate Facebook Ads",
    "Generate Email Sequence",
  ])
    assert.match(
      read("features/vayon/creative-studio-2/intent.ts"),
      new RegExp(next),
    );
  assert.doesNotMatch(
    home,
    /Draft only|future sprint|providers are not connected|Provider-neutral foundation/i,
  );
  assert.match(home, /Asset Library/);
  assert.match(home, /Recent projects/);
});
test("existing runtime pipeline execution and streaming boundaries remain authoritative", () => {
  for (const route of ["documents", "images", "videos"]) {
    const source = read(`app/api/creative/${route}/stream/route.ts`);
    assert.match(source, /application\/x-ndjson/);
    assert.match(source, /generate(Document|Image|Video)/);
  }
  const doc = read("CREATIVE_STUDIO_FINAL_INTEGRATION.md");
  assert.match(doc, /Creative Director/);
  assert.match(doc, /Creative Runtime/);
  assert.match(doc, /No provider is called from Creative Home/);
});
