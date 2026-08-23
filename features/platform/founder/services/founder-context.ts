import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export class FounderAccessError extends Error {}

export async function founderContext() {
  const client = await createSupabaseServerClient();
  const { data: { user }, error } = await client.auth.getUser();
  const role = String(user?.app_metadata?.role ?? "");
  const founderClaim = user?.app_metadata?.founder === true;
  if (error || !user || !(role === "founder" || (role === "super_admin" && founderClaim))) {
    throw new FounderAccessError("Founder Portal access required.");
  }
  return { client, user };
}
