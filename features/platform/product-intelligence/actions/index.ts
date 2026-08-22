"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ProductIntelligenceService } from "../services/product-intelligence.service";
const schema = z.object({
  kind: z.enum([
    "bug_report",
    "feature_request",
    "improvement_idea",
    "ux_issue",
    "knowledge_correction",
    "general_feedback",
  ]),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(4000),
  priority: z.enum(["low", "medium", "high", "critical"]),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  resolutionQuality: z.coerce.number().int().min(1).max(5).optional(),
});
export async function submitProductFeedbackAction(form: FormData) {
  const parsed = schema.safeParse({
    kind: form.get("kind"),
    title: form.get("title"),
    description: form.get("description"),
    priority: form.get("priority"),
    rating: form.get("rating") || undefined,
    resolutionQuality: form.get("resolutionQuality") || undefined,
  });
  if (!parsed.success) throw new Error("Feedback details are invalid.");
  const screenshot = form.get("screenshot");
  await new ProductIntelligenceService().feedback(
    parsed.data,
    screenshot instanceof File ? screenshot : undefined,
  );
  revalidatePath("/vayon/settings/product-intelligence");
}
