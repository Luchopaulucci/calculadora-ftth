import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DATE_MODIFIED,
  FAQ_ITEMS,
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  PAGES,
  SEO_EXAMPLE,
  defaultResult,
  formatUpdatedLabel,
  workedExampleTable,
} from "../src/content.js";
import { fmtEs } from "../src/format.js";
import { SITE_URL } from "../src/config.js";
import { canonicalUrl, jsonLd, llmsTxt, renderPage, robotsTxt, sitemapXml } from "../src/ssg.js";

test("SITE_URL canónica sin barra final", () => {
  assert.equal(SITE_URL, "https://calculadora-ftth.vercel.app");
  assert.doesNotMatch(SITE_URL, /\/$/);
});

test("rutas SEO requeridas", () => {
  const paths = PAGES.map((p) => p.path);
  for (const path of [
    "/",
    "/como-calcular-presupuesto-optico",
    "/perdidas-tipicas",
    "/glosario-ftth-gpon",
    "/preguntas-frecuentes",
    "/acerca-de",
  ]) {
    assert.ok(paths.includes(path), path);
  }
});

test("HTML de cada página: lang es, title, H1, canonical, OG y nav", () => {
  for (const page of PAGES) {
    const html = renderPage(page);
    assert.match(html, /<html lang="es">/);
    assert.ok(html.includes(`<title>${page.title}</title>`), page.title);
    assert.ok(html.includes(`<h1>${page.h1}</h1>`), page.h1);
    assert.match(html, new RegExp(`<link rel="canonical" href="${canonicalUrl(page.path)}">`));
    assert.match(html, /property="og:title"/);
    assert.match(html, /name="twitter:card" content="summary_large_image"/);
    assert.ok(html.includes(`<meta property="og:image" content="${SITE_URL}${OG_IMAGE_PATH}">`));
    assert.ok(html.includes(`<meta property="og:image:width" content="${OG_IMAGE_WIDTH}">`));
    assert.ok(html.includes(`<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}">`));
    assert.ok(html.includes(`<meta property="og:image:alt" content="${OG_IMAGE_ALT}">`));
    assert.ok(html.includes(`<time datetime="${DATE_MODIFIED}">${formatUpdatedLabel()}</time>`));
    assert.match(html, /"dateModified":"2026-10-09"/);
    assert.match(html, /WebApplication/);
    assert.match(html, /applicationCategory/);
    assert.match(html, /"price":0/);
    assert.match(html, /"inLanguage":"es"/);
    for (const p of PAGES) {
      assert.match(html, new RegExp(`href="${p.path}"`));
    }
    assert.doesNotMatch(html, /Hecho por/i);
    assert.doesNotMatch(html, /Luciano Paulucci/i);
    if (page.path !== "/") {
      assert.match(html, /BreadcrumbList/);
    }
  }
});

test("HTML estático no oculta el H1 ni el lead de la home", () => {
  const html = renderPage(PAGES[0]);
  const h1 = html.match(/<h1[^>]*>/);
  assert.ok(h1, "falta h1");
  assert.doesNotMatch(h1[0], /opacity\s*:\s*0|visibility\s*:\s*hidden/i);
  const lead = html.match(/<p class="lead"[^>]*>/);
  assert.ok(lead, "falta .lead");
  assert.doesNotMatch(lead[0], /opacity\s*:\s*0|visibility\s*:\s*hidden/i);
});

test("home trae intro, calculadora y ejemplo resuelto en HTML estático", () => {
  const html = renderPage(PAGES[0]);
  assert.match(html, /Esta calculadora FTTH gratuita estima la pérdida total/);
  assert.match(html, /id="calculadora"/);
  assert.match(html, /id="ejemplo-resuelto"/);
  assert.match(html, /id="f"/);
  assert.match(html, /−22,1 dBm/);
  assert.match(html, /4,9 dB de margen remanente/);
  assert.match(html, /alcance físico típico de GPON \(20 km\)/);
  assert.match(
    html,
    /También se lo conoce como cálculo de link budget, balance de potencia óptica o cálculo de pérdidas en fibra óptica/,
  );
});

