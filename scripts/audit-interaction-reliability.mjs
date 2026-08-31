import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const violations = [];
function openingTags(source) {
  const tags = [];
  for (let start = source.indexOf("<"); start >= 0; start = source.indexOf("<", start + 1)) {
    if (!/[A-Za-z]/.test(source[start + 1] ?? "")) continue;
    let braces = 0, quote = "", escaped = false;
    for (let index = start + 1; index < source.length; index += 1) {
      const character = source[index];
      if (quote) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === quote) quote = "";
        continue;
      }
      if (character === '"' || character === "'" || character === "`") quote = character;
      else if (character === "{") braces += 1;
      else if (character === "}") braces = Math.max(0, braces - 1);
      else if (character === ">" && braces === 0) {
        tags.push({ index: start, tag: source.slice(start, index + 1) });
        break;
      }
    }
  }
  return tags;
}

for (const file of [...walk("app"), ...walk("features")].filter((path) => path.endsWith(".tsx"))) {
  const source = readFileSync(file, "utf8");
  for (const { index, tag } of openingTags(source).filter((item) => /^<button\b/.test(item.tag) && /\btype=["']button["']/.test(item.tag))) {
    const context = source.slice(Math.max(0, index - 180), index);
    const controlled = /\b(?:onClick|onPointerDown|onKeyDown|formAction)=|\bdisabled(?:=|\s|>)/.test(tag);
    const delegated = /(?:DialogTrigger|DropdownMenuTrigger|PopoverTrigger|SheetTrigger|DisclosureTrigger)[\s\S]*$/.test(context);
    if (!controlled && !delegated) violations.push({ file, reason: `type=button has no handler or disabled state (${tag.replace(/\s+/g," ").slice(0,140)})` });
  }
  for (const { index, tag } of openingTags(source).filter((item) => /^<Button\b/.test(item.tag) && !/\btype=/.test(item.tag) && !/\b(?:onClick|onPointerDown|onKeyDown|formAction)=|\bdisabled(?:=|\s|>)/.test(item.tag))) {
    const insideForm=source.lastIndexOf("<form",index)>source.lastIndexOf("</form",index);
    if(!insideForm)violations.push({file,reason:`Button has no handler, form, or disabled state (${tag.replace(/\s+/g," ").slice(0,140)})`});
  }
  for (const { tag } of openingTags(source).filter((item) => /\brole=["']button["']/.test(item.tag))) {
    if (!/\b(?:onClick|onKeyDown)=|\bhref=|\bdisabled(?:=|\s|>)/.test(tag)) violations.push({ file, reason: "role=button has no interaction contract" });
  }
}

const unique = [...new Map(violations.map((item) => [`${item.file}:${item.reason}`, item])).values()];
if (unique.length) {
  console.error(`Interaction reliability audit failed: ${unique.length} dead interactive contract(s).`);
  for (const item of unique) console.error(`- ${relative(process.cwd(), item.file).split(sep).join("/")}: ${item.reason}`);
  process.exitCode = 1;
} else {
  console.log("Interaction reliability audit passed: explicit buttons and button-role elements have handlers, delegated triggers, or intentional disabled states.");
}
