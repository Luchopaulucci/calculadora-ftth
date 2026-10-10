import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

/**
 * @param {string} dir
 * @returns {string[]}
 */
function htmlFiles(dir) {
  /** @type {string[]} */
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...htmlFiles(full));
    else if (name.endsWith(".html")) out.push(full);
  }
  return out;
}

const pages = htmlFiles(dist);
if (pages.length === 0) {
  throw new Error("dist/ no tiene HTML: corré npm run build primero");
}

const missing = [];
for (const page of pages) {
  const html = readFileSync(page, "utf8");
  const refs = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
  const bundles = refs.map((src) => readFileSync(join(dist, src.slice(1)), "utf8"));
  const hasAnalytics = bundles.some((js) => js.includes("/_vercel/insights/script.js"));
  const hasSpeed = bundles.some((js) => js.includes("/_vercel/speed-insights/script.js"));
  if (!hasAnalytics || !hasSpeed) {
    missing.push(`${page.slice(dist.length + 1)} refs=${refs.join(",") || "(ninguno)"} analytics=${hasAnalytics} speed=${hasSpeed}`);
  }
}

if (missing.length) {
  throw new Error("HTML de dist sin Analytics/Speed Insights:\n" + missing.join("\n"));
}

console.log(`OK: ${pages.length} HTML de dist incluyen Web Analytics y Speed Insights`);
