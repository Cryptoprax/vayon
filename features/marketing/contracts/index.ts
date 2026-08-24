export type PublicPageId = "features" | "solutions" | "industries" | "privacy" | "terms" | "trust-center";
export interface PublicPage { slug: PublicPageId; eyebrow: string; title: string; description: string; sections: readonly { title: string; description: string }[] }
export interface BlogArticle { slug: string; title: string; excerpt: string; category: string; author: string; tags: readonly string[]; publishedAt: string; body: readonly string[] }
export type MarketingEventType = "page_view" | "cta_click" | "demo_request" | "trial_signup" | "contact_sales" | "newsletter" | "enterprise_inquiry" | "waitlist" | "demo_launch" | "roi_calculation" | "industry_view" | "comparison_view" | "marketing_conversion" | "web_vital" | "tracking_failure";
export interface MarketingEvent { type: MarketingEventType; path: string; sessionId: string; metadata?: Record<string, string> }
export type LeadCaptureKind = "demo" | "trial" | "sales" | "newsletter" | "enterprise" | "waitlist";
export interface MarketingProvider { record(event: MarketingEvent): Promise<void>; captureLead(input: { kind: LeadCaptureKind; name?: string; email: string; company?: string; message?: string; plan?: string }): Promise<string> }
