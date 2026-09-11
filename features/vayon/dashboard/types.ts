export type DashboardIcon =
  | "leads"
  | "deals"
  | "pipeline"
  | "properties"
  | "meetings"
  | "tasks"
  | "ai"
  | "revenue";
export interface KpiMetric {
  key: string;
  label: string;
  value: number;
  displayValue: string;
  detail?: string;
  trend: number;
  sparkline: number[];
  icon: DashboardIcon;
  href: string;
}
export interface PipelineColumn {
  id: string;
  label: string;
  count: number;
  value: number;
  trend: number;
  href: string;
}
export interface ChartPoint {
  label: string;
  revenue: number;
  pipeline: number;
  leads: number;
  conversion: number;
  sales: number;
}
export interface DashboardActivity {
  id: string;
  eventType: string;
  title: string;
  description?: string;
  occurredAt: string;
  workspace: string;
  href: string;
}
export interface CalendarItem {
  id: string;
  kind: "meeting" | "visit" | "call" | "task";
  title: string;
  startsAt: string;
  meta: string;
  href: string;
}
export interface AiMetrics {
  conversations: number;
  appointments: number;
  followUps: number;
  recommendations: number;
  emails: number;
  whatsapp: number;
}
export interface AiWorkforceMember {
  id: string;
  name: string;
  role: string;
  status: "online" | "ready" | "offline";
  tasksCompleted: number;
  efficiency?: number;
}
export interface WhatsAppConversation {
  id: string;
  customer: string;
  message: string;
  occurredAt: string;
  unread: boolean;
}
export interface DashboardNotification {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  createdAt: string;
  href: string;
}
export interface UsageNotice {
  label: string;
  value: number;
  limit?: number;
  href: string;
}
export interface ExecutiveDashboardData {
  workspaceMemberCount?: number;
  organizationName: string;
  workspaceName: string;
  currency: string;
  kpis: KpiMetric[];
  pipeline: PipelineColumn[];
  charts: ChartPoint[];
  activities: DashboardActivity[];
  calendar: CalendarItem[];
  ai: AiMetrics;
  aiWorkforce: AiWorkforceMember[];
  whatsappConversations: WhatsAppConversation[];
  notifications: DashboardNotification[];
  usage: UsageNotice[];
  isEmpty: boolean;
}
