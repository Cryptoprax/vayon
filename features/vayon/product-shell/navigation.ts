import {
  Activity,
  BarChart3,
  Bot,
  Brain,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleDollarSign,
  Code2,
  ContactRound,
  FileCode2,
  FileText,
  Palette,
  Gauge,
  Handshake,
  Home,
  Inbox,
  Landmark,
  LibraryBig,
  Megaphone,
  MessageCircleMore,
  Network,
  RadioTower,
  ShieldCheck,
  Settings,
  Sparkles,
  SquareKanban,
  Target,
  Users,
  UsersRound,
  Workflow,
} from "lucide-react";
import type { ShellNavigationGroup } from "./types";

export const shellNavigation: readonly ShellNavigationGroup[] = [
  {
    id: "home",
    label: "Home",
    icon: Home,
    items: [
      {
        label: "Creative Studio",
        href: "/vayon/creative",
        icon: Palette,
        description: "Creative operating system",
      },
      {
        label: "Creative Cloud",
        href: "/vayon/creative/cloud",
        icon: Sparkles,
        description: "Creative operating model",
      },
      {
        label: "Creative Pipelines",
        href: "/vayon/creative/pipelines",
        icon: Workflow,
        description: "Production orchestration",
      },
      {
        label: "Customer Success",
        href: "/vayon/customer-success",
        icon: Sparkles,
        description: "Onboarding and adoption",
      },
      { label: "Dashboard", href: "/vayon/dashboard", icon: Gauge },
      { label: "Executive Home", href: "/vayon/home", icon: Home },
      { label: "Analytics", href: "/vayon/analytics", icon: BarChart3 },
    ],
  },
  {
    id: "crm",
    label: "CRM",
    icon: Building2,
    items: [
      { label: "Properties", href: "/vayon/properties", icon: Building2 },
      { label: "Leads", href: "/vayon/leads", icon: Target },
      { label: "Deals", href: "/vayon/deals", icon: Handshake },
      {
        label: "Contacts",
        href: "/vayon/crm/contacts",
        icon: ContactRound,
        description: "Customer directory",
      },
      {
        label: "Companies",
        href: "/vayon/crm/companies",
        icon: Landmark,
        description: "Account directory",
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: CalendarDays,
    items: [
      { label: "Calendar", href: "/vayon/calendar", icon: CalendarDays },
      { label: "Tasks", href: "/vayon/tasks", icon: SquareKanban },
      { label: "Timeline", href: "/vayon/timeline", icon: Activity },
      { label: "Workflows", href: "/vayon/workflows", icon: Workflow },
      { label: "Approvals", href: "/vayon/approvals", icon: ShieldCheck },
    ],
  },
  {
    id: "growth",
    label: "Marketing",
    icon: Megaphone,
    items: [
      {
        label: "Marketing Studio",
        href: "/vayon/creative-studio",
        icon: Megaphone,
        description: "Campaign creation",
      },
      {
        label: "Growth Studio",
        href: "/vayon/creative-studio/growth",
        icon: BriefcaseBusiness,
        description: "Campaign packs",
      },
    ],
  },
  {
    id: "communications",
    label: "Communications",
    icon: MessageCircleMore,
    items: [
      { label: "Inbox", href: "/vayon/communications", icon: Inbox },
      { label: "Meetings", href: "/vayon/meetings", icon: Users },
    ],
  },
  {
    id: "ai",
    label: "AI",
    icon: Sparkles,
    items: [
      { label: "Workforce", href: "/vayon/workforce", icon: Bot },
      { label: "AI Employees", href: "/vayon/ai/employees", icon: Users },
      {
        label: "VAYON Intelligence",
        href: "/vayon/intelligence",
        icon: Sparkles,
        description: "Success copilot",
      },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    icon: Settings,
    items: [
      { label: "Team", href: "/vayon/team", icon: UsersRound },
      { label: "Administration", href: "/vayon/admin", icon: ShieldCheck },
      { label: "Knowledge", href: "/vayon/knowledge", icon: LibraryBig },
      {
        label: "Product Intelligence",
        href: "/vayon/settings/product-intelligence",
        icon: BarChart3,
      },
      { label: "Settings", href: "/vayon/settings/appearance", icon: Settings },
      {
        label: "Integrations",
        href: "/vayon/settings/integrations",
        icon: Network,
      },
      {
        label: "Billing",
        href: "/vayon/settings/billing",
        icon: CircleDollarSign,
      },
    ],
  },
  {
    id: "developer",
    label: "Developer",
    icon: Code2,
    developer: true,
    items: [
      { label: "Brain", href: "/vayon/brain", icon: Brain },
      { label: "Runtime", href: "/vayon/runtime", icon: RadioTower },
      { label: "Cognitive", href: "/vayon/cognitive", icon: Workflow },
      { label: "Context", href: "/vayon/context", icon: Network },
      { label: "Architecture", href: "/vayon/objects", icon: FileCode2 },
      { label: "Documents", href: "/vayon/storage", icon: FileText },
      { label: "System", href: "/vayon/system", icon: Gauge },
    ],
  },
];

export const breadcrumbGroups = new Map(
  shellNavigation.flatMap((group) =>
    group.items
      .filter((item) => item.href)
      .map((item) => [item.href!, group.label]),
  ),
);
