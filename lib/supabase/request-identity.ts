import "server-only";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Request-scoped memoization for identity lookups.
 *
 * React cache() gives every server request (render pass) its own slot; a different request, and any call
 * outside a React server render, gets a fresh slot, so nothing is shared across requests or users and every
 * request re-verifies with Supabase. Only found values are kept: a null result or a failure is dropped, so a
 * read after an in-request write (workspace bootstrap) re-queries instead of reusing a stale miss.
 */
export function requestMemo<T>(load: () => Promise<T | null>): () => Promise<T | null> {
  const slot = cache((): { pending?: Promise<T | null> } => ({}));
  return () => {
    const state = slot();
    if (state.pending) return state.pending;
    const pending = load();
    state.pending = pending;
    const forget = () => {
      if (state.pending === pending) state.pending = undefined;
    };
    pending.then((value) => {
      if (value == null) forget();
    }, forget);
    return pending;
  };
}

/** The Supabase Auth user for this request, verified once per request with auth.getUser(). */
export const requestAuthUser = requestMemo<User>(async () => {
  const client = await createSupabaseServerClient();
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
});
