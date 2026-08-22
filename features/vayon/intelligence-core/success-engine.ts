import type {
  IntelligenceModule,
  OnboardingMilestone,
  SuccessSignal,
  SuccessSnapshot,
} from "./contracts";

export function detectOnboardingMilestone(
  route: string,
  selectedRecord: string | null,
  emptyState: boolean,
): OnboardingMilestone | null {
  if (emptyState) return null;
  if (/\/properties\/projects\/[\w-]+$/.test(route) && selectedRecord)
    return "first_project";
  if (/\/properties\/(inventory|availability)/.test(route))
    return "first_inventory";
  if (/\/(crm\/)?leads\/[\w-]+$/.test(route) && selectedRecord)
    return "first_lead";
  if (/\/site-visits\/[\w-]+$/.test(route) && selectedRecord)
    return "first_visit";
  if (/\/creative-studio\/(wizard|packs|editor)/.test(route))
    return "first_campaign";
  return null;
}

const signal = (value: SuccessSignal) => Object.freeze(value);

export function detectSuccessSignals(
  snapshot: SuccessSnapshot,
  module: IntelligenceModule,
): readonly SuccessSignal[] {
  const results: SuccessSignal[] = [];
  if (snapshot.validationError)
    results.push(
      signal({
        kind: "validation_error",
        title: "That information needs attention",
        explanation:
          "Vayon could not validate one or more fields. Your existing data was not changed.",
        nextStep:
          "Review the highlighted fields, correct the values, and retry.",
        retryable: true,
        prompt: "Explain this validation error",
        helpHref: module.helpResources[0]?.href ?? "/vayon/knowledge/help",
        videoHref: null,
      }),
    );
  if (snapshot.permissionDenied)
    results.push(
      signal({
        kind: "permission_issue",
        title: "This action needs additional access",
        explanation:
          "Your current role does not include the required permission.",
        nextStep:
          "Ask an organization administrator to review your role. No access was bypassed.",
        retryable: false,
        prompt: "Explain the permission I need",
        helpHref: "/vayon/settings/permissions",
        videoHref: null,
      }),
    );
  if (snapshot.configurationIssue)
    results.push(
      signal({
        kind: "configuration_issue",
        title: "Setup is incomplete",
        explanation: "A required connection or module setting is unavailable.",
        nextStep: "Review Integration Settings, then retry from this page.",
        retryable: true,
        prompt: "Help me finish configuration",
        helpHref: "/vayon/settings/integrations",
        videoHref: null,
      }),
    );
  if (!snapshot.onboardingComplete)
    results.push(
      signal({
        kind: "incomplete_onboarding",
        title: "Finish setting up your workspace",
        explanation:
          "Completing onboarding unlocks the recommended starting workflow.",
        nextStep:
          "Resume the onboarding checklist without losing current progress.",
        retryable: false,
        prompt: "What should I configure next?",
        helpHref: "/onboarding",
        videoHref: "/vayon/knowledge/help?q=onboarding",
      }),
    );
  if (snapshot.emptyState)
    results.push(
      signal({
        kind: "empty_state",
        title: `No ${module.name.toLowerCase()} records yet?`,
        explanation:
          "This workspace is ready, but this page has no records to show.",
        nextStep: module.actions[0]?.label ?? "Open the relevant guide.",
        retryable: false,
        prompt: module.suggestedPrompts[0] ?? "Help me get started",
        helpHref: module.helpResources[0]?.href ?? "/vayon/knowledge/help",
        videoHref: `/vayon/knowledge/help?q=${encodeURIComponent(module.name)}%20video`,
      }),
    );
  if (snapshot.failureCount >= 2)
    results.push(
      signal({
        kind: "repeated_failure",
        title: "This operation has failed more than once",
        explanation:
          "Repeating the same request may not resolve the underlying issue.",
        nextStep:
          "Review the troubleshooting guidance before retrying. No technical details or secrets are exposed.",
        retryable: true,
        prompt: "Troubleshoot this repeated failure",
        helpHref: "/vayon/knowledge/help?q=troubleshooting",
        videoHref: null,
      }),
    );
  if (snapshot.workflowLatencyMs !== null && snapshot.workflowLatencyMs > 5000)
    results.push(
      signal({
        kind: "slow_workflow",
        title: "This workflow is taking longer than expected",
        explanation:
          "The workflow is still governed and may be waiting for a provider or approval.",
        nextStep:
          "Check workflow status and pending approvals before starting another run.",
        retryable: false,
        prompt: "Explain this slow workflow",
        helpHref: "/vayon/workflows/runtime",
        videoHref: null,
      }),
    );
  if (snapshot.inactiveMs >= 300000)
    results.push(
      signal({
        kind: "long_inactivity",
        title: "Ready to continue?",
        explanation: "Your work remains available after this pause.",
        nextStep: module.suggestedPrompts[0] ?? "Review this page",
        retryable: false,
        prompt: "Help me continue where I left off",
        helpHref: module.helpResources[0]?.href ?? "/vayon/knowledge/help",
        videoHref: null,
      }),
    );
  if (snapshot.firstVisit && results.length === 0)
    results.push(
      signal({
        kind: "first_visit",
        title: `Welcome to ${module.name}`,
        explanation: module.description,
        nextStep: module.suggestedPrompts[0] ?? "Explore the available guide.",
        retryable: false,
        prompt: module.suggestedPrompts[0] ?? "Help me get started",
        helpHref: module.helpResources[0]?.href ?? "/vayon/knowledge/help",
        videoHref: `/vayon/knowledge/help?q=${encodeURIComponent(module.name)}%20video`,
      }),
    );
  return Object.freeze(results);
}

export function explainFailure(raw: string | null): string | null {
  if (!raw) return null;
  const value = raw.toLowerCase();
  if (value.includes("permission") || value.includes("forbidden"))
    return "Your role does not allow this operation. Ask an administrator to review your permissions.";
  if (value.includes("validation") || value.includes("invalid"))
    return "Some information was not accepted. Review the required fields and retry.";
  if (value.includes("timeout") || value.includes("network"))
    return "The provider did not respond in time. Your data remains unchanged; wait briefly and retry.";
  if (value.includes("connect") || value.includes("configuration"))
    return "A required integration is not connected or configured. Review Integration Settings and retry.";
  return "The operation could not be completed. Your data remains unchanged. Retry, consult the relevant guide, or contact Support if it continues.";
}
