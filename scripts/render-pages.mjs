import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PAGES } from "../src/content.js";
import { llmsTxt, renderPage, robotsTxt, sitemapXml } from "../src/ssg.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

for (const page of PAGES) {
  const rel = page.path === "/" ? "index.html" : `${page.path.slice(1)}/index.html`;
  const out = join(root, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, renderPage(page));
}

const pub = join(root, "public");
mkdirSync(pub, { recursive: true });
writeFileSync(join(pub, "robots.txt"), robotsTxt());
writeFileSync(join(pub, "sitemap.xml"), sitemapXml());
writeFileSync(join(pub, "llms.txt"), llmsTxt());

console.log(`Wrote ${PAGES.length} pages + robots.txt, sitemap.xml, llms.txt`);
