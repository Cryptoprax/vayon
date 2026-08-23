export type KnowledgeFailureCode =
  | "missing_table"
  | "missing_rpc"
  | "permission_denied"
  | "tenant_context_missing"
  | "subscription_unavailable"
  | "feature_unavailable"
  | "timeout"
  | "provider_unavailable"
  | "repository_error";

export interface KnowledgeFailure {
  readonly code: KnowledgeFailureCode;
  readonly message: string;
  readonly retryable: boolean;
  readonly sqlObject?: string;
  readonly retryRecommendation: string;
}

type ErrorLike = { code?: unknown; message?: unknown; details?: unknown };

const text = (error: unknown) => {
  if (!(error instanceof Error) && (!error || typeof error !== "object"))
    return "Unknown knowledge error";
  const value = error as ErrorLike;
  return `${value.message ?? ""} ${value.details ?? ""}`.slice(0, 1_000);
};

const objectFrom = (message: string) =>
  message.match(/(?:relation|function)\s+["']?([a-z0-9_.]+)["']?/i)?.[1];

export function classifyKnowledgeFailure(error: unknown): KnowledgeFailure {
  const value = (error && typeof error === "object" ? error : {}) as ErrorLike;
  const code = String(value.code ?? "");
  const message = text(error);
  const sqlObject = objectFrom(message);
  if (code === "42P01" || /relation .* does not exist/i.test(message))
    return { code: "missing_table", message: "Knowledge temporarily unavailable.", retryable: false, sqlObject, retryRecommendation: "apply_version1_knowledge_schema" };
  if (code === "PGRST202" || code === "42883" || /function .* does not exist|could not find the function/i.test(message))
    return { code: "missing_rpc", message: "Knowledge temporarily unavailable.", retryable: false, sqlObject, retryRecommendation: "apply_version1_knowledge_rpcs" };
  if (code === "42501" || /permission denied|row-level security|not authorized/i.test(message))
    return { code: "permission_denied", message: "Knowledge is unavailable for your current role.", retryable: false, retryRecommendation: "verify_membership_role_and_rls" };
  if (/active organization and workspace required|organization|workspace/i.test(message) && /required|missing|unavailable/i.test(message))
    return { code: "tenant_context_missing", message: "Finish workspace setup to use Knowledge.", retryable: false, retryRecommendation: "complete_organization_and_workspace_setup" };
  if (/subscription|entitlement|plan/i.test(message))
    return { code: "subscription_unavailable", message: "Knowledge is unavailable for the current subscription.", retryable: false, retryRecommendation: "verify_subscription_entitlement" };
  if (/feature.*(?:disabled|unavailable)/i.test(message))
    return { code: "feature_unavailable", message: "Knowledge is not enabled for this workspace.", retryable: false, retryRecommendation: "verify_knowledge_feature_configuration" };
  if (code === "ETIMEDOUT" || /timeout|timed out|abort/i.test(message))
    return { code: "timeout", message: "Knowledge temporarily unavailable.", retryable: true, retryRecommendation: "retry_with_backoff" };
  if (/fetch failed|network|provider unavailable|service unavailable/i.test(message))
    return { code: "provider_unavailable", message: "Knowledge temporarily unavailable.", retryable: true, retryRecommendation: "retry_and_verify_provider_health" };
  return { code: "repository_error", message: "Knowledge temporarily unavailable.", retryable: true, sqlObject, retryRecommendation: "inspect_structured_server_log" };
}

export function logKnowledgeFailure(error: unknown, failure: KnowledgeFailure, context: { correlationId: string; organizationId?: string; workspaceId?: string; userId?: string; operation: string; rpc?: string }) {
  const original = text(error).replace(/[A-Za-z0-9_-]{24,}/g, "[redacted]");
  console.error(JSON.stringify({ level: "error", event: "knowledge.failure", timestamp: new Date().toISOString(), route: "/vayon/knowledge", organizationId: context.organizationId ?? null, workspaceId: context.workspaceId ?? null, userId: context.userId ?? null, repository: "KnowledgeRepository", service: "EnterpriseKnowledgeService", provider: "trusted-hybrid-retrieval-v1", operation: context.operation, rpc: context.rpc ?? null, sqlObject: failure.sqlObject ?? null, correlationId: context.correlationId, errorCode: failure.code, diagnostic: original, retryRecommendation: failure.retryRecommendation }));
}
