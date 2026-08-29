import type { NavigationItem } from "@/features/platform/builder/types";
import type {
  UniversalSearchProvider,
  UniversalSearchRequest,
} from "../contracts/ports";
import type {
  UniversalBarResult,
  UniversalSearchScope,
} from "../domain/contracts";
import { quickCreateActions } from "../config/quick-create";
const allScopes: readonly UniversalSearchScope[] = [
  "projects",
  "inventory",
  "properties",
  "leads",
  "deals",
  "contacts",
  "companies",
  "campaigns",
  "creative-assets",
  "reports",
  "meetings",
  "tasks",
  "documents",
  "communications",
  "employees",
  "workflows",
  "analytics",
  "pages",
  "navigation",
  "universal-objects",
  "business-timeline",
  "executive-home",
  "growth",
  "settings",
];
const realEstatePriority = ["properties", "inventory", "contacts", "leads", "employees", "companies", "projects", "deals", "documents"] as const;
export class StaticNavigationSearchProvider implements UniversalSearchProvider {
  readonly id = "static-navigation";
  readonly scopes = allScopes;
  constructor(private readonly navigation: readonly NavigationItem[]) {}
  search(request: UniversalSearchRequest): readonly UniversalBarResult[] {
    const term = request.query.toLocaleLowerCase();
    const navigation = this.navigation
      .filter((item) => item.visible && item.href)
      .map((item) => ({
        id: `navigate-${item.id}`,
        label: item.label,
        description: `Open ${item.label}.`,
        href: item.href!,
        scope: scopeFor(item.href!),
        kind: "navigation" as const,
        keywords: [item.label.toLocaleLowerCase(), item.href!],
      }))
      .filter((item) => matches(item, term));
    return [
      ...quickCreateActions.filter(
        (item) => request.scopes.includes(item.scope) && matches(item, term),
      ),
      ...navigation.filter((item) => request.scopes.includes(item.scope)),
    ].toSorted((left, right) => priority(left.scope) - priority(right.scope));
  }
}
function priority(scope: UniversalSearchScope) {
  const index = realEstatePriority.indexOf(scope as (typeof realEstatePriority)[number]);
  return index === -1 ? realEstatePriority.length : index;
}
function matches(
  item: Pick<UniversalBarResult, "label" | "description" | "keywords">,
  term: string,
) {
  return [item.label, item.description, ...item.keywords].some((value) =>
    value.toLocaleLowerCase().includes(term),
  );
}
function scopeFor(href: string): UniversalSearchScope {
  if (href.includes("properties/projects")) return "projects";
  if (href.includes("properties/inventory") || href.includes("availability"))
    return "inventory";
  if (href.includes("creative-studio/assets")) return "creative-assets";
  if (href.includes("reports")) return "reports";
  if (href.includes("creative-studio") || href.includes("campaigns"))
    return "campaigns";
  if (href.includes("properties")) return "properties";
  if (href.includes("leads")) return "leads";
  if (href.includes("deals")) return "deals";
  if (href.includes("communications")) return "communications";
  if (href.includes("employees") || href.includes("workforce"))
    return "employees";
  if (href.includes("workflows") || href.includes("approvals"))
    return "workflows";
  if (href.includes("analytics")) return "analytics";
  if (href.includes("timeline")) return "business-timeline";
  if (href.includes("objects")) return "universal-objects";
  if (href.includes("growth")) return "growth";
  if (href.includes("home") || href.includes("dashboard"))
    return "executive-home";
  if (href.includes("settings") || href.includes("admin")) return "settings";
  if (href.includes("tasks")) return "tasks";
  if (href.includes("calendar") || href.includes("meetings")) return "meetings";
  return "navigation";
}
