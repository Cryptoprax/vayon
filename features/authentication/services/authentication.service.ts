import "server-only";
import { createHash } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeAuthenticatedPath } from "../security/oauth";
const hash = (v: string) => createHash("sha256").update(v).digest("hex");
export class AuthenticationService {
  async user() {
    const client = await createSupabaseServerClient();
    const { data, error } = await client.auth.getUser();
    if (error) return null;
    return data.user;
  }
  async signUp(name: string, email: string, password: string, origin: string) {
    const client = await createSupabaseServerClient();
    return client.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${origin}/auth/callback?next=/vayon`,
      },
    });
  }
  async login(
    email: string,
    password: string,
    metadata: { userAgent: string; ip: string },
  ) {
    const client = await createSupabaseServerClient(),
      emailHash = hash(email.toLowerCase()),
      started = Date.now(),
      { data: allowed } = await client.rpc("check_auth_rate_limit", {
        p_email_hash: emailHash,
      });
    if (!allowed) {
      await client.rpc("record_authentication_attempt", {
        p_email_hash: emailHash,
        p_outcome: "locked",
        p_method: "password",
        p_latency_ms: Date.now() - started,
        p_ip_hash: hash(metadata.ip),
        p_user_agent: metadata.userAgent,
      });
      return {
        data: { user: null, session: null },
        error: new Error("Account temporarily locked."),
      };
    }
    const result = await client.auth.signInWithPassword({ email, password }),
      outcome = result.error ? "failure" : "success";
    await client.rpc("record_authentication_attempt", {
      p_email_hash: emailHash,
      p_outcome: outcome,
      p_method: "password",
      p_latency_ms: Date.now() - started,
      p_ip_hash: hash(metadata.ip),
      p_user_agent: metadata.userAgent,
    });
    if (result.data.session)
      await client.rpc("upsert_identity_session", {
        p_fingerprint: hash(result.data.session.refresh_token),
        p_device_name: metadata.userAgent.slice(0, 100) || "Browser",
        p_ip_hash: hash(metadata.ip),
        p_user_agent: metadata.userAgent,
        p_expires_at: new Date(
          (result.data.session.expires_at ??
            Math.floor(Date.now() / 1000) + 3600) * 1000,
        ).toISOString(),
      });
    return result;
  }
  async googleLogin(origin: string, next?: string) {
    const client = await createSupabaseServerClient(),
      destination = safeAuthenticatedPath(next);
    return client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(destination)}`,
        scopes: "openid email profile",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
        },
      },
    });
  }
  async sendReset(email: string, origin: string) {
    const client = await createSupabaseServerClient();
    return client.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });
  }
  async resetPassword(password: string) {
    const client = await createSupabaseServerClient(),
      result = await client.auth.updateUser({ password });
    if (!result.error)
      await client.rpc("record_identity_audit", {
        p_event_type: "password.reset",
        p_metadata: { source: "recovery" },
      });
    return result;
  }
  async logout() {
    const client = await createSupabaseServerClient();
    return client.auth.signOut();
  }
}
