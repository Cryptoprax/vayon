import { NextRequest, NextResponse } from "next/server";
import { captureException } from "@/lib/observability/logger";
import { MetaMarketingService } from "@/features/platform/integrations/meta-marketing/services/meta-marketing.service";
import { MetaConnectError } from "@/features/platform/integrations/meta-marketing/services/meta-marketing.service";
import { OAuthStateError } from "@/features/platform/integrations/meta-marketing/services/meta-oauth-state.service";

const destination = "/vayon/settings/integrations/meta-marketing";

/**
 * OAuth callback: exchanges the authorization code and parks the encrypted
 * long-lived token under the state value (see MetaMarketingService.handleCallback),
 * then redirects to the settings page carrying only the opaque, single-use
 * state token -- never the code, never any token. The settings page uses
 * that state to render the "select a Page" step. Org/workspace/user are
 * re-derived from the current session and cross-checked against the state
 * row's own stored values -- a query-param organizationId/workspaceId would
 * never be read here even if supplied, because none is ever read.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (!state) {
    return NextResponse.redirect(new URL(`${destination}?error=${encodeURIComponent("Invalid or expired Meta authorization request.")}`, request.url));
  }

  try {
    const service = await MetaMarketingService.production();
    await service.handleCallback({ code, state, error: oauthError });
    return NextResponse.redirect(new URL(`${destination}?state=${encodeURIComponent(state)}`, request.url));
  } catch (error) {
    captureException(error, { operation: "meta_marketing_oauth_callback" });
    const message =
      error instanceof OAuthStateError
        ? "Your Meta connection request expired or was already used. Please try again."
        : error instanceof MetaConnectError && error.code === "OAUTH_DENIED"
          ? "Meta authorization was not completed."
          : "Meta connection failed.";
    return NextResponse.redirect(new URL(`${destination}?error=${encodeURIComponent(message)}`, request.url));
  }
}
