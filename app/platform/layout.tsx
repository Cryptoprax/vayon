import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MissionControlLayout } from "@/features/dashboard/components/MissionControlLayout";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mission Control | AtlasOS",
  description: "The operating system shell for AtlasOS platform administration.",
};

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  const role = String(user?.app_metadata?.role ?? "");
  const showFounder = role === "founder" || (role === "super_admin" && user?.app_metadata?.founder === true);
  return <MissionControlLayout showFounder={showFounder}>{children}</MissionControlLayout>;
}
