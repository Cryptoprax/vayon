import type { Metadata } from "next";
import { LegalPolicyPage } from "@/features/marketing/components/LegalPolicyPage";
import { legalPolicies } from "@/features/marketing/content/legal-content";
const p = legalPolicies.acceptable;
export const metadata: Metadata = {
  title: p.title,
  description: p.description,
  alternates: { canonical: "/acceptable-use-policy" },
  openGraph: {
    title: p.title,
    description: p.description,
    url: "/acceptable-use-policy",
  },
};
export default function Page() {
  return <LegalPolicyPage {...p} />;
}
