import type { Metadata } from "next";
import { LegalPolicyPage } from "@/features/marketing/components/LegalPolicyPage";
export const metadata: Metadata = { title: "Cookie Policy", description: "How Vayon uses essential storage and consent-controlled analytics.", alternates: { canonical: "/cookie-policy" } };
export default function Page() { return <LegalPolicyPage title="Cookie Policy" description="This policy explains browser storage used by Vayon and the choices available to visitors." sections={[
  { title: "Essential storage", paragraphs: ["Vayon may use essential cookies or local storage for security, session continuity, theme preferences, and consent state. Disabling essential storage can prevent authenticated functionality from operating correctly."] },
  { title: "Analytics and preferences", paragraphs: ["Optional analytics are intended to operate only in accordance with the visitor’s consent state. Marketing telemetry is designed to avoid names, email addresses, phone numbers, tokens, and authorization data."] },
  { title: "Your choices", paragraphs: ["Browser controls can remove stored data. Where consent controls are presented, optional categories can be declined without disabling essential platform security."] },
]}/>; }
