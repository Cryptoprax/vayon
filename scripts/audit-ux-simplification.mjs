import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const mode = process.argv[2] ?? "all";
const read = (path) => readFile(path, "utf8");
const onboarding = await read("features/onboarding/components/EnterpriseOnboardingWizard.tsx");
const billing = await read("app/vayon/settings/billing/page.tsx");
const workflows = await read("app/vayon/workflows/page.tsx");
const workforce = await read("app/vayon/ai/employees/page.tsx");
const adaptive = await read("features/vayon/adaptive-workspace/AdaptiveWorkspace.tsx");
const quickCreate = await read("features/vayon/product-shell/QuickCreate.tsx");
const constitution = await read("docs/UX_CONSTITUTION.md");
const failures = [];
const requireMatch = (source, pattern, message) => { if (!pattern.test(source)) failures.push(message); };
const forbid = (source, pattern, message) => { if (pattern.test(source)) failures.push(message); };

if (mode === "all" || mode === "simplification") {
  for (const copy of ["What business are you?", "What should VAYON do first?", "Connect your everyday tools", "Your workspace is ready to create", "Recommended"])
    requireMatch(onboarding, new RegExp(copy.replace(/[?]/g, "\\?")), `Onboarding is missing: ${copy}`);
  forbid(onboarding, /Preferred provider|Default model|Template names|Email addresses \(comma separated\)|Company logo asset path/, "Onboarding exposes removed configuration fields.");
  requireMatch(billing, /hasBillingAccount &&/, "Advanced billing is not gated to an existing billing account.");
  requireMatch(billing, /<details/, "Billing complexity is not progressively disclosed.");
  requireMatch(workflows, /Advanced workflow settings/, "Workflow designer is not progressively disclosed.");
  forbid(workforce, /GPT workforce/, "AI workforce exposes a technical model name.");
  for (const phrase of ["recommended objective", "Made for you", "Continue where you left off", "Open Sample Workspace"])
    requireMatch(adaptive, new RegExp(phrase, "i"), `Adaptive workspace is missing: ${phrase}`);
  for (const item of ["Customer", "Proposal", "Campaign", "AI Employee", "Image", "Video", "Meeting", "Task", "Workflow", "Website", "Presentation"])
    requireMatch(quickCreate, new RegExp(`label:\"${item}\"`), `Global Create is missing ${item}.`);
  for (const rule of ["Never ask twice", "Detect automatically", "Recommend everything", "Hide advanced settings", "One primary action", "Fewer than five inputs", "Setup under 60 seconds", "AI should always guide", "Reduce clicks every sprint"])
    requireMatch(constitution, new RegExp(rule, "i"), `UX Constitution is missing: ${rule}`);
}

if (mode === "all" || mode === "accessibility") {
  requireMatch(onboarding, /aria-pressed=\{selected\}/, "Choice cards do not expose selection state.");
  requireMatch(onboarding, /aria-label=\{`Setup/, "Onboarding progress lacks an accessible label.");
  requireMatch(onboarding, /motion-reduce:transition-none/, "Onboarding does not respect reduced motion.");
  requireMatch(onboarding, /<h1/, "Onboarding lacks a primary heading.");
  requireMatch(adaptive, /aria-pressed=\{pinned\.includes/, "Adaptive module pinning lacks selection semantics.");
  requireMatch(quickCreate, /aria-haspopup="menu"/, "Global Create lacks menu semantics.");
}

if (mode === "all" || mode === "responsive") {
  for (const pattern of [/sm:px-10/, /sm:grid-cols-2/, /lg:grid-cols-4/, /sm:grid-cols-3/])
    requireMatch(onboarding, pattern, `Onboarding responsive contract is missing ${pattern}.`);
  requireMatch(billing, /lg:grid-cols-2/, "Billing details lack a responsive layout.");
  requireMatch(adaptive, /sm:grid-cols-2 xl:grid-cols-5/, "Adaptive modules lack responsive layout rules.");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`UX ${mode} audit passed.`);
}

export const auditUxSimplification = () => Object.freeze([...failures]);
void fileURLToPath(import.meta.url);
