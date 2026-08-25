import type { Metadata } from "next";
import { LaunchInformationPage } from "@/features/marketing/components/LaunchInformationPage";
export const metadata: Metadata = {
  title: "VAYON Status",
  description: "Public availability information for VAYON platform services.",
  alternates: { canonical: "/status" },
  openGraph: {
    title: "VAYON Status",
    description:
      "Current platform service visibility without fabricated telemetry.",
    url: "/status",
  },
};
const services = [
  "Platform",
  "Authentication",
  "AI Runtime",
  "Creative Runtime",
  "Storage",
  "Billing",
  "API",
].map((title) => ({
  title,
  description:
    "Live public telemetry is not currently exposed. Check authenticated provider health or contact support for verified operational evidence.",
  state: "unknown" as const,
}));
export default function Page() {
  return (
    <LaunchInformationPage
      eyebrow="Service status"
      title="Transparent service availability."
      description="VAYON distinguishes live evidence from unavailable data. Historical incident reporting is prepared and will appear after verified events exist."
      cards={services}
      cta={false}
    />
  );
}
