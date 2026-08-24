import "server-only";

import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export class FounderAccessError extends Error {}

export function isFounder(user: Pick<User, "app_metadata"> | null | undefined): boolean {
  const role = String(user?.app_metadata?.role ?? "");
  return role === "founder" || role === "super_admin";
}

export async function founderContext() {
  const client = await createSupabaseServerClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user || !isFounder(user)) {
    throw new FounderAccessError("Founder Portal access required.");
  }
  return { client, user };
}
