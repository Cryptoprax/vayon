import type { Metadata } from "next";
import { LegalPolicyPage } from "@/features/marketing/components/LegalPolicyPage";
import { legalPolicies } from "@/features/marketing/content/legal-content";
const p = legalPolicies.copyright;
export const metadata: Metadata = {
  title: p.title,
  description: p.description,
  alternates: { canonical: "/copyright-policy" },
  openGraph: {
    title: p.title,
    description: p.description,
    url: "/copyright-policy",
  },
};
export default function Page() {
  return <LegalPolicyPage {...p} />;
}
