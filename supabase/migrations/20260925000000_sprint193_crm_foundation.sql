-- Sprint 193: additive CRM foundation. Existing records and contracts remain valid.
create table if not exists public.crm_companies (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  workspace_id uuid not null references public.workspaces(id), name text not null, logo_path text, industry text,
  website text, email text, phone text, employees integer check(employees is null or employees >= 0),
  revenue numeric(18,2) check(revenue is null or revenue >= 0), currency char(3) not null default 'USD',
  address text, country char(2), owner_id uuid references auth.users(id), notes text,
  created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, version integer not null default 1
);
create index if not exists crm_companies_workspace_idx on public.crm_companies(organization_id,workspace_id,updated_at desc) where deleted_at is null;
create index if not exists crm_companies_search_idx on public.crm_companies using gin(to_tsvector('simple',coalesce(name,'')||' '||coalesce(industry,'')||' '||coalesce(email,''))) where deleted_at is null;

create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  workspace_id uuid not null references public.workspaces(id), company_id uuid references public.crm_companies(id),
  lead_id uuid references public.leads(id), name text not null, email text, phone text, position text,
  department text, relationship text, owner_id uuid references auth.users(id), notes text,
  created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, version integer not null default 1
);
create index if not exists crm_contacts_workspace_idx on public.crm_contacts(organization_id,workspace_id,updated_at desc) where deleted_at is null;
create index if not exists crm_contacts_company_idx on public.crm_contacts(company_id) where deleted_at is null;
create unique index if not exists crm_contacts_lead_unique_idx on public.crm_contacts(lead_id);

alter table public.leads add column if not exists company_id uuid references public.crm_companies(id);
alter table public.properties add column if not exists company_id uuid references public.crm_companies(id);
alter table public.deals add column if not exists company_id uuid references public.crm_companies(id);
alter table public.leads add column if not exists interest_level text check(interest_level in('cold','warm','hot','excellent'));
alter table public.leads add column if not exists intelligence_reason text;
alter table public.leads add column if not exists intelligence_recommendation text;
alter table public.leads add column if not exists intelligence_confidence integer check(intelligence_confidence between 0 and 100);
alter table public.leads add column if not exists intelligence_evidence jsonb not null default '[]'::jsonb;
alter table public.leads add column if not exists intelligence_updated_at timestamptz;
create index if not exists leads_company_idx on public.leads(company_id) where deleted_at is null;
create index if not exists properties_company_idx on public.properties(company_id) where deleted_at is null;
create index if not exists deals_company_idx on public.deals(company_id) where deleted_at is null;

alter table public.crm_companies enable row level security;
alter table public.crm_contacts enable row level security;
create policy "user_profiles_workspace_peer_read" on public.user_profiles for select to authenticated using(exists(select 1 from public.workspace_members mine join public.workspace_members peer on peer.workspace_id=mine.workspace_id where mine.user_id=auth.uid() and mine.status='active' and peer.user_id=user_profiles.user_id and peer.status='active'));
create policy "crm_companies_workspace_read" on public.crm_companies for select to authenticated using(public.is_organization_member(organization_id) and exists(select 1 from public.workspace_members wm where wm.workspace_id=crm_companies.workspace_id and wm.user_id=auth.uid() and wm.status='active'));
create policy "crm_contacts_workspace_read" on public.crm_contacts for select to authenticated using(public.is_organization_member(organization_id) and exists(select 1 from public.workspace_members wm where wm.workspace_id=crm_contacts.workspace_id and wm.user_id=auth.uid() and wm.status='active'));

create or replace function public.score_crm_lead() returns trigger language plpgsql set search_path=public as $$
declare s integer:=0; evidence jsonb:='[]'::jsonb;
begin
  if new.budget is not null and new.budget>0 then s:=s+20;evidence:=evidence||'[{"signal":"budget_recorded","weight":20}]'::jsonb;end if;
  s:=s+case lower(coalesce(new.timeline,'')) when 'immediate' then 30 when '1 month' then 25 when '3 months' then 20 when '6 months' then 15 when '12 months' then 10 else 5 end;
  if new.buying_purpose is not null then s:=s+15;evidence:=evidence||'[{"signal":"buying_purpose_recorded","weight":15}]'::jsonb;end if;
  if new.property_type is not null then s:=s+15;evidence:=evidence||'[{"signal":"property_type_recorded","weight":15}]'::jsonb;end if;
  if cardinality(new.preferred_locations)>0 then s:=s+10;evidence:=evidence||'[{"signal":"location_recorded","weight":10}]'::jsonb;end if;
  s:=least(100,s+case new.source when 'referral' then 10 when 'website' then 8 when 'google_ads' then 8 else 5 end);
  new.lead_score:=s; new.interest_level:=case when s>=85 then'excellent'when s>=65 then'hot'when s>=35 then'warm'else'cold'end;
  new.temperature:=case when s>=65 then'hot'when s>=35 then'warm'else'cold'end;
  new.intelligence_confidence:=least(95,45+jsonb_array_length(evidence)*10);
  new.intelligence_reason:=concat('Score reflects recorded budget, timeline, location, intent, property preference, and source signals.');
  new.intelligence_recommendation:=case when s>=65 then'Prioritize direct follow-up and confirm the next property action.'when s>=35 then'Qualify requirements and schedule a follow-up.'else'Capture budget, location, and purchase timeline before recommending properties.'end;
  new.intelligence_evidence:=evidence;new.intelligence_updated_at:=now();return new;
