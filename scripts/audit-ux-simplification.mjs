import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const mode = process.argv[2] ?? "all";
const read = (path) => readFile(path, "utf8");
const onboarding = await read("features/onboarding/components/EnterpriseOnboardingWizard.tsx");
const billing = await read("app/vayon/settings/billing/page.tsx");
const workflows = await read("app/vayon/workflows/page.tsx");
const workforce = await read("app/vayon/ai/employees/page.tsx");
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
}

if (mode === "all" || mode === "accessibility") {
  requireMatch(onboarding, /aria-pressed=\{selected\}/, "Choice cards do not expose selection state.");
  requireMatch(onboarding, /aria-label=\{`Setup/, "Onboarding progress lacks an accessible label.");
  requireMatch(onboarding, /motion-reduce:transition-none/, "Onboarding does not respect reduced motion.");
  requireMatch(onboarding, /<h1/, "Onboarding lacks a primary heading.");
}

if (mode === "all" || mode === "responsive") {
  for (const pattern of [/sm:px-10/, /sm:grid-cols-2/, /lg:grid-cols-4/, /sm:grid-cols-3/])
    requireMatch(onboarding, pattern, `Onboarding responsive contract is missing ${pattern}.`);
  requireMatch(billing, /lg:grid-cols-2/, "Billing details lack a responsive layout.");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`UX ${mode} audit passed.`);
}

export const auditUxSimplification = () => Object.freeze([...failures]);
void fileURLToPath(import.meta.url);
