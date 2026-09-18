import Link from "next/link";
import type { PublicPage } from "../contracts";
import { publicSiteUrl } from "@/lib/public-url";
export function PublicContentPage({ page }: { page: PublicPage }) {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: page.title,
            description: page.description,
            url: `${publicSiteUrl}/${page.slug}`,
          }).replaceAll("<", "\\u003c"),
        }}
      />
      <section className="mx-auto max-w-[90rem] px-5 py-24 sm:px-8 sm:py-32">
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-vds-primary">
          {page.eyebrow}
        </p>
        <h1 className="mt-5 max-w-5xl text-5xl font-semibold tracking-[-.05em] sm:text-7xl">
          {page.title}
        </h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-vds-muted">
          {page.description}
        </p>
        <div className="mt-9 flex gap-3">
          <Link
            className="rounded-xl bg-vds-primary px-5 py-3 font-semibold text-vds-on-accent"
            href="/signup"
          >
            Start free trial
          </Link>
          <Link
            className="rounded-xl border border-vds-border px-5 py-3 font-semibold"
            href="/contact"
          >
          Book Demo
          </Link>
        </div>
      </section>
      <section className="mx-auto grid max-w-[90rem] gap-4 px-5 pb-24 sm:px-8 md:grid-cols-3">
        {page.sections.map((x) => (
          <article
            id={x.title.toLowerCase().replaceAll(" ", "-")}
            className="rounded-2xl border border-vds-border bg-vds-surface p-6"
            key={x.title}
          >
            <h2 className="text-xl font-semibold">{x.title}</h2>
            <p className="mt-3 leading-7 text-vds-muted">{x.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
