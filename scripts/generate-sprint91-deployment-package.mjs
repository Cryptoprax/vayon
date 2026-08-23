import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const reconciliation = join(root, "supabase", "reconciliation");
const legacySource = await readFile(join(reconciliation, "VERSION1_PRODUCTION_PATCH.sql"), "utf8");
// Sprint 78 established property_projects as the canonical tenant-scoped project
// relation. The later Creative migrations referenced inventory_projects, which
// was never defined in migrations or production. Normalize only deployment SQL.
const legacy = legacySource.replaceAll("public.inventory_projects", "public.property_projects");
const q = (value) => value.replaceAll("'", "''");
const compact = (value) => value.replace(/\s+/g, "").toLowerCase();
const hash = (value) => createHash("sha256").update(value).digest("hex");

function splitSql(source) {
  const statements = [];
  let start = 0;
  let quote = null;
  let dollar = null;
  for (let index = 0; index < source.length; index += 1) {
    if (dollar) {
      if (source.startsWith(dollar, index)) {
        index += dollar.length - 1;
        dollar = null;
      }
      continue;
    }
    if (quote) {
      if (source[index] === quote && source[index + 1] === quote) index += 1;
      else if (source[index] === quote) quote = null;
      continue;
    }
    if (source[index] === "'" || source[index] === '"') quote = source[index];
    else if (source[index] === "$") {
      const match = source.slice(index).match(/^\$[A-Za-z0-9_]*\$/);
      if (match) {
        dollar = match[0];
        index += dollar.length - 1;
      }
    } else if (source[index] === ";") {
      const statement = source.slice(start, index).trim();
      if (statement) statements.push(statement);
      start = index + 1;
    }
  }
  const tail = source.slice(start).trim();
  if (tail) statements.push(tail);
  return statements;
}

function stripComments(statement) {
  return statement.replace(/^\s*(?:--[^\n]*(?:\n|$))+/g, "").trim();
}

function splitArguments(value) {
  const parts = [];
  let start = 0;
  let depth = 0;
  let quote = false;
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === "'" && value[index + 1] === "'") index += 1;
    else if (value[index] === "'") quote = !quote;
    else if (!quote && value[index] === "(") depth += 1;
    else if (!quote && value[index] === ")") depth -= 1;
    else if (!quote && depth === 0 && value[index] === ",") {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  const tail = value.slice(start).trim();
  if (tail) parts.push(tail);
  return parts;
}

function functionIdentity(statement) {
  const match = statement.match(/^create\s+or\s+replace\s+function\s+((?:\w+\.)?\w+)\s*\(([\s\S]*?)\)\s*returns\s+([\s\S]*?)\s*language\s+(\w+)/i);
  if (!match) throw new Error(`Cannot parse function identity: ${statement.slice(0, 120)}`);
  const qualified = match[1].includes(".") ? match[1] : `public.${match[1]}`;
  const types = splitArguments(match[2]).map((argument) => {
    const withoutDefault = argument.replace(/\s+default\s+[\s\S]*$/i, "").trim();
    return withoutDefault.replace(/^\w+\s+/, "").trim();
  });
  const body = statement.match(/\bas\s+\$\$([\s\S]*)\$\$\s*$/i)?.[1];
  if (body === undefined) throw new Error(`Cannot parse function body: ${qualified}`);
  return {
    qualified,
    signature: `${qualified}(${types.join(",")})`,
    result: compact(match[3]),
    language: match[4].toLowerCase(),
    volatility: /\bimmutable\b/i.test(statement) ? "i" : /\bstable\b/i.test(statement) ? "s" : "v",
    securityDefiner: /\bsecurity\s+definer\b/i.test(statement),
    searchPath: statement.match(/\bset\s+search_path\s*=\s*([\w\s,]+?)(?=\s+as\s+\$\$)/i)?.[1]?.replace(/\s/g, "") ?? null,
    bodyHash: hash(body),
  };
}

