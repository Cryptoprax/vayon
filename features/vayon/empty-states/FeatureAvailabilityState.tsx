import { Clock3, Sparkles } from "lucide-react";
import { ButtonLink } from "@/features/platform/design-system";

export function FeatureAvailabilityState({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}) {
  return <main className="grid min-h-[65vh] place-items-center px-5 py-10">
    <section className="w-full max-w-2xl rounded-3xl border border-vds-accent-border bg-gradient-to-br from-vds-primary-soft to-vds-surface p-8 text-center shadow-vds-lg sm:p-12" aria-labelledby="feature-availability-title">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-vds-primary text-vds-on-accent"><Sparkles className="size-6" aria-hidden="true" /></span>
      <p className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-vds-primary"><Clock3 className="size-4" aria-hidden="true" />Coming Soon</p>
      <h1 id="feature-availability-title" className="mt-3 text-3xl font-semibold">{title}</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-vds-muted">{description}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3"><ButtonLink href="/contact?intent=early-access">Join Early Access</ButtonLink><ButtonLink href="/vayon/dashboard" variant="secondary">Return to workspace</ButtonLink></div>
    </section>
  </main>;
}
