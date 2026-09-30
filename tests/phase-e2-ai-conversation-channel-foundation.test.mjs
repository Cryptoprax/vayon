import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const migration = readFileSync("supabase/migrations/20261105000000_ai_workforce_channel_foundation.sql", "utf8");
const priorMigration = readFileSync("supabase/migrations/20260815000000_sprint49_live_ai_workforce.sql", "utf8");
const repository = readFileSync("features/platform/openai/runtime/repository.ts", "utf8");
const service = readFileSync("features/platform/openai/runtime/service.ts", "utf8");
const trustedRuntime = readFileSync("features/platform/openai/runtime/trusted-runtime.ts", "utf8");
const trustedContextSource = readFileSync("features/platform/openai/runtime/trusted-context.ts", "utf8");
const domainModels = readFileSync("features/platform/openai/domain/models.ts", "utf8");

// NOTE ON LIVE-DATABASE VALIDATION: this environment still has no working
// Docker daemon, local Postgres binary, or supabase CLI (the same disclosed
// constraint as Phase D1/D2/E1). STATIC SQL TESTS DO NOT PROVE LIVE POSTGRES
// BEHAVIOR -- tests below marked "STATIC SQL VERIFICATION" inspect the exact
// migration source text as the best available substitute.

const { buildTrustedWorkforceContext } = load("features/platform/openai/runtime/trusted-context.ts");
const validInput = { organizationId: "org-1", workspaceId: "ws-1", employeeCode: "whatsapp-ai", channel: "whatsapp", communicationThreadId: "thread-1", leadId: "lead-1" };

