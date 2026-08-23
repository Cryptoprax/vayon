# Production Database Reconciliation

Audit date: 2026-08-23  
Project: `aanonopiylqpfvpoqvdc`  
Decision: **FAIL — reconciliation is not approved for production execution**

## Executive result

The production database is live and populated. It contains 77 public tables and eight Supabase-managed storage tables. The local repository contains 36 ordered migrations, but `supabase_migrations.schema_migrations` does not exist remotely.

The database is **not** equivalent to the complete local migration chain:

- 4 migrations are structurally represented.
- 2 migrations are partially represented.
- 29 migrations are structurally missing.
- 1 data-only migration cannot be proven through catalog inspection.

No migration SQL, history repair, `db push`, DDL, DML, or storage mutation was executed. Inspection used a PostgreSQL `READ ONLY` transaction plus a read-only Storage API list operation. The temporary catalog contains hashes rather than function/view/trigger definitions and contains no credentials or data rows.

## Current production schema

| Surface | Observed |
| --- | ---: |
| Public tables | 77 |
| Storage system tables | 8 |
| Columns | 1,045 |
| Constraints | 478 |
| Foreign keys | 268 |
| Primary keys | 85 |
| Unique constraints | 48 |
| Check constraints | 77 |
| Indexes | 181 (164 public, 17 storage) |
| Views / materialized views | 0 |
| Functions / RPC candidates | 99 |
| User triggers | 8 |
| Policies | 80 (76 public, 4 storage) |
| RLS-enabled tables | 85/85 |
| Extensions | 5 |
| Enums | 0 |
| User sequences | 0 |
| Storage buckets | 1 |

Public tables: `activity_events`, `ai_approval_queue`, `ai_capabilities`, `ai_conversations`, `ai_employee_capabilities`, `ai_employees`, `ai_knowledge`, `ai_recommendations`, `ai_response_cache`, `ai_runtime_outputs`, `ai_tasks`, `ai_workforce_conversations`, `ai_workforce_messages`, `billing_contacts`, `calendar_entries`, `call_logs`, `communication_notes`, `communication_saved_views`, `communication_threads`, `communications`, `countries`, `customer_health`, `customer_success_notes`, `deal_commissions`, `deal_notes`, `deal_offers`, `deal_payments`, `deal_saved_views`, `deal_site_visits`, `deal_stages`, `deals`, `demo_organizations`, `feature_flag_assignments`, `feature_flags`, `follow_ups`, `google_oauth_credentials`, `integration_connections`, `integration_health`, `integration_logs`, `integration_providers`, `integration_retry_queue`, `integration_secrets_metadata`, `integration_sync_history`, `integration_webhooks`, `invitations`, `invoices`, `lead_property_interests`, `lead_saved_views`, `lead_tags`, `leads`, `meetings`, `notification_events`, `notification_preferences`, `notification_queue`, `organization_limits`, `organization_members`, `organization_usage`, `organizations`, `platform_metrics`, `properties`, `property_saved_views`, `provider_webhook_events`, `regions`, `release_registry`, `roles`, `site_visits`, `subscription_events`, `subscription_plans`, `subscriptions`, `support_sessions`, `system_alerts`, `task_saved_views`, `tasks`, `whatsapp_connections`, `whatsapp_messages`, `workspace_members`, `workspaces`.

All 77 public tables have RLS enabled. Four public tables have no policies: `google_oauth_credentials`, `notification_queue`, `provider_webhook_events`, and `subscription_events`. With RLS enabled this is fail-closed for ordinary roles, but service-role access and application expectations must be reviewed before reconciliation.

Installed extensions are `pg_stat_statements`, `pgcrypto`, `plpgsql`, `supabase_vault`, and `uuid-ossp`. The private `leadestate-assets` bucket exists with a 20 MiB limit. `supabase_realtime` exists with insert/update/delete/truncate enabled, but contains no published tables.

## Migration coverage

“Represented” below means expected object names and altered columns exist. It is not authorization to create history records: semantic equivalence of every definition, grant, seed row, and policy predicate must still be proven in staging.

