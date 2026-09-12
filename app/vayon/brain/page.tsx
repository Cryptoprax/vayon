import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import type { Metadata } from "next";
import { BrainDashboard } from "@/features/platform/intelligence/brain/dashboard/BrainDashboard";
export const metadata: Metadata = { title: "Vayon Brain | Vayon OS", description: "Architecture dashboard for Vayon OS intelligence orchestration." };
export default function BrainPage() { return <WorkspaceContent ><BrainDashboard /></WorkspaceContent> }

