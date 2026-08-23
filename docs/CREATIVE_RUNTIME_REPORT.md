# Creative Runtime Report

## Data flow

Creative Studio now follows one authoritative project graph:

`Creative UI -> CreativeGenerationService -> Supabase -> property_projects / property_units / property_documents -> governed Creative RPCs`

## Repairs

The assistant's project selector and background generation worker previously queried relations that have never existed in the production catalog or repaired deployment package. They now query the authoritative property relations. Tenant predicates on the assistant query are preserved, and worker access remains through the existing service-role client and claimed job context.

No prompt behavior, provider behavior, queue behavior, storage path, approvals, publishing restrictions, retry behavior, UI, navigation or business logic changed.

## Dependency checks

- `creative_campaigns.project_id`, `creative_assets.project_id`, `creative_timeline.project_id`, `creative_generation_jobs.project_id`, and `creative_campaign_packs.project_id` target `property_projects` in staged SQL.
- Project, unit and document fields requested by the worker exist in the staged property schema.
- `enqueue_creative_generation` uses `public.property_projects%rowtype` and validates tenant membership and Marketing Studio management permission.
- `claim_creative_generation` and `complete_creative_generation` retain service-role enforcement.
- `vayon-assets` remains the configured private asset bucket; no storage dependency was renamed.

## Module status

| Module | Status | Notes |
| --- | --- | --- |
| Creative Studio | READY | Runtime physical relations align with the repaired schema |
| Marketing Studio | READY | Uses existing Creative services and licensing; no obsolete inventory query found |
| Growth Studio | READY | Project foreign key and staged RPC use the authoritative Creative/property graph |
| Knowledge | READY | No dependency on the renamed property relations |

## Recommendation

**GO WITH CONDITIONS** for runtime/schema alignment. Production activation remains operationally dependent on executing the separately reviewed deployment package; this sprint intentionally performed no deployment or SQL execution.