function reconcileFunction(statement) {
  const identity = functionIdentity(statement);
  const searchPathCheck = identity.searchPath
    ? `regexp_replace(coalesce((select split_part(config,'=',2) from unnest(p.proconfig) config where config like 'search_path=%'),''),'\\s+','','g')<>'${q(identity.searchPath)}'`
    : "false";
  return `-- Signature-aware and body-aware reconciliation for ${identity.signature}\n` +
    `do $vayon_function$\n` +
    `declare target regprocedure:=to_regprocedure('${q(identity.signature)}'); differs boolean;\n` +
    `begin\n` +
    `  if target is null then execute $definition$${statement}$definition$; return; end if;\n` +
    `  select n.nspname||'.'||p.proname<>'${q(identity.qualified)}' or regexp_replace(lower(pg_get_function_result(p.oid)),'\\s+','','g') is distinct from '${q(identity.result)}' or l.lanname<>'${q(identity.language)}' or p.provolatile<>'${identity.volatility}' or p.prosecdef is distinct from ${identity.securityDefiner} or ${searchPathCheck} or encode(extensions.digest(p.prosrc,'sha256'),'hex')<>'${identity.bodyHash}' into differs from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_language l on l.oid=p.prolang where p.oid=target;\n` +
    `  if differs then execute $definition$${statement}$definition$; end if;\n` +
    `end $vayon_function$;`;
}

function balancedClause(statement, keyword) {
  const offset = statement.toLowerCase().indexOf(keyword.toLowerCase());
  if (offset < 0) return null;
  const open = statement.indexOf("(", offset + keyword.length);
  if (open < 0) return null;
  let depth = 0;
  let quote = false;
  for (let index = open; index < statement.length; index += 1) {
    if (statement[index] === "'" && statement[index + 1] === "'") index += 1;
    else if (statement[index] === "'") quote = !quote;
    else if (!quote && statement[index] === "(") depth += 1;
    else if (!quote && statement[index] === ")" && --depth === 0) return statement.slice(open + 1, index);
  }
  throw new Error(`Unbalanced ${keyword} clause`);
}

