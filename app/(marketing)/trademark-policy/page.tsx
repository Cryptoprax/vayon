import type { Metadata } from "next";
import { LegalPolicyPage } from "@/features/marketing/components/LegalPolicyPage";
import { legalPolicies } from "@/features/marketing/content/legal-content";
const p = legalPolicies.trademark;
export const metadata: Metadata = {
  title: p.title,
  description: p.description,
  alternates: { canonical: "/trademark-policy" },
  openGraph: {
    title: p.title,
    description: p.description,
    url: "/trademark-policy",
  },
};
export default function Page() {
  return <LegalPolicyPage {...p} />;
}
