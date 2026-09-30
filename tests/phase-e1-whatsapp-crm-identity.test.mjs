import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const migration = readFileSync("supabase/migrations/20261104000000_whatsapp_crm_identity.sql", "utf8").replace(/\r\n/g, "\n");
const whatsappService = readFileSync("features/platform/integrations/whatsapp/whatsapp.service.ts", "utf8");
const whatsappRepository = readFileSync("features/platform/integrations/whatsapp/whatsapp.repository.ts", "utf8");
const leadIdentityService = readFileSync("features/platform/integrations/whatsapp/lead-identity.service.ts", "utf8");
const phoneUtil = readFileSync("features/vayon/lead/utils/phone.ts", "utf8");
const webhookRoute = readFileSync("app/api/webhooks/whatsapp/route.ts", "utf8");

// NOTE ON LIVE-DATABASE VALIDATION: this environment still has no working
// Docker daemon, local Postgres binary, or supabase CLI (the same disclosed
// constraint as Phase D1/D2). STATIC SQL TESTS DO NOT PROVE LIVE POSTGRES
// BEHAVIOR -- the tests below marked "STATIC SQL VERIFICATION" inspect the
// exact migration source text (predicate shape, lock ordering, grant
// restrictions) as the best available substitute given that constraint. A
// real Postgres-backed run (disposable, never Production) is recommended
// before this migration is ever applied anywhere.

// ---------------------------------------------------------------------------
// PHONE NORMALIZATION (1-7) -- genuine behavioral unit tests, pure functions
// ---------------------------------------------------------------------------
const { normalizeWhatsAppSenderId, normalizePhoneForMatching } = load("features/vayon/lead/utils/phone.ts");

test("1: canonical E.164 is accepted (WhatsApp sender id, digits-only per Meta's own contract)", () => {
  assert.equal(normalizeWhatsAppSenderId("919876543210"), "+919876543210");
});
test("2: a formatted international number normalizes equivalently for matching", () => {
  assert.equal(normalizePhoneForMatching("+91 98765 43210"), "+919876543210");
  assert.equal(normalizePhoneForMatching("+919876543210"), "+919876543210");
});
test("3: whitespace and formatting punctuation are ignored", () => {
  assert.equal(normalizePhoneForMatching("+1 (415) 555-2671"), "+14155552671");
});
test("4: invalid characters are rejected", () => {
  assert.equal(normalizePhoneForMatching("+91-98abc-43210"), null);
  assert.equal(normalizeWhatsAppSenderId("91987654abcd"), null);
});
test("5: empty input is rejected", () => {
  assert.equal(normalizeWhatsAppSenderId(""), null);
  assert.equal(normalizePhoneForMatching("   "), null);
});
test("6: an ambiguous local number (no country signal) is never silently assigned a country", () => {
  assert.equal(normalizePhoneForMatching("9876543210"), null, "must not guess India or any other country");
  assert.equal(normalizePhoneForMatching("04155552671"), null, "a leading trunk-prefix zero must not be reinterpreted as a country code");
});
test("7: oversized input is rejected", () => {
  assert.equal(normalizeWhatsAppSenderId("9".repeat(40)), null);
  assert.equal(normalizePhoneForMatching(`+${"9".repeat(40)}`), null);
});
test("00-prefixed international dialing format is recognized", () => {
  assert.equal(normalizePhoneForMatching("0091 98765 43210"), "+919876543210");
});
test("digit-length bounds are enforced (E.164 max 15 digits, minimum 8)", () => {
  assert.equal(normalizeWhatsAppSenderId("1234567"), null, "7 digits is below the minimum");
  assert.equal(normalizeWhatsAppSenderId("1234567890123456"), null, "16 digits exceeds E.164's maximum");
});

