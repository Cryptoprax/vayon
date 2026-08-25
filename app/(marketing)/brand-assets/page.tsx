import type { Metadata } from "next";
import { LaunchInformationPage } from "@/features/marketing/components/LaunchInformationPage";
export const metadata: Metadata = {
  title: "VAYON Brand Assets",
  description: "Approved VAYON brand identity and usage information.",
  alternates: { canonical: "/brand-assets" },
  openGraph: {
    title: "VAYON Brand Assets",
    description: "VAYON logo and brand usage resources.",
    url: "/brand-assets",
  },
};
export default function Page() {
  return (
    <LaunchInformationPage
      eyebrow="Brand"
      title="VAYON brand assets."
      description="Approved identity resources will be published here for partners and media. No third-party endorsement is implied."
      cards={[
        {
          title: "Logo package",
          description: "Primary and alternative approved marks.",
          state: "coming-soon",
        },
        {
          title: "Brand guidance",
          description: "Colour, spacing and usage requirements.",
          state: "coming-soon",
        },
        {
          title: "Product screenshots",
          description: "Verified launch imagery only.",
          state: "coming-soon",
        },
      ]}
    />
  );
}
