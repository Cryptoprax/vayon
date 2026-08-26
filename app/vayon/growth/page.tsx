import type { Metadata } from "next";
import { GrowthOverview } from "@/features/vayon/growth-intelligence/GrowthOverview";
import { AuthenticationService } from "@/features/authentication/services/authentication.service";

export const metadata: Metadata = { title: "Growth Intelligence | VAYON", description: "Executive growth planning with a human-approved AI Chief Marketing Officer." };

export default async function GrowthPage() { const user = await new AuthenticationService().user(); const userName = String(user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split("@")[0] ?? "there"); return <GrowthOverview userName={userName} />; }
