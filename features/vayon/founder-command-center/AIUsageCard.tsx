import "server-only";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { OpenAIRepository } from "@/features/platform/openai/repositories/openai.repository";

export async function AIUsageCard() {
  const context = await operationsContext();
  const repository = new OpenAIRepository(context);
  const since = new Date(); since.setHours(0, 0, 0, 0);
  const [telemetry, todayUsage, approvals, health] = await Promise.all([
    repository.telemetry().catch(() => ({ requests: 0, successes: 0, failures: 0, successRate: null, promptTokens: 0, completionTokens: 0, estimatedSpend: 0, averageLatencyMs: null, lastCall: null })),
    context.client.from("ai_runtime_outputs").select("id", { count: "exact", head: true }).eq("organization_id", context.organizationId).eq("workspace_id", context.workspaceId).eq("provider", "openai").gte("created_at", since.toISOString()),
    context.client.from("ai_approval_queue").select("id", { count: "exact", head: true }).eq("organization_id", context.organizationId).eq("workspace_id", context.workspaceId).eq("status", "pending"),
    context.client.from("integration_health").select("status,last_failure_at,integration_providers!inner(code)").eq("organization_id", context.organizationId).eq("workspace_id", context.workspaceId).eq("integration_providers.code", "openai").maybeSingle(),
  ]);
  const today = todayUsage.count ?? 0;
  const availability = !process.env.OPENAI_API_KEY ? "Unavailable" : health.data?.last_failure_at || health.data?.status === "degraded" ? "Warning" : health.data?.status === "healthy" ? "Healthy" : "Connected";
  const values = [["Today's AI usage", `${today} successful request${today === 1 ? "" : "s"}`], ["Estimated AI cost", `$${telemetry.estimatedSpend.toFixed(4)}`], ["Successful requests", telemetry.successes.toLocaleString()], ["Pending approvals", String(approvals.count ?? 0)], ["AI availability", availability]];
  return <section aria-labelledby="ai-usage-title" className="rounded-2xl border border-vds-border bg-vds-surface p-5"><p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">Production AI</p><h2 id="ai-usage-title" className="mt-2 text-lg font-semibold">AI usage and governance</h2><dl className="mt-5 grid gap-4 sm:grid-cols-2">{values.map(([label, value]) => <div key={label}><dt className="text-xs text-vds-muted">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>)}</dl><p className="mt-4 text-xs text-vds-muted">Costs are estimates from recorded model usage. Actions remain queued for human approval.</p></section>;
}
