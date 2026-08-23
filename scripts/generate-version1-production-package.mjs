import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const catalog = JSON.parse(await readFile(join(root, "supabase", ".temp", "sprint89-production-catalog.json"), "utf8"));
if (catalog.projectRef !== "aanonopiylqpfvpoqvdc" || catalog.readOnly !== true) throw new Error("Fail closed: the verified read-only production catalog is unavailable.");
const selected = new Set(catalog.migrations.filter((item) => item.status === "missing" || item.status === "partially represented").map((item) => item.file));

function splitSql(source) {
  const statements = []; let start = 0; let quote = null; let dollar = null;
  for (let i = 0; i < source.length; i += 1) {
    if (dollar) { if (source.startsWith(dollar, i)) { i += dollar.length - 1; dollar = null; } continue; }
    if (quote) { if (source[i] === quote && source[i + 1] === quote) { i += 1; continue; } if (source[i] === quote) quote = null; continue; }
    if (source[i] === "'" || source[i] === '"') { quote = source[i]; continue; }
    if (source[i] === "$" ) { const match = source.slice(i).match(/^\$[A-Za-z0-9_]*\$/); if (match) { dollar = match[0]; i += dollar.length - 1; continue; } }
    if (source[i] === ";") { const value = source.slice(start, i).trim(); if (value) statements.push(value); start = i + 1; }
  }
  const tail = source.slice(start).trim(); if (tail) statements.push(tail); return statements;
}

const q = (value) => value.replaceAll("'", "''");
function guardPolicy(statement) {
  const match = statement.match(/^create\s+policy\s+(?:"([^"]+)"|(\w+))\s*on\s+((?:\w+\.)?\w+)/i);
  if (!match) return null;
  const name = match[1] ?? match[2], [schema = "public", table] = match[3].split(".").length === 2 ? match[3].split(".") : ["public", match[3]];
  return `do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='${q(schema)}' and tablename='${q(table)}' and policyname='${q(name)}') then execute $vayon_sql$${statement}$vayon_sql$; end if; end $vayon_policy$`;
}
function guardFunction(statement) {
  const match = statement.match(/^create\s+or\s+replace\s+function\s+((?:\w+\.)?\w+)/i); if (!match) return null;
  const [schema = "public", name] = match[1].split(".").length === 2 ? match[1].split(".") : ["public", match[1]];
  return `do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='${q(schema)}' and p.proname='${q(name)}') then execute $vayon_sql$${statement}$vayon_sql$; end if; end $vayon_function$`;
}
function guardTrigger(statement) {
  const match = statement.match(/^create\s+trigger\s+(\w+)[\s\S]*?\s+on\s+((?:\w+\.)?\w+)/i); if (!match) return null;
  const [schema = "public", table] = match[2].split(".").length === 2 ? match[2].split(".") : ["public", match[2]];
  return `do $vayon_trigger$ begin if not exists(select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname='${q(schema)}' and c.relname='${q(table)}' and t.tgname='${q(match[1])}') then execute $vayon_sql$${statement}$vayon_sql$; end if; end $vayon_trigger$`;
}
function normalize(statement) {
  const clean = statement.replace(/^--[^\n]*\n?/, "").trim();
  if (!clean) return null;
  if (/^(insert|update|delete|truncate)\b/i.test(clean)) {
    if (/^insert\s+into\s+storage\.buckets\b/i.test(clean)) return clean.replace(/on\s+conflict[\s\S]*$/i, "") + "on conflict(id) do nothing";
    return `-- Omitted non-schema data statement from the historical source.`;
  }
  if (/^drop\s+(policy|trigger)\b/i.test(clean)) return `-- Omitted historical DROP; the replacement is guarded below.`;
  if (/^alter\s+table[\s\S]+drop\s+constraint\b/i.test(clean)) return `-- Constraint evolution is handled by the reviewed Version 1 constraint section.`;
  if (/^alter\s+table[\s\S]+add\s+constraint\b/i.test(clean)) return `-- Constraint evolution is handled by the reviewed Version 1 constraint section.`;
  if (/^create\s+policy\b/i.test(clean)) return guardPolicy(clean) ?? `-- REVIEW_REQUIRED_UNPARSED_POLICY`;
  if (/^create\s+or\s+replace\s+function\b/i.test(clean)) return guardFunction(clean);
  if (/^create\s+trigger\b/i.test(clean)) return guardTrigger(clean);
  if (/^create\s+(unique\s+)?index\b/i.test(clean)) return clean.replace(/^create\s+(unique\s+)?index\s+(?!if\s+not\s+exists)/i, (_, unique = "") => `create ${unique}index if not exists `);
  if (/^create\s+table\b/i.test(clean)) return clean.replace(/^create\s+table\s+(?!if\s+not\s+exists)/i, "create table if not exists ");
  if (/^create\s+extension\b/i.test(clean)) return clean.replace(/^create\s+extension\s+(?!if\s+not\s+exists)/i, "create extension if not exists ");
  if (/^create\s+(or\s+replace\s+)?view\b/i.test(clean)) {
    const match = clean.match(/^create\s+(?:or\s+replace\s+)?view\s+((?:\w+\.)?\w+)/i); if (!match) return null;
    return `do $vayon_view$ begin if to_regclass('${q(match[1])}') is null then execute $vayon_sql$${clean}$vayon_sql$; end if; end $vayon_view$`;
  }
  if (/^alter\s+table\b/i.test(clean) && /\badd\s+column\b/i.test(clean)) return clean.replace(/\badd\s+column\s+(?!if\s+not\s+exists)/gi, "add column if not exists ");
  if (/^do\s+\$\$/i.test(clean) && /create policy/i.test(clean)) {
    return clean.replace(/execute format\('(create policy[^']*)',([^;]+)\);/gi, "begin execute format('$1',$2); exception when duplicate_object then null; end;");
  }
  return clean;
}

