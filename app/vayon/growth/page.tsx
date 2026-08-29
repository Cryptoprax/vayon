import type { Metadata } from "next";
import { GrowthOverview } from "@/features/vayon/growth-intelligence/GrowthOverview";
import { AuthenticationService } from "@/features/authentication/services/authentication.service";

export const metadata: Metadata = { title: "Real Estate Growth Center | VAYON", description: "Property lead generation, listing performance, buyer intelligence, seller intelligence, and real estate marketing." };

export default async function GrowthPage() { const user = await new AuthenticationService().user(); const userName = String(user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split("@")[0] ?? "there"); return <GrowthOverview userName={userName} />; }
