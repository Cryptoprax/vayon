export const canonicalRouteRedirects = [
  { source: "/vayon/workforce", destination: "/vayon/ai/workforce", permanent: true },
  { source: "/vayon/ai/employees", destination: "/vayon/ai/workforce", permanent: true },
  { source: "/vayon/crm/leads", destination: "/vayon/leads", permanent: true },
  { source: "/vayon/notifications/inbox", destination: "/vayon/notifications", permanent: true },
  { source: "/vayon/creative-studio", destination: "/vayon/creative", permanent: true },
  { source: "/vayon/creative-studio/assets", destination: "/vayon/creative/assets", permanent: true },
  { source: "/vayon/creative-studio/templates", destination: "/vayon/creative/templates", permanent: true },
  { source: "/vayon/creative-studio/calendar", destination: "/vayon/creative/calendar", permanent: true },
  { source: "/vayon/creative-studio/wizard", destination: "/vayon/creative/campaigns", permanent: true },
] as const;

export const canonicalProductRoutes = {
  dashboard: "/vayon/dashboard",
  leads: "/vayon/leads",
  properties: "/vayon/properties",
  deals: "/vayon/deals",
  tasks: "/vayon/tasks",
  calendar: "/vayon/calendar",
  campaigns: "/vayon/creative/campaigns",
  creative: "/vayon/creative",
  workforce: "/vayon/ai/workforce",
  workQueue: "/vayon/ai/work-queue",
  approvals: "/vayon/approvals",
  notifications: "/vayon/notifications",
  customerSuccess: "/vayon/customer-success",
} as const;
