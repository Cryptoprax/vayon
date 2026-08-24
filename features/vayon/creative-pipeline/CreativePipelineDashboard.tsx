"use client";
import Link from "next/link";
import { Button } from "@/features/platform/design-system";
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileStack,
  GitBranch,
  Play,
  Plus,
  RadioTower,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { pipelineExecutionOrder, planCreativePipeline } from "./planner";
import type { CreativePipeline, PipelineSnapshot, PipelineType } from "./types";
const card =
  "rounded-3xl border border-vds-border bg-vds-surface/75 shadow-xl shadow-vds-shadow/10 backdrop-blur-xl";
export function CreativePipelineDashboard({
  snapshot,
}: {
  readonly snapshot: PipelineSnapshot;
}) {
  const [dialog, setDialog] = useState(false),
    [type, setType] = useState<PipelineType>("Brochure"),
    [name, setName] = useState(""),
    [project, setProject] = useState(snapshot.projects[0] ?? ""),
    [preview, setPreview] = useState<CreativePipeline | null>(null),
    pipeline = preview ?? snapshot.pipelines[0] ?? null,
    order = useMemo(
      () => (pipeline ? pipelineExecutionOrder(pipeline) : null),
      [pipeline],
    );
  const createPreview = () => {
    setPreview(
      planCreativePipeline({
        id: "draft-pipeline",
        name: name || `${type} Pipeline`,
        type,
        workspaceId: "current-workspace",
        projectId: project || "unassigned",
        campaignId: null,
        brandId: null,
      }),
    );
    setDialog(false);
  };
  const metrics: readonly [string, string | number, LucideIcon][] = [
    ["Recent Pipelines", snapshot.pipelines.length, FileStack],
    ["Pipeline Templates", snapshot.templates.length, Box],
    ["Queued", snapshot.queue.queued, Clock3],
    ["Blocked", snapshot.queue.blocked, AlertTriangle],
    ["Pipeline Health", snapshot.health, CheckCircle2],
    ["Creative Runtime", snapshot.runtimeStatus, RadioTower],
  ];
  return (
    <main className="mx-auto w-full max-w-[120rem] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className={`${card} relative overflow-hidden p-6 sm:p-8`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,var(--vds-color-primary-soft),transparent_38%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <Link
              href="/vayon/creative"
              className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary"
            >
              Creative Studio 2.0
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">
              Creative Pipeline Engine
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-vds-muted">
              Ordered, observable production plans from campaign strategy
              through approval and export.
            </p>
          </div>
          <Button onClick={() => setDialog(true)}>
            <Plus className="size-4" />
            New pipeline
          </Button>
        </div>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {metrics.map(([label, value, Icon]) => (
          <article className={`${card} p-4`} key={String(label)}>
            <Icon className="size-5 text-vds-primary" />
            <p className="mt-4 text-[10px] uppercase tracking-wider text-vds-muted">
              {label}
            </p>
            <p className="mt-2 text-xl font-semibold">{value}</p>
          </article>
        ))}
      </section>
      <div className="grid gap-5 xl:grid-cols-[1.5fr_.65fr]">
        <section className={`${card} p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Pipeline graph</h2>
              <p className="mt-1 text-xs text-vds-muted">
                Visual dependency order · independently observable nodes
              </p>
            </div>
            <GitBranch className="size-5 text-vds-primary" />
          </div>
          {pipeline ? (
            <div className="mt-6 overflow-x-auto pb-4">
              <ol className="flex min-w-max items-center gap-2">
                {pipeline.nodes.map((node, index) => (
                  <li className="flex items-center gap-2" key={node.id}>
                    <article
                      className={`w-44 rounded-2xl border p-4 ${node.status === "completed" ? "border-vds-success bg-vds-success-soft" : node.status === "blocked" ? "border-vds-warning bg-vds-warning-soft" : "border-vds-border bg-vds-elevated"}`}
                    >
                      <div className="flex justify-between">
                        <span className="text-[10px] text-vds-muted">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[9px] uppercase text-vds-muted">
                          {node.status}
                        </span>
                      </div>
                      <h3 className="mt-3 text-sm font-medium">{node.stage}</h3>
                      <p className="mt-2 text-[10px] text-vds-muted">
                        {node.assignedDepartment}
                      </p>
                      <p className="mt-1 text-[10px] text-vds-muted">
                        {node.durationEstimateMinutes} min · {node.retryCount}{" "}
                        retries
                      </p>
                    </article>
                    {index < pipeline.nodes.length - 1 && (
                      <ChevronRight className="size-4 shrink-0 text-vds-muted" />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <Button
              variant="control"
              onClick={() => setDialog(true)}
              className="mt-5 h-72 w-full flex-col rounded-2xl border border-dashed border-vds-border"
            >
              <GitBranch className="mb-3 size-8" />
              Create a pipeline to inspect its dependency graph
            </Button>
          )}
          {order && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-vds-elevated px-3 py-1">
                {order.ordered.length} ordered nodes
              </span>
              <span className="rounded-full bg-vds-elevated px-3 py-1">
                {order.blocked.length} blocked nodes
              </span>
              <span className="rounded-full bg-vds-elevated px-3 py-1">
                Graph {order.valid ? "valid" : "invalid"}
              </span>
            </div>
          )}
        </section>
        <aside className={`${card} p-5`}>
          <h2 className="font-semibold">Pipeline observability</h2>
          <div className="mt-5 space-y-3">
            {[
              [
                "Duration",
                pipeline
                  ? `${pipeline.nodes.reduce((sum, node) => sum + node.durationEstimateMinutes, 0)} min`
                  : "Unavailable",
              ],
              [
                "Blocked stages",
                pipeline?.nodes.filter((node) => node.status === "blocked")
                  .length ?? 0,
              ],
              [
                "Retries",
                pipeline?.nodes.reduce(
                  (sum, node) => sum + node.retryCount,
                  0,
                ) ?? 0,
              ],
              ["Warnings", 0],
              ["Errors", 0],
              [
                "Approvals",
                pipeline?.nodes.filter((node) => node.stage === "Approval")
                  .length ?? 0,
              ],
            ].map(([label, value]) => (
              <div
                className="flex justify-between rounded-xl bg-vds-elevated px-3 py-2 text-sm"
                key={label}
              >
                <span className="text-vds-muted">{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-vds-border pt-4">
            <h3 className="text-sm font-medium">Provider boundary</h3>
            <p className="mt-2 text-xs leading-5 text-vds-muted">
              Creative Director orchestrates every stage. Nodes communicate only
              through the Creative Runtime. Runtime is unavailable, so execution
              is disabled.
            </p>
            <Button disabled className="mt-4 w-full">
              <Play className="size-4" />
              Run pipeline
            </Button>
          </div>
        </aside>
      </div>
      <section className={`${card} p-5`}>
        <h2 className="font-semibold">Pipeline templates</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {snapshot.templates.map((item) => (
            <Button
              variant="control"
              onClick={() => {
                setType(item);
                setName(`${item} Pipeline`);
                setDialog(true);
              }}
              className="h-auto min-h-24 justify-start rounded-2xl border border-vds-border p-4 text-left"
              key={item}
            >
              {item}
            </Button>
          ))}
        </div>
      </section>
      <section className={`${card} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Document & export architecture</h2>
            <p className="mt-1 text-xs text-vds-muted">
              Pages → Sections → Blocks → brand references. No documents are
              generated.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {snapshot.exports.map((item) => (
              <span
                className="inline-flex items-center gap-1 rounded-xl border border-vds-border px-3 py-2 text-xs"
                key={item}
              >
                <Download className="size-3" />
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Copywriter: headlines, body, product, CTA, FAQ, legal",
            "Layouts: A4, A5, Letter, presentation, social",
            "Blocks: images, tables, charts, icons, captions",
            "Review: brand, completeness, references, type, colour",
          ].map((item) => (
            <article
              className="rounded-2xl bg-vds-elevated p-4 text-xs text-vds-muted"
              key={item}
            >
              {item}
            </article>
          ))}
        </div>
      </section>
      {dialog && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-vds-overlay p-4">
          <section
            className={`${card} w-full max-w-xl p-6`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-pipeline"
          >
            <div className="flex justify-between">
              <div>
                <h2 className="text-xl font-semibold" id="new-pipeline">
                  Create pipeline plan
                </h2>
                <p className="mt-1 text-sm text-vds-muted">
                  Creates a non-persistent, non-executing preview.
                </p>
              </div>
              <Button
                variant="control"
                onClick={() => setDialog(false)}
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            </div>
            <label className="mt-5 block text-sm">
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-vds-border bg-vds-elevated px-3"
              />
            </label>
            <label className="mt-4 block text-sm">
              Pipeline type
              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value as PipelineType)
                }
                className="mt-2 h-11 w-full rounded-xl border border-vds-border bg-vds-elevated px-3"
              >
                {snapshot.templates.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-sm">
              Creative project
              <select
                value={project}
                onChange={(event) => setProject(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-vds-border bg-vds-elevated px-3"
              >
                <option value="">Unassigned</option>
                {snapshot.projects.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <div className="mt-6 flex justify-end">
              <Button onClick={createPreview}>
                Prepare pipeline graph
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
