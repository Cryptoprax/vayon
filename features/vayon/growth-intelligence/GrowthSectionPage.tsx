"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { Button, ButtonLink } from "@/features/platform/design-system";
import { growthSections, type GrowthSectionSlug } from "./catalog";

export function GrowthSectionPage({ sectionSlug }: { sectionSlug: GrowthSectionSlug }) {
  const section = growthSections[sectionSlug];
  const Icon = section.icon;
  return <div className="space-y-5"><header className="rounded-3xl border border-vds-border bg-vds-surface p-6 sm:p-8"><div className="flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-vds-primary-soft text-vds-primary"><Icon className="size-6" aria-hidden="true" /></span><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">Growth Intelligence</p><h2 className="mt-2 text-2xl font-semibold sm:text-3xl">{section.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-vds-muted">{section.description}</p></div></div></header>
    {section.title === "Content Calendar" && <ContentCalendar />}
    <div className="grid gap-4 md:grid-cols-2">{section.groups.map((group) => <section key={group.title} className="rounded-3xl border border-vds-border bg-vds-surface p-5"><h3 className="font-semibold">{group.title}</h3><ul className="mt-4 grid gap-2 sm:grid-cols-2">{group.items.map((item) => <li key={item} className="flex items-center gap-2 rounded-xl bg-vds-input px-3 py-2 text-sm text-vds-muted"><CheckCircle2 className="size-4 shrink-0 text-vds-success" aria-hidden="true" />{item}</li>)}</ul></section>)}</div>
    <section className="rounded-3xl border border-dashed border-vds-border p-7 text-center"><h3 className="font-semibold">What should I do next?</h3><p className="mx-auto mt-2 max-w-xl text-sm text-vds-muted">Start with one review-ready artifact. Live performance and publishing states will appear only when governed evidence is available.</p><ButtonLink href={section.actionHref} className="mt-5">{section.action}</ButtonLink></section>
  </div>;
}

function ContentCalendar() {
  const [view, setView] = useState<"Day" | "Week" | "Month">("Month");
  return <section className="rounded-3xl border border-vds-border bg-vds-surface p-5" aria-labelledby="content-calendar-title"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 id="content-calendar-title" className="font-semibold">{view} view</h3><p className="mt-1 text-xs text-vds-muted">Publishing dates appear after content is prepared and approved.</p></div><div role="group" aria-label="Calendar view" className="flex rounded-xl border border-vds-border bg-vds-input p-1">{(["Day", "Week", "Month"] as const).map((item) => <Button key={item} size="sm" variant="control" aria-pressed={view === item} onClick={() => setView(item)} className={`rounded-lg px-3 ${view === item ? "bg-vds-surface text-vds-primary" : "text-vds-muted"}`}>{item}</Button>)}</div></div><div className="mt-5 grid min-h-48 place-items-center rounded-2xl border border-dashed border-vds-border p-6 text-center"><div><CalendarDays className="mx-auto size-8 text-vds-primary" aria-hidden="true" /><p className="mt-3 font-medium">Prepare the first content item for your {view.toLowerCase()} view.</p><p className="mt-1 text-sm text-vds-muted">Include platform, objective, audience, campaign, owner, approval, and publishing date.</p></div></div></section>;
}
