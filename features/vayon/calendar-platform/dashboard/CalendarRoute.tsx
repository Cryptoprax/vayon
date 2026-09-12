import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { CalendarPlatformService } from "../services/calendar-platform.service";
import {
  AssistancePanel,
  CalendarAnalytics,
  CalendarHeader,
  EntityList,
  MeetingWorkspaceView,
  Observability,
  ReminderList,
  ScheduleList,
  SiteVisitWorkspace,
} from "../components/CalendarViews";
import { toCalendarView, type CalendarView } from "../view-models/calendar";

type EntityKind = "meetings" | "site-visits" | "tasks" | "reminders";

export async function CalendarViewRoute({ view }: { view: CalendarView }) {
  const service = await CalendarPlatformService.production();
  const snapshot = await service.snapshot();
  return (
    <WorkspaceContent>
      <CalendarHeader
        title={`${view[0]!.toUpperCase()}${view.slice(1)} calendar`}
        description="A tenant-scoped operational schedule across meetings, visits, tasks, reminders, CRM context, communications, workflows, and AI Workforce advice."
      />
      <CalendarAnalytics snapshot={snapshot} />
      <ScheduleList model={toCalendarView(snapshot, view)} />
      <Observability snapshot={snapshot} />
    </WorkspaceContent>
  );
}

export async function CalendarEntityRoute({ kind }: { kind: EntityKind }) {
  const service = await CalendarPlatformService.production();
  const snapshot = await service.snapshot();
  if (kind === "reminders")
    return (
      <WorkspaceContent>
        <CalendarHeader
          title="Reminders"
          description="Deterministic scheduling reminders. External delivery remains disabled."
        />
        <ReminderList snapshot={snapshot} />
        <Observability snapshot={snapshot} />
      </WorkspaceContent>
    );
  const types =
      kind === "meetings"
        ? ["meeting"]
        : kind === "site-visits"
          ? ["site-visit"]
          : ["internal-task", "follow-up", "deadline"],
    events = snapshot.events.filter((event) => types.includes(event.type)),
    first = events[0];
  return (
    <WorkspaceContent>
      <CalendarHeader
        title={
          kind === "site-visits"
            ? "Site visits"
            : kind[0]!.toUpperCase() + kind.slice(1)
        }
        description="Connected scheduling records with explicit CRM, communication, workflow, approval, timeline, and assignment context."
      />
      <EntityList events={events} title={`${events.length} ${kind}`} />
      {kind === "meetings" && <MeetingWorkspaceView event={first} />}{" "}
      {kind === "site-visits" && <SiteVisitWorkspace event={first} />}{" "}
      {first && <AssistancePanel suggestions={service.assistance(first)} />}
      <Observability snapshot={snapshot} />
    </WorkspaceContent>
  );
}
