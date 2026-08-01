// node scripts/verify-icons.mjs
// Reads src/lib/icons.ts as text (no TS loader needed) and checks every
// "<prefix>:name" against the Iconify API, grouped by collection prefix.
// Anything the API doesn't return is a bad name that would render as a
// blank square in the demo.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsFile = readFileSync(path.join(__dirname, "../src/lib/icons.ts"), "utf8");

const entries = [...iconsFile.matchAll(/^\s*(\w+):\s*"([a-z0-9-]+):([a-z0-9-]+)"/gm)].map(
  ([, key, prefix, name]) => ({ key, prefix, name, full: `${prefix}:${name}` }),
);

if (entries.length === 0) {
  console.error("No icon entries found in src/lib/icons.ts");
  process.exit(1);
}

const byPrefix = Map.groupBy(entries, (e) => e.prefix);
const missing = [];

for (const [prefix, group] of byPrefix) {
  const names = group.map((e) => e.name);
  const res = await fetch(`https://api.iconify.design/${prefix}.json?icons=${names.join(",")}`);
  const data = await res.json();
  const found = new Set(Object.keys(data.icons ?? {}));
  missing.push(...group.filter((e) => !found.has(e.name)));
}

if (missing.length === 0) {
  console.log(`✅ all ${entries.length} icons resolve`);
} else {
  console.log("❌ these names do not exist : fix them in src/lib/icons.ts:");
  missing.forEach((e) => console.log(`   ${e.key.padEnd(16)} ${e.full}`));
  process.exit(1);
}
