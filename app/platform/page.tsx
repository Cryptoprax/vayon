import { Breadcrumbs } from "@/features/dashboard/components/Breadcrumbs";
import { WorkspaceContent, WorkspaceHeader } from "@/features/platform/design-system/layout/WorkspaceLayouts";

export default function PlatformPage() {
  return <WorkspaceContent>
    <WorkspaceHeader
      breadcrumbs={<Breadcrumbs items={[{ label: "Mission Control", href: "/platform" }, { label: "Executive" }]} />}
      eyebrow="Mission Control"
      title="Executive workspace"
      description="Your AtlasOS operating shell is ready. Select a platform area from the navigation to begin."
    />
    <section className="rounded-2xl border border-vds-border p-5">
      <h2>Dashboard canvas</h2>
      <p className="mt-2 text-sm text-vds-muted">Widgets, cards, and operational statistics will be introduced in a future dashboard phase.</p>
    </section>
  </WorkspaceContent>;
}
