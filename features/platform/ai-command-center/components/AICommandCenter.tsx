import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Bot,
  BrainCircuit,
  CircleGauge,
  ClipboardCheck,
  Gauge,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import type { OpenAIHealth } from "@/features/platform/openai/domain/models";
import type { ConversationSnapshot } from "@/features/platform/openai/runtime/models";
import { WorkforceChatPanel } from "@/features/platform/openai/runtime/ChatPanel";
import { FounderRealtime } from "@/features/platform/founder/components/FounderRealtime";
import type { AICommandCenterSnapshot } from "../services/ai-command-center.service";
import { ObjectiveCoordinator } from "./ObjectiveCoordinator";

const card =
  "rounded-3xl border border-vds-border/70 bg-vds-surface/75 shadow-xl shadow-vds-shadow/10 backdrop-blur-xl";

export function AICommandCenter({
  data,
  history,
  health,
  filter,
}: {
  data: AICommandCenterSnapshot;
  history: ConversationSnapshot;
  health: OpenAIHealth;
  filter: string;
}) {
  const activity = filter
      ? data.activity.filter((item) =>
          `${item.agent} ${item.module} ${item.summary}`
            .toLowerCase()
            .includes(filter.toLowerCase()),
        )
      : data.activity,
    mission = data.operations;
  return (
    <main className="relative mx-auto max-w-[120rem] space-y-8 overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_12%_8%,var(--vds-color-primary-soft),transparent_36%),radial-gradient(circle_at_86%_12%,var(--vds-color-info-soft),transparent_30%)]"
        aria-hidden="true"
      />
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.22em] text-vds-primary">
            <BrainCircuit className="size-4" aria-hidden="true" />
            Founder Portal
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">
            VAYON AI Command Center
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-vds-muted sm:text-base">
            One governed workspace where Founder AI coordinates every existing
            VAYON intelligence capability, workflow, integration, approval, and
            memory boundary.
          </p>
        </div>
        <FounderRealtime />
      </header>

      <section aria-labelledby="unified-agents">
        <Heading
          icon={Bot}
          id="unified-agents"
          title="Unified command center"
        />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {data.agents.map((agent, index) => (
            <article
              className={`${card} p-5 motion-safe:animate-[fade-in_.45s_ease-out_both]`}
              style={{ animationDelay: `${index * 35}ms` }}
              key={agent.id}
            >
              <div className="flex justify-between gap-3">
                <h2 className="font-medium">{agent.name}</h2>
                <span
                  className={`text-[10px] font-semibold uppercase ${agent.status === "online" ? "text-vds-success" : agent.status === "processing" ? "text-vds-primary" : agent.status === "error" ? "text-vds-danger" : "text-vds-subtle"}`}
                >
                  {agent.status}
                </span>
              </div>
              <p className="mt-3 text-xs text-vds-muted">
                Objective: {agent.objective}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Mini label="Running" value={agent.runningTasks} />
                <Mini label="Approvals" value={agent.waitingApprovals} />
                <Mini
                  label="Confidence"
                  value={
                    agent.confidence === null
                      ? "—"
                      : `${Math.round(agent.confidence * 100)}%`
                  }
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-vds-subtle">
                Evidence: {agent.evidence}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="agent-directory">
        <Heading
          icon={Search}
          id="agent-directory"
          title="AI agent directory"
        />
        <div className={`${card} mt-4 overflow-x-auto`}>
          <table className="w-full min-w-[75rem] text-left text-sm">
            <caption className="sr-only">
              Every governed VAYON AI capability
            </caption>
            <thead>
              <tr className="border-b border-vds-border text-xs uppercase text-vds-subtle">
                {[
                  "Agent",
                  "Purpose / owner",
                  "Permissions",
                  "Capabilities",
                  "Integrations",
                  "Health",
                  "Workload",
                  "Last execution",
                ].map((item) => (
                  <th className="px-4 py-4 font-medium" scope="col" key={item}>
                    {item}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.agents.map((agent) => (
                <tr
                  className="border-b border-vds-border/50 last:border-0"
                  key={agent.id}
                >
                  <th className="px-4 py-4 font-medium" scope="row">
                    {agent.name}
                  </th>
                  <td className="max-w-56 px-4 py-4 text-xs text-vds-muted">
                    {agent.purpose}
                    <br />
                    Owner: {agent.owner}
                  </td>
                  <td className="px-4 py-4 text-xs text-vds-muted">
                    {agent.permissions.join(" · ")}
                  </td>
                  <td className="px-4 py-4 text-xs text-vds-muted">
                    {agent.capabilities.join(" · ")}
                  </td>
                  <td className="px-4 py-4 text-xs text-vds-muted">
                    {agent.integrations.join(" · ") || "None connected"}
                  </td>
                  <td className="px-4 py-4 capitalize">{agent.status}</td>
                  <td className="px-4 py-4">{agent.workload}</td>
                  <td className="px-4 py-4 text-xs text-vds-muted">
                    {agent.lastExecution
                      ? new Date(agent.lastExecution).toLocaleString()
                      : "No execution evidence"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ObjectiveCoordinator />

      <section aria-labelledby="decision-board">
        <Heading
          icon={ClipboardCheck}
          id="decision-board"
          title="Executive decision board"
        />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.decisions.map((item, index) => (
            <article className={`${card} p-5`} key={item.id}>
              <div className="flex justify-between gap-3">
                <span className="text-[10px] uppercase text-vds-primary">
                  Rank {index + 1} · {item.urgency}
                </span>
                <span className="text-xs">Impact {item.impact}</span>
              </div>
              <h3 className="mt-3 font-medium">{item.title}</h3>
              <p className="mt-2 text-xs leading-5 text-vds-muted">
                Supporting evidence: {item.evidence}
              </p>
              <p className="mt-3 text-[10px] uppercase text-vds-subtle">
                Confidence {Math.round(item.confidence * 100)}% · Expected ROI{" "}
                {item.expectedRoi === null ? "Unavailable" : item.expectedRoi} ·
                recommendation only
              </p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="activity-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Heading
            icon={Activity}
            id="activity-title"
            title="Global AI activity"
          />
          <form className="flex gap-2">
            <label className="sr-only" htmlFor="activity-filter">
              Filter AI activity
            </label>
            <input
              id="activity-filter"
              name="agent"
              defaultValue={filter}
              placeholder="Filter agent or module"
              className="h-10 rounded-xl border border-vds-border bg-vds-input px-3 text-sm"
            />
          </form>
        </div>
        <ol
          className={`${card} mt-4 max-h-[36rem] space-y-2 overflow-y-auto p-5`}
        >
          {activity.map((item) => (
            <li
              className="border-l border-vds-primary py-2 pl-4"
              key={`${item.module}-${item.id}`}
            >
              <div className="flex flex-wrap justify-between gap-2">
                <p className="text-sm font-medium">
                  {item.agent} · {item.summary}
                </p>
                <time className="text-xs text-vds-subtle">
                  {new Date(item.occurredAt).toLocaleString()}
                </time>
              </div>
              <p className="mt-1 text-xs text-vds-muted">{item.module}</p>
            </li>
          ))}
          {!activity.length && (
            <li className="py-12 text-center text-sm text-vds-muted">
              No authorized AI activity matches this filter.
            </li>
          )}
        </ol>
      </section>

      <section aria-labelledby="mission-control">
        <Heading icon={Gauge} id="mission-control" title="Mission control" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Today's priorities", mission.priorities.length],
            ["Objectives", mission.objectives.length],
            [
              "Completed work",
              mission.tasks.filter((item) => item.status === "Completed")
                .length,
            ],
            ["Pending approvals", mission.workflows.observability.waiting],
            [
              "Critical risks",
              mission.priorities.filter((item) => item.kind === "risk").length,
            ],
            [
              "Platform health",
              mission.statuses.find((item) => item.name === "Platform")
                ?.value ?? "Unavailable",
            ],
            [
              "Business health",
              mission.statuses.find((item) => item.name === "Business")
                ?.value ?? "Unavailable",
            ],
            ["Provider health", data.performance.providerAvailability],
          ].map(([label, value]) => (
            <article className={`${card} p-5`} key={label}>
              <p className="text-xs text-vds-muted">{label}</p>
              <p className="mt-3 text-2xl font-semibold">
                {typeof value === "number" && /health/i.test(String(label))
                  ? `${Math.round(value)}%`
                  : value}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="action-center">
        <Heading
          icon={ShieldCheck}
          id="action-center"
          title="Founder action center"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Approve", "/vayon/ai/tasks"],
            ["Reject", "/vayon/ai/tasks"],
            ["Reschedule", "/vayon/workflows/runtime"],
            ["Delegate", "/vayon/workflows"],
            ["Archive", "/vayon/ai"],
          ].map(([label, href]) => (
            <Link
              className={`${card} group flex items-center justify-between p-5 text-sm font-medium`}
              href={href}
              key={label}
            >
              {label}
              <ArrowUpRight
                className="size-4 text-vds-primary"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
        <p className="mt-3 text-xs text-vds-muted">
          Actions open the existing governed service. Approval, rejection,
          rescheduling, delegation, and archival retain their existing RBAC,
          version checks, and audit history.
        </p>
      </section>

      <section aria-labelledby="performance-title">
        <Heading
          icon={CircleGauge}
          id="performance-title"
          title="AI performance"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            ["Tasks completed", data.performance.tasksCompleted],
            [
              "Average execution",
              data.performance.averageExecutionMs === null
                ? "Unavailable"
                : `${data.performance.averageExecutionMs} ms`,
            ],
            [
              "Recommendation acceptance",
              data.performance.recommendationAcceptance === null
                ? "Unavailable"
                : `${data.performance.recommendationAcceptance}%`,
            ],
            [
              "Workflow success",
              data.performance.workflowSuccess === null
                ? "Unavailable"
                : `${data.performance.workflowSuccess}%`,
            ],
            ["Provider availability", data.performance.providerAvailability],
            ["Execution failures", data.performance.executionFailures],
          ].map(([label, value]) => (
            <article className={`${card} p-4`} key={label}>
              <p className="text-[10px] uppercase text-vds-subtle">{label}</p>
              <p className="mt-3 text-xl font-semibold">{value}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="founder-chat">
        <Heading icon={Sparkles} id="founder-chat" title="Founder AI" />
        <div className="mt-4">
          <WorkforceChatPanel
            employee="executive-ai"
            initial={history}
            health={health}
            initialPrompt="Summarize all active AI objectives, blocked dependencies, evidence-backed recommendations, and approvals requiring my attention."
          />
        </div>
      </section>
    </main>
  );
}

function Heading({
  icon: Icon,
  id,
  title,
}: {
  icon: typeof Target;
  id: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-vds-primary" aria-hidden="true" />
      <h2 className="text-lg font-semibold" id={id}>
        {title}
      </h2>
    </div>
  );
}
function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-vds-elevated p-2">
      <p className="text-[9px] uppercase text-vds-subtle">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
