import "server-only";
import { createHash } from "node:crypto";
import { after } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { log, captureException } from "@/lib/observability/logger";
import { creativeStudioAccess } from "./access.service";
import {
  OpenAICreativeImageProvider,
  CreativeGenerationProviderError,
} from "./generation.provider";
import { CreativeIntentEngine } from "./intent.engine";
import type { CreativeGenerationJob, CreativeLayoutStyle } from "./domain";
type Row = Record<string, unknown>;
export class CreativeGenerationService {
  async assistant(prompt: string, projectId?: string) {
    const access = await creativeStudioAccess();
    if (!access) throw new Error("Marketing Studio subscription access is required.");
    const { data: projects, error } = await access.client
      .from("property_projects")
      .select("id,name")
      .eq("organization_id", access.organizationId)
      .eq("workspace_id", access.workspaceId);
    if (error) throw error;
    const intent = new CreativeIntentEngine().interpret(
        prompt,
        (projects ?? []).map((item) => ({
          id: String(item.id),
          name: String(item.name),
        })),
      ),
      resolvedProject = projectId || intent.projectId;
    if (!resolvedProject)
      return {
        intent,
        message:
          "Choose a project so the assistant can load authoritative inventory, pricing, imagery, floor plans, contacts and Brand Kit data.",
        jobId: null,
      };
    const cacheKey = createHash("sha256")
        .update(
          `${access.workspaceId}:${resolvedProject}:${prompt}:${intent.format}:${intent.layout}`,
        )
        .digest("hex"),
      { data, error: enqueueError } = await access.client.rpc(
        "enqueue_creative_generation",
        {
          p_input: {
            projectId: resolvedProject,
            prompt,
            format: intent.format,
            layoutStyle: intent.layout,
            cacheKey,
          },
        },
      );
    if (enqueueError) throw enqueueError;
    const jobId = String(data);
    after(() => new CreativeGenerationWorker().process(jobId));
    return {
      intent,
      message:
        "Generation queued. The draft will remain private until the complete approval workflow finishes.",
      jobId,
    };
  }
  async jobs(): Promise<readonly CreativeGenerationJob[]> {
    const access = await creativeStudioAccess();
    if (!access) throw new Error("Marketing Studio subscription access is required.");
    const { data, error } = await access.client
      .from("creative_generation_jobs")
      .select(
        "id,project_id,prompt,format,layout_style,status,progress,attempts,max_attempts,asset_id,diagnostic,created_at,updated_at",
      )
      .eq("organization_id", access.organizationId)
      .eq("workspace_id", access.workspaceId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return ((data ?? []) as Row[]).map((row) => ({
      id: String(row.id),
      projectId: String(row.project_id),
      prompt: String(row.prompt),
      format: String(row.format),
      layoutStyle: String(row.layout_style) as CreativeLayoutStyle,
      status: String(row.status) as CreativeGenerationJob["status"],
      progress: Number(row.progress),
      attempts: Number(row.attempts),
      maxAttempts: Number(row.max_attempts),
      assetId: row.asset_id ? String(row.asset_id) : undefined,
      diagnostic: row.diagnostic ? String(row.diagnostic) : undefined,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    }));
  }
}
export class CreativeGenerationWorker {
  constructor(private provider = new OpenAICreativeImageProvider()) {}
  async process(jobId: string) {
    const client = createSupabaseServiceClient(),
      { data, error } = await client.rpc("claim_creative_generation", {
        p_job_id: jobId,
      });
    if (error || !data) return;
    const job = data as Row,
      started = Date.now();
    try {
      const [projectResult, unitsResult, brandResult, documentsResult] =
        await Promise.all([
          client
            .from("property_projects")
            .select("name,developer,city,state,description,cover_image,gallery")
            .eq("id", String(job.project_id))
            .single(),
          client
            .from("property_units")
            .select("bhk_type,area,price,offer_price,currency,status")
            .eq("project_id", String(job.project_id))
            .eq("status", "available")
            .limit(50),
          client
            .from("creative_brand_kits")
            .select(
              "name,colors,typography,fonts,logo_path,watermarks,legal_disclaimer,rera_information,phone,address,website,tone",
            )
            .eq("workspace_id", String(job.workspace_id))
            .limit(1)
            .maybeSingle(),
          client
            .from("property_documents")
            .select("title,kind,storage_path")
            .eq("project_id", String(job.project_id))
            .limit(30),
        ]);
      if (projectResult.error) throw projectResult.error;
      const project = projectResult.data,
        brand = brandResult.data,
        approvedPrompt = composePrompt(
          String(job.prompt),
          String(job.format),
          String(job.layout_style),
          project,
          unitsResult.data ?? [],
          brand,
          documentsResult.data ?? [],
        ),
        size = imageSize(String(job.format)),
        result = await this.provider.generate({
          prompt: approvedPrompt,
          size,
          quality: "medium",
          workspaceId: String(job.workspace_id),
        }),
        path = `${job.organization_id}/${job.workspace_id}/creative-assets/${job.id}/${crypto.randomUUID()}.png`,
        upload = await client.storage
          .from("vayon-assets")
          .upload(path, result.bytes, {
            contentType: result.mimeType,
            upsert: false,
          });
      if (upload.error) throw upload.error;
      const { error: completeError } = await client.rpc(
        "complete_creative_generation",
        {
          p_job_id: job.id,
          p_success: true,
          p_storage_path: path,
          p_mime_type: result.mimeType,
          p_model: result.model,
          p_latency_ms: result.latencyMs,
          p_diagnostic: null,
          p_reasoning_summary: `${job.layout_style} composition prioritizing project imagery, readable hierarchy, brand contrast, offer visibility and an approval-safe CTA.`,
        },
      );
      if (completeError) throw completeError;
      log("creative.generation.completed", {
        jobId: job.id,
        workspaceId: job.workspace_id,
        model: result.model,
        latencyMs: Date.now() - started,
      });
    } catch (reason) {
      const diagnostic =
        reason instanceof CreativeGenerationProviderError
          ? reason.diagnostic
          : reason instanceof Error
            ? reason.name
            : "provider_exception";
      await client.rpc("complete_creative_generation", {
        p_job_id: job.id,
        p_success: false,
        p_storage_path: null,
        p_mime_type: null,
        p_model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2",
        p_latency_ms: Date.now() - started,
        p_diagnostic: String(diagnostic).slice(0, 120),
        p_reasoning_summary: null,
      });
      captureException(reason, {
        jobId: job.id,
        workspaceId: job.workspace_id,
      });
    }
  }
}
function imageSize(format: string): "1024x1024" | "1024x1536" | "1536x1024" {
  return /story|poster|flyer|brochure|whatsapp/i.test(format)
    ? "1024x1536"
    : /banner|linkedin|facebook/i.test(format)
      ? "1536x1024"
      : "1024x1024";
}
function composePrompt(
  request: string,
  format: string,
  layout: string,
  project: Row,
  units: Row[],
  brand: Row | null,
  documents: Row[],
) {
  const prices = units
    .map((item) => Number(item.offer_price ?? item.price))
    .filter(Number.isFinite);
  return [
    `Create a finished, production-quality real estate ${format} marketing image in a ${layout} layout.`,
    `User intent: ${request}`,
    `Authoritative project: ${project.name} by ${project.developer}; ${project.city}, ${project.state}. ${project.description ?? ""}`,
    `Available inventory: ${units.length}; price range: ${prices.length ? `${Math.min(...prices)}–${Math.max(...prices)} ${units[0]?.currency ?? ""}` : "do not display a price"}.`,
    `Brand: colors ${(brand?.colors as string[] | undefined)?.join(", ") || "use a restrained premium palette"}; typography ${(brand?.typography as string[] | undefined)?.join(", ") || "clean sans-serif"}; tone ${brand?.tone ?? "premium"}.`,
    `Compliance: ${brand?.legal_disclaimer ?? "reserve space for approved legal disclaimer"}; RERA ${brand?.rera_information ?? "not supplied—do not invent"}.`,
    `Contact: ${[brand?.phone, brand?.website, brand?.address].filter(Boolean).join(" · ") || "not supplied—do not invent"}.`,
    `Available approved source references: ${documents.map((item) => `${item.kind}:${item.title}`).join(", ") || "none"}.`,
    `Smart composition: strong visual hierarchy, intentional whitespace, aligned grid, legible contrast, visible CTA, editable-looking layered composition. Never invent pricing, offers, registration numbers, contacts, amenities, QR codes, awards, or property claims. If a fact is unavailable, omit it. Output only the final image.`,
  ].join("\n");
}
