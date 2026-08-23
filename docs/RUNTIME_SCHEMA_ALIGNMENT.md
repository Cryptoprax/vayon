# Version 1 Runtime Schema Alignment

## Result

Sprint 94 aligned the executable application runtime with the repaired Version 1 deployment schema. No SQL was executed, no migration history was changed, and no compatibility object was introduced.

| Measure | Result |
| --- | ---: |
| Candidate occurrences reviewed | 332 |
| Incorrect runtime/test references found | 7 |
| Incorrect references repaired | 7 |
| Remaining obsolete names in executable application code | 0 |
| Remaining runtime blockers caused by obsolete inventory names | 0 |

The seven repairs are four query targets in `features/vayon/creative-studio/generation.service.ts` and three assertions in `tests/sprint82-5-ai-creative-generation.test.mjs`.

## Authoritative mapping

| Obsolete physical relation | Authoritative relation | Evidence |
| --- | --- | --- |
| `inventory_projects` | `property_projects` | Sprint 78 schema, property repository, staged core schema, Creative foreign keys and RPC bodies |
| `inventory_units` | `property_units` | Sprint 78 schema, property repository and staged core schema |
| `inventory_documents` | `property_documents` | Sprint 78 schema, property repository and staged core schema |

No domain model was renamed. `InventoryProject`, `InventoryUnit`, `InventoryDocument`, the inventory module path, `inventory_imported`, and `property_inventory_audit` describe valid product concepts rather than obsolete database objects.

## Runtime verification scope

- TypeScript, JavaScript, React and Next.js application sources
- Supabase `.from()` and `.rpc()` call sites
- repositories, services, providers, actions, hooks and API routes
- validation schemas and shared types
- generated/staged SQL strings used by the deployment package
- Creative Studio, Marketing/Growth Studio, Knowledge, Billing, CRM, AI Workforce, landing-page and public-site paths

Literal obsolete relations are absent from `app/`, `features/`, `lib/`, and runtime tests. The deployment package defines the authoritative property relations before Creative foreign keys and its Creative functions refer to `public.property_projects`.

## Status

- Creative Studio runtime: **ALIGNED**
- Marketing/Growth runtime: **ALIGNED** with the same Creative project identity
- Knowledge runtime: **ALIGNED; no inventory schema dependency**
- Overall repository/database alignment: **GO WITH CONDITIONS**. Runtime code is aligned; deploy the separately certified Version 1 schema package before activating schema objects not yet present in the frozen production catalog.
