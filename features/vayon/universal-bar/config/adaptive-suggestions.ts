import type { AdaptiveSuggestion } from "../domain/contracts";
export const defaultAdaptiveSuggestions: readonly AdaptiveSuggestion[] = [
  {
    id: "search-properties",
    label: "Search properties",
    hint: "Find governed property records",
    query: "search properties",
  },
  {
    id: "create-lead",
    label: "Create a lead",
    hint: "Open lead capture",
    href: "/vayon/leads/new",
  },
  {
    id: "executive-home",
    label: "Open Executive Home",
    hint: "Review executive context",
    href: "/vayon/home",
  },
  {
    id: "find-documents",
    label: "Find documents",
    hint: "Search document context",
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
    hint: "Review canonical activity",
    href: "/vayon/timeline",
  },
  {
    id: "open-growth",
    label: "Open Growth Hub",
    hint: "Review growth workspace",
    href: "/vayon/growth",
  },
  {
    id: "morning-brief",
    label: "Generate Morning Brief",
    hint: "Ask Copilot for an evidence-safe executive brief",
    query: "Morning Brief",
  },
  {
    id: "open-founder-dashboard",
    label: "Open Founder Dashboard",
    hint: "Review cross-workspace executive evidence",
    href: "/platform/founder",
  },
];
