import { notFound } from "next/navigation";

import { FounderBootstrapPanel } from "@/features/platform/founder-bootstrap/FounderBootstrapPanel";
import { FounderBootstrapError, FounderBootstrapService } from "@/features/platform/founder-bootstrap/founder-bootstrap.service";
import { FounderAccessError } from "@/features/platform/founder/services/founder-context";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const query = await searchParams;
  let accounts;
  try {
    accounts = await new FounderBootstrapService().list();
  } catch (error) {
    if (error instanceof FounderAccessError || error instanceof FounderBootstrapError) notFound();
    throw error;
  }
  return <FounderBootstrapPanel accounts={accounts} message={query.success?.slice(0, 200)} error={query.error?.slice(0, 200)}/>;
}
