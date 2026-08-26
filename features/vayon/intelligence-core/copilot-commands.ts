import type { ContextGraph } from "./contracts";

export interface CopilotResolution {
  readonly response: string;
  readonly href?: string;
  readonly actionLabel?: string;
}

const routes: readonly {
  readonly pattern: RegExp;
  readonly href: string;
  readonly label: string;
}[] = [
  { pattern: /\b(create|build|plan|run|duplicate|search)\s+(a\s+)?workflow\b/i, href: "/vayon/workflows", label: "Open Workflow Planner" },
  { pattern: /\blaunch (our|a|the)?\s*(new )?.*business\b/i, href: "/vayon/workflows?template=launch-business", label: "Preview Launch Business Workflow" },
  { pattern: /\b(open|show)\s+(the\s+)?crm\b/i, href: "/vayon/crm", label: "Open CRM" },
  { pattern: /\b(founder|founder dashboard|founder os)\b/i, href: "/platform/founder", label: "Open Founder Dashboard" },
  { pattern: /\b(analytics|top performing campaigns?)\b/i, href: "/vayon/analytics", label: "Open Analytics" },
  { pattern: /\b(proposal|pitch deck|document)\b/i, href: "/vayon/creative/documents", label: "Open Documents" },
  { pattern: /\b(marketing campaign|campaign)\b/i, href: "/vayon/creative/campaigns", label: "Open Campaign Studio" },
  { pattern: /\b(image|creative image)\b/i, href: "/vayon/creative/images", label: "Open Image Studio" },
  { pattern: /\b(video|marketing video)\b/i, href: "/vayon/creative/videos", label: "Open Video Studio" },
  { pattern: /\b(ai sales employee|ai employee|sales agent)\b/i, href: "/onboarding/ai-workforce", label: "Configure AI Workforce" },
  { pattern: /\b(business launch|launch business)\b/i, href: "/onboarding/business-launch", label: "Open Business Launch" },
  { pattern: /\b(overdue opportunities?|pipeline review)\b/i, href: "/vayon/deals", label: "Review Pipeline" },
  { pattern: /\b(tasks? for this meeting|meeting tasks?)\b/i, href: "/vayon/tasks", label: "Open Tasks" },
  { pattern: /\b(creative studio)\b/i, href: "/vayon/creative", label: "Open Creative Studio" },
];

export function resolveCopilotCommand(
  input: string,
  context: ContextGraph,
): CopilotResolution {
  const request = input.trim();
  if (/\b(morning brief|afternoon brief|end of day|today'?s activity|summary)\b/i.test(request)) {
    return {
      response: `I can prepare an evidence-safe brief for ${context.workspace} from the current ${context.moduleName} context. No verified business metrics are attached to this experience, so I will not infer revenue, activity, or performance. Open the Executive Command Center to review connected evidence.`,
      href: "/vayon/dashboard",
      actionLabel: "Open Executive Command Center",
    };
  }
  const route = routes.find((candidate) => candidate.pattern.test(request));
  if (route) {
    return {
      response: `I understood this as “${route.label}” from ${context.moduleName}. I prepared the existing governed workflow; nothing has been created or executed yet.`,
      href: route.href,
      actionLabel: route.label,
    };
  }
  return {
    response: `I understand the request in the context of ${context.moduleName} · ${context.page}. I do not have enough verified evidence or an approved local action to complete it safely. Try a search, open a workspace, or choose one of the suggested actions.`,
  };
}
