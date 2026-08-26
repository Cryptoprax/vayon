import { ButtonLink } from "@/features/platform/design-system";
import type {
  CalendarSnapshot,
  ScheduleEvent,
  SchedulingSuggestion,
} from "../domain/models";
import {
  schedulingAnalytics,
  type CalendarViewModel,
} from "../view-models/calendar";

const card =
  "rounded-2xl border border-vds-border bg-vds-surface p-5 shadow-vds-sm";
const format = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function CalendarHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header>
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">
        Scheduling platform
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-vds-muted">{description}</p>
    </header>
  );
}

export function CalendarAnalytics({
  snapshot,
}: {
  snapshot: CalendarSnapshot;
}) {
  return (
    <section
      aria-label="Scheduling analytics"
      className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6"
    >
      {schedulingAnalytics(snapshot).map(([label, value]) => (
        <article className={card} key={label}>
          <p className="text-xs uppercase tracking-wide text-vds-muted">
            {label}
          </p>
          <p className="mt-3 text-2xl font-semibold">{value}</p>
        </article>
      ))}
    </section>
  );
}

export function ScheduleList({ model }: { model: CalendarViewModel }) {
  return (
    <section className={`${card} mt-6`}>
      <h2 className="text-lg font-semibold">{model.title}</h2>
      <div className="mt-4 divide-y divide-vds-divider">
        {model.events.map((event) => (
          <ScheduleRow event={event} key={`${event.type}-${event.id}`} />
        ))}
        {!model.events.length && (
          <p className="py-12 text-center text-sm text-vds-muted">
            {model.emptyMessage}
          </p>
        )}
      </div>
    </section>
  );
}

export function EntityList({
  title,
  events,
}: {
  title: string;
  events: readonly ScheduleEvent[];
}) {
  return (
    <section className={`${card} mt-6`}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 divide-y divide-vds-divider">
        {events.map((event) => (
          <ScheduleRow event={event} key={event.id} />
        ))}
        {!events.length && (
          <div className="py-10 text-center"><p className="font-medium">Schedule your first appointment.</p><p className="mt-1 text-sm text-vds-muted">Create a useful calendar moment in under a minute.</p><ButtonLink href="/vayon/calendar/meetings" className="mt-4">Create appointment</ButtonLink></div>
        )}
      </div>
    </section>
  );
}

export function Observability({ snapshot }: { snapshot: CalendarSnapshot }) {
  const values = [
    [
      "Meeting Load",
      snapshot.events.filter((item) => item.type === "meeting").length,
    ],
    [
      "Task Load",
      snapshot.events.filter(
        (item) => item.type === "internal-task" || item.type === "follow-up",
      ).length,
    ],
    [
      "Reminder Queue",
      snapshot.reminders.filter((item) => item.status === "queued").length,
    ],
    ["Conflict Count", snapshot.conflicts.length],
    ["Schedule Health", snapshot.conflicts.length ? "Needs review" : "Healthy"],
  ] as const;
  return (
    <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {values.map(([label, value]) => (
        <article className={card} key={label}>
          <p className="text-xs text-vds-muted">{label}</p>
          <p className="mt-2 font-semibold">{value}</p>
        </article>
      ))}
    </section>
  );
}

export function ReminderList({ snapshot }: { snapshot: CalendarSnapshot }) {
  return (
    <section className={`${card} mt-6`}>
      <h2 className="text-lg font-semibold">Reminder queue</h2>
      <div className="mt-4 max-h-[42rem] divide-y divide-vds-divider overflow-auto [content-visibility:auto]">
        {snapshot.reminders.map((item) => (
          <article
            className="grid gap-2 py-4 sm:grid-cols-[1fr_auto]"
            key={item.id}
          >
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-xs capitalize text-vds-muted">
                {item.kind} reminder · {format(item.dueAt)}
              </p>
            </div>
            <span className="self-start rounded-full border border-vds-border px-3 py-1 text-xs capitalize">
              {item.status}
            </span>
          </article>
        ))}
        {!snapshot.reminders.length && (
          <p className="py-12 text-center text-sm text-vds-muted">
            No reminders are queued.
          </p>
        )}
      </div>
    </section>
  );
}

