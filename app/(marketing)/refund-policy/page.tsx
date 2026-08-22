import type { Metadata } from "next";
import { LegalPolicyPage } from "@/features/marketing/components/LegalPolicyPage";
export const metadata: Metadata = { title: "Refund Policy", description: "Vayon subscription cancellation, billing review, and refund request policy.", alternates: { canonical: "/refund-policy" } };
export default function Page() { return <LegalPolicyPage title="Refund Policy" description="This policy describes the operational process for billing reviews. Contractual terms and applicable law continue to govern each subscription." sections={[
  { title: "Subscription charges", paragraphs: ["Subscription fees, billing periods, trials, taxes, and renewal terms are shown during checkout or documented in an enterprise order. Customers should review these terms before confirming payment."] },
  { title: "Cancellation", paragraphs: ["Authorized billing users can request cancellation through available billing controls or support. Cancellation timing and continued access follow the subscription terms shown for the account."] },
  { title: "Billing review", paragraphs: ["Suspected duplicate, incorrect, or unauthorized charges should be reported promptly through the contact form. Vayon reviews each request against provider records, contractual terms, and applicable consumer law before confirming an outcome."] },
]}/>; }