function reconcilePolicy(statement) {
  const match = statement.match(/^create\s+policy\s+(?:"([^"]+)"|(\w+))\s*on\s+((?:\w+\.)?\w+)/i);
  if (!match) throw new Error(`Cannot parse policy: ${statement.slice(0, 100)}`);
  const name = match[1] ?? match[2];
  const [schema, table] = match[3].includes(".") ? match[3].split(".") : ["public", match[3]];
  const command = statement.match(/\bfor\s+(all|select|insert|update|delete)\b/i)?.[1]?.toUpperCase() ?? "ALL";
  const permissive = !/\bas\s+restrictive\b/i.test(statement);
  const roles = (statement.match(/\bto\s+([\w,\s]+?)(?=\s+(?:using|with\s+check)\s*\(|$)/i)?.[1] ?? "public").split(",").map((role) => role.trim()).filter(Boolean).sort();
  const using = balancedClause(statement, "using");
  const check = balancedClause(statement, "with check");
  const normalizedUsing = using ? compact(using) : "";
  const normalizedCheck = check ? compact(check) : "";
  return `-- Definition-aware reconciliation for ${schema}.${table}.${name}\n` +
    `do $vayon_policy$ declare differs boolean; begin\n` +
    `  select coalesce(cmd,'ALL')<>'${command}' or permissive is distinct from ${permissive} or roles is distinct from array[${roles.map((role) => `'${q(role)}'`).join(",")}]::name[] or regexp_replace(coalesce(qual,''),'\\s+','','g')<>'${q(normalizedUsing)}' or regexp_replace(coalesce(with_check,''),'\\s+','','g')<>'${q(normalizedCheck)}' into differs from pg_policies where schemaname='${q(schema)}' and tablename='${q(table)}' and policyname='${q(name)}';\n` +
    `  if not found then execute $definition$${statement}$definition$;\n` +
    `  elsif differs then execute 'drop policy "${q(name)}" on ${schema}.${table}'; execute $definition$${statement}$definition$; end if;\n` +
    `end $vayon_policy$;`;
}

function reconcileTrigger(statement) {
  const match = statement.match(/^create\s+trigger\s+(\w+)[\s\S]*?\s+on\s+((?:\w+\.)?\w+)/i);
  if (!match) throw new Error(`Cannot parse trigger: ${statement.slice(0, 100)}`);
  const [schema, table] = match[2].includes(".") ? match[2].split(".") : ["public", match[2]];
  const expected = compact(statement);
  return `-- Definition-aware reconciliation for ${schema}.${table}.${match[1]}\n` +
    `do $vayon_trigger$ declare definition text; begin\n` +
    `  select regexp_replace(lower(pg_get_triggerdef(t.oid,true)),'\\s+','','g') into definition from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname='${q(schema)}' and c.relname='${q(table)}' and t.tgname='${q(match[1])}';\n` +
    `  if definition is null then execute $definition$${statement}$definition$;\n` +
    `  elsif definition<>'${q(expected)}' then raise exception 'Trigger definition conflict: ${q(schema)}.${q(table)}.${q(match[1])}'; end if;\n` +
    `end $vayon_trigger$;`;
}

function reconcileIndex(statement) {
  const normalized = statement.replace(/^create\s+(unique\s+)?index\s+if\s+not\s+exists/i, "create $1index");
  const match = normalized.match(/^create\s+(unique\s+)?index\s+(\w+)\s+on\s+((?:\w+\.)?\w+)/i);
  if (!match) throw new Error(`Cannot parse index: ${statement.slice(0, 100)}`);
  const expected = compact(normalized);
  const concurrent = normalized.replace(/^create\s+(unique\s+)?index\s+/i, "create $1index concurrently if not exists ");
  const open = normalized.indexOf("(", match.index + match[0].length);
  const columns = open >= 0 ? balancedClause(normalized.slice(open), "") : null;
  const predicate = normalized.match(/\s*where\s+([\s\S]+)$/i)?.[1]?.trim();
  const duplicateWhere = predicate ? ` where ${predicate}` : "";
  const preflight = match[1] && columns
    ? `do $vayon_unique_preflight$ begin if exists(select 1 from ${match[3]}${duplicateWhere} group by ${columns} having count(*)>1) then raise exception 'Duplicate data blocks unique index ${q(match[2])}'; end if; end $vayon_unique_preflight$;\n`
    : "";
  return `${preflight}do $vayon_index$ declare definition text; begin select replace(regexp_replace(lower(indexdef),'\\s+','','g'),'usingbtree','') into definition from pg_indexes where schemaname='public' and indexname='${q(match[2])}'; if definition is not null and definition<>'${q(expected.replace("usingbtree", ""))}' then raise exception 'Index definition conflict: ${q(match[2])}'; end if; end $vayon_index$;\n${concurrent};`;
}

const wrapped = [...legacy.matchAll(/execute\s+\$vayon_sql\$([\s\S]*?)\$vayon_sql\$/gi)].map((match) => match[1].trim());
const functions = wrapped.filter((statement) => /^create\s+or\s+replace\s+function/i.test(statement));
const policies = wrapped.filter((statement) => /^create\s+policy/i.test(statement));
const triggers = wrapped.filter((statement) => /^create\s+trigger/i.test(statement));

const schemaRegion = legacy.slice(legacy.indexOf("-- SCHEMA"), legacy.indexOf("-- FUNCTIONS"));
const schemaStatements = splitSql(schemaRegion).map(stripComments).filter(Boolean).filter((statement) => !/^no parallel scheduling engine\.?$/i.test(statement));
const tables = schemaStatements.filter((statement) => /^create\s+table\s+if\s+not\s+exists/i.test(statement));
const inlineChecks = [
  "digest_frequency in('instant','daily','weekly','off')",
  "mime_type in('image/png','image/jpeg')",
  "knowledge_kind in('knowledge_article','private_article','internal_sop','sales_script','support_playbook','onboarding_checklist','ai_playbook')",
  "visibility in('workspace','organization')",
];
const columns = schemaStatements
  .filter((statement) => /^alter\s+table/i.test(statement) && /\badd\s+column\b/i.test(statement) && !/\bdrop\s+constraint\b/i.test(statement))
  .map((statement) => inlineChecks.reduce((result, expression) => result.replace(`check(${expression})`, ""), statement));
const rlsEnables = schemaStatements.filter((statement) => /^alter\s+table/i.test(statement) && /enable\s+row\s+level\s+security/i.test(statement));
const rawIndexes = schemaStatements.filter((statement) => /^create\s+(?:unique\s+)?index\s+if\s+not\s+exists/i.test(statement));
const indexesByName = new Map();
for (const statement of rawIndexes) {
  const name = statement.match(/^create\s+(?:unique\s+)?index\s+if\s+not\s+exists\s+(\w+)/i)?.[1];
  if (!name) throw new Error(`Cannot identify index: ${statement.slice(0, 100)}`);
  indexesByName.set(name, statement);
}
const indexes = [...indexesByName.values()];
const buckets = schemaStatements.filter((statement) => /^insert\s+into\s+storage\.buckets/i.test(statement));
const extensions = schemaStatements.filter((statement) => /^create\s+extension\s+if\s+not\s+exists/i.test(statement));
const grantsRegion = legacy.slice(legacy.indexOf("-- GRANTS"), legacy.indexOf("-- Reviewed final Version 1 constraint upgrades"));
const grants = splitSql(grantsRegion).map(stripComments).filter((statement) => /^(grant|revoke)\b/i.test(statement));

for (const table of ["property_projects", "property_towers", "property_units", "property_price_revisions", "property_documents", "property_inventory_audit", "property_inventory_opportunity_requests"]) {
  policies.push(`create policy ${table}_select on public.${table} for select to authenticated using(public.inventory_workspace_member(organization_id,workspace_id))`);
  policies.push(`create policy ${table}_insert on public.${table} for insert to authenticated with check(public.inventory_can_write(organization_id,workspace_id))`);
  policies.push(`create policy ${table}_update on public.${table} for update to authenticated using(public.inventory_can_write(organization_id,workspace_id)) with check(public.inventory_can_write(organization_id,workspace_id))`);
  policies.push(`create policy ${table}_delete on public.${table} for delete to authenticated using(public.inventory_can_write(organization_id,workspace_id))`);
}
for (const table of ["site_visit_feedback", "site_visit_audit", "site_visit_follow_up_requests"]) {
  policies.push(`create policy ${table}_read on public.${table} for select to authenticated using(public.site_visit_member(organization_id,workspace_id))`);
  policies.push(`create policy ${table}_create on public.${table} for insert to authenticated with check(public.site_visit_can_manage(organization_id,workspace_id))`);
  policies.push(`create policy ${table}_update on public.${table} for update to authenticated using(public.site_visit_can_manage(organization_id,workspace_id)) with check(public.site_visit_can_manage(organization_id,workspace_id))`);
  policies.push(`create policy ${table}_delete on public.${table} for delete to authenticated using(public.site_visit_can_manage(organization_id,workspace_id))`);
}
for (const table of ["buyer_property_profiles", "property_match_signals", "property_match_runs", "property_match_results", "property_shortlists", "property_match_audit"]) {
  policies.push(`create policy ${table}_read on public.${table} for select to authenticated using(public.property_match_member(organization_id,workspace_id))`);
  policies.push(`create policy ${table}_create on public.${table} for insert to authenticated with check(public.property_match_can_manage(organization_id,workspace_id))`);
  policies.push(`create policy ${table}_update on public.${table} for update to authenticated using(public.property_match_can_manage(organization_id,workspace_id)) with check(public.property_match_can_manage(organization_id,workspace_id))`);
  policies.push(`create policy ${table}_delete on public.${table} for delete to authenticated using(public.property_match_can_manage(organization_id,workspace_id))`);
}

function reconcileCheckConstraint(name, table, column, expression) {
  return `do $vayon_constraint$
declare
  constraint_oid oid;
  constraint_type "char";
  targets_expected_column boolean;
begin
  select c.oid,c.contype,
         cardinality(c.conkey)=1 and exists(
           select 1
           from unnest(c.conkey) as key(attnum)
           join pg_attribute a on a.attrelid=c.conrelid and a.attnum=key.attnum
           where a.attname='${column}' and not a.attisdropped
         )
  into constraint_oid,constraint_type,targets_expected_column
  from pg_constraint c
  where c.conrelid='public.${table}'::regclass and c.conname='${name}';
  if constraint_oid is not null then
    if constraint_type<>'c' or not coalesce(targets_expected_column,false) then
      raise exception 'Constraint identity conflict: ${name}';
    end if;
  else
    if exists(select 1 from public.${table} where not (${expression})) then
      raise exception 'Existing data blocks constraint ${name}';
    end if;
    alter table public.${table} add constraint ${name} check(${expression}) not valid;
    alter table public.${table} validate constraint ${name};
  end if;
end $vayon_constraint$;`;
}

const constraints = [
  ["notification_preferences_digest_frequency_check", "notification_preferences", "digest_frequency", "digest_frequency in('instant','daily','weekly','off')"],
  ["creative_assets_mime_type_check", "creative_assets", "mime_type", "mime_type in('image/png','image/jpeg')"],
  ["knowledge_articles_knowledge_kind_check", "knowledge_articles", "knowledge_kind", "knowledge_kind in('knowledge_article','private_article','internal_sop','sales_script','support_playbook','onboarding_checklist','ai_playbook')"],
  ["knowledge_articles_visibility_check", "knowledge_articles", "visibility", "visibility in('workspace','organization')"],
  ["site_visits_status_check", "site_visits", "status", "status in('scheduled','confirmed','checked_in','completed','cancelled','no_show','rescheduled')"],
  ["site_visits_type_check", "site_visits", "visit_type", "visit_type in('initial','follow_up','virtual_tour','final_inspection')"],
  ["site_visits_priority_check", "site_visits", "priority", "priority in('low','medium','high','urgent')"],
  ["site_visits_duration_check", "site_visits", "duration_minutes", "duration_minutes between 15 and 1440"],
].map(([name, table, column, expression]) => reconcileCheckConstraint(name, table, column, expression));

const header = (stage, transactional = true) => `-- VAYON Version 1 — ${stage}\n-- Generated for manual review. Does not alter migration history.\n-- Supabase SQL Editor compatible; no psql meta-commands.\n${transactional ? "begin;\nset local lock_timeout='5s';\nset local statement_timeout='120s';\n" : "-- CREATE INDEX CONCURRENTLY statements intentionally run outside a transaction.\n"}`;
const finish = (transactional = true) => transactional ? "\ncommit;\n" : "";
const emit = (name, stage, statements, transactional = true) => writeFile(join(reconciliation, name), `${header(stage, transactional)}\n${statements.join("\n\n")}\n${finish(transactional)}`, "utf8");

await mkdir(reconciliation, { recursive: true });
await emit("001_core_schema.sql", "core schema", [...extensions, ...tables].map((statement) => `${statement};`));
await emit("002_columns.sql", "additive columns and constraints", [...columns.map((statement) => `${statement};`), ...constraints]);
await emit("003_indexes.sql", "structurally guarded indexes", indexes.map(reconcileIndex), false);
await emit("004_functions.sql", "signature-aware functions and RPC grants", [...functions.map(reconcileFunction), ...grants.map((statement) => `${statement};`)]);
await emit("005_rls.sql", "definition-aware RLS policies and triggers", [...rlsEnables.map((statement) => `${statement};`), ...policies.map(reconcilePolicy), ...triggers.map(reconcileTrigger)]);
await emit("006_storage.sql", "storage buckets", buckets.map((statement) => `${statement};`));
await emit("007_seed.sql", "reviewed seed data", ["-- No production seed mutations are certified by Sprint 91.", "-- Historical seed statements remain excluded pending tenant-safe equivalence evidence."]);

const validationBody = `select 'tables' as surface,count(*) as total from information_schema.tables where table_schema='public';\nselect 'rls_disabled' as surface,count(*) as total from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in('r','p') and not c.relrowsecurity;\nselect 'functions' as surface,count(*) as total from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public';\nselect 'policies' as surface,count(*) as total from pg_policies where schemaname in('public','storage');\nselect 'triggers' as surface,count(*) as total from pg_trigger where not tgisinternal;\nselect 'indexes' as surface,count(*) as total from pg_indexes where schemaname='public';\nselect id,name,public,file_size_limit,allowed_mime_types from storage.buckets order by id;`;
await emit("008_validation.sql", "read-only stage validation", [`set transaction read only;`, validationBody], true);
await writeFile(join(reconciliation, "PRE_DEPLOY_VALIDATION.sql"), `-- VAYON Version 1 pre-deploy validation — READ ONLY\nbegin transaction read only;\nset local statement_timeout='120s';\n${validationBody}\nselect n.nspname,p.proname,pg_get_function_identity_arguments(p.oid),pg_get_function_result(p.oid),l.lanname,p.provolatile,p.prosecdef,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_language l on l.oid=p.prolang where n.nspname='public' order by 1,2,3;\nselect schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies where schemaname in('public','storage') order by 1,2,3;\nselect schemaname,tablename,indexname,indexdef from pg_indexes where schemaname='public' order by 2,3;\nrollback;\n`, "utf8");
await writeFile(join(reconciliation, "POST_DEPLOY_VALIDATION.sql"), `-- VAYON Version 1 post-deploy validation — READ ONLY\nbegin transaction read only;\nset local statement_timeout='120s';\n${validationBody}\ndo $vayon_postcheck$ begin if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in('r','p') and not c.relrowsecurity) then raise exception 'Post-deploy validation failed: public table without RLS'; end if; if not exists(select 1 from pg_policies where schemaname='public') then raise exception 'Post-deploy validation failed: no public policies'; end if; end $vayon_postcheck$;\nselect table_schema,table_name,column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema='public' order by 2,ordinal_position;\nselect n.nspname,c.relname,c.relrowsecurity,count(pol.policyname) as policy_count from pg_class c join pg_namespace n on n.oid=c.relnamespace left join pg_policies pol on pol.schemaname=n.nspname and pol.tablename=c.relname where n.nspname='public' and c.relkind in('r','p') group by 1,2,3 order by 2;\nselect c.relname,t.tgname,t.tgenabled,pg_get_triggerdef(t.oid,true) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname in('public','auth') order by 1,2;\nrollback;\n`, "utf8");

const manifest = `-- VERSION1_PRODUCTION_PATCH.sql is a review manifest, not an executable monolith.\n-- Execute only the independently reviewed stages in DEPLOYMENT_EXECUTION_ORDER.md.\n-- 001_core_schema.sql\n-- 002_columns.sql\n-- 003_indexes.sql\n-- 004_functions.sql\n-- 005_rls.sql\n-- 006_storage.sql\n-- 007_seed.sql\n-- 008_validation.sql\n-- Parser issue removed: no psql meta-command and no accidental prose.\n-- Additive contracts: CREATE TABLE IF NOT EXISTS; ALTER TABLE ... ADD COLUMN IF NOT EXISTS.\n-- Catalog reconciliation surfaces: pg_policies, pg_proc, pg_trigger.\n`;
await writeFile(join(reconciliation, "VERSION1_PRODUCTION_PATCH.sql"), manifest, "utf8");
await writeFile(join(reconciliation, "VERSION1_POST_DEPLOY_CHECK.sql"), await readFile(join(reconciliation, "POST_DEPLOY_VALIDATION.sql"), "utf8"), "utf8");

console.log(JSON.stringify({ tables: tables.length, columns: columns.length, indexes: indexes.length, functions: functions.length, policies: policies.length, triggers: triggers.length, buckets: buckets.length }, null, 2));
