-- Sprint 123: Stripe is the commercial source of subscription lifecycle state.
-- Event projection is idempotent through billing_events(provider, provider_event_id).

update public.subscription_plans set active=true,sort_order=1,
  limits='{"workspaces":1,"users":3,"storage_gb":10,"ai_requests":1000,"exports":25,"reports":25,"workflows":0,"automations":0,"integrations":0,"knowledge_articles":100,"creative_assets":25,"api_calls":0}'::jsonb,
  features=array['crm','calendar','basic_ai','knowledge','email']
where code='starter';
update public.subscription_plans set active=true,sort_order=2,
  limits='{"workspaces":3,"users":10,"storage_gb":100,"ai_requests":10000,"exports":500,"reports":500,"workflows":100,"automations":100,"integrations":5,"knowledge_articles":1000,"creative_assets":500,"api_calls":10000}'::jsonb,
  features=array['crm','calendar','basic_ai','knowledge','email','integrations_marketplace','marketing_ai','sales_ai','customer_success','creative_studio','workflow_automation','google','microsoft','whatsapp','automation']
where code='professional';
update public.subscription_plans set active=true,sort_order=3,
  limits='{"workspaces":10,"users":50,"storage_gb":500,"ai_requests":50000,"exports":2500,"reports":2500,"workflows":1000,"automations":1000,"integrations":25,"knowledge_articles":10000,"creative_assets":2500,"api_calls":100000}'::jsonb,
  features=array['crm','calendar','basic_ai','knowledge','email','integrations_marketplace','marketing_ai','sales_ai','customer_success','creative_studio','workflow_automation','google','microsoft','whatsapp','automation','advanced_ai','advanced_analytics','approvals','api','priority_support']
where code='business';
update public.subscription_plans set active=true,sort_order=4,
  limits='{"workspaces":null,"users":null,"storage_gb":null,"ai_requests":null,"exports":null,"reports":null,"workflows":null,"automations":null,"integrations":null,"knowledge_articles":null,"creative_assets":null,"api_calls":null}'::jsonb,
  features=array['crm','calendar','basic_ai','knowledge','email','integrations_marketplace','marketing_ai','sales_ai','customer_success','creative_studio','workflow_automation','google','microsoft','whatsapp','automation','advanced_ai','advanced_analytics','approvals','api','priority_support','white_label','sso','custom_domain','audit','custom_roles','advanced_security','priority_ai','founder_tools']
where code='enterprise';

alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions add constraint subscriptions_status_check
  check (status in ('trialing','active','past_due','paused','cancelled','expired','suspended'));

create index if not exists billing_events_type_created_idx
  on public.billing_events(event_type, created_at desc);
create index if not exists subscriptions_status_period_idx
  on public.subscriptions(status, current_period_ends_at)
  where deleted_at is null;

