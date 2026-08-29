import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./config";
import { canViewPath, isFounderOnlyPath, normalizeIndustry, normalizeVisibilityRole } from "@/features/platform/visibility/policy";
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/demo",
  "/product",
  "/ai-workforce",
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
  "/about",
  "/careers",
  "/contact",
  "/features",
  "/solutions",
  "/industries",
  "/trust-center",
  "/status",
  "/help",
  "/developers",
  "/roi-calculator",
  "/media-kit",
  "/partners",
  "/investors",
  "/privacy",
  "/terms",
  "/refund-policy",
  "/cookie-policy",
  "/support-policy",
  "/acceptable-use-policy",
  "/ai-usage-policy",
  "/data-processing-addendum",
  "/search",
] as const;

const PUBLIC_ROUTE_PREFIXES = [
  "/auth",
  "/features",
  "/solutions",
  "/industries",
  "/customers",
  "/blog",
  "/docs",
] as const;

export function isPublicWebsiteRoute(path: string) {
  return (
    PUBLIC_ROUTES.includes(path as (typeof PUBLIC_ROUTES)[number]) ||
    PUBLIC_ROUTE_PREFIXES.some((route) => path.startsWith(`${route}/`))
  );
}

export async function refreshSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/api/webhooks" || path.startsWith("/api/webhooks/")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseConfig();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isPublic = isPublicWebsiteRoute(path);
  if (!user && !isPublic) {
    const target = request.nextUrl.clone();
    target.pathname = "/login";
    target.searchParams.set("next", path);
    return NextResponse.redirect(target);
  }
  if (user && (path === "/login" || path === "/signup")) {
    const target = request.nextUrl.clone();
    target.pathname = "/vayon";
    target.search = "";
    return NextResponse.redirect(target);
  }
  if (user && isFounderOnlyPath(path) && !["founder", "super_admin"].includes(String(user.app_metadata?.role ?? ""))) {
    const target = request.nextUrl.clone();
    target.pathname = "/_not-found";
    target.search = "";
    return NextResponse.rewrite(target, { status: 404 });
  }
  if (user && path.startsWith("/vayon")) {
    const { data: membership } = await supabase.from("workspace_members").select("workspace_id,roles(code)").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
    const workspaceId = membership?.workspace_id;
    const { data: workspaceIndustry } = workspaceId
      ? await supabase.from("workspace_industry").select("industry").eq("workspace_id", workspaceId).maybeSingle()
      : { data: null };
    const workspaceRole = (membership as unknown as { roles?: { code?: string } | null } | null)?.roles?.code;
    const role = normalizeVisibilityRole(user.app_metadata?.role, workspaceRole);
    const visibility = { role, founder: role === "Founder" || role === "Super Admin", industry: normalizeIndustry(workspaceIndustry?.industry) } as const;
    if (!canViewPath(visibility, path)) {
      const target = request.nextUrl.clone();
      target.pathname = "/_not-found";
      target.search = "";
      return NextResponse.rewrite(target, { status: 404 });
    }
  }
  if (isPublic) return response;

  return response;
}
