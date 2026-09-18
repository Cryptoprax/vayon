-- Repair invoice upsert conflict target; no customer data, pricing, founding,
-- or subscription-projection logic changes. Apply only through the reviewed
-- migration process.
--
-- public.invoices.provider_invoice_id has no full unique constraint; its only
-- uniqueness guarantee is the partial index created in
-- 20260815020000_sprint50_stripe_billing_platform.sql:
--   create unique index invoices_provider_id_idx on public.invoices(provider_invoice_id)
--     where provider_invoice_id is not null;
-- An unpredicated "on conflict(provider_invoice_id)" cannot be matched to a
-- partial index, so PostgreSQL raises 42502/42P10 ("there is no unique or
-- exclusion constraint matching the ON CONFLICT specification") on every
-- invoice upsert. Both currently callable billing-event processors share this
-- defect. The fix repeats the index's own predicate on the ON CONFLICT clause
-- so it matches the existing partial index; no index or table change is made.
begin;

create or replace function public.process_paddle_billing_event_core237(
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
    -- Paddle has price identities, not Stripe-style subscription item IDs.
    -- Reject missing/malformed components before projecting any subscription data.
    if jsonb_typeof(p_payload->'id') is distinct from 'string'
      or (p_payload->>'id') !~ '^sub_[a-z0-9]+$' then
      raise exception 'invalid paddle subscription identity' using errcode='22023';
    end if;
    if exists(select 1 from jsonb_array_elements(coalesce(p_payload->'items','[]'::jsonb)) item
      where jsonb_typeof(item->'price'->'id') is distinct from 'string'
        or (item->'price'->>'id') !~ '^pri_[a-z0-9]+$') then
      raise exception 'invalid paddle subscription price identity' using errcode='22023';
    end if;
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
    ) select v_org,v_workspace,v_subscription,'paddle:' || (p_payload->>'id') || ':' || (item->'price'->>'id'),item->'price'->>'id',
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
      on conflict(provider_invoice_id) where provider_invoice_id is not null do update set status=excluded.status,
        paid_at=excluded.paid_at,metadata=excluded.metadata,updated_at=now();
    -- Subscription lifecycle snapshots alone change paid access.
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

revoke all on function public.process_paddle_billing_event_core237(text,text,jsonb) from public,anon,authenticated,service_role;

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
    on conflict(provider_invoice_id) where provider_invoice_id is not null do update set
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

commit;
