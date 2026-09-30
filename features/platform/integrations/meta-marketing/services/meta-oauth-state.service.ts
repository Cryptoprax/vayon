import "server-only";
import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EncryptedToken } from "@/features/platform/integrations/google/services/token-crypto.service";
import { oauthStateTtlSeconds } from "../domain/types";

export class OAuthStateError extends Error {
  constructor(readonly code: "STATE_INVALID_OR_EXPIRED" | "STATE_TENANT_MISMATCH" | "STATE_NOT_READY") {
    super(code);
    this.name = "OAuthStateError";
  }
}

export interface OAuthStateTenant {
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly userId: string;
}

function assertOwnership(row: Record<string, unknown>, current: OAuthStateTenant) {
  if (row.organization_id !== current.organizationId || row.workspace_id !== current.workspaceId || row.created_by !== current.userId) {
    throw new OAuthStateError("STATE_TENANT_MISMATCH");
  }
}

/**
 * DB-backed, single-use OAuth CSRF state (Part 2). Binding org/workspace/user
 * at creation time and re-checking them on every later read/write means
 * nothing in this flow ever trusts a workspace merely because the caller's
 * current session happens to be authenticated -- it must match the exact
 * tenant that started the flow. The final claim (state=$1 AND consumed_at IS
 * NULL AND expires_at > now()) is a single atomic SQL UPDATE, so a replayed
 * or concurrently-raced state can be claimed by at most one caller -- the
 * same atomic-claim shape already proven by K2's extraction claim and E5's
 * send claim.
 */
export class MetaOAuthStateService {
  constructor(private client: SupabaseClient) {}

  async create(tenant: OAuthStateTenant, returnPath: string | null): Promise<string> {
    const state = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + oauthStateTtlSeconds * 1000).toISOString();
    const { error } = await this.client.from("meta_oauth_states").insert({
      state,
      organization_id: tenant.organizationId,
      workspace_id: tenant.workspaceId,
      created_by: tenant.userId,
      return_path: returnPath,
      expires_at: expiresAt,
    });
    if (error) throw error;
    return state;
  }

  /** Called once, immediately after the OAuth callback exchanges the code. Does not mark the state consumed -- the customer still needs to pick a Page. */
  async storePendingToken(state: string, current: OAuthStateTenant, token: EncryptedToken, expiresAt: string | null): Promise<void> {
    const { data, error } = await this.client
      .from("meta_oauth_states")
      .select("organization_id,workspace_id,created_by")
      .eq("state", state)
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new OAuthStateError("STATE_INVALID_OR_EXPIRED");
    assertOwnership(data as Record<string, unknown>, current);

    const { error: updateError } = await this.client
      .from("meta_oauth_states")
      .update({ pending_token_ciphertext: token.ciphertext, pending_token_iv: token.iv, pending_token_tag: token.tag, pending_token_expires_at: expiresAt })
      .eq("state", state);
    if (updateError) throw updateError;
  }

  /** Read-only: used to render the page-selection step. Never marks the state consumed. */
  async pendingToken(state: string, current: OAuthStateTenant): Promise<{ token: EncryptedToken; returnPath: string | null } | null> {
    const { data, error } = await this.client
      .from("meta_oauth_states")
      .select("organization_id,workspace_id,created_by,return_path,pending_token_ciphertext,pending_token_iv,pending_token_tag")
      .eq("state", state)
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as Record<string, unknown>;
    assertOwnership(row, current);
    if (!row.pending_token_ciphertext) return null;
    return {
      token: { ciphertext: String(row.pending_token_ciphertext), iv: String(row.pending_token_iv), tag: String(row.pending_token_tag) },
      returnPath: row.return_path ? String(row.return_path) : null,
    };
  }

  /** Final, single-use claim -- called only when the customer submits "Save connection". */
  async consume(state: string, current: OAuthStateTenant): Promise<{ token: EncryptedToken; returnPath: string | null }> {
    if (!state) throw new OAuthStateError("STATE_INVALID_OR_EXPIRED");
    const { data, error } = await this.client
      .from("meta_oauth_states")
      .update({ consumed_at: new Date().toISOString() })
      .eq("state", state)
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString())
      .select("organization_id,workspace_id,created_by,return_path,pending_token_ciphertext,pending_token_iv,pending_token_tag")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new OAuthStateError("STATE_INVALID_OR_EXPIRED");
    const row = data as Record<string, unknown>;
    assertOwnership(row, current);
    if (!row.pending_token_ciphertext) throw new OAuthStateError("STATE_NOT_READY");
    return {
      token: { ciphertext: String(row.pending_token_ciphertext), iv: String(row.pending_token_iv), tag: String(row.pending_token_tag) },
      returnPath: row.return_path ? String(row.return_path) : null,
    };
  }
}
