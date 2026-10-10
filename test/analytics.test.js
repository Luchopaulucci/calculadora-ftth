import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PAGES } from "../src/content.js";
import { renderPage } from "../src/ssg.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("ui.js inyecta Web Analytics y Speed Insights", () => {
  const src = readFileSync(join(root, "src/ui.js"), "utf8");
  assert.match(src, /import \{\s*inject\s*\} from ["']@vercel\/analytics["']/);
  assert.match(src, /\binject\(\)/);
  assert.match(src, /import \{\s*injectSpeedInsights\s*\} from ["']@vercel\/speed-insights["']/);
  assert.match(src, /\binjectSpeedInsights\(\)/);
});

test("app.js carga el entry compartido ui.js", () => {
  const src = readFileSync(join(root, "src/app.js"), "utf8");
  assert.match(src, /import ["']\.\/ui\.js["']/);
});

test("todas las páginas cargan el entry JS compartido", () => {
  for (const page of PAGES) {
    const html = renderPage(page);
    if (page.path === "/") {
      assert.match(html, /<script type="module" src="\/src\/app\.js"><\/script>/);
    } else {
      assert.match(html, /<script type="module" src="\/src\/ui\.js"><\/script>/);
    }
  }
});

test("Copiar link dispara track('copiar_link') sin propiedades", () => {
  const src = readFileSync(join(root, "src/app.js"), "utf8");
  assert.match(src, /import \{\s*track\s*\} from ["']@vercel\/analytics["']/);
  assert.match(src, /\$\("share"\)\.addEventListener\("click"/);
  assert.match(src, /track\(["']copiar_link["']\)/);
  assert.doesNotMatch(src, /track\(["']copiar_link["']\s*,/);
});
