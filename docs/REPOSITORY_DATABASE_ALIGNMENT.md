# Repository / Database Alignment

## Authoritative property repository

`features/vayon/property-platform/inventory/supabase.repository.ts` establishes the application mapping:

| Repository operation | Relation | Alignment |
| --- | --- | --- |
| Projects | `property_projects` | Existing staged table and authoritative project identity |
| Towers | `property_towers` | Existing staged table |
| Units | `property_units` | Existing staged table; `project_id` references `property_projects` |
| Prices | `property_price_revisions` | Existing staged table |
| Documents | `property_documents` | Existing staged table; `project_id` references `property_projects` |
| Audit | `property_inventory_audit` | Valid authoritative audit relation |

The Creative generation service now consumes the same three relations used by this repository. It does not implement a duplicate repository, alias view, or compatibility query.

## Column projection verification

- `property_projects`: `id`, `name`, `developer`, `city`, `state`, `description`, `cover_image`, `gallery`, `organization_id`, `workspace_id`
- `property_units`: `project_id`, `bhk_type`, `area`, `price`, `offer_price`, `currency`, `status`
- `property_documents`: `project_id`, `title`, `kind`, `storage_path`

These projections are present in the authoritative Sprint 78/staged schema and already consumed by the property repository.

## RPC verification

| Runtime RPC | Staged signature | Dependencies | Result |
| --- | --- | --- | --- |
| `create_creative_campaign_draft` | `(jsonb) -> uuid` | `property_projects`, Creative tables | Aligned |
| `enqueue_creative_generation` | `(jsonb) -> uuid` | `%rowtype` and lookup use `property_projects` | Aligned |
| `claim_creative_generation` | `(uuid) -> jsonb` | `creative_generation_jobs` | Aligned |
| `complete_creative_generation` | `(uuid, boolean, text, text, text, integer, text, text) -> void` | Creative jobs/assets/editor/timeline | Aligned |
| `autosave_creative_editor` | staged Creative editor RPC | Creative editor documents | Aligned |
| `create_growth_campaign_pack` | staged Growth RPC | Creative campaign/project graph | Aligned |

Argument names used by the TypeScript clients match the staged function parameters. Service-role-only worker RPCs remain service scoped; user-facing RPCs retain authenticated authorization and tenant checks.

## Shared types and generated SQL

No generated Supabase database interface exists in the repository; repositories intentionally map database rows into domain interfaces. `InventoryProject` and related interfaces are domain types and remain correct. The generated deployment stages contain no obsolete `inventory_projects`, `inventory_units`, or `inventory_documents` reference.

## Conclusion

No obsolete inventory relation remains in an executable repository, service, provider, API route, hook, action, validation schema, shared runtime type, or generated deployment SQL. Current production still requires the approved Version 1 deployment stages for schema objects absent from the frozen catalog; Sprint 94 did not execute them.

