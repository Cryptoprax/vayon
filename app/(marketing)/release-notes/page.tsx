import type { Metadata } from "next";
import { LaunchInformationPage } from "@/features/marketing/components/LaunchInformationPage";
export const metadata: Metadata = {
  title: "VAYON Release Notes",
  description: "Verified VAYON product release notes.",
  alternates: { canonical: "/release-notes" },
  openGraph: {
    title: "VAYON Release Notes",
    description: "Commercial launch release history.",
    url: "/release-notes",
  },
};
export default function Page() {
  return (
    <LaunchInformationPage
      eyebrow="Changelog"
      title="VAYON release notes."
      description="A transparent record of commercially released product changes."
      cards={[
        {
          title: "v1.0.0 RC1",
          description:
            "Release candidate covering the connected AI Business Operating System, governance, customer operations, Creative Studio and commercial launch experience.",
          state: "operational",
        },
      ]}
      cta={false}
    />
  );
}
