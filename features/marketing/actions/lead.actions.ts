"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ContactPipelineService } from "../services/contact-pipeline.service";
const schema = z.object({ kind: z.enum(["demo", "trial", "sales", "newsletter", "enterprise", "waitlist"]), name: z.string().trim().max(100).optional(), email: z.string().trim().email().max(254), company: z.string().trim().max(160).optional(), message: z.string().trim().max(2000).optional(), plan: z.enum(["starter", "professional", "business", "enterprise"]).optional(), website: z.string().max(0).optional() });
export async function captureLeadAction(form: FormData) { const parsed = schema.safeParse(Object.fromEntries(form)); if (!parsed.success) redirect("/contact?error=invalid"); const { website, ...input } = parsed.data; if (website) redirect("/contact?submitted=true"); const requestId = crypto.randomUUID(); await new ContactPipelineService().submit(input, { requestId, correlationId: crypto.randomUUID() }); redirect(`/contact?submitted=true&request=${requestId}`); }
