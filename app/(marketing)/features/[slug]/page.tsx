import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommercialCatalogDetail } from "@/features/marketing/components/CommercialCatalogPage";
import { productCatalog } from "@/features/marketing/content/commercial-catalog";
export function generateStaticParams() {
  return productCatalog.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params,
    e = productCatalog.find((x) => x.slug === slug);
  return e
    ? {
        title: e.name,
        description: e.summary,
        alternates: { canonical: `/features/${slug}` },
        openGraph: {
          title: e.name,
          description: e.summary,
          url: `/features/${slug}`,
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
  const e = productCatalog.find((x) => x.slug === slug);
  if (!e) notFound();
  return <CommercialCatalogDetail eyebrow="VAYON product" entry={e} />;
}
