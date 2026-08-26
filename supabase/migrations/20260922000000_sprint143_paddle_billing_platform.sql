-- Sprint 143: Paddle is the payment provider; VAYON remains the entitlement authority.
alter table public.subscriptions add column if not exists provider_product_id text;
alter table public.subscriptions add column if not exists canceled_at timestamptz;

insert into public.subscription_plans(
  code,name,description,monthly_price,currency,limits,features,active,sort_order
) values (
  'business_plus','Business Plus','Multi-location operations with enterprise capacity',799,'USD',
  '{"workspaces":null,"users":null,"storage_gb":null,"ai_requests":null,"exports":null,"reports":null,"workflows":null,"automations":null,"integrations":null,"knowledge_articles":null,"creative_assets":null,"api_calls":null}'::jsonb,
  array['crm','calendar','basic_ai','knowledge','email','integrations_marketplace','marketing_ai','sales_ai','customer_success','creative_studio','workflow_automation','advanced_ai','advanced_analytics','approvals','api','priority_support','audit'],
  true,4
) on conflict(code) do update set active=true,sort_order=4,updated_at=now();
update public.subscription_plans set sort_order=5 where code='enterprise';

create or replace function public.process_paddle_billing_event(
  p_event_id text,
  p_event_type text,
  p_payload jsonb
) returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid;
  v_workspace uuid;
  v_customer text;
  v_subscription uuid;
  v_plan uuid;
  v_plan_code text;
  v_price text;
  v_product text;
  v_status text;
  v_invoice text;
