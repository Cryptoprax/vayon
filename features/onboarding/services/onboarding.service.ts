import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { OnboardingInput } from "../validation/onboarding";

type Result = { organization_id: string; workspace_id: string };

export class OnboardingService {
  async provision(input: OnboardingInput, logo?: File) {
    const client = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) throw new Error("Your session expired. Please sign in again.");
    const { data, error } = await client.rpc("complete_sprint43_onboarding", {
      p_input: { ...input, country: input.country.toUpperCase(), currency: input.currency.toUpperCase() },
    });
    if (error) throw new Error(error.message);
    const result = data as Result;
    if (logo) {
      if (!["image/png", "image/jpeg", "image/webp"].includes(logo.type) || logo.size > 5 * 1024 * 1024)
        throw new Error("Logo must be PNG, JPEG, or WebP and smaller than 5 MB.");
      const extension = logo.type === "image/png" ? "png" : logo.type === "image/webp" ? "webp" : "jpg";
      const path = `${result.organization_id}/${result.workspace_id}/organization/logo.${extension}`;
      const upload = await client.storage.from("leadestate-assets").upload(path, logo, { upsert: true, contentType: logo.type });
      if (!upload.error) await client.rpc("set_organization_logo", { p_organization_id: result.organization_id, p_logo_path: path });
    }
    return result;
  }

  async complete(input: OnboardingInput, logo?: File) {
    const result = await this.provision(input, logo);
    const client = await createSupabaseServerClient();
    // Finalizes the same persisted session after the existing atomic tenant bootstrap.
    const { error: completionError } = await client.rpc("complete_enterprise_onboarding");
    if (completionError) throw new Error(completionError.message);
    return result;
  }
}
