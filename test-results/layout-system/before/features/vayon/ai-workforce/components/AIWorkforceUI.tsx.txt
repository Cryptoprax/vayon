import Link from "next/link";
import type { OpenAIHealth } from "@/features/platform/openai/domain/models";
import type { WorkforceEmployee } from "@/features/vayon/operational-workforce/domain/models";
import type { AIDashboardData, AITaskRecord, ApprovalRecord, KnowledgeRecord, RecommendationRecord } from "../types";

const card = "rounded-3xl border border-vds-border bg-vds-surface p-5";

export function AIHeader({ title, description, health }: { title: string; description: string; health?: OpenAIHealth }) {
  return <header>
    <div className="flex flex-wrap items-center gap-3"><p className="text-xs font-semibold uppercase tracking-[.22em] text-vds-primary">Live AI Workforce</p>{health && <RuntimeStatus value={health.connected ? "online" : "offline"} />}</div>
    <h1 className="mt-3 text-3xl font-semibold">{title}</h1><p className="mt-2 max-w-2xl text-sm text-vds-muted">{description}</p>
  </header>;
}

export function ProviderHealth({ health, observability }: { health: OpenAIHealth; observability?: { provider: string; queueLength: number; estimatedCost: string; lastResponse: string } }) {
  return <section className={`${card} mt-6`}><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-wide text-vds-muted">Provider health</p><h2 className="mt-2 text-xl font-semibold">{health.connected ? "OpenAI connected" : health.reason ?? "OpenAI unavailable"}</h2></div><RuntimeStatus value={health.connected ? "online" : "error"} /></div><dl className="mt-5 grid gap-4 sm:grid-cols-4">{[["Provider", observability?.provider ?? "openai"], ["Model", health.model], ["Version", health.version], ["Latency", health.latencyMs === null ? "Unavailable" : `${health.latencyMs} ms`], ["Queue length", observability?.queueLength ?? 0], ["Estimated cost", observability?.estimatedCost ?? "$0.000000"], ["Last response", observability?.lastResponse ?? "No responses recorded"], ["Health", health.state]].map(([label, value]) => <div key={label}><dt className="text-xs text-vds-muted">{label}</dt><dd className="mt-1 text-sm font-medium capitalize">{value}</dd></div>)}</dl></section>;
}

export function AIEmployeeGrid({ items, health }: { items: readonly WorkforceEmployee[]; health: OpenAIHealth }) {
  return <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <Link href={`/vayon/ai/workforce/${item.code}`} className={`${card} block transition hover:-translate-y-1 hover:border-vds-accent-border`} key={item.code}><div className="flex items-start gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-vds-primary-soft to-vds-accent-soft font-semibold text-vds-primary">{item.avatar}</span><div><h2 className="font-semibold">{item.name}</h2><p className="text-xs text-vds-muted">{item.role}</p></div><span className="ml-auto"><RuntimeStatus value={item.status} /></span></div><p className="mt-5 text-sm text-vds-muted">{item.description}</p><div className="mt-4 flex flex-wrap gap-2">{item.capabilities.slice(0, 3).map((value) => <CapabilityBadge value={value} key={value} />)}</div><p className="mt-4 text-xs text-vds-muted">{health.model} · recommendation only</p></Link>)}</div>;
}

export function RuntimeStatus({ value }: { value: "online" | "processing" | "idle" | "offline" | "error" }) {
  return <span className="rounded-full border border-vds-border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">{value}</span>;
}

export function CapabilityBadge({ value }: { value: string }) { return <span className="rounded-full bg-vds-elevated px-2.5 py-1 text-[10px] capitalize text-vds-muted">{value.replaceAll("_", " ")}</span>; }
export function KnowledgeCard({ item }: { item: KnowledgeRecord }) { return <article className={card}><p className="text-xs uppercase text-vds-primary">{item.sourceType}</p><h3 className="mt-2 font-medium">{item.title}</h3><p className="mt-2 text-sm text-vds-muted">{item.description ?? "Registered organizational knowledge source."}</p></article>; }
export function AIRecommendationCard({ item }: { item: RecommendationRecord }) { return <article className={card}><h3 className="font-semibold">{item.title}</h3><p className="mt-2 text-sm text-vds-muted">{item.summary}</p><p className="mt-3 text-xs text-vds-muted">Human approval: {item.status.replaceAll("_", " ")}</p></article>; }
export function AITaskCard({ item }: { item: AITaskRecord }) { return <article className={card}><h3 className="font-medium">{item.title}</h3><p className="mt-2 text-sm text-vds-muted">{item.description ?? "No task detail provided."}</p><p className="mt-3 text-xs text-vds-muted">{item.approvalRequired ? "Human approval required" : "Advisory only"}</p></article>; }
export function ApprovalCard({ item }: { item: ApprovalRecord }) { return <article className={card}><p className="font-medium">Human approval request</p><p className="mt-2 text-xs capitalize text-vds-muted">{item.status} · {new Date(item.requestedAt).toLocaleString()}</p></article>; }
export function AITimeline({ approvals }: { approvals: ApprovalRecord[] }) { return <div className={`${card} space-y-4`}>{approvals.map((item) => <div className="border-l border-vds-accent pl-4" key={item.id}><p className="text-sm capitalize">Approval {item.status}</p><time className="text-xs text-vds-muted">{new Date(item.requestedAt).toLocaleString()}</time></div>)}{!approvals.length && <p className="text-sm text-vds-muted">No approval activity has been recorded.</p>}</div>; }
export function AIDashboard({ data }: { data: AIDashboardData }) { return <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Recommendations", data.recommendations.length], ["Hot Leads", data.hotLeads], ["Deals at Risk", data.dealsAtRisk], ["Approvals", data.approvals.length]].map(([label, value]) => <article className={card} key={label}><p className="text-xs uppercase tracking-wide text-vds-muted">{label}</p><p className="mt-4 text-2xl font-semibold">{value}</p></article>)}</section>; }
