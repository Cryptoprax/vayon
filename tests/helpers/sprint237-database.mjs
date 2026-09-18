import { Client, Pool } from "pg";
import { readFileSync } from "node:fs";

// Deliberately loopback-only. Never accepts DATABASE_URL or production credentials.
export async function foundingDatabase() {
  const port = Number(process.env.SPRINT237_POSTGRES_PORT);
  if (!Number.isInteger(port) || port < 1024) throw new Error("Set SPRINT237_POSTGRES_PORT to an isolated local PostgreSQL port.");
  const config = { host: "127.0.0.1", port, user: "postgres", database: "postgres" };
  const admin = new Client(config); await admin.connect();
  const name = `sprint237_${process.pid}_${Date.now()}`;
  await admin.query(`create database ${name}`);
  const owner = new Client({ ...config, database: name }); await owner.connect();
  await owner.query(`
    do $$ begin
      if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
      if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
      if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
    end $$;
    create table organizations(id uuid primary key);
    create table workspaces(id uuid primary key,organization_id uuid references organizations);
    create table billing_customers(organization_id uuid,workspace_id uuid,provider text,provider_customer_id text unique,email text,address jsonb,updated_at timestamptz);
    create table subscription_plans(id uuid primary key default gen_random_uuid(),code text unique,name text,description text,monthly_price numeric,currency text,limits jsonb,features text[],active boolean,sort_order int,updated_at timestamptz);
    insert into subscription_plans(code,name,limits,active) values ('professional','Professional','{}',true),('starter','Starter','{}',true);
    create table subscriptions(id uuid primary key default gen_random_uuid(),organization_id uuid,workspace_id uuid unique,provider text,
      provider_subscription_id text,provider_customer_id text,provider_price_id text,plan_id uuid,status text default 'trialing',
      deleted_at timestamptz,version int default 1,updated_at timestamptz default now(),cancel_at_period_end boolean,
      seat_quantity int default 1,current_period_ends_at timestamptz,created_by uuid default gen_random_uuid());
    create table billing_events(organization_id uuid,workspace_id uuid,provider text,provider_event_id text,event_type text,status text,payload jsonb,
      created_at timestamptz not null default now(),processed_at timestamptz,error_code text,unique(provider,provider_event_id));
    create table subscription_items(organization_id uuid not null,workspace_id uuid not null,subscription_id uuid not null,provider_item_id text not null unique,provider_price_id text not null,quantity int not null default 1 check(quantity>0),metered boolean not null default false,updated_at timestamptz not null default now());
    create table organization_limits(organization_id uuid,workspace_id uuid,metric text,limit_value numeric,source text,updated_at timestamptz,unique(workspace_id,metric));
    create table invoices(organization_id uuid,workspace_id uuid,subscription_id uuid,invoice_number text,status text,currency text,subtotal numeric,tax numeric,issued_at timestamptz,due_at timestamptz,paid_at timestamptz,download_url text,provider_invoice_id text,payment_intent_id text,created_by uuid,metadata jsonb,updated_at timestamptz);
    -- Matches Production exactly: provider_invoice_id uniqueness is a partial index,
    -- not a full constraint, which is the condition the ON CONFLICT SQLSTATE 42P10
    -- fix depends on reproducing.
    create unique index invoices_provider_id_idx on invoices(provider_invoice_id) where provider_invoice_id is not null;
  `);
  await owner.query(readFileSync("supabase/migrations/20260921000000_sprint123_stripe_billing_lifecycle.sql", "utf8"));
  await owner.query(readFileSync("supabase/migrations/20260922000000_sprint143_paddle_billing_platform.sql", "utf8"));
  await owner.query(readFileSync("supabase/migrations/20261031000000_sprint237_professional_founding.sql", "utf8"));
  await owner.query(readFileSync("supabase/migrations/20261031010000_fix_paddle_subscription_item_projection.sql", "utf8"));
  await owner.query(readFileSync("supabase/migrations/20261101000000_fix_billing_invoice_provider_conflict_target.sql", "utf8"));
  await owner.query(readFileSync("supabase/migrations/20261101010000_align_business_plus_entitlements.sql", "utf8"));
  await owner.query("grant usage on schema public to service_role,anon,authenticated; grant all on all tables in schema public to service_role");
  const pool = new Pool({ ...config, database: name, max: 30, options: "-c role=service_role" });
  return {
    pool, owner,
    async reset() { await owner.query("truncate organizations,workspaces,billing_customers,subscriptions,billing_events,subscription_items,organization_limits,invoices,professional_founding_allocations,professional_founding_periods,paddle_subscription_projection_versions cascade"); },
    async close() { await pool.end(); await owner.end(); await admin.query(`drop database ${name} with (force)`); await admin.end(); },
  };
}

// Supabase-compatible test adapter executes the actual SQL, including all RPCs.
export function databaseClient(pool) {
  const identifier = value => { if (!/^[a-z_]+$/.test(value)) throw new Error("Invalid test identifier"); return value; };
  return {
    async rpc(name, params) {
      try {
        const args = Object.keys(params).map((key,i) => `${identifier(key)} => $${i+1}`).join(",");
        const result = await pool.query(`select public.${identifier(name)}(${args}) as result`, Object.values(params));
        return { data: result.rows[0].result, error: null };
      } catch (error) { return { data: null, error }; }
    },
    from(table) {
      let fields = "*", values = [], filters = [], updates = null, limit = "", single = false;
      const bind = value => { values.push(value); return `$${values.length}`; };
      const query = {
        select(value) { fields = value === "*" ? "*" : value.split(",").map(identifier).join(","); return query; },
        update(value) { updates = Object.entries(value).map(([key,v]) => `${identifier(key)}=${bind(v)}`).join(","); return query; },
        eq(key,value) { filters.push(`${identifier(key)}=${bind(value)}`); return query; },
        neq(key,value) { filters.push(`${identifier(key)}<>${bind(value)}`); return query; },
        not(key,op,value) { if(op!=="is" || value!==null) throw new Error("Unsupported test filter"); filters.push(`${identifier(key)} is not null`); return query; },
        in(key,value) { filters.push(`${identifier(key)}=any(${bind(value)}::text[])`); return query; },
        limit(value) { limit = ` limit ${Number(value)}`; return query; },
        maybeSingle() { single = true; return query; },
        async then(resolve) {
          try {
            const where = filters.length ? ` where ${filters.join(" and ")}` : "";
            const sql = updates ? `update public.${identifier(table)} set ${updates}${where} returning *` : `select ${fields} from public.${identifier(table)}${where}${limit}`;
            const result = await pool.query(sql, values);
            return resolve({ data: single ? result.rows[0] ?? null : result.rows, error: null });
          } catch(error) { return resolve({ data: null, error }); }
        },
      };
      return query;
    },
  };
}
