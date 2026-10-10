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
/** @type {string[]} */
const listed = [];
for (const page of pages) {
  const rel = page.slice(dist.length + 1);
  const html = readFileSync(page, "utf8");
  const refs = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
  const bundles = refs.map((src) => readFileSync(join(dist, src.slice(1)), "utf8"));
  const hasInject = bundles.some((js) => js.includes("/_vercel/insights/script.js"));
  const hasSpeed = bundles.some((js) => js.includes("/_vercel/speed-insights/script.js"));
  listed.push(`${rel} → inject()=${hasInject ? "sí" : "NO"} refs=${refs.join(",") || "(ninguno)"}`);
  if (!hasInject || !hasSpeed) {
    missing.push(`${rel} refs=${refs.join(",") || "(ninguno)"} inject=${hasInject} speed=${hasSpeed}`);
  }
}

if (missing.length) {
  throw new Error("HTML de dist sin Analytics/Speed Insights:\n" + missing.join("\n"));
}

const assetDir = join(dist, "assets");
const hasTrack = readdirSync(assetDir)
  .filter((name) => name.endsWith(".js"))
  .some((name) => readFileSync(join(assetDir, name), "utf8").includes("copiar_link"));
if (!hasTrack) {
  throw new Error("dist no incluye track('copiar_link')");
}

console.log(`OK: inject() carga en ${pages.length} HTML de dist:\n${listed.map((l) => `- ${l}`).join("\n")}`);
console.log("OK: el bundle de la calculadora incluye track('copiar_link')");