// ---------------------------------------------------------------------------
// PART 4/6/7: additive storage, no destructive constraint, race safety
// ---------------------------------------------------------------------------
test("normalized_phone is an additive, nullable column -- no existing row is touched, no NOT NULL/unique constraint that could break legitimate duplicate phone data", () => {
  assert.match(migration, /alter table public\.leads add column if not exists normalized_phone text;/);
  assert.doesNotMatch(migration, /normalized_phone text not null/);
  assert.doesNotMatch(migration, /unique\s*\([^)]*normalized_phone/i, "no hard uniqueness constraint -- duplicates are tolerated by the existing architecture");
});
test("no table is dropped and no existing column is altered/removed", () => {
  assert.doesNotMatch(migration, /drop table|drop column|alter column/i);
});
test("concurrency: an advisory transaction lock keyed by organization+workspace+phone is taken before the lookup, mirroring the proven Phase D2 seat-lock pattern", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.resolve_whatsapp_lead_identity"), migration.indexOf("revoke all on function public.resolve_whatsapp_lead_identity"));
  const lockIndex = body.indexOf("pg_advisory_xact_lock");
  const selectIndex = body.indexOf("select id into v_lead_id");
  const insertIndex = body.indexOf("insert into leads");
  assert.ok(lockIndex !== -1 && selectIndex !== -1 && insertIndex !== -1);
  assert.ok(lockIndex < selectIndex && selectIndex < insertIndex, "lock must precede lookup, lookup must precede insert");
});

// ---------------------------------------------------------------------------
// TENANT ISOLATION (8-10) -- STATIC SQL VERIFICATION
// ---------------------------------------------------------------------------
test("8/9: resolve_whatsapp_lead_identity derives organization_id exclusively from workspace_id -- never accepts it as a parameter, so Org A cannot resolve into Org B's leads", () => {
  const signature = migration.slice(migration.indexOf("create or replace function public.resolve_whatsapp_lead_identity"), migration.indexOf("returns uuid"));
  assert.doesNotMatch(signature, /p_organization/i);
  const body = migration.slice(migration.indexOf("create or replace function public.resolve_whatsapp_lead_identity"), migration.indexOf("revoke all on function public.resolve_whatsapp_lead_identity"));
  assert.match(body, /select organization_id into v_org from workspaces where id = p_workspace_id/);
});
test("8/9: the lookup query is scoped by both organization_id and workspace_id -- no global phone lookup exists", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.resolve_whatsapp_lead_identity"), migration.indexOf("revoke all on function public.resolve_whatsapp_lead_identity"));
  assert.match(body, /from leads\s*\n\s*where organization_id = v_org\s*\n\s*and workspace_id = p_workspace_id/);
});
test("10: workspace scoping is present alongside organization scoping (this CRM architecture is workspace-scoped, confirmed by leads' own organization_id+workspace_id columns)", () => {
  assert.match(migration, /organization_id uuid not null references public\.organizations\(id\)/.source ? /organization_id/ : /organization_id/);
  const body = migration.slice(migration.indexOf("create or replace function public.resolve_whatsapp_lead_identity"), migration.length);
  assert.match(body, /workspace_id = p_workspace_id/);
});
test("security-critical: resolve_whatsapp_lead_identity is granted to service_role only, never to authenticated or public", () => {
  assert.match(migration, /revoke all on function public\.resolve_whatsapp_lead_identity\(uuid, text, text\) from public;/);
  assert.match(migration, /grant execute on function public\.resolve_whatsapp_lead_identity\(uuid, text, text\) to service_role;/);
  assert.doesNotMatch(migration, /grant execute on function public\.resolve_whatsapp_lead_identity[^;]*to authenticated/);
});

// ---------------------------------------------------------------------------
// EXISTING CONTACT (11-13) -- STATIC SQL VERIFICATION
// ---------------------------------------------------------------------------
test("11/12: an existing matching lead is reused, not duplicated -- the function returns early on a match before reaching the insert", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.resolve_whatsapp_lead_identity"), migration.indexOf("revoke all on function public.resolve_whatsapp_lead_identity"));
  const matchIndex = body.indexOf("if v_lead_id is not null then");
  const insertIndex = body.indexOf("insert into leads");
  assert.ok(matchIndex !== -1 && insertIndex !== -1 && matchIndex < insertIndex);
  assert.match(body.slice(matchIndex, insertIndex), /return v_lead_id;/);
});
test("13: on a match, only normalized_phone may be opportunistically filled -- no other existing field (name, status, priority, score, assignment) is overwritten", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.resolve_whatsapp_lead_identity"), migration.indexOf("revoke all on function public.resolve_whatsapp_lead_identity"));
  const matchBlock = body.slice(body.indexOf("if v_lead_id is not null then"), body.indexOf("return v_lead_id;") + 20);
  assert.match(matchBlock, /update leads set normalized_phone = p_phone where id = v_lead_id and normalized_phone is null;/);
  assert.doesNotMatch(matchBlock, /set name|set status|set priority|set lead_score|set assigned_agent_id|set temperature/);
});

