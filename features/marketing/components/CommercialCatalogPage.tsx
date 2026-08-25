import { ArrowRight, Check, ImageIcon } from "lucide-react";
import { ButtonLink } from "@/features/platform/design-system";

export interface CommercialCatalogEntry {
  readonly slug: string;
  readonly name: string;
  readonly summary: string;
  readonly problems: readonly string[];
  readonly outcomes: readonly string[];
  readonly modules: readonly string[];
  readonly workflows?: readonly string[];
}

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
        {entries.map((entry) => (
          <article
            className="rounded-3xl border border-vds-border bg-vds-surface p-7"
            key={entry.slug}
          >
            <h2 className="text-2xl font-semibold">{entry.name}</h2>
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
        ))}
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
    ["Problems solved", entry.problems],
    ["Business outcomes", entry.outcomes],
    ["Recommended VAYON modules", entry.modules],
    ...(entry.workflows
      ? [["Suggested workflows", entry.workflows] as const]
      : []),
  ];
  return (
    <main>
      <section className="mx-auto max-w-[90rem] px-5 py-24 sm:px-8">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-5 max-w-5xl text-5xl font-semibold tracking-[-.05em] sm:text-7xl">
          VAYON for {entry.name}
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-vds-muted">
          {entry.summary}
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href="/signup">Start Free Trial</ButtonLink>
          <ButtonLink href="/contact?intent=demo" variant="outline">
            Book a Demo
          </ButtonLink>
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
        description="Explore the connected products that turn customer context, creative work, AI employees and executive evidence into one accountable operation."
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
