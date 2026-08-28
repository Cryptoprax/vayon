import type { Metadata } from "next";
import { LaunchInformationPage } from "@/features/marketing/components/LaunchInformationPage";

export const metadata: Metadata = {
  title: "Data Ownership | VAYON",
  description: "How VAYON approaches customer data ownership, access, and portability.",
  alternates: { canonical: "/data-ownership" },
};

export default function Page() {
  return <LaunchInformationPage eyebrow="Trust center" title="Your business data remains yours." description="VAYON is designed so organizations retain ownership of the business information they provide. Access remains governed by workspace permissions and authenticated product boundaries." cards={[
    { title: "Ownership", description: "Your organization retains ownership of the customer, property, communication, and operational data it provides to VAYON." },
    { title: "Workspace isolation", description: "Workspace boundaries and role-based permissions control who can access organization information." },
    { title: "Portability and support", description: "Contact Support for verified guidance about data access, export, retention, or account closure.", href: "/contact?intent=support" },
  ]} />;
}
