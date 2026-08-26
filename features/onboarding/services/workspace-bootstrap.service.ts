import "server-only";

import { headers } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { OrganizationService } from "./organization.service";
import { OnboardingService } from "./onboarding.service";

const currencies: Readonly<Record<string, string>> = {
  AU: "AUD",
  CA: "CAD",
  GB: "GBP",
  IN: "INR",
  JP: "JPY",
  SG: "SGD",
  US: "USD",
};

function displayName(user: User) {
  return String(
    user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email?.split("@")[0] ??
      "My",
  ).trim();
}

export class WorkspaceBootstrapService {
  async ensure(user: User) {
    const existing = await new OrganizationService().current();
    if (existing) return existing;

    const values = await headers();
    const locale = values.get("accept-language")?.split(",")[0]?.trim() ?? "en-US";
    const language = locale.split("-")[0]?.toLowerCase() || "en";
    const detectedCountry =
      values.get("x-vercel-ip-country") ??
      new Intl.Locale(locale).region ??
      "US";
    const country = detectedCountry.toUpperCase().slice(0, 2);
    const timezone = values.get("x-vercel-ip-timezone") ?? "UTC";
    const name = displayName(user);

    await new OnboardingService().provision({
      organizationName: `${name} Organization`,
      workspaceName: `${name} Workspace`,
      businessType: "Business",
      companySize: "1-10",
      phone: "0000000",
      website: "",
      industry: "Business services",
      country,
      currency: currencies[country] ?? "USD",
      timezone,
      language,
      office: "",
      branch: "",
      invitations: [],
    });

    return new OrganizationService().current();
  }
}
