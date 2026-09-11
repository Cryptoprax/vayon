import type { AdaptiveSuggestion, UniversalBarResult, UniversalHistoryItem } from "../domain/contracts";
export const defaultAdaptiveSuggestions: readonly AdaptiveSuggestion[] = [
  {
    id: "search-properties",
    label: "Search properties",
    hint: "Find a property to update or sell",
    query: "search properties",
  },
  {
    id: "create-lead",
    label: "Create a lead",
    hint: "Record a buyer or seller",
    href: "/vayon/leads/new",
  },
  {
    id: "executive-home",
    label: "Plan today's work",
    hint: "Choose your next follow-up",
    href: "/vayon/dashboard",
  },
  {
    id: "find-documents",
    label: "Find documents",
    hint: "Find the document you need",
    query: "find documents",
  },
  {
    id: "schedule-meeting",
    label: "Schedule meeting",
    hint: "Open meeting workflow",
    href: "/vayon/meetings",
  },
  {
    id: "open-timeline",
    label: "Open Timeline",
    hint: "Review recent conversations and updates",
    href: "/vayon/timeline",
  },
  {
    id: "open-growth",
    label: "Review Marketing Performance",
    hint: "See where your marketing needs attention",
    href: "/vayon/growth",
  },
  {
    id: "morning-brief",
    label: "Generate Morning Brief",
    hint: "Review priorities for today",
    query: "Morning Brief",
  },
  {
    id: "open-founder-dashboard",
    label: "Open Founder Dashboard",
    hint: "Review business performance",
    href: "/platform/founder",
  },
];

/** Match the current business workspace without changing destinations or permissions. */
export function sameSearchWorkspace(href: string, path: string) {
  const parts = path.split("?")[0].split("/").filter(Boolean);
  const base = "/" + parts.slice(0, parts[1] === "crm" ? 3 : 2).join("/");
  const target = href.split("?")[0];
  return target === base || target.startsWith(base + "/");
}

export function prioritizeWorkspaceResults(results: readonly UniversalBarResult[], path: string, history: readonly UniversalHistoryItem[], now=Date.now()) {
  const usage=new Map(history.filter(item=>item.kind==="recently-opened").map(item=>[item.id,item]));
  const recent=(id:string)=>{const time=Date.parse(usage.get(id)?.recordedAt??"");return Number.isFinite(time)&&now-time>=0&&now-time<=7*86400000?time:0;};
  return [...results].sort((a,b)=>Number(sameSearchWorkspace(b.href,path))-Number(sameSearchWorkspace(a.href,path)) || recent(b.id)-recent(a.id) || (usage.get(b.id)?.visits??0)-(usage.get(a.id)?.visits??0));
}
