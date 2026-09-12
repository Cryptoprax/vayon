import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import type { Metadata } from "next";
import { RuntimeDashboard } from "@/features/platform/ai-runtime/dashboard/RuntimeDashboard";
export const metadata: Metadata = { title: "AI Runtime | Vayon OS", description: "Architecture dashboard for the provider-neutral Vayon AI Runtime." };
export default function RuntimePage() { return <WorkspaceContent ><RuntimeDashboard /></WorkspaceContent> }

