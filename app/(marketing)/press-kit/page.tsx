import type { Metadata } from "next";
import { LaunchInformationPage } from "@/features/marketing/components/LaunchInformationPage";
export const metadata: Metadata = {
  title: "VAYON Press Kit",
  description: "Approved company, product and media resources for VAYON.",
  alternates: { canonical: "/press-kit" },
  openGraph: {
    title: "VAYON Press Kit",
    description: "Approved VAYON media resources.",
    url: "/press-kit",
  },
};
export default function Page() {
  return (
    <LaunchInformationPage
      eyebrow="Company"
      title="VAYON press kit."
      description="A publication-ready entry point for approved company facts, founder information, product context and media contacts."
      cards={[
        {
          title: "Company overview",
          description:
            "The AI Business Operating System for customer, creative and executive operations.",
          href: "/about",
        },
        {
          title: "Brand assets",
          description: "Approved logo and brand guidance.",
          href: "/brand-assets",
        },
        {
          title: "Media contact",
          description:
            "hello@vayon.online is a published placeholder until mailbox configuration is verified.",
        },
      ]}
    />
  );
}
