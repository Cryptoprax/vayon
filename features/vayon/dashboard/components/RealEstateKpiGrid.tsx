import Link from "next/link";
import type { ExecutiveDashboardData } from "../types";

type DisplayMetric = { readonly label: string; readonly value: string; readonly detail: string; readonly href: string };

export function RealEstateKpiGrid({ data }: { readonly data: ExecutiveDashboardData }) {
  const metric = (key: string) => data.kpis.find((item) => item.key === key);
  const pipeline = metric("pipeline"), deals = metric("deals"), leads = metric("leads");
  const closed = data.pipeline.find((item) => item.id === "completed");
  const visits = data.calendar.filter((item) => item.kind === "visit").length;
  const tasks = data.calendar.filter((item) => item.kind === "task").length;
  const approvals = data.notifications.filter((item) => /approval/i.test(item.category)).length;
  const conversion = leads?.value ? data.charts.at(-1)?.conversion : undefined;
  const unavailable = (label: string, href = "/vayon/analytics"): DisplayMetric => ({ label, value: "Unavailable", detail: "Awaiting verified workspace data · Not enough authoritative data", href });
  const items: DisplayMetric[] = [
    { label: "Revenue Pipeline", value: pipeline?.displayValue ?? "Unavailable", detail: pipeline ? "Verified open transaction value" : "Waiting for activity", href: "/vayon/deals" },
    unavailable("Active Listings", "/vayon/properties"), unavailable("Active Buyers", "/vayon/leads"), unavailable("Active Sellers", "/vayon/leads"),
    { label: "Pending Deals", value: deals?.displayValue ?? "Unavailable", detail: deals?.detail ?? "Waiting for activity", href: "/vayon/deals" },
    { label: "Closed Deals", value: closed ? String(closed.count) : "Unavailable", detail: closed ? "Verified completed transactions" : "Waiting for activity", href: "/vayon/deals?stage=completed" },
    { label: "Today's Site Visits", value: String(visits), detail: visits ? "Scheduled today" : "No site visits scheduled", href: "/vayon/site-visits" },
    { label: "Tasks Due Today", value: String(tasks), detail: tasks ? "Due before end of day" : "No tasks due today", href: "/vayon/tasks" },
    unavailable("Commission Pipeline", "/vayon/deals"), unavailable("Average Response Time", "/vayon/communications"),
    { label: "Conversion Rate", value: conversion === undefined ? "Unavailable" : `${conversion}%`, detail: conversion === undefined ? "Not enough lead evidence" : "Current verified monthly cohort", href: "/vayon/analytics/sales" },
    unavailable("Average Days to Close", "/vayon/analytics/deals"), unavailable("Lead Response SLA", "/vayon/leads"),
    { label: "Listings Pending Approval", value: String(approvals), detail: approvals ? "Verified approval notifications" : "No pending approval notifications", href: "/vayon/approvals" },
    unavailable("Marketing Qualified Leads", "/vayon/leads"), unavailable("Hot Opportunities", "/vayon/deals"),
  ];
  return <section aria-labelledby="executive-kpi-heading"><div className="mb-3"><p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">Business health</p><h2 id="executive-kpi-heading" className="mt-2 text-xl font-semibold">Executive KPI bar</h2></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">{items.map((item) => <Link href={item.href} key={item.label} className="focus-ring min-w-0 rounded-2xl border border-vds-border bg-vds-surface p-4 transition hover:-translate-y-0.5 hover:border-vds-accent-border motion-reduce:transform-none motion-reduce:transition-none"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-vds-muted">{item.label}</p><p className="mt-3 truncate text-xl font-semibold tabular-nums">{item.value}</p><p className="mt-1 text-xs leading-5 text-vds-subtle">{item.detail}</p></Link>)}</div></section>;
}
