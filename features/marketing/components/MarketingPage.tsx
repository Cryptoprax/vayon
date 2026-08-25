import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  Layers3,
  ShieldCheck,
} from "lucide-react";
import type { MarketingPageContent } from "../content/pages";
import { PricingTable } from "./PricingTable";

export function MarketingPage({
  content,
}: {
  readonly content: MarketingPageContent;
}) {
  if (content.id === "pricing")
    return (
      <main>
        <PricingTable />
      </main>
    );
  return (
    <main>
      <MarketingJsonLd content={content} />
      <section className="relative overflow-hidden border-b border-vds-border">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,var(--vds-color-primary-soft),transparent_38%)]"
        />
        <div className="relative mx-auto max-w-[90rem] px-5 py-24 sm:px-8 sm:py-32">
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-vds-primary">
            {content.eyebrow}
          </p>
          <h1 className="mt-6 max-w-5xl text-5xl font-semibold tracking-[-.05em] sm:text-6xl lg:text-7xl">
            {content.title}
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-vds-muted sm:text-xl">
            {content.description}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="vds-focus inline-flex h-12 items-center gap-2 rounded-xl bg-vds-primary px-5 font-semibold text-vds-on-accent"
            >
              Talk to sales
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/demo"
              className="vds-focus inline-flex h-12 items-center rounded-xl border border-vds-border px-5 font-semibold hover:bg-vds-hover"
            >
              Explore the demo
            </Link>
          </div>
        </div>
      </section>
      {content.id === "blog" ? (
        <BlogSurface />
      ) : content.id === "resources" || content.id === "docs" ? (
        <ResourceSurface docs={content.id === "docs"} />
      ) : content.id === "customers" ? (
        <CustomerSurface />
      ) : content.id === "contact" || content.id === "careers" ? (
        <AwaitingSurface type={content.id} />
      ) : (
        <ProductSections content={content} />
      )}
      <FinalCta />
    </main>
  );
}

