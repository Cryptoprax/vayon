import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const patch = await readFile(join(root, "supabase", "reconciliation", "VERSION1_PRODUCTION_PATCH.sql"), "utf8");
const check = await readFile(join(root, "supabase", "reconciliation", "VERSION1_POST_DEPLOY_CHECK.sql"), "utf8");
const runbook = await readFile(join(root, "docs", "VERSION1_DEPLOYMENT_RUNBOOK.md"), "utf8");
const fail = (condition, message) => { if (condition) throw new Error(message); };
const deploymentStatements = patch.replace(/\$vayon_sql\$[\s\S]*?\$vayon_sql\$/g, "GUARDED_DEFINITION");

fail(/\bdrop\s+table\b/i.test(deploymentStatements), "DROP TABLE is forbidden");
fail(/^\s*(delete|truncate|update)\b/im.test(deploymentStatements), "Top-level destructive/data mutation is forbidden");
fail(/supabase_migrations|migration\s+repair|db\s+push/i.test(patch), "Patch must not manipulate migration history or invoke db push");
fail(/^\s*create\s+policy\b/im.test(patch), "Every policy must use an existence guard");
fail(/^\s*create\s+trigger\b/im.test(patch), "Every trigger must use an existence guard");
fail(/^\s*create\s+or\s+replace\s+function\b/im.test(patch), "Every function must use a catalog guard");
fail(/REVIEW_REQUIRED|TODO|FIXME/.test(patch), "Unresolved package marker");
fail(/on\s+conflict[\s\S]{0,250}on\s+conflict/i.test(deploymentStatements), "A statement contains duplicate ON CONFLICT clauses");
fail(!/begin transaction read only/i.test(check) || !/rollback/i.test(check), "Post-deploy check must be read only");
for (const phrase of ["backup", "rollback", "deployment order", "verification checklist", "no migration history", "do not run `supabase db push`"]) fail(!runbook.toLowerCase().includes(phrase), `Runbook missing: ${phrase}`);
console.log("Version 1 production package audit: PASS");
console.log(JSON.stringify({ patchBytes: patch.length, guardedPolicies: (patch.match(/\$vayon_policy\$/g) ?? []).length / 2, guardedFunctions: (patch.match(/\$vayon_function\$/g) ?? []).length / 2, guardedTriggers: (patch.match(/\$vayon_trigger\$/g) ?? []).length / 2 }, null, 2));
