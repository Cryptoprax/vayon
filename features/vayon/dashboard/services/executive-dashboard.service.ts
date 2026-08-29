import "server-only";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { OrganizationService } from "@/features/onboarding/services/organization.service";
import { WorkspaceService } from "@/features/onboarding/services/workspace.service";
import type {
  AiMetrics,
  AiWorkforceMember,
  CalendarItem,
  ChartPoint,
  DashboardActivity,
  DashboardNotification,
  ExecutiveDashboardData,
  KpiMetric,
  PipelineColumn,
  UsageNotice,
  WhatsAppConversation,
} from "../types";

type Row = Record<string, unknown>;
const day = 86400000;
const number = (value: unknown) => Number(value ?? 0);
const date = (value: unknown) => new Date(String(value));
const sum = (rows: Row[], key: string) =>
  rows.reduce((total, row) => total + number(row[key]), 0);
function percentage(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
function inRange(value: unknown, start: Date, end: Date) {
  const time = date(value).getTime();
  return time >= start.getTime() && time < end.getTime();
}
function buckets(
  rows: Row[],
  field: string,
  start: Date,
  count = 7,
  valueField?: string,
) {
  return Array.from({ length: count }, (_, index) => {
    const from = new Date(start.getTime() + index * day),
      to = new Date(from.getTime() + day);
    const selected = rows.filter((row) => inRange(row[field], from, to));
    return valueField ? sum(selected, valueField) : selected.length;
  });
}
function money(value: number, currency: string, compact = true) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(value);
}
function hrefFor(type: unknown, id: unknown) {
  const value = String(id ?? "");
  if (type === "lead") return `/vayon/leads/${value}`;
  if (type === "property") return `/vayon/properties/${value}`;
  if (type === "deal") return `/vayon/deals/${value}`;
  return "/vayon/operations";
}

