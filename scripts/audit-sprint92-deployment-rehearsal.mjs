import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const directory = join(root, "supabase", "reconciliation");
const stageNames = ["001_core_schema.sql", "002_columns.sql", "003_indexes.sql", "004_functions.sql", "005_rls.sql", "006_storage.sql", "007_seed.sql", "008_validation.sql"];
const stages = Object.fromEntries(await Promise.all(stageNames.map(async (name) => [name, await readFile(join(directory, name), "utf8")])));
const pre = await readFile(join(directory, "PRE_DEPLOY_VALIDATION.sql"), "utf8");
const post = await readFile(join(directory, "POST_DEPLOY_VALIDATION.sql"), "utf8");
const catalog = JSON.parse(await readFile(join(root, "supabase", ".temp", "sprint89-production-catalog.json"), "utf8"));
const fail = (condition, message) => { if (condition) throw new Error(message); };
const unique = (items) => [...new Set(items)];
const matches = (source, pattern, group = 1) => [...source.matchAll(pattern)].map((match) => match[group]);

fail(catalog.projectRef !== "aanonopiylqpfvpoqvdc" || catalog.readOnly !== true, "Frozen read-only production catalog is invalid");
const combined = Object.values(stages).join("\n");
fail(/\\set\b|no parallel scheduling engine/i.test(combined), "Parser-incompatible content remains");
fail(/\bdrop\s+(table|view|function|index|trigger|type)\b|\btruncate\b|restart\s+identity/i.test(combined), "Forbidden destructive DDL remains");
fail(/supabase_migrations|migration\s+repair|db\s+push/i.test(combined), "Migration history manipulation remains");

for (const name of stageNames.filter((name) => name !== "003_indexes.sql")) {
  fail(!/^begin;/m.test(stages[name]) || !/^commit;/m.test(stages[name]), `${name} lacks an independent transaction`);
}
fail(/\bbegin;/i.test(stages["003_indexes.sql"]), "Concurrent index stage must not have a transaction wrapper");
fail(!/begin transaction read only/i.test(pre) || !/rollback/i.test(pre), "Pre-deploy validation is not read-only");
fail(!/begin transaction read only/i.test(post) || !/rollback/i.test(post), "Post-deploy validation is not read-only");

const baselineTables = new Set(catalog.schema.tables.map((item) => `${item.schema_name}.${item.name}`));
baselineTables.add("auth.users"); baselineTables.add("storage.objects"); baselineTables.add("storage.buckets");
const createdTables = matches(stages["001_core_schema.sql"], /create\s+table\s+if\s+not\s+exists\s+([\w.]+)/gi).map((name) => name.includes(".") ? name : `public.${name}`);
const availableTables = new Set(baselineTables);
const forwardTableReferences = [];
for (const statement of stages["001_core_schema.sql"].split(/;\s*(?:\r?\n|$)/)) {
  const table = statement.match(/create\s+table\s+if\s+not\s+exists\s+([\w.]+)/i)?.[1];
  if (!table) continue;
  const qualified = table.includes(".") ? table : `public.${table}`;
  for (const reference of matches(statement, /\breferences\s+([\w.]+)/gi).map((name) => name.includes(".") ? name : `public.${name}`)) {
    if (!availableTables.has(reference)) forwardTableReferences.push({ table: qualified, reference });
  }
  availableTables.add(qualified);
}

const alterTables = unique(matches(stages["002_columns.sql"], /alter\s+table\s+([\w.]+)/gi));
const indexTables = unique(matches(stages["003_indexes.sql"], /create\s+(?:unique\s+)?index\s+concurrently\s+if\s+not\s+exists\s+\w+\s+on\s+([\w.]+)/gi));
const missingAlterTables = alterTables.filter((name) => !availableTables.has(name));
const missingIndexTables = indexTables.filter((name) => !availableTables.has(name));

