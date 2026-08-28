import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const roots = ["app", "features"];
const sourceExtensions = new Set([".ts", ".tsx"]);
const ignoredPrefixes = ["http://", "https://", "mailto:", "tel:", "#"];

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function routeFor(file) {
  const parts = relative("app", file).split(sep).slice(0, -1);
  const visible = parts.filter((part) => !part.startsWith("(") && !part.startsWith("@"));
  return `/${visible.join("/")}`.replace(/\/$/, "") || "/";
}

function routePattern(route) {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped.replace(/\\\[\\\.\\\.\\\.([^\]]+)\\\]/g, ".+").replace(/\\\[([^\]]+)\\\]/g, "[^/]+")}/?$`);
}

const routeFiles = walk("app").filter((file) => /[\\/](page|route)\.(ts|tsx)$/.test(file));
const routes = routeFiles.map(routeFor);
const patterns = routes.map(routePattern);

const references = [];
const attributePattern = /(?:href|actionHref|destination|redirectTo|returnUrl|successUrl|cancelUrl)\s*(?:=|:)\s*["'`]([^"'`]+)["'`]/g;
const callPattern = /(?:redirect|permanentRedirect|router\.(?:push|replace)|NextResponse\.redirect)\(\s*(?:new URL\()?\s*["'`]([^"'`]+)["'`]/g;

for (const root of roots) {
  for (const file of walk(root)) {
    const extension = file.slice(file.lastIndexOf("."));
    if (!sourceExtensions.has(extension)) continue;
    const source = readFileSync(file, "utf8");
    for (const pattern of [attributePattern, callPattern]) {
      pattern.lastIndex = 0;
      for (const match of source.matchAll(pattern)) {
        const href = match[1];
        if (!href || ignoredPrefixes.some((prefix) => href.startsWith(prefix)) || href.includes("${")) continue;
        if (!href.startsWith("/")) continue;
        references.push({ file: file.split(sep).join("/"), href: href.split(/[?#]/)[0] || "/" });
      }
    }
  }
}

const missing = references.filter(({ href }) => !patterns.some((pattern) => pattern.test(href)));
const uniqueMissing = [...new Map(missing.map((item) => [`${item.file}:${item.href}`, item])).values()];

if (uniqueMissing.length) {
  console.error(`Route integrity audit failed: ${uniqueMissing.length} unresolved internal destination(s).`);
  for (const item of uniqueMissing) console.error(`- ${item.href} referenced by ${item.file}`);
  process.exitCode = 1;
} else {
  console.log(`Route integrity audit passed: ${routes.length} application routes cover ${references.length} static internal destinations.`);
}
