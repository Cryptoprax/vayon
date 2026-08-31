export type OperatingSystemModule = "crm" | "creative" | "growth" | "workforce" | "operations" | "analytics" | "approvals";

export interface OperatingSystemCommand {
  readonly intent: string;
  readonly module: OperatingSystemModule;
  readonly route: string;
  readonly permission: string;
  readonly workspaceRequired: true;
  readonly approvalRequired: boolean;
  readonly voiceReady: true;
  readonly context: Readonly<Record<string, string>>;
}

const workflows: readonly { pattern: RegExp; intent: string; module: OperatingSystemModule; route: string; permission: string; approval: boolean }[] = [
  { pattern: /brochure|flyer|presentation|landing page|facebook|instagram|linkedin|google ads|reel|video|shorts|tiktok|description|seo blog|qr code|open house|creative/i, intent: "create-marketing-asset", module: "creative", route: "/vayon/creative", permission: "creative.create", approval: true },
  { pattern: /find buyers|property match|interested.+(?:villa|property|apartment)/i, intent: "match-buyers", module: "crm", route: "/vayon/property-matching", permission: "crm.read", approval: false },
  { pattern: /email.+(?:buyer|lead)|whatsapp.+(?:buyer|lead)|call.+lead|follow.?up|proposal/i, intent: "engage-lead", module: "workforce", route: "/vayon/ai/workforce/sales-ai", permission: "crm.update", approval: true },
  { pattern: /schedule|book.+viewing|calendar|reminder|task/i, intent: "coordinate-operations", module: "operations", route: "/vayon/calendar", permission: "operations.create", approval: true },
  { pattern: /monthly report|report|analytics|performance|roi|forecast/i, intent: "review-intelligence", module: "analytics", route: "/vayon/analytics", permission: "analytics.read", approval: false },
  { pattern: /approve|approval|review draft/i, intent: "review-approval", module: "approvals", route: "/vayon/approvals", permission: "approvals.review", approval: false },
];

export function resolveOperatingSystemCommand(prompt: string): OperatingSystemCommand {
  const normalized = prompt.trim();
  const workflow = workflows.find((candidate) => candidate.pattern.test(normalized)) ?? { intent: "ask-workforce", module: "workforce" as const, route: "/vayon/ai", permission: "ai.use", approval: false };
  const context = extractContext(normalized);
  const query = new URLSearchParams({ intent: workflow.intent, prompt: normalized, ...context });
  return { intent: workflow.intent, module: workflow.module, route: `${workflow.route}?${query}`, permission: workflow.permission, workspaceRequired: true, approvalRequired: workflow.approval, voiceReady: true, context };
}

function extractContext(prompt: string): Readonly<Record<string, string>> {
  const property = prompt.match(/(?:for|about)\s+(.+)$/i)?.[1]?.trim();
  return property ? { context: property } : {};
}
