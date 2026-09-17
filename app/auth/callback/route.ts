import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { safeAuthenticatedPath, trustedApplicationOrigin } from "@/features/authentication/security/oauth";

// Never pass through arbitrary provider strings, even if they resemble error codes.
const errorCodes = new Set([
  "bad_code_verifier", "flow_state_not_found", "flow_state_expired",
  "validation_failed", "invalid_credentials", "email_not_confirmed",
  "otp_expired", "request_timeout", "over_request_rate_limit", "unexpected_failure",
]);
const errorNames = new Set([
  "AuthApiError", "AuthUnknownError", "AuthPKCEGrantCodeExchangeError",
  "AuthPKCECodeVerifierMissingError", "AuthRetryableFetchError",
  "AuthInvalidTokenResponseError", "AuthSessionMissingError",
]);

function safeError(error: unknown) {
  const value = error && typeof error === "object" ? error as Record<string, unknown> : {};
  return {
    errorCode: typeof value.code === "string" && errorCodes.has(value.code) ? value.code : "other",
    errorName: typeof value.name === "string" && errorNames.has(value.name) ? value.name : "other",
    ...(typeof value.status === "number" && Number.isInteger(value.status) && value.status >= 100 && value.status <= 599
      ? { status: value.status } : {}),
  };
}

async function verifierPresence() {
  try {
    // Installed supabase-js default; server.ts does not override storageKey.
    // This callback exchanges without flowId, so it reads the fixed verifier key.
    // SSR can chunk it. Presence does not prove a valid or complete verifier.
    const key = `sb-${new URL(getSupabaseConfig().url).hostname.split(".")[0]}-auth-token-code-verifier`;
    const store = await cookies();
    return { hasVerifierCookie: store.has(key) || store.has(`${key}.0`) };
  } catch {
    // Omit the field when unavailable; diagnostics must not interrupt auth.
    return {};
  }
}

function destinationCategory(path: string) {
  const pathname = new URL(path, "https://vayon.invalid").pathname;
  if (pathname === "/vayon") return "app_entry";
  if (pathname === "/vayon/dashboard") return "dashboard";
  if (pathname === "/reset-password") return "password_recovery";
  return "other_internal";
}

export async function GET(request: Request) {
  const url = new URL(request.url), origin = trustedApplicationOrigin(url.origin);
  const code = url.searchParams.get("code"), next = url.searchParams.get("next");
  const destination = safeAuthenticatedPath(next);
  const metadata = {
    requestId: randomUUID(),
    // Arbitrary host/path input could contain secrets; emit only known hosts.
    hostname: ["www.vayon.online", "vayon.online", "localhost", "127.0.0.1"].includes(url.hostname) ? url.hostname : "other",
    pathname: "/auth/callback",
    hasCode: url.searchParams.has("code"),
    hasNext: url.searchParams.has("next"),
    ...await verifierPresence(),
  };
  const log = (details: Record<string, string | number | boolean>) => {
    try { console.info("auth_callback", { ...metadata, ...details }); } catch { /* Logging must not change auth behavior. */ }
  };
  log({ stage: "received" });
  const providerError = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  if (providerError) {
    log({ redirectCategory: "provider_error" });
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Google authentication was cancelled or denied.")}`, origin));
  }
  if (!code) {
    log({ redirectCategory: "missing_code" });
    return NextResponse.redirect(new URL("/login?error=Missing%20authentication%20code.", origin));
  }
  const client = await createSupabaseServerClient();
  const exchangeFailure = (error: unknown) => {
    log({ exchangeResult: "failure", ...safeError(error), redirectCategory: "exchange_failed" });
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("We couldn't complete sign-in from this link. If you've already confirmed your email, sign in with your password.")}`, origin));
  };
  try {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) return exchangeFailure(error);
  } catch (error) {
    return exchangeFailure(error);
  }
  log({ exchangeResult: "success" });
  const { data: { user }, error: userError } = await client.auth.getUser();
  log({ getUserSucceeded: !userError && !!user });
  if (!user) {
    log({ redirectCategory: "session_missing" });
    return NextResponse.redirect(new URL("/login?error=Unable%20to%20establish%20a%20secure%20session.", origin));
  }
  const verificationType = url.searchParams.get("type");
  await client.rpc("record_identity_audit", {
    p_event_type: verificationType === "email_change" ? "email.changed" : user.email_confirmed_at ? "email.verified" : "login",
    p_metadata: { provider: user.app_metadata?.provider ?? "email" },
  });
  log({ redirectCategory: destinationCategory(destination) });
  return NextResponse.redirect(new URL(destination, origin));
}
