import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const directory = join(root, "supabase", "reconciliation");
const names = ["001_core_schema.sql", "002_columns.sql", "003_indexes.sql", "004_functions.sql", "005_rls.sql", "006_storage.sql", "007_seed.sql", "008_validation.sql", "PRE_DEPLOY_VALIDATION.sql", "POST_DEPLOY_VALIDATION.sql"];
const stages = Object.fromEntries(await Promise.all(names.map(async (name) => [name, await readFile(join(directory, name), "utf8")])));
const patch = Object.values(stages).join("\n");
const check = stages["POST_DEPLOY_VALIDATION.sql"];
const columns = stages["002_columns.sql"];
const runbook = await readFile(join(root, "docs", "DEPLOYMENT_EXECUTION_ORDER.md"), "utf8");
const fail = (condition, message) => { if (condition) throw new Error(message); };
const deploymentStatements = patch
  .replace(/\$vayon_sql\$[\s\S]*?\$vayon_sql\$/g, "GUARDED_DEFINITION")
  .replace(/\$definition\$[\s\S]*?\$definition\$/g, "GUARDED_DEFINITION");

fail(/\bdrop\s+table\b/i.test(deploymentStatements), "DROP TABLE is forbidden");
fail(/^\s*(delete|truncate|update)\b/im.test(deploymentStatements), "Top-level destructive/data mutation is forbidden");
fail(/supabase_migrations|migration\s+repair|db\s+push/i.test(patch), "Patch must not manipulate migration history or invoke db push");
fail(/\\set\b|no parallel scheduling engine/i.test(patch), "Supabase-incompatible parser content");
fail(!/to_regprocedure\(/i.test(stages["004_functions.sql"]) || !/pg_get_function_result/i.test(stages["004_functions.sql"]) || !/digest\(p\.prosrc/i.test(stages["004_functions.sql"]), "Functions must be signature/body aware");
fail(!/roles\s+@>/i.test(stages["005_rls.sql"]) || !/roles\s+<@/i.test(stages["005_rls.sql"]) || !/with_check/i.test(stages["005_rls.sql"]), "Policies must be definition aware");
fail(!/pg_get_triggerdef/i.test(stages["005_rls.sql"]), "Triggers must be definition aware");
fail(!/pg_get_indexdef|indexdef/i.test(stages["003_indexes.sql"]) || !/vayon_expected_indexes/i.test(stages["003_indexes.sql"]) || /create\s+(?:unique\s+)?index\s+concurrently/i.test(stages["003_indexes.sql"]), "Indexes must be structural and transaction-safe for Supabase SQL Editor");
fail(/drop\s+constraint/i.test(stages["002_columns.sql"]), "Constraint reconciliation must not drop constraints");
fail(/pg_get_constraintdef|definition\s*<>|expected_normalized|actual_values/i.test(columns), "Additive constraint reconciliation must not compare definitions or normalized SQL");
fail((columns.match(/constraint_oid is not null/g) ?? []).length !== 8, "Every additive CHECK constraint must use identity-only reconciliation");
fail((columns.match(/constraint_type<>'c'/g) ?? []).length !== 8, "Every additive constraint guard must verify CHECK type");
fail((columns.match(/cardinality\(c\.conkey\)=1/g) ?? []).length !== 8, "Every additive constraint guard must verify one expected column");
for (const name of ["notification_preferences_digest_frequency_check", "creative_assets_mime_type_check", "knowledge_articles_knowledge_kind_check", "knowledge_articles_visibility_check", "site_visits_status_check", "site_visits_type_check", "site_visits_priority_check", "site_visits_duration_check"]) fail(!columns.includes(`conname='${name}'`), `Missing additive constraint guard: ${name}`);
fail(deploymentStatements.split(";").some((statement) => (statement.match(/on\s+conflict/gi) ?? []).length > 1), "A statement contains duplicate ON CONFLICT clauses");
fail(!/begin transaction read only/i.test(check) || !/rollback/i.test(check), "Post-deploy check must be read only");
for (const phrase of ["backup", "rollback", "deployment order", "verification checklist", "migration history", "db push"]) fail(!runbook.toLowerCase().includes(phrase), `Runbook missing: ${phrase}`);
console.log("Version 1 production package audit: PASS");
console.log(JSON.stringify({ stages: names.length, patchBytes: patch.length, reconciledPolicies: (stages["005_rls.sql"].match(/Definition-aware reconciliation/g) ?? []).length, reconciledFunctions: (stages["004_functions.sql"].match(/Signature-aware/g) ?? []).length, reconciledTriggers: (stages["005_rls.sql"].match(/pg_get_triggerdef/g) ?? []).length }, null, 2));
