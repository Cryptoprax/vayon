import type { WhatsAppTemplate } from "@/features/platform/whatsapp/domain/models";

/**
 * Phase M7: pure template selection/validation/rendering logic. No I/O, no
 * Meta call, no AI. Meta's own template component shape ({{1}}, {{2}}
 * positional placeholders in HEADER/BODY text) is the only variable model
 * supported -- raw client JSON never becomes a Graph template component
 * directly (Part 6): every value here is validated, bounded, and stripped
 * of control characters before being shaped into the exact component array
 * sendTemplate() sends.
 */

/** Only Meta's own "APPROVED" status is ever treated as usable (Part 4) -- rejected/paused/disabled/pending are never offered. */
export const usableTemplateStatus = "APPROVED";

export function filterUsableTemplates(templates: readonly WhatsAppTemplate[]): readonly WhatsAppTemplate[] {
  return templates.filter((template) => template.status === usableTemplateStatus);
}

export function languagesForTemplateName(templates: readonly WhatsAppTemplate[], name: string): readonly string[] {
  return [...new Set(templates.filter((template) => template.name === name).map((template) => template.language))];
}

export function findUsableTemplate(templates: readonly WhatsAppTemplate[], name: string, language: string): WhatsAppTemplate | null {
  return filterUsableTemplates(templates).find((template) => template.name === name && template.language === language) ?? null;
}

const placeholderPattern = /\{\{(\d+)\}\}/g;

function countPlaceholders(text: string | null): number {
  if (!text) return 0;
  const indices = new Set<number>();
  for (const match of text.matchAll(placeholderPattern)) indices.add(Number(match[1]));
  return indices.size;
}

export type VariableComponentType = "HEADER" | "BODY";
export interface TemplateComponentPlan {
  readonly type: VariableComponentType;
  readonly placeholderCount: number;
}

/** Which components actually need variables, and how many -- derived purely from the provider template's own text, never guessed. */
export function planTemplateVariables(template: WhatsAppTemplate): readonly TemplateComponentPlan[] {
  return template.components
    .filter((component): component is { type: VariableComponentType; text: string | null } => component.type === "HEADER" || component.type === "BODY")
    .map((component) => ({ type: component.type, placeholderCount: countPlaceholders(component.text) }))
    .filter((plan) => plan.placeholderCount > 0);
}

export const maxTemplateVariableLength = 300;

export type TemplateVariableErrorCode = "VARIABLE_COUNT_MISMATCH" | "VARIABLE_TOO_LONG" | "INVALID_VARIABLE";
export class TemplateVariableError extends Error {
  constructor(readonly code: TemplateVariableErrorCode) {
    super(code);
    this.name = "TemplateVariableError";
  }
}

export type TemplateVariablesByComponent = Readonly<Partial<Record<VariableComponentType, readonly string[]>>>;

function sanitizeVariable(value: unknown): string {
  if (typeof value !== "string") throw new TemplateVariableError("INVALID_VARIABLE");
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxTemplateVariableLength) throw new TemplateVariableError("VARIABLE_TOO_LONG");
  // Never let raw client text become an unescaped Graph component -- strip control characters.
  return trimmed.replace(/[\x00-\x1f\x7f]/g, "");
}

export interface BuiltTemplateComponent {
  readonly type: "header" | "body";
  readonly parameters: readonly { readonly type: "text"; readonly text: string }[];
}

/**
 * Server-side validation + construction of the exact component array
 * sendTemplate() will send. Throws TemplateVariableError (never silently
 * truncates/pads) if the supplied variable count does not exactly match the
 * template's own placeholder count for a component (Part 6/18).
 */
export function validateAndBuildTemplateComponents(template: WhatsAppTemplate, variablesByComponent: TemplateVariablesByComponent): readonly BuiltTemplateComponent[] {
  const plan = planTemplateVariables(template);
  return plan.map((component) => {
    const supplied = variablesByComponent[component.type] ?? [];
    if (supplied.length !== component.placeholderCount) throw new TemplateVariableError("VARIABLE_COUNT_MISMATCH");
    return { type: component.type.toLowerCase() as "header" | "body", parameters: supplied.map((value) => ({ type: "text" as const, text: sanitizeVariable(value) })) };
  });
}

/**
 * Renders the exact same normalized model passed to sendTemplate() into
 * human-readable preview text (Part 30) -- never a separately-composed
 * preview that could drift from what Meta actually sends.
 */
export function renderTemplatePreview(template: WhatsAppTemplate, variablesByComponent: TemplateVariablesByComponent): string {
  const lines: string[] = [];
  for (const component of template.components) {
    if (component.type !== "HEADER" && component.type !== "BODY" && component.type !== "FOOTER") continue;
    if (!component.text) continue;
    let text = component.text;
    if (component.type === "HEADER" || component.type === "BODY") {
      const values = variablesByComponent[component.type] ?? [];
      text = text.replace(placeholderPattern, (_match, indexStr: string) => {
        const index = Number(indexStr);
        const value = values[index - 1];
        return value !== undefined ? sanitizeVariable(value) : `{{${index}}}`;
      });
    }
    lines.push(text);
  }
  return lines.join("\n\n");
}