begin
  if current_setting('role',true)<>'service_role' then raise exception 'service role required'; end if;
  if p_event_id is null or p_event_type is null or p_payload is null then
    raise exception 'invalid paddle event envelope';
  end if;

  v_customer=nullif(coalesce(p_payload->>'customer_id',p_payload->>'id'),'');
  v_org=nullif(p_payload->'custom_data'->>'organization_id','')::uuid;
  v_workspace=nullif(p_payload->'custom_data'->>'workspace_id','')::uuid;
  if v_workspace is null and v_customer is not null then
    select organization_id,workspace_id into v_org,v_workspace
      from public.billing_customers
     where provider='paddle' and provider_customer_id=v_customer;
  end if;
  if v_workspace is not null then
    select organization_id into v_org from public.workspaces where id=v_workspace;
  end if;

  insert into public.billing_events(
    organization_id,workspace_id,provider,provider_event_id,event_type,status,payload
  ) values(v_org,v_workspace,'paddle',p_event_id,p_event_type,'received',p_payload)
  on conflict(provider,provider_event_id) do nothing;
  if not found then return; end if;

  if p_event_type='customer.updated' then
    update public.billing_customers set
      email=coalesce(p_payload->>'email',email),
      address=coalesce(p_payload->'address',address),updated_at=now()
    where provider='paddle' and provider_customer_id=p_payload->>'id';

  elsif p_event_type like 'subscription.%' then
    if v_workspace is null or v_customer is null then
      raise exception 'paddle subscription is not linked to a workspace';
    end if;
    select id into v_subscription from public.subscriptions
     where organization_id=v_org and workspace_id=v_workspace and deleted_at is null;
    if v_subscription is null then raise exception 'workspace subscription is not provisioned'; end if;
    v_price=nullif(p_payload->'items'->0->'price'->>'id','');
    v_product=nullif(p_payload->'items'->0->'price'->>'product_id','');
    v_plan_code=nullif(p_payload->'custom_data'->>'plan_code','');
    if v_plan_code is not null then
      select id into v_plan from public.subscription_plans where code=v_plan_code and active;
      if v_plan is null then raise exception 'unknown subscription plan %',v_plan_code; end if;
    end if;
    v_status=case
      when p_event_type='subscription.paused' then 'paused'
      when p_event_type='subscription.canceled' then 'cancelled'
      when p_event_type='subscription.resumed' then 'active'
      when p_payload->>'status'='trialing' then 'trialing'
      when p_payload->>'status'='active' then 'active'
      when p_payload->>'status'='past_due' then 'past_due'
      when p_payload->>'status'='paused' then 'paused'
      when p_payload->>'status'='canceled' then 'cancelled'
      else null end;
    update public.subscriptions set
      provider='paddle',provider_customer_id=v_customer,
      provider_subscription_id=p_payload->>'id',provider_price_id=coalesce(v_price,provider_price_id),
      provider_product_id=coalesce(v_product,provider_product_id),plan_id=coalesce(v_plan,plan_id),
      status=coalesce(v_status,status),
      cancel_at_period_end=coalesce((p_payload->'scheduled_change'->>'action')='cancel',false),
      seat_quantity=greatest(1,coalesce((p_payload->'items'->0->>'quantity')::integer,seat_quantity)),
      current_period_ends_at=coalesce((p_payload->'current_billing_period'->>'ends_at')::timestamptz,current_period_ends_at),
      canceled_at=coalesce((p_payload->>'canceled_at')::timestamptz,canceled_at),
      updated_at=now(),version=version+1
    where id=v_subscription;
    insert into public.subscription_items(
      organization_id,workspace_id,subscription_id,provider_item_id,provider_price_id,quantity,metered
    ) select v_org,v_workspace,v_subscription,item->>'id',item->'price'->>'id',
      greatest(1,coalesce((item->>'quantity')::integer,1)),false
      from jsonb_array_elements(coalesce(p_payload->'items','[]'::jsonb)) item
      on conflict(provider_item_id) do update set provider_price_id=excluded.provider_price_id,
        quantity=excluded.quantity,updated_at=now();
    if v_plan is not null then
      insert into public.organization_limits(organization_id,workspace_id,metric,limit_value,source)
      select v_org,v_workspace,key,
        case when jsonb_typeof(value)='null' then null else (value#>>'{}')::numeric end,'plan'
      from public.subscription_plans p,jsonb_each(p.limits) where p.id=v_plan
      on conflict(workspace_id,metric) do update set limit_value=excluded.limit_value,
        source='plan',updated_at=now();
    end if;

  elsif p_event_type in ('transaction.completed','payment.succeeded','payment.failed') then
    if v_workspace is null then raise exception 'paddle transaction is not linked to a workspace'; end if;
    select id into v_subscription from public.subscriptions
     where organization_id=v_org and workspace_id=v_workspace and deleted_at is null;
    if v_subscription is null then raise exception 'workspace subscription is not provisioned'; end if;
    v_invoice=coalesce(nullif(p_payload->>'invoice_id',''),p_payload->>'id');
    insert into public.invoices(
      organization_id,workspace_id,subscription_id,invoice_number,status,currency,
      subtotal,tax,issued_at,paid_at,download_url,provider_invoice_id,created_by,metadata
    ) select v_org,v_workspace,v_subscription,v_invoice,
      case when p_event_type='payment.failed' then 'failed' else 'paid' end,
      upper(coalesce(p_payload->>'currency_code','USD')),
      coalesce((p_payload->'details'->'totals'->>'subtotal')::numeric/100,0),
      coalesce((p_payload->'details'->'totals'->>'tax')::numeric/100,0),
      coalesce((p_payload->>'billed_at')::timestamptz,now()),
      case when p_event_type<>'payment.failed' then now() end,
      p_payload->>'invoice_url',v_invoice,created_by,p_payload
      from public.subscriptions where id=v_subscription
      on conflict(provider_invoice_id) do update set status=excluded.status,
        paid_at=excluded.paid_at,metadata=excluded.metadata,updated_at=now();
    update public.subscriptions set
      status=case when p_event_type='payment.failed' then 'past_due' else 'active' end,
      updated_at=now(),version=version+1 where id=v_subscription;
  end if;

  update public.billing_events set
    status=case when p_event_type in (
      'transaction.completed','subscription.created','subscription.updated',
      'subscription.paused','subscription.resumed','subscription.canceled',
      'payment.failed','payment.succeeded','customer.updated'
    ) then 'processed' else 'ignored' end,
    processed_at=now(),organization_id=coalesce(organization_id,v_org),
    workspace_id=coalesce(workspace_id,v_workspace)
  where provider='paddle' and provider_event_id=p_event_id;
exception when others then
  update public.billing_events set status='failed',error_code=sqlstate,processed_at=now()
   where provider='paddle' and provider_event_id=p_event_id;
  raise;
end
$$;

revoke all on function public.process_paddle_billing_event(text,text,jsonb) from public;
grant execute on function public.process_paddle_billing_event(text,text,jsonb) to service_role;
