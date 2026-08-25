import Link from "next/link";
export interface PolicySection {
  readonly title: string;
  readonly paragraphs: readonly string[];
}
export function LegalPolicyPage({
  title,
  description,
  sections,
  version = "1.0",
  effectiveDate = "25 August 2026",
}: {
  title: string;
  description: string;
  sections: readonly PolicySection[];
  version?: string;
  effectiveDate?: string;
}) {
  return (
    <main className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
      <p className="eyebrow">VAYON Legal Center</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
        {title}
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-vds-muted">
        {description}
      </p>
      <dl className="mt-6 flex flex-wrap gap-6 text-sm">
        <div>
          <dt className="text-vds-subtle">Version</dt>
          <dd>{version}</dd>
        </div>
        <div>
          <dt className="text-vds-subtle">Effective date</dt>
          <dd>{effectiveDate}</dd>
        </div>
      </dl>
      <nav
        aria-label={`${title} table of contents`}
        className="mt-10 rounded-2xl border border-vds-border bg-vds-elevated p-6"
      >
        <h2 className="font-semibold">Table of contents</h2>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2">
          {sections.map((section, index) => (
            <li key={section.title}>
              <a
                className="vds-focus rounded text-sm text-vds-primary underline"
                href={`#section-${index + 1}`}
              >
                {index + 1}. {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="mt-8 space-y-6">
        {sections.map((section, index) => (
          <section
            id={`section-${index + 1}`}
            className="scroll-mt-24 rounded-2xl border border-vds-border bg-vds-surface p-6"
            key={section.title}
          >
            <h2 className="text-xl font-semibold">
              {index + 1}. {section.title}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p className="mt-3 leading-7 text-vds-muted" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
      <p className="mt-10 text-sm text-vds-muted">
        Questions can be submitted through the{" "}
        <Link className="text-vds-primary underline" href="/contact">
          VAYON contact form
        </Link>{" "}
        or to legal@vayon.online when configured.
      </p>
    </main>
  );
}
