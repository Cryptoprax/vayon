import type { AdaptiveSuggestion } from "../domain/contracts";
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
