import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommercialCatalogDetail } from "@/features/marketing/components/CommercialCatalogPage";
import { solutionCatalog } from "@/features/marketing/content/commercial-catalog";
export function generateStaticParams() {
  return solutionCatalog.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params,
    e = solutionCatalog.find((x) => x.slug === slug);
  return e
    ? {
        title: `VAYON for ${e.name}`,
        description: e.summary,
        alternates: { canonical: `/solutions/${slug}` },
        openGraph: {
          title: `VAYON for ${e.name}`,
          description: e.summary,
          url: `/solutions/${slug}`,
        },
      }
    : {};
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e = solutionCatalog.find((x) => x.slug === slug);
  if (!e) notFound();
  return <CommercialCatalogDetail eyebrow="Real estate solutions" entry={e} />;
}
