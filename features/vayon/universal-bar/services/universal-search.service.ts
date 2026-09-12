import type { UniversalBarResult, UniversalHistoryItem } from "../domain/contracts";
import type {
  UniversalSearchEngine,
  UniversalSearchProvider,
  UniversalSearchRequest,
} from "../contracts/ports";
export class ProviderNeutralUniversalSearch implements UniversalSearchEngine {
  constructor(private readonly providers: readonly UniversalSearchProvider[]) {}
  search(request: UniversalSearchRequest) {
    const term = request.query.trim().toLocaleLowerCase();
    if (!term) return [];
    const seen = new Set<string>();
    return rankUniversalResults(this.providers
      .flatMap((provider) =>
        provider.scopes.some((scope) => request.scopes.includes(scope))
          ? provider.search(request)
          : [],
      )
      .filter((result) => {
        if (seen.has(result.id)) return false;
        seen.add(result.id);
        return true;
      })
      , request.query).slice(0, request.limit ?? 20);
  }
}

/** Rank the existing results; this does not route or execute commands. */
export function rankUniversalResults(results: readonly UniversalBarResult[], query: string, history: readonly UniversalHistoryItem[] = [], now = Date.now()): UniversalBarResult[] {
  const normalize = (value: string) => value.trim().toLocaleLowerCase().replace(/^(new|add)\s+/, "create ");
  const term = normalize(query);
  const opened = new Map(history.filter(item => item.kind === "recently-opened").map(item => [item.id, item]));
  const recentWindow = 7 * 24 * 60 * 60 * 1000;
  const score = (item: UniversalBarResult) => {
    if (item.href === "/vayon/settings/billing" && /^(billing|upgrade|subscription|plans?|pricing|trial|payments?)$/.test(term)) return -2;
    if (item.id === "invite-team" && /^(invite|team|members?|users?|employees?|staff)$/.test(term)) return -1;
    if (item.kind === "quick-create") return 0;
    if (item.kind === "record") {
      const usage = opened.get(item.id);
      const age = now - Date.parse(usage?.recordedAt ?? "");
      if (age >= 0 && age <= recentWindow) return 1;
      if ((usage?.visits ?? 0) > 1) return 2;
      return 3;
    }
    return item.scope === "settings" || item.href.startsWith("/vayon/settings") || item.href.startsWith("/platform/") ? 5 : 4;
  };
  const compare = (a: UniversalBarResult, b: UniversalBarResult) => {
    const category = score(a) - score(b);
    if (category) return category;
    if (score(a) === 1) return Date.parse(opened.get(b.id)!.recordedAt) - Date.parse(opened.get(a.id)!.recordedAt);
    if (score(a) === 2) return (opened.get(b.id)?.visits ?? 0) - (opened.get(a.id)?.visits ?? 0);
    return Number(normalize(b.label) === term) - Number(normalize(a.label) === term);
  };
  const seen = new Set<string>();
  return [...results].sort(compare).filter(item => {
    // Distinct records can share a list page; only navigation/action duplicates collapse.
    const key = item.kind === "record" ? item.id : item.href;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