function ProductSections({
  content,
}: {
  readonly content: MarketingPageContent;
}) {
  return (
    <>
      <section
        aria-labelledby="features-heading"
        className="mx-auto max-w-[90rem] px-5 py-20 sm:px-8"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">
            Capabilities
          </p>
          <h2
            id="features-heading"
            className="mt-3 text-3xl font-semibold sm:text-4xl"
          >
            Designed as one connected system.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {content.features.map((feature, index) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-vds-border bg-vds-surface/[.035] p-6 transition hover:-translate-y-1 hover:border-vds-border-strong"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-vds-primary-soft text-vds-primary">
                {index === 0 ? (
                  <Layers3 className="size-5" aria-hidden="true" />
                ) : index === 1 ? (
                  <Blocks className="size-5" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="size-5" aria-hidden="true" />
                )}
              </span>
              <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-vds-muted">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="border-y border-vds-border bg-vds-surface/[.018]">
        <div className="mx-auto grid max-w-[90rem] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">
              Product preview
            </p>
            <h2 className="mt-3 text-3xl font-semibold">
              A focused workspace for consequential work.
            </h2>
            <ul className="mt-7 space-y-4">
              {content.benefits.map((benefit) => (
                <li key={benefit} className="flex gap-3">
                  <CheckCircle2
                    className="mt-0.5 size-5 shrink-0 text-vds-primary"
                    aria-hidden="true"
                  />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <figure>
            <div className="aspect-[16/10] rounded-3xl border border-vds-border bg-vds-elevated p-4 shadow-2xl">
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-vds-border">
                <p className="max-w-xs text-center text-sm text-vds-subtle">
                  Product screenshot reserved for launch-approved media.
                </p>
              </div>
            </div>
            <figcaption className="mt-3 text-center text-xs text-vds-subtle">
              Interface preview placeholder
            </figcaption>
          </figure>
        </div>
      </section>
      <section className="mx-auto grid max-w-[90rem] gap-5 px-5 py-20 sm:px-8 lg:grid-cols-2">
        <article className="rounded-3xl border border-vds-border p-7">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">
            Architecture
          </p>
          <h2 className="mt-3 text-2xl font-semibold">
            Built on shared platform contracts.
          </h2>
          <p className="mt-4 leading-7 text-vds-muted">
            Domain, service, repository, view-model, and provider boundaries
            keep customer experience independent from infrastructure choices.
          </p>
        </article>
        <article className="rounded-3xl border border-vds-border p-7">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">
            Enterprise
          </p>
          <h2 className="mt-3 text-2xl font-semibold">
            Governance is part of the product.
          </h2>
          <p className="mt-4 leading-7 text-vds-muted">
            Workspace isolation, permissions, audit history, approval policy,
            and diagnostics are designed as platform concerns rather than
            afterthoughts.
          </p>
        </article>
      </section>
    </>
  );
}

function BlogSurface() {
  return (
    <section className="mx-auto max-w-[90rem] px-5 py-20 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Search journal</span>
          <input
            disabled
            placeholder="Search articles — publishing begins at launch"
            className="h-12 w-full rounded-xl border border-vds-border bg-vds-input px-4"
          />
        </label>
        <div aria-label="Article categories" className="flex flex-wrap gap-2">
          {["Product", "Operations", "AI governance", "Integrations"].map(
            (value) => (
              <span
                key={value}
                className="rounded-full border border-vds-border px-3 py-2 text-sm text-vds-muted"
              >
                {value}
              </span>
            ),
          )}
        </div>
      </div>
      <div className="mt-10 rounded-3xl border border-dashed border-vds-border p-12 text-center">
        <h2 className="text-2xl font-semibold">
          Editorial calendar in preparation
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-vds-muted">
          Articles, authors, and reading times will appear only when reviewed
          publication content is available.
        </p>
      </div>
      <Newsletter />
    </section>
  );
}
function ResourceSurface({ docs }: { readonly docs: boolean }) {
  const items = docs
    ? [
        "Platform concepts",
        "Administration",
        "Integrations",
        "Workflow governance",
      ]
    : ["Documentation", "Blog", "Help Center", "Release Notes", "Status", "API (Coming Soon)"];
  return (
    <section className="mx-auto max-w-[90rem] px-5 py-20 sm:px-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article
            key={item}
            className="rounded-2xl border border-vds-border p-6"
          >
            <h2 className="font-semibold">{item}</h2>
            <p className="mt-3 text-sm leading-6 text-vds-muted">
              Launch content is being prepared and will be published after
              technical and editorial review.
            </p>
            <span className="mt-5 inline-block text-sm text-vds-subtle">
              {docs ? "Documentation collection" : "Explore resources"}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
function CustomerSurface() {
  return (
    <section className="mx-auto max-w-[90rem] px-5 py-20 sm:px-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          "Commercial Real Estate",
          "Residential",
          "Brokerages",
          "Developers",
          "Property Management",
        ].map((industry) => (
          <article
            key={industry}
            className="rounded-2xl border border-vds-border p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-vds-primary">
              Industry scenario
            </p>
            <h2 className="mt-3 text-xl font-semibold">{industry}</h2>
            <p className="mt-3 text-sm leading-6 text-vds-muted">
              Representative use cases are in editorial review. No customer
              endorsement or result is implied.
            </p>
          </article>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border border-dashed border-vds-border p-8 text-center text-vds-muted">
        Approved customer case studies will appear here.
      </div>
    </section>
  );
}
function AwaitingSurface({ type }: { readonly type: "contact" | "careers" }) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8">
      <div className="rounded-3xl border border-dashed border-vds-border p-10">
        <h2 className="text-2xl font-semibold">
          {type === "careers"
            ? "No open roles published"
            : "Contact channels coming soon"}
        </h2>
        <p className="mt-3 text-vds-muted">
          {type === "careers"
            ? "We will publish verified opportunities and application instructions here."
            : "A secure, privacy-reviewed sales contact experience will be enabled before launch."}
        </p>
      </div>
    </section>
  );
}
function Newsletter() {
  return (
    <aside className="mt-10 rounded-3xl border border-vds-border bg-vds-primary-soft p-8">
      <h2 className="text-xl font-semibold">Vayon launch notes</h2>
      <p className="mt-2 text-sm text-vds-muted">
        Newsletter subscription will become available after consent and
        email-provider infrastructure is approved.
      </p>
    </aside>
  );
}
function FinalCta() {
  return (
    <section className="border-t border-vds-border">
      <div className="mx-auto max-w-[90rem] px-5 py-20 text-center sm:px-8">
        <h2 className="text-3xl font-semibold sm:text-4xl">
          Build a more coherent real estate operation.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-vds-muted">
          Explore the product safely today, or start a future enterprise
          conversation.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/demo"
            className="vds-focus inline-flex h-12 items-center rounded-xl bg-vds-primary px-5 font-semibold text-vds-on-accent"
          >
            Explore demo
          </Link>
          <Link
            href="/contact"
            className="vds-focus inline-flex h-12 items-center rounded-xl border border-vds-border px-5 font-semibold"
          >
            Talk to sales
          </Link>
        </div>
      </div>
    </section>
  );
}
function MarketingJsonLd({
  content,
}: {
  readonly content: MarketingPageContent;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: content.title,
    description: content.description,
    url: `https://vayon.app/${content.id}`,
    isPartOf: { "@type": "WebSite", name: "Vayon", url: "https://vayon.app" },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replaceAll("<", "\\u003c"),
      }}
    />
  );
}
