import type { Metadata } from "next";
import { LegalPolicyPage } from "@/features/marketing/components/LegalPolicyPage";
import { legalPolicies } from "@/features/marketing/content/legal-content";
const p = legalPolicies.terms;
export const metadata: Metadata = {
  title: p.title,
  description: p.description,
  alternates: { canonical: "/terms" },
  openGraph: { title: p.title, description: p.description, url: "/terms" },
};
export default function Page() {
  return <LegalPolicyPage {...p} />;
}
