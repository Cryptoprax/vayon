-- Phase M1/M2: Meta Marketing (Lead Ads) connection + OAuth state + lead-form
-- tenant mapping foundation. NO leadgen webhook, NO lead ingestion, NO CRM
-- lead/property-interest creation, NO ad publishing happens here or anywhere
-- in M1/M2's TypeScript layer -- see the migration comment blocks below for
-- the exact rationale behind every non-obvious design choice.
--
-- Distinct from Meta's WHATSAPP Cloud API integration (whatsapp_connections,
-- proven in Sprint 21/22 and extended by Phases E1-E6): this is the separate
-- Meta MARKETING API surface (Business Login OAuth, Pages, ad accounts,
-- Instagram business accounts, Lead Ads forms). The two are never conflated.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ============================================================================
-- meta_oauth_states: short-lived, single-use CSRF state for the redirect OAuth
-- flow. WHY A DB-BACKED TABLE (not a signed stateless token): a signed token
-- can prove authenticity but not single-use; a DB row lets the callback claim
-- it atomically (UPDATE ... WHERE consumed_at IS NULL ... RETURNING), the
-- same atomic-claim shape already proven by K2's claim_property_knowledge_extraction
-- and E5's ON CONFLICT DO NOTHING send-claim pattern. RLS restricts every row
-- to the user who created it; this table has no tenant-shared data, so it does
-- not need can_manage_integrations() -- creating a state record is not a
-- privileged action (it can't grant access to anything by itself).
-- ============================================================================
-- pending_token_* columns hold the ENCRYPTED long-lived Meta user token
-- between the OAuth callback (which exchanges the code) and the customer's
-- later "save connection" submission (which picks a Page and persists the
-- resulting PAGE-scoped token into meta_marketing_connections). This keeps
-- the raw token out of the browser and out of any intermediate client-side
-- state -- only the already-opaque, single-use `state` value round-trips
-- through the browser as a lookup key, the same threat model as a payment
-- provider's checkout session id. The row is marked consumed only at the
-- final save, not at the callback, so the customer has the full TTL window
-- to choose a Page/ad account/Instagram account.
create table public.meta_oauth_states (
  state text primary key,
  organization_id uuid not null references public.organizations(id),
  workspace_id uuid not null references public.workspaces(id),
  created_by uuid not null references auth.users(id),
  return_path text,
  pending_token_ciphertext text,
  pending_token_iv text,
  pending_token_tag text,
  pending_token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);

create index meta_oauth_states_expiry_idx on public.meta_oauth_states (expires_at);

alter table public.meta_oauth_states enable row level security;

create policy "meta_oauth_states_owner_read" on public.meta_oauth_states
  for select to authenticated
  using (created_by = auth.uid());

create policy "meta_oauth_states_owner_insert" on public.meta_oauth_states
  for insert to authenticated
  with check (created_by = auth.uid() and public.is_organization_member(organization_id) and public.current_workspace_role(workspace_id) is not null);

create policy "meta_oauth_states_owner_consume" on public.meta_oauth_states
  for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- ============================================================================
-- meta_marketing_connections: one connection = one workspace's chosen Meta
-- Page (mirroring whatsapp_connections' "one phone number per workspace"
-- shape exactly -- unique(workspace_id), upsert-on-reconnect). page_id is
-- deliberately NOT globally unique across tenants: unlike a WhatsApp phone
-- number (exclusively registered by one business), a Facebook Page can have
-- multiple legitimate admins across different businesses (an agency and a
-- property developer may both have real admin access to the same Page and
-- both want their own VAYON workspace connected to it). Making page_id
-- globally unique would incorrectly block that legitimate second customer.
-- Deterministic webhook tenant resolution (the actual safety requirement) is
-- instead enforced at the FORM level by meta_lead_form_mappings' partial
-- unique index below -- see that table's comment.
-- ============================================================================
create table public.meta_marketing_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  workspace_id uuid not null references public.workspaces(id),

  business_id text,
  page_id text not null,
  page_name text,

  ad_account_id text,
  ad_account_name text,

  instagram_business_account_id text,

  access_token_ciphertext text not null,
  access_token_iv text not null,
  access_token_tag text not null,
  token_expires_at timestamptz,

  scopes text[] not null default '{}',

  status text not null default 'connected' check (status in ('connected', 'disconnected', 'expired', 'error')),

  connected_by uuid not null references auth.users(id),
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1,

  unique (workspace_id)
);

alter table public.meta_marketing_connections enable row level security;

-- Tenant-scoped read only. The ciphertext/iv/tag columns are real table
-- columns (RLS cannot hide individual columns), so the application-layer
-- repository is the actual safety boundary: its SELECT column list omits
-- access_token_ciphertext/iv/tag entirely for every customer-facing read (see
-- MetaMarketingRepository in the TypeScript layer). No write policy: all
-- writes go through the SECURITY DEFINER RPCs below.
create policy "meta_marketing_connections_tenant_read" on public.meta_marketing_connections
  for select to authenticated
  using (public.is_organization_member(organization_id) and public.current_workspace_role(workspace_id) is not null);

