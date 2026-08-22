import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  KnowledgeArticle,
  KnowledgeDocument,
  KnowledgeSearchRequest,
  KnowledgeSearchResult,
} from "../contracts";
export class KnowledgeRepository {
  constructor(
    private client: SupabaseClient,
    private organizationId: string,
    private workspaceId: string,
  ) {}
  async articles() {
    const { data, error } = await this.client
      .from("knowledge_articles")
      .select("*")
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      content: row.content,
      category: row.category,
      tags: row.tags,
      status: row.status,
      version: row.version,
      author: row.author_name,
      lastReviewedAt: row.last_reviewed_at,
      views: row.view_count,
      helpful: row.helpful_count,
      notHelpful: row.not_helpful_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })) as KnowledgeArticle[];
  }
  async documents() {
    const { data, error } = await this.client
      .from("knowledge_documents")
      .select(
        "id,file_name,mime_type,category,tags,status,version,author_name,last_reviewed_at,created_at",
      )
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.file_name,
      mimeType: row.mime_type,
      category: row.category,
      tags: row.tags,
      status: row.status,
      version: row.version,
      author: row.author_name,
      lastReviewedAt: row.last_reviewed_at,
      createdAt: row.created_at,
    })) as KnowledgeDocument[];
  }
  async search(input: KnowledgeSearchRequest) {
    const { data, error } = await this.client.rpc(
      "search_enterprise_knowledge",
      {
        p_workspace_id: this.workspaceId,
        p_query: input.query,
        p_category: input.category ?? null,
        p_tags: input.tags ?? [],
        p_limit: input.limit,
      },
    );
    if (error) throw error;
    return (data ?? []) as KnowledgeSearchResult[];
  }
  async semanticCandidates(
    input: KnowledgeSearchRequest,
    expandedTerms: readonly string[],
    module?: string,
    productVersion?: string,
  ) {
    const { data, error } = await this.client.rpc(
      "retrieve_trusted_knowledge",
      {
        p_workspace_id: this.workspaceId,
        p_query: input.query,
        p_expanded_terms: expandedTerms,
        p_module: module ?? null,
        p_product_version: productVersion ?? null,
        p_limit: Math.min(Math.max(input.limit, 1), 100),
      },
    );
    if (error) {
      // Forward-compatible fallback for deployments awaiting the Sprint 86.3 migration.
      return this.search({ ...input, mode: "full_text" });
    }
    return (data ?? []) as KnowledgeSearchResult[];
  }
  async dashboard() {
    const { data, error } = await this.client.rpc(
      "enterprise_knowledge_dashboard",
      { p_workspace_id: this.workspaceId },
    );
    if (error) throw error;
    return data as Record<string, number>;
  }
  async upload(file: File, category: string, tags: string[]) {
    const extension = file.name.split(".").pop()?.toLowerCase(),
      allowed = ["pdf", "docx", "md", "txt"];
    if (
      !extension ||
      !allowed.includes(extension) ||
      file.size > 20 * 1024 * 1024
    )
      throw new Error(
        "Upload must be PDF, DOCX, Markdown, or TXT and no larger than 20 MB.",
      );
    const path = `${this.organizationId}/${this.workspaceId}/${crypto.randomUUID()}.${extension}`,
      upload = await this.client.storage
        .from("knowledge-documents")
        .upload(path, file, { contentType: file.type, upsert: false });
    if (upload.error) throw upload.error;
    const { error } = await this.client.rpc("register_knowledge_document", {
      p_workspace_id: this.workspaceId,
      p_file_name: file.name,
      p_storage_path: path,
      p_mime_type: file.type || "text/plain",
      p_category: category,
      p_tags: tags,
    });
    if (error) throw error;
  }
  async feedback(id: string, helpful: boolean) {
    const { error } = await this.client.rpc("record_knowledge_feedback", {
      p_workspace_id: this.workspaceId,
      p_article_id: id,
      p_helpful: helpful,
    });
    if (error) throw error;
  }
  async qualityFeedback(
    id: string,
    rating: "helpful" | "not_helpful" | "needs_update" | "report_problem",
    anonymousSessionId?: string,
  ) {
    const { error } = await this.client.rpc(
      "record_knowledge_quality_feedback",
      {
        p_workspace_id: this.workspaceId,
        p_article_id: id,
        p_rating: rating,
        p_session_id: anonymousSessionId ?? null,
      },
    );
    if (error) throw error;
  }
}
