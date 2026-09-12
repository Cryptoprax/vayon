import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import type { Metadata } from "next";
import { CognitiveDashboard } from "@/features/platform/intelligence/cognitive/dashboard/CognitiveDashboard";
export const metadata: Metadata = { title: "Cognitive Engine | Vayon OS", description: "Architecture dashboard for Vayon OS cognitive planning and governance." };
export default function CognitivePage() { return <WorkspaceContent ><CognitiveDashboard /></WorkspaceContent> }

