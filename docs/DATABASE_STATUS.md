# RC1 production database status

Project: `aanonopiylqpfvpoqvdc`  
Inspection: read-only  
Migration history: absent  
Decision: **BLOCKING — Version 1 patch not yet applied**

| Surface | EXISTS | MISSING / BLOCKING |
| --- | ---: | ---: |
| Tables | 85 | 90 required Version 1 public tables |
| Columns | 1045 | 69 required Version 1 columns |
| Indexes | 181 | 87 required Version 1 indexes |
| Functions/RPCs | 99 | 101 required Version 1 functions |
| Triggers | 8 | 7 required Version 1 triggers |
| Policies | 80 | 78 directly cataloged Version 1 policies plus generated policy families |
| Storage buckets | 1 | `knowledge-documents`, `product-feedback` |
| Views | 0 | None required by catalog comparison |
| Realtime publications | 0 | OPTIONAL unless a reviewed module requires realtime |

## Missing or partial migration units (31)

- **MISSING** `20260814000000_sprint43_google_identity_workspace.sql` (0/19 catalog objects present)
- **MISSING** `20260815020000_sprint50_stripe_billing_platform.sql` (0/22 catalog objects present)
- **MISSING** `20260820000000_sprint51_enterprise_organization.sql` (0/30 catalog objects present)
- **MISSING** `20260821000000_sprint57_ai_collaboration.sql` (0/16 catalog objects present)
- **MISSING** `20260822000000_sprint58_enterprise_security.sql` (0/29 catalog objects present)
- **PARTIALLY REPRESENTED** `20260823000000_sprint59_enterprise_notifications.sql` (1/31 catalog objects present)
- **MISSING** `20260824000000_sprint60_enterprise_email.sql` (0/13 catalog objects present)
- **MISSING** `20260825000000_sprint61_enterprise_workflow_automation.sql` (0/17 catalog objects present)
- **MISSING** `20260826000000_sprint62_enterprise_customer_onboarding.sql` (0/17 catalog objects present)
- **MISSING** `20260827000000_sprint63_enterprise_knowledge_platform.sql` (0/13 catalog objects present)
- **MISSING** `20260828000000_sprint64_production_deployment_platform.sql` (0/2 catalog objects present)
- **MISSING** `20260829000000_sprint65_enterprise_performance_optimization.sql` (0/10 catalog objects present)
- **MISSING** `20260830000000_sprint66_enterprise_security_hardening.sql` (0/3 catalog objects present)
- **MISSING** `20260831000000_sprint67_public_marketing_platform.sql` (0/6 catalog objects present)
- **MISSING** `20260901000000_sprint68_documentation_platform.sql` (0/4 catalog objects present)
- **MISSING** `20260902000000_sprint69_marketing_asset_observability.sql` (0/1 catalog objects present)
- **MISSING** `20260902120000_sprint69_2_enterprise_conversion_analytics.sql` (0/5 catalog objects present)
- **MISSING** `20260902180000_sprint69_5_launch_readiness_audit.sql` (0/3 catalog objects present)
- **MISSING** `20260906000000_sprint76_enterprise_organization_management.sql` (0/15 catalog objects present)
- **MISSING** `20260907000000_sprint78_enterprise_property_inventory.sql` (0/16 catalog objects present)
- **MISSING** `20260908000000_sprint79_enterprise_site_visits.sql` (0/30 catalog objects present)
- **MISSING** `20260909000000_sprint80_ai_property_matching.sql` (0/14 catalog objects present)
- **MISSING** `20260910000000_sprint81_enterprise_communications_hub.sql` (0/20 catalog objects present)
- **MISSING** `20260911000000_sprint82_creative_studio_beta.sql` (0/20 catalog objects present)
- **MISSING** `20260912000000_sprint82_5_ai_creative_generation.sql` (0/17 catalog objects present)
- **MISSING** `20260913000000_sprint82_6_ai_growth_studio.sql` (0/12 catalog objects present)
- **MISSING** `20260914000000_sprint83_enterprise_commercial_platform.sql` (0/12 catalog objects present)
- **PARTIALLY REPRESENTED** `20260916000000_sprint84_2_public_contact_reliability.sql` (1/7 catalog objects present)
- **MISSING** `20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql` (0/19 catalog objects present)
- **MISSING** `20260917000000_sprint86_4_product_intelligence.sql` (0/8 catalog objects present)
- **MISSING** `20260918000000_sprint86_5_continuous_learning.sql` (0/16 catalog objects present)

Required deployment artifacts: `supabase/reconciliation/VERSION1_PRODUCTION_PATCH.sql` and `VERSION1_POST_DEPLOY_CHECK.sql`. Do not replay history or run db push.
