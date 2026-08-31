import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { refreshSession } from "@/lib/supabase/proxy";

const API_PATH_PREFIX = "/api/";
const WEBHOOK_PATH_PREFIX = "/api/webhooks/";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/vayon/home") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/vayon/dashboard";
    return NextResponse.redirect(destination, 307);
  }

  if (path === "/api/webhooks" || path.startsWith(WEBHOOK_PATH_PREFIX)) {
    return NextResponse.next();
  }

  if (path === "/api" || path.startsWith(API_PATH_PREFIX)) {
    return NextResponse.next();
  }

  return refreshSession(request);
}

export const config = {
  matcher: [
    "/((?!api(?:/|$)|api/webhooks(?:/|$)|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
