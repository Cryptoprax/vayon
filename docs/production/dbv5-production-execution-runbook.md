# DBV5 — Production Execution Runbook

**Status: NOT YET AUTHORIZED FOR EXECUTION.** This document is a plan only. No
step in this runbook has been executed against Production. Every command
below uses placeholders (`$PRODUCTION_DATABASE_URL`, etc.) and must never be
filled in with a real secret inside this file, in a commit, or in any
non-secret-storage location.

This runbook is the output of the DBV0→DBV4B validation chain: a 78→82-
migration fresh-chain audit and repair, a Production read-only schema/ACL
reconciliation, two Production-compatibility migrations (DBV3B, DBV3C) and an
application read-fix (DBV3D), a wave-by-wave Production design (DBV4), and a
full staging rehearsal (DBV4B) that exercised every wave against a disposable,
Production-shape database built from Production's own verified pre-D1
baseline. DBV4B's one finding — a wave-sequencing defect, not a code defect —
is corrected in this runbook (Part 1).

---

## 0. Prerequisites (must all be true before Wave 0 begins)

1. This runbook has been reviewed line-by-line by a human operator (see the
   self-audit in §14) and explicitly authorized for execution as a separate
   act from authoring it.
2. The Production DB password that was previously exposed in a screenshot has
   been **rotated**. See §5.
3. `C:\Temp\vayon-prod-db.txt` has been deleted or overwritten so it no
   longer contains the old, now-revoked connection string.
4. The operator has independently confirmed Supabase PITR/backup is active
   for the Production project (§7 — do not assume this; confirm it).
5. The operator has `psql` available and a way to source
   `$PRODUCTION_DATABASE_URL` into their shell environment without writing it
   to disk in this repository or pasting it into any AI tool, chat, or log.
6. A maintenance/low-traffic window has been chosen (§22).
7. Vercel access is available to record the current deployment and to roll
   back to it if needed (§17–§18).

---

## 1. Corrected Final Wave Order

DBV4B proved that `resolve_or_create_meta_lead_crm_identity` (M5) reads
`leads.normalized_phone`, a column that only `20261104000000_whatsapp_crm_identity.sql`
(E1) creates. The DBV4 plan placed M-series (Wave 2) before E-series
(Wave 3), which would leave M5 — and its dependents M6/M7 — broken for the
entire window between those two waves on Production. DBV4B confirmed this
by direct execution: M5 failed with `column "normalized_phone" does not
exist` before E1, and succeeded on the identical staging row immediately
after E1 landed, with zero code change. This is a **wave-plan sequencing
fix**, not a migration or application fix — no file listed below is modified
by this runbook.

Corrected order:

| Wave | Contents |
|---|---|
| **0** | Production safety/preflight only — no mutation |
| **1** | D1 + DBV5E (D1 approval RPC ACL hardening) + K1 + DBV5G (K1 property-knowledge RPC ACL hardening) + K2 + DBV5H (K2 extraction RPC ACL hardening) + K3 + DBV5I (K3 authoritative-facts RPC ACL hardening) + K4 + DBV5J (K4 retrieval RPC ACL hardening) + K5 — **D1+DBV5E, K1+DBV5G, K2+DBV5H, K3+DBV5I, and K4+DBV5J are each one tightly-coupled unit; there is no human-GO checkpoint within any of the five pairs** (see §10) |
| **2** | D2 + DBV6A-D2 (D2 seat-RPC ACL hardening) + M1/M2 + DBV6A-META (M1/M2 connection/mapping RPC ACL hardening) + M3 + DBV6A-M3 (M3 webhook RPC ACL hardening, service-role-only) **only** — **D2+DBV6A-D2, M1/M2+DBV6A-META, and M3+DBV6A-M3 are each one tightly-coupled unit; there is no human-GO checkpoint within any of the three pairs** (see §11) |
| **3A** | E1 + DBV6B-E1 + E2 + DBV6B-E2 + E3 + DBV6B-E3 + E4 + DBV6B-E4 + E5 + DBV6B-E5 + E6 + DBV6B-E6, in that order — **each E-phase + its hardening is one tightly-coupled unit; there is no human-GO checkpoint within any of the six pairs** (see §12) |
| **3B** | M4 → M5 → M6 → M7 → M8, in that order — **only after Wave 3A (specifically E1) has completed and been verified** |
| **4A** | DBV3B (`20261130000000_creative_property_compatibility.sql`) |
| **4B** | DBV3C (`20261201000000_campaign_stack_property_compatibility.sql`) |
| **4C** | Application deploy (current DBV3D-compatible build) |
| **5** | SEC2 (`20261129000000_...`) **then** DBV1E (`20261128000000_...`) — intentionally reversed from filename/timestamp order; see §19 |

The explicit dependency this order encodes:

```
E1 (20261104000000_whatsapp_crm_identity.sql)
  creates leads.normalized_phone
    │
    ▼
M4, M5, M6, M7, M8   (Wave 3B — may not execute before this line is satisfied)
```

---

## 2. Exact Migration Filenames Per Wave

All filenames below were verified against the repository at
`supabase/migrations/` immediately before this runbook was authored.

**WAVE 1**
```
20261102000000_business_approval_workflows.sql          (D1)
20261102010000_d1_approval_rpc_acl_hardening.sql         (DBV5E -- must execute
                                                           immediately after D1,
                                                           before K1; see §10)
20261110000000_property_knowledge_documents.sql          (K1)
20261110010000_k1_property_knowledge_rpc_acl_hardening.sql (DBV5G -- must execute
                                                           immediately after K1,
                                                           before K2; see §10)
20261111000000_property_knowledge_extraction.sql         (K2)
20261111010000_k2_property_knowledge_extraction_acl_hardening.sql (DBV5H --
                                                           must execute
                                                           immediately after
                                                           K2, before K3;
                                                           see §10)
20261112000000_property_authoritative_facts.sql          (K3)
20261112010000_k3_authoritative_facts_acl_hardening.sql  (DBV5I -- must execute
                                                           immediately after
                                                           K3, before K4;
                                                           see §10)
20261113000000_property_knowledge_retrieval.sql          (K4)
20261113010000_k4_property_knowledge_retrieval_acl_hardening.sql (DBV5J --
                                                           must execute
                                                           immediately after
                                                           K4, before K5;
                                                           see §10)
20261114000000_ai_workforce_knowledge_sources.sql        (K5)
```

**WAVE 2**
```
20261103000000_numeric_quota_enforcement.sql            (D2)
20261103010000_d2_numeric_quota_acl_hardening.sql       (DBV6A-D2 -- must
                                                           execute immediately
                                                           after D2, before
                                                           M1/M2; see §11)
20261115000000_meta_marketing_connection.sql            (M1/M2)
20261115010000_meta_marketing_connection_acl_hardening.sql (DBV6A-META --
                                                           must execute
                                                           immediately after
                                                           M1/M2, before M3;
                                                           see §11)
20261116000000_meta_leadgen_webhook.sql                 (M3)
20261116010000_meta_leadgen_webhook_acl_hardening.sql   (DBV6A-M3 -- must
                                                           execute immediately
                                                           after M3; see §11)
```

**WAVE 3A**
```
20261104000000_whatsapp_crm_identity.sql                (E1)
20261104010000_e1_whatsapp_crm_identity_acl_hardening.sql (DBV6B-E1 --
                                                           must execute
                                                           immediately after
                                                           E1, before E2;
                                                           see §12)
20261105000000_ai_workforce_channel_foundation.sql      (E2)
20261105010000_e2_ai_workforce_channel_acl_hardening.sql (DBV6B-E2 --
                                                           must execute
                                                           immediately after
                                                           E2, before E3;
                                                           see §12)
20261106000000_whatsapp_ai_draft_response.sql            (E3)
20261106010000_e3_whatsapp_ai_draft_acl_hardening.sql    (DBV6B-E3 --
                                                           must execute
                                                           immediately after
                                                           E3, before E4;
                                                           see §12)
20261107000000_whatsapp_ai_draft_approval.sql            (E4)
20261107010000_e4_whatsapp_ai_approval_acl_hardening.sql (DBV6B-E4 --
                                                           must execute
                                                           immediately after
                                                           E4, before E5;
                                                           see §12)
20261108000000_whatsapp_ai_send_execution.sql            (E5)
20261108010000_e5_whatsapp_send_execution_acl_hardening.sql (DBV6B-E5 --
                                                           must execute
                                                           immediately after
                                                           E5, before E6;
                                                           see §12)
20261109000000_whatsapp_send_uncertainty.sql             (E6)
20261109010000_e6_whatsapp_send_uncertainty_acl_hardening.sql (DBV6B-E6 --
                                                           must execute
                                                           immediately after
                                                           E6; see §12)
```

**WAVE 3B**
```
20261117000000_meta_lead_detail_staging.sql              (M4)
20261117010000_m4_meta_lead_detail_staging_acl_hardening.sql (DBV6C-M4 --
                                                           must execute
                                                           immediately after
                                                           M4, before M5;
                                                           see §14)
20261118000000_meta_lead_crm_ingestion.sql               (M5)
20261118010000_m5_meta_lead_crm_ingestion_acl_hardening.sql (DBV6C-M5 --
                                                           must execute
                                                           immediately after
                                                           M5, before M6;
                                                           see §14)
20261119000000_meta_lead_consent.sql                     (M6)
20261119010000_m6_meta_lead_consent_acl_hardening.sql    (DBV6C-M6 --
                                                           must execute
                                                           immediately after
                                                           M6, before M7;
                                                           see §14)
20261120000000_meta_lead_whatsapp_outreach.sql            (M7)
20261120010000_m7_meta_lead_whatsapp_outreach_acl_hardening.sql (DBV6C-M7 --
                                                           must execute
                                                           immediately after
                                                           M7, before M8;
                                                           see §14)
20261121000000_whatsapp_consent_revocation.sql            (M8)
20261121010000_m8_whatsapp_consent_revocation_acl_hardening.sql (DBV6C-M8 --
                                                           must execute
                                                           immediately after
                                                           M8; see §14)
```

**WAVE 4A**
```
20261130000000_creative_property_compatibility.sql       (DBV3B)
```

**WAVE 4B**
```
20261201000000_campaign_stack_property_compatibility.sql (DBV3C)
```

**WAVE 4C** — application deploy only, no SQL file.

**WAVE 5** (intentionally executed in this order, not filename order)
```
20261202000000_provision_workspace_billing_acl_hardening.sql  (WAVE5A, first)
20261129000000_sensitive_rpc_acl_hardening.sql                 (SEC2, second)
20261128000000_service_role_acl_hardening.sql                  (DBV1E, third)
```

Total: **43 SQL files** applied to Production across Waves 1–5, plus one
application deploy (Wave 4C). (Historical note: this total was 38 as of
Wave 3A's completion, before DBV6C added Wave 3B's five ACL hardening
files.)

---

## 3. Excluded Migrations — DO NOT APPLY RAW TO PRODUCTION

```
20261122000000_creative_campaign_property_alignment.sql   (C1)
20261123000000_campaign_strategist.sql                     (C2)
20261124000000_campaign_creative_packages.sql              (C3)
20261125000000_campaign_image_generation.sql               (C4)
20261127000000_campaign_meta_lead_forms.sql                (C6)
```