end$$;
drop trigger if exists score_crm_lead_before_write on public.leads;
create trigger score_crm_lead_before_write before insert or update of budget,timeline,buying_purpose,property_type,preferred_locations,source on public.leads for each row execute function public.score_crm_lead();
update public.leads set source=source where lead_score is null or interest_level is null;
create or replace function public.sync_lead_crm_contact() returns trigger language plpgsql security definer set search_path=public as $$begin insert into public.crm_contacts(organization_id,workspace_id,company_id,lead_id,name,email,phone,relationship,owner_id,created_by,updated_by,deleted_at)values(new.organization_id,new.workspace_id,new.company_id,new.id,new.name,new.email,new.phone,'Lead',new.assigned_agent_id,new.created_by,new.updated_by,new.deleted_at)on conflict(lead_id)do update set company_id=excluded.company_id,name=excluded.name,email=excluded.email,phone=excluded.phone,owner_id=excluded.owner_id,deleted_at=excluded.deleted_at,updated_by=excluded.updated_by,updated_at=now(),version=crm_contacts.version+1;return new;end$$;
drop trigger if exists sync_lead_crm_contact_after_write on public.leads;
create trigger sync_lead_crm_contact_after_write after insert or update of company_id,name,email,phone,assigned_agent_id,deleted_at on public.leads for each row execute function public.sync_lead_crm_contact();
insert into public.crm_contacts(organization_id,workspace_id,company_id,lead_id,name,email,phone,relationship,owner_id,created_by,updated_by,created_at,updated_at,deleted_at)select organization_id,workspace_id,company_id,id,name,email,phone,'Lead',assigned_agent_id,created_by,updated_by,created_at,updated_at,deleted_at from public.leads on conflict(lead_id)do nothing;

create or replace function public.can_manage_crm(p_workspace_id uuid) returns boolean language sql stable security definer set search_path=public as $$select public.current_workspace_role(p_workspace_id) in('organization_owner','organization_admin','branch_manager','sales_manager')$$;
create or replace function public.create_crm_company(p_workspace_id uuid,p_input jsonb) returns uuid language plpgsql security definer set search_path=public as $$declare o uuid;i uuid;begin select organization_id into o from public.workspace_members where workspace_id=p_workspace_id and user_id=auth.uid() and status='active';if o is null or not public.can_manage_crm(p_workspace_id)then raise exception'insufficient CRM permission';end if;insert into public.crm_companies(organization_id,workspace_id,name,logo_path,industry,website,email,phone,employees,revenue,currency,address,country,owner_id,notes,created_by,updated_by)values(o,p_workspace_id,trim(p_input->>'name'),nullif(p_input->>'logoPath',''),nullif(p_input->>'industry',''),nullif(p_input->>'website',''),nullif(lower(p_input->>'email'),''),nullif(p_input->>'phone',''),nullif(p_input->>'employees','')::integer,nullif(p_input->>'revenue','')::numeric,upper(coalesce(nullif(p_input->>'currency',''),'USD')),nullif(p_input->>'address',''),nullif(upper(p_input->>'country'),''),nullif(p_input->>'ownerId','')::uuid,nullif(p_input->>'notes',''),auth.uid(),auth.uid())returning id into i;insert into public.activity_events(organization_id,workspace_id,event_type,title,actor_id,related_type,related_id)values(o,p_workspace_id,'company.created','Company created',auth.uid(),'company',i);return i;end$$;
create or replace function public.update_crm_company(p_company_id uuid,p_expected_version integer,p_input jsonb) returns void language plpgsql security definer set search_path=public as $$declare c public.crm_companies%rowtype;begin select*into c from public.crm_companies where id=p_company_id and deleted_at is null for update;if not found or not public.can_manage_crm(c.workspace_id)then raise exception'company unavailable';end if;if c.version<>p_expected_version then raise exception'company changed by another user';end if;update public.crm_companies set name=trim(p_input->>'name'),logo_path=nullif(p_input->>'logoPath',''),industry=nullif(p_input->>'industry',''),website=nullif(p_input->>'website',''),email=nullif(lower(p_input->>'email'),''),phone=nullif(p_input->>'phone',''),employees=nullif(p_input->>'employees','')::integer,revenue=nullif(p_input->>'revenue','')::numeric,currency=upper(coalesce(nullif(p_input->>'currency',''),'USD')),address=nullif(p_input->>'address',''),country=nullif(upper(p_input->>'country'),''),owner_id=nullif(p_input->>'ownerId','')::uuid,notes=nullif(p_input->>'notes',''),updated_by=auth.uid(),updated_at=now(),version=version+1 where id=p_company_id;insert into public.activity_events(organization_id,workspace_id,event_type,title,actor_id,related_type,related_id)values(c.organization_id,c.workspace_id,'company.updated','Company updated',auth.uid(),'company',c.id);end$$;
create or replace function public.archive_crm_company(p_company_id uuid,p_expected_version integer) returns void language plpgsql security definer set search_path=public as $$declare c public.crm_companies%rowtype;begin select*into c from public.crm_companies where id=p_company_id and deleted_at is null for update;if not found or not public.can_manage_crm(c.workspace_id)then raise exception'company unavailable';end if;if c.version<>p_expected_version then raise exception'company changed by another user';end if;update public.crm_companies set deleted_at=now(),updated_by=auth.uid(),updated_at=now(),version=version+1 where id=c.id;insert into public.activity_events(organization_id,workspace_id,event_type,title,actor_id,related_type,related_id)values(c.organization_id,c.workspace_id,'company.archived','Company archived',auth.uid(),'company',c.id);end$$;
revoke all on function public.create_crm_company(uuid,jsonb),public.update_crm_company(uuid,integer,jsonb),public.archive_crm_company(uuid,integer),public.can_manage_crm(uuid) from public;
grant execute on function public.create_crm_company(uuid,jsonb),public.update_crm_company(uuid,integer,jsonb),public.archive_crm_company(uuid,integer),public.can_manage_crm(uuid) to authenticated;
