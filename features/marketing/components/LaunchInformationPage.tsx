import { AlertCircle, ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import { ButtonLink } from "@/features/platform/design-system";
export interface LaunchInfoCard {
  readonly title: string;
  readonly description: string;
  readonly href?: string;
  readonly state?: "operational" | "unknown" | "coming-soon";
}
export function LaunchInformationPage({
  eyebrow,
  title,
  description,
  cards,
  cta = true,
}: {
  eyebrow: string;
  title: string;
  description: string;
  cards: readonly LaunchInfoCard[];
  cta?: boolean;
}) {
  return (
    <main className="mx-auto max-w-[90rem] px-5 py-24 sm:px-8">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-5 max-w-5xl text-5xl font-semibold tracking-[-.05em] sm:text-7xl">
        {title}
      </h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-vds-muted">
        {description}
      </p>
      <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article
            className="rounded-3xl border border-vds-border bg-vds-surface p-7"
            key={card.title}
          >
            {card.state && (
              <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-vds-muted">
                {card.state === "operational" ? (
                  <CheckCircle2 className="size-4 text-vds-success" />
                ) : card.state === "unknown" ? (
                  <AlertCircle className="size-4 text-vds-warning" />
                ) : (
                  <Clock3 className="size-4" />
                )}
                {card.state.replace("-", " ")}
              </p>
            )}
            <h2 className="text-2xl font-semibold">{card.title}</h2>
            <p className="mt-3 leading-7 text-vds-muted">{card.description}</p>
            {card.href && (
              <ButtonLink className="mt-6" href={card.href} variant="outline">
                Explore
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
            )}
          </article>
        ))}
      </div>
      {cta && (
        <div className="mt-12 flex flex-wrap gap-3">
          <ButtonLink href="/signup">Start Free</ButtonLink>
          <ButtonLink href="/contact" variant="outline">
            Contact VAYON
          </ButtonLink>
        </div>
      )}
    </main>
  );
}
