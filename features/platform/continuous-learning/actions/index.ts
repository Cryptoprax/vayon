"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { organizationMemoryKeys, userMemoryKeys } from "../contracts";
import { ContinuousLearningService } from "../services/continuous-learning.service";

export async function saveIntelligenceMemoryAction(form: FormData) {
  const scope = z.enum(["organization", "user"]).parse(form.get("scope"));
  const allowed =
    scope === "organization" ? organizationMemoryKeys : userMemoryKeys;
  const key = z.enum(allowed).parse(form.get("key"));
  const value = z
    .string()
    .trim()
    .min(1)
    .max(2000)
    .transform((input) =>
      input
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 50),
    )
    .parse(form.get("value"));
  await new ContinuousLearningService().remember(scope, key, value);
  revalidatePath("/vayon/settings/product-intelligence");
}

export async function generateExecutiveBriefingAction(form: FormData) {
  const period = z
    .enum([
      "weekly",
      "monthly",
      "quarterly",
      "customer_success",
      "ai_adoption",
      "knowledge_health",
    ])
    .parse(form.get("period"));
  await new ContinuousLearningService().generateBriefing(period);
  revalidatePath("/vayon/settings/product-intelligence");
}
