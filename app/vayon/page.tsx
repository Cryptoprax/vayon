import { redirect } from "next/navigation";
import { AuthenticationService } from "@/features/authentication/services/authentication.service";
import { WorkspaceService } from "@/features/onboarding/services/workspace.service";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const [query, user] = await Promise.all([
    searchParams,
    new AuthenticationService().user(),
  ]);
  if (!user) redirect("/login");
  const workspace = await new WorkspaceService().first();
  if (!workspace) redirect("/onboarding");
  redirect(query.welcome === "1" ? "/vayon/dashboard?welcome=1" : "/vayon/dashboard");
}
