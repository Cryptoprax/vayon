import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function closingBrace(source, opening) {
  let depth = 0;
  for (let index = opening; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}" && --depth === 0) return index;
  }
  return -1;
}

const violations = [];
for (const file of [...walk("app"), ...walk("features")].filter((path) => /\.(ts|tsx)$/.test(path))) {
  const source = readFileSync(file, "utf8");
  if (!source.includes("use server") || !source.includes("redirect(")) continue;
  for (const match of source.matchAll(/\btry\s*\{/g)) {
    const opening = match.index + match[0].lastIndexOf("{");
    const closing = closingBrace(source, opening);
    if (closing > opening && /\b(?:redirect|permanentRedirect)\s*\(/.test(source.slice(opening + 1, closing))) {
      violations.push(file.split(sep).join("/"));
    }
  }
}

if (violations.length) {
  console.error("Mutation reliability audit failed: redirect control flow is inside try/catch.");
  for (const file of [...new Set(violations)]) console.error(`- ${file}`);
  process.exitCode = 1;
} else {
  console.log("Mutation reliability audit passed: no Server Action catches redirect control flow.");
}
