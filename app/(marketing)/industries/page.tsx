import type { Metadata } from "next";
import { CommercialCatalogIndex } from "@/features/marketing/components/CommercialCatalogPage";
import { industryCatalog } from "@/features/marketing/content/commercial-catalog";
export const metadata: Metadata = {
  title: "Industries",
  description:
    "VAYON solutions for residential, commercial, luxury, developer, brokerage and property investment teams.",
  alternates: { canonical: "/industries" },
  openGraph: {
    title: "VAYON Industries",
    description: "Industry operating models powered by governed AI.",
    url: "/industries",
  },
};
export default function Page() {
  return (
    <CommercialCatalogIndex
      eyebrow="Industry operating models"
      title="Built around how your industry works."
      description="Explore practical pain points, outcomes and suggested VAYON workflows for nine industries."
      entries={industryCatalog}
      basePath="/industries"
    />
  );
}
