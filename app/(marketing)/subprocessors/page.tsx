import type { Metadata } from "next";
import { LegalPolicyPage } from "@/features/marketing/components/LegalPolicyPage";
import { legalPolicies } from "@/features/marketing/content/legal-content";
const p = legalPolicies.subprocessors;
export const metadata: Metadata = {
  title: p.title,
  description: p.description,
  alternates: { canonical: "/subprocessors" },
  openGraph: {
    title: p.title,
    description: p.description,
    url: "/subprocessors",
  },
};
export default function Page() {
  return <LegalPolicyPage {...p} />;
}
