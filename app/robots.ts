import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/public-url";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/vayon/", "/platform/", "/api/"],
    },
    sitemap: `${publicSiteUrl}/sitemap.xml`,
    host: publicSiteUrl,
  };
}
