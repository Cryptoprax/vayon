import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import pg from "pg";

const { Client } = pg;
const root = process.cwd();
const migrationDirectory = join(root, "supabase", "migrations");
const outputDirectory = join(root, "supabase", ".temp");
const outputPath = join(outputDirectory, "sprint89-production-catalog.json");
const expectedRef = "aanonopiylqpfvpoqvdc";
const linkedPooler = new URL((await readFile(join(outputDirectory, "pooler-url"), "utf8")).trim());
if (!linkedPooler.hostname.endsWith("pooler.supabase.com")) throw new Error("Fail closed: no linked production connection.");
const command = process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : "npx";
const args = process.platform === "win32" ? ["/d", "/s", "/c", "npx --no-install supabase db dump --linked --schema public --dry-run"] : ["--no-install", "supabase", "db", "dump", "--linked", "--schema", "public", "--dry-run"];
const { stdout } = await promisify(execFile)(command, args, { cwd: root, windowsHide: true });
const credential = Object.fromEntries([...stdout.matchAll(/export (PGHOST|PGPORT|PGUSER|PGPASSWORD|PGDATABASE)="([^"]+)"/g)].map((match) => [match[1], match[2]]));
if (!credential.PGHOST?.includes(expectedRef) || !credential.PGPASSWORD) throw new Error("Fail closed: Supabase did not issue a matching temporary audit credential.");

const client = new Client({ host: credential.PGHOST, port: Number(credential.PGPORT), user: credential.PGUSER, password: credential.PGPASSWORD, database: credential.PGDATABASE, ssl: { rejectUnauthorized: false }, application_name: "vayon-sprint89-read-only-audit" });
const query = async (text) => (await client.query(text)).rows;
const normalized = (value) => String(value).replaceAll('"', "").toLowerCase();
const objectKey = (kind, schema, name) => `${kind}:${normalized(schema)}.${normalized(name)}`;
const hash = (value) => createHash("sha256").update(String(value)).digest("hex");
const localEnv = Object.fromEntries((await readFile(join(root, ".env.local"), "utf8")).split(/\r?\n/).flatMap((line) => {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  return match ? [[match[1], match[2].replace(/^['"]|['"]$/g, "")]] : [];
}));

function migrationObjects(sql) {
  const patterns = [
    ["table", /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:(\w+)\.)?["']?(\w+)["']?/gi],
    ["view", /create\s+(?:or\s+replace\s+)?view\s+(?:(\w+)\.)?["']?(\w+)["']?/gi],
    ["function", /create\s+(?:or\s+replace\s+)?function\s+(?:(\w+)\.)?["']?(\w+)["']?/gi],
    ["index", /create\s+(?:unique\s+)?index\s+(?:concurrently\s+)?(?:if\s+not\s+exists\s+)?["']?(\w+)["']?/gi],
    ["trigger", /create\s+(?:or\s+replace\s+)?trigger\s+["']?(\w+)["']?/gi],
    ["extension", /create\s+extension\s+(?:if\s+not\s+exists\s+)?["']?(\w+)["']?/gi],
    ["type", /create\s+type\s+(?:(\w+)\.)?["']?(\w+)["']?/gi],
  ];
  const objects = [];
  for (const [kind, pattern] of patterns) for (const match of sql.matchAll(pattern)) {
    if (["index", "policy", "trigger", "extension"].includes(kind)) objects.push({ kind, schema: kind === "extension" ? "extensions" : "public", name: match[1] });
    else objects.push({ kind, schema: match[1] ?? "public", name: match[2] });
  }
  for (const match of sql.matchAll(/create\s+policy\s+["']([^"']+)["']\s+on\s+(?:(\w+)\.)?["']?(\w+)["']?/gi)) objects.push({ kind: "policy", schema: match[2] ?? "public", name: match[1] });
  for (const alteration of sql.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?(?:(\w+)\.)?["']?(\w+)["']?([\s\S]*?);/gi)) {
    for (const column of alteration[3].matchAll(/add\s+column\s+(?:if\s+not\s+exists\s+)?["']?(\w+)["']?/gi)) objects.push({ kind: "column", schema: alteration[1] ?? "public", name: `${alteration[2]}.${column[1]}` });
  }
  for (const match of sql.matchAll(/insert\s+into\s+storage\.buckets[\s\S]{0,600}?values\s*\(\s*['"]([^'"]+)['"]/gi)) objects.push({ kind: "bucket", schema: "storage", name: match[1] });
  return [...new Map(objects.map((value) => [objectKey(value.kind, value.schema, value.name), value])).values()];
}

await client.connect();
try {
  await client.query("BEGIN TRANSACTION READ ONLY");
  const tables = await query(`select n.nspname schema_name,c.relname name,c.relkind from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind in ('r','p') and n.nspname in ('public','storage') order by 1,2`);
  const columns = await query(`select n.nspname schema_name,c.relname table_name,a.attname column_name,pg_catalog.format_type(a.atttypid,a.atttypmod) data_type,a.attnotnull not_null,pg_get_expr(d.adbin,d.adrelid) column_default from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where a.attnum>0 and not a.attisdropped and c.relkind in ('r','p') and n.nspname in ('public','storage') order by 1,2,a.attnum`);
  const constraints = await query(`select n.nspname schema_name,c.relname table_name,con.conname name,con.contype type,pg_get_constraintdef(con.oid,true) definition from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','storage') order by 1,2,3`);
  const indexes = await query(`select schemaname schema_name,tablename table_name,indexname name,indexdef definition from pg_indexes where schemaname in ('public','storage') order by 1,2,3`);
  const views = await query(`select schemaname schema_name,viewname name,definition from pg_views where schemaname in ('public','storage') union all select schemaname,matviewname,definition from pg_matviews where schemaname in ('public','storage') order by 1,2`);
  const functions = await query(`select n.nspname schema_name,p.proname name,pg_get_function_identity_arguments(p.oid) arguments,pg_get_functiondef(p.oid) definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','storage') order by 1,2,3`);
  const triggers = await query(`select n.nspname schema_name,c.relname table_name,t.tgname name,pg_get_triggerdef(t.oid,true) definition from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname in ('public','storage') order by 1,2,3`);
  const policies = await query(`select schemaname schema_name,tablename table_name,policyname name,permissive,roles,cmd,qual,with_check from pg_policies where schemaname in ('public','storage') order by 1,2,3`);
  const rls = await query(`select n.nspname schema_name,c.relname table_name,c.relrowsecurity enabled,c.relforcerowsecurity forced from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind in ('r','p') and n.nspname in ('public','storage') order by 1,2`);
  const extensions = await query(`select e.extname name,e.extversion version,n.nspname schema_name from pg_extension e join pg_namespace n on n.oid=e.extnamespace order by 1`);
  const enums = await query(`select n.nspname schema_name,t.typname name,e.enumlabel label,e.enumsortorder sort_order from pg_type t join pg_enum e on e.enumtypid=t.oid join pg_namespace n on n.oid=t.typnamespace where n.nspname in ('public','extensions') order by 1,2,4`);
  const sequences = await query(`select n.nspname schema_name,c.relname name from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='S' and n.nspname in ('public','storage') order by 1,2`);
  const publications = await query(`select pubname publication_name,schemaname schema_name,tablename table_name from pg_publication_tables order by 1,2,3`);
  const publicationConfig = await query(`select pubname publication_name,puballtables all_tables,pubinsert inserts,pubupdate updates,pubdelete deletes,pubtruncate truncates from pg_publication order by 1`);
  const migrationTracking = await query(`select to_regclass('supabase_migrations.schema_migrations')::text relation`);
  let buckets = [], bucketInspection = "unavailable";
  if (localEnv.NEXT_PUBLIC_SUPABASE_URL?.includes(expectedRef) && localEnv.SUPABASE_SERVICE_ROLE_KEY) {
    const response = await fetch(`${localEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/bucket`, { headers: { apikey: localEnv.SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${localEnv.SUPABASE_SERVICE_ROLE_KEY}` }, signal: AbortSignal.timeout(10_000) });
    if (response.ok) { buckets = await response.json(); bucketInspection = "verified through Storage API"; }
  }
  const remoteKeys = new Set([
    ...tables.map((v) => objectKey("table", v.schema_name, v.name)), ...views.map((v) => objectKey("view", v.schema_name, v.name)),
    ...functions.map((v) => objectKey("function", v.schema_name, v.name)), ...indexes.map((v) => objectKey("index", v.schema_name, v.name)),
    ...policies.map((v) => objectKey("policy", v.schema_name, v.name)), ...triggers.map((v) => objectKey("trigger", v.schema_name, v.name)),
    ...extensions.map((v) => objectKey("extension", "extensions", v.name)), ...enums.map((v) => objectKey("type", v.schema_name, v.name)),
    ...columns.map((v) => objectKey("column", v.schema_name, `${v.table_name}.${v.column_name}`)),
    ...buckets.map((v) => objectKey("bucket", "storage", v.id)),
  ]);
  const migrations = [];
  for (const file of (await readdir(migrationDirectory)).filter((name) => name.endsWith(".sql")).sort()) {
    const sql = await readFile(join(migrationDirectory, file), "utf8"), expected = migrationObjects(sql);
    const present = expected.filter((value) => remoteKeys.has(objectKey(value.kind, value.schema, value.name))), absent = expected.filter((value) => !remoteKeys.has(objectKey(value.kind, value.schema, value.name)));
    const status = expected.length === 0 ? "conflicting" : present.length === expected.length ? "already represented" : present.length === 0 ? "missing" : "partially represented";
    migrations.push({ file, version: file.split("_")[0], status, expected: expected.length, present: present.length, absent, destructiveStatements: /\b(drop\s+(?:table|column|type)|truncate\s+|delete\s+from\s+)\b/i.test(sql), sourceHash: hash(sql) });
  }
  const scrub = (rows) => rows.map((row) => ({ ...row, definition_hash: row.definition ? hash(row.definition) : undefined, definition: undefined }));
  const counts = { tables: tables.length, columns: columns.length, constraints: constraints.length, indexes: indexes.length, views: views.length, functions: functions.length, triggers: triggers.length, policies: policies.length, rlsEnabled: rls.filter((v) => v.enabled).length, extensions: extensions.length, enums: new Set(enums.map((v) => `${v.schema_name}.${v.name}`)).size, sequences: sequences.length, publicationTables: publications.length, buckets: buckets.length };
  const catalog = { generatedAt: new Date().toISOString(), projectRef: expectedRef, readOnly: true, migrationTracking: migrationTracking[0]?.relation ?? null, bucketInspection, counts, schema: { tables, columns, constraints: scrub(constraints), indexes: scrub(indexes), views: scrub(views), functions: scrub(functions), triggers: scrub(triggers), policies, rls, extensions, enums, sequences, publicationConfig, publications, buckets }, migrations };
  await mkdir(outputDirectory, { recursive: true }); await writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`Production catalog captured read-only for ${expectedRef}.`);
  console.log(JSON.stringify({ ...counts, migrations: migrations.reduce((summary, migration) => ({ ...summary, [migration.status]: (summary[migration.status] ?? 0) + 1 }), {}) }, null, 2));
  await client.query("ROLLBACK");
} catch (error) {
  try { await client.query("ROLLBACK"); } catch {}
  throw new Error(`Production catalog audit failed closed: ${error instanceof Error ? error.message : "unknown error"}`);
} finally { await client.end(); }