create or replace function public.process_stripe_billing_event(
  p_event_id text,
  p_event_type text,
  p_payload jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_workspace uuid;
  v_customer text;
  v_billing_customer uuid;
  v_subscription uuid;
  v_plan uuid;
  v_plan_code text;
  v_status text;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;
  if p_event_id is null or p_event_type is null or p_payload is null then
    raise exception 'invalid stripe event envelope';
  end if;

  v_customer := nullif(p_payload->>'customer', '');
  v_org := nullif(coalesce(
    p_payload->'metadata'->>'organization_id',
    p_payload->'subscription_details'->'metadata'->>'organization_id',
    p_payload->'parent'->'subscription_details'->'metadata'->>'organization_id'
  ), '')::uuid;
  v_workspace := nullif(coalesce(
    p_payload->'metadata'->>'workspace_id',
    p_payload->'subscription_details'->'metadata'->>'workspace_id',
    p_payload->'parent'->'subscription_details'->'metadata'->>'workspace_id'
  ), '')::uuid;

  if v_workspace is null and v_customer is not null then
    select organization_id, workspace_id into v_org, v_workspace
      from public.billing_customers
     where provider = 'stripe' and provider_customer_id = v_customer;
  end if;
  if v_workspace is null and v_org is not null then
    select id into v_workspace from public.workspaces
     where organization_id = v_org and status = 'active'
     order by created_at limit 1;
  end if;
  if v_workspace is not null then
    select organization_id into v_org from public.workspaces where id = v_workspace;
  end if;

  insert into public.billing_events(
    organization_id, workspace_id, provider, provider_event_id, event_type, status, payload
  ) values (
    v_org, v_workspace, 'stripe', p_event_id, p_event_type, 'received', p_payload
  ) on conflict(provider, provider_event_id) do nothing;
  if not found then return; end if;

  if p_event_type = 'checkout.session.completed' then
    if v_org is null or v_workspace is null or v_customer is null then
      raise exception 'stripe checkout is missing tenant metadata';
    end if;
    insert into public.billing_customers(
      organization_id, workspace_id, provider, provider_customer_id, livemode, email
    ) values (
      v_org, v_workspace, 'stripe', v_customer,
      coalesce((p_payload->>'livemode')::boolean, false),
      p_payload->'customer_details'->>'email'
    ) on conflict(workspace_id) do update set
      provider = 'stripe',
      provider_customer_id = excluded.provider_customer_id,
      livemode = excluded.livemode,
      email = coalesce(excluded.email, public.billing_customers.email),
      updated_at = now();
    update public.subscriptions set
      provider = 'stripe',
      provider_customer_id = v_customer,
      provider_subscription_id = coalesce(nullif(p_payload->>'subscription',''), provider_subscription_id),
      updated_at = now()
    where organization_id = v_org and workspace_id = v_workspace and deleted_at is null;

  elsif p_event_type in (
    'customer.subscription.created', 'customer.subscription.updated',
    'customer.subscription.deleted', 'customer.subscription.trial_will_end'
  ) then
    if v_org is null or v_workspace is null or v_customer is null then
      raise exception 'stripe subscription is missing tenant metadata';
    end if;
    insert into public.billing_customers(
      organization_id, workspace_id, provider, provider_customer_id, livemode
    ) values (
      v_org, v_workspace, 'stripe', v_customer,
      coalesce((p_payload->>'livemode')::boolean, false)
    ) on conflict(workspace_id) do update set
      provider = 'stripe', provider_customer_id = excluded.provider_customer_id,
      livemode = excluded.livemode, updated_at = now();

    select id into v_subscription from public.subscriptions
     where organization_id = v_org and workspace_id = v_workspace and deleted_at is null;
    if v_subscription is null then raise exception 'workspace subscription is not provisioned'; end if;

    v_plan_code := nullif(p_payload->'metadata'->>'plan_code','');
    if v_plan_code is not null then
      select id into v_plan from public.subscription_plans where code = v_plan_code and active;
      if v_plan is null then raise exception 'unknown subscription plan %', v_plan_code; end if;
    end if;
    v_status := case
      when p_event_type = 'customer.subscription.deleted' then 'cancelled'
      when p_payload->>'status' = 'trialing' then 'trialing'
      when p_payload->>'status' = 'active' then 'active'
      when p_payload->>'status' in ('past_due','unpaid','incomplete') then 'past_due'
      when p_payload->>'status' = 'paused' then 'paused'
      when p_payload->>'status' = 'canceled' then 'cancelled'
      when p_payload->>'status' = 'incomplete_expired' then 'expired'
      else null
    end;

    if p_event_type <> 'customer.subscription.trial_will_end' then
      update public.subscriptions set
        provider = 'stripe',
        provider_customer_id = v_customer,
        provider_subscription_id = p_payload->>'id',
        provider_price_id = coalesce(p_payload->'items'->'data'->0->'price'->>'id', provider_price_id),
        plan_id = coalesce(v_plan, plan_id),
        status = coalesce(v_status, status),
        cancel_at_period_end = coalesce((p_payload->>'cancel_at_period_end')::boolean, false),
        seat_quantity = greatest(1, coalesce((p_payload->'items'->'data'->0->>'quantity')::integer, seat_quantity)),
        trial_ends_at = case when p_payload->>'trial_end' is null then trial_ends_at else to_timestamp((p_payload->>'trial_end')::bigint) end,
        current_period_ends_at = case when p_payload->>'current_period_end' is null then current_period_ends_at else to_timestamp((p_payload->>'current_period_end')::bigint) end,
        updated_at = now(), version = version + 1
      where id = v_subscription;

      insert into public.subscription_items(
        organization_id, workspace_id, subscription_id, provider_item_id,
        provider_price_id, quantity, metered
      ) select
        v_org, v_workspace, v_subscription, item->>'id', item->'price'->>'id',
        greatest(1, coalesce((item->>'quantity')::integer,1)),
        coalesce((item->'price'->'recurring'->>'usage_type') = 'metered', false)
      from jsonb_array_elements(coalesce(p_payload->'items'->'data','[]'::jsonb)) item
      on conflict(provider_item_id) do update set
        provider_price_id = excluded.provider_price_id,
        quantity = excluded.quantity,
        metered = excluded.metered,
        updated_at = now();

      if v_plan is not null then
        insert into public.organization_limits(organization_id,workspace_id,metric,limit_value,source)
        select v_org,v_workspace,key,
          case when jsonb_typeof(value)='null' then null else (value#>>'{}')::numeric end,
          'plan'
        from public.subscription_plans p, jsonb_each(p.limits)
        where p.id = v_plan
        on conflict(workspace_id,metric) do update set
          limit_value = excluded.limit_value, source = 'plan', updated_at = now();
      end if;
    end if;

  elsif p_event_type in ('invoice.finalized','invoice.paid','invoice.payment_failed') then
    if v_workspace is null then raise exception 'stripe invoice customer is not linked to a workspace'; end if;
    select id into v_subscription from public.subscriptions
     where organization_id = v_org and workspace_id = v_workspace and deleted_at is null;
    if v_subscription is null then raise exception 'workspace subscription is not provisioned'; end if;
    insert into public.invoices(
      organization_id,workspace_id,subscription_id,invoice_number,status,currency,
      subtotal,tax,issued_at,due_at,paid_at,download_url,provider_invoice_id,
      payment_intent_id,created_by,metadata
    ) select
      v_org,v_workspace,v_subscription,coalesce(p_payload->>'number',p_payload->>'id'),
      case when p_event_type='invoice.paid' then 'paid' when p_event_type='invoice.payment_failed' then 'failed' else 'open' end,
      upper(coalesce(p_payload->>'currency','usd')),
      coalesce((p_payload->>'subtotal')::numeric/100,0),
      coalesce((p_payload->'total_tax_amounts'->0->>'amount')::numeric/100,0),
      to_timestamp((p_payload->>'created')::bigint),
      case when p_payload->>'due_date' is null then null else to_timestamp((p_payload->>'due_date')::bigint) end,
      case when p_event_type='invoice.paid' then now() end,
      p_payload->>'hosted_invoice_url',p_payload->>'id',p_payload->>'payment_intent',created_by,p_payload
    from public.subscriptions where id=v_subscription
    on conflict(provider_invoice_id) do update set
      status=excluded.status,paid_at=excluded.paid_at,
      download_url=excluded.download_url,metadata=excluded.metadata,updated_at=now();
    if p_event_type='invoice.payment_failed' then
      update public.subscriptions set status='past_due',updated_at=now(),version=version+1 where id=v_subscription;
    elsif p_event_type='invoice.paid' then
      update public.subscriptions set status='active',updated_at=now(),version=version+1
       where id=v_subscription and status in ('past_due','paused');
    end if;

  elsif p_event_type = 'customer.updated' then
    update public.billing_customers set
      email=coalesce(p_payload->>'email',email),
      address=coalesce(p_payload->'address',address),
      tax_exempt=coalesce(p_payload->>'tax_exempt',tax_exempt),
      updated_at=now()
    where provider='stripe' and provider_customer_id=p_payload->>'id';

  elsif p_event_type in ('payment_method.attached','payment_method.detached') then
    select id,organization_id,workspace_id into v_billing_customer,v_org,v_workspace
      from public.billing_customers
     where provider='stripe' and provider_customer_id=p_payload->>'customer';
    if v_billing_customer is null then raise exception 'stripe payment method customer is not linked'; end if;
    if p_event_type='payment_method.attached' then
      insert into public.payment_methods(
        organization_id,workspace_id,billing_customer_id,provider_payment_method_id,
        type,brand,last4,expiry_month,expiry_year
      ) values (
        v_org,v_workspace,v_billing_customer,p_payload->>'id',p_payload->>'type',
        p_payload->'card'->>'brand',p_payload->'card'->>'last4',
        nullif(p_payload->'card'->>'exp_month','')::integer,
        nullif(p_payload->'card'->>'exp_year','')::integer
      ) on conflict(provider_payment_method_id) do update set
        billing_customer_id=excluded.billing_customer_id,
        brand=excluded.brand,last4=excluded.last4,
        expiry_month=excluded.expiry_month,expiry_year=excluded.expiry_year,
        detached_at=null;
    else
      update public.payment_methods set detached_at=now(),is_default=false
       where provider_payment_method_id=p_payload->>'id';
    end if;
  end if;

  update public.billing_events set
    status = case when p_event_type in (
      'checkout.session.completed','customer.subscription.created','customer.subscription.updated',
      'customer.subscription.deleted','customer.subscription.trial_will_end',
      'invoice.finalized','invoice.paid','invoice.payment_failed','customer.updated',
      'payment_method.attached','payment_method.detached'
    ) then 'processed' else 'ignored' end,
    processed_at=now(),organization_id=coalesce(organization_id,v_org),workspace_id=coalesce(workspace_id,v_workspace)
  where provider='stripe' and provider_event_id=p_event_id;
exception when others then
  update public.billing_events set status='failed',error_code=sqlstate,processed_at=now()
   where provider='stripe' and provider_event_id=p_event_id;
  raise;
end
$$;

revoke all on function public.process_stripe_billing_event(text,text,jsonb) from public;
grant execute on function public.process_stripe_billing_event(text,text,jsonb) to service_role;
