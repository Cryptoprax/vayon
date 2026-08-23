# Version 1 database dependency graph

> Historical Sprint 92 graph. Sprint 93 replaced the unsupported `inventory_projects` edge with the authoritative `property_projects` dependency.

## Stage graph

```text
Frozen production catalog
        │
        ▼
PRE_DEPLOY_VALIDATION (read only)
        │
        ▼
001 Core schema + pgcrypto
        │
        ├── BLOCKED: public.inventory_projects is absent
        │       ├── creative_campaigns
        │       ├── creative_assets
        │       ├── creative_timeline
        │       ├── creative_generation_jobs
        │       └── creative_campaign_packs
        ▼
002 Additive columns and constraints
        ▼
003 Concurrent indexes
        ▼
004 Functions/RPCs and grants
        ▼
005 RLS policies and triggers
        ▼
006 Storage buckets
        ▼
007 No-op seed stage
        ▼
008 + POST_DEPLOY_VALIDATION (read only)
```

## Principal object dependencies

```text
auth.users
  └─ user_profiles
      └─ handle_new_user_profile trigger

organizations
  └─ workspaces
      ├─ organization/team/security tables
      ├─ billing/usage tables
      ├─ notifications/email/workflow tables
      ├─ knowledge/product-intelligence tables
      ├─ property/site-visit/matching tables
      └─ creative/growth tables

property_projects (created by stage 001)
  └─ property_towers / property_units / inventory audit

inventory_projects (MISSING)
  └─ creative_campaigns
      ├─ creative_assets
      ├─ creative_timeline
      ├─ creative_generation_jobs
      └─ creative_campaign_packs

004 helper functions
  ├─ 005 RLS policy expressions
  └─ 005 trigger functions

storage.buckets
  ├─ knowledge-documents
  └─ product-feedback
      └─ storage.objects policies
```

## Ordering findings

- Tables required by additive columns and indexes are otherwise available from the frozen catalog or stage 001.
- Policy target tables exist by stage 005.
- All seven trigger target tables and trigger functions are present by stage 005.
- Storage policies are created in stage 005 before bucket rows in stage 006. PostgreSQL permits this because policies reference bucket IDs as text, but operational verification must occur only after stage 006.
- The missing `inventory_projects` dependency is fatal and cannot be solved by reordering existing stages because no stage defines it.

## Unproven runtime dependencies

PL/pgSQL function bodies contain references to existing and newly created tables. Static token scanning cannot substitute for PostgreSQL parse/rehearsal because dynamic SQL and deferred PL/pgSQL resolution exist. A clone execution remains mandatory after the explicit dependency blockers are corrected.
