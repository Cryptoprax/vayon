import type { Metadata } from "next";
import { LegalPolicyPage } from "@/features/marketing/components/LegalPolicyPage";
import { legalPolicies } from "@/features/marketing/content/legal-content";
const p = legalPolicies.dpa;
export const metadata: Metadata = {
  title: p.title,
  description: p.description,
  alternates: { canonical: "/data-processing-addendum" },
  openGraph: {
    title: p.title,
    description: p.description,
    url: "/data-processing-addendum",
  },
};
export default function Page() {
  return <LegalPolicyPage {...p} />;
}
