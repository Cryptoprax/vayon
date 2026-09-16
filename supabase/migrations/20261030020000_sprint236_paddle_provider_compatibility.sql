-- Sprint 236: allow the existing Paddle customer persistence path.
-- This changes only the historical billing_customers provider allow-list.
do $$
declare
  v_constraint text;
  v_expanded_legacy boolean := false;
begin
  -- The original constraint was generated from
  -- `check(provider in ('stripe','razorpay'))`. Locate only that legacy
  -- provider allow-list so unrelated checks remain untouched.
  for v_constraint in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.billing_customers'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ~* '\mprovider\M'
      and pg_get_constraintdef(c.oid) ~* '''stripe'''
      and pg_get_constraintdef(c.oid) ~* '''razorpay'''
      and pg_get_constraintdef(c.oid) !~* '''paddle'''
  loop
    execute format('alter table public.billing_customers drop constraint %I', v_constraint);
    v_expanded_legacy := true;
  end loop;

  -- Do not introduce a provider restriction where the database has none.
  -- Only replace the discovered historical allow-list.
  if v_expanded_legacy then
    alter table public.billing_customers
      add constraint billing_customers_provider_check
      check (provider in ('stripe', 'razorpay', 'paddle'));
  end if;
end
$$;
