import type { Metadata } from "next";
import { LaunchInformationPage } from "@/features/marketing/components/LaunchInformationPage";
export const metadata: Metadata = {
  title: "VAYON Partners — Coming Soon",
  description:
    "Future VAYON technology, solution and channel partner programs.",
  alternates: { canonical: "/partners" },
  openGraph: {
    title: "VAYON Partners",
    description: "Partner program information.",
    url: "/partners",
  },
};
export default function Page() {
  return (
    <LaunchInformationPage
      eyebrow="Company"
      title="Partner programs are coming soon."
      description="VAYON is preparing accountable technology, solution and channel relationships. No partner status is implied until formally announced."
      cards={[
        {
          title: "Technology partners",
          description: "Provider and integration relationships.",
          state: "coming-soon",
        },
        {
          title: "Solution partners",
          description: "Implementation and customer-success relationships.",
          state: "coming-soon",
        },
        {
          title: "Channel partners",
          description: "Commercial referral and sales relationships.",
          state: "coming-soon",
        },
      ]}
    />
  );
}
