"use server";
import { revalidatePath } from "next/cache";
import { EnterpriseKnowledgeService } from "../services/knowledge.service";
export async function uploadKnowledgeDocumentAction(form: FormData) {
  const file = form.get("file");
  if (!(file instanceof File)) throw new Error("Document required.");
  await new EnterpriseKnowledgeService().upload(
    file,
    String(form.get("category") ?? "organization"),
    String(form.get("tags") ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
  );
  revalidatePath("/vayon/knowledge");
}
export async function recordKnowledgeFeedbackAction(form: FormData) {
  await new EnterpriseKnowledgeService().feedback(
    String(form.get("articleId") ?? ""),
    String(form.get("helpful")) === "true",
  );
  revalidatePath("/vayon/knowledge");
}
export async function recordKnowledgeQualityFeedbackAction(form: FormData) {
  const rating = String(form.get("rating") ?? "");
  if (
    !["helpful", "not_helpful", "needs_update", "report_problem"].includes(
      rating,
    )
  )
    throw new Error("Invalid knowledge feedback.");
  await new EnterpriseKnowledgeService().qualityFeedback(
    String(form.get("sourceId") ?? ""),
    rating as "helpful" | "not_helpful" | "needs_update" | "report_problem",
    String(form.get("sessionId") ?? "") || undefined,
  );
  revalidatePath("/vayon/knowledge/help");
}
