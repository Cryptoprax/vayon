import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";

const root = process.cwd();
const migrationRoot = join(root, "supabase/migrations");
const files = readdirSync(migrationRoot)
  .filter((file) => file.endsWith(".sql"))
  .sort();
const versions = files.map((file) => file.split("_")[0]);
const duplicateVersions = [
  ...new Set(
    versions.filter((item, index) => versions.indexOf(item) !== index),
  ),
];
const malformed = files.filter(
  (file) => !/^\d{14}_[a-z0-9_]+\.sql$/.test(file),
);
const outOfOrder = files.filter(
  (file, index) => index > 0 && file.localeCompare(files[index - 1]) < 0,
);
const sql = files.map((file) => ({
  file,
  source: readFileSync(join(migrationRoot, file), "utf8"),
}));
const createdTables = sql.flatMap(({ file, source }) =>
  [
    ...source.matchAll(
      /create table(?: if not exists)? public\.([a-z0-9_]+)/gi,
    ),
  ].map((match) => ({ file, table: match[1] })),
);
const rlsTables = new Set(
  sql.flatMap(({ source }) =>
    [
      ...source.matchAll(
        /alter table public\.([a-z0-9_]+) enable row level security/gi,
      ),
    ].map((match) => match[1]),
  ),
);
const missingRls = createdTables.filter(({ table }) => !rlsTables.has(table));
const rpcCalls = new Set();
for (const directory of ["app", "features"]) {
  const walk = (path) => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const target = join(path, entry.name);
      if (entry.isDirectory()) walk(target);
      else if (/\.[cm]?[jt]sx?$/.test(entry.name)) {
        const source = readFileSync(target, "utf8");
        for (const match of source.matchAll(/\.rpc\(["']([a-z0-9_]+)["']/gi))
          rpcCalls.add(match[1]);
      }
    }
  };
  walk(join(root, directory));
}
const declaredFunctions = new Set(
  sql.flatMap(({ source }) =>
    [
      ...source.matchAll(/create or replace function public\.([a-z0-9_]+)/gi),
    ].map((match) => match[1]),
  ),
);
const missingRpcDefinitions = [...rpcCalls]
  .filter((name) => !declaredFunctions.has(name))
  .sort();
const storageBuckets = sql.flatMap(({ source }) =>
  [...source.matchAll(/storage\.buckets[^;]*values\(['"]([^'"]+)/gi)].map(
    (match) => match[1],
  ),
);
const policyCount = sql.reduce(
  (sum, item) => sum + [...item.source.matchAll(/create policy/gi)].length,
  0,
);
const indexCount = sql.reduce(
  (sum, item) =>
    sum + [...item.source.matchAll(/create (?:unique )?index/gi)].length,
  0,
);
const requiredLatest = [
  "20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql",
  "20260917000000_sprint86_4_product_intelligence.sql",
  "20260918000000_sprint86_5_continuous_learning.sql",
];
const missingLatest = requiredLatest.filter((file) => !files.includes(file));
const requiredArtifacts = [
  "docs/VAYON_VERSION_1_CERTIFICATION.md",
  "docs/VERSION_1_LAUNCH_CHECKLIST.md",
  "docs/OPERATIONS_RUNBOOK.md",
  "docs/BACKUP_AND_RECOVERY_RUNBOOK.md",
  "docs/VERSION_1_PERFORMANCE_REPORT.md",
];
const missingArtifacts = requiredArtifacts.filter(
  (file) => !existsSync(join(root, file)),
);
const result = {
  migrations: files.length,
  duplicateVersions,
  malformed,
  outOfOrder,
  createdTables: createdTables.length,
  rlsTables: rlsTables.size,
  missingRls,
  rpcCalls: rpcCalls.size,
  missingRpcDefinitions,
  storageBuckets: [...new Set(storageBuckets)].sort(),
  policies: policyCount,
  indexes: indexCount,
  missingLatest,
  missingArtifacts,
};
const structuralFailure =
  duplicateVersions.length ||
  malformed.length ||
  outOfOrder.length ||
  missingLatest.length ||
  missingArtifacts.length;
if (structuralFailure) {
  console.error(JSON.stringify(result, null, 2));
  process.exitCode = 1;
} else {
  console.log(
    `VAYON 1.0 repository certification passed: ${files.length} ordered migrations, ${rlsTables.size} RLS tables, ${policyCount} policies, ${indexCount} indexes, ${declaredFunctions.size} RPC definitions, and ${new Set(storageBuckets).size} storage buckets audited.`,
  );
  if (missingRls.length)
    console.log(
      `Review note: ${missingRls.length} table declarations rely on RLS enabled by another migration or require operator review.`,
    );
  if (missingRpcDefinitions.length)
    console.log(
      `Review note: ${missingRpcDefinitions.length} RPC calls are external/legacy declarations requiring deployed-schema verification: ${missingRpcDefinitions.map(basename).join(", ")}.`,
    );
}

export { result };
