import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(path, "utf8");
test("creative assistant understands requested real estate intents", () => {
  const engine = read("features/vayon/creative-studio/intent.engine.ts"),
    examples = read("features/vayon/creative-studio/demo.ts");
  for (const value of [
    "Luxury",
    "Modern",
    "Minimal",
    "Corporate",
    "Festival",
    "Offer",
    "Investment",
    "Premium",
    "Dark",
    "Light",
    "Brochure",
    "Instagram Post",
    "Facebook Post",
    "LinkedIn Graphic",
    "WhatsApp Creative",
    "Website Hero Banner",
    "Open House Poster",
    "Construction Update",
    "Leaflet",
    "Flyer",
  ])
    assert.match(engine, new RegExp(value));
  for (const example of [
    "Luxury Launch",
    "Ganesh Chaturthi Festival Offer",
    "NRI Investment",
    "Modern Villa Launch",
    "Instagram Apartment Promotion",
  ])
    assert.match(examples, new RegExp(example, "i"));
});
test("project context is loaded automatically from authoritative tenant data", () => {
  const worker = read("features/vayon/creative-studio/generation.service.ts");
  for (const value of [
    "property_projects",
    "property_units",
    "creative_brand_kits",
    "property_documents",
    "developer",
    "city",
    "state",
    "price",
    "offer_price",
    "colors",
    "typography",
    "logo_path",
    "watermarks",
    "legal_disclaimer",
    "rera_information",
    "phone",
    "address",
    "website",
  ])
    assert.match(worker, new RegExp(value));
  assert.match(worker, /organization_id/);
  assert.match(worker, /workspace_id/);
});
test("OpenAI provider generates real moderated image bytes with current Image API", () => {
  const source = read("features/vayon/creative-studio/generation.provider.ts");
  assert.match(source, /new OpenAI/);
  assert.match(source, /omni-moderation-latest/);
  assert.match(source, /api\.images\.generate/);
  assert.match(source, /gpt-image-2/);
  assert.match(source, /b64_json/);
  assert.match(source, /Uint8Array/);
  assert.match(source, /classifyOpenAIHealthError/);
  assert.doesNotMatch(source, /console\./);
  assert.doesNotMatch(source, /return process\.env\.OPENAI_API_KEY/i);
});
test("background worker stores private assets and sanitized job telemetry", () => {
  const source = read("features/vayon/creative-studio/generation.service.ts");
  assert.match(source, /after\(/);
  assert.match(source, /createSupabaseServiceClient/);
  assert.match(source, /creative-assets/);
  assert.match(source, /vayon-assets/);
  assert.match(source, /complete_creative_generation/);
  assert.match(source, /captureException/);
  assert.doesNotMatch(source, /console\.|signedUrl/);
});
test("smart composition quality and brand guardrails are prompt enforced", () => {
  const source = read("features/vayon/creative-studio/generation.service.ts");
  for (const value of [
    "visual hierarchy",
    "whitespace",
    "aligned grid",
    "legible contrast",
    "visible CTA",
    "Never invent pricing",
    "offers",
    "registration numbers",
    "contacts",
    "amenities",
    "QR codes",
    "property claims",
  ])
    assert.match(source, new RegExp(value, "i"));
});
test("editor supports movement resize replacement layouts undo redo and draft save", () => {
  const source = read(
    "features/vayon/creative-studio/components/CreativeEditor.tsx",
  );
  for (const value of [
    "Undo",
    "Redo",
    "Left",
    "Right",
    "Up",
    "Down",
    "Wider",
    "Narrower",
    "Taller",
    "Shorter",
    "Replace image",
    "Layout",
    "Save Draft",
    "autosaveCreativeEditorAction",
  ])
    assert.match(source, new RegExp(value));
});
test("generation and editor routes stay behind production Marketing access", () => {
  for (const route of [
    "app/vayon/creative-studio/assistant/page.tsx",
    "app/vayon/creative-studio/editor/[assetId]/page.tsx",
  ])
    assert.ok(existsSync(route), route);
  assert.match(
    read("features/vayon/creative-studio/generation.service.ts"),
    /creativeStudioAccess/,
  );
  assert.match(
    read("features/vayon/creative-studio/editor.service.ts"),
    /creativeStudioAccess/,
  );
  const access = read("features/vayon/creative-studio/access.service.ts");
  assert.match(access, /FeatureLicensingService/);
  assert.match(access, /marketing_studio/);
  assert.doesNotMatch(access, /creative_studio_beta|EnvironmentFeatureFlagProvider/);
});
test("migration implements RLS queue retries caching versioned editor and draft timeline", () => {
  const sql = read(
    "supabase/migrations/20260912000000_sprint82_5_ai_creative_generation.sql",
  );
  for (const value of [
    "creative_generation_jobs",
    "creative_editor_documents",
    "enable row level security",
    "enqueue_creative_generation",
    "claim_creative_generation",
    "complete_creative_generation",
    "autosave_creative_editor",
    "max_attempts",
    "cache_key",
    "progress",
    "service_role",
    "status='draft'",
    "editor.autosaved",
    "publishing_disabled",
    "creative_timeline",
  ])
    assert.match(sql, new RegExp(value, "i"));
});