| Migration | Classification | Coverage |
| --- | --- | ---: |
| `20260812210941_fix_billing_interval.sql` | Already represented | 1/1 |
| `20260813000000_sprint22_production_baseline.sql` | Already represented | 272/272 |
| `20260814000000_sprint43_google_identity_workspace.sql` | Missing | 0/19 |
| `20260815000000_sprint49_live_ai_workforce.sql` | Already represented | 9/9 |
| `20260815010000_sprint49_1_workforce_latency.sql` | Already represented | 1/1 |
| `20260815020000_sprint50_stripe_billing_platform.sql` | Missing | 0/22 |
| `20260820000000_sprint51_enterprise_organization.sql` | Missing | 0/30 |
| `20260821000000_sprint57_ai_collaboration.sql` | Missing | 0/16 |
| `20260822000000_sprint58_enterprise_security.sql` | Missing | 0/29 |
| `20260823000000_sprint59_enterprise_notifications.sql` | Partially represented | 1/31 |
| `20260824000000_sprint60_enterprise_email.sql` | Missing | 0/13 |
| `20260825000000_sprint61_enterprise_workflow_automation.sql` | Missing | 0/17 |
| `20260826000000_sprint62_enterprise_customer_onboarding.sql` | Missing | 0/17 |
| `20260827000000_sprint63_enterprise_knowledge_platform.sql` | Missing | 0/13 |
| `20260828000000_sprint64_production_deployment_platform.sql` | Missing | 0/2 |
| `20260829000000_sprint65_enterprise_performance_optimization.sql` | Missing | 0/10 |
| `20260830000000_sprint66_enterprise_security_hardening.sql` | Missing | 0/3 |
| `20260831000000_sprint67_public_marketing_platform.sql` | Missing | 0/6 |
| `20260901000000_sprint68_documentation_platform.sql` | Missing | 0/4 |
| `20260902000000_sprint69_marketing_asset_observability.sql` | Missing | 0/1 |
| `20260902120000_sprint69_2_enterprise_conversion_analytics.sql` | Missing | 0/5 |
| `20260902180000_sprint69_5_launch_readiness_audit.sql` | Missing | 0/3 |
| `20260906000000_sprint76_enterprise_organization_management.sql` | Missing | 0/15 |
| `20260907000000_sprint78_enterprise_property_inventory.sql` | Missing | 0/16 |
| `20260908000000_sprint79_enterprise_site_visits.sql` | Missing | 0/12 |
| `20260909000000_sprint80_ai_property_matching.sql` | Missing | 0/14 |
| `20260910000000_sprint81_enterprise_communications_hub.sql` | Missing | 0/20 |
| `20260911000000_sprint82_creative_studio_beta.sql` | Missing | 0/20 |
| `20260912000000_sprint82_5_ai_creative_generation.sql` | Missing | 0/17 |
| `20260913000000_sprint82_6_ai_growth_studio.sql` | Missing | 0/12 |
| `20260914000000_sprint83_enterprise_commercial_platform.sql` | Missing | 0/12 |
| `20260915000000_sprint84_1_marketing_studio_production.sql` | Conflicting / unproven data-only change | 0 catalog objects |
| `20260916000000_sprint84_2_public_contact_reliability.sql` | Partially represented | 1/7 |
| `20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql` | Missing | 0/19 |
| `20260917000000_sprint86_4_product_intelligence.sql` | Missing | 0/8 |
| `20260918000000_sprint86_5_continuous_learning.sql` | Missing | 0/16 |

### Partial migration gaps

Sprint 59 has only one of 31 inspected objects. Missing items include `notification_reminders`, notification mutation/preference/reminder/observability RPCs, four integration triggers, three indexes, and 13 notification columns.

Sprint 84.2 has only one of seven objects. Missing items are `marketing_leads`, `marketing_events`, `capture_public_marketing_lead`, `record_public_marketing_event`, and two indexes. This directly explains why production contact/marketing reliability cannot be assumed from application code alone.

## Conflicts and uncertainty