export function MeetingWorkspaceView({ event }: { event?: ScheduleEvent }) {
  if (!event)
    return (
      <section className={`${card} mt-6 text-sm text-vds-muted`}>
        No meeting is available for workspace context.
      </section>
    );
  const context = [
    ["Customer Summary", event.customer ?? "Customer context unavailable."],
    ["Property Summary", event.property ?? "Property context unavailable."],
    ["Deal Summary", event.deal ?? "Deal context unavailable."],
    ["Agenda", "No agenda recorded."],
    ["Attachments", "No attachments recorded."],
    ["Meeting Notes", "No meeting notes recorded."],
    ["Related Communications", event.conversation ?? "No linked conversation."],
    ["Workflow Status", event.workflow ?? "No linked workflow."],
    ["Reminder Status", event.notification ?? "No linked reminder."],
    ["Assigned AI Employee", event.assignedAI ?? "No AI employee assigned."],
  ] as const;
  return (
    <section className={`${card} mt-6`}>
      <h2 className="text-lg font-semibold">Meeting workspace preview</h2>
      <p className="mt-1 text-sm text-vds-muted">{event.title}</p>
      <dl className="mt-5 grid gap-4 md:grid-cols-2">
        {context.map(([label, value]) => (
          <div className="rounded-xl bg-vds-elevated p-4" key={label}>
            <dt className="text-xs uppercase tracking-wide text-vds-muted">
              {label}
            </dt>
            <dd className="mt-2 text-sm">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function SiteVisitWorkspace({ event }: { event?: ScheduleEvent }) {
  if (!event)
    return (
      <section className={`${card} mt-6 text-sm text-vds-muted`}>
        No site visit is available.
      </section>
    );
  const context = [
    ["Address", event.location ?? "Address unavailable."],
    ["Property", event.property ?? "Property unavailable."],
    ["Buyer", event.customer ?? "Buyer unavailable."],
    ["Agent", event.assignedHuman ?? "Agent unassigned."],
    ["Status", event.status],
    ["Checklist", "No checklist items recorded."],
    ["Travel Notes", "No travel notes recorded."],
    ["Documents", "No documents attached."],
    ["Reminder", event.notification ?? "No reminder linked."],
    ["Workflow", event.workflow ?? "No workflow linked."],
  ] as const;
  return (
    <section className={`${card} mt-6`}>
      <h2 className="text-lg font-semibold">Site visit workspace preview</h2>
      <dl className="mt-5 grid gap-4 md:grid-cols-2">
        {context.map(([label, value]) => (
          <div className="rounded-xl bg-vds-elevated p-4" key={label}>
            <dt className="text-xs uppercase tracking-wide text-vds-muted">
              {label}
            </dt>
            <dd className="mt-2 text-sm capitalize">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function AssistancePanel({
  suggestions,
}: {
  suggestions: readonly SchedulingSuggestion[];
}) {
  return (
    <section className={`${card} mt-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            Deterministic scheduling assistance
          </h2>
          <p className="mt-1 text-sm text-vds-muted">
            Advisory only. No provider calls or autonomous scheduling.
          </p>
        </div>
        <span className="rounded-full border border-vds-border px-3 py-1 text-xs text-vds-muted">
          Human approval required
        </span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {suggestions.map((item) => (
          <article className="rounded-xl bg-vds-elevated p-4" key={item.kind}>
            <p className="text-xs font-semibold uppercase tracking-wide text-vds-primary">
              {item.kind}
            </p>
            <p className="mt-2 text-sm font-medium">{item.recommendation}</p>
            <p className="mt-2 text-xs text-vds-muted">{item.rationale}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ScheduleRow({ event }: { event: ScheduleEvent }) {
  return (
    <article className="grid gap-3 py-4 sm:grid-cols-[11rem_1fr_auto]">
      <time className="text-sm text-vds-primary">{format(event.startsAt)}</time>
      <div>
        <p className="font-medium">{event.title}</p>
        <p className="mt-1 text-xs text-vds-muted">
          {event.location ?? "Location unavailable"} · {event.durationMinutes}{" "}
          min
        </p>
        <p className="mt-1 text-xs text-vds-muted">
          {event.customer ?? "No customer"} · {event.deal ?? "No deal"} ·{" "}
          {event.workflow ?? "No workflow"}
        </p>
      </div>
      <div className="flex flex-wrap items-start gap-2">
        <span className="rounded-full border border-vds-border px-3 py-1 text-xs capitalize">
          {event.type}
        </span>
        <span className="rounded-full bg-vds-elevated px-3 py-1 text-xs capitalize text-vds-muted">
          {event.status}
        </span>
      </div>
    </article>
  );
}
