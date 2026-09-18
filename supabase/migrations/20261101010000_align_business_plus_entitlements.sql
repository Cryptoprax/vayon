-- Align Business Plus with its approved finite-quota product decision. Business
-- Plus remains self-service and must sit strictly between Business and
-- Enterprise instead of sharing Enterprise's unlimited quotas.
--
-- Scope: exactly one row (subscription_plans.code = 'business_plus'), exactly
-- one column (limits). No other plan, no organization_limits row, and no
-- subscription_plans.features value is touched here — Business Plus feature
-- access is an explicitly separate, not-yet-approved decision.
--
-- process_paddle_billing_event_core237 projects subscription_plans.limits into
-- organization_limits via jsonb_each(p.limits) keyed by p.id resolved from
-- p_payload->custom_data->plan_code = 'business_plus'. This UPDATE is the only
-- change required for that existing projection to apply the corrected values
-- on the next subscription webhook for each Business Plus organization; no
-- webhook/projection code change is needed.
--
-- Apply only through the reviewed migration process.
begin;

update public.subscription_plans
set
  limits = '{
    "workspaces": 25,
    "users": 150,
    "storage_gb": 1500,
    "ai_requests": 150000,
    "exports": 7500,
    "reports": 7500,
    "workflows": 3000,
    "automations": 3000,
    "integrations": 75,
    "knowledge_articles": 30000,
    "creative_assets": 7500,
    "api_calls": 300000
  }'::jsonb,
  updated_at = now()
where code = 'business_plus';

commit;