export class ExecutiveDashboardService {
  async load(): Promise<ExecutiveDashboardData> {
    const [context, organization, workspace] = await Promise.all([
      operationsContext(),
      new OrganizationService().current(),
      new WorkspaceService().first(),
    ]);
    const { client, organizationId: o, workspaceId: w } = context,
      now = new Date(),
      today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + day),
      yesterday = new Date(today.getTime() - day),
      twoWeeks = new Date(today.getTime() - 13 * day),
      yearStart = new Date(today);
    yearStart.setMonth(yearStart.getMonth() - 11, 1);
    yearStart.setHours(0, 0, 0, 0);
    const scoped = (table: string) =>
      client
        .from(table)
        .select("*")
        .eq("organization_id", o)
        .eq("workspace_id", w);
    const results = await Promise.all([
      scoped("leads")
        .gte("created_at", yearStart.toISOString())
        .is("deleted_at", null),
      scoped("deals").is("deleted_at", null),
      scoped("properties").is("deleted_at", null),
      scoped("meetings")
        .gte("starts_at", today.toISOString())
        .lt("starts_at", tomorrow.toISOString())
        .is("deleted_at", null),
      scoped("tasks")
        .lte("due_at", tomorrow.toISOString())
        .not("status", "in", "(completed,cancelled)")
        .is("deleted_at", null),
      scoped("ai_conversations")
        .gte("created_at", twoWeeks.toISOString())
        .is("deleted_at", null),
      scoped("invoices")
        .gte("created_at", yearStart.toISOString())
        .is("deleted_at", null),
      scoped("activity_events")
        .order("occurred_at", { ascending: false })
        .limit(12),
      scoped("site_visits")
        .gte("starts_at", today.toISOString())
        .lt("starts_at", tomorrow.toISOString())
        .is("deleted_at", null),
      scoped("call_logs")
        .gte("occurred_at", today.toISOString())
        .lt("occurred_at", tomorrow.toISOString())
        .is("deleted_at", null),
      scoped("communications")
        .gte("occurred_at", today.toISOString())
        .lt("occurred_at", tomorrow.toISOString())
        .is("deleted_at", null),
      scoped("ai_recommendations")
        .gte("created_at", today.toISOString())
        .is("deleted_at", null),
      scoped("notification_events")
        .is("read_at", null)
        .is("dismissed_at", null)
        .order("created_at", { ascending: false })
        .limit(6),
      scoped("organization_usage")
        .lte("period_start", today.toISOString().slice(0, 10))
        .gte("period_end", today.toISOString().slice(0, 10)),
      scoped("organization_limits"),
      scoped("subscriptions").is("deleted_at", null).maybeSingle(),
      scoped("ai_employees").is("deleted_at", null),
      scoped("ai_tasks")
        .gte("created_at", twoWeeks.toISOString())
        .is("deleted_at", null),
      scoped("communications")
        .eq("channel", "whatsapp")
        .is("deleted_at", null)
        .order("occurred_at", { ascending: false })
        .limit(6),
    ]);
    for (const result of results) if (result.error) throw result.error;
    const [
      leadResult,
      dealResult,
      propertyResult,
      meetingResult,
      taskResult,
      aiConversationResult,
      invoiceResult,
      activityResult,
      visitResult,
      callResult,
      communicationResult,
      recommendationResult,
      notificationResult,
      usageResult,
      limitResult,
      subscriptionResult,
      aiEmployeeResult,
      aiTaskResult,
      whatsappResult,
    ] = results;
    const leads = (leadResult.data ?? []) as Row[],
      deals = (dealResult.data ?? []) as Row[],
      properties = (propertyResult.data ?? []) as Row[],
      meetings = (meetingResult.data ?? []) as Row[],
      tasks = (taskResult.data ?? []) as Row[],
      conversations = (aiConversationResult.data ?? []) as Row[],
      invoices = (invoiceResult.data ?? []) as Row[],
      activities = (activityResult.data ?? []) as Row[],
      visits = (visitResult.data ?? []) as Row[],
      calls = (callResult.data ?? []) as Row[],
      communications = (communicationResult.data ?? []) as Row[],
      recommendations = (recommendationResult.data ?? []) as Row[],
      notificationRows = (notificationResult.data ?? []) as Row[],
      usageRows = (usageResult.data ?? []) as Row[],
      limitRows = (limitResult.data ?? []) as Row[];
    const aiEmployees = (aiEmployeeResult.data ?? []) as Row[],
      aiTasks = (aiTaskResult.data ?? []) as Row[],
      whatsappRows = (whatsappResult.data ?? []) as Row[];
    const currency = String(
        deals[0]?.currency ?? invoices[0]?.currency ?? "USD",
      ),
      weekStart = new Date(today.getTime() - 6 * day),
      previousWeek = new Date(weekStart.getTime() - 7 * day);
    const activeDeals = deals.filter((row) => row.status === "open"),
      activeLeads = leads.filter(
        (row) =>
          !["converted", "lost", "archived"].includes(String(row.status)),
      ),
      pipelineValue = sum(activeDeals, "value"),
      paid = invoices.filter((row) => row.status === "paid"),
      revenue = sum(paid, "total");
    const current = (rows: Row[], field: string) =>
        rows.filter((row) => inRange(row[field], weekStart, tomorrow)).length,
      previous = (rows: Row[], field: string) =>
        rows.filter((row) => inRange(row[field], previousWeek, weekStart))
          .length;
    const kpis: KpiMetric[] = [
      {
        key: "leads",
        label: "Active Leads",
        value: activeLeads.length,
        displayValue: String(activeLeads.length),
        detail: `+${leads.filter((row) => inRange(row.created_at, today, tomorrow)).length} today`,
        trend: percentage(
          leads.filter((row) => inRange(row.created_at, today, tomorrow))
            .length,
          leads.filter((row) => inRange(row.created_at, yesterday, today))
            .length,
        ),
        sparkline: buckets(leads, "created_at", weekStart),
        icon: "leads",
        href: "/vayon/leads",
      },
      {
        key: "deals",
        label: "Active Deals",
        value: activeDeals.length,
        displayValue: String(activeDeals.length),
        detail: `${money(pipelineValue, currency)} pipeline`,
        trend: percentage(
          current(deals, "created_at"),
          previous(deals, "created_at"),
        ),
        sparkline: buckets(deals, "created_at", weekStart),
        icon: "deals",
        href: "/vayon/deals",
      },
      {
        key: "pipeline",
        label: "Pipeline Value",
        value: pipelineValue,
        displayValue: money(pipelineValue, currency),
        trend: percentage(
          sum(
            deals.filter((row) => inRange(row.created_at, weekStart, tomorrow)),
            "value",
          ),
          sum(
            deals.filter((row) =>
              inRange(row.created_at, previousWeek, weekStart),
            ),
            "value",
          ),
        ),
        sparkline: buckets(deals, "created_at", weekStart, 7, "value"),
        icon: "pipeline",
        href: "/vayon/deals",
      },
      {
        key: "properties",
        label: "Properties",
        value: properties.length,
        displayValue: String(properties.length),
        trend: percentage(
          current(properties, "created_at"),
          previous(properties, "created_at"),
        ),
        sparkline: buckets(properties, "created_at", weekStart),
        icon: "properties",
        href: "/vayon/properties",
      },
      {
        key: "meetings",
        label: "Meetings Today",
        value: meetings.length,
        displayValue: String(meetings.length),
        trend: 0,
        sparkline: buckets(meetings, "starts_at", today, 1),
        icon: "meetings",
        href: "/vayon/meetings",
      },
      {
        key: "tasks",
        label: "Tasks Due",
        value: tasks.length,
        displayValue: String(tasks.length),
        trend: 0,
        sparkline: buckets(tasks, "due_at", weekStart),
        icon: "tasks",
        href: "/vayon/tasks",
      },
      {
        key: "ai",
        label: "AI Conversations Today",
        value: conversations.filter((row) =>
          inRange(row.created_at, today, tomorrow),
        ).length,
        displayValue: String(
          conversations.filter((row) =>
            inRange(row.created_at, today, tomorrow),
          ).length,
        ),
        trend: percentage(
          current(conversations, "created_at"),
          previous(conversations, "created_at"),
        ),
        sparkline: buckets(conversations, "created_at", weekStart),
        icon: "ai",
        href: "/vayon/ai",
      },
      {
        key: "revenue",
        label: "Revenue",
        value: revenue,
        displayValue: money(revenue, currency),
        detail: "Paid invoice revenue",
        trend: percentage(
          sum(
            paid.filter((row) => inRange(row.paid_at, weekStart, tomorrow)),
            "total",
          ),
          sum(
            paid.filter((row) => inRange(row.paid_at, previousWeek, weekStart)),
            "total",
          ),
        ),
        sparkline: buckets(paid, "paid_at", weekStart, 7, "total"),
        icon: "revenue",
        href: "/vayon/settings/invoices",
      },
    ];
    const stages: readonly [string, string][] = [
      ["new_lead", "New Leads"],
      ["qualified", "Qualified"],
      ["site_visit_scheduled", "Viewing Scheduled"],
      ["negotiation", "Negotiation"],
      ["booking", "Booking"],
      ["registration", "Registration"],
      ["completed", "Completed"],
      ["lost", "Lost"],
    ];
    const pipeline: PipelineColumn[] = stages.map(([id, label]) => {
      const rows = deals.filter((row) => row.stage_id === id),
        recent = rows.filter((row) =>
          inRange(row.updated_at, weekStart, tomorrow),
        ).length,
        prior = rows.filter((row) =>
          inRange(row.updated_at, previousWeek, weekStart),
        ).length;
      return {
        id,
        label,
        count: rows.length,
        value: sum(rows, "value"),
        trend: percentage(recent, prior),
        href: `/vayon/deals?stage=${id}`,
      };
    });
    const charts = this.charts(invoices, deals, leads, yearStart);
    const activity: DashboardActivity[] = activities.map((row) => ({
      id: String(row.id),
      eventType: String(row.event_type),
      title: String(row.title),
      description: row.description ? String(row.description) : undefined,
      occurredAt: String(row.occurred_at),
      workspace: workspace?.name ?? "Workspace",
      href: hrefFor(row.related_type, row.related_id),
    }));
    const calendar: CalendarItem[] = [
      ...meetings.map((row) => ({
        id: String(row.id),
        kind: "meeting" as const,
        title: String(row.title),
        startsAt: String(row.starts_at),
        meta: String(row.meeting_type).replaceAll("_", " "),
        href: "/vayon/meetings",
      })),
      ...visits.map((row) => ({
        id: String(row.id),
        kind: "visit" as const,
        title: "Property site visit",
        startsAt: String(row.starts_at),
        meta: String(row.status),
        href: "/vayon/site-visits",
      })),
      ...calls.map((row) => ({
        id: String(row.id),
        kind: "call" as const,
        title: "Customer call",
        startsAt: String(row.occurred_at),
        meta: `${Math.round(number(row.duration_seconds) / 60)} min · ${String(row.outcome)}`,
        href: "/vayon/communications",
      })),
      ...tasks
        .filter((row) => inRange(row.due_at, today, tomorrow))
        .map((row) => ({
          id: String(row.id),
          kind: "task" as const,
          title: String(row.title),
          startsAt: String(row.due_at),
          meta: String(row.priority),
          href: "/vayon/tasks",
        })),
    ].sort((a, b) => date(a.startsAt).getTime() - date(b.startsAt).getTime());
    const ai: AiMetrics = {
      conversations: conversations.filter((row) =>
        inRange(row.created_at, today, tomorrow),
      ).length,
      appointments: meetings.filter((row) => row.meeting_type === "customer")
        .length,
      followUps: communications.filter((row) => row.direction === "outbound")
        .length,
      recommendations: recommendations.filter((row) =>
        String(row.recommendation_type).includes("property"),
      ).length,
      emails: communications.filter(
        (row) => row.channel === "email" && row.direction === "outbound",
      ).length,
      whatsapp: communications.filter((row) => row.channel === "whatsapp")
        .length,
    };
    const aiWorkforce: AiWorkforceMember[] = aiEmployees.map((employee) => {
      const employeeTasks = aiTasks.filter(
          (task) => task.employee_id === employee.id,
        ),
        completed = employeeTasks.filter(
          (task) => task.status === "completed",
        ).length;
      return {
        id: String(employee.id),
        name: String(employee.name),
        role: String(employee.department),
        status:
          employee.status === "ready"
            ? "ready"
            : employee.status === "inactive"
              ? "offline"
              : "offline",
        tasksCompleted: completed,
        efficiency: employeeTasks.length
          ? Math.round((completed / employeeTasks.length) * 100)
          : undefined,
      };
    });
    const whatsappConversations: WhatsAppConversation[] = whatsappRows.map(
      (row) => {
        const metadata =
          typeof row.metadata === "object" && row.metadata
            ? (row.metadata as Row)
            : {};
        return {
          id: String(row.id),
          customer: String(
            metadata.contact_name ??
              metadata.customer_name ??
              "WhatsApp contact",
          ),
          message: String(row.body),
          occurredAt: String(row.occurred_at),
          unread: row.direction === "inbound" && row.status !== "read",
        };
      },
    );
    const notifications: DashboardNotification[] = notificationRows.map(
      (row) => ({
        id: String(row.id),
        title: String(row.title),
        body: String(row.body),
        category: String(row.category),
        priority: String(row.priority),
        createdAt: String(row.created_at),
        href: "/vayon/notifications",
      }),
    );
    const limits = new Map(
      limitRows.map((row) => [
        String(row.metric),
        row.limit_value === null ? undefined : number(row.limit_value),
      ]),
    );
    const usage: UsageNotice[] = usageRows
      .filter((row) =>
        ["storage_gb", "ai_requests"].includes(String(row.metric)),
      )
      .map((row) => ({
        label:
          String(row.metric) === "storage_gb" ? "Storage usage" : "AI credits",
        value: number(row.quantity),
        limit: limits.get(String(row.metric)),
        href: "/vayon/settings/usage",
      }));
    const subscription = subscriptionResult.data as Row | null;
    if (subscription?.current_period_ends_at)
      notifications.push({
        id: "subscription-renewal",
        title: "Upcoming renewal",
        body: `Subscription period ends ${date(subscription.current_period_ends_at).toLocaleDateString()}.`,
        category: "billing",
        priority: subscription.status === "past_due" ? "urgent" : "normal",
        createdAt: String(subscription.updated_at),
        href: "/vayon/settings/subscription",
      });
    return {
      organizationName: organization?.name ?? "Organization",
      workspaceName: workspace?.name ?? "Workspace",
      currency,
      kpis,
      pipeline,
      charts,
      activities: activity,
      calendar,
      ai,
      aiWorkforce,
      whatsappConversations,
      notifications,
      usage,
      isEmpty:
        leads.length + deals.length + properties.length + activities.length ===
        0,
    };
  }
  private charts(
    invoices: Row[],
    deals: Row[],
    leads: Row[],
    start: Date,
  ): ChartPoint[] {
    return Array.from({ length: 12 }, (_, index) => {
      const from = new Date(start.getFullYear(), start.getMonth() + index, 1),
        to = new Date(start.getFullYear(), start.getMonth() + index + 1, 1),
        monthDeals = deals.filter((row) => inRange(row.created_at, from, to)),
        monthLeads = leads.filter((row) => inRange(row.created_at, from, to)),
        wins = deals.filter(
          (row) =>
            row.stage_id === "completed" && inRange(row.updated_at, from, to),
        );
      return {
        label: new Intl.DateTimeFormat("en", { month: "short" }).format(from),
        revenue: sum(
          invoices.filter(
            (row) => row.status === "paid" && inRange(row.paid_at, from, to),
          ),
          "total",
        ),
        pipeline: sum(monthDeals, "value"),
        leads: monthLeads.length,
        conversion: monthLeads.length
          ? Math.round((wins.length / monthLeads.length) * 100)
          : 0,
        sales: wins.length,
      };
    });
  }
}
