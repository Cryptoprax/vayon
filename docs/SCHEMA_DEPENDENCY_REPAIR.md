# Sprint 93 schema dependency repair

Date: 2026-08-24  
Scope: staged Version 1 SQL package only  
Production SQL executed: **No**  
Deployment performed: **No**

## Repair decision

`public.inventory_projects` is classified as **C. Incorrect object name**.

Repository evidence:

1. No migration, frozen production-catalog entry, view, or staged definition creates `public.inventory_projects`.
2. Sprint 78 introduced `public.property_projects` before Creative Studio migrations.
3. `property_projects` is the authoritative project relation used by the production property repository.
4. It contains every field required by Creative SQL: `id`, `organization_id`, `workspace_id`, `name`, and `developer`.
5. Creative Studio uses the project identity to scope campaigns, assets, jobs, timeline events, and campaign packs to authoritative real-estate projects.

The package generator now normalizes only staged SQL references from `public.inventory_projects` to `public.property_projects`. No new table, placeholder, compatibility view, historical migration, or business behavior was introduced.

## Repaired dependencies

- `creative_campaigns.project_id → property_projects.id`
- `creative_assets.project_id → property_projects.id`
- `creative_timeline.project_id → property_projects.id`
- `creative_generation_jobs.project_id → property_projects.id`
- `creative_campaign_packs.project_id → property_projects.id`
- `create_creative_campaign_draft()` project validation source
- `enqueue_creative_generation()` `%ROWTYPE` and project lookup source

## Complete static audit result

| Dependency class | Result |
| --- | --- |
| Tables and views | PASS — all packaged references resolve to frozen production or an earlier staged definition |
| Foreign keys | PASS — no forward or missing targets |
| Functions/RPCs | PASS — no missing table dependencies or unresolved packaged helper calls |
| Triggers | PASS — all seven target tables and functions resolve |
| Policies | PASS — all 173 target relations resolve |
| Indexes | PASS — all 87 target relations resolve; no duplicate identities |
| Extensions | PASS — `pgcrypto` is created in stage 001 before digest-dependent reconciliation |
| Sequences | PASS — no explicit sequence dependency exists |
| Enums/domains | PASS — package uses inline types/checks; no external enum/domain dependency exists |
| Generated columns | PASS — four generated expressions reference same-row columns and built-in expressions only |
| Storage buckets | PASS — two unique IDs; storage relation dependencies are supplied by Supabase |

Static inventory: 92 tables, 69 additive columns, 87 indexes, 102 functions, 173 policies, 7 triggers, and 2 buckets.

## Module status

- Marketing/Creative/Growth Studio: schema dependency repaired.
- Knowledge: dependency-complete.
- Product Intelligence and Continuous Learning: dependency-complete.
- Billing and Notifications: dependency-complete.
- Organizations, CRM, Properties, and AI Workforce schema surfaces: dependency-complete.

## Scope boundary and remaining review

Application runtime code still queries obsolete `inventory_projects`, `inventory_units`, and `inventory_documents` names. Sprint 93 explicitly restricts changes to schema dependencies, so runtime business logic was not modified. Creative schema installation is dependency-complete, but Creative runtime activation remains separately blocked until that application mapping is reconciled under an authorized application change.

The schema graph now passes static rehearsal. This does not replace PostgreSQL parsing, clone execution, semantic RLS/idempotency repair, lock measurement, or provider readiness work identified by Sprint 92.

## Result

Schema dependency graph: **PASS**  
Deployment package dependency status: **INTERNALLY CONSISTENT**  
Overall production deployment status: **NO-GO pending non-dependency blockers and clone rehearsal**
