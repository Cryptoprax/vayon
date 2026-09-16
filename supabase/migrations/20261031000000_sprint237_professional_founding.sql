-- Sprint 237. Apply manually after review; do not run db push.
begin;

create table public.professional_founding_allocations (
  organization_id uuid primary key references public.organizations(id),
  workspace_id uuid not null references public.workspaces(id),
  reservation_id uuid not null unique default gen_random_uuid(),
  slot smallint unique check (slot between 1 and 20),
  status text not null check (status in ('reserved','expired','confirmed','transition_pending','transitioned','ended')),
  allocated_at timestamptz not null default now(),
  reserved_until timestamptz not null default (now() + interval '30 minutes'),
  confirmed_at timestamptz,
  promotional_start timestamptz,
  promotional_end timestamptz,
  successful_periods integer not null default 0 check (successful_periods between 0 and 12),
  paddle_customer_id text not null,
  paddle_transaction_id text not null unique,
  paddle_subscription_id text unique,
  founding_price_id text not null,
  standard_price_id text not null,
  transitioned_at timestamptz,
  mutation_token uuid,
  mutation_until timestamptz,
  check ((status = 'expired' and slot is null and confirmed_at is null) or (status <> 'expired' and slot is not null))
);
create table public.professional_founding_periods (
  organization_id uuid not null references public.professional_founding_allocations(organization_id),
  paddle_transaction_id text primary key,
  period_start timestamptz not null,
  period_end timestamptz not null check (period_end > period_start),
  unique (organization_id, period_start),
  unique (organization_id, period_end)
);
alter table public.professional_founding_allocations enable row level security;
alter table public.professional_founding_periods enable row level security;
revoke all on public.professional_founding_allocations, public.professional_founding_periods from public, anon, authenticated;
grant select, insert, update on public.professional_founding_allocations, public.professional_founding_periods to service_role;

-- Preserve VAYON3DAY's code, duration and redemption rules. Paid founding access
-- cannot be overwritten by a trial redemption, including paused/past-due states.
create function public.protect_professional_founding_subscription()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='trialing' and exists(select 1 from public.professional_founding_allocations
    where organization_id=new.organization_id and confirmed_at is not null) then
    raise exception 'paid founding subscriptions cannot be replaced with trial access' using errcode='23514';
  end if;
  return new;
end $$;
revoke all on function public.protect_professional_founding_subscription() from public,anon,authenticated;
create trigger protect_professional_founding_subscription before update on public.subscriptions
for each row when (new.status='trialing') execute function public.protect_professional_founding_subscription();

