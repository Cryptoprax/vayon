import type { MetadataRoute } from "next";
import { DocumentationService } from "@/features/platform/knowledge/services/documentation.service";
import { MarketingAssetsService } from "@/features/marketing/services/marketing-assets.service";
import { publicSiteUrl } from "@/lib/public-url";
import {
  industryCatalog,
  productCatalog,
  solutionCatalog,
} from "@/features/marketing/content/commercial-catalog";
const routes = [
  "",
  "/product",
  "/features",
  "/solutions",
  "/ai-workforce",
  "/crm",
  "/properties",
  "/deals",
  "/communications",
  "/calendar",
  "/workflows",
  "/integrations",
  "/security",
  "/enterprise",
  "/pricing",
  "/customers",
  "/resources",
  "/blog",
  "/docs",
  "/developers",
  "/about",
  "/careers",
  "/contact",
  "/privacy",
  "/terms",
  "/cookie-policy",
  "/refund-policy",
  "/support-policy",
  "/acceptable-use-policy",
  "/ai-usage-policy",
  "/data-processing-addendum",
  "/subprocessors",
  "/copyright-policy",
  "/trademark-policy",
  "/trust-center",
  "/status",
  "/release-notes",
  "/help",
  "/search",
  "/api",
  "/press-kit",
  "/brand-assets",
  "/media-kit",
  "/partners",
  "/cookie-policy",
  "/refund-policy",
  "/support-policy",
  "/demo",
  "/compare",
  "/roi-calculator",
  "/sales-assets",
  "/investors",
] as const;
export default function sitemap(): MetadataRoute.Sitemap {
  const documentation = new DocumentationService()
    .all()
    .map((article) => `/docs/${article.slug}`);
  const assets = new MarketingAssetsService().catalog(),
    marketing = [
      ...solutionCatalog.map((x) => `/solutions/${x.slug}`),
      ...industryCatalog.map((x) => `/industries/${x.slug}`),
      ...productCatalog.map((x) => `/features/${x.slug}`),
      ...assets.comparisons.map((x) => `/compare/${x.slug}`),
      ...assets.assets.map((x) => `/sales-assets/${x.slug}`),
      ...assets.stories.map((x) => `/customers/${x.slug}`),
    ];
  return [...routes, ...documentation, ...marketing].map((path) => ({
    url: `${publicSiteUrl}${path}`,
    changeFrequency: path === "/blog" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/product" ? 0.9 : 0.7,
  }));
}
