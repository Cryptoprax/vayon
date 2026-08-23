import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const walk = (directory) =>
  readdirSync(join(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path.replaceAll("\\", "/")];
  });

const navigation = read("features/vayon/product-shell/navigation.ts");
const shell = read("features/vayon/components/VayonShell.tsx");
const env = read("config/environments/production.env.example");
const routeFiles = new Set(walk("app").filter((path) => path.endsWith("/page.tsx")));
const hrefs = [...navigation.matchAll(/href:\s*"(\/vayon(?:\/[^"?]*)?)/g)].map((match) => match[1]);
const routeFor = (href) => {
  const page = `app/${href.slice(1)}/page.tsx`;
  if (routeFiles.has(page)) return page;
  const segments = page.split("/");
  return [...routeFiles].find((candidate) => {
    const parts = candidate.split("/");
    return parts.length === segments.length && parts.every((part, index) => part.startsWith("[") || part === segments[index]);
  });
};

const missing = [...new Set(hrefs)].filter((href) => !routeFor(href));
const duplicates = hrefs.filter((href, index) => hrefs.indexOf(href) !== index);
const required = [
  "/vayon/creative-studio",
  "/vayon/creative-studio/growth",
  "/vayon/intelligence",
  "/vayon/knowledge",
  "/vayon/settings/product-intelligence",
];
const hidden = required.filter((href) => !hrefs.includes(href));
const prohibited = ["Referral Program", "Affiliate Program", "Future Publishing", "Autonomous AI"]
  .filter((label) => navigation.includes(label));
const intelligenceDefault = /FEATURE_VAYON_INTELLIGENCE=true/.test(env) && /!==\s*"false"/.test(shell);

console.log("Sprint 88 feature activation audit");
console.log(`Authenticated routes: ${[...routeFiles].filter((path) => path.startsWith("app/vayon/")).length}`);
console.log(`Primary navigation links: ${hrefs.length}`);
console.log(`Missing navigation routes: ${missing.length}`);
console.log(`Duplicate navigation routes: ${new Set(duplicates).size}`);
console.log(`Hidden production-ready routes: ${hidden.length}`);
console.log(`Exposed incomplete capabilities: ${prohibited.length}`);
console.log(`VAYON Intelligence default: ${intelligenceDefault ? "enabled" : "disabled"}`);

if (missing.length || duplicates.length || hidden.length || prohibited.length || !intelligenceDefault) {
  if (missing.length) console.error(`Missing routes: ${missing.join(", ")}`);
  if (duplicates.length) console.error(`Duplicate routes: ${[...new Set(duplicates)].join(", ")}`);
  if (hidden.length) console.error(`Hidden routes: ${hidden.join(", ")}`);
  if (prohibited.length) console.error(`Incomplete capabilities: ${prohibited.join(", ")}`);
  process.exitCode = 1;
}

for (const artifact of [
  "docs/FEATURE_ACTIVATION_REPORT.md",
  "tests/sprint88-feature-activation.test.mjs",
]) {
  if (!existsSync(join(root, artifact))) {
    console.error(`Missing Sprint 88 artifact: ${relative(root, join(root, artifact))}`);
    process.exitCode = 1;
  }
}
