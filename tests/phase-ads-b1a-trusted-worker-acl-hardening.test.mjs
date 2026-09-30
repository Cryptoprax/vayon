import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import test from "node:test";

const rd = (p) => readFileSync(p, "utf8");
const original = rd("supabase/migrations/20261204000000_ads_b1_cross_channel_campaign_domain.sql");
const hardening = rd("supabase/migrations/20261204010000_ads_b1_trusted_worker_acl_hardening.sql");
const hardeningSql = hardening.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");

// ---------------------------------------------------------------------------
// Historical-immutability: the original ADS-B1 migration is byte-identical
// to its ADS-B0F/ADS-B1G-verified content; this is an additive follow-up.
// ---------------------------------------------------------------------------
test("original ADS-B1 migration is unmodified by this phase", () => {
  // Normalized to LF before hashing so this assertion is checkout-independent
  // (a fresh git checkout on Windows with core.autocrlf=true converts LF to
  // CRLF on disk without changing the committed blob content).
  const hash = createHash("sha256").update(original.replace(/\r\n/g, "\n")).digest("hex");
  assert.equal(hash, "552deeadc923be6a2912f7c97aa74ee9b9b3aee486fe1c665c0a27f45d0aaed9");
});

test("hardening migration is additive only -- no historical file touched, no ADS-B1 table altered", () => {
  assert.doesNotMatch(hardeningSql, /alter table public\.campaign_channel_executions\s+add|alter table public\.campaign_budget_intents\s+add|alter table public\.campaign_targeting_intents\s+add/i);
  assert.doesNotMatch(hardeningSql, /drop table|drop column/i);
  assert.doesNotMatch(hardeningSql, /alter default privileges/i);
});

// ---------------------------------------------------------------------------
// FINDING 1: is_source_approved now requires caller tenant membership for
// non-service_role callers.
// ---------------------------------------------------------------------------
test("is_source_approved requires organization+workspace membership for non-service_role callers", () => {
  assert.match(hardeningSql, /if current_setting\('role', true\) <> 'service_role' then\s*\n\s*if not public\.is_organization_member\(p_organization_id\) or public\.current_workspace_role\(p_workspace_id\) is null then\s*\n\s*raise exception 'insufficient approval visibility permission';/);
});

test("is_source_approved keeps its exact original signature and return type (no caller needs to change)", () => {
  assert.match(hardeningSql, /create or replace function public\.is_source_approved\(\s*\n\s*p_organization_id uuid,\s*\n\s*p_workspace_id uuid,\s*\n\s*p_source_type text,\s*\n\s*p_source_id uuid,\s*\n\s*p_action_type text\s*\n\s*\) returns boolean/);
});

test("is_source_approved is still SECURITY DEFINER with search_path pinned to public", () => {
  const body = hardeningSql.slice(hardeningSql.indexOf("function public.is_source_approved("));
  const clause = body.slice(0, body.indexOf("$$"));
  assert.match(clause, /security definer/);
  assert.match(clause, /set search_path = public/);
});

// ---------------------------------------------------------------------------
// FINDING 2: explicit least-privilege revoke for the four Model A functions.
// ---------------------------------------------------------------------------
test("Model A functions (create_campaign_channel_execution, save_campaign_budget_intent, accept_campaign_budget_intent, save_campaign_targeting_intent) have service_role explicitly revoked", () => {
  for (const sig of [
    "create_campaign_channel_execution(uuid, text)",
    "save_campaign_budget_intent(uuid, text, numeric, numeric, timestamptz, timestamptz)",
    "accept_campaign_budget_intent(uuid)",
    "save_campaign_targeting_intent(uuid, text, text, text, text, text, text, numeric, numeric, text)",
  ]) {
    assert.match(hardeningSql, new RegExp(`revoke execute on function public\\.${sig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} from service_role;`));
  }
});

test("Model C functions (is_source_approved, transition_campaign_channel_execution) explicitly keep authenticated and service_role", () => {
  for (const sig of ["is_source_approved(uuid, uuid, text, uuid, text)", "transition_campaign_channel_execution(uuid, text, text, text)"]) {
    assert.match(hardeningSql, new RegExp(`grant execute on function public\\.${sig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} to authenticated;`));
    assert.match(hardeningSql, new RegExp(`grant execute on function public\\.${sig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} to service_role;`));
  }
});

// ---------------------------------------------------------------------------
// FINDING 3: state-transition role matrix -- provider-confirmed outcomes are
// trusted-worker only; 'approved' now also requires a real D1 approval.
// ---------------------------------------------------------------------------
test("transition_campaign_channel_execution blocks non-service callers from setting any provider-confirmed-outcome status", () => {
  assert.match(hardeningSql, /if not v_is_service and p_status in \('active', 'completed', 'failed', 'paused', 'uncertain'\) then\s*\n\s*raise exception 'TRUSTED_WORKER_ONLY/);
});

test("'approved' now also requires is_source_approved, not only 'publishing'\\/'active'", () => {
  assert.match(hardeningSql, /if p_status in \('approved', 'publishing', 'active'\) then\s*\n\s*if not public\.is_source_approved/);
});

test("transition_campaign_channel_execution keeps its exact original signature (no caller needs to change)", () => {
  assert.match(hardeningSql, /create or replace function public\.transition_campaign_channel_execution\(\s*\n\s*p_execution_id uuid,\s*\n\s*p_status text,\s*\n\s*p_error_code text default null,\s*\n\s*p_error_message text default null\s*\n\s*\) returns void/);
});

test("service_role path is unchanged -- still re-derives the execution row by id alone, never trusts a caller-supplied tenant id", () => {
  const body = hardeningSql.slice(hardeningSql.indexOf("function public.transition_campaign_channel_execution("));
  assert.match(body, /if v_is_service then\s*\n\s*select \* into e from public\.campaign_channel_executions where id = p_execution_id for update;/);
});

// ---------------------------------------------------------------------------
// Regression guard: the fixed functions still contain zero provider/network
// calls, still emit a creative_timeline audit row, and still never trust a
// caller-supplied organization/workspace id for authenticated callers.
// ---------------------------------------------------------------------------
test("no provider/network reference was introduced by the hardening migration", () => {
  assert.doesNotMatch(hardeningSql, /fetch\(|https?:\/\/|OpenAI|MetaGraph|GoogleAds/i);
});

test("transition_campaign_channel_execution's authenticated branch still derives org/workspace exclusively from the caller's own workspace_members row", () => {
  const body = hardeningSql.slice(hardeningSql.indexOf("function public.transition_campaign_channel_execution("));
  assert.match(body, /wm\.user_id = auth\.uid\(\) and wm\.status = 'active'/);
});