These five files remain the correct, unmodified fresh-database historical
chain (still applied normally, in filename order, on any fresh install or
CI/local replay). They must **never** be applied to Production directly: all
five reference `property_project_id`, a column Production will never have
under the compatibility path (DBV3B deliberately keeps `project_id` instead).
Production's replacement path for everything these five files do is
**Wave 4A (DBV3B) then Wave 4B (DBV3C)** — confirmed by direct execution in
DBV4B to reproduce every C1/C2/C3/C4/C6 effect Production needs, using
`project_id` in place of `property_project_id`, with zero raw C1/C2/C3/C4/C6
application. Do not edit any of these five files under any circumstance.

---

## 4. Migration History — Explicit Prohibition

Production has no usable Supabase migration history
(`supabase_migrations.schema_migrations` does not exist; the custom
`public.deployment_migration_history` table exists but has 0 rows and is not
used by this runbook either). Therefore, for this entire runbook:

- **Do NOT** run `supabase db push` against Production.
- **Do NOT** run `supabase migration repair`.
- **Do NOT** `INSERT` into `supabase_migrations.schema_migrations`.
- **Do NOT** `INSERT` into `public.deployment_migration_history`.

Every migration in this runbook is applied via direct, manually-reviewed SQL
file execution (§8). Establishing real Supabase CLI migration history is a
**separate, later, separately-authorized phase**, performed only after
Production is fully stabilized on this wave sequence and independently
verified to match the local 96-migration baseline exactly (see §27).

---

## 5. Production Credential Safety

This runbook and every command in it uses placeholders only:

- `$PRODUCTION_DATABASE_URL` — the Production Postgres connection string,
  sourced into the operator's shell from their own secret manager or local
  credential store. Never written to a file in this repository.

None of the following may ever appear in this file, in any commit, in any AI
conversation, or in any log this runbook produces:

- Database password / connection string
- Supabase service-role key
- Paddle secrets
- Meta secrets
- WhatsApp access tokens
- OpenAI API keys
- `CRON_SECRET`

**Mandatory pre-execution security task (documented here, not performed by
this phase):**

1. **Rotate** the Production database password that was previously exposed in
   a screenshot during this engagement's earlier troubleshooting.
2. After rotation, confirm `C:\Temp\vayon-prod-db.txt` either no longer
   exists or no longer contains the old/full Production connection string;
   delete or overwrite it.
3. Re-derive `$PRODUCTION_DATABASE_URL` from the rotated credential before
   Wave 0 begins.

This runbook does **not** perform the rotation or deletion — it documents
them as a hard prerequisite (§0.2–§0.3).

---

## 6. Wave 0 — Preflight (no mutation)

Run every check below before any wave begins. All are read-only.

1. ☐ Production DB password rotated (§5).
2. ☐ `C:\Temp\vayon-prod-db.txt` no longer contains the old connection string.
3. ☐ Supabase backup/PITR status confirmed **by the operator directly in the
   Supabase dashboard/API** — do not assume it exists (§7 is a hard gate).
4. ☐ Current schema snapshot captured:
   ```
   pg_dump "$PRODUCTION_DATABASE_URL" --schema-only --no-owner --no-privileges > preflight-schema-snapshot.sql
   ```
   Store this file outside the repository, e.g. in the operator's own secure
   backup location — never commit it.
5. ☐ Current definitions of every function about to be replaced captured:
   ```sql
   select pg_get_functiondef(p.oid)
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('accept_organization_invitation', 'process_whatsapp_message',
                        'complete_creative_generation', 'advance_creative_campaign');
   ```
6. ☐ Current ACL snapshot captured for the DBV1E (20) + SEC2 (12) target
   function names (see §19 for the list) via `has_function_privilege`.
7. ☐ Current row counts captured for: `organizations`, `workspaces`,
   `organization_members`, `workspace_members`, `properties`, `leads`,
   `deals`, `subscriptions`, `invoices`, `communications`.
8. ☐ **Creative row counts reconfirmed ZERO**:
   ```sql
   select
     (select count(*) from public.creative_campaigns) as creative_campaigns,
     (select count(*) from public.creative_assets) as creative_assets,
     (select count(*) from public.creative_generation_jobs) as creative_generation_jobs,
     (select count(*) from public.creative_timeline) as creative_timeline,
     (select count(*) from public.creative_campaign_packs) as creative_campaign_packs;
   ```
   **STOP the entire rollout if any value is non-zero** — this invalidates
   DBV3B's empty-data guard assumption and requires a new DBV3-series design
   phase before proceeding, not a runbook edit.
9. ☐ `property_projects` row count reconfirmed ZERO (same STOP condition).
10. ☐ No active/transient WhatsApp send execution in a state requiring special
    handling (`select * from public.whatsapp_ai_send_executions where status
    not in ('completed','failed')` — table does not exist pre-Wave-3A, so
    this check only applies from Wave 3A onward).