-- ============================================================================
-- meta_lead_form_mappings: a connected Meta Lead Form -> VAYON property
-- context. THE PARTIAL UNIQUE INDEX (form_id, status='active') is the
-- deterministic tenant-resolution boundary a future M3 webhook needs: it
-- guarantees at most one workspace may hold an ACTIVE mapping for a given
-- Meta form_id at a time, even though the underlying Page (and therefore the
-- connection) may legitimately be connected by more than one tenant. A
-- second tenant attempting to map the same form_id while another mapping is
-- active fails closed (Part 14: "do NOT silently support ambiguity").
-- ============================================================================
create table public.meta_lead_form_mappings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  workspace_id uuid not null references public.workspaces(id),
  connection_id uuid not null references public.meta_marketing_connections(id),

  page_id text not null,
  form_id text not null,
  form_name text,

  property_id uuid not null references public.properties(id),
  campaign_id uuid references public.creative_campaigns(id),

  status text not null default 'active' check (status in ('active', 'inactive')),

  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create unique index meta_lead_form_mappings_one_active_per_form
  on public.meta_lead_form_mappings (form_id)
  where status = 'active';

create index meta_lead_form_mappings_tenant_idx
  on public.meta_lead_form_mappings (organization_id, workspace_id, connection_id);

alter table public.meta_lead_form_mappings enable row level security;

create policy "meta_lead_form_mappings_tenant_read" on public.meta_lead_form_mappings
  for select to authenticated
  using (public.is_organization_member(organization_id) and public.current_workspace_role(workspace_id) is not null);

