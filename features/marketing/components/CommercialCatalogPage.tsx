import {
  ArrowRight,
  Bot,
  Building2,
  ChartNoAxesCombined,
  Check,
  ImageIcon,
  LayoutDashboard,
  Megaphone,
  MessageSquareText,
  Palette,
  Target,
} from "lucide-react";
import { ButtonLink } from "@/features/platform/design-system";

export interface CommercialCatalogEntry {
  readonly slug: string;
  readonly name: string;
  readonly summary: string;
  readonly solution?: string;
  readonly problems: readonly string[];
  readonly outcomes: readonly string[];
  readonly modules: readonly string[];
  readonly workflows?: readonly string[];
  readonly screenshots?: readonly string[];
}

const solutionIcons = [
  Bot,
  Building2,
  LayoutDashboard,
  Target,
  MessageSquareText,
  Megaphone,
  Palette,
  ChartNoAxesCombined,
  ArrowRight,
] as const;

export function CommercialCatalogIndex({
  eyebrow,
  title,
  description,
  entries,
  basePath,
}: {
  eyebrow: string;
  title: string;
  description: string;
  entries: readonly CommercialCatalogEntry[];
  basePath: string;
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
        {entries.map((entry, index) => {
          const Icon = solutionIcons[index % solutionIcons.length]!;
          return (
            <article
              className="group relative min-h-80 overflow-hidden rounded-3xl border border-vds-border bg-vds-surface p-7 transition hover:-translate-y-1 hover:border-vds-accent-border hover:shadow-2xl"
              key={entry.slug}
            >
              <div
                aria-hidden="true"
                className="absolute -right-12 -top-12 size-48 rounded-full bg-vds-primary-soft blur-2xl"
              />
              <span className="relative grid size-12 place-items-center rounded-2xl bg-vds-primary-soft text-vds-primary">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h2 className="relative mt-12 text-2xl font-semibold">
                {entry.name}
              </h2>
              <p className="mt-3 leading-7 text-vds-muted">{entry.summary}</p>
              <ButtonLink
                className="mt-6"
                variant="outline"
                href={`${basePath}/${entry.slug}`}
              >
                Explore {entry.name}
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
            </article>
          );
        })}
      </div>
    </main>
  );
}
export function CommercialCatalogDetail({
  eyebrow,
  entry,
}: {
  eyebrow: string;
  entry: CommercialCatalogEntry;
}) {
  const groups: readonly (readonly [string, readonly string[]])[] = [
    ["The problem", entry.problems],
    ["Key benefits", entry.outcomes],
    ["Connected capabilities", entry.modules],
    ...(entry.workflows
      ? [["Suggested workflows", entry.workflows] as const]
      : []),
  ];
  return (
    <main>
      <section className="mx-auto max-w-[90rem] px-5 py-24 sm:px-8">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-5 max-w-5xl text-5xl font-semibold tracking-[-.05em] sm:text-7xl">
          {entry.name} for modern real estate teams
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-vds-muted">
          {entry.summary}
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href="/signup">Start Free Trial</ButtonLink>
          <ButtonLink href="/contact?intent=demo" variant="outline">
            Book Live Demo
          </ButtonLink>
          <ButtonLink href="/demo" variant="ghost">
            Watch 2-Minute Demo
          </ButtonLink>
        </div>
      </section>
      <section className="border-y border-vds-border bg-vds-elevated/30">
        <div className="mx-auto grid max-w-[90rem] gap-8 px-5 py-20 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <p className="eyebrow">How VAYON solves it</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-.035em] sm:text-4xl">
              One connected path from property signal to accountable action.
            </h2>
          </div>
          <p className="text-lg leading-8 text-vds-muted">
            {entry.solution ?? entry.summary}
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-[90rem] gap-4 px-5 pb-24 sm:px-8 lg:grid-cols-2">
        {groups.map(([title, items]) => (
          <article
            className="rounded-3xl border border-vds-border bg-vds-surface p-7"
            key={title}
          >
            <h2 className="text-2xl font-semibold">{title}</h2>
            <ul className="mt-5 space-y-3">
              {items.map((item) => (
                <li className="flex gap-3 text-vds-muted" key={item}>
                  <Check
                    className="mt-1 size-4 shrink-0 text-vds-primary"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
      <section className="mx-auto max-w-[90rem] px-5 pb-24 sm:px-8">
        <p className="eyebrow">Product screenshots</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-.035em] sm:text-4xl">
          See the real estate workflow in context.
        </h2>
        <div className="mt-9 grid gap-5 lg:grid-cols-2">
          {(
            entry.screenshots ?? [
              `${entry.name} workspace`,
              `${entry.name} operating view`,
            ]
          ).map((label) => (
            <figure key={label}>
              <div className="aspect-[16/10] rounded-3xl border border-vds-border bg-vds-elevated p-4 shadow-xl">
                <div className="flex h-full flex-col rounded-2xl border border-vds-border bg-vds-surface p-5">
                  <div className="flex gap-2" aria-hidden="true">
                    <span className="size-2 rounded-full bg-vds-primary" />
                    <span className="size-2 rounded-full bg-vds-border" />
                    <span className="size-2 rounded-full bg-vds-border" />
                  </div>
                  <div
                    className="mt-5 grid flex-1 grid-cols-[5rem_1fr] gap-4"
                    aria-hidden="true"
                  >
                    <div className="rounded-xl bg-vds-primary-soft" />
                    <div className="grid grid-rows-3 gap-3">
                      <div className="rounded-xl bg-vds-primary-soft" />
                      <div className="rounded-xl border border-vds-border" />
                      <div className="rounded-xl border border-vds-border" />
                    </div>
                  </div>
                </div>
              </div>
              <figcaption className="mt-3 text-center text-sm text-vds-muted">
                {label} — representative interface preview
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}
export function ProductCatalog({
  entries,
}: {
  entries: readonly CommercialCatalogEntry[];
}) {
  return (
    <main>
      <CommercialCatalogIndex
        eyebrow="VAYON product catalog"
        title="Every operating system your business needs."
        description="Explore connected products that turn buyer, seller, property, creative and agent context into one accountable real estate operation."
        entries={entries}
        basePath="/features"
      />
      <section className="mx-auto max-w-[90rem] px-5 pb-24 sm:px-8">
        <div className="rounded-3xl border border-vds-border bg-vds-primary-soft p-8">
          <ImageIcon className="size-6 text-vds-primary" aria-hidden="true" />
          <h2 className="mt-4 text-3xl font-semibold">
            Product previews prepared for verified screenshots
          </h2>
          <p className="mt-3 max-w-3xl text-vds-muted">
            Screenshot placeholders preserve layout readiness without
            fabricating production interfaces or customer data.
          </p>
        </div>
      </section>
    </main>
  );
}