11. ☐ No active Meta ingestion jobs in a transient state (table does not
    exist pre-Wave-2/3B; check applies once M4's table exists).
12. ☐ Billing/webhook health checked: confirm `billing_events`/webhook
    processing shows no backlog or elevated failure rate in the hours before
    this window.
13. ☐ Current Vercel deployment ID recorded.
14. ☐ Rollback Vercel deployment identified and confirmed deployable.
15. ☐ Provider write flags confirmed disabled: `META_MARKETING_WRITES_ENABLED=false`
    (and any equivalent WhatsApp-send/OpenAI/Sora/Paddle-live flags) in the
    current Production environment configuration.
16. ☐ Current git HEAD recorded (`git rev-parse HEAD`).
17. ☐ SHA-256 checksum of each of the 43 SQL files in §2 recorded, so any
    file substitution between planning and execution is detectable:
    ```
    sha256sum supabase/migrations/<file>.sql
    ```

    **Wave 5 authoritative baselines (established WAVE5A, local-only content
    review + passing regression suite + real disposable-Postgres replay —
    see Wave 5A report for full method):**
    ```
    20261202000000_provision_workspace_billing_acl_hardening.sql (WAVE5A)
      389e5ab0c1e76d7c183f44bd6977378554e87b89fd6f8e6e451cf23cf98fc867
    20261129000000_sensitive_rpc_acl_hardening.sql (SEC2)
      df291ce6356734f8a0080b7e75c0aefdfeec76a1382ca5fff5507fc3ddf48494
    20261128000000_service_role_acl_hardening.sql (DBV1E)
      f54b5baef4d2aa51fbd1632266ca4d20a0cdd7d87c453cbb9a34104fa122ccc3
    ```
    These three values are the required Production execution baselines for
    Wave 5. Recompute and compare before applying any of the three; do not
    proceed on a mismatch.

**STOP the rollout, do not proceed to Wave 1, if:**
- Any Creative-table or `property_projects` row count is non-zero.
- Production schema has materially drifted from what DBV2/DBV4/DBV4B
  observed (e.g., a new manually-applied billing function not seen before,
  a table/column DBV5 expects to create already exists in a different
  shape).
- Backup/PITR cannot be confirmed active.

---

## 7. Backup Gate (hard stop)

Before the first mutating statement of Wave 1:

```
BACKUP/PITR VERIFIED = YES / NO
```

This must be answered `YES` by a human operator who has personally checked
the Supabase project's backup/PITR status in the dashboard or via the
management API — **not** inferred from `pg_stat_archiver`/`wal_level` alone
(those confirm WAL archiving is active, which DBV4 already observed, but do
not by themselves confirm a restorable backup/PITR window of adequate
length). If the answer is `NO` or cannot be obtained with confidence: **STOP.
Do not proceed to Wave 1.**

---

## 8. Execution Method

Every migration file is applied individually via `psql`, never through
`supabase db push`. Windows/PowerShell form:

```powershell
$env:PRODUCTION_DATABASE_URL = "<sourced from your own secret manager, never pasted here>"
psql $env:PRODUCTION_DATABASE_URL -v ON_ERROR_STOP=1 -f "supabase/migrations/<exact-filename>.sql"
```

POSIX/bash form (if executing from a POSIX shell instead):

```bash
psql "$PRODUCTION_DATABASE_URL" \
  -v ON_ERROR_STOP=1 \
  -f "supabase/migrations/<exact-filename>.sql"
```

`ON_ERROR_STOP=1` ensures `psql` exits non-zero and halts on the first SQL
error rather than continuing past it. Every one of the 43 files in §2 is
already wrapped in its own `begin; ... commit;` (confirmed by direct
inspection of each file), so a mid-file failure rolls back that file's own
changes automatically — but `ON_ERROR_STOP=1` is still required so the
*operator* (or an orchestrating script) does not proceed to the next file
after a failure.

This runbook does not execute this command. It documents the exact,
reusable invocation for the human operator to run manually, once, per file,
per §9.

---

## 9. One File At A Time

Even within a wave, apply exactly one migration file, then verify, then
continue. Never concatenate multiple files into one script or one `psql`
invocation. For every file below:

```
PRECHECK  → confirm dependency + current shape
EXECUTE   → the psql command from §8 with that one filename
VERIFY    → the queries listed for that file
STOP IF   → the listed stop condition is met
```

---

## 10. Wave 1 — D1 + K1–K5

**D1+DBV5E, K1+DBV5G, K2+DBV5H, K3+DBV5I, and K4+DBV5J are each ONE opening
unit, not independently sign-offable steps.** DBV5C found (and DBV5D/DBV5E
independently confirmed by direct code audit and real Postgres/PostgREST
execution) that D1's four approval RPCs are anon-executable immediately
after D1 alone applies -- D1's own grant block revokes from PUBLIC but
never from anon, and this project's default-privilege rule grants anon
EXECUTE by name at function-creation time regardless. The identical gap
recurred for K1: its own four RPCs were confirmed anon-executable in the
real Production postcheck run immediately after K1 applied, for the same
reason (K1's own grant block also never revokes from anon), and DBV5G
closed it the same way. DBV5H then found the identical gap a third time by
direct repository audit of K2 **before** K2 was ever applied to Production
-- K2's own grant block has the same "revoke from public, grant to
authenticated" shape and never revokes from anon -- and pre-hardened it,
so K2's three extraction RPCs never have an anon-exposure window on
Production at all. DBV5I then found the same gap a fourth time by direct
repository audit of K3, again proactively before K3 reaches Production --
K3's own grant blocks never revoke from anon for any of its five
functions, and two of the five (`current_property_price`,
`list_property_price_revisions`) are SECURITY INVOKER read functions that
K3 itself already explicitly grants to both `authenticated` and
`service_role`, a structurally different shape from D1/K1/K2's SECURITY
DEFINER writes -- DBV5I's audit confirmed `current_property_price` has a
genuine service_role caller (K6's webhook-triggered
`TrustedWorkforceRuntime`) and preserved that grant, while hardening all
five against anon. DBV5J then found the same gap a fifth time by direct
repository audit of K4, again proactively before K4 reaches Production --
K4's single `search_property_knowledge_documents` function is also a
SECURITY INVOKER read function already explicitly granted to both
`authenticated` and `service_role` in K4's own base migration, and DBV5J's
audit confirmed it shares the exact same dual caller as K3's
`current_property_price` (the same `retrievePropertyKnowledge()` core, and
therefore the same K6 webhook-triggered `TrustedWorkforceRuntime` service_role
caller), so that grant was likewise preserved while hardening against anon.
There is deliberately **no human-GO checkpoint between File 1 (D1) and
File 2 (DBV5E)**, likewise **no human-GO checkpoint between File 3 (K1)
and File 4 (DBV5G)**, likewise **no human-GO checkpoint between File 5
(K2) and File 6 (DBV5H)**, likewise **no human-GO checkpoint between File
7 (K3) and File 8 (DBV5I)**, and likewise **no human-GO checkpoint between
File 9 (K4) and File 10 (DBV5J)** -- apply each pair back to back, verify
the combined result, then take the human-GO before the next file. Treating
any of D1, K1, K2, K3, or K4 alone as "done" and pausing before its own
hardening file would leave that file's functions anon-executable on live
Production for however long the pause lasts.

| Order | File | Precheck | Verify | Stop if |
|---|---|---|---|---|
| 1 | `20261102000000_business_approval_workflows.sql` | `approval_requests`/`approval_events` absent | `select to_regclass('public.approval_requests'), to_regclass('public.approval_events');` both non-null; `select rowsecurity from pg_tables where tablename in ('approval_requests','approval_events');` both true | tables absent after apply, or RLS false |
| 2 | `20261102010000_d1_approval_rpc_acl_hardening.sql` | File 1 (D1) just applied; no human-GO taken yet | `select p.proname, has_function_privilege('anon',p.oid,'execute') as anon_exec, has_function_privilege('authenticated',p.oid,'execute') as authenticated_exec from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('can_manage_approvals','request_approval','decide_approval','cancel_approval');` -- expect anon_exec=false, authenticated_exec=true for all 4. This is the point at which the human-GO for the start of Wave 1 is actually taken. | any of the 4 functions still anon_exec=true, or authenticated_exec=false |
| 3 | `20261110000000_property_knowledge_documents.sql` | `property_knowledge_documents` absent | table + RLS present; `select proname from pg_proc where proname='register_property_knowledge_document';` returns 1 row | table/function missing |
| 4 | `20261110010000_k1_property_knowledge_rpc_acl_hardening.sql` | File 3 (K1) just applied; no human-GO taken yet | `select p.proname, has_function_privilege('anon',p.oid,'execute') as anon_exec, has_function_privilege('authenticated',p.oid,'execute') as authenticated_exec from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('register_property_knowledge_document','approve_property_knowledge_document','archive_property_knowledge_document','supersede_property_knowledge_document');` -- expect anon_exec=false, authenticated_exec=true for all 4. This is the point at which the human-GO before K2 is actually taken. | any of the 4 functions still anon_exec=true, or authenticated_exec=false |
| 5 | `20261111000000_property_knowledge_extraction.sql` | K1+DBV5G applied | `select proname from pg_proc where proname in ('claim_property_knowledge_extraction','complete_property_knowledge_extraction','fail_property_knowledge_extraction');` returns 3 rows | any function missing |
| 6 | `20261111010000_k2_property_knowledge_extraction_acl_hardening.sql` | File 5 (K2) just applied; no human-GO taken yet | `select p.proname, has_function_privilege('anon',p.oid,'execute') as anon_exec, has_function_privilege('authenticated',p.oid,'execute') as authenticated_exec from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('claim_property_knowledge_extraction','complete_property_knowledge_extraction','fail_property_knowledge_extraction');` -- expect anon_exec=false, authenticated_exec=true for all 3. This is the point at which the human-GO before K3 is actually taken. | any of the 3 functions still anon_exec=true, or authenticated_exec=false |
| 7 | `20261112000000_property_authoritative_facts.sql` | K1/K2+DBV5H applied | `property_price_revisions_v2` + RLS present; smoke test: `select public.create_property_price_revision($ws,$prop,'INR',1.00,null,current_date,null,null);` then `select public.approve_property_price_revision($ws, $revision_id);` then `select * from public.current_property_price($org,$ws,$prop);` returns the row — **use a disposable internal test workspace/property for this smoke test, never a real customer property**, and roll back the transaction afterward | K3 smoke test fails |
| 8 | `20261112010000_k3_authoritative_facts_acl_hardening.sql` | File 7 (K3) just applied; no human-GO taken yet | `select p.proname, has_function_privilege('anon',p.oid,'execute') as anon_exec, has_function_privilege('authenticated',p.oid,'execute') as authenticated_exec, has_function_privilege('service_role',p.oid,'execute') as service_role_exec from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('current_property_price','list_property_price_revisions','create_property_price_revision','approve_property_price_revision','archive_property_price_revision');` -- expect anon_exec=false, authenticated_exec=true for all 5; service_role_exec=true is expected for `current_property_price` only (K6's confirmed webhook caller) and harmless-pre-existing for the other 4. This is the point at which the human-GO before K4 is actually taken. | any of the 5 functions still anon_exec=true, or authenticated_exec=false |
| 9 | `20261113000000_property_knowledge_retrieval.sql` | K1–K3+DBV5I applied | `select * from public.search_property_knowledge_documents($org,$ws,$prop,'test query',5);` returns without error (empty result expected, zero real docs) | function errors |
| 10 | `20261113010000_k4_property_knowledge_retrieval_acl_hardening.sql` | File 9 (K4) just applied; no human-GO taken yet | `select p.proname, has_function_privilege('anon',p.oid,'execute') as anon_exec, has_function_privilege('authenticated',p.oid,'execute') as authenticated_exec, has_function_privilege('service_role',p.oid,'execute') as service_role_exec from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='search_property_knowledge_documents';` -- expect anon_exec=false, authenticated_exec=true, service_role_exec=true (K6's confirmed webhook caller, same shared retrieval core as K3's `current_property_price`). This is the point at which the human-GO before K5 is actually taken. | anon_exec=true, authenticated_exec=false, or service_role_exec=false |
| 11 | `20261114000000_ai_workforce_knowledge_sources.sql` | K1–K4+DBV5J applied | `select column_name from information_schema.columns where table_name='ai_workforce_messages' and column_name='source_refs';` returns 1 row | column missing |

**Wave 1 end-of-wave verification:**
- All 4 new tables (approval_requests, approval_events,
  property_knowledge_documents, property_price_revisions_v2) exist, all
  RLS-enabled.
- D1's four approval RPCs confirmed anon_exec=false, authenticated_exec=true
  (File 2/DBV5E's own verify, re-confirmed here).
- K1's four property-knowledge RPCs confirmed anon_exec=false,
  authenticated_exec=true (File 4/DBV5G's own verify, re-confirmed here).
- K2's three extraction RPCs confirmed anon_exec=false,
  authenticated_exec=true (File 6/DBV5H's own verify, re-confirmed here --
  this pair never had a live anon-exposure window since DBV5H was applied
  in the same no-pause sequence immediately after K2).
- K3's five authoritative-facts RPCs confirmed anon_exec=false,
  authenticated_exec=true (File 8/DBV5I's own verify, re-confirmed here --
  this pair never had a live anon-exposure window since DBV5I was applied
  in the same no-pause sequence immediately after K3).
- K4's `search_property_knowledge_documents` RPC confirmed anon_exec=false,
  authenticated_exec=true, service_role_exec=true (File 10/DBV5J's own
  verify, re-confirmed here -- this pair never had a live anon-exposure
  window since DBV5J was applied in the same no-pause sequence immediately
  after K4).
- `select count(*) from public.organizations;` (and workspaces/properties/
  leads) unchanged from the Wave 0 baseline capture.
- K5 `source_refs` column present.

**STOP wave progression if:** any table/function/column above is missing
after its file applies, any existing row count changed, any smoke test
fails, D1's four approval RPCs are not anon_exec=false immediately after
File 2, K1's four property-knowledge RPCs are not anon_exec=false
immediately after File 4, K2's three extraction RPCs are not
anon_exec=false immediately after File 6, K3's five authoritative-facts
RPCs are not anon_exec=false immediately after File 8, or K4's
`search_property_knowledge_documents` RPC is not anon_exec=false or not
service_role_exec=true immediately after File 10.

---

## 11. Wave 2 — D2 + M1/M2 + M3 ONLY

**Do not apply M4–M8 in this wave.**

**D2+DBV6A-D2, M1/M2+DBV6A-META, and M3+DBV6A-M3 are each ONE tightly-coupled
unit, not independently sign-offable steps**, following the exact same
"no exposure window" discipline established throughout Wave 1
(D1+DBV5E, K1+DBV5G, K2+DBV5H, K3+DBV5I, K4+DBV5J). DBV6A found the
identical default-privilege anon-exposure gap a sixth, seventh, and eighth
time by direct repository audit, proactively before D2/M1-M2/M3 ever reach
Production: D2's two functions and M1/M2's four functions all only
`revoke ... from public; grant ... to authenticated;`, never revoking from
anon. M3's single function (`process_meta_leadgen_event`) is a materially
different case: its own author comment states the intended model is
**service_role-only**, but its actual grant block only adds
`grant execute ... to service_role` without ever revoking from anon *or*
authenticated — so both retained default-privilege EXECUTE despite the
stated intent. DBV6A-M3 closes this with the full service-role-only
pattern (revoke from public, anon, AND authenticated; grant only to
service_role), independently confirmed via live PostgREST: an
authenticated session now receives the same `42501`/`permission denied`
rejection as anon, not merely the function's own in-body
`current_setting('role') <> 'service_role'` guard. There is deliberately
**no human-GO checkpoint between File 1 (D2) and File 2 (DBV6A-D2)**,
likewise **no human-GO checkpoint between File 3 (M1/M2) and File 4
(DBV6A-META)**, and likewise **no human-GO checkpoint between File 5 (M3)
and File 6 (DBV6A-M3)** — apply each pair back to back, verify the combined
result, then take the human-GO before the next file.

| Order | File | Precheck | Verify | Stop if |
|---|---|---|---|---|
| 1 | `20261103000000_numeric_quota_enforcement.sql` | current `accept_organization_invitation()` body captured (Wave 0 §6.5) | `select pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='accept_organization_invitation';` — signature still `()`, no args added; `select proname from pg_proc where proname='organization_seat_usage';` exists | signature changed (breaking), or function missing |
| 2 | `20261103010000_d2_numeric_quota_acl_hardening.sql` | File 1 (D2) just applied; no human-GO taken yet | `select p.proname, has_function_privilege('anon',p.oid,'execute') as anon_exec, has_function_privilege('authenticated',p.oid,'execute') as authenticated_exec from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('accept_organization_invitation','organization_seat_usage');` -- expect anon_exec=false, authenticated_exec=true for both. This is the point at which the human-GO before M1/M2 is actually taken. | either function still anon_exec=true, or authenticated_exec=false |
| 3 | `20261115000000_meta_marketing_connection.sql` | `meta_marketing_connections`/`meta_oauth_states`/`meta_lead_form_mappings` absent | all 3 tables + RLS present; `select proname from pg_proc where proname in ('connect_meta_marketing_page','create_meta_lead_form_mapping');` returns 2 rows | tables/functions missing |
| 4 | `20261115010000_meta_marketing_connection_acl_hardening.sql` | File 3 (M1/M2) just applied; no human-GO taken yet | `select p.proname, has_function_privilege('anon',p.oid,'execute') as anon_exec, has_function_privilege('authenticated',p.oid,'execute') as authenticated_exec from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('connect_meta_marketing_page','disconnect_meta_marketing','create_meta_lead_form_mapping','disable_meta_lead_form_mapping');` -- expect anon_exec=false, authenticated_exec=true for all 4. This is the point at which the human-GO before M3 is actually taken. | any of the 4 functions still anon_exec=true, or authenticated_exec=false |
| 5 | `20261116000000_meta_leadgen_webhook.sql` | M1/M2+DBV6A-META applied | `select proname from pg_proc where proname='process_meta_leadgen_event';` exists; dedup check: call twice with the same synthetic `event_id` in a disposable internal test tenant, confirm no duplicate `provider_webhook_events`/staging row (staging table does not exist until M4 — verify dedup via `provider_webhook_events` only at this point) | dedup fails (second call visibly re-processes) |
| 6 | `20261116010000_meta_leadgen_webhook_acl_hardening.sql` | File 5 (M3) just applied; no human-GO taken yet | `select has_function_privilege('anon',p.oid,'execute') as anon_exec, has_function_privilege('authenticated',p.oid,'execute') as authenticated_exec, has_function_privilege('service_role',p.oid,'execute') as service_role_exec from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='process_meta_leadgen_event';` -- expect anon_exec=false, **authenticated_exec=false** (Model B: service_role-only, stricter than every other Wave 1/2 hardening), service_role_exec=true. This is the point at which the human-GO for Wave 2 completion is actually taken. | anon_exec=true, authenticated_exec=true, or service_role_exec=false |

**Wave 2 end-of-wave verification:**
- D2's `accept_organization_invitation` still call-compatible (no signature
  break), `organization_seat_usage` present, both confirmed
  anon_exec=false/authenticated_exec=true (File 2/DBV6A-D2's own verify,
  re-confirmed here).
- M1/M2 tables + functions present, all 4 functions confirmed
  anon_exec=false/authenticated_exec=true (File 4/DBV6A-META's own verify,
  re-confirmed here).
- M3 dedup constraint holds, `process_meta_leadgen_event` confirmed
  anon_exec=false/authenticated_exec=false/service_role_exec=true (File
  6/DBV6A-M3's own verify, re-confirmed here — this pair never had a live
  anon- or authenticated-exposure window since DBV6A-M3 was applied in the
  same no-pause sequence immediately after M3).
- **No Meta provider call was made** — every test above uses only a
  synthetic `event_id`/`page_id`/`form_id` against an internal test
  workspace, never a real Meta API call.

**STOP wave progression if:** any table/function above is missing after its
file applies, any smoke/dedup test fails, D2's two functions are not
anon_exec=false immediately after File 2, M1/M2's four functions are not
anon_exec=false immediately after File 4, or M3's function is not
anon_exec=false and authenticated_exec=false immediately after File 6.

---

## 12. Wave 3A — E1 → E2 → E3 → E4 → E5 → E6

**Every E1–E6 file requires its own immediate ACL hardening — DBV6B found
that none of the six ever revoke `anon` (or, for E5, `authenticated` where
it should stay granted but `anon` still must be revoked) from the
functions they create, the same recurring default-privilege gap already
closed for D1, K1–K5, D2, and M1–M3 throughout Waves 1–2.** A historical
migration already in this repository,
`20261128000000_service_role_acl_hardening.sql` (Phase DBV1E), already
contains the fully-correct final ACL for E1/E2/E3/E4/E6's six
service-role-only functions — but DBV1E is deliberately timestamped into
**Wave 5**, applied only after Waves 1–4 (including the Wave 4C app
deploy) are fully live (see §19). Without its own earlier hardening, each
E-phase function would sit anon/authenticated-executable via
default-privilege for the entire gap between Wave 3A's completion and
Wave 5's much later execution. DBV6B closes this immediately: **E1+DBV6B-E1,
E2+DBV6B-E2, E3+DBV6B-E3, E4+DBV6B-E4, E5+DBV6B-E5, and E6+DBV6B-E6 are
each ONE tightly-coupled unit; there is no human-GO checkpoint within any
of the six pairs.** DBV1E is not modified by any of this and still runs in
Wave 5 — by then, its own REVOKE/GRANT statements for these six functions
are a harmless, idempotent re-assertion of the state DBV6B already
established (the same "redundant restatement is safe" precedent already
proven by K3's `current_property_price` and DBV6A-M3's overlap with
DBV1E's own `process_meta_leadgen_event` entry).

**Two functions are DROPPED AND RECREATED with a changed signature within
this same wave** — `process_whatsapp_message` (E1 creates it 6-arg/void,
E3 drops and recreates it 6-arg/jsonb) and `append_trusted_ai_message` (E2
creates it 4-arg, E3 drops and recreates it 6-arg). In PostgreSQL, `DROP
FUNCTION` destroys every grant on the function object, including any
earlier hardening — a fresh default-privilege grant applies the moment
the function is recreated. This is why E1 and E2 each still get their own
hardening file for their own (E3-superseded) identity: the exposure window
between (e.g.) E1 landing and E3 landing is real, even though it is later
closed by E3's own separate hardening of the new identity.

| Order | File | Precheck | Verify immediately after |
|---|---|---|---|
| 1 | `20261104000000_whatsapp_crm_identity.sql` | Wave 2 healthy | `select column_name from information_schema.columns where table_name='leads' and column_name='normalized_phone';` returns 1 row. `select indexname from pg_indexes where indexname='leads_normalized_phone_idx';` returns 1 row. Spot-check a small sample of existing `leads` rows: `select count(*) from public.leads where normalized_phone is not null;` **must be 0** immediately after this file applies — the column is additive/nullable and this migration performs no backfill; any non-zero count means something unexpected wrote to it and should be investigated before continuing. |
| 2 | `20261104010000_e1_whatsapp_crm_identity_acl_hardening.sql` | File 1 (E1) just applied; no human-GO taken yet | `select p.proname, has_function_privilege('anon',p.oid,'execute') as anon_exec, has_function_privilege('authenticated',p.oid,'execute') as authenticated_exec, has_function_privilege('service_role',p.oid,'execute') as service_role_exec from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('resolve_whatsapp_lead_identity','process_whatsapp_message');` -- expect anon_exec=false, authenticated_exec=false, service_role_exec=true for both. This is the point at which the human-GO before E2 is actually taken. | either function still anon_exec=true or authenticated_exec=true, or service_role_exec=false |
| 3 | `20261105000000_ai_workforce_channel_foundation.sql` | E1+DBV6B-E1 verified | `select proname from pg_proc where proname in ('resolve_whatsapp_ai_conversation','append_trusted_ai_message');` returns 2 rows |
| 4 | `20261105010000_e2_ai_workforce_channel_acl_hardening.sql` | File 3 (E2) just applied; no human-GO taken yet | same anon/authenticated/service_role query as File 2, targeting `resolve_whatsapp_ai_conversation` and `append_trusted_ai_message` (4-arg identity) -- expect anon_exec=false, authenticated_exec=false, service_role_exec=true for both. This is the point at which the human-GO before E3 is actually taken. | either function still anon_exec=true or authenticated_exec=true, or service_role_exec=false |
| 5 | `20261106000000_whatsapp_ai_draft_response.sql` | E1–E2+hardening verified | `select pg_get_function_arguments(p.oid) from pg_proc p where p.proname='process_whatsapp_message';` — confirm the **final** signature (6 args, trailing `p_sender_name default null`) and `returns jsonb` |
| 6 | `20261106010000_e3_whatsapp_ai_draft_acl_hardening.sql` | File 5 (E3) just applied; no human-GO taken yet | same anon/authenticated/service_role query, targeting the recreated `append_trusted_ai_message` (6-arg) and `process_whatsapp_message` (jsonb-returning) identities -- expect anon_exec=false, authenticated_exec=false, service_role_exec=true for both. This is the point at which the human-GO before E4 is actually taken. | either function still anon_exec=true or authenticated_exec=true, or service_role_exec=false |
| 7 | `20261107000000_whatsapp_ai_draft_approval.sql` | E1–E3+hardening verified | `select proname from pg_proc where proname='request_whatsapp_draft_approval';` exists |
| 8 | `20261107010000_e4_whatsapp_ai_approval_acl_hardening.sql` | File 7 (E4) just applied; no human-GO taken yet | same query, targeting `request_whatsapp_draft_approval` -- expect anon_exec=false, authenticated_exec=false, service_role_exec=true. This is the point at which the human-GO before E5 is actually taken. | anon_exec=true, authenticated_exec=true, or service_role_exec=false |
| 9 | `20261108000000_whatsapp_ai_send_execution.sql` | E1–E4+hardening verified | `whatsapp_ai_send_executions` table + RLS present; `select proname from pg_proc where proname in ('claim_whatsapp_draft_send','mark_whatsapp_send_succeeded','mark_whatsapp_send_failed');` returns 3 rows |
| 10 | `20261108010000_e5_whatsapp_send_execution_acl_hardening.sql` | File 9 (E5) just applied; no human-GO taken yet | `select p.proname, has_function_privilege('anon',p.oid,'execute') as anon_exec, has_function_privilege('authenticated',p.oid,'execute') as authenticated_exec from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('claim_whatsapp_draft_send','mark_whatsapp_send_succeeded','mark_whatsapp_send_failed');` -- expect anon_exec=false, **authenticated_exec=true** for all 3 (Model A, unlike every other E-phase function -- these are human-triggered, not webhook-triggered). This is the point at which the human-GO before E6 is actually taken. | any of the 3 functions still anon_exec=true, or authenticated_exec=false |
| 11 | `20261109000000_whatsapp_send_uncertainty.sql` | E1–E5+hardening verified | `select proname from pg_proc where proname='flag_stale_whatsapp_send_executions';` exists |
| 12 | `20261109010000_e6_whatsapp_send_uncertainty_acl_hardening.sql` | File 11 (E6) just applied; no human-GO taken yet | same anon/authenticated/service_role query, targeting `flag_stale_whatsapp_send_executions` -- expect anon_exec=false, authenticated_exec=false, service_role_exec=true. This is the point at which the human-GO for Wave 3A completion is actually taken. | anon_exec=true, authenticated_exec=true, or service_role_exec=false |

**Wave 3A end-of-wave verification (all against an internal test tenant, no
real customer/WhatsApp traffic):**
- `process_whatsapp_message`'s final 6-arg/jsonb-returning signature
  confirmed, and confirmed anon_exec=false/authenticated_exec=false/
  service_role_exec=true (File 6/DBV6B-E3's own verify, re-confirmed
  here).
- `resolve_whatsapp_lead_identity` identity-resolution smoke test, and
  confirmed anon_exec=false/authenticated_exec=false/service_role_exec=true
  (File 2/DBV6B-E1's own verify, re-confirmed here).
- A synthetic conversation created via `resolve_whatsapp_ai_conversation` +
  `append_trusted_ai_message` (final 6-arg identity), both confirmed
  anon_exec=false/authenticated_exec=false/service_role_exec=true (Files
  4/DBV6B-E2 and 6/DBV6B-E3's own verify, re-confirmed here).
- A draft persisted, an approval requested and decided (by a **different**
  user than the requester — self-approval is correctly rejected by
  design), `request_whatsapp_draft_approval` confirmed
  anon_exec=false/authenticated_exec=false/service_role_exec=true (File
  8/DBV6B-E4's own verify, re-confirmed here).
- `claim_whatsapp_draft_send` + `mark_whatsapp_send_succeeded` exercised
  with a **simulated** provider message id — **no real WhatsApp send** —
  both (plus `mark_whatsapp_send_failed`) confirmed
  anon_exec=false/authenticated_exec=true (File 10/DBV6B-E5's own verify,
  re-confirmed here; note this trio is intentionally Model A, not Model
  B, unlike every other function in this wave).
- `flag_stale_whatsapp_send_executions` returns no rows for a
  just-created execution, and is confirmed
  anon_exec=false/authenticated_exec=false/service_role_exec=true (File
  12/DBV6B-E6's own verify, re-confirmed here).

**STOP wave progression if:** any table/function/column above is missing
after its file applies, any smoke test fails, or any of the twelve files'
own ACL verify does not match its stated expected values (Model B:
anon_exec=false/authenticated_exec=false/service_role_exec=true for E1
through E4 and E6's functions; Model A: anon_exec=false/
authenticated_exec=true for E5's three functions).

**DB/app cutover order for this wave (no app deploy occurs until Wave 4C):**
Production continues running its pre-existing, pre-this-engagement app
build throughout all of Wave 3A (and Wave 3B/4A/4B). E1 and E3 each
`DROP FUNCTION` the prior `process_whatsapp_message`/`append_trusted_ai_
message` identity before recreating it with an added trailing parameter
that defaults to `null`/`'not_applicable'` — this is deliberate: a 5-argument
(pre-E1) call to `process_whatsapp_message` from the currently-deployed
app resolves unambiguously to the new 6-argument function (the old
identity no longer exists to create ambiguity) with `p_sender_name`
defaulting to `null`, and DBV4B independently proved this exact scenario
succeeds against a real staging replica with zero DB change required. The
converse (a new-app call against a pre-E1–E6 DB) never occurs in this
rollout, since the new app is deployed exactly once, in Wave 4C, strictly
after Wave 3A/3B/4A/4B are already complete — so no partial-E-phase app
deployment window exists to test. The ACL hardening in this wave is
orthogonal to this signature-compatibility question: it governs who is
*permitted* to call each function, not whether a given call *shape*
succeeds.

**Hard gate before Wave 3B (M4–M8) — verify from live objects, not
migration history:**
- `leads.normalized_phone` column exists.
- `resolve_whatsapp_lead_identity` exists and is anon_exec=false/
  authenticated_exec=false/service_role_exec=true.
- All twelve Wave 3A files (six E-phase + six DBV6B hardening) are
  confirmed live and signed off per the table above.
- **No automatic continuation into Wave 3B.** A separate, explicit human
  GO is required before M4 is applied, exactly as Wave 1 required a
  separate GO before Wave 2 and Wave 2 required one before Wave 3A.

---

## 13. Hard Dependency Gate — Before Wave 3B

This gate exists specifically because DBV4B proved M5 breaks without E1.
Execute and confirm, read-only, before applying any Wave 3B file:

```sql
select column_name from information_schema.columns
 where table_schema='public' and table_name='leads' and column_name='normalized_phone';
-- must return exactly 1 row

select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and proname='resolve_whatsapp_lead_identity';
-- must return exactly 1 row
```

Also confirm Wave 3A's end-of-wave verification (§12) was fully signed off,
not merely attempted.

**If either query returns zero rows, or Wave 3A verification was not
completed: STOP. Do not apply any Wave 3B file.**

---

## 14. Wave 3B — M4 → M5 → M6 → M7 → M8

**Every M4–M8 file requires its own immediate ACL hardening — DBV6C found
that none of the five ever revoke `anon` (nor, for the seven functions
whose legitimate caller is `authenticated`, only `anon`) from the
functions they create, the same recurring default-privilege gap already
closed for D1, K1–K5, D2, M1–M3, and E1–E6 throughout Waves 1–3A.** The
historical migration `20261128000000_service_role_acl_hardening.sql`
(Phase DBV1E) already contains the fully-correct final ACL for 11 of
M4–M8's 18 functions (its own header comment lists all 11 by name,
confirmed by direct grep) — but DBV1E is deliberately timestamped into
**Wave 5**, applied only after Waves 1–4 (including the Wave 4C app
deploy) are fully live (see §19). Without its own earlier hardening, each
of those 11 functions would sit anon/authenticated-executable via
default-privilege for the entire gap between Wave 3B's completion and
Wave 5's much later execution. The remaining 7 functions (M4's
`get_meta_lead_ingestion_summary`, M5's
`get_meta_lead_crm_ingestion_summary`, M6's
`configure_meta_lead_form_consent_rule` and
`disable_meta_lead_form_consent_rule`, and M7's
`claim_whatsapp_outreach_execution`, `mark_whatsapp_outreach_sent`, and
`mark_whatsapp_outreach_failed`) are Model A (authenticated-only,
human-triggered) and are **never** covered by DBV1E at all, at any wave —
DBV1E is a service-role-only hardening migration by design, mirroring
Wave 3A's E5 precedent exactly. DBV6C closes all of this immediately:
**M4+DBV6C-M4, M5+DBV6C-M5, M6+DBV6C-M6, M7+DBV6C-M7, and M8+DBV6C-M8 are
each ONE tightly-coupled unit; there is no human-GO checkpoint within any
of the five pairs.** DBV1E is not modified by any of this and still runs
in Wave 5 — by then, its own REVOKE/GRANT statements for the 11 functions
it covers are a harmless, idempotent re-assertion of the state DBV6C
already established.

**CRITICAL: the 7 Model A functions above must NOT be hardened to
`authenticated=false`** — `claim_whatsapp_outreach_execution`,
`mark_whatsapp_outreach_sent`, and `mark_whatsapp_outreach_failed` gate the
human "Send" action; `configure_meta_lead_form_consent_rule` and
`disable_meta_lead_form_consent_rule` gate the owner-only consent-rule
settings UI; `get_meta_lead_ingestion_summary` and
`get_meta_lead_crm_ingestion_summary` gate the workspace-member ingestion
dashboard. Each keeps `anon_exec=false`/`authenticated_exec=true`.

No M4–M8 file `DROP`s or redefines any pre-existing table, column, or
function signature (confirmed by direct grep for `drop function`/`drop
table`/`drop column` across all five files: zero matches) — Wave 3B is
purely additive, so the E1/E3-style "DROP FUNCTION resets every prior
grant" hazard from Wave 3A does not recur here.

| Order | File | Precheck | Verify immediately after |
|---|---|---|---|
| 1 | `20261117000000_meta_lead_detail_staging.sql` | Gate (§13) passed | `meta_lead_ingestion_staging` table + RLS present; `select proname from pg_proc where proname in ('claim_meta_lead_detail_batch','complete_meta_lead_detail_fetch','fail_meta_lead_detail_fetch','mark_meta_connection_token_invalid','get_meta_lead_ingestion_summary');` returns 5 rows |
| 2 | `20261117010000_m4_meta_lead_detail_staging_acl_hardening.sql` | File 1 (M4) just applied; no human-GO taken yet | `select p.proname, has_function_privilege('anon',p.oid,'execute') as anon_exec, has_function_privilege('authenticated',p.oid,'execute') as authenticated_exec, has_function_privilege('service_role',p.oid,'execute') as service_role_exec from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('claim_meta_lead_detail_batch','complete_meta_lead_detail_fetch','fail_meta_lead_detail_fetch','mark_meta_connection_token_invalid');` -- expect anon_exec=false, authenticated_exec=false, service_role_exec=true for all four (Model B). Separately confirm `get_meta_lead_ingestion_summary`: anon_exec=false, **authenticated_exec=true** (Model A). This is the point at which the human-GO before M5 is actually taken. | any Model B function still anon_exec=true/authenticated_exec=true/service_role_exec=false, or the Model A function anon_exec=true/authenticated_exec=false |
| 3 | `20261118000000_meta_lead_crm_ingestion.sql` | M4+DBV6C-M4 verified | `meta_lead_crm_links` table present. **Synthetic-only test**: using an internal test workspace/property, stage a synthetic Meta lead row, run `select * from public.ingest_meta_lead_to_crm($staging_id);` and confirm `outcome='completed'`, a `leads` row was created with `source='facebook'`, and `lead_property_interests` has a matching row. This is the exact scenario DBV4B found broken pre-E1 and confirmed fixed post-E1 — re-confirming it here on Production's real schema is the single most important check in this runbook. |
| 4 | `20261118010000_m5_meta_lead_crm_ingestion_acl_hardening.sql` | File 3 (M5) just applied; no human-GO taken yet | same query, targeting `resolve_or_create_meta_lead_crm_identity`, `ingest_meta_lead_to_crm`, `list_meta_lead_crm_pending_batch` (Model B: anon_exec=false/authenticated_exec=false/service_role_exec=true) and `get_meta_lead_crm_ingestion_summary` (Model A: anon_exec=false/**authenticated_exec=true**). This is the point at which the human-GO before M6 is actually taken. | any Model B function still anon_exec=true/authenticated_exec=true/service_role_exec=false, or the Model A function anon_exec=true/authenticated_exec=false |
| 5 | `20261119000000_meta_lead_consent.sql` | M5+DBV6C-M5 verified | `meta_lead_form_consent_rules`/`communication_consents` tables present; configure a consent rule on the same synthetic form mapping, claim + complete consent processing for the synthetic staged lead, confirm a `communication_consents` row with `status='granted'` |
| 6 | `20261119010000_m6_meta_lead_consent_acl_hardening.sql` | File 5 (M6) just applied; no human-GO taken yet | same query, targeting `claim_meta_lead_consent_batch` and `complete_meta_lead_consent_processing` (Model B) and `configure_meta_lead_form_consent_rule`/`disable_meta_lead_form_consent_rule` (Model A: anon_exec=false/**authenticated_exec=true**). This is the point at which the human-GO before M7 is actually taken. | any Model B function still anon_exec=true/authenticated_exec=true/service_role_exec=false, or either Model A function anon_exec=true/authenticated_exec=false |
| 7 | `20261120000000_meta_lead_whatsapp_outreach.sql` | M6+DBV6C-M6 verified | `whatsapp_outreach_executions` table present; `claim_whatsapp_outreach_execution` succeeds for the synthetic lead+consent+connection combination (as an **authenticated** workspace member, not service_role — confirmed by DBV4B to require `auth.uid()`) |
| 8 | `20261120010000_m7_meta_lead_whatsapp_outreach_acl_hardening.sql` | File 7 (M7) just applied; no human-GO taken yet | same query, targeting `claim_whatsapp_outreach_execution`, `mark_whatsapp_outreach_sent`, `mark_whatsapp_outreach_failed` -- expect anon_exec=false, **authenticated_exec=true** for all three (Model A, mirroring E5 exactly -- these are human-triggered, not webhook-triggered). Separately confirm `flag_stale_whatsapp_outreach_executions`: anon_exec=false/authenticated_exec=false/service_role_exec=true (Model B). This is the point at which the human-GO before M8 is actually taken. | any of the 3 Model A functions still anon_exec=true or authenticated_exec=false, or the Model B function anon_exec=true/authenticated_exec=true/service_role_exec=false |
| 9 | `20261121000000_whatsapp_consent_revocation.sql` | M7+DBV6C-M7 verified | `select proname from pg_proc where proname='record_whatsapp_consent_revocation';` exists; call it twice with the same `source_message_id` for the synthetic lead and confirm both calls complete without error (idempotent by design, confirmed in DBV4B) |
| 10 | `20261121010000_m8_whatsapp_consent_revocation_acl_hardening.sql` | File 9 (M8) just applied; no human-GO taken yet | same query, targeting `record_whatsapp_consent_revocation` -- expect anon_exec=false, authenticated_exec=false, service_role_exec=true. This is the point at which the human-GO for Wave 3B completion is actually taken. | anon_exec=true, authenticated_exec=true, or service_role_exec=false |

**No Meta call. No WhatsApp send.** Every M4–M8 verification above uses a
synthetic staging row created directly by SQL insert into
`meta_lead_ingestion_staging` (or the equivalent internal test fixture), never
a real webhook delivery from Meta.

**STOP wave progression if:** any table/function/column above is missing
after its file applies, any smoke test fails, or any of the ten files' own
ACL verify does not match its stated expected values.

**Consent-revocation defense-in-depth note (recorded, not a STOP
condition):** `claim_whatsapp_outreach_execution` verifies that the
specific `p_consent_id` row it is given currently has `status='granted'`,
but does not independently re-derive "is this the latest consent row for
this lead" from `communication_consents` itself — `communication_consents`
is append-only, so an old granted row's own `status` column never changes
even after a later revocation row is inserted. This is not reachable
through the current application code: `executeGovernedMetaLeadWhatsAppOutreach`
always re-resolves `resolveWhatsAppOutreachEligibility` (which orders by
`recorded_at desc` to find the current-effective row) immediately before
calling the claim RPC, never reusing a `consentId` cached from an earlier
`prepareWhatsAppOutreach` preview render — confirmed by
`tests/phase-m8-whatsapp-consent-revocation.test.mjs` tests 21–23. The
residual window is the same sub-second TS-query-to-RPC-call race present
in any two-round-trip check-then-act flow elsewhere in this codebase (e.g.
E4/E5's own approval-status check), not a newly discovered defect specific
to M7/M8.

---

## 15. Wave 4A — DBV3B

**Precheck (repeat the Wave 0 §6.8/§6.9 check immediately before this file,
not just once at the start of the runbook):**

```sql
select
  (select count(*) from public.creative_campaigns) as creative_campaigns,
  (select count(*) from public.creative_assets) as creative_assets,
  (select count(*) from public.creative_generation_jobs) as creative_generation_jobs,
  (select count(*) from public.creative_timeline) as creative_timeline,
  (select count(*) from public.creative_campaign_packs) as creative_campaign_packs,
  (select count(*) from public.property_projects) as property_projects;
```

**If any value is non-zero: STOP.** Do not apply this file. DBV3B's own
empty-data guard will also raise and roll back automatically if this check
is skipped and a row exists, but the operator must not rely on the guard
alone — verify first.

**Execute:** `20261130000000_creative_property_compatibility.sql` only. Do
**not** apply the raw C1 file (§3).

**Verify:**
```sql
select column_name from information_schema.columns
 where table_schema='public' and table_name='creative_campaigns'
   and column_name in ('property_id','project_id','property_project_id');
-- expect exactly: property_id, project_id  (property_project_id absent)

select conname, confrelid::regclass from pg_constraint
 where conrelid='public.creative_campaigns'::regclass and conname like '%project%';
-- expect: creative_campaigns_project_id_fkey -> property_projects (legacy FK intact)

select pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='advance_creative_campaign';
-- confirm it references c.project_id / c.property_id, not a bare property_project_id
```

Repeat the column-shape check for `creative_assets`, `creative_generation_jobs`,
`creative_timeline`, `creative_campaign_packs`.

---

## 16. Wave 4B — DBV3C

**Execute:** `20261201000000_campaign_stack_property_compatibility.sql` only.
Do **not** apply raw C2/C3/C4/C6 (§3).

**Verify:**
```sql
select to_regclass('public.campaign_strategy_versions'),
       to_regclass('public.campaign_creative_packages'),
       to_regclass('public.campaign_lead_forms');
-- all non-null

select column_name from information_schema.columns
 where table_name='creative_generation_jobs' and column_name in ('creative_package_id','creative_brief_id');
-- both present (C4 linkage columns)

select pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in
   ('save_campaign_strategy_version','save_campaign_creative_package',
    'enqueue_campaign_image_generation','save_campaign_lead_form_draft')
 and pg_get_functiondef(p.oid) like '%property_project_id%';
-- expect ZERO rows -- these must use project_id in the compatibility shape

select pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='enqueue_campaign_image_generation'
   and pg_get_functiondef(p.oid) like '%extensions.gen_random_bytes(16)%';
-- expect 1 row -- DBV1D's fix preserved
```

Confirm `META_MARKETING_WRITES_ENABLED` (and equivalents) remain `false` in
the current environment configuration — this migration does not touch that
flag, but it is worth reconfirming before Wave 4C's app deploy.

---

## 17. Wave 4C — Application Deploy

This is the first and only application deployment in this runbook.

**Before deploy:**
- ☐ Record the current Vercel deployment ID (again, post-Wave-4A/4B, in case
  anything changed since Wave 0).
- ☐ Confirm the rollback deployment (the one recorded in Wave 0 §6.14) is
  still available and redeployable.
- ☐ Confirm `npm run build` passes on the exact commit being deployed.
- ☐ Confirm environment variables are unchanged except any explicitly
  approved changes for this rollout (there should be none required by
  DBV3B/DBV3C/DBV3D).

**Deploy** the current DBV3D-compatible build (the commit validated across
DBV3B/DBV3C/DBV3D/DBV4B).

**After deploy, verify (internal test account only, no real customer
session):**
- `/login` and signup read path
- `/vayon` shell loads
- Property pages
- Knowledge (K1–K4 UI paths)
- Pricing/K3 display
- AI Workforce
- WhatsApp approvals UI
- Creative Studio (campaigns/assets list)
- Campaign Strategist
- Creative Package
- Image generation state machine
- Video Studio read path
- Meta settings
- Meta lead-form UI
- CRM lead views

**Specifically verify DBV3D compatibility:** confirm the Creative Studio
dashboard correctly reads campaigns/assets against the **physical
`project_id` column** (not `property_project_id`, which does not exist on
Production) and correctly exposes it to the UI as `propertyProjectId` — this
is exactly the read path DBV3D fixed and DBV4B re-verified against a real
wave-built compatibility schema.

**No live provider call at any point in this verification.**

---

## 18. App Rollback Gate

If Wave 4C application health checks fail:

```
                    Wave 4C app health check
                            │
                    ┌───────┴────────┐
                   FAIL              PASS → proceed to Wave 5
                    │
                    ▼
      Roll back the APPLICATION deployment
      to the Wave 0 §6.14 recorded deployment
                    │
                    ▼
      DO NOT roll back DBV3B/DBV3C schema.
                    │
                    ▼
      Re-verify old app against the NEW (compatibility) schema:
      - project_id remains live and FK-intact (unchanged by an app rollback)
      - old app code that references project_id directly still resolves
        correctly (DBV4B confirmed this exact scenario)
                    │
                    ▼
      If old app is healthy against the new schema: STOP here, investigate
      the new app build offline, do not retry Wave 4C without a fix.
      If old app is ALSO unhealthy against the new schema: this indicates
      a genuine DBV3B/DBV3C defect DBV4B did not catch -- STOP the entire
      rollout, do not proceed to Wave 5, escalate for a new design phase.
```

**Reason schema rollback is never the first move:** `project_id` is
deliberately preserved (not renamed) by DBV3B specifically so that an
application rollback never requires a database rollback. DBV4B directly
proved this: a raw `project_id` read after Wave 4A/4B succeeds with zero
DB change, and an old, pre-E1, 5-argument call to `process_whatsapp_message`
still succeeds after Wave 3A has landed.

---

## 19. Wave 5 — SEC2 then DBV1E (intentionally reversed order)

**Precheck — confirm all 20 DBV1E targets now exist** (they are created by
Waves 1–4; this query should return 20/20 after Wave 4B, before Wave 5 is
attempted):

```sql
select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname = any(array[
   'append_trusted_ai_message','claim_meta_lead_consent_batch','claim_meta_lead_detail_batch',
   'complete_creative_generation','complete_meta_lead_consent_processing','complete_meta_lead_detail_fetch',
   'fail_meta_lead_detail_fetch','flag_stale_campaign_lead_form_creations','flag_stale_whatsapp_outreach_executions',
   'flag_stale_whatsapp_send_executions','ingest_meta_lead_to_crm','list_meta_lead_crm_pending_batch',
   'mark_meta_connection_token_invalid','process_meta_leadgen_event','process_whatsapp_message',
   'record_whatsapp_consent_revocation','request_whatsapp_draft_approval','resolve_or_create_meta_lead_crm_identity',
   'resolve_whatsapp_ai_conversation','resolve_whatsapp_lead_identity'
 ]);
-- must return 20
```

**If this returns fewer than 20: STOP. Report exactly which targets are
missing and why (most likely: an earlier wave was skipped or failed
silently). Do not invent new ACL SQL to work around a missing target — that
is a rollout-order problem, not an ACL problem.**

**Execute, in this exact order:**
1. `20261202000000_provision_workspace_billing_acl_hardening.sql` (WAVE5A)
2. `20261129000000_sensitive_rpc_acl_hardening.sql` (SEC2)
3. `20261128000000_service_role_acl_hardening.sql` (DBV1E)

WAVE5A runs first, ahead of SEC2 and DBV1E, despite its filename sorting
latest of the three. Reason: a real-Production read-only audit (Wave 5A)
found `provision_workspace_billing` anon- and authenticated-executable with
no in-body `auth.uid()` check, no service-role guard, and no
tenant-ownership verification of any kind -- unlike every SEC2/DBV1E target,
which all carry an in-body guard that makes their pre-hardening
anon-exposure merely unnecessary rather than actively exploitable. Its only
real caller is the `provision_billing_after_workspace` trigger (installed in
`20260813000000_sprint22_production_baseline.sql`), which is SECURITY
DEFINER and derives every argument from the newly-inserted `workspaces` row,
never from a caller value -- confirmed via full repository-wide search
finding zero application/API call sites. This is a confirmed, currently
open privilege-layer gap and is closed first, before the broader ACL sweep.

SEC2 then runs before DBV1E, which is intentionally the reverse of their own
filename/timestamp order. Reason: SEC2's 12 targets are all pre-D1 baseline
functions that already exist on Production today (confirmed by DBV4's own
read-only audit), so SEC2 has no ordering dependency on anything in this
runbook and could technically run first at any point — it is placed here,
after Wave 4, purely to keep all ACL hardening in one reviewed batch. DBV1E's
20 targets are created across Waves 1–4B, so DBV1E **must** run after them
regardless of filename order; applying it earlier (in raw timestamp order,
before Waves 1–4) would fail on `REVOKE ALL ON FUNCTION` for every target
that doesn't exist yet.

**WAVE5A checksum gate (verify before executing):**
```
sha256sum supabase/migrations/20261202000000_provision_workspace_billing_acl_hardening.sql
-- expected: 389e5ab0c1e76d7c183f44bd6977378554e87b89fd6f8e6e451cf23cf98fc867
```

**WAVE5A verify (after applying):**
```sql
select p.proname,
  has_function_privilege('public', p.oid, 'execute') as public_exec,
  has_function_privilege('anon', p.oid, 'execute') as anon_exec,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated_exec,
  has_function_privilege('service_role', p.oid, 'execute') as service_role_exec
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='provision_workspace_billing';
-- expected: public=false, anon=false, authenticated=false, service_role=true
```

**Verify:**
```sql
-- SEC2: 12/12 expected anon=false, authenticated=true, service_role=true
select p.proname,
  has_function_privilege('anon', p.oid, 'execute') as anon_exec,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated_exec,
  has_function_privilege('service_role', p.oid, 'execute') as service_role_exec
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname = any(array[
  'create_personal_access_token','revoke_personal_access_token','get_google_credential',
  'upsert_google_credential','refresh_google_credential','get_whatsapp_delivery_credential',
  'rotate_integration_secret_metadata','change_organization_member_role','invite_organization_member',
  'remove_organization_member','set_organization_member_status','transfer_organization_ownership'
]);

-- DBV1E: 20/20 expected anon=false, authenticated=false, service_role=true
-- (same query shape against the 20-name list above)
```

Do not rely on migration filename ordering for this wave — the execution
order above is the one that matters, not the filenames' timestamps.

---

## 20. Billing Guard — After EVERY Wave

Run this exact check after each of Waves 1 through 5 (six times total,
including once more after Wave 0's baseline capture for comparison):

```sql
select p.proname, md5(pg_get_functiondef(p.oid)) as def_hash
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in
  ('process_paddle_billing_event','process_paddle_billing_event_core237','provision_workspace_billing');
```

Compare each `def_hash` against the Wave 0 baseline capture (§6.5 — extend
that capture to include these three functions' hashes too, in addition to
the four already listed there).

Also verify invoice conflict behavior is unchanged:
```sql
select conname from pg_constraint
 where conrelid='public.invoices'::regclass and contype='u';
-- confirm the same unique constraint(s) present in the Wave 0 baseline
```

**If any hash changes and no file in this runbook's own 43-file list
targets that function: STOP the entire rollout immediately.** None of the
43 files in §2 touch any billing function -- the original 24 were verified
during DBV4 by full name-overlap comparison, the 25th
(20261102010000_d1_approval_rpc_acl_hardening.sql, added in DBV5E) targets
only D1's four approval functions, the 26th
(20261110010000_k1_property_knowledge_rpc_acl_hardening.sql, added in
DBV5G) targets only K1's four property-knowledge-document functions, the
27th (20261111010000_k2_property_knowledge_extraction_acl_hardening.sql,
added in DBV5H) targets only K2's three extraction functions, the 28th
(20261112010000_k3_authoritative_facts_acl_hardening.sql, added in DBV5I)
targets only K3's five authoritative-price-revision functions, the 29th
(20261113010000_k4_property_knowledge_retrieval_acl_hardening.sql, added
in DBV5J) targets only K4's single search function, the 30th
(20261103010000_d2_numeric_quota_acl_hardening.sql, added in DBV6A)
targets only D2's two seat functions, the 31st
(20261115010000_meta_marketing_connection_acl_hardening.sql, added in
DBV6A) targets only M1/M2's four connection/mapping functions, the
32nd (20261116010000_meta_leadgen_webhook_acl_hardening.sql, added in
DBV6A) targets only M3's single webhook function, the 33rd–38th
(20261104010000/20261105010000/20261106010000/20261107010000/
20261108010000/20261109010000, all added in DBV6B) target only E1's two,
E2's two, E3's two (redefined), E4's one, E5's three, and E6's one
functions respectively, and the 39th–43rd
(20261117010000/20261118010000/20261119010000/20261120010000/
20261121010000, all added in DBV6C) target only M4's five, M5's four,
M6's four, M7's four, and M8's one functions respectively -- all
twenty-two were independently confirmed to have no billing-function
overlap when they were authored (D2's own base migration reads
subscriptions/subscription_plans but neither it nor DBV6A-D2 touches any
of the four hashed billing functions themselves) — any change here
indicates either a wrong file was applied, a concurrent out-of-band change
occurred, or the repository has drifted from what this runbook was
authored against.

---

## 21. Provider Guard

Throughout Waves 0–5:

- `META_MARKETING_WRITES_ENABLED` must remain `false` in Production
  configuration at every checkpoint.
- No verification step in this runbook may publish a Meta campaign, create a
  real Meta Lead Form, send a real WhatsApp message, call OpenAI, call Sora,
  or trigger a real Paddle checkout/webhook.
- Every "smoke test" in §10–§16 uses either a disposable internal test
  organization/workspace or a directly-inserted synthetic row — never real
  customer data and never a real external API call.
- `mark_whatsapp_send_succeeded`/`complete_creative_generation`/
  `complete_campaign_lead_form_creation` are always called with a
  **simulated** provider result (fake message id / fake storage path / fake
  provider form id) during verification, exactly as DBV4B did.

---

## 22. Customer Traffic / Maintenance Window

DBV4B measured every one of the (then-)24 migration files applying in under
40ms on a disposable, near-empty staging database — but Production's actual
apply time may differ due to real data volume, connection pool contention,
and network latency to the Production host, none of which DBV4B's local
rehearsal can model. Do not assume identical timing.

The 25th file (20261102010000_d1_approval_rpc_acl_hardening.sql, added in
DBV5E, after DBV4B's rehearsal ran) was NOT part of that wave-by-wave
staging rehearsal -- it received its own, separate local validation instead
(fresh 83-migration chain replay, real-Postgres ACL checks, and live
PostgREST anon-rejection/authenticated-acceptance tests, all in DBV5E). Its
own measured apply time in that validation was a few milliseconds, and it
is a pure ACL-grant migration with no schema/table/index operation, so it
carries materially less lock/timing risk than any file DBV4B did rehearse
-- but if a full wave rehearsal is repeated before Production execution,
this file should be included in it for completeness.

The 26th file (20261110010000_k1_property_knowledge_rpc_acl_hardening.sql,
added in DBV5G, after K1 had already been applied to Production and its own
postcheck found the identical anon-executable gap D1 originally had) was
likewise not part of DBV4B's rehearsal. It received the same class of
separate local validation as the 25th file (fresh 84-migration chain
replay, real-Postgres ACL checks, and live PostgREST anon-rejection/
authenticated-acceptance tests, all in DBV5G), with the same low lock/
timing risk profile (pure ACL grant, no schema/table/index operation).

The 27th file (20261111010000_k2_property_knowledge_extraction_acl_hardening.sql,
added in DBV5H) differs from the 25th and 26th in one respect: it was
authored and validated **before** K2 was ever applied to Production, by
proactive repository audit rather than a reactive Production postcheck.
It was likewise not part of DBV4B's rehearsal, and received the same class
of separate local validation as the 25th and 26th files (fresh
85-migration chain replay, real-Postgres ACL checks, and live PostgREST
anon-rejection/authenticated-acceptance tests, all in DBV5H), with the
same low lock/timing risk profile (pure ACL grant, no schema/table/index
operation).

The 28th file (20261112010000_k3_authoritative_facts_acl_hardening.sql,
added in DBV5I) is proactive like the 27th: authored and validated
**before** K3 was ever applied to Production, by direct repository audit
rather than a reactive Production postcheck. It was likewise not part of
DBV4B's rehearsal, and received the same class of separate local
validation as the 25th–27th files (fresh 86-migration chain replay,
real-Postgres ACL checks -- including the `service_role`-preserving grant
for `current_property_price`, confirmed against its one genuine
service_role caller -- and live PostgREST anon-rejection/authenticated-
acceptance tests for all five target functions, all in DBV5I), with the
same low lock/timing risk profile (pure ACL grant, no schema/table/index
operation).

The 29th file (20261113010000_k4_property_knowledge_retrieval_acl_hardening.sql,
added in DBV5J) is proactive like the 27th and 28th: authored and
validated **before** K4 was ever applied to Production, by direct
repository audit rather than a reactive Production postcheck. It was
likewise not part of DBV4B's rehearsal, and received the same class of
separate local validation as the 25th–28th files (fresh 87-migration
chain replay, real-Postgres ACL checks -- including the
`service_role`-preserving grant for `search_property_knowledge_documents`,
confirmed against the same genuine K6 service_role caller already
confirmed for K3's `current_property_price` -- and live PostgREST
anon-rejection/authenticated-acceptance/service_role-acceptance tests, all
in DBV5J), with the same low lock/timing risk profile (pure ACL grant, no
schema/table/index operation).

The 30th–32nd files (20261103010000_d2_numeric_quota_acl_hardening.sql,
20261115010000_meta_marketing_connection_acl_hardening.sql, and
20261116010000_meta_leadgen_webhook_acl_hardening.sql, all added in DBV6A)
are proactive like the 27th–29th: authored and validated **before**
D2/M1-M2/M3 were ever applied to Production, by direct repository audit
rather than a reactive Production postcheck. None were part of DBV4B's
rehearsal (which predates all of them), and all three received the same
class of separate local validation as the 25th–29th files (fresh
90-migration chain replay, real-Postgres ACL checks, and live PostgREST
tests), with the same low lock/timing risk profile (pure ACL grant, no
schema/table/index operation) -- with one exception worth flagging
explicitly for the execution window: the 32nd file (DBV6A-M3) revokes
`authenticated` EXECUTE in addition to `anon`, a stricter change than any
other hardening migration in this runbook (every other one only ever adds
an anon revoke, never touching authenticated). Live PostgREST testing in
DBV6A confirmed a genuine authenticated session is correctly rejected
(`42501`) after this file applies, matching its single confirmed caller
(the Meta leadgen webhook route's service-role client) -- but because this
is the first migration in the whole DBV5/DBV6 series to narrow an existing
role's access rather than only close an anon gap, extra attention during
the live Production verify step (File 6's postcheck in §11) is warranted.

The 33rd–38th files (20261104010000_e1_whatsapp_crm_identity_acl_
hardening.sql, 20261105010000_e2_ai_workforce_channel_acl_hardening.sql,
20261106010000_e3_whatsapp_ai_draft_acl_hardening.sql,
20261107010000_e4_whatsapp_ai_approval_acl_hardening.sql,
20261108010000_e5_whatsapp_send_execution_acl_hardening.sql, and
20261109010000_e6_whatsapp_send_uncertainty_acl_hardening.sql, all added
in DBV6B) are proactive like the 27th–32nd: authored and validated
**before** E1–E6 were ever applied to Production, by direct repository
audit. None were part of DBV4B's rehearsal, and all six received the same
class of separate local validation (fresh 96-migration chain replay,
real-Postgres ACL checks, and live PostgREST tests), with the same low
lock/timing risk profile (pure ACL grant, no schema/table/index
operation). Five of the six (E1, E2, E3, E4, E6's hardening) follow
DBV6A-M3's stricter service-role-only pattern (revoke `anon` AND
`authenticated`, grant only to `service_role`) -- these five functions are
also independently corrected, much later, by the pre-existing historical
migration 20261128000000_service_role_acl_hardening.sql (Phase DBV1E,
Wave 5), which already lists all six of E1/E2/E4/E6's functions (and, via
its own signature-independent GRANT targeting, E3's two redefined
identities) in its own 20-function inventory -- DBV6B's hardening exists
specifically because DBV1E's Wave-5 timing would otherwise leave every one
of them anon/authenticated-executable for the entire span between Wave 3A
and Wave 5; DBV1E is not modified and becomes a harmless, idempotent
re-assertion of the same state when it eventually runs (confirmed by a
full 96-migration fresh replay completing with zero errors, DBV1E
included). The sixth (E5's hardening) is the one Model A exception in this
wave -- its three functions are genuine authenticated-only customer RPCs
(human-triggered "Send Approved Reply"/outcome-recording actions, not
webhook-triggered), outside DBV1E's own service-role-only scope entirely,
and receive the same authenticated-preserving, anon-only-revoke pattern
already used throughout Waves 1–2.

**Recommendation:** a short, explicit low-traffic execution window (not
necessarily a full maintenance-mode outage) for Waves 1, 2, 4A, 4B, and 5 —
all of which are additive-only and should be near-zero-impact even under
real load. **Wave 3A specifically warrants a tighter, coordinated window**
with Wave 4C's… no — Wave 3A's own app cutover, since it redefines
`process_whatsapp_message` twice in quick succession (E1 then E3) while
inbound WhatsApp traffic is live and continuous; DBV4 already classified
this wave as the one place a version-mismatch window is customer-visible
(missed/duplicated messages), not merely additive-safe.

If Production has no formal maintenance-mode capability:
- Choose the lowest-traffic hour available (time zone appropriate to the
  primary customer base).
- Treat each wave as its own stop/go checkpoint (§9, §26) rather than
  attempting the full rollout in one uninterrupted sitting.
- For Wave 3A specifically, have the coordinating application release
  staged and ready to deploy immediately after E1–E6 apply, to minimize the
  window between DB and app cutover.

---

## 23. Post-Wave Health Checks

After every wave, before proceeding to the next:

- Supabase project logs show no new error class.
- Vercel logs show no new error class (once Wave 4C has deployed).
- Auth (login/signup) still functions for an internal test account.
- Critical pages (§17 list) still load.
- Row counts match expectations (unchanged except intentional new rows from
  synthetic verification, which should be cleaned up or clearly tagged as
  test fixtures).
- Function signatures match §10–§19's verification queries.
- RLS remains enabled: `select count(*) from pg_tables where schemaname='public' and rowsecurity=false;`
  must return 0 at every checkpoint.
- ACL matches intent where applicable (Wave 5 only, but re-checked at Wave 5
  and again at the final smoke in §24).
- Billing function hashes unchanged (§20).
- No provider side effect occurred (§21).

**Do not proceed to the next wave on an unexplained error increase of any
kind**, even one that seems unrelated to this rollout — investigate and
resolve or explicitly accept the risk in writing before continuing.

---

## 24. Final North-Star Safe Smoke (design only — do not create now)

After Wave 5, and only after Wave 5's own verification is fully green, a
provider-disabled Production smoke test should validate, end-to-end, using
either a dedicated internal test organization or an explicitly-approved
database-safe synthetic fixture:

```
property → knowledge → strategy → creative package → generation state
  → lead ingestion state → CRM identity → consent → WhatsApp draft/approval
```

This mirrors DBV4B's own North-Star pipeline rehearsal, run once more against
the real Production database (not staging) to close the loop. **This runbook
does not create or schedule this smoke test now** — it is designed here as
the explicit final step, to be separately triggered after Wave 5 is
confirmed stable, and it must **STOP before any external provider call**
(no real Meta publish, no real WhatsApp send, no real OpenAI/Sora call, no
real Paddle transaction).

---

## 25. Success Criteria

The Production DB rollout succeeds only if, at the end of Wave 5:

- All intended schema/functions from §2 exist exactly as verified per-wave.
- Application is healthy (Wave 4C's checklist, §17).
- Billing functions byte-unchanged from Wave 0 baseline (§20).
- Existing row counts remain sane (only expected synthetic/test rows added).
- RLS enabled on 100% of `public` tables.
- ACL matches SEC2 (12/12) and DBV1E (20/20) exactly (§19).
- Creative compatibility shape correct (`property_id` + `project_id`,
  `property_project_id` absent) (§15).
- `META_MARKETING_WRITES_ENABLED` (and equivalents) remain `false`.
- Zero provider calls occurred during the entire rollout.
- No cross-tenant regression (spot-checked per DBV3C's proven attack
  patterns, at minimum once post-Wave-4B).
- No unexplained Production error-rate increase at any checkpoint.

---

## 26. Failure Classification

| Wave | GREEN (continue) | AMBER (pause, investigate) | RED (stop rollout) |
|---|---|---|---|
| Any | All checks pass | A check is ambiguous, slow, or a non-critical smoke test behaves unexpectedly in a way explainable by test-fixture setup (not the migration itself) | Unexpected schema shape; Creative/`property_projects` tables non-zero before Wave 4A; billing definition hash changed; migration SQL error; RLS disabled unexpectedly; ACL wrong after Wave 5; app cannot read Creative data after Wave 4C; cross-tenant isolation failure; any provider call occurs unexpectedly |

Any **RED** classification halts the rollout at the current wave. Waves
already fully verified as GREEN are not automatically rolled back (per §18's
reasoning for schema) — the decision to roll back a completed wave is a
separate, deliberate act requiring the same level of review as this runbook
itself, not an automatic response.

---

## 27. No Migration History Repair (post-rollout)

Even after a fully successful Wave 0–5 rollout: **do not** immediately
attempt to establish Supabase CLI migration history (`migration repair` or
otherwise). First let Production run stable on this newly-applied schema for
an operator-determined stabilization period. Migration-history normalization
— reconciling `supabase_migrations.schema_migrations` (or deciding on the
dedicated-reconciliation-table approach DBV4 recommended) against the
now-current Production schema — is its own, separately-authorized,
separately-audited future phase. This runbook's execution does not include
it, and successfully completing Waves 0–5 does not implicitly authorize it.

---

## 28. C7 Remains Blocked

**C7 does not start after this database rollout alone**, even if every wave
above is fully green. Remaining gates before any C7 work may begin:

1. Required OAuth permissions for live Meta Lead Form / campaign management
   have not been obtained or verified.
2. Live Meta consent / custom-disclaimer `field_data` certification has not
   been completed with Meta.
3. Controlled, explicit Meta-write enablement (`META_MARKETING_WRITES_ENABLED=true`
   or equivalent) has not been authorized or scheduled.
4. A real-provider end-to-end validation phase (distinct from this database
   rollout) has not been run.

No C7 work of any kind is performed, scheduled, or scoped by this runbook.

---

## Appendix A — Quick Reference: Full Ordered File List

```
WAVE 1
  20261102000000_business_approval_workflows.sql
  20261102010000_d1_approval_rpc_acl_hardening.sql (no human-GO before this one)
  20261110000000_property_knowledge_documents.sql
  20261110010000_k1_property_knowledge_rpc_acl_hardening.sql (no human-GO before this one)
  20261111000000_property_knowledge_extraction.sql
  20261111010000_k2_property_knowledge_extraction_acl_hardening.sql (no human-GO before this one)
  20261112000000_property_authoritative_facts.sql
  20261112010000_k3_authoritative_facts_acl_hardening.sql (no human-GO before this one)
  20261113000000_property_knowledge_retrieval.sql
  20261113010000_k4_property_knowledge_retrieval_acl_hardening.sql (no human-GO before this one)
  20261114000000_ai_workforce_knowledge_sources.sql

WAVE 2
  20261103000000_numeric_quota_enforcement.sql
  20261103010000_d2_numeric_quota_acl_hardening.sql (no human-GO before this one)
  20261115000000_meta_marketing_connection.sql
  20261115010000_meta_marketing_connection_acl_hardening.sql (no human-GO before this one)
  20261116000000_meta_leadgen_webhook.sql
  20261116010000_meta_leadgen_webhook_acl_hardening.sql (no human-GO before this one)

WAVE 3A
  20261104000000_whatsapp_crm_identity.sql
  20261104010000_e1_whatsapp_crm_identity_acl_hardening.sql (no human-GO before this one)
  20261105000000_ai_workforce_channel_foundation.sql
  20261105010000_e2_ai_workforce_channel_acl_hardening.sql (no human-GO before this one)
  20261106000000_whatsapp_ai_draft_response.sql
  20261106010000_e3_whatsapp_ai_draft_acl_hardening.sql (no human-GO before this one)
  20261107000000_whatsapp_ai_draft_approval.sql
  20261107010000_e4_whatsapp_ai_approval_acl_hardening.sql (no human-GO before this one)
  20261108000000_whatsapp_ai_send_execution.sql
  20261108010000_e5_whatsapp_send_execution_acl_hardening.sql (no human-GO before this one)
  20261109000000_whatsapp_send_uncertainty.sql
  20261109010000_e6_whatsapp_send_uncertainty_acl_hardening.sql (no human-GO before this one)

WAVE 3B
  20261117000000_meta_lead_detail_staging.sql
  20261117010000_m4_meta_lead_detail_staging_acl_hardening.sql (no human-GO before this one)
  20261118000000_meta_lead_crm_ingestion.sql
  20261118010000_m5_meta_lead_crm_ingestion_acl_hardening.sql (no human-GO before this one)
  20261119000000_meta_lead_consent.sql
  20261119010000_m6_meta_lead_consent_acl_hardening.sql (no human-GO before this one)
  20261120000000_meta_lead_whatsapp_outreach.sql
  20261120010000_m7_meta_lead_whatsapp_outreach_acl_hardening.sql (no human-GO before this one)
  20261121000000_whatsapp_consent_revocation.sql
  20261121010000_m8_whatsapp_consent_revocation_acl_hardening.sql (no human-GO before this one)

WAVE 4A
  20261130000000_creative_property_compatibility.sql

WAVE 4B
  20261201000000_campaign_stack_property_compatibility.sql

WAVE 4C
  (application deploy, no SQL file)

WAVE 5 (execution order intentionally reversed from filename order)
  20261202000000_provision_workspace_billing_acl_hardening.sql
  20261129000000_sensitive_rpc_acl_hardening.sql
  20261128000000_service_role_acl_hardening.sql
```

**Excluded — never applied raw to Production:**
```
20261122000000_creative_campaign_property_alignment.sql
20261123000000_campaign_strategist.sql
20261124000000_campaign_creative_packages.sql
20261125000000_campaign_image_generation.sql
20261127000000_campaign_meta_lead_forms.sql
```

## Appendix B — Provenance

This runbook is derived from, and should be read alongside:
- DBV0–DBV1E: fresh-chain audit, repair, and service-role ACL hardening.
- DBV2: Production read-only migration-history/schema reconciliation.
- DBV3A/SEC1/SEC1B/SEC2: Production Creative-schema design audit and
  sensitive-RPC ACL hardening.
- DBV3B/DBV3C/DBV3D: Production-safe C1 and C2/C3/C4/C6 compatibility
  migrations, and the application read-side compatibility fix.
- DBV4: the original (uncorrected) wave design and its billing/ACL/rollback
  analysis, still valid except for the M-series/E-series ordering corrected
  in §1 of this document.
- DBV4B: the staging rehearsal that found the ordering defect this runbook
  corrects, and independently validated every other wave.
