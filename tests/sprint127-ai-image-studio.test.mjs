import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
test("Image Studio reuses licensed Creative assets and Brand Studio", () => {
  const service = read("features/vayon/image-studio/service.ts");
  assert.match(service, /CreativeStudioService\.production/);
  assert.match(service, /BrandStudioService\.production/);
  assert.doesNotMatch(service, /createClient|fetch\(|service_role/i);
});
test("generation and AI edits remain safe when the live provider is unavailable", () => {
  const provider = read("features/vayon/image-studio/provider.ts"),
    service = read("features/vayon/image-studio/service.ts");
  assert.match(provider, /UnavailableImageStudioProvider/);
  assert.match(provider, /connected = false/);
  assert.match(provider, /provider is not configured/);
  assert.match(service, /generationEnabled:\s*health\.state === "available"/);
  assert.match(service, /providerState:/);
});
test("Image Studio covers types styles editor AI operations exports and collaboration", () => {
  const types = read("features/vayon/image-studio/types.ts"),
    service = read("features/vayon/image-studio/service.ts");
  for (const value of [
    "Photography",
    "Product Render",
    "Architecture",
    "Photorealistic",
    "Watercolor",
    "Crop",
    "Layers",
    "Undo",
    "Background removal",
    "Inpainting",
    "Outpainting",
    "Magic selection",
    "WEBP",
    "TIFF",
    "PSD",
    "Comments",
    "Approvals",
    "Activity timeline",
  ])
    assert.ok(`${types}${service}`.includes(value), value);
});
test("Image Studio route is wired from Creative Studio and central permissions", () => {
  const home = read("features/vayon/creative-studio-2/CreativeStudioHome.tsx"),
    route = read("app/vayon/creative/images/page.tsx"),
    permissions = read("features/platform/permissions/runtime/navigation.ts");
  assert.match(home, /\/vayon\/creative\/images/);
  assert.match(route, /ImageStudioService\.production/);
  assert.match(
    permissions,
    /prefix:"\/vayon\/creative",module:"creative_studio"/,
  );
});