test("meta description de /como-calcular-presupuesto-optico", () => {
  const desc =
    "Paso a paso para calcular el presupuesto óptico FTTH/GPON: clase B+ o C+, pérdidas de fibra, splitters y conectores, RX en la ONT y margen.";
  const page = pageByPath("/como-calcular-presupuesto-optico");
  assert.equal(page.description, desc);
  const html = renderPage(page);
  assert.ok(html.includes(`<meta name="description" content="${desc}">`));
  assert.ok(html.includes(`<meta property="og:description" content="${desc}">`));
  assert.ok(html.includes(`<meta name="twitter:description" content="${desc}">`));
});

test("title de /acerca-de", () => {
  const title = "Acerca de la Calculadora FTTH gratuita en español";
  const page = pageByPath("/acerca-de");
  assert.equal(page.title, title);
  const html = renderPage(page);
  assert.ok(html.includes(`<title>${title}</title>`));
  assert.ok(html.includes(`<meta property="og:title" content="${title}">`));
  assert.ok(html.includes(`<meta name="twitter:title" content="${title}">`));
});

/** @param {string} path */
function pageByPath(path) {
  const page = PAGES.find((p) => p.path === path);
  if (!page) throw new Error("Falta la página " + path);
  return page;
}

test("FAQPage JSON-LD con las 8 preguntas", () => {
  const html = renderPage(pageByPath("/preguntas-frecuentes"));
  assert.match(html, /FAQPage/);
  assert.equal(FAQ_ITEMS.length, 8);
  for (const item of FAQ_ITEMS) {
    assert.ok(html.includes(item.q), item.q);
    assert.ok(html.includes(item.a), item.a);
  }
});

test("meta description de /perdidas-tipicas (meta, og y twitter)", () => {
  const desc =
    "Pérdidas típicas de splitters PLC (1:2 a 1:64), fibra por longitud de onda, empalmes y conectores SC/APC, más las clases GPON B+ y C+.";
  const page = pageByPath("/perdidas-tipicas");
  assert.equal(page.description, desc);
  const html = renderPage(page);
  assert.ok(html.includes(`<meta name="description" content="${desc}">`));
  assert.ok(html.includes(`<meta property="og:description" content="${desc}">`));
  assert.ok(html.includes(`<meta name="twitter:description" content="${desc}">`));
});

test("acerca-de no acredita autor y deja TODO", () => {
  const html = renderPage(pageByPath("/acerca-de"));
  assert.match(html, /TODO: Luciano decide si incluir crédito de autor/);
  assert.doesNotMatch(html, /Hecho por/);
});

test("robots.txt permite rastreadores de búsqueda e IA", () => {
  const txt = robotsTxt();
  for (const bot of ["*", "OAI-SearchBot", "GPTBot", "PerplexityBot", "ClaudeBot", "Google-Extended", "Bingbot"]) {
    assert.match(txt, new RegExp(`User-agent: ${bot}`));
  }
  assert.match(txt, /Allow: \//);
  assert.match(txt, new RegExp(`Sitemap: ${SITE_URL}/sitemap.xml`));
});

test("sitemap y llms.txt listan todas las páginas", () => {
  const sm = sitemapXml();
  const llms = llmsTxt();
  for (const page of PAGES) {
    assert.ok(sm.includes(canonicalUrl(page.path)), page.path);
    assert.ok(llms.includes(canonicalUrl(page.path)), page.path);
  }
});

test("og.png es 1200×630", () => {
  const png = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "public", "og.png"));
  assert.equal(png[1], 0x50);
  assert.equal(png[2], 0x4e);
  assert.equal(png[3], 0x47);
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  assert.equal(width, 1200);
  assert.equal(height, 630);
});

test("jsonLd escapa <", () => {
  assert.equal(jsonLd({ a: "</script>" }), '{"a":"\\u003c/script>"}');
});

test("tabla del ejemplo usa calculate() y coincide con las cifras SEO", () => {
  const r = defaultResult();
  const table = workedExampleTable(r);
  assert.ok(table.includes(`${fmtEs(SEO_EXAMPLE.totalLoss, 1)} dB`));
  assert.ok(table.includes(`${fmtEs(SEO_EXAMPLE.fiber, 1)} dB`));
  assert.ok(table.includes(`${fmtEs(SEO_EXAMPLE.splitter, 1)} dB`));
});