const files = (await readdir(join(root, "supabase", "migrations"))).filter((file) => selected.has(file)).sort();
const entries = [];
for (const file of files) {
  let source = await readFile(join(root, "supabase", "migrations", file), "utf8");
  // Fold later constraint widening into the initial CREATE TABLE definition so
  // newly created tables start at the final Version 1 contract.
  source = source
    .replace("'api_calls'))", "'api_calls','image_generations','creative_exports','video_projects','conversation_summaries','future_video_generation_credits'))")
    .replace("'google.connected','profile.updated'))", "'google.connected','profile.updated','invitation.created'))")
    .replace("status in('draft','published','archived')", "status in('draft','review','approved','published','archived')")
    .replace("selected_variation in('Version A','Version B','Version C')", "selected_variation in('Version A','Version B','Version C','Version D','Version E')")
    .replace("feature in('creative_studio_beta','growth_studio'", "feature in('creative_studio_beta','marketing_studio','growth_studio'");
  for (const statement of splitSql(source).map(normalize).filter(Boolean)) entries.push({ file, statement });
}
const revisionKey = (statement) => {
  const functionName = statement.match(/p\.proname='([^']+)'/i)?.[1]; if (functionName) return `function:${functionName}`;
  const policy = statement.match(/tablename='([^']+)' and policyname='([^']+)'/i); if (policy) return `policy:${policy[1]}:${policy[2]}`;
  const trigger = statement.match(/c\.relname='([^']+)' and t\.tgname='([^']+)'/i); if (trigger) return `trigger:${trigger[1]}:${trigger[2]}`;
  const view = statement.match(/to_regclass\('([^']+)'\)/i); if (view) return `view:${view[1]}`;
  return null;
};
const lastRevision = new Map(); entries.forEach((entry, index) => { const key = revisionKey(entry.statement); if (key) lastRevision.set(key, index); });
const retained = entries.filter((entry, index) => { const key = revisionKey(entry.statement); return !key || lastRevision.get(key) === index; });
const category = (statement) => {
  if (/\$vayon_function\$/.test(statement)) return "functions";
  if (/\$vayon_policy\$|create policy/i.test(statement)) return "policies";
  if (/\$vayon_trigger\$/.test(statement)) return "triggers";
  if (/^(revoke|grant)\b/i.test(statement)) return "grants";
  return "schema";
};
const sections = ["schema", "functions", "policies", "triggers", "grants"].map((group) => `\n-- ${group.toUpperCase()} (final Version 1 definitions)\n${retained.filter((entry) => category(entry.statement) === group).map((entry) => `-- Source: ${entry.file}\n${entry.statement};`).join("\n")}`);
const constraints = `
-- Reviewed final Version 1 constraint upgrades. These change metadata only and never delete rows.
do $vayon_constraints$ declare current_definition text; begin
  select pg_get_constraintdef(oid,true) into current_definition from pg_constraint where conrelid='public.site_visits'::regclass and conname='site_visits_status_check';
  if current_definition is distinct from 'CHECK (status = ANY (ARRAY[''scheduled''::text, ''confirmed''::text, ''checked_in''::text, ''completed''::text, ''cancelled''::text, ''no_show''::text, ''rescheduled''::text]))' then
    if exists(select 1 from public.site_visits where status not in('scheduled','confirmed','checked_in','completed','cancelled','no_show','rescheduled')) then raise exception 'site_visits contains an incompatible status'; end if;
    alter table public.site_visits drop constraint if exists site_visits_status_check;
    alter table public.site_visits add constraint site_visits_status_check check(status in('scheduled','confirmed','checked_in','completed','cancelled','no_show','rescheduled'));
  end if;
end $vayon_constraints$;

do $vayon_site_visit_constraints$ begin
  if not exists(select 1 from pg_constraint where conrelid='public.site_visits'::regclass and conname='site_visits_type_check') then alter table public.site_visits add constraint site_visits_type_check check(visit_type in('initial','follow_up','virtual_tour','final_inspection')); end if;
  if not exists(select 1 from pg_constraint where conrelid='public.site_visits'::regclass and conname='site_visits_priority_check') then alter table public.site_visits add constraint site_visits_priority_check check(priority in('low','medium','high','urgent')); end if;
  if not exists(select 1 from pg_constraint where conrelid='public.site_visits'::regclass and conname='site_visits_duration_check') then alter table public.site_visits add constraint site_visits_duration_check check(duration_minutes between 15 and 1440); end if;
end $vayon_site_visit_constraints$;
`;
const header = `-- VAYON Version 1 production synchronization package\n-- Generated from the verified read-only catalog for aanonopiylqpfvpoqvdc.\n-- Apply only after the runbook preflight and backup verification. Does not alter migration history.\n\\set ON_ERROR_STOP on\nbegin;\nset local lock_timeout='5s';\nset local statement_timeout='120s';\n`;
const footer = `\ncommit;\n`;
const output = `${header}${sections.join("\n")}\n${constraints}${footer}`;
await mkdir(join(root, "supabase", "reconciliation"), { recursive: true });
await writeFile(join(root, "supabase", "reconciliation", "VERSION1_PRODUCTION_PATCH.sql"), output, "utf8");
const expected = catalog.migrations.filter((item) => selected.has(item.file)).flatMap((item) => item.absent);
const names = (kind) => [...new Set(expected.filter((item) => item.kind === kind).map((item) => `${item.schema}.${item.name}`))].sort();
const sqlArray = (values) => values.map((value) => `'${q(value)}'`).join(",");
const expectedTables = names("table");
const expectedBuckets = [...new Set(["leadestate-assets", ...names("bucket").map((value) => value.split(".").at(-1))])].sort();
const dynamicPolicies = [];
for (const loop of output.matchAll(/foreach\s+(\w+)\s+in\s+array\s+array\[([^\]]+)\]loop([\s\S]*?)end\s+loop/gi)) {
  const tables = [...loop[2].matchAll(/'([^']+)'/g)].map((match) => match[1]);
  const suffixPattern = new RegExp(`${loop[1]}\\|\\|'([^']+)'`, "gi");
  const suffixes = [...loop[3].matchAll(suffixPattern)].map((match) => match[1]);
  for (const table of tables) for (const suffix of suffixes) dynamicPolicies.push(`${table}${suffix}`);
}
const expectedPolicies = [...new Set([...names("policy").map((x) => x.split(".").at(-1)), ...dynamicPolicies])].sort();
const validation = `-- VAYON Version 1 post-deploy verification (read only)\n\\set ON_ERROR_STOP on\nbegin transaction read only;\n\n` +
`do $vayon_check$ declare missing text[]; begin\n` +
`  select array_agg(x) into missing from unnest(array[${sqlArray(expectedTables)}]::text[]) x where to_regclass(x) is null; if missing is not null then raise exception 'Missing Version 1 tables: %',missing; end if;\n` +
`  select array_agg(x) into missing from unnest(array[${sqlArray(names("column"))}]::text[]) x where not exists(select 1 from information_schema.columns c where c.table_schema=split_part(x,'.',1) and c.table_name=split_part(x,'.',2) and c.column_name=split_part(x,'.',3)); if missing is not null then raise exception 'Missing Version 1 columns: %',missing; end if;\n` +
`  select array_agg(x) into missing from unnest(array[${sqlArray(names("function").map((x) => x.split(".").at(-1)))}]::text[]) x where not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=x); if missing is not null then raise exception 'Missing Version 1 functions: %',missing; end if;\n` +
`  select array_agg(x) into missing from unnest(array[${sqlArray(names("index").map((x) => x.split(".").at(-1)))}]::text[]) x where not exists(select 1 from pg_indexes where schemaname='public' and indexname=x); if missing is not null then raise exception 'Missing Version 1 indexes: %',missing; end if;\n` +
`  select array_agg(x) into missing from unnest(array[${sqlArray(expectedPolicies)}]::text[]) x where not exists(select 1 from pg_policies where schemaname in('public','storage') and policyname=x); if missing is not null then raise exception 'Missing Version 1 policies: %',missing; end if;\n` +
`  select array_agg(x) into missing from unnest(array[${sqlArray(names("trigger").map((x) => x.split(".").at(-1)))}]::text[]) x where not exists(select 1 from pg_trigger where not tgisinternal and tgname=x); if missing is not null then raise exception 'Missing Version 1 triggers: %',missing; end if;\n` +
`  select array_agg(x) into missing from unnest(array[${sqlArray(expectedTables)}]::text[]) x where exists(select 1 from pg_class c where c.oid=to_regclass(x) and not c.relrowsecurity); if missing is not null then raise exception 'RLS disabled on Version 1 tables: %',missing; end if;\n` +
`  select array_agg(x) into missing from unnest(array[${sqlArray(expectedBuckets)}]::text[]) x where not exists(select 1 from storage.buckets where id=x); if missing is not null then raise exception 'Missing Version 1 storage buckets: %',missing; end if;\n` +
`end $vayon_check$;\n\nselect 'PASS' as schema_validation, count(*) as public_tables from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in('r','p');\nselect count(*) as rls_enabled_tables from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in('r','p') and c.relrowsecurity;\nselect count(*) as policies from pg_policies where schemaname='public';\nselect count(*) as functions from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public';\nselect count(*) as indexes from pg_indexes where schemaname='public';\nselect id,name,public,file_size_limit from storage.buckets where id='leadestate-assets';\nrollback;\n`;
await writeFile(join(root, "supabase", "reconciliation", "VERSION1_POST_DEPLOY_CHECK.sql"), validation, "utf8");
const grouped = Object.fromEntries(["table","column","index","policy","function","trigger","view","bucket","extension"].map((kind) => [kind, names(kind)]));
const labels = { table: "Tables", column: "Columns", index: "Indexes", policy: "Policies", function: "Functions", trigger: "Triggers", view: "Views", bucket: "Buckets", extension: "Extensions" };
const requirements = `# Version 1 schema requirements\n\nGenerated from the read-only production catalog captured ${catalog.generatedAt}. No production mutation was performed.\n\n## Migration selection\n\n- Included: ${files.length} migrations classified missing or partially represented.\n- Excluded: migrations already represented in production.\n- Excluded: migration history initialization or repair.\n- Excluded: historical seed/data rewrites; the unproven Sprint 84.1 data-only change remains a manual review item.\n\n## Required objects\n\n${Object.entries(grouped).map(([kind, values]) => `### ${labels[kind]} (${values.length})\n\n${values.length ? values.map((value) => `- \`${value}\``).join("\n") : "None identified by the catalog comparison."}`).join("\n\n")}\n`;
await writeFile(join(root, "docs", "VERSION1_SCHEMA_REQUIREMENTS.md"), requirements, "utf8");
console.log(`Generated Version 1 package from ${files.length} missing/partial migrations (${output.length} bytes).`);