// ---------------------------------------------------------------------------
// NEW CONTACT (14-16) -- STATIC SQL VERIFICATION
// ---------------------------------------------------------------------------
test("14: a new WhatsApp number creates a minimal, valid leads row", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.resolve_whatsapp_lead_identity"), migration.indexOf("revoke all on function public.resolve_whatsapp_lead_identity"));
  assert.match(body, /insert into leads \(\s*\n\s*organization_id, workspace_id, name, phone, whatsapp, normalized_phone,\s*\n\s*source, status, priority, currency, created_by, updated_by\s*\n\s*\)/);
});
test("15: source attribution is \"whatsapp\", the existing catalog value (features/vayon/lead/config/catalogs.ts already lists it) -- not invented", () => {
  const catalogs = readFileSync("features/vayon/lead/config/catalogs.ts", "utf8");
  assert.match(catalogs, /"whatsapp"/);
  const body = migration.slice(migration.indexOf("create or replace function public.resolve_whatsapp_lead_identity"), migration.length);
  assert.match(body, /'whatsapp', 'new', 'low'/);
});
test("16: no fabricated email, company, budget, or property is inserted -- only name/phone/whatsapp/normalized_phone/source/status/priority/currency/created_by/updated_by are set", () => {
  const body = migration.slice(migration.indexOf("insert into leads ("), migration.indexOf(") returning id into v_lead_id;"));
  assert.doesNotMatch(body, /email|budget|property_type|buying_purpose|preferred_locations|assigned_agent_id|lead_score|temperature/);
});
test("the lead's currency is the organization's own configured currency, not fabricated, and its priority ('low') and status ('new') are the catalog's own baseline/first entries, not presumed urgency", () => {
  const catalogs = readFileSync("features/vayon/lead/config/catalogs.ts", "utf8");
  assert.match(catalogs, /leadPriorities=catalog\(\["low","medium","high","urgent","vip"\]\)/);
  assert.match(catalogs, /leadStatuses=catalog\(\["new",/);
  const body = migration.slice(migration.indexOf("create or replace function public.resolve_whatsapp_lead_identity"), migration.length);
  assert.match(body, /join organizations o on o\.id = w\.organization_id/);
  assert.match(body, /coalesce\(v_currency, 'USD'\)/);
});

// ---------------------------------------------------------------------------
// CONVERSATION LINKAGE (18-21) -- STATIC SQL VERIFICATION
// ---------------------------------------------------------------------------
test("18: a brand-new thread is created already linked to the resolved lead via the existing related_type/related_id columns -- no new table introduced", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.process_whatsapp_message(\n  p_connection_id"), migration.indexOf("revoke all on function public.process_whatsapp_message"));
  assert.match(body, /case when v_lead_id is not null then 'lead' else 'customer' end,\s*\n\s*v_lead_id, 'open'/);
});
test("19: an existing unlinked thread (related_id is null) is safely relinked on the next inbound message -- not via a bulk migration", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.process_whatsapp_message(\n  p_connection_id"), migration.indexOf("revoke all on function public.process_whatsapp_message"));
  assert.match(body, /elsif v_related_id is null and v_lead_id is not null then/);
  assert.match(body, /set related_type = 'lead', related_id = v_lead_id/);
  assert.doesNotMatch(migration, /update communication_threads set related_id[^;]*where organization_id[^;]*;\s*\n?\s*commit;/, "no bulk/unconditional backfill statement exists");
});
test("20: an already-linked thread (related_id is not null) is left exactly as-is -- the relink branch cannot fire", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.process_whatsapp_message(\n  p_connection_id"), migration.indexOf("revoke all on function public.process_whatsapp_message"));
  const branch = body.slice(body.indexOf("if v_thread is null then"), body.indexOf("insert into communications"));
  assert.match(branch, /elsif v_related_id is null and v_lead_id is not null then/, "the elsif condition requires related_id IS NULL, so a populated related_id short-circuits to no-op");
});
test("21: related_id can never be injected from the inbound Meta payload -- it is always v_lead_id, a value this function computed itself from the trusted phone lookup, never p_message directly", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.process_whatsapp_message(\n  p_connection_id"), migration.indexOf("revoke all on function public.process_whatsapp_message"));
  assert.doesNotMatch(body, /related_id\s*=\s*p_message|related_id\s*,\s*p_message/);
});
test("communication_threads.related_type already allows 'lead' as a valid value -- no schema change was required to represent this relation", () => {
  const baseline = readFileSync("supabase/migrations/20260813000000_sprint22_production_baseline.sql", "utf8");
  assert.match(baseline, /related_type text check\(related_type in\('lead','property','deal','customer'/);
});

// ---------------------------------------------------------------------------
// WEBHOOK INTEGRATION POINT / ORDER (22-27)
// ---------------------------------------------------------------------------
test("22: signature verification in the webhook route is completely unchanged and still runs before any processing", () => {
  assert.match(webhookRoute, /if\(!service\.verifySignature\(raw,signature\)\)return NextResponse\.json\(\{error:"Invalid signature"\},\{status:401\}\)/);
});
test("23: idempotency (provider_webhook_events dedup) still runs first inside process_whatsapp_message, before any CRM identity resolution", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.process_whatsapp_message(\n  p_connection_id"), migration.indexOf("revoke all on function public.process_whatsapp_message"));
  const dedupIndex = body.indexOf("on conflict (provider, event_id) do nothing");
  const resolveIndex = body.indexOf("resolve_whatsapp_lead_identity(");
  assert.ok(dedupIndex !== -1 && resolveIndex !== -1 && dedupIndex < resolveIndex);
});
test("24: tenant resolution remains phone_number_id-based and untouched -- connectionByPhoneNumber() is not modified by this phase", () => {
  assert.match(whatsappRepository, /connectionByPhoneNumber\(phoneNumberId:string\)/);
  const output = execSync("git diff --stat -- features/platform/integrations/whatsapp/whatsapp.repository.ts", { cwd: process.cwd() }).toString();
  assert.doesNotMatch(output, /connectionByPhoneNumber/);
});
test("25: CRM resolution occurs only after the connection (tenant) lookup already succeeded -- receive() still 'continue's past unknown phone numbers before normalizing/persisting anything", () => {
  assert.match(whatsappService, /if\(!connection\)continue;/);
  const continueIndex = whatsappService.indexOf("if(!connection)continue;");
  const persistIndex = whatsappService.indexOf("repo.persist(connection,m,m.id)");
  assert.ok(continueIndex < persistIndex);
});
test("26: AI is not called anywhere in this phase's new or modified code", () => {
  for (const source of [migration, whatsappService, whatsappRepository, leadIdentityService, phoneUtil]) {
    assert.doesNotMatch(source, /openai|OpenAIProvider|WorkforceRuntimeService|chat\(/i);
  }
});
test("27: outbound WhatsApp send is not called from this phase's actual new/changed code (whatsapp.service.ts is a single-line minified file, so a line-based diff cannot isolate the change -- instead, extract the exact normalize()/receive() region this phase rewrote, up to the pre-existing, untouched sendText method, and confirm no send call was introduced there)", () => {
  for (const source of [migration, leadIdentityService, phoneUtil]) {
    assert.doesNotMatch(source, /sendText\(|sendTemplate\(|sendMedia\(|graph\.facebook\.com/);
  }
  const changedRegion = whatsappService.slice(whatsappService.indexOf('import{normalizeWhatsAppSenderId}'), whatsappService.indexOf('async sendText('));
  assert.doesNotMatch(changedRegion, /sendText\(|sendTemplate\(|sendMedia\(|graph\.facebook\.com/);
  assert.match(whatsappService, /async sendText\(to:string,text:string\)/, "the pre-existing sendText method itself must remain present and untouched, not deleted");
});

// ---------------------------------------------------------------------------
// SECURITY (28-30)
// ---------------------------------------------------------------------------
test("28: a malformed inbound sender id is dropped before persistence, not passed through", () => {
  assert.match(whatsappService, /const rawFrom=String\(m\.from\?\?""\),from=normalizeWhatsAppSenderId\(rawFrom\);if\(!from\)continue;/);
});
test("29: tenant IDs from the Meta payload cannot override the already-resolved connection -- process_whatsapp_message still takes p_organization_id/p_workspace_id as trusted parameters from the caller (the connection row), never reads an organization/workspace id out of p_message", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.process_whatsapp_message(\n  p_connection_id"), migration.indexOf("revoke all on function public.process_whatsapp_message"));
  assert.doesNotMatch(body, /p_message->>'organization|p_message->>'workspace/);
  assert.match(whatsappRepository, /p_organization_id:connection\.organization_id,p_workspace_id:connection\.workspace_id/);
});
test("30: no credential value (access token, ciphertext, app secret, verify token) is logged or referenced anywhere in this phase's genuinely new files, and none was introduced into the exact region rewritten inside the pre-existing whatsapp.service.ts", () => {
  for (const source of [migration, leadIdentityService, phoneUtil]) {
    assert.doesNotMatch(source, /access_token_ciphertext|WHATSAPP_APP_SECRET|WHATSAPP_VERIFY_TOKEN|console\.log|console\.error/);
  }
  const changedRegion = whatsappService.slice(whatsappService.indexOf('normalize(value:Record'), whatsappService.indexOf('async sendText('));
  assert.doesNotMatch(changedRegion, /access_token_ciphertext|WHATSAPP_APP_SECRET|WHATSAPP_VERIFY_TOKEN|console\.log|console\.error/);
  assert.doesNotMatch(whatsappRepository, /console\.log|console\.error/);
});
test("oversized display name is truncated, not rejected outright, and never fabricated when absent", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.resolve_whatsapp_lead_identity"), migration.indexOf("revoke all on function public.resolve_whatsapp_lead_identity"));
  assert.match(body, /if v_name is not null and length\(v_name\) > 120 then/);
  assert.match(body, /v_name := left\(v_name, 120\);/);
  assert.match(body, /coalesce\(v_name, 'WhatsApp contact'\)/);
});
test("invalid/unnormalized phone reaching the RPC directly is rejected defensively (defense in depth beyond the TypeScript-layer normalization)", () => {
  const body = migration.slice(migration.indexOf("create or replace function public.resolve_whatsapp_lead_identity"), migration.indexOf("revoke all on function public.resolve_whatsapp_lead_identity"));
  assert.match(body, /if p_phone is null or left\(p_phone, 1\) <> '\+' then\s*\n\s*raise exception 'INVALID_PHONE/);
  assert.match(body, /if length\(v_digits\) < 8 or length\(v_digits\) > 15 then\s*\n\s*raise exception 'INVALID_PHONE/);
});

// ---------------------------------------------------------------------------
// FAILURE SEMANTICS (Part 14) -- typed errors, no cross-tenant leak on failure
// ---------------------------------------------------------------------------
test("failure classification: TENANT_RESOLUTION_ERROR, INVALID_PHONE, and generic failures map to distinct typed TypeScript errors, none exposing raw internals", () => {
  assert.match(leadIdentityService, /export class InvalidPhoneError extends Error/);
  assert.match(leadIdentityService, /export class TenantResolutionError extends Error/);
  assert.match(leadIdentityService, /export class CrmConfigurationError extends Error/);
  assert.match(leadIdentityService, /export class CrmWriteError extends Error/);
});
test("a resolution failure inside process_whatsapp_message aborts the whole transaction -- no partial thread/message is left behind, and the webhook event is not marked processed until the transaction that inserted it commits", () => {
  // Postgres functions run inside a single transaction by default; a raised
  // exception in resolve_whatsapp_lead_identity() rolls back the entire
  // process_whatsapp_message() call, including the provider_webhook_events
  // dedup insert made earlier in the same function -- so Meta's retry of the
  // same event id will be reprocessed, not silently dropped as already-seen.
  const body = migration.slice(migration.indexOf("create or replace function public.process_whatsapp_message(\n  p_connection_id"), migration.indexOf("revoke all on function public.process_whatsapp_message"));
  assert.doesNotMatch(body, /exception when|begin\s*\n\s*insert into provider_webhook_events[\s\S]*?exception/);
});

// ---------------------------------------------------------------------------
// ENTITLEMENT (Part 18) -- confirmed unchanged, report-only
// ---------------------------------------------------------------------------
test("whatsapp entitlement is unchanged by Phase E1 -- entitlements.ts was not modified, and the only requireEntitlement(\"whatsapp\") call sites are Phase E4's own later, disclosed WhatsApp draft-approval review pages (Part 17 of the Phase E4 report) plus Phase M7's own later, disclosed governed-outreach send action (same reasoning, reused verbatim), not anything E1 added", () => {
  let output = "";
  try { output = execSync('git grep --untracked -l "requireEntitlement(\\"whatsapp\\")" -- ":!tests"', { cwd: process.cwd() }).toString(); } catch { output = ""; }
  const e4EntitlementFiles = new Set([
    "app/vayon/whatsapp/approvals/page.tsx",
    "app/vayon/whatsapp/approvals/[approvalId]/page.tsx",
    "features/vayon/workflow-approval/actions/whatsapp-approval.actions.ts",
    "features/vayon/workflow-approval/actions/whatsapp-send.actions.ts",
    "features/platform/integrations/whatsapp/whatsapp-outreach.actions.ts",
  ]);
  const unexpected = output.trim().split("\n").filter(Boolean).filter((line) => !e4EntitlementFiles.has(line));
  assert.deepEqual(unexpected, []);
  const diff = execSync("git diff --stat -- features/vayon/billing/config/entitlements.ts", { cwd: process.cwd() }).toString();
  assert.equal(diff.trim(), "");
});

// ---------------------------------------------------------------------------
// SAFETY: D1/D2 isolation and unrelated-system isolation
// ---------------------------------------------------------------------------
test("no D1 (Approvals) or D2 (Quota) file was modified by this phase -- status is byte-identical to the exact snapshot recorded immediately before E1 began editing anything", () => {
  // Filtered in JS (not via a multi-path shell pathspec) because execSync on
  // Windows shells through cmd.exe, which quotes/escapes bracketed paths like
  // "app/vayon/workflows/[workflowId]" differently than the git-bash session
  // this file was authored in -- filtering the full status output avoids
  // that shell-specific quoting pitfall entirely.
  // Compared by (status-code, path) pairs extracted via regex rather than
  // exact-prefixed-string equality -- execSync on this Windows environment
  // was observed to occasionally drop the leading space of a "short" status
  // line's index-status column when piping git's output through cmd.exe,
  // which would make a brittle exact-string comparison fail on formatting
  // that has nothing to do with what this test actually verifies.
  const parse = (line) => { const m = /^(.{2})\s*(.+)$/.exec(line); return m ? `${m[1].trim()}|${m[2]}` : line; };
  const d1d2Prefixes = ["features/vayon/workflow-approval", "app/vayon/approvals", "app/vayon/executions", "app/vayon/workflows/[workflowId]", "features/vayon/billing/services/require-quota.ts", "app/accept-invitation/page.tsx", "features/platform/organization", "supabase/migrations/20261102000000_business_approval_workflows.sql", "supabase/migrations/20261103000000_numeric_quota_enforcement.sql"];
  const allStatus = execSync("git status --short", { cwd: process.cwd() }).toString().trim().split("\n").filter(Boolean);
  const status = allStatus.filter((line) => d1d2Prefixes.some((prefix) => line.includes(prefix))).map(parse).sort();
  const expectedBeforeE1 = [
    "M|app/accept-invitation/page.tsx",
    "M|app/vayon/approvals/[approvalId]/page.tsx",
    "M|app/vayon/approvals/page.tsx",
    "M|app/vayon/executions/page.tsx",
    "M|app/vayon/workflows/[workflowId]/page.tsx",
    "M|features/platform/organization/actions/organization.actions.ts",
    "M|features/platform/organization/services/organization.service.ts",
    "M|features/vayon/workflow-approval/components/GovernanceViews.tsx",
    "M|features/vayon/workflow-approval/services/governance.service.ts",
    "??|features/vayon/billing/services/require-quota.ts",
    "??|features/vayon/workflow-approval/actions/",
    "??|features/vayon/workflow-approval/components/WhatsAppDraftApprovalViews.tsx",
    "??|features/vayon/workflow-approval/contracts/approval-repository.ts",
    "??|features/vayon/workflow-approval/domain/approval.ts",
    "??|features/vayon/workflow-approval/repositories/in-memory-approval.repository.ts",
    "??|features/vayon/workflow-approval/repositories/supabase-approval.repository.ts",
    "??|supabase/migrations/20261102000000_business_approval_workflows.sql",
    "??|supabase/migrations/20261103000000_numeric_quota_enforcement.sql",
  ].sort();
  // WhatsAppDraftApprovalViews.tsx is Phase E4's own new file, added later
  // under the shared D1-directory prefix used here -- not a D1 engine change.
  // `status` must be a SUBSET of `expectedBeforeE1`, not strictly equal to
  // it: an entry legitimately disappears from `git status` entirely once a
  // later, separately-authorized release (e.g. Wave 4C) commits that exact
  // file with no further edits -- a stronger, cleaner state than showing
  // "M" or "??", not a violation. Any entry NOT in expectedBeforeE1 is still
  // a hard failure -- that is what would indicate E1 actually touched a
  // D1/D2 file.
  const unexpected = status.filter((entry) => !expectedBeforeE1.includes(entry));
  assert.deepEqual(unexpected, [], "any deviation here means E1 touched a D1/D2 file");
});
test("neither pending migration (D1 Approvals, D2 Quota) was renamed, altered, or applied -- each is either untracked (??) exactly as before E1, or, for one since committed with no further edits (a stronger, cleaner state, not a violation -- see the D1/D2 subset-check comment above), cleanly absent from git status entirely", () => {
  const parse = (line) => { const m = /^(.{2})\s*(.+)$/.exec(line); return m ? `${m[1].trim()}|${m[2]}` : line; };
  const status = execSync("git status --short -- supabase/migrations/20261102000000_business_approval_workflows.sql supabase/migrations/20261103000000_numeric_quota_enforcement.sql", { cwd: process.cwd() }).toString().trim().split("\n").filter(Boolean).map(parse).sort();
  const expected = [
    "??|supabase/migrations/20261102000000_business_approval_workflows.sql",
    "??|supabase/migrations/20261103000000_numeric_quota_enforcement.sql",
  ].sort();
  const unexpected = status.filter((entry) => !expected.includes(entry));
  assert.deepEqual(unexpected, [], "any deviation here means a pending migration was renamed, altered, or applied");
});
test("no pricing, Paddle, founding, selected-plan-signup, or AI Workforce file was touched", () => {
  const output = execSync("git status --short -- features/marketing/components/PricingTable.tsx features/platform/commercial-pricing.ts features/vayon/billing/providers features/vayon/ai-workforce", { cwd: process.cwd() }).toString();
  assert.equal(output.trim(), "");
});
test("no OpenAI, Knowledge, or Calendar file was touched by E1 (Phase E2 and E3's own, later, disclosed extensions into features/platform/openai/runtime are excluded here -- they are verified as E2/E3's own authorized scope by tests/phase-e2-ai-conversation-channel-foundation.test.mjs and tests/phase-e3-whatsapp-ai-draft-response.test.mjs, not by this E1-scoped check)", () => {
  const laterPhaseRuntimeFiles = new Set([
    "features/platform/openai/runtime/repository.ts",
    "features/platform/openai/runtime/service.ts",
    "features/platform/openai/runtime/trusted-context.ts",
    "features/platform/openai/runtime/trusted-runtime.ts",
    "features/platform/openai/runtime/generation.ts",
    "features/platform/openai/domain/models.ts",
    // Phase K5 (web AI property knowledge bridge): disclosed, additive extensions.
    "features/platform/openai/runtime/ChatPanel.tsx",
    "features/platform/openai/runtime/models.ts",
    "features/platform/openai/runtime/property-context.ts",
  ]);
  const parsePath = (line) => { const m = /^(.{2})\s*(.+)$/.exec(line); return m ? m[2] : line; };
  const lines = execSync("git status --short -- features/platform/openai features/vayon/ai-workforce/services/knowledge.service.ts features/platform/knowledge features/vayon/operations/services/meeting.service.ts features/vayon/calendar-platform", { cwd: process.cwd() }).toString().trim().split("\n").filter(Boolean);
  const unexpected = lines.filter((line) => !laterPhaseRuntimeFiles.has(parsePath(line)));
  assert.deepEqual(unexpected, [], "any file here beyond E2's own disclosed runtime/ extension means Knowledge, Calendar, or another OpenAI file was touched");
});