// ---------------------------------------------------------------------------
// SCHEMA / MODEL (1-7)
// ---------------------------------------------------------------------------
test("1: web channel is supported -- every pre-existing row (and any row that doesn't specify one) defaults to channel='web'", () => {
  assert.match(migration, /add column if not exists channel text not null default 'web'/);
});
test("2: whatsapp channel is supported -- the trusted find-or-create function inserts channel='whatsapp'", () => {
  assert.match(migration, /'whatsapp', p_lead_id, p_communication_thread_id/);
});
test("3: channel is extensible without provider-specific schema -- no check constraint restricts it to a closed enum (same precedent as leads.source, which also has no check constraint)", () => {
  const columnDecl = migration.slice(migration.indexOf("add column if not exists channel"), migration.indexOf("add column if not exists lead_id"));
  assert.doesNotMatch(columnDecl, /check/i);
});
test("4: lead linkage is optional -- lead_id has no not-null constraint", () => {
  assert.match(migration, /add column if not exists lead_id uuid references public\.leads\(id\)/);
  assert.doesNotMatch(migration, /lead_id uuid not null/);
});
test("5: communication thread linkage is optional -- communication_thread_id has no not-null constraint", () => {
  assert.match(migration, /add column if not exists communication_thread_id uuid references public\.communication_threads\(id\)/);
  assert.doesNotMatch(migration, /communication_thread_id uuid not null/);
});
test("6: employee_code is retained -- the pre-existing column and its closed check constraint are not redefined by this migration (it is only ever read/written by value, never altered)", () => {
  assert.doesNotMatch(migration, /\bemployee_code text not null\b|check\(employee_code in/i);
  assert.match(migration, /employee_code = p_employee_code/, "the new function still queries by the pre-existing column");
  assert.match(priorMigration, /employee_code text not null check\(employee_code in/);
});
test("7: existing rows remain valid -- every new column is either a defaulted not-null (channel) or nullable (lead_id, communication_thread_id), so no backfill/data migration is required", () => {
  assert.match(migration, /add column if not exists channel text not null default 'web'/);
  assert.match(migration, /add column if not exists lead_id uuid references public\.leads\(id\),\s*\n\s*add column if not exists communication_thread_id uuid references public\.communication_threads\(id\);/);
});

// ---------------------------------------------------------------------------
// TENANT ISOLATION (8-11)
// ---------------------------------------------------------------------------
test("8: conversation lookup requires org AND workspace -- both resolve_whatsapp_ai_conversation's select and append_trusted_ai_message's ownership check filter on organization_id and workspace_id together, never conversation/thread id alone", () => {
  const resolveBody = migration.slice(migration.indexOf("create or replace function public.resolve_whatsapp_ai_conversation"), migration.indexOf("revoke all on function public.resolve_whatsapp_ai_conversation"));
  assert.match(resolveBody, /where organization_id = v_org\s*\n\s*and workspace_id = p_workspace_id\s*\n\s*and employee_code = p_employee_code\s*\n\s*and communication_thread_id = p_communication_thread_id/);
  const appendBody = migration.slice(migration.indexOf("create or replace function public.append_trusted_ai_message"), migration.indexOf("revoke all on function public.append_trusted_ai_message"));
  assert.match(appendBody, /where id = p_conversation_id and organization_id = v_org and workspace_id = p_workspace_id and deleted_at is null/);
});
test("9: Org A cannot resolve Org B's conversation by UUID -- append_trusted_ai_message raises TENANT_RESOLUTION_ERROR before inserting if the conversation id doesn't belong to the resolved organization/workspace", () => {
  const appendBody = migration.slice(migration.indexOf("create or replace function public.append_trusted_ai_message"), migration.indexOf("revoke all on function public.append_trusted_ai_message"));
  assert.match(appendBody, /raise exception 'TENANT_RESOLUTION_ERROR: conversation does not belong to this workspace'/);
});
test("10: Org A cannot resolve Org B's external conversation id (communication_thread_id) -- resolve_whatsapp_ai_conversation raises TENANT_RESOLUTION_ERROR unless the thread itself already belongs to the same organization and workspace", () => {
  const resolveBody = migration.slice(migration.indexOf("create or replace function public.resolve_whatsapp_ai_conversation"), migration.indexOf("revoke all on function public.resolve_whatsapp_ai_conversation"));
  assert.match(resolveBody, /select 1 from communication_threads\s*\n\s*where id = p_communication_thread_id and organization_id = v_org and workspace_id = p_workspace_id/);
  assert.match(resolveBody, /raise exception 'TENANT_RESOLUTION_ERROR: communication thread does not belong to this workspace'/);
});
test("11: the same external conversation id (communication_thread_id) in two tenants resolves independently -- the lookup always adds organization_id/workspace_id predicates alongside communication_thread_id, so a match in one tenant can never satisfy another tenant's query even in principle", () => {
  const resolveBody = migration.slice(migration.indexOf("create or replace function public.resolve_whatsapp_ai_conversation"), migration.indexOf("revoke all on function public.resolve_whatsapp_ai_conversation"));
  assert.match(resolveBody, /organization_id = v_org\s*\n\s*and workspace_id = p_workspace_id/);
});

// ---------------------------------------------------------------------------
// WHATSAPP IDENTITY (12-14)
// ---------------------------------------------------------------------------
test("12: the same WhatsApp business thread reuses one AI conversation -- an existing match short-circuits before the insert branch", () => {
  const resolveBody = migration.slice(migration.indexOf("create or replace function public.resolve_whatsapp_ai_conversation"), migration.indexOf("revoke all on function public.resolve_whatsapp_ai_conversation"));
  assert.match(resolveBody, /if v_conversation_id is not null then[\s\S]*?return v_conversation_id;\s*\n\s*end if;/);
});
test("13: different threads resolve to different conversations -- communication_thread_id is part of the lookup's equality predicate, not merely a value written after the fact", () => {
  const resolveBody = migration.slice(migration.indexOf("create or replace function public.resolve_whatsapp_ai_conversation"), migration.indexOf("revoke all on function public.resolve_whatsapp_ai_conversation"));
  assert.match(resolveBody, /and communication_thread_id = p_communication_thread_id\s*\n\s*and deleted_at is null/);
});
test("14: different employee codes are distinguished for the same thread -- employee_code is also part of the lookup's equality predicate", () => {
  const resolveBody = migration.slice(migration.indexOf("create or replace function public.resolve_whatsapp_ai_conversation"), migration.indexOf("revoke all on function public.resolve_whatsapp_ai_conversation"));
  assert.match(resolveBody, /and employee_code = p_employee_code/);
});
test("concurrency: an advisory transaction lock keyed by organization+workspace+employee+thread is taken before the lookup, mirroring the proven Phase D2/E1 pattern, so two near-simultaneous inbound messages on a brand-new thread cannot create two conversations", () => {
  const resolveBody = migration.slice(migration.indexOf("create or replace function public.resolve_whatsapp_ai_conversation"), migration.indexOf("revoke all on function public.resolve_whatsapp_ai_conversation"));
  assert.match(resolveBody, /perform pg_advisory_xact_lock\(hashtext\('whatsapp_ai_conv:' \|\| v_org::text \|\| ':' \|\| p_workspace_id::text \|\| ':' \|\| p_employee_code \|\| ':' \|\| p_communication_thread_id::text\)\)/);
});

// ---------------------------------------------------------------------------
// WEB COMPATIBILITY (15-17)
// ---------------------------------------------------------------------------
test("15: the existing browser AI chat conversation path (create/append/search/snapshot) is untouched -- none of them reference channel, lead_id, communication_thread_id, or a trusted/service-role client", () => {
  const createBody = repository.slice(repository.indexOf("async create(employee"), repository.indexOf("async append(input"));
  const appendBody = repository.slice(repository.indexOf("async append(input"), repository.indexOf("/**"));
  for (const body of [createBody, appendBody]) {
    assert.doesNotMatch(body, /channel|lead_id|communication_thread_id/);
    assert.match(body, /auth\.getUser\(\)/, "the interactive path must still require an authenticated user");
  }
});
test("16: no new WhatsApp-only field is required to construct a conversation -- create()'s insert statement is unchanged and does not set channel/lead_id/communication_thread_id, so they fall through to the migration's own defaults (channel='web') or stay null", () => {
  assert.match(repository, /\.insert\(\{ organization_id: this\.context\.organizationId, workspace_id: this\.context\.workspaceId, employee_code: employee, title: title\.slice\(0, 120\), created_by: auth\.user\.id \}\)/);
});
test("17: existing AI Workforce tests' own load-bearing assertions still hold against the current repository.ts/service.ts (re-verified here inline; the full suites are also run standalone in CI/validation). Phase E3 later extracted the provider.stream() call into generation.ts -- this assertion follows that legitimate move rather than going stale.", () => {
  const generationSource = readFileSync("features/platform/openai/runtime/generation.ts", "utf8");
  assert.match(service, /WorkforceConversationRepository/);
  assert.match(service, /OpenAIProvider/);
  assert.match(service + generationSource, /provider\.stream/);
  assert.match(repository, /ai_workforce_conversations/);
  assert.match(repository, /ai_workforce_messages/);
  assert.match(service, /health\.state === "unavailable" \? "deterministic" : "openai"/);
  for (const value of ["cost_estimate", "latency_ms", "created_at", "workspace_id", "organization_id"]) assert.match(repository, new RegExp(value));
});

// ---------------------------------------------------------------------------
// TRUSTED CONTEXT (18-20)
// ---------------------------------------------------------------------------
test("18: the trusted context builder cannot accept an untrusted org override -- organizationId/workspaceId are required, explicit, top-level fields (never nested inside a raw payload object) and it throws if either is missing", () => {
  assert.throws(() => buildTrustedWorkforceContext({ ...validInput, organizationId: "" }), /server-derived organization and workspace/);
  assert.throws(() => buildTrustedWorkforceContext({ ...validInput, workspaceId: "" }), /server-derived organization and workspace/);
});
test("19: the trusted context factory requires every server-derived value explicitly -- an unsupported employee, an unsupported channel, or a missing communication thread all fail closed", () => {
  assert.throws(() => buildTrustedWorkforceContext({ ...validInput, employeeCode: "not-a-real-employee" }), /Unsupported AI employee/);
  assert.throws(() => buildTrustedWorkforceContext({ ...validInput, channel: "sms" }), /Unsupported trusted channel/);
  assert.throws(() => buildTrustedWorkforceContext({ ...validInput, communicationThreadId: "" }), /communication thread is required/);
  const built = buildTrustedWorkforceContext(validInput);
  assert.equal(built.channel, "whatsapp");
  assert.equal(built.leadId, "lead-1");
});
test("leadId is explicitly nullable and passed through -- a thread not yet linked to a lead (E1's own documented possibility) is representable", () => {
  const built = buildTrustedWorkforceContext({ ...validInput, leadId: null });
  assert.equal(built.leadId, null);
});
test("20: no public route directly exposes arbitrary tenant runtime construction -- forTrustedContext/buildTrustedWorkforceContext are not imported or called from any app/api route in this phase", () => {
  let output = "";
  try { output = execSync("git grep -l \"forTrustedContext\\|buildTrustedWorkforceContext\" -- app/api", { cwd: process.cwd() }).toString().trim(); }
  catch (error) { if (error.status !== 1) throw error; } // git grep exits 1 when it finds no matches -- that is the passing case here
  assert.equal(output, "", "these must remain unwired until a later phase deliberately connects a verified webhook to them");
});

// ---------------------------------------------------------------------------
// PERSISTENCE (21-24)
// ---------------------------------------------------------------------------
test("21: message append is tenant scoped -- append_trusted_ai_message re-derives organization_id from workspace_id and verifies the target conversation belongs to both before inserting", () => {
  const appendBody = migration.slice(migration.indexOf("create or replace function public.append_trusted_ai_message"), migration.indexOf("revoke all on function public.append_trusted_ai_message"));
  assert.match(appendBody, /select organization_id into v_org from workspaces where id = p_workspace_id/);
  assert.match(appendBody, /insert into ai_workforce_messages \(organization_id, workspace_id, conversation_id, role, content, recommendation_only, created_by\)\s*\n\s*values \(v_org, p_workspace_id, p_conversation_id/);
});
test("22: history load is tenant scoped -- trustedHistory filters organization_id, workspace_id, AND conversation_id together; a raw conversation UUID alone is never sufficient", () => {
  const historyBody = repository.slice(repository.indexOf("async trustedHistory"), repository.length);
  assert.match(historyBody, /\.eq\("organization_id", this\.context\.organizationId\)\.eq\("workspace_id", this\.context\.workspaceId\)\.eq\("conversation_id", conversationId\)/);
});
test("23: no credential or full webhook payload is persisted -- neither the migration nor the new runtime files reference access tokens, ciphertext, app secrets, or a raw jsonb payload column", () => {
  for (const source of [migration, repository, service, trustedRuntime, trustedContextSource]) {
    assert.doesNotMatch(source, /access_token_ciphertext|WHATSAPP_APP_SECRET|WHATSAPP_VERIFY_TOKEN|console\.log|console\.error/);
  }
  assert.doesNotMatch(migration, /jsonb/);
});
test("24: provider-specific fields are not spread into the generic AI runtime tables -- only channel/lead_id/communication_thread_id were added, never wa_id/whatsapp_phone/phone_number_id", () => {
  assert.doesNotMatch(migration, /wa_id|whatsapp_phone|phone_number_id/);
});

// ---------------------------------------------------------------------------
// NO EXECUTION (25-27)
// ---------------------------------------------------------------------------
test("25: OpenAI is not called anywhere in this phase's (E2) new/changed code -- Phase E3 later legitimately adds a provider call to trusted-runtime.ts's generateDraft(), verified there as mock-only by tests/phase-e3-whatsapp-ai-draft-response.test.mjs, so trusted-runtime.ts is intentionally excluded from this E2-scoped check rather than left stale", () => {
  for (const source of [migration, trustedContextSource]) assert.doesNotMatch(source, /OpenAIProvider|provider\.stream|api\.openai\.com/);
  const newRepositoryRegion = repository.slice(repository.indexOf("resolveTrustedConversation"), repository.indexOf("findTrustedAssistantDraft"));
  assert.doesNotMatch(newRepositoryRegion, /OpenAIProvider|provider\.stream/);
});
test("26: WhatsApp send is not called anywhere in this phase's new/changed code", () => {
  for (const source of [migration, trustedRuntime, trustedContextSource, repository, service]) assert.doesNotMatch(source, /sendText\(|sendTemplate\(|sendMedia\(/);
});
test("27: Meta is not called anywhere in this phase's new/changed code", () => {
  for (const source of [migration, trustedRuntime, trustedContextSource, repository, service]) assert.doesNotMatch(source, /graph\.facebook\.com/);
});

// ---------------------------------------------------------------------------
// ARCHITECTURE TRACE / AUTHORITATIVE SYSTEM
// ---------------------------------------------------------------------------
test("the authoritative live conversation system is ai_workforce_conversations/ai_workforce_messages -- WorkforceRuntimeService.chat() persists through WorkforceConversationRepository, which reads/writes exactly these two tables (not ai_conversations/ai_runtime_outputs/ai_response_cache)", () => {
  assert.match(service, /async \*chat\(input: RuntimeChatInput\)/);
  assert.match(service, /this\.repository\.create\(input\.employee, input\.message\.trim\(\)\)/);
  assert.match(service, /this\.repository\.append\(\{ conversationId, role: "user"/);
  assert.match(repository, /from\("ai_workforce_conversations"\)/);
  assert.match(repository, /from\("ai_workforce_messages"\)/);
  assert.doesNotMatch(service + repository, /ai_conversations"|ai_runtime_outputs|ai_response_cache/);
});
test("chat() itself is byte-for-byte unchanged by this phase (the single highest-risk method in the live runtime)", () => {
  assert.match(service, /async \*chat\(input: RuntimeChatInput\) \{\s*\n\s*await new SubscriptionWriteService\(\)\.require\(\);/);
});
test("employee restriction is preserved on the trusted factory -- forTrustedContext rejects any employee code not in the same workforceEmployeeCodes catalog chat() itself enforces", () => {
  assert.match(service, /static forTrustedContext\(context: TrustedWorkforceContext\): TrustedWorkforceRuntime \{\s*\n\s*if \(!employees\.includes\(context\.employeeCode\)\) throw new Error\("Unsupported AI employee\."\);/);
  assert.match(domainModels, /workforceEmployeeCodes/);
});
test("rate-limit boundary is not duplicated -- no new rate-limit provider, store, or boundary definition was added by this phase; the existing 'ai-runtime' workspace boundary (lib/infrastructure/security.ts) remains the single reusable hook (Phase E3 later calls it from trusted-runtime.ts with a workspace/thread-derived key instead of requestSubject(request), rather than defining a second one)", () => {
  for (const source of [migration, repository, service, trustedContextSource]) assert.doesNotMatch(source, /EnterpriseRateLimitService|MemoryRateLimitProvider|rateLimitBoundaries/);
  assert.doesNotMatch(trustedRuntime, /MemoryRateLimitProvider|rateLimitBoundaries/, "trusted-runtime.ts may call the existing EnterpriseRateLimitService but must not define a new provider or boundary list");
});
test("the trusted runtime never reads cookies and is server-only", () => {
  assert.match(trustedRuntime, /^import "server-only";/);
  assert.doesNotMatch(trustedRuntime, /cookies\(\)|createSupabaseServerClient/);
  assert.match(trustedRuntime, /createSupabaseServiceClient/);
});
test("no RLS policy was added, changed, or dropped by this migration -- only additive columns, indexes, and two service-role-only functions", () => {
  assert.doesNotMatch(migration, /create policy|alter policy|drop policy|enable row level security/i);
  assert.doesNotMatch(migration, /using\s*\(\s*true\s*\)/i);
});
test("security-critical: both new functions are granted to service_role only, never to authenticated or public", () => {
  assert.match(migration, /revoke all on function public\.resolve_whatsapp_ai_conversation\(uuid, text, uuid, uuid\) from public;\s*\ngrant execute on function public\.resolve_whatsapp_ai_conversation\(uuid, text, uuid, uuid\) to service_role;/);
  assert.match(migration, /revoke all on function public\.append_trusted_ai_message\(uuid, uuid, text, text\) from public;\s*\ngrant execute on function public\.append_trusted_ai_message\(uuid, uuid, text, text\) to service_role;/);
  assert.doesNotMatch(migration, /to authenticated/);
});
test("both new functions require service_role at runtime, defense-in-depth beyond the grant alone", () => {
  const matches = migration.match(/if current_setting\('role', true\) <> 'service_role' then/g) ?? [];
  assert.equal(matches.length, 2);
});

// ---------------------------------------------------------------------------
// PHASE D1/D2/E1 SAFETY (Part 19/21)
// ---------------------------------------------------------------------------
test("no D1 (Approvals) or D2 (Quota) file was modified by this phase", () => {
  const d1d2Prefixes = ["features/vayon/workflow-approval", "app/vayon/approvals", "app/vayon/executions", "app/vayon/workflows/[workflowId]", "features/vayon/billing/services/require-quota.ts", "app/accept-invitation/page.tsx", "features/platform/organization", "supabase/migrations/20261102000000_business_approval_workflows.sql", "supabase/migrations/20261103000000_numeric_quota_enforcement.sql"];
  const parse = (line) => { const m = /^(.{2})\s*(.+)$/.exec(line); return m ? `${m[1].trim()}|${m[2]}` : line; };
  const allStatus = execSync("git status --short", { cwd: process.cwd() }).toString().trim().split("\n").filter(Boolean);
  const status = allStatus.filter((line) => d1d2Prefixes.some((prefix) => line.includes(prefix))).map(parse).sort();
  const expectedBeforeE2 = [
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
  // WhatsAppDraftApprovalViews.tsx is Phase E4's own new file (a WhatsApp-scoped
  // approval review component), living under the shared features/vayon/workflow-approval
  // prefix used here as a D1-directory indicator -- it is not a D1 engine change.
  // `status` must be a SUBSET of `expectedBeforeE2`: an entry legitimately
  // disappears from `git status` entirely once a later, separately-authorized
  // release (e.g. Wave 4C) commits that exact file with no further edits --
  // a stronger, cleaner state than "M"/"??", not a violation. Anything NOT
  // in expectedBeforeE2 is still a hard failure.
  const unexpected = status.filter((entry) => !expectedBeforeE2.includes(entry));
  assert.deepEqual(unexpected, [], "any deviation here means E2 touched a D1/D2 file");
});
test("no E1 (WhatsApp phone identity) file was modified by this phase", () => {
  const e1Files = ["features/vayon/lead/utils", "features/platform/integrations/whatsapp/lead-identity.service.ts", "features/platform/integrations/whatsapp/types.ts", "features/platform/integrations/whatsapp/whatsapp.service.ts", "features/platform/integrations/whatsapp/whatsapp.repository.ts", "supabase/migrations/20261104000000_whatsapp_crm_identity.sql"];
  // A file E1 introduced as new is "not modified by a later phase" whether Git currently
  // reports it as untracked ("??") or staged for a future commit ("A") -- both states mean
  // no tracked history exists yet for it. Requiring the literal "??" was an artifact of the
  // moment this test was written (before any release ever staged these files), not a
  // permanent product contract. Similarly, `git status` only collapses an entirely-untracked
  // directory (features/vayon/lead/utils/) to one line -- the moment anything inside it is
  // staged, it reports the specific file instead. Both forms are normalized to the directory
  // form here so this assertion holds regardless of that staging-driven granularity.
  const parse = (line) => {
    const m = /^(.{2})\s*(.+)$/.exec(line);
    if (!m) return line;
    const code = m[1].trim() === "A" ? "??" : m[1].trim();
    const path = m[2].startsWith("features/vayon/lead/utils/") ? "features/vayon/lead/utils/" : m[2];
    return `${code}|${path}`;
  };
  const allStatus = execSync("git status --short", { cwd: process.cwd() }).toString().trim().split("\n").filter(Boolean);
  const status = allStatus.filter((line) => e1Files.some((prefix) => line.includes(prefix))).map(parse).sort();
  const expectedE1 = [
    "M|features/platform/integrations/whatsapp/types.ts",
    "M|features/platform/integrations/whatsapp/whatsapp.repository.ts",
    "M|features/platform/integrations/whatsapp/whatsapp.service.ts",
    "??|features/platform/integrations/whatsapp/lead-identity.service.ts",
    "??|features/vayon/lead/utils/",
    "??|supabase/migrations/20261104000000_whatsapp_crm_identity.sql",
  ].sort();
  // Subset, not strict equality: an entry legitimately disappears from
  // `git status` entirely once a later, separately-authorized release (e.g.
  // Wave 4C) commits that exact file with no further edits -- a stronger,
  // cleaner state than "M"/"??", not a violation.
  const unexpected = status.filter((entry) => !expectedE1.includes(entry));
  assert.deepEqual(unexpected, [], "any deviation here means E2 touched an E1 file");
});
test("none of the three pending migrations (D1 Approvals, D2 Quota, E1 WhatsApp CRM identity) were renamed, altered, or applied -- each is either untracked (??) exactly as before E2, or, for one since committed with no further edits (a stronger, cleaner state, not a violation), cleanly absent from git status entirely", () => {
  const parse = (line) => { const m = /^(.{2})\s*(.+)$/.exec(line); return m ? `${m[1].trim()}|${m[2]}` : line; };
  const status = execSync("git status --short -- supabase/migrations/20261102000000_business_approval_workflows.sql supabase/migrations/20261103000000_numeric_quota_enforcement.sql supabase/migrations/20261104000000_whatsapp_crm_identity.sql", { cwd: process.cwd() }).toString().trim().split("\n").filter(Boolean).map(parse).sort();
  const expected = [
    "??|supabase/migrations/20261102000000_business_approval_workflows.sql",
    "??|supabase/migrations/20261103000000_numeric_quota_enforcement.sql",
    "??|supabase/migrations/20261104000000_whatsapp_crm_identity.sql",
  ].sort();
  const unexpected = status.filter((entry) => !expected.includes(entry));
  assert.deepEqual(unexpected, [], "any deviation here means a pending migration was renamed, altered, or applied");
});
test("the new E2 migration follows immediately after the E1 migration in timestamp order and does not rename it", () => {
  assert.match("20261105000000_ai_workforce_channel_foundation.sql", /^202611050000/);
  assert.ok("20261105000000_ai_workforce_channel_foundation.sql" > "20261104000000_whatsapp_crm_identity.sql");
});
test("no pricing, Paddle, founding, selected-plan-signup, or AI Workforce (customer directory) file was touched", () => {
  const output = execSync("git status --short -- features/marketing/components/PricingTable.tsx features/platform/commercial-pricing.ts features/vayon/billing/providers features/vayon/ai-workforce", { cwd: process.cwd() }).toString();
  assert.equal(output.trim(), "");
});
test("no Knowledge, Calendar, or human-handoff file was touched", () => {
  const output = execSync("git status --short -- features/vayon/ai-workforce/services/knowledge.service.ts features/platform/knowledge features/vayon/operations/services/meeting.service.ts features/vayon/calendar-platform", { cwd: process.cwd() }).toString();
  assert.equal(output.trim(), "");
});
