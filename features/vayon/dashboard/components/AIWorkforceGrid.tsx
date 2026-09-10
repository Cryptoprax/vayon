import { Bot, Radio } from "lucide-react";
import Link from "next/link";
import type { AiWorkforceMember } from "../types";

export function AIWorkforceGrid({
  members,
}: {
  readonly members: readonly AiWorkforceMember[];
}) {
  return (
    <section aria-labelledby="ai-workforce-heading">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[.18em] text-vds-primary">
            Daily assistance
          </p>
          <h2 id="ai-workforce-heading" className="mt-2 text-xl font-semibold">
            AI Assistant
          </h2>
        </div>
        <Link
          href="/vayon/ai/work-queue"
          className="focus-ring rounded-lg text-xs text-vds-muted hover:text-vds-primary"
        >
          Review AI tasks →
        </Link>
      </div>
      {members.length ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {members.slice(0, 5).map((member) => (
            <Link
              href={`/vayon/ai/workforce/${member.id}`}
              key={member.id}
              className="group focus-ring rounded-2xl border border-vds-border bg-vds-surface p-4 shadow-sm shadow-vds-shadow transition hover:-translate-y-0.5 hover:border-vds-accent-border"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-vds-primary-soft text-vds-primary">
                  <Bot className="size-5" />
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${member.status === "offline" ? "text-vds-subtle" : "text-vds-success"}`}
                >
                  <Radio className="size-3" />
                  {member.status}
                </span>
              </div>
              <h3 className="mt-4 font-medium text-vds-foreground">
                {member.name}
              </h3>
              <p className="mt-1 text-xs text-vds-muted">{member.role}</p>
              <p className="mt-4 text-xs text-vds-muted"><span className="block text-vds-subtle">Task details</span><strong className="mt-1 block font-medium text-vds-secondary">Open the workspace to review assignments</strong></p>
              <div className="mt-5 grid grid-cols-2 gap-2 border-t border-vds-divider pt-4 text-xs">
                <div>
                  <span className="block text-vds-subtle">Completed</span>
                  <strong className="mt-1 block text-sm text-vds-secondary">
                    {member.tasksCompleted}
                  </strong>
                </div>
                <div>
                  <span className="block text-vds-subtle">Task completion</span>
                  <strong className="mt-1 block text-sm text-vds-secondary">
                    {member.efficiency === undefined
                      ? "No results yet"
                      : `${member.efficiency}%`}
                  </strong>
                </div>
              </div>
              <p className="mt-4 border-t border-vds-divider pt-3 text-xs text-vds-muted"><span className="block text-vds-subtle">Suggested next step</span><span className="mt-1 block">Review recorded tasks before assigning more work.</span></p>
              <span className="mt-4 inline-block text-xs font-medium text-vds-primary">Open Workspace →</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-vds-border bg-vds-surface p-8 text-center">
          <Bot className="mx-auto size-6 text-vds-subtle" />
          <p className="mt-3 text-sm font-medium">No AI employees configured</p>
          <p className="mt-1 text-xs text-vds-muted">
            Your approved workforce appears here when configured.
          </p>
        </div>
      )}
    </section>
  );
}
