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
  { source: "/vayon/creative-studio/packs", destination: "/vayon/creative/campaigns", permanent: true },
] as const;

// These destinations expose early-access screens or an unrelated campaign form.
// Keep direct diagnostic routes intact, but never advertise them as customer tools.
export const hiddenCustomerRoutes = [
  "/vayon/creative/cloud", "/vayon/creative/pipelines", "/vayon/creative/runtime",
  "/vayon/creative/landing-pages",
] as const;

export function canonicalCustomerHref(href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const [pathname] = href.split(/[?#]/);
  const target = canonicalRouteRedirects.find(item => item.source === pathname)?.destination;
  return target ? target + href.slice(pathname.length) : href;
}

export function isCustomerRouteExposed(href: string): boolean {
  const path = href.split(/[?#]/)[0];
  return !hiddenCustomerRoutes.some(route => path === route || path.startsWith(route + "/"));
}

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
