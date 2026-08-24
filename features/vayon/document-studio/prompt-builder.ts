import type { DocumentWizardInput } from "./types";
export interface DocumentBrandContext {
  readonly name: string;
  readonly voice: string;
  readonly colours: readonly string[];
  readonly typography: readonly string[];
  readonly mission: string | null;
  readonly vision: string | null;
  readonly ctaStyle: string | null;
  readonly legalFooter: string | null;
}
export interface UnifiedDocumentPromptContext {
  readonly workspaceId: string;
  readonly brand: DocumentBrandContext | null;
  readonly campaign: string | null;
  readonly input: DocumentWizardInput;
}
const line = (label: string, value: string | null | readonly string[]) =>
  `${label}: ${Array.isArray(value) ? value.join(", ") : value || "Not supplied — request clarification and do not invent."}`;
export function buildDocumentPrompt(context: UnifiedDocumentPromptContext) {
  const { input, brand } = context;
  return [
    input.prompt,
    line("Workspace", context.workspaceId),
    line("Company", input.company),
    line("Industry", input.industry),
    line("Audience", input.audience),
    line("Purpose", input.purpose),
    line("Language", input.language),
    line("Document type", input.documentType),
    line("Length", input.length),
    line("Campaign", context.campaign),
    line("Brand", brand?.name ?? null),
    line("Brand voice", brand?.voice ?? null),
    line("Brand colours", brand?.colours ?? []),
    line("Typography references", brand?.typography ?? []),
    line("Mission", brand?.mission ?? null),
    line("Vision", brand?.vision ?? null),
    line("Tone", input.tone || brand?.voice || null),
    line("CTA style", brand?.ctaStyle ?? null),
    line("Legal footer", brand?.legalFooter ?? null),
    "Factual policy: use only supplied facts. Mark missing business information explicitly.",
    "Output policy: produce an editable draft with titled sections and coherent blocks.",
  ].join("\n");
}
