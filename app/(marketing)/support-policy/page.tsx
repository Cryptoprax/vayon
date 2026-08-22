import type { Metadata } from "next";
import { LegalPolicyPage } from "@/features/marketing/components/LegalPolicyPage";
export const metadata: Metadata = { title: "Support Policy", description: "How customers request help and how Vayon prioritizes production incidents.", alternates: { canonical: "/support-policy" } };
export default function Page() { return <LegalPolicyPage title="Support Policy" description="Vayon provides a governed path for product questions, account assistance, and production incident reports." sections={[
  { title: "Requesting support", paragraphs: ["Use the Vayon contact form and include the affected workspace, approximate time, workflow, and visible diagnostic. Never submit passwords, API keys, recovery codes, or other secrets."] },
  { title: "Incident priority", paragraphs: ["Security concerns, unavailable production workflows, billing failures, and suspected data-isolation issues receive priority review. Feature questions and configuration guidance are handled according to the customer’s support arrangement."] },
  { title: "Service evidence", paragraphs: ["Resolution may require request or correlation identifiers, provider status, audit history, and sanitized logs. Response or restoration targets are contractual only when stated in an applicable order or service agreement."] },
]}/>; }
