import { Activity, BarChart3, Bot, Building2, CalendarDays, ContactRound, FileSearch, Gauge, Handshake, Landmark, LineChart, Megaphone, Network, Palette, Settings, Share2, ShieldCheck, Sparkles, SquareKanban, Target, Users, Workflow } from "lucide-react";
import type { ShellNavigationGroup } from "./types";

// One navigation catalog: six customer jobs, with contextual destinations.
export const shellNavigation: readonly ShellNavigationGroup[] = [
  { id: "home", label: "Today's work", icon: Gauge, items: [
    { label: "Dashboard", href: "/vayon/dashboard", icon: Gauge },
  ] },
  { id: "crm", label: "Sell & follow up", icon: Building2, items: [
    { label: "Properties", href: "/vayon/properties", icon: Building2 },
    { label: "Leads", href: "/vayon/leads", icon: Target },
    { label: "Clients", href: "/vayon/crm/contacts", icon: ContactRound },
    { label: "Companies", href: "/vayon/crm/companies", icon: Landmark },
    { label: "Deals", href: "/vayon/deals", icon: Handshake },
    { label: "Inbox", href: "/vayon/notifications", icon: Activity },
    { label: "Schedule Viewing", href: "/vayon/site-visits", icon: CalendarDays },
    { label: "Calendar", href: "/vayon/calendar", icon: CalendarDays },
    { label: "Tasks", href: "/vayon/tasks", icon: SquareKanban },
    { label: "Timeline", href: "/vayon/timeline", icon: Activity },
    { label: "Communications", href: "/vayon/communications", icon: ContactRound },
  ] },
  { id: "marketing", label: "Market properties", icon: Megaphone, items: [
    { label: "Campaigns", href: "/vayon/creative/campaigns", icon: Megaphone },
    { label: "Create marketing assets", href: "/vayon/creative", icon: Palette },
    { label: "Brand assets", href: "/vayon/creative/brand", icon: Palette },
    { label: "Image", href: "/vayon/creative/images", icon: Palette },
    { label: "Video", href: "/vayon/creative/videos", icon: Palette },
    { label: "Document", href: "/vayon/creative/documents", icon: FileSearch },
    { label: "Marketing assets", href: "/vayon/creative/assets", icon: Building2 },
    { label: "Templates", href: "/vayon/creative/templates", icon: FileSearch },
    { label: "Publishing calendar", href: "/vayon/creative/calendar", icon: CalendarDays },
    { label: "Marketing Performance", href: "/vayon/growth", icon: Gauge },
    { label: "Lead Generation", href: "/vayon/growth/lead-generation", icon: Megaphone },
    { label: "Buyer Intelligence", href: "/vayon/growth/buyer-intelligence", icon: Users },
    { label: "Seller Intelligence", href: "/vayon/growth/seller-intelligence", icon: ContactRound },
    { label: "Property SEO", href: "/vayon/growth/property-seo", icon: FileSearch },
    { label: "Referral Network", href: "/vayon/growth/referral-network", icon: Handshake },
    { label: "Market Intelligence", href: "/vayon/growth/market-intelligence", icon: LineChart },
  ] },
  { id: "ai", label: "AI Assistant", icon: Sparkles, items: [
    { label: "AI Assistant", href: "/vayon/intelligence", icon: Sparkles },
    { label: "My AI Team", href: "/vayon/ai/workforce", icon: Users },
    { label: "Today's AI Tasks", href: "/vayon/ai/work-queue", icon: SquareKanban },
    { label: "Suggestions", href: "/vayon/ai/collaboration", icon: Sparkles },
    { label: "Automations", href: "/vayon/ai/automations", icon: Workflow },
    { label: "Approvals", href: "/vayon/approvals", icon: ShieldCheck },
    { label: "AI Goals", href: "/vayon/ai/goals", icon: Target },
    { label: "History", href: "/vayon/ai/history", icon: Activity },
    { label: "Workflow templates", href: "/vayon/workflows", icon: Workflow },
  ] },
  { id: "reports", label: "Understand performance", icon: BarChart3, items: [
    { label: "Analytics", href: "/vayon/analytics", icon: BarChart3 },
    { label: "Performance", href: "/vayon/analytics/sales", icon: LineChart },
    { label: "Revenue & Forecasting", href: "/vayon/analytics/executive", icon: Landmark },
    { label: "Listing Performance", href: "/vayon/growth/listing-performance", icon: Building2 },
    { label: "Marketing Analytics", href: "/vayon/growth/marketing-analytics", icon: BarChart3 },
    { label: "Advertising Performance", href: "/vayon/growth/advertising-performance", icon: Megaphone },
    { label: "Social Performance", href: "/vayon/growth/social-performance", icon: Share2 },
    { label: "Reports", href: "/vayon/growth/reports", icon: BarChart3 },
  ] },
  { id: "platform", label: "Configure workspace", icon: Settings, items: [
    { label: "Workspace", href: "/vayon/settings/organization", icon: Building2 },
    { label: "Team Members", href: "/vayon/settings/members", icon: Users },
    { label: "Integrations", href: "/vayon/settings/integrations", icon: Network },
    { label: "Billing", href: "/vayon/settings/billing", icon: Landmark },
    { label: "Preferences", href: "/vayon/settings/appearance", icon: Settings },
    { label: "Workflow Designer", href: "/platform/founder/workflows", icon: Workflow },
    { label: "Platform Analytics", href: "/platform/system-analytics", icon: BarChart3 },
    { label: "Investor Relations", href: "/vayon/growth/investor-relations", icon: Landmark },
    { label: "Platform Marketing", href: "/platform/founder/marketing", icon: Megaphone },
    { label: "Product Intelligence", href: "/vayon/settings/product-intelligence", icon: BarChart3 },
    { label: "AI Playground", href: "/vayon/ai/playground", icon: Bot },
    { label: "Feature Flags", href: "/platform/feature-flags", icon: ShieldCheck },
    { label: "Enterprise Management", href: "/platform/organizations", icon: Building2 },
    { label: "Platform Settings", href: "/platform/settings", icon: Settings },
    { label: "Founder Approval Center", href: "/vayon/founder/approvals", icon: ShieldCheck },
    { label: "Customer Success", href: "/vayon/customer-success", icon: Users },
    { label: "Knowledge Engine", href: "/vayon/knowledge", icon: Sparkles },
    { label: "Administration", href: "/vayon/admin", icon: ShieldCheck },
    { label: "System Diagnostics", href: "/vayon/system", icon: Gauge },
  ] },
];

export const breadcrumbGroups = new Map(shellNavigation.flatMap(group => group.items.filter(item => item.href).map(item => [item.href!, group.label])));

export function navigationGroupForPath(path: string, groups = shellNavigation) {
  const match = groups.flatMap(group => group.items.map(item => ({ group: group.id, href: item.href })))
    .filter(item => item.href && (path === item.href || path.startsWith(item.href + "/")))
    .sort((a,b) => b.href!.length - a.href!.length)[0];
  if (match) return match.group;
  const fallback = /^\/vayon\/(ai|intelligence|workforce|workflows|approvals)(\/|$)/.test(path) ? "ai"
    : /^\/vayon\/(creative|creative-studio|growth)(\/|$)/.test(path) ? "marketing"
    : /^\/vayon\/analytics(\/|$)/.test(path) ? "reports"
    : /^\/platform(\/|$)|^\/vayon\/(settings|system|admin|knowledge|founder)(\/|$)/.test(path) ? "platform"
    : path === "/vayon/dashboard" ? "home" : "crm";
  return groups.some(group => group.id === fallback) ? fallback : undefined;
}
