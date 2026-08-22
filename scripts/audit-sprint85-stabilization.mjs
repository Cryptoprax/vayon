import { existsSync, readFileSync } from "node:fs";

const category = process.argv[2] ?? "all";
const read = (path) => readFileSync(path, "utf8");
const failures = [];
const requireFile = (path, area) => { if (!existsSync(path)) failures.push(`${area}: missing ${path}`); };
const requireMatch = (path, pattern, area) => { requireFile(path, area); if (existsSync(path) && !pattern.test(read(path))) failures.push(`${area}: ${path} lacks ${pattern}`); };
const run = (area, checks) => { if (category === "all" || category === area) checks(); };

run("security", () => {
  requireMatch("proxy.ts", /api\/webhooks/, "security");
  requireMatch("next.config.ts", /Content-Security-Policy-Report-Only/, "security");
  requireMatch("features/marketing/providers/supabase-marketing.provider.ts", /timeoutMs|Promise\.race/, "security");
  requireMatch("supabase/migrations/20260916000000_sprint84_2_public_contact_reliability.sql", /enable row level security/i, "security");
});
run("performance", () => {
  requireMatch("features/marketing/providers/supabase-marketing.provider.ts", /timeoutMs|attempts = 3/, "performance");
  requireMatch("next.config.ts", /poweredByHeader: false|async headers/, "performance");
  requireFile("app/loading.tsx", "performance");
});
run("accessibility", () => {
  requireMatch("app/not-found.tsx", /<h1|Return home/, "accessibility");
  requireMatch("app/global-error.tsx", /role="alert"|Retry/, "accessibility");
  requireMatch("app/globals.css", /prefers-reduced-motion|focus-visible/, "accessibility");
});
run("seo", () => {
  requireMatch("app/layout.tsx", /metadataBase|openGraph|twitter/, "seo");
  requireMatch("app/sitemap.ts", /publicSiteUrl|cookie-policy|refund-policy|support-policy/, "seo");
  requireMatch("app/robots.ts", /publicSiteUrl|disallow/, "seo");
  requireFile("app/not-found.tsx", "seo");
});
run("journey", () => {
  for (const path of ["app/page.tsx", "app/(marketing)/contact/page.tsx", "app/signup/page.tsx", "app/login/page.tsx", "app/vayon/settings/organization/page.tsx", "app/vayon/properties/projects/page.tsx", "app/vayon/properties/inventory/page.tsx", "app/vayon/crm/page.tsx", "app/vayon/property-matching/page.tsx", "app/vayon/site-visits/page.tsx", "app/vayon/communications/page.tsx", "app/vayon/creative-studio/page.tsx", "app/vayon/creative-studio/growth/page.tsx", "app/vayon/settings/billing/page.tsx", "app/vayon/analytics/page.tsx"]) requireFile(path, "journey");
});
run("legal", () => { for (const path of ["app/(marketing)/privacy/page.tsx", "app/(marketing)/terms/page.tsx", "app/(marketing)/cookie-policy/page.tsx", "app/(marketing)/refund-policy/page.tsx", "app/(marketing)/support-policy/page.tsx"]) requireFile(path, "legal"); });

if (failures.length) { failures.forEach(item => console.error(item)); process.exitCode = 1; }
else console.log(`Sprint 85 ${category} audit passed.`);
