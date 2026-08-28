import { ButtonLink, EmptyState } from "@/features/platform/design-system";
import { OpenAIWorkforceService } from "../services/openai-workforce.service";
import { OpenAIModelRegistry } from "../services/model-registry";
import { toSettingsModel } from "../view-models/settings";
import { AiChoiceCards } from "@/features/vayon/one-click-experience/OneClickSetup";

export async function OpenAISettings() {
  const service = new OpenAIWorkforceService();
  const [health, telemetry, assignments] = await Promise.all([
    service.health(),
    service.telemetry().catch(() => ({ requests: 0, successes: 0, failures: 0, successRate: null, promptTokens: 0, completionTokens: 0, estimatedSpend: 0, averageLatencyMs: null, lastCall: null })),
    service.assignments(),
  ]);
  const example = new OpenAIModelRegistry().estimate(health.model, 1000, 1000);
  const model = toSettingsModel({ health, telemetry, assignments, estimatedExampleCost: example.totalUsd });
  const status = health.connected ? "Connected" : health.reason ?? "Unknown provider error";
  return <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">AI setup</p><h1 className="mt-1 text-3xl font-semibold">Choose your AI experience</h1><p className="mt-2 max-w-2xl text-sm text-vds-muted">Pick the experience that suits your team. VAYON handles the technical setup.</p></div><ButtonLink href="/vayon/ai/workforce" variant="outline">AI Workforce</ButtonLink></header>
    <div className="mt-6"><AiChoiceCards /></div>
    {!health.connected && <section className="mt-6"><EmptyState title={status} description="This sanitized diagnostic was logged server-side. Advisory operations use deterministic fallback until validation succeeds." /></section>}
    <details className="mt-6 rounded-2xl border border-vds-border bg-vds-surface p-5"><summary className="cursor-pointer font-medium">Advanced Settings</summary><div className="mt-5">
    <section className="mt-6 rounded-2xl border border-vds-border bg-vds-surface p-6"><h2 className="text-xl font-semibold">Provider status</h2><dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
      ["Status", status], ["Connection", health.connected ? "Connected" : "Disconnected"], ["Health", health.state], ["Model", health.model], ["Health latency", health.latencyMs === null ? "Unavailable" : `${health.latencyMs} ms`], ["Quota", health.quota], ["Provider version", health.version], ["API key reference", model.apiKeyReference], ["Estimated 1K + 1K cost", model.estimatedExampleCost ? `$${model.estimatedExampleCost.toFixed(6)}` : "Pricing unavailable"],
    ].map(([term, value]) => <div key={term}><dt className="text-xs text-vds-subtle">{term}</dt><dd className="mt-1 text-sm capitalize">{String(value).replaceAll("_", " ")}</dd></div>)}</dl></section>
    <section className="mt-5 rounded-2xl border border-vds-border bg-vds-surface p-6"><h2 className="text-xl font-semibold">Usage and observability</h2><dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
      ["Requests", model.telemetry.requests], ["Success rate", model.telemetry.successRate === null ? "Unavailable" : `${(model.telemetry.successRate * 100).toFixed(1)}%`], ["Failures", model.telemetry.failures], ["Prompt tokens", model.telemetry.promptTokens], ["Completion tokens", model.telemetry.completionTokens], ["Estimated spend", `$${model.telemetry.estimatedSpend.toFixed(6)}`], ["Average latency", model.telemetry.averageLatencyMs === null ? "Unavailable" : `${model.telemetry.averageLatencyMs} ms`], ["Last call", model.telemetry.lastCall ? new Date(model.telemetry.lastCall).toLocaleString() : "Unavailable"],
    ].map(([term, value]) => <div key={term}><dt className="text-xs text-vds-subtle">{term}</dt><dd className="mt-1 text-sm">{String(value)}</dd></div>)}</dl></section>
    <section className="mt-5 rounded-2xl border border-vds-border bg-vds-surface p-6"><h2 className="text-xl font-semibold">Employee provider assignments</h2><p className="mt-2 text-sm text-vds-muted">Each employee defaults to OpenAI and can be explicitly overridden through environment-managed provider abstraction.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{model.assignments.map((item) => <article key={item.employee} className="rounded-xl border border-vds-border p-4"><h3 className="font-medium capitalize">{item.employee.replaceAll("-", " ")}</h3><p className="mt-2 text-sm capitalize">{item.provider}</p><p className="mt-1 text-xs text-vds-subtle">{item.model ?? "Local rules"} · {item.source.replaceAll("-", " ")}</p></article>)}</div></section>
    <section className="mt-5 rounded-2xl border border-vds-border bg-vds-surface p-6"><h2 className="text-xl font-semibold">Safety and governance</h2><p className="mt-2 text-sm text-vds-muted">Prompts require workspace attribution, pass validation and moderation, and are not logged. Outputs remain recommendation-only and require Workflow Approval.</p></section></div></details>
  </main>;
}
