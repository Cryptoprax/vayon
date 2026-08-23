# Version 1 foreign-key graph

## Audit result

- New table definitions: 92
- Foreign-key references inspected: 277
- Missing targets: 0
- Forward targets absent from production: 0
- Circular creation blockers: 0
- Repaired incorrect-name edges: 5

## Principal graph

```text
auth.users
  └─ user_profiles / identity / audit / approval ownership

organizations
  └─ workspaces
      ├─ organization members, departments and teams
      ├─ billing, usage, invoices and payment methods
      ├─ notifications, email and workflow
      ├─ knowledge and product intelligence
      ├─ property inventory and site visits
      └─ creative, growth and continuous learning

property_projects
  ├─ property_towers
  │   └─ property_units
  ├─ property_price_revisions
  ├─ property_documents
  ├─ property_inventory_audit
  ├─ creative_campaigns
  │   ├─ creative_assets
  │   ├─ creative_timeline
  │   ├─ creative_generation_jobs
  │   └─ creative_campaign_packs
  └─ site-visit and property-matching references

workflow_definitions
  └─ workflow_instances
      ├─ workflow_step_executions
      └─ workflow_automation_approvals

knowledge_articles
  ├─ knowledge_article_versions
  └─ knowledge_article_relations
```

## Ordering

All FK targets are either:

1. Present in the frozen production catalog, including Supabase `auth` and `storage` relations; or
2. Created earlier in `001_core_schema.sql` before the referencing table.

Stage 002 adds columns only after stage 001 completes. Stage 003 creates indexes only after all target relations exist. Functions precede policies and triggers. No FK relies on a later stage.

## Referential-action review

The package contains intentional `ON DELETE CASCADE` and `ON DELETE SET NULL` relationships. They do not delete data during deployment, but future parent deletion can propagate according to those definitions. This report certifies dependency existence and order, not business approval of every future delete behavior.
