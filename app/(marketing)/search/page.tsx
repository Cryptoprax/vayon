import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/features/platform/design-system";
import {
  industryCatalog,
  productCatalog,
  solutionCatalog,
} from "@/features/marketing/content/commercial-catalog";
export const metadata: Metadata = {
  title: "Search VAYON",
  description:
    "Search VAYON products, solutions, industries, resources, trust and legal pages.",
  alternates: { canonical: "/search" },
  openGraph: {
    title: "Search VAYON",
    description: "Find public VAYON information.",
    url: "/search",
  },
};
const fixed = [
  ["Pricing", "/pricing"],
  ["Documentation", "/docs"],
  ["Help Center", "/help"],
  ["Release Notes", "/release-notes"],
  ["Status", "/status"],
  ["Security", "/security"],
  ["Trust Center", "/trust-center"],
  ["Terms of Service", "/terms"],
  ["Privacy Policy", "/privacy"],
  ["Contact", "/contact"],
] as const;
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = (await searchParams).q?.trim().slice(0, 100) ?? "",
    term = q.toLowerCase(),
    catalog = [
      ...productCatalog.map((x) => [x.name, `/features/${x.slug}`] as const),
      ...solutionCatalog.map((x) => [x.name, `/solutions/${x.slug}`] as const),
      ...industryCatalog.map((x) => [x.name, `/industries/${x.slug}`] as const),
      ...fixed,
    ],
    results = term
      ? catalog.filter(([name]) => name.toLowerCase().includes(term))
      : [];
  return (
    <main className="mx-auto max-w-5xl px-5 py-24 sm:px-8">
      <p className="eyebrow">Global search</p>
      <h1 className="mt-5 text-5xl font-semibold">Find VAYON information.</h1>
      <form action="/search" className="mt-8 flex gap-3">
        <label className="flex-1">
          <span className="sr-only">Search public website</span>
          <input
            name="q"
            defaultValue={q}
            maxLength={100}
            className="h-12 w-full rounded-xl border border-vds-border bg-vds-input px-4"
            placeholder="Search products, solutions, resources and policies"
          />
        </label>
        <Button type="submit" className="px-5">
          Search
        </Button>
      </form>
      <p className="mt-5 text-sm text-vds-muted">
        {q
          ? `${results.length} result${results.length === 1 ? "" : "s"} for “${q}”.`
          : "Enter a search term to explore the public VAYON catalog."}
      </p>
      <div className="mt-8 grid gap-3">
        {results.map(([name, href]) => (
          <Link
            className="vds-focus rounded-2xl border border-vds-border bg-vds-surface p-5 font-semibold hover:border-vds-accent-border"
            href={href}
            key={href}
          >
            {name}
          </Link>
        ))}
      </div>
    </main>
  );
}
