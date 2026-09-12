"use client";

import { WorkspaceHeader } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { CheckCircle2 } from "lucide-react";
import { ButtonLink } from "@/features/platform/design-system";
import { allGrowthSections, type GrowthSectionSlug } from "./catalog";

export function GrowthSectionPage({ sectionSlug, actionAvailable = true }: { sectionSlug: GrowthSectionSlug; actionAvailable?: boolean }) {
  const section = allGrowthSections[sectionSlug];
  return <div className="space-y-5"><WorkspaceHeader title={section.title} description={section.description} />
    <div className="grid gap-4 md:grid-cols-2">{section.groups.map((group) => <section key={group.title} className="rounded-3xl border border-vds-border bg-vds-surface p-5"><h3 className="font-semibold">{group.title}</h3><ul className="mt-4 grid gap-2 sm:grid-cols-2">{group.items.map((item) => <li key={item} className="flex items-center gap-2 rounded-xl bg-vds-input px-3 py-2 text-sm text-vds-muted"><CheckCircle2 className="size-4 shrink-0 text-vds-success" aria-hidden="true" />{item}</li>)}</ul></section>)}</div>
    <section className="rounded-3xl border border-dashed border-vds-border p-7 text-center"><h3 className="font-semibold">What should I do next?</h3>{actionAvailable ? <><p className="mx-auto mt-2 max-w-xl text-sm text-vds-muted">Start with the recommended action. Performance values appear only after verified workspace activity is available.</p><ButtonLink href={section.actionHref} className="mt-5">{section.action}</ButtonLink></> : <p className="mt-4 text-sm text-vds-muted">{section.actionHref.startsWith("/vayon/creative") ? "Continue when Campaigns become available" : "Ask your workspace administrator for access to this workflow."}</p>}</section>
  </div>;
}
