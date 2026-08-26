import type { Metadata } from "next";
import { DashboardShell } from "@/features/vayon/dashboard/components/DashboardShell";
import { ExecutiveDashboardService } from "@/features/vayon/dashboard/services/executive-dashboard.service";
import { AuthenticationService } from "@/features/authentication/services/authentication.service";

export const metadata: Metadata = {
  title: "Dashboard | Vayon OS",
  description:
    "Executive business performance, sales, workforce, and activity.",
};

export default async function DashboardPage() {
  const [data, user] = await Promise.all([
    new ExecutiveDashboardService().load(),
    new AuthenticationService().user(),
  ]);
  const userName = String(
    user?.user_metadata?.full_name ??
      user?.user_metadata?.name ??
      user?.email?.split("@")[0] ??
      "Executive",
  );
  return <DashboardShell data={data} userName={userName} />;
}
