import {
  Activity,
  Bot,
  BrainCircuit,
  Database,
  GitBranch,
  Search,
  ShieldCheck,
} from "lucide-react";
import { WorkforceChatPanel } from "@/features/platform/openai/runtime/ChatPanel";
import { Button } from "@/features/platform/design-system";
import type { OpenAIHealth } from "@/features/platform/openai/domain/models";
import type { ConversationSnapshot } from "@/features/platform/openai/runtime/models";
import type { UnifiedAIContextSnapshot } from "../services/unified-ai-context.service";
const card =
  "rounded-3xl border border-vds-border/70 bg-vds-surface/70 shadow-xl shadow-vds-shadow/10 backdrop-blur-xl";
export function UnifiedAIContextDashboard({
  data,
  history,
  health,
  query,
}: {
  data: UnifiedAIContextSnapshot;
  history: ConversationSnapshot;
  health: OpenAIHealth;
  query: string;
}) {
  const o = data.observability,
    kpis = [
      ["Context graph", o.graphHealth],
      ["Graph nodes", o.nodeCount],
      ["Relationships", o.edgeCount],
      ["Memory usage", o.memoryUsage],
      ["Retrieval latency", `${o.retrievalLatencyMs} ms`],
      [
        "Cache hit rate",
        o.cacheHitRate === null ? "Unavailable" : `${o.cacheHitRate}%`,
      ],
      ["Embedding queue", o.embeddingQueue.replaceAll("_", " ")],
      ["Provider availability", o.providerAvailability],
    ] as const,
    types = [...new Set(data.graph.nodes.map((node) => node.type))];
  return (
    <main className="mx-auto w-full max-w-[120rem] space-y-8 px-4 py-7 sm:px-6 lg:px-8">
      <header className={`${card} p-6 sm:p-8`}>
        <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-vds-primary">
          Founder Portal · tenant-isolated intelligence
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">
          Unified AI Memory & Context Graph
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-vds-muted">
          One governed intelligence layer for business relationships, trusted
          retrieval, shared AI memory, collaboration evidence, and explainable
          executive context.
        </p>
        <p className="mt-4 text-xs text-vds-subtle">
          Updated {new Date(data.generatedAt).toLocaleString()}
        </p>
      </header>
      <section
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Developer observability"
      >
        {kpis.map(([label, value]) => (
          <article className={`${card} min-h-28 p-4`} key={label}>
            <p className="text-[10px] uppercase tracking-[.13em] text-vds-subtle">
              {label}
            </p>
            <p className="mt-4 text-xl font-semibold capitalize">{value}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <div>
          <Heading
            icon={GitBranch}
            title="Business context graph"
            detail="Cross-references remain inside the authorized organization and workspace"
          />
          <div className={`${card} overflow-x-auto p-5`}>
            <div className="flex min-w-[50rem] flex-wrap gap-3">
              {types.map((type) => {
                const nodes = data.graph.nodes.filter(
                  (node) => node.type === type,
                );
                return (
                  <article
                    className="min-w-44 flex-1 rounded-2xl border border-vds-border bg-vds-elevated p-4"
                    key={type}
                  >
                    <h3 className="text-xs font-semibold uppercase text-vds-primary">
                      {type.replaceAll("_", " ")}
                    </h3>
                    <p className="mt-3 text-2xl font-semibold">
                      {nodes.length}
                    </p>
                    <p className="mt-1 text-xs text-vds-muted">
                      {nodes[0]?.module ?? "Unavailable"} source
                    </p>
                  </article>
                );
              })}
            </div>
            <p className="mt-5 text-xs text-vds-subtle">
              {data.graph.edges.length} tenant-membership relationship(s).
              Unavailable modules:{" "}
              {data.graph.unavailableModules.join(", ") || "none"}.
            </p>
          </div>
        </div>
        <div>
          <Heading
            icon={Database}
            title="Memory governance"
            detail="Retention, expiration, deletion and scope policies"
          />
          <div className="space-y-3">
            {data.memoryScopes.map((item) => (
              <article className={`${card} p-4`} key={item.scope}>
                <h3 className="font-medium capitalize">{item.scope} memory</h3>
                <p className="mt-1 text-xs text-vds-muted">
                  {item.duration} · {item.retention}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section>
        <Heading
          icon={Search}
          title="Unified retrieval"
          detail="Knowledge, CRM, Sales, Marketing, Customer Success, documents, reports and support"
        />
        <form className="flex gap-2" action="/platform/founder/memory">
          <label className="sr-only" htmlFor="context-search">
            Search authorized context
          </label>
          <input
            id="context-search"
            name="q"
            defaultValue={query}
            maxLength={120}
            placeholder="Search authorized business context"
            className="h-11 min-w-0 flex-1 rounded-xl border border-vds-border bg-vds-input px-4"
          />
          <Button className="px-5" type="submit">
            Search
          </Button>
        </form>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.retrieval.result.map((item) => (
            <article className={`${card} p-4`} key={item.id}>
              <p className="text-[10px] uppercase text-vds-primary">
                {item.module} · {item.entityType.replaceAll("_", " ")}
              </p>
              <h3 className="mt-2 font-medium">{item.title}</h3>
              <p className="mt-2 text-xs text-vds-muted">{item.summary}</p>
              <p className="mt-3 text-[10px] text-vds-subtle">
                Evidence score {item.score} ·{" "}
                {item.observedAt
                  ? new Date(item.observedAt).toLocaleString()
                  : "Timestamp unavailable"}
              </p>
            </article>
          ))}
          {!data.retrieval.result.length && (
            <p
              className={`${card} col-span-full py-12 text-center text-sm text-vds-muted`}
            >
              {data.retrieval.unavailableReason}
            </p>
          )}
        </div>
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <div>
          <Heading
            icon={Bot}
            title="Cross-AI collaboration"
            detail="Structured tasks, dependencies, progress and evidence from the existing orchestrator"
          />
          <div className={`${card} p-5`}>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Metric
                label="Active"
                value={data.collaboration.activeCollaborations}
              />
              <Metric
                label="Pending approvals"
                value={data.collaboration.pendingApprovals}
              />
              <Metric
                label="Requests"
                value={data.collaboration.observability.requestCount}
              />
            </div>
            <div className="mt-5 space-y-3">
              {data.collaboration.recommendationPipeline
                .slice(0, 8)
                .map((item) => (
                  <article
                    className="rounded-xl border border-vds-border p-3"
                    key={item.id}
                  >
                    <div className="flex justify-between gap-3">
                      <h3 className="text-sm font-medium">{item.employee}</h3>
                      <span className="text-[10px] uppercase text-vds-primary">
                        {item.approvalStatus}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-vds-muted">
                      {item.requestedRecommendation}
                    </p>
                    <p className="mt-2 text-[10px] text-vds-subtle">
                      Confidence {item.confidence ?? "unavailable"} ·{" "}
                      {item.latencyMs ?? "—"} ms · evidence stored with run{" "}
                      {item.runId.slice(0, 8)}
                    </p>
                  </article>
                ))}
              {!data.collaboration.recommendationPipeline.length && (
                <p className="py-8 text-center text-sm text-vds-muted">
                  No collaboration tasks recorded.
                </p>
              )}
            </div>
          </div>
        </div>
        <div>
          <Heading
            icon={BrainCircuit}
            title="Evidence-backed observations"
            detail="Correlations are never presented as causation"
          />
          <div className="space-y-3">
            {data.insights.map((item) => (
              <article className={`${card} p-4`} key={item.id}>
                <p className="text-[10px] uppercase text-vds-primary">
                  {item.classification} · confidence{" "}
                  {item.confidence ?? "unavailable"}
                </p>
                <h3 className="mt-2 text-sm font-medium">{item.statement}</h3>
                <p className="mt-2 text-xs leading-5 text-vds-muted">
                  Evidence: {item.evidence}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section>
        <Heading
          icon={Activity}
          title="Founder AI with explainable memory"
          detail="Streaming Executive AI · evidence, entities, confidence, sources and timestamps required"
        />
        <WorkforceChatPanel
          employee="executive-ai"
          initial={history}
          health={health}
          initialPrompt="Using only authorized evidence, summarize the context graph, cite relevant entities and memory sources, state confidence, and identify unavailable information."
          explainability={{ evidence:data.retrieval.evidence.length, entities:data.retrieval.relevantEntities.length, confidence:data.retrieval.confidence, sources:data.retrieval.memorySources, timestamp:data.retrieval.generatedAt }}
        />
      </section>
      <aside className={`${card} flex gap-3 p-5 text-sm text-vds-muted`}>
        <ShieldCheck
          className="size-5 shrink-0 text-vds-success"
          aria-hidden="true"
        />
        <p>
          Founder management does not bypass tenant isolation. Memory recall and
          deletion require matching organization/workspace scope, RBAC,
          retention checks and audit events. Missing evidence returns an
          explicit unavailable state instead of invented facts.
        </p>
      </aside>
    </main>
  );
}
function Heading({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Activity;
  title: string;
  detail: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-vds-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <p className="mt-1 text-xs text-vds-muted">{detail}</p>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-vds-elevated p-3">
      <p className="text-[10px] uppercase text-vds-subtle">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
