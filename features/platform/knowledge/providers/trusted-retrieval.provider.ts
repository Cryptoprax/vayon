import type {
  KnowledgeAuthority,
  KnowledgeRetrievalContext,
  KnowledgeSearchResult,
} from "../contracts";

const authorityRank: Readonly<Record<KnowledgeAuthority, number>> =
  Object.freeze({
    organization: 700,
    approved_knowledge_base: 600,
    administrator_guide: 500,
    product_documentation: 400,
    release_notes: 300,
    faq: 200,
    ai_reasoning: 100,
  });
const planRank: Readonly<Record<string, number>> = Object.freeze({
  free: 0,
  starter: 1,
  professional: 2,
  business: 3,
  enterprise: 4,
});
const synonyms: Readonly<Record<string, readonly string[]>> = Object.freeze({
  lead: ["prospect", "customer", "crm"],
  inventory: ["unit", "property", "availability"],
  campaign: ["marketing", "creative", "brochure", "flyer"],
  permission: ["role", "access", "rbac"],
  invoice: ["billing", "payment", "subscription"],
  visit: ["appointment", "meeting", "site"],
  whatsapp: ["message", "communications", "conversation"],
});

const tokens = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((item) => item.length > 1);

export function semanticTerms(value: string): readonly string[] {
  const expanded = new Set(tokens(value));
  for (const token of [...expanded])
    for (const related of synonyms[token] ?? []) expanded.add(related);
  return Object.freeze([...expanded].slice(0, 32));
}

export function authorityFor(
  result: KnowledgeSearchResult,
): KnowledgeAuthority {
  if (result.authority) return result.authority;
  if (result.category === "organization" || result.category === "playbook")
    return "organization";
  if (result.category === "administrator") return "administrator_guide";
  if (result.category === "release_notes") return "release_notes";
  if (result.category === "faq") return "faq";
  if (result.source === "documentation") return "product_documentation";
  return "approved_knowledge_base";
}

export class TrustedKnowledgeRetrievalProvider {
  readonly id = "trusted-hybrid-retrieval-v1";

  rank(
    query: string,
    candidates: readonly KnowledgeSearchResult[],
    context: KnowledgeRetrievalContext = {},
    limit = 8,
  ): readonly KnowledgeSearchResult[] {
    const queryTokens = new Set(tokens(query)),
      expanded = new Set(semanticTerms(query));
    return Object.freeze(
      candidates
        .filter((candidate) => !candidate.upcoming)
        .filter(
          (candidate) =>
            !candidate.featureKey || context.featureAvailable !== false,
        )
        .filter(
          (candidate) =>
            !candidate.minimumPlan ||
            !context.subscriptionPlan ||
            (planRank[context.subscriptionPlan.toLowerCase()] ?? 0) >=
              (planRank[candidate.minimumPlan.toLowerCase()] ?? 0),
        )
        .map((candidate) => {
          const candidateTokens = new Set(
              tokens(
                `${candidate.title} ${candidate.summary} ${candidate.tags.join(" ")} ${candidate.transcript ?? ""}`,
              ),
            ),
            semanticMatches = [...expanded].filter((term) =>
              candidateTokens.has(term),
            ).length,
            exactMatches = [...queryTokens].filter((term) =>
              candidateTokens.has(term),
            ).length,
            authority = authorityFor(candidate),
            moduleBoost =
              context.module &&
              (candidate.module === context.module ||
                candidate.tags.includes(context.module))
                ? 30
                : 0,
            versionBoost =
              context.productVersion &&
              candidate.version === context.productVersion
                ? 20
                : 0,
            deprecatedPenalty = candidate.deprecated ? -150 : 0;
          return {
            ...candidate,
            authority,
            score:
              authorityRank[authority] +
              exactMatches * 20 +
              semanticMatches * 8 +
              moduleBoost +
              versionBoost +
              deprecatedPenalty +
              Math.min(candidate.score, 1),
          };
        })
        .filter(
          (candidate) => candidate.score > authorityRank[candidate.authority],
        )
        .sort((left, right) => right.score - left.score)
        .slice(0, Math.min(Math.max(limit, 1), 30)),
    );
  }
}
