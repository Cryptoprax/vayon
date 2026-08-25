import type { Metadata } from "next";
import { LaunchInformationPage } from "@/features/marketing/components/LaunchInformationPage";
export const metadata: Metadata = {
  title: "VAYON API — Coming Soon",
  description: "VAYON public API availability and developer readiness.",
  alternates: { canonical: "/api" },
  openGraph: {
    title: "VAYON API — Coming Soon",
    description:
      "Provider-neutral API capabilities are being prepared for public access.",
    url: "/api",
  },
};
export default function Page() {
  return (
    <LaunchInformationPage
      eyebrow="Developers"
      title="Public API coming soon."
      description="VAYON's internal API contracts remain governed and production APIs are not advertised as publicly available until access, documentation and support are certified."
      cards={[
        {
          title: "Architecture",
          description: "Review the current platform architecture.",
          href: "/developers",
          state: "operational",
        },
        {
          title: "Public API access",
          description: "Not yet generally available.",
          state: "coming-soon",
        },
      ]}
    />
  );
}
