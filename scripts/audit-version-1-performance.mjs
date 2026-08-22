import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const walk = (directory) =>
  existsSync(directory)
    ? readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const target = join(directory, entry.name);
        return entry.isDirectory() ? walk(target) : [target];
      })
    : [];
const chunks = walk(join(root, ".next/static/chunks")).filter((file) =>
  file.endsWith(".js"),
);
const totalBytes = chunks.reduce((sum, file) => sum + statSync(file).size, 0);
const largest = chunks
  .map((file) => ({
    file: relative(root, file).replaceAll("\\", "/"),
    bytes: statSync(file).size,
  }))
  .sort((a, b) => b.bytes - a.bytes)
  .slice(0, 10);
const sources = [
  ...walk(join(root, "app")),
  ...walk(join(root, "features")),
].filter((file) => /\.[jt]sx?$/.test(file));
let serverActions = 0,
  cacheConsumers = 0,
  dynamicImports = 0;
for (const file of sources) {
  const source = readFileSync(file, "utf8");
  if (/^["']use server["'];?/m.test(source)) serverActions += 1;
  if (/PerformanceCacheService|unstable_cache|use cache/.test(source))
    cacheConsumers += 1;
  dynamicImports += [...source.matchAll(/\b(?:dynamic|import)\s*\(/g)].length;
}
const result = Object.freeze({
  buildAvailable: chunks.length > 0,
  javascriptChunks: chunks.length,
  totalChunkBytes: totalBytes,
  largest,
  serverActionFiles: serverActions,
  cacheConsumers,
  dynamicImports,
});
if (!result.buildAvailable) {
  console.error(
    "Version 1.0 performance audit requires a completed production build.",
  );
  process.exitCode = 1;
} else {
  console.log(
    `Version 1.0 performance evidence: ${chunks.length} JavaScript chunks, ${(totalBytes / 1024 / 1024).toFixed(2)} MiB aggregate emitted chunk bytes, ${serverActions} server-action files, ${cacheConsumers} cache consumers, and ${dynamicImports} dynamic imports.`,
  );
  console.log(
    `Largest emitted chunk: ${largest[0]?.file ?? "unavailable"} (${largest[0] ? (largest[0].bytes / 1024).toFixed(1) : "0"} KiB). Route-level browser metrics remain a production monitoring requirement.`,
  );
}
export { result };
