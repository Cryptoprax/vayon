export type DocumentationAudience =
  "user" | "administrator" | "developer" | "customer-success";
export type DocumentationBlock =
  | { readonly type: "paragraph"; readonly text: string }
  | {
      readonly type: "callout";
      readonly tone: "info" | "tip" | "warning";
      readonly title: string;
      readonly text: string;
    }
  | {
      readonly type: "code";
      readonly language: "bash" | "typescript" | "json";
      readonly code: string;
    }
  | { readonly type: "steps"; readonly items: readonly string[] };
export interface DocumentationArticle {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly section: string;
  readonly audience: DocumentationAudience;
  readonly tags: readonly string[];
  readonly version: string;
  readonly updatedAt: string;
  readonly readingMinutes: number;
  readonly popularity: number;
  readonly blocks: readonly DocumentationBlock[];
  readonly related: readonly string[];
}
export interface DocumentationSearch {
  readonly query: string;
  readonly category?: string;
  readonly tags?: readonly string[];
  readonly limit?: number;
}
export interface DocumentationEvent {
  readonly type: "view" | "search" | "failed_search" | "feedback" | "bookmark";
  readonly articleSlug?: string;
  readonly query?: string;
  readonly helpful?: boolean;
  readonly sessionId?: string;
}
export interface DocumentationProvider {
  list(): readonly DocumentationArticle[];
  find(slug: string): DocumentationArticle | undefined;
  search(input: DocumentationSearch): readonly DocumentationArticle[];
  record(event: DocumentationEvent): Promise<void>;
}
export interface OpenApiResource {
  readonly name: string;
  readonly path: string;
  readonly methods: readonly ("GET" | "POST" | "PATCH" | "DELETE")[];
  readonly scopes: readonly string[];
  readonly description: string;
}