- Catalog presence does not prove column order, exact constraints, function bodies, grants, policy predicates, or seed values match local SQL. Definition hashes were collected for comparison without retaining executable bodies.
- Four source migrations contain destructive syntax and must never be replayed as-is: Sprint 22 baseline, Sprint 58 security, Sprint 76 organization management, and Sprint 84.1 Marketing Studio production.
- Sprint 84.1 is data-only and cannot be proven without an approved, tenant-safe data comparison.
- The CLI role cannot read bucket rows directly; the single bucket was independently verified through the Storage API. Storage policies were inspected through PostgreSQL catalogs.
- No published tables are present in `supabase_realtime`; confirm whether this is intentional before enabling any table.

## Required SQL

**No executable reconciliation SQL is approved at this stage.** Generating a monolithic script from the historical files would violate the requirement to avoid replaying destructive or non-idempotent statements. The only safe SQL currently approved is read-only verification:

```sql
begin transaction read only;

select to_regclass('supabase_migrations.schema_migrations') as migration_history;
select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where c.relkind in ('r', 'p') and n.nspname = 'public';
select count(*) from pg_policies where schemaname = 'public';
select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where c.relkind in ('r', 'p') and n.nspname = 'public' and c.relrowsecurity;
select pubname, puballtables, pubinsert, pubupdate, pubdelete, pubtruncate
 from pg_publication order by pubname;

rollback;
```

Each missing migration must be converted into its own additive repair unit using `CREATE ... IF NOT EXISTS`, guarded `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, policy existence checks in `DO` blocks, safe `CREATE OR REPLACE FUNCTION` only after signature/body review, and no destructive DDL or data rewrite. Those units must be generated from a production clone and reviewed before they can be considered required production SQL.

## Migration history decision

Status: **do not create, initialize, or repair history yet**.

Supabase documents that `migration repair --status applied` inserts a history record without running its SQL. That is appropriate only when the actual database state is known to be correct. The present audit proves the opposite for 31 migrations. Therefore:

1. Do not run `db push`.
2. Do not run `migration repair` for any version yet.
3. Reconcile and verify structural plus semantic equivalence in a production clone.
4. Only then mark individually proven migrations as applied using the official CLI command, under a change ticket and maintenance window.

Reference: [Supabase CLI migration repair](https://supabase.com/docs/reference/cli/supabase-migration-repair) and [Supabase database migration guidance](https://supabase.com/docs/guides/deployment/database-migrations).

## Deployment order

1. Rotate the temporary CLI database credential exposed during the audit dry-run and verify no credential is present in logs or artifacts.
2. Take and verify a database plus storage backup; restore it into an isolated production clone.
3. Re-run `npm run audit:migrations:production` against the clone.
4. Prove the four structurally represented migrations semantically; do not replay them.
5. Build an idempotent repair for Sprint 59's missing objects and Sprint 84.2's missing contact objects.
6. Build additive repairs for the 29 missing migrations in timestamp order, splitting destructive/data migrations into reviewed manual steps.
7. Validate RLS, grants, RPC signatures, triggers, indexes, storage policies, and application smoke tests after every repair unit.
8. Re-run the catalog audit and require zero partial/missing/conflicting classifications.
9. Repair migration history one proven version at a time; verify with `migration list` after every batch.
10. Repeat the rehearsed sequence in production under monitoring and a maintenance window.

## Rollback strategy

- Before deployment: verified point-in-time/database backup, storage inventory, configuration export, and a tested clone restore.
- During deployment: one transaction per additive repair unit, short lock and statement timeouts, stop on first error, and no concurrent schema deployment.
- Additive objects should normally be left in place and disabled at the application/feature-license layer if rollback is required; dropping them risks data loss.
- If existing data or definitions are corrupted, stop traffic and restore the verified backup. Do not improvise reverse DDL against production.
- Migration history changes are last. A history record may be reverted only when the database state and corresponding local file have been re-verified.

## Validation status

Migration/schema audit: **FAIL** because production is materially behind the local migration corpus. Application validation results are recorded separately in the Sprint 89 handoff and do not override this database failure.
