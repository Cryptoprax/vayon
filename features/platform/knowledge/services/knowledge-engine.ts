import type { DocumentationArticle } from "../contracts/documentation";
import type {
  KnowledgeRetrievalContext,
  KnowledgeSearchResult,
} from "../contracts";
import { TrustedKnowledgeRetrievalProvider } from "../providers/trusted-retrieval.provider";

function documentationAuthority(article: DocumentationArticle) {
  if (article.audience === "administrator")
    return "administrator_guide" as const;
  if (article.slug === "release-notes") return "release_notes" as const;
  if (article.slug === "faq") return "faq" as const;
  return "product_documentation" as const;
}

export function documentationCandidates(
  articles: readonly DocumentationArticle[],
): readonly KnowledgeSearchResult[] {
  return Object.freeze(
    articles.map((article) => ({
      id: `docs:${article.slug}`,
      title: article.title,
      summary: article.description,
      category:
        article.slug === "release-notes"
          ? ("release_notes" as const)
          : article.slug === "faq"
            ? ("faq" as const)
            : article.audience === "administrator"
              ? ("administrator" as const)
              : ("user" as const),
      tags: article.tags,
      score: 0,
      source: "documentation" as const,
      citation: `/docs/${article.slug}@${article.version}`,
      authority: documentationAuthority(article),
      version: article.version,
      module: article.tags.find((tag) => tag !== "vayon") ?? article.section,
      videoUrl: null,
      transcript: article.blocks
        .flatMap((block) =>
          block.type === "steps"
            ? block.items
            : block.type === "code"
              ? [block.code]
              : [block.text],
        )
        .join(" "),
      deprecated: false,
      upcoming: false,
    })),
  );
}

export class KnowledgeEngine {
  constructor(
    private readonly retrieval = new TrustedKnowledgeRetrievalProvider(),
  ) {}

  retrieve(
    query: string,
    workspaceKnowledge: readonly KnowledgeSearchResult[],
    productDocumentation: readonly DocumentationArticle[],
    context: KnowledgeRetrievalContext = {},
  ) {
    return this.retrieval.rank(
      query,
      [...workspaceKnowledge, ...documentationCandidates(productDocumentation)],
      context,
      12,
    );
  }
}