-- ============================================================================
-- connect_meta_marketing_page: the only way to create/update a connection.
-- Upserts on (workspace_id) exactly like connect_whatsapp, so reconnecting
-- rotates the encrypted token material on the SAME row rather than creating
-- a duplicate. Gated by can_manage_integrations() (organization_owner or
-- super_admin) -- the same DB-layer gate WhatsApp connect/disconnect use,
-- reused verbatim, not a second role system.
-- ============================================================================
create or replace function public.connect_meta_marketing_page(
  p_workspace_id uuid,
  p_business_id text,
  p_page_id text,
  p_page_name text,
  p_ad_account_id text,
  p_ad_account_name text,
  p_instagram_business_account_id text,
  p_token_ciphertext text,
  p_token_iv text,
  p_token_tag text,
  p_token_expires_at timestamptz,
  p_scopes text[]
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_id uuid;
begin
  select organization_id into v_org from workspaces where id = p_workspace_id;
  if not public.can_manage_integrations(p_workspace_id) then
    raise exception 'insufficient integration permission';
  end if;

  insert into meta_marketing_connections (
    organization_id, workspace_id, business_id, page_id, page_name,
    ad_account_id, ad_account_name, instagram_business_account_id,
    access_token_ciphertext, access_token_iv, access_token_tag,
    token_expires_at, scopes, status, connected_by
  ) values (
    v_org, p_workspace_id, p_business_id, p_page_id, p_page_name,
    p_ad_account_id, p_ad_account_name, p_instagram_business_account_id,
    p_token_ciphertext, p_token_iv, p_token_tag,
    p_token_expires_at, coalesce(p_scopes, '{}'), 'connected', auth.uid()
  )
  on conflict (workspace_id) do update set
    business_id = excluded.business_id,
    page_id = excluded.page_id,
    page_name = excluded.page_name,
    ad_account_id = excluded.ad_account_id,
    ad_account_name = excluded.ad_account_name,
    instagram_business_account_id = excluded.instagram_business_account_id,
    access_token_ciphertext = excluded.access_token_ciphertext,
    access_token_iv = excluded.access_token_iv,
    access_token_tag = excluded.access_token_tag,
    token_expires_at = excluded.token_expires_at,
    scopes = excluded.scopes,
    status = 'connected',
    deleted_at = null,
    connected_by = auth.uid(),
    updated_at = now(),
    version = meta_marketing_connections.version + 1
  returning id into v_id;

  insert into activity_events (organization_id, workspace_id, event_type, title, actor_id, related_type, related_id)
  values (v_org, p_workspace_id, 'meta.connection.created', 'Meta Marketing connection saved: ' || coalesce(p_page_name, p_page_id), auth.uid(), 'meta_marketing_connection', v_id);

  return v_id;
end;
$$;

revoke all on function public.connect_meta_marketing_page(uuid, text, text, text, text, text, text, text, text, text, timestamptz, text[]) from public;
grant execute on function public.connect_meta_marketing_page(uuid, text, text, text, text, text, text, text, text, text, timestamptz, text[]) to authenticated;

-- ============================================================================
-- disconnect_meta_marketing: soft-disconnects the connection AND deactivates
-- every mapping that depends on it (Part 16 -- "no future M3 webhook should
-- resolve this connection"). Does not delete mapping/audit history.
-- ============================================================================
create or replace function public.disconnect_meta_marketing(
  p_workspace_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_connection_id uuid;
begin
  select organization_id into v_org from workspaces where id = p_workspace_id;
  if not public.can_manage_integrations(p_workspace_id) then
    raise exception 'insufficient integration permission';
  end if;

  select id into v_connection_id from meta_marketing_connections
   where workspace_id = p_workspace_id and deleted_at is null;

  if v_connection_id is null then
    raise exception 'CONNECTION_NOT_FOUND: no active Meta Marketing connection for this workspace';
  end if;

  update meta_marketing_connections
     set status = 'disconnected', deleted_at = now(), updated_at = now(), version = version + 1
   where id = v_connection_id;

  update meta_lead_form_mappings
     set status = 'inactive', updated_at = now(), version = version + 1
   where connection_id = v_connection_id and status = 'active';

  insert into activity_events (organization_id, workspace_id, event_type, title, actor_id, related_type, related_id)
  values (v_org, p_workspace_id, 'meta.connection.disconnected', 'Meta Marketing connection disconnected', auth.uid(), 'meta_marketing_connection', v_connection_id);
end;
$$;

revoke all on function public.disconnect_meta_marketing(uuid) from public;
grant execute on function public.disconnect_meta_marketing(uuid) to authenticated;

-- ============================================================================
-- create_meta_lead_form_mapping: the only way to map a Meta Lead Form to a
-- property. Property and connection ownership are both re-verified
-- server-side (never trusted from the caller); the partial unique index
-- above is the backstop against a second tenant racing to map the same
-- form_id concurrently.
-- ============================================================================
create or replace function public.create_meta_lead_form_mapping(
  p_workspace_id uuid,
  p_connection_id uuid,
  p_page_id text,
  p_form_id text,
  p_form_name text,
  p_property_id uuid,
  p_campaign_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_id uuid;
begin
  select organization_id into v_org from workspaces where id = p_workspace_id;
  if not public.can_manage_integrations(p_workspace_id) then
    raise exception 'insufficient integration permission';
  end if;

  if not exists (
    select 1 from meta_marketing_connections
     where id = p_connection_id and organization_id = v_org and workspace_id = p_workspace_id
       and deleted_at is null and status = 'connected' and page_id = p_page_id
  ) then
    raise exception 'CONNECTION_NOT_FOUND: connection does not belong to this workspace or does not match the given page';
  end if;

  if not exists (
    select 1 from properties
     where id = p_property_id and organization_id = v_org and workspace_id = p_workspace_id and deleted_at is null
  ) then
    raise exception 'PROPERTY_NOT_FOUND: property does not belong to this workspace';
  end if;

  if p_campaign_id is not null and not exists (
    select 1 from creative_campaigns
     where id = p_campaign_id and organization_id = v_org and workspace_id = p_workspace_id
  ) then
    raise exception 'CAMPAIGN_NOT_FOUND: campaign does not belong to this workspace';
  end if;

  if exists (select 1 from meta_lead_form_mappings where form_id = p_form_id and status = 'active') then
    raise exception 'FORM_ALREADY_MAPPED: this Lead Form already has an active mapping';
  end if;

  insert into meta_lead_form_mappings (
    organization_id, workspace_id, connection_id, page_id, form_id, form_name,
    property_id, campaign_id, created_by
  ) values (
    v_org, p_workspace_id, p_connection_id, p_page_id, p_form_id, p_form_name,
    p_property_id, p_campaign_id, auth.uid()
  ) returning id into v_id;

  insert into activity_events (organization_id, workspace_id, event_type, title, actor_id, related_type, related_id)
  values (v_org, p_workspace_id, 'meta.form_mapping.created', 'Meta Lead Form mapped: ' || coalesce(p_form_name, p_form_id), auth.uid(), 'property', p_property_id);

  return v_id;
end;
$$;

revoke all on function public.create_meta_lead_form_mapping(uuid, uuid, text, text, text, uuid, uuid) from public;
grant execute on function public.create_meta_lead_form_mapping(uuid, uuid, text, text, text, uuid, uuid) to authenticated;

-- ============================================================================
-- disable_meta_lead_form_mapping: active -> inactive only. History retained.
-- ============================================================================
create or replace function public.disable_meta_lead_form_mapping(
  p_workspace_id uuid,
  p_mapping_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org from workspaces where id = p_workspace_id;
  if not public.can_manage_integrations(p_workspace_id) then
    raise exception 'insufficient integration permission';
  end if;

  if not exists (
    select 1 from meta_lead_form_mappings
     where id = p_mapping_id and organization_id = v_org and workspace_id = p_workspace_id and status = 'active'
  ) then
    raise exception 'MAPPING_NOT_ACTIVE: mapping does not belong to this workspace or is not active';
  end if;

  update meta_lead_form_mappings
     set status = 'inactive', updated_at = now(), version = version + 1
   where id = p_mapping_id;

  insert into activity_events (organization_id, workspace_id, event_type, title, actor_id, related_type, related_id)
  values (v_org, p_workspace_id, 'meta.form_mapping.disabled', 'Meta Lead Form mapping disabled', auth.uid(), 'meta_lead_form_mapping', p_mapping_id);
end;
$$;

revoke all on function public.disable_meta_lead_form_mapping(uuid, uuid) from public;
grant execute on function public.disable_meta_lead_form_mapping(uuid, uuid) to authenticated;

commit;
