import type { Metadata } from "next";
import { CommercialCatalogIndex } from "@/features/marketing/components/CommercialCatalogPage";
import { solutionCatalog } from "@/features/marketing/content/commercial-catalog";
export const metadata: Metadata = {
  title: "Real Estate Solutions",
  description:
    "Explore VAYON solutions for real estate sales, CRM, property management, marketing, creative work and executive growth.",
  alternates: { canonical: "/solutions" },
  openGraph: {
    title: "VAYON Real Estate Solutions",
    description:
      "Nine connected AI solutions for modern real estate companies.",
    url: "/solutions",
  },
};
export default function Page() {
  return (
    <CommercialCatalogIndex
      eyebrow="Real estate solutions"
      title="Turn more property opportunities into closed deals."
      description="Explore nine connected solutions for lead response, property operations, buyer communication, marketing, creative execution and executive growth."
      entries={solutionCatalog}
      basePath="/solutions"
    />
  );
}
