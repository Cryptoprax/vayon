import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  CheckCircle2,
  CircleGauge,
  CircleHelp,
  Clock3,
  PlugZap,
  Sparkles,
  Trophy,
  UsersRound,
} from "lucide-react";
import type { OpenAIHealth } from "@/features/platform/openai/domain/models";
import type { ConversationSnapshot } from "@/features/platform/openai/runtime/models";
import { WorkforceChatPanel } from "@/features/platform/openai/runtime/ChatPanel";
import type { CustomerSuccessWorkspaceSnapshot } from "../services/customer-success-workspace.service";
import { AISetupWizard, ChecklistAction } from "./OnboardingControls";

const card =
  "rounded-3xl border border-vds-border/70 bg-vds-surface/75 shadow-xl shadow-vds-shadow/10 backdrop-blur-xl";

export function CustomerSuccessWorkspace({
  data,
  history,
  health,
}: {
  data: CustomerSuccessWorkspaceSnapshot;
  history: ConversationSnapshot;
  health: OpenAIHealth;
}) {
  const overview = [
    ["Organization", data.organization.name],
    ["Workspace", data.workspace.name],
    [
      "Subscription",
      data.subscription
        ? `${data.subscription.plan} · ${data.subscription.status}`
        : "Unavailable",
    ],
    ["AI readiness", data.ai.ready ? "Ready" : "Guidance available"],
    [
      "Integration readiness",
      `${data.readiness.filter((item) => item.state === "Ready").length}/${data.readiness.length} ready`,
    ],
    [
      "Team activity",
      data.team.members === null
        ? "Unavailable"
        : `${data.team.members} active member(s)`,
    ],
  ] as const;
  return (
    <main className="relative mx-auto max-w-[120rem] space-y-8 overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[35rem] bg-[radial-gradient(circle_at_14%_8%,var(--vds-color-primary-soft),transparent_36%),radial-gradient(circle_at_86%_10%,var(--vds-color-success-soft),transparent_28%)]"
        aria-hidden="true"
      />
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.2em] text-vds-primary">
            <Sparkles className="size-4" aria-hidden="true" />
            Customer Success Workspace
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">
            Welcome, {data.user.name}.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-vds-muted sm:text-base">
            Launch your workspace with guided, evidence-backed onboarding.
            Resume at any time without losing progress.
          </p>
        </div>
        <div className={`${card} min-w-56 p-4`}>
          <div className="flex justify-between text-xs">
            <span>Onboarding progress</span>
            <strong>{data.progress}%</strong>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-vds-elevated">
            <div
              className="h-full rounded-full bg-vds-primary"
              style={{ width: `${data.progress}%` }}
            />
          </div>
          <p className="mt-2 flex items-center gap-1 text-xs text-vds-muted">
            <Clock3 className="size-3" aria-hidden="true" />
            About {data.estimatedMinutesRemaining} minutes remaining
          </p>
        </div>
      </header>

      <section aria-labelledby="overview-title">
        <Heading
          icon={CircleGauge}
          id="overview-title"
          title="Customer success home"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {overview.map(([label, value], index) => (
            <article
              className={`${card} min-h-28 p-4 motion-safe:animate-[fade-in_.45s_ease-out_both]`}
              style={{ animationDelay: `${index * 35}ms` }}
              key={label}
            >
              <p className="text-[10px] uppercase tracking-[.12em] text-vds-subtle">
                {label}
              </p>
              <p className="mt-4 text-sm font-semibold">{value}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="recommendations-title">
        <Heading
          icon={Sparkles}
          id="recommendations-title"
          title="Today's recommendations"
        />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {data.recommendations.map((item) => (
            <Link
              className={`${card} group p-5`}
              href={item.href}
              key={item.title}
            >
              <h3 className="font-medium">{item.title}</h3>
              <p className="mt-2 text-xs leading-5 text-vds-muted">
                {item.evidence}
              </p>
              <p className="mt-4 flex items-center gap-1 text-[10px] uppercase text-vds-primary">
                Recommendation only{" "}
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="checklist-title">
        <Heading
          icon={CheckCircle2}
          id="checklist-title"
          title="AI onboarding checklist"
        />
        <div className={`${card} mt-4 divide-y divide-vds-border p-2`}>
          {data.checklist.map((item) => (
            <article
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
              key={item.id}
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-full ${item.status === "Completed" ? "bg-vds-success-soft text-vds-success" : item.status === "Blocked" ? "bg-vds-danger-soft text-vds-danger" : "bg-vds-elevated text-vds-muted"}`}
              >
                <CheckCircle2 className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium">{item.title}</h3>
                <p className="mt-1 text-xs text-vds-muted">
                  {item.status} · {item.minutes} minutes
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.status !== "Completed" && (
                  <ChecklistAction step={item.step} />
                )}
                <Link
                  className="inline-flex h-8 items-center rounded-lg px-3 text-xs text-vds-primary"
                  href={item.href}
                >
                  Open step <ArrowUpRight className="ml-1 size-3" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="milestones-title">
        <Heading icon={Trophy} id="milestones-title" title="Time to value" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {data.milestones.map((item) => (
            <article
              className={`${card} p-4 ${item.achieved ? "border-vds-success/40" : ""}`}
              key={item.label}
            >
              <Trophy
                className={`size-5 ${item.achieved ? "text-vds-success" : "text-vds-subtle"}`}
                aria-hidden="true"
              />
              <h3 className="mt-3 text-sm font-medium">{item.label}</h3>
              <p className="mt-2 text-xs text-vds-muted">
                {item.achieved === null
                  ? "Evidence unavailable"
                  : item.achieved
                    ? "Milestone achieved"
                    : "Not yet achieved"}
              </p>
              <p className="mt-2 text-[10px] text-vds-subtle">
                {item.evidence}
              </p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <AISetupWizard canConfigure={data.canConfigureAI} />
        <section className={`${card} p-5`} aria-labelledby="integration-title">
          <Heading
            icon={PlugZap}
            id="integration-title"
            title="Integration readiness"
          />
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {data.readiness.map((item) => (
              <article
                className="rounded-xl border border-vds-border bg-vds-elevated/60 p-3"
                key={item.name}
              >
                <div className="flex justify-between gap-2">
                  <h3 className="text-sm font-medium">{item.name}</h3>
                  <span className="text-[10px] uppercase text-vds-primary">
                    {item.state}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-vds-muted">
                  {item.guidance}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section aria-labelledby="health-title">
        <Heading
          icon={UsersRound}
          id="health-title"
          title="Success health and executive customer view"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "Adoption score",
              data.health.adoption === null
                ? "Unavailable"
                : `${data.health.adoption}%`,
            ],
            ["Feature usage", `${data.health.featureUsage}/5 measured`],
            ["Workspace readiness", `${data.health.workspaceReadiness}%`],
            [
              "Team participation",
              data.health.teamParticipation === null
                ? "Unavailable"
                : `${data.health.teamParticipation}%`,
            ],
          ].map(([label, value]) => (
            <article className={`${card} p-5`} key={label}>
              <p className="text-xs text-vds-muted">{label}</p>
              <p className="mt-3 text-2xl font-semibold">{value}</p>
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs text-vds-subtle">
          {data.health.evidence} Pending tasks{" "}
          {data.checklist.filter((item) => item.status !== "Completed").length}{" "}
          · active workflows {data.team.activeWorkflows ?? "unavailable"} ·
          pending approvals {data.team.pendingApprovals ?? "unavailable"}.
        </p>
      </section>

      <section aria-labelledby="assistant-title">
        <Heading icon={Bot} id="assistant-title" title="AI onboarding guide" />
        <div className="mt-4">
          <WorkforceChatPanel
            employee="executive-ai"
            initial={history}
            health={health}
            initialPrompt="Guide me through the next incomplete onboarding task using only my workspace evidence. Explain prerequisites and do not execute changes."
          />
        </div>
      </section>

      <section className={`${card} p-5`} aria-labelledby="help-title">
        <Heading icon={CircleHelp} id="help-title" title="Help center" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            ["Search knowledge", "/vayon/knowledge"],
            ["Guided tutorials", "/vayon/success-center"],
            ["Quick videos", "/resources"],
            ["FAQ", "/resources"],
            ["Support request", "/contact"],
            ["AI assistance", "/vayon/knowledge/help"],
          ].map(([label, href]) => (
            <Link
              className="rounded-xl border border-vds-border bg-vds-elevated p-4 text-sm hover:border-vds-accent-border"
              href={href}
              key={label}
            >
              {label}
            </Link>
          ))}
        </div>
        <p className="mt-4 text-xs text-vds-muted">
          Knowledge:{" "}
          {data.knowledge
            ? `${data.knowledge.articles.length} article(s) and ${data.knowledge.documents.length} document(s) available`
            : "temporarily unavailable; support remains accessible"}
          .
        </p>
      </section>
    </main>
  );
}

function Heading({
  icon: Icon,
  id,
  title,
}: {
  icon: typeof Sparkles;
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