const baselineFunctions = new Set(catalog.schema.functions.map((item) => `${item.schema_name}.${item.name}`));
const functionSignatures = matches(stages["004_functions.sql"], /signature-aware and body-aware reconciliation for\s+([^\r\n]+)/gi);
const functionNames = new Set(functionSignatures.map((signature) => signature.slice(0, signature.indexOf("("))));
const functionTableDependencies = unique([
  ...matches(stages["004_functions.sql"], /\b(?:from|join|update|into)\s+(public\.\w+)/gi),
  ...matches(stages["004_functions.sql"], /\b(public\.\w+)\s*%rowtype/gi),
]);
const missingFunctionTables = functionTableDependencies.filter((name) => !availableTables.has(name));
const unresolvedFunctionCalls = unique(matches(stages["004_functions.sql"], /\b(public\.\w+)\s*\(/gi)).filter((name) => !functionNames.has(name) && !baselineFunctions.has(name) && !availableTables.has(name));

const policyTables = unique(matches(stages["005_rls.sql"], /create\s+policy\s+(?:"[^"]+"|\w+)\s*on\s+([\w.]+)/gi));
const missingPolicyTables = policyTables.filter((name) => !availableTables.has(name));
const triggerTables = unique(matches(stages["005_rls.sql"], /create\s+trigger\s+\w+[\s\S]*?\s+on\s+([\w.]+)\s+for\s+each/gi));
const missingTriggerTables = triggerTables.filter((name) => !availableTables.has(name));
const triggerFunctions = unique(matches(stages["005_rls.sql"], /create\s+trigger[\s\S]*?execute\s+function\s+([\w.]+)\s*\(/gi));
const missingTriggerFunctions = triggerFunctions.filter((name) => !functionNames.has(name) && !baselineFunctions.has(name));

const indexes = matches(stages["003_indexes.sql"], /^\('([^']+)','[^']+'/gm);
const policies = matches(stages["005_rls.sql"], /definition-aware reconciliation for\s+([^\r\n]+)/gi);
const triggers = matches(stages["005_rls.sql"], /create\s+trigger\s+(\w+)/gi);
const buckets = matches(stages["006_storage.sql"], /values\('([^']+)'/gi);
const constraints = matches(stages["002_columns.sql"], /constraint\s+(\w+)/gi);

fail(indexes.length !== unique(indexes).length, "Duplicate index names remain");
fail(policies.length !== unique(policies).length, "Duplicate policy reconciliation blocks remain");
fail(triggers.length !== unique(triggers).length, "Duplicate trigger names remain");
fail(buckets.length !== unique(buckets).length, "Duplicate bucket IDs remain");
fail(!/pg_get_function_result/i.test(stages["004_functions.sql"]) || !/digest\(p\.prosrc/i.test(stages["004_functions.sql"]), "Function structural reconciliation is incomplete");
fail(!/roles\s+@>/i.test(stages["005_rls.sql"]) || !/roles\s+<@/i.test(stages["005_rls.sql"]) || !/with_check/i.test(stages["005_rls.sql"]), "Policy structural reconciliation is incomplete");
fail(!/pg_get_triggerdef/i.test(stages["005_rls.sql"]), "Trigger structural reconciliation is incomplete");
fail(!/indexdef/i.test(stages["003_indexes.sql"]) || !/unique_preflight/i.test(stages["003_indexes.sql"]), "Index structural reconciliation is incomplete");
fail(/drop\s+constraint/i.test(stages["002_columns.sql"]), "Constraint stage drops a constraint");
fail(!/storage bucket conflict:/i.test(stages["006_storage.sql"]) || !/if not found then/i.test(stages["006_storage.sql"]), "Storage buckets are not repeat-safe");

const report = {
  catalogGeneratedAt: catalog.generatedAt,
  stages: stageNames.length,
  tables: createdTables.length,
  columns: (stages["002_columns.sql"].match(/add\s+column\s+if\s+not\s+exists/gi) ?? []).length,
  constraints: unique(constraints).length,
  indexes: indexes.length,
  functions: functionSignatures.length,
  policies: policies.length,
  triggers: triggers.length,
  buckets: buckets.length,
  dependencies: { forwardTableReferences, missingAlterTables, missingIndexTables, missingFunctionTables, unresolvedFunctionCalls, missingPolicyTables, missingTriggerTables, missingTriggerFunctions },
  idempotency: {
    duplicateIndexes: indexes.length - unique(indexes).length,
    duplicatePolicies: policies.length - unique(policies).length,
    duplicateTriggers: triggers.length - unique(triggers).length,
    duplicateBuckets: buckets.length - unique(buckets).length,
  },
};

const blockingDependencies = forwardTableReferences.length + missingAlterTables.length + missingIndexTables.length + missingFunctionTables.length + missingPolicyTables.length + missingTriggerTables.length + missingTriggerFunctions.length;
console.log(`Sprint 92 static deployment rehearsal audit: ${blockingDependencies > 0 ? "FAIL" : "PASS"}`);
console.log(JSON.stringify(report, null, 2));
if (blockingDependencies > 0) {
  console.error(`Sprint 92 static deployment rehearsal audit: FAIL — ${blockingDependencies} unresolved dependency references`);
  process.exitCode = 1;
}
