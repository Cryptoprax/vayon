"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { FounderBootstrapService } from "./founder-bootstrap.service";

function value(form: FormData, key: string): string {
  return String(form.get(key) ?? "");
}

function fail(error: unknown): never {
  const message = error instanceof Error ? error.message : "Founder access update failed.";
  redirect(`/platform/founder/access?error=${encodeURIComponent(message)}`);
}

export async function grantFounderAction(form: FormData) {
  try {
    await new FounderBootstrapService().grant(value(form, "email"), value(form, "reason"));
    revalidatePath("/platform/founder/access");
  } catch (error) {
    fail(error);
  }
  redirect("/platform/founder/access?success=Founder%20access%20granted");
}

export async function revokeFounderAction(form: FormData) {
  try {
    await new FounderBootstrapService().revoke(value(form, "email"), value(form, "reason"));
    revalidatePath("/platform/founder/access");
  } catch (error) {
    fail(error);
  }
  redirect("/platform/founder/access?success=Founder%20access%20revoked");
}
