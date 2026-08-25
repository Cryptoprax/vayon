import type { Metadata } from "next";
import { CommercialCatalogIndex } from "@/features/marketing/components/CommercialCatalogPage";
import { solutionCatalog } from "@/features/marketing/content/commercial-catalog";
export const metadata: Metadata = {
  title: "Business Solutions",
  description:
    "VAYON solutions for startups, small businesses, agencies, growing companies and enterprises.",
  alternates: { canonical: "/solutions" },
  openGraph: {
    title: "VAYON Business Solutions",
    description: "One AI business operating system for every stage of growth.",
    url: "/solutions",
  },
};
export default function Page() {
  return (
    <CommercialCatalogIndex
      eyebrow="Business solutions"
      title="Operate with clarity at every stage of growth."
      description="Choose a business path to see the problems VAYON solves, the outcomes it supports and the connected modules recommended for your team."
      entries={solutionCatalog}
      basePath="/solutions"
    />
  );
}
