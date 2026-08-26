import type { Metadata } from "next";
import { GrowthOverview } from "@/features/vayon/growth-intelligence/GrowthOverview";

export const metadata: Metadata = { title: "Growth Intelligence | VAYON", description: "Executive growth planning with a human-approved AI Chief Marketing Officer." };

export default function GrowthPage() { return <GrowthOverview />; }