-- The only eligibility calculation. Reading never allocates or releases inventory.
create function public.professional_founding_eligibility(p_organization_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a public.professional_founding_allocations; remaining integer; eligible boolean; owned boolean;
begin
  if current_setting('role',true) <> 'service_role' then raise exception 'service role required'; end if;
  select 20-count(*) into remaining from public.professional_founding_allocations where slot is not null;
  select * into a from public.professional_founding_allocations where organization_id=p_organization_id;
  owned := a.confirmed_at is not null;
  eligible := remaining > 0 and not coalesce(owned,false) and not exists (
    select 1 from public.subscriptions where organization_id=p_organization_id and provider_subscription_id is not null
  );
  return jsonb_build_object('eligible',case when a.status='reserved' then false else eligible end,
    'status',coalesce(a.status,case when eligible then 'available' else 'not_eligible' end),
    'remaining',remaining,'ownsAllocation',coalesce(owned,false),
    'promotionalEnd',a.promotional_end,'successfulPeriods',coalesce(a.successful_periods,0),
    'applicable',coalesce((a.status='reserved' and a.reserved_until > now()) or a.status in ('confirmed','transition_pending') or
      (a.status='transitioned' and a.promotional_end > now()),false));
end $$;

-- Short leases serialize provider item mutations with customer plan changes.
-- No database transaction is held open across an HTTP request.
create function public.lock_professional_founding_subscription(p_subscription_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare a public.professional_founding_allocations;
begin
  if current_setting('role',true) <> 'service_role' then raise exception 'service role required'; end if;
  select * into a from public.professional_founding_allocations where paddle_subscription_id=p_subscription_id for update;
  if not found then return null; end if;
  if a.mutation_until > now() then raise exception 'subscription mutation in progress; retry'; end if;
  update public.professional_founding_allocations set mutation_token=gen_random_uuid(),mutation_until=now()+interval '2 minutes'
    where organization_id=a.organization_id returning * into a;
  return to_jsonb(a);
end $$;
create function public.unlock_professional_founding_subscription(p_reservation_id uuid,p_token uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if current_setting('role',true) <> 'service_role' then raise exception 'service role required'; end if;
  update public.professional_founding_allocations set mutation_token=null,mutation_until=null
    where reservation_id=p_reservation_id and mutation_token=p_token;
end $$;
revoke all on function public.lock_professional_founding_subscription(text),public.unlock_professional_founding_subscription(uuid,uuid) from public,anon,authenticated;
grant execute on function public.lock_professional_founding_subscription(text),public.unlock_professional_founding_subscription(uuid,uuid) to service_role;

create function public.reserve_professional_founding(
  p_organization_id uuid, p_workspace_id uuid, p_customer_id text, p_transaction_id text,
  p_founding_price_id text, p_standard_price_id text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_slot smallint; a public.professional_founding_allocations; eligibility jsonb;
begin
  if current_setting('role',true) <> 'service_role' then raise exception 'service role required'; end if;
  -- Global lock plus slot CHECK/UNIQUE: even a faulty caller cannot create slot 21.
  perform pg_advisory_xact_lock(237,20);
  if not exists(select 1 from public.workspaces where id=p_workspace_id and organization_id=p_organization_id)
    or not exists(select 1 from public.billing_customers where organization_id=p_organization_id
      and workspace_id=p_workspace_id and provider='paddle' and provider_customer_id=p_customer_id)
  then raise exception 'billing context mismatch'; end if;
  eligibility := public.professional_founding_eligibility(p_organization_id);
  if eligibility->>'status'='reserved' then raise exception 'founding checkout already reserved'; end if;
  if not (eligibility->>'eligible')::boolean then return null; end if;
  select s into v_slot from generate_series(1,20) s
    where not exists(select 1 from public.professional_founding_allocations where slot=s) order by s limit 1;
  if v_slot is null then return null; end if;
  insert into public.professional_founding_allocations(organization_id,workspace_id,slot,status,
    paddle_customer_id,paddle_transaction_id,founding_price_id,standard_price_id)
  values(p_organization_id,p_workspace_id,v_slot,'reserved',p_customer_id,p_transaction_id,p_founding_price_id,p_standard_price_id)
  on conflict(organization_id) do update set workspace_id=excluded.workspace_id,slot=excluded.slot,status='reserved',
    reservation_id=gen_random_uuid(),allocated_at=now(),reserved_until=now()+interval '30 minutes',
    paddle_customer_id=excluded.paddle_customer_id,paddle_transaction_id=excluded.paddle_transaction_id,
    founding_price_id=excluded.founding_price_id,standard_price_id=excluded.standard_price_id
  where professional_founding_allocations.status='expired' and professional_founding_allocations.confirmed_at is null
  returning * into a;
  return to_jsonb(a);
end $$;

-- Called only after the server has verified Paddle's terminal canceled state,
-- or an immutable completed transaction that did not use the founding price.
-- Time alone MUST NOT release an externally payable transaction.
create function public.release_professional_founding(p_reservation_id uuid, p_transaction_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if current_setting('role',true) <> 'service_role' then raise exception 'service role required'; end if;
  perform pg_advisory_xact_lock(237,20);
  update public.professional_founding_allocations set status='expired',slot=null
  where reservation_id=p_reservation_id and paddle_transaction_id=p_transaction_id
    and status='reserved' and confirmed_at is null;
end $$;

-- Completed provider transactions, not event IDs or browser callbacks, count periods.
create function public.record_professional_founding_payment(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a public.professional_founding_allocations; item jsonb; line jsonb;
  v_start timestamptz; v_end timestamptz; v_count integer; v_first timestamptz; v_last timestamptz;
begin
  if current_setting('role',true) <> 'service_role' then raise exception 'service role required'; end if;
  select * into a from public.professional_founding_allocations
  where paddle_transaction_id=p_payload->>'id' or paddle_subscription_id=p_payload->>'subscription_id' for update;
  if not found then return null; end if;
  if p_payload->>'status' <> 'completed' or nullif(p_payload->>'subscription_id','') is null
    or p_payload->>'customer_id' is distinct from a.paddle_customer_id
    or (a.paddle_subscription_id is not null and a.paddle_subscription_id is distinct from p_payload->>'subscription_id')
    or a.status='expired' then return null; end if;
  select value into item from jsonb_array_elements(p_payload->'items') where value->'price'->>'id'=a.founding_price_id;
  if item is null or item->'price'->'billing_cycle'->>'interval' is distinct from 'month'
    or item->'price'->'billing_cycle'->>'frequency' is distinct from '1'
    or coalesce(item->'proration','null'::jsonb) <> 'null'::jsonb
    or coalesce(p_payload->>'origin','') not in ('api','web','subscription_recurring','subscription_update') then return null; end if;
  select value into line from jsonb_array_elements(p_payload->'details'->'line_items') where value->>'price_id'=a.founding_price_id;
  if coalesce((line->'totals'->>'total')::numeric,0) <= 0
    or coalesce(line->'proration','null'::jsonb) <> 'null'::jsonb then return null; end if;
  v_start := (p_payload->'billing_period'->>'starts_at')::timestamptz;
  v_end := (p_payload->'billing_period'->>'ends_at')::timestamptz;
  if v_start is null or v_end is null or v_end <= v_start then raise exception 'missing authoritative founding billing period'; end if;
  -- A full paid period on resume counts even if it overlaps the pre-pause period.
  -- Prorations were excluded above; identical boundaries and transaction retries
  -- are deduplicated by constraints, independently of delivery order.
  insert into public.professional_founding_periods values(a.organization_id,p_payload->>'id',v_start,v_end)
  on conflict do nothing;
  select count(*),min(period_start),max(period_end) into v_count,v_first,v_last
    from (select period_start,period_end from public.professional_founding_periods
      where organization_id=a.organization_id order by period_start limit 12) periods;
  update public.professional_founding_allocations set confirmed_at=coalesce(confirmed_at,now()),
    paddle_subscription_id=p_payload->>'subscription_id',successful_periods=v_count,
    promotional_start=v_first,promotional_end=case when v_count=12 then v_last else null end,
    status=case when status in ('ended','transitioned') then status when v_count=12 then 'transition_pending' else 'confirmed' end
  where organization_id=a.organization_id returning * into a;
  return to_jsonb(a) || jsonb_build_object('excess_periods',greatest(0,
    (select count(*) from public.professional_founding_periods where organization_id=a.organization_id)-12));
end $$;

revoke all on function public.professional_founding_eligibility(uuid),
  public.reserve_professional_founding(uuid,uuid,text,text,text,text),
  public.release_professional_founding(uuid,text),public.record_professional_founding_payment(jsonb) from public,anon,authenticated;
grant execute on function public.professional_founding_eligibility(uuid),
  public.reserve_professional_founding(uuid,uuid,text,text,text,text),
  public.release_professional_founding(uuid,text),public.record_professional_founding_payment(jsonb) to service_role;

-- Existing Sprint 143 projection, with transaction handling limited to invoices.
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

-- Serialize the established projection by workspace and reject stale snapshots.
create table public.paddle_subscription_projection_versions (
  workspace_id uuid primary key references public.workspaces(id),
  provider_updated_at timestamptz not null
);
alter table public.paddle_subscription_projection_versions enable row level security;
revoke all on public.paddle_subscription_projection_versions from public,anon,authenticated;
grant select,insert,update on public.paddle_subscription_projection_versions to service_role;
create or replace function public.process_paddle_billing_event(p_event_id text,p_event_type text,p_payload jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare v_workspace uuid; v_updated timestamptz; v_previous timestamptz; v_subscription_id text;
  v_status text;
begin
  if current_setting('role',true) <> 'service_role' then raise exception 'service role required'; end if;
  v_workspace := nullif(p_payload->'custom_data'->>'workspace_id','')::uuid;
  if v_workspace is null then select workspace_id into v_workspace from public.billing_customers
    where provider='paddle' and provider_customer_id=p_payload->>'customer_id'; end if;
  if v_workspace is not null then perform pg_advisory_xact_lock(hashtextextended(v_workspace::text,237)); end if;
  if p_event_type like 'subscription.%' then
    v_updated := (p_payload->>'updated_at')::timestamptz;
    if v_workspace is null or v_updated is null then raise exception 'missing subscription projection version'; end if;
    select provider_updated_at into v_previous from public.paddle_subscription_projection_versions where workspace_id=v_workspace;
    if v_previous is not null and v_previous >= v_updated then return; end if;
    select provider_subscription_id,status into v_subscription_id,v_status from public.subscriptions where workspace_id=v_workspace;
    if v_subscription_id is not null and v_subscription_id <> p_payload->>'id' and v_status <> 'cancelled' then
      return; -- An old subscription cannot replace this workspace's newer paid subscription.
    end if;
    -- Project by current provider status, not the possibly stale notification type.
    perform public.process_paddle_billing_event_core237(p_event_id || ':' || v_updated::text,'subscription.updated',p_payload);
    insert into public.paddle_subscription_projection_versions values(v_workspace,v_updated)
      on conflict(workspace_id) do update set provider_updated_at=excluded.provider_updated_at;
  else
    perform public.process_paddle_billing_event_core237(p_event_id,p_event_type,p_payload);
  end if;
end $$;
revoke all on function public.process_paddle_billing_event(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.process_paddle_billing_event(text,text,jsonb) to service_role;
commit;
