import type { Metadata } from "next";
import { ProductCatalog } from "@/features/marketing/components/CommercialCatalogPage";
import { productCatalog } from "@/features/marketing/content/commercial-catalog";
export const metadata: Metadata = {
  title: "VAYON Products",
  description:
    "Explore the complete VAYON AI Operating System for modern real estate companies.",
  alternates: { canonical: "/features" },
  openGraph: {
    title: "VAYON Products",
    description:
      "One connected catalog for business launch, AI workforce, creative, customer and executive operations.",
    url: "/features",
  },
};
export default function Page() {
  return <ProductCatalog entries={productCatalog} />;
}
