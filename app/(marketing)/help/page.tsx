import type { Metadata } from "next";
import { LaunchInformationPage } from "@/features/marketing/components/LaunchInformationPage";
export const metadata: Metadata = {
  title: "VAYON Help Center",
  description: "Documentation, guided help and support paths for VAYON.",
  alternates: { canonical: "/help" },
  openGraph: {
    title: "VAYON Help Center",
    description: "Find trusted VAYON guidance and support.",
    url: "/help",
  },
};
export default function Page() {
  return (
    <LaunchInformationPage
      eyebrow="Help Center"
      title="Find a trusted answer."
      description="Start with product documentation, browse release guidance or contact the right VAYON team."
      cards={[
        {
          title: "Documentation",
          description:
            "Platform concepts, administrator guides and integration architecture.",
          href: "/docs",
        },
        {
          title: "Release Notes",
          description: "Verified product release history.",
          href: "/release-notes",
        },
        {
          title: "Support",
          description:
            "Submit a support request through the professional contact workflow.",
          href: "/contact?intent=support",
        },
      ]}
    />
  );
}
