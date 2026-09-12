"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  Clock3,
  Copy,
  Download,
  GitBranch,
  Heart,
  Save,
  Share2,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/features/platform/design-system";
import type { LocalWorkflowHistory, OrchestratorStepStatus } from "../contracts";
import { orchestratorTemplates } from "../templates";

const historyKey = "vayon.workflow.orchestrator.history.v1";
const savedKey = "vayon.workflow.orchestrator.saved.v1";
const favoriteKey = "vayon.workflow.orchestrator.favorites.v1";

function readLocal<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
}
function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The planner remains usable when browser storage is unavailable.
  }
}

export function WorkflowOrchestrator() {
  const searchParams = useSearchParams();
  const requestedTemplate = searchParams.get("template");
  const [selectedId, setSelectedId] = useState(
    orchestratorTemplates.some((item) => item.id === requestedTemplate)
      ? requestedTemplate!
      : orchestratorTemplates[0]!.id,
  );
  const [approved, setApproved] = useState(false);
  const [notice, setNotice] = useState("Preview mode · no execution has started.");
  const [history, setHistory] = useState<readonly LocalWorkflowHistory[]>(() => readLocal(historyKey, []));
  const [saved, setSaved] = useState<readonly string[]>(() => readLocal(savedKey, []));
  const [favorites, setFavorites] = useState<readonly string[]>(() => readLocal(favoriteKey, []));
  const selected = orchestratorTemplates.find((item) => item.id === selectedId) ?? orchestratorTemplates[0]!;
  const modules = useMemo(() => [...new Set(selected.steps.flatMap((item) => item.modules))], [selected]);
  const duration = selected.steps.reduce((total, item) => total + item.estimatedMinutes, 0);

  function record(status: LocalWorkflowHistory["status"]) {
    const next = [{ id: crypto.randomUUID(), template: selected.name, status, timestamp: new Date().toISOString(), duration: "Not executed" }, ...history].slice(0, 20);
    setHistory(next);
    writeLocal(historyKey, next);
  }
  function select(id: string) {
    setSelectedId(id);
    setApproved(false);
    setNotice("Preview mode · no execution has started.");
  }
  function toggleStored(key: string, values: readonly string[], setValues: (next: readonly string[]) => void) {
    const next = values.includes(selected.id) ? values.filter((id) => id !== selected.id) : [...values, selected.id];
    setValues(next);
    writeLocal(key, next);
  }
  function exportPlan() {
    const blob = new Blob([JSON.stringify({ ...selected, mode: "planning-only", executable: false }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selected.id}-workflow-preview.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Workflow preview exported. No module action was executed.");
  }
  async function sharePlan() {
    const text = `${selected.name}: ${selected.summary} (${duration} minute estimate, preview only)`;
    try {
      if (navigator.share) await navigator.share({ title: selected.name, text });
      else if (navigator.clipboard) await navigator.clipboard.writeText(text);
      else throw new Error("Sharing unavailable");
      setNotice("Workflow preview shared. Sensitive records were not included.");
    } catch {
      setNotice("Sharing was cancelled or is unavailable. The workflow preview was not changed.");
    }
  }

  return (
    <section className="space-y-6" aria-labelledby="workflow-orchestrator-title">
      <header className="relative overflow-hidden rounded-[2rem] border border-vds-border bg-gradient-to-br from-vds-primary-soft via-vds-surface to-vds-accent-soft p-6 shadow-xl shadow-vds-shadow/10 sm:p-8">
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-vds-primary"><GitBranch className="size-4" aria-hidden="true" />AI Workflow Orchestrator</p>
            <h1 id="workflow-orchestrator-title" className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">Plan across your business.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-vds-muted sm:text-base">Build transparent multi-step plans across existing VAYON modules. Every step is preview-first, non-executable, and requires explicit human approval.</p>
          </div>
          <div className="rounded-2xl border border-vds-success bg-vds-success-soft px-4 py-3 text-sm text-vds-success"><ShieldCheck className="mr-2 inline size-4" aria-hidden="true" />No autonomous execution</div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[20rem_1fr]">
        <aside className="rounded-3xl border border-vds-border bg-vds-surface p-4" aria-label="Workflow templates">
          <div className="px-2 pb-3"><h2 className="font-semibold">Workflow templates</h2><p className="mt-1 text-xs text-vds-muted">Reusable governed starting points</p></div>
          <div className="grid max-h-[44rem] gap-1 overflow-y-auto">
            {orchestratorTemplates.map((item) => <Button variant="ghost" className={`h-auto justify-start rounded-2xl p-3 text-left ${selected.id === item.id ? "bg-vds-primary-soft text-vds-primary" : ""}`} onClick={() => select(item.id)} key={item.id}><span><span className="block text-sm font-medium">{item.name}</span><span className="mt-1 block text-xs font-normal text-vds-muted">{item.steps.length} governed steps</span></span></Button>)}
          </div>
        </aside>

        <div className="space-y-5">
          <section className="rounded-3xl border border-vds-border bg-vds-surface p-5 sm:p-6" aria-labelledby="plan-preview-title">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div><p className="text-xs uppercase tracking-[.17em] text-vds-primary">Workflow preview</p><h2 id="plan-preview-title" className="mt-2 text-2xl font-semibold">{selected.name}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-vds-muted">{selected.summary}</p></div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => toggleStored(savedKey, saved, setSaved)}><Save className="size-4" aria-hidden="true" />{saved.includes(selected.id) ? "Saved" : "Save"}</Button>
                <Button variant="secondary" size="sm" onClick={() => { const next = [...saved, `${selected.id}-copy-${Date.now()}`]; setSaved(next); writeLocal(savedKey, next); setNotice("A local editable copy was saved. No workflow was executed."); }}><Copy className="size-4" aria-hidden="true" />Duplicate</Button>
                <Button variant="secondary" size="sm" onClick={() => void sharePlan()}><Share2 className="size-4" aria-hidden="true" />Share</Button>
                <Button variant="secondary" size="sm" onClick={exportPlan}><Download className="size-4" aria-hidden="true" />Export</Button>
                <Button variant="ghost" size="sm" aria-pressed={favorites.includes(selected.id)} onClick={() => toggleStored(favoriteKey, favorites, setFavorites)}><Heart className={`size-4 ${favorites.includes(selected.id) ? "fill-current text-vds-danger" : ""}`} aria-hidden="true" />Favorite</Button>
              </div>
            </div>
            <p className="mt-3 text-xs text-vds-subtle">{saved.length} locally saved {saved.length === 1 ? "plan" : "plans"}</p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <PreviewField label="Modules affected" values={modules} />
              <PreviewField label="Expected output" values={selected.expectedOutputs} />
              <PreviewField label="Estimated completion time" values={[`${duration} minutes after individual approvals`]} />
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <PreviewField label="Missing requirements" values={["Additional information is required.", ...selected.missingRequirements]} tone="warning" />
              <PreviewField label="Warnings" values={selected.warnings} tone="warning" />
            </div>
          </section>

          <section className="rounded-3xl border border-vds-border bg-vds-surface p-5 sm:p-6" aria-labelledby="workflow-timeline-title">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs uppercase tracking-[.17em] text-vds-accent">Visual workflow timeline</p><h2 id="workflow-timeline-title" className="mt-2 text-xl font-semibold">Dependencies and approvals</h2></div><p className="text-xs text-vds-muted">Progress 0% · execution not started</p></div>
            <div className="mt-6 space-y-3">
              {selected.steps.map((item, index) => {
                const status: OrchestratorStepStatus = index === 0 ? approved ? "current" : "waiting-for-approval" : "upcoming";
                return <article className="relative grid gap-4 rounded-2xl border border-vds-border bg-vds-elevated p-4 sm:grid-cols-[2.5rem_1fr_auto]" key={item.id}><span className={`grid size-10 place-items-center rounded-2xl text-sm font-semibold ${status === "waiting-for-approval" ? "bg-vds-warning-soft text-vds-warning" : status === "current" ? "bg-vds-primary-soft text-vds-primary" : "bg-vds-surface text-vds-subtle"}`}>{index + 1}</span><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{item.title}</h3><Status status={status} /></div><p className="mt-1 text-sm leading-6 text-vds-muted">{item.description}</p><p className="mt-2 text-xs text-vds-subtle">Modules: {item.modules.join(" · ")} · Dependencies: {item.dependencies.join(", ") || "None"}</p></div><div className="text-right text-xs text-vds-muted"><Clock3 className="mb-1 ml-auto size-4" aria-hidden="true" />{item.estimatedMinutes} min<p className="mt-2">Approval required</p></div></article>;
              })}
            </div>
            <div className="mt-5 flex flex-wrap gap-3" role="group" aria-label="Workflow preview confirmation">
              <Button disabled={approved} onClick={() => { setApproved(true); record("approval-confirmed"); setNotice("Plan approved for governed handoff. No steps were executed."); }}><Check className="size-4" aria-hidden="true" />{approved ? "Approval confirmed" : "Confirm plan"}</Button>
              <Button variant="secondary" onClick={() => { setApproved(false); record("cancelled"); setNotice("Workflow preview cancelled. No changes were made."); }}><X className="size-4" aria-hidden="true" />Cancel</Button>
            </div>
            <p className="mt-3 text-sm text-vds-muted" role="status" aria-live="polite">{notice}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs" aria-label="Timeline status legend">{(["completed", "current", "waiting-for-approval", "blocked", "upcoming"] as const).map((status) => <Status status={status} key={status} />)}</div>
          </section>
        </div>
      </div>

      <HistoryTable history={history} />
    </section>
  );
}

function PreviewField({ label, values, tone = "neutral" }: { readonly label: string; readonly values: readonly string[]; readonly tone?: "neutral" | "warning" }) {
  return <article className={`rounded-2xl border p-4 ${tone === "warning" ? "border-vds-warning bg-vds-warning-soft" : "border-vds-border bg-vds-elevated"}`}><h3 className="text-xs font-semibold uppercase tracking-[.13em] text-vds-muted">{label}</h3><ul className="mt-3 space-y-1.5 text-sm leading-5">{values.map((value) => <li className="flex gap-2" key={value}><span aria-hidden="true">·</span>{value}</li>)}</ul></article>;
}
function Status({ status }: { readonly status: OrchestratorStepStatus }) {
  const styles: Record<OrchestratorStepStatus, string> = { completed: "bg-vds-success-soft text-vds-success", current: "bg-vds-primary-soft text-vds-primary", "waiting-for-approval": "bg-vds-warning-soft text-vds-warning", blocked: "bg-vds-danger-soft text-vds-danger", upcoming: "bg-vds-elevated text-vds-subtle" };
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[.08em] ${styles[status]}`}>{status.replaceAll("-", " ")}</span>;
}
function HistoryTable({ history }: { readonly history: readonly LocalWorkflowHistory[] }) {
  return <section className="overflow-hidden rounded-3xl border border-vds-border bg-vds-surface" aria-labelledby="orchestration-history-title"><div className="p-5"><h2 id="orchestration-history-title" className="font-semibold">Execution history</h2><p className="mt-1 text-xs text-vds-muted">Executed, cancelled, failed, and successful workflows appear only when governed evidence exists. Local preview decisions are listed below.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[42rem] text-left text-sm"><thead><tr className="border-t border-vds-border text-xs uppercase tracking-[.1em] text-vds-subtle"><th className="p-4">Workflow</th><th>Status</th><th>Timestamp</th><th>Duration</th></tr></thead><tbody>{history.map((item) => <tr className="border-t border-vds-border" key={item.id}><td className="p-4 font-medium">{item.template}</td><td>{item.status}</td><td>{new Date(item.timestamp).toLocaleString()}</td><td>{item.duration}</td></tr>)}{!history.length && <tr><td className="p-8 text-center text-vds-muted" colSpan={4}>No executed workflows or local preview decisions yet.</td></tr>}</tbody></table></div></section>;
}
