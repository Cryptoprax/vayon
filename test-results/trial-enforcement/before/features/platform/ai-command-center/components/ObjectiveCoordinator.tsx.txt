"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/features/platform/design-system";

const agents = ["sales-ai", "crm-ai", "marketing-ai", "executive-ai"] as const;

export function ObjectiveCoordinator() {
  const [objective, setObjective] = useState("Increase subscriptions by 20%."),
    [status, setStatus] = useState<
      "idle" | "coordinating" | "completed" | "error"
    >("idle"),
    [runId, setRunId] = useState<string | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!objective.trim() || status === "coordinating") return;
    setStatus("coordinating");
    try {
      const response = await fetch("/api/ai/workforce/collaborate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedBy: "executive-ai",
          scenario: "custom",
          objective: objective.trim(),
          agents,
        }),
      });
      if (!response.ok) throw new Error("Collaboration unavailable");
      const result = (await response.json()) as { runId: string };
      setRunId(result.runId);
      setStatus("completed");
    } catch {
      setStatus("error");
    }
  }
  return (
    <section
      className="rounded-3xl border border-vds-accent-border bg-vds-surface p-5"
      aria-labelledby="objective-coordinator-title"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-vds-primary">
        Multi-AI collaboration
      </p>
      <h2 className="mt-2 font-semibold" id="objective-coordinator-title">
        Create one business objective
      </h2>
      <p className="mt-2 text-xs leading-5 text-vds-muted">
        Founder AI delegates recommendation tasks through the existing
        Collaboration Engine. Every result requires approval.
      </p>
      <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={submit}>
        <label className="sr-only" htmlFor="business-objective">
          Business objective
        </label>
        <input
          id="business-objective"
          value={objective}
          onChange={(event) => setObjective(event.target.value)}
          maxLength={2000}
          className="h-11 min-w-0 flex-1 rounded-xl border border-vds-border bg-vds-input px-3 text-sm"
        />
        <Button disabled={status === "coordinating"}>
          {status === "coordinating" ? "Coordinating…" : "Coordinate agents"}
        </Button>
      </form>
      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {[
          "Sales AI qualifies demand",
          "Customer Success AI evaluates retention",
          "Marketing AI recommends acquisition",
          "Founder AI synthesizes decisions",
        ].map((item, index) => (
          <div className="rounded-xl bg-vds-elevated p-3 text-xs" key={item}>
            <span className="text-vds-primary">{index + 1}</span>
            <p className="mt-1">{item}</p>
            <p className="mt-1 text-[10px] text-vds-subtle">
              {index ? `Depends on task ${index}` : "No dependency"}
            </p>
          </div>
        ))}
      </div>
      <p
        className={`mt-3 text-xs ${status === "error" ? "text-vds-danger" : "text-vds-muted"}`}
        role="status"
      >
        {status === "completed"
          ? `Collaboration completed · ${runId} · recommendations waiting approval.`
          : status === "error"
            ? "The existing collaboration runtime is unavailable. No task was executed."
            : "Progress, blocked items, completed work, and approvals appear in the existing collaboration timeline."}
      </p>
    </section>
  );
}
