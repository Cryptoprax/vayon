import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
test("Document Studio route and full catalog are registered", () => {
  assert.match(
    read("app/vayon/creative/documents/page.tsx"),
    /DocumentStudioService/,
  );
  const types = read("features/vayon/document-studio/types.ts");
  for (const name of [
    "Company Profile",
    "Corporate Brochure",
    "Product Catalogue",
    "Pitch Deck",
    "Press Release",
  ])
    assert.match(types, new RegExp(name));
});
test("generation is server authorized and passes only through execution service", () => {
  const action = read("features/vayon/document-studio/actions.ts");
  assert.match(
    action,
    /requireWorkspacePermission\("creative_studio",\s*"create"\)/,
  );
  assert.match(action, /createLiveCreativeExecutionService\(\)\.accept/);
  assert.doesNotMatch(action, /openai|anthropic|fetch\(/i);
});
test("unavailable providers never fabricate documents", () => {
  const action = read("features/vayon/document-studio/actions.ts"),
    ui = read("features/vayon/document-studio/DocumentStudio.tsx");
  assert.match(action, /document:\s*null/);
  assert.match(ui, /WaitingProvider/);
  assert.match(ui, /no content was fabricated/i);
});
test("editable model, pipeline, exports and documentation are complete", () => {
  const types = read("features/vayon/document-studio/types.ts"),
    docs = read("DOCUMENT_STUDIO.md");
  for (const value of [
    "sections",
    "blocks",
    "version",
    "comments",
    "approval",
    "PDF",
    "DOCX",
    "PPTX",
    "HTML",
    "Editable Project",
  ])
    assert.match(`${types}\n${docs}`, new RegExp(value, "i"));
  assert.match(
    docs,
    /Copywriter.*Document Designer.*Graphic Designer.*Brand Reviewer.*Publisher/s,
  );
});
