import { SITE_URL } from "./config.js";
import { FAQ_ITEMS, HOME, PAGES, SITE_NAME, defaultResult, pageBody } from "./content.js";

const THEME_BOOT = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t;else document.documentElement.dataset.theme=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}catch(e){document.documentElement.dataset.theme="dark";}})();`;

/**
 * @param {unknown} data
 * @returns {string}
 */
export function jsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * @param {string} path
 * @returns {string}
 */
export function canonicalUrl(path) {
  if (path === "/") return SITE_URL + "/";
  return SITE_URL + path;
}

function webAppLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL + "/",
    description: HOME.description,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    inLanguage: "es",
    offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
  };
}

/**
 * @param {import("./content.js").PageMeta} page
 */
function breadcrumbLd(page) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL + "/" },
      { "@type": "ListItem", position: 2, name: page.h1, item: canonicalUrl(page.path) },
    ],
  };
}

function faqLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "es",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/**
 * @param {import("./content.js").PageMeta} page
 */
function navHtml(page) {
  const items = PAGES.map((p) => {
    const current = p.path === page.path;
    return `<li><a href="${p.path}"${current ? ' aria-current="page"' : ""}>${p.navLabel}</a></li>`;
  }).join("");
  return `<nav id="sitio-nav" class="sitio-nav" aria-label="Principal"><ul>${items}</ul></nav>`;
}

/**
 * @param {import("./content.js").PageMeta} page
 */
function crumbsHtml(page) {
  if (page.path === "/") return "";
  return `<nav class="crumbs" aria-label="Miga de pan"><ol><li><a href="/">Inicio</a></li><li aria-current="page">${page.h1}</li></ol></nav>`;
}

/**
 * @param {import("./content.js").PageMeta} page
 */
function jsonLdBlocks(page) {
  /** @type {unknown[]} */
  const blocks = [webAppLd()];
  if (page.path !== "/") blocks.push(breadcrumbLd(page));
  if (page.path === "/preguntas-frecuentes") blocks.push(faqLd());
  return blocks.map((b) => `<script type="application/ld+json">${jsonLd(b)}</script>`).join("\n");
}

/**
 * @param {string} path
 */
export function findPage(path) {
  const normalized = path.length > 1 ? path.replace(/\/$/, "") : path;
  return PAGES.find((p) => p.path === normalized) || null;
}

/**
 * @param {import("./content.js").PageMeta} page
 * @param {{ example?: ReturnType<typeof defaultResult>, scripts?: boolean }} [opts]
 */
export function renderPage(page, opts = {}) {
  const example = opts.example || defaultResult();
  const url = canonicalUrl(page.path);
  const isHome = page.path === "/";
  const calcBtns = isHome
    ? `<button type="button" id="share" class="btn">🔗 Copiar link</button><button type="button" id="reset" class="btn">↺ Reiniciar</button>`
    : "";
  const moduleScripts =
    opts.scripts === false
      ? ""
      : isHome
        ? `<script type="module" src="/src/app.js"></script>`
        : `<script type="module" src="/src/ui.js"></script>`;
  const bodyClass = isHome ? "home" : "subpage";
  const articleClass = isHome ? "content" : "content prose";

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(page.title)}</title>
<meta name="description" content="${escapeAttr(page.description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_AR">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${escapeAttr(page.title)}">
<meta property="og:description" content="${escapeAttr(page.description)}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escapeAttr(page.title)}">
<meta name="twitter:description" content="${escapeAttr(page.description)}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🔦%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="/src/style.css">
${jsonLdBlocks(page)}
<script>${THEME_BOOT}</script>
</head>
<body class="${bodyClass}">
<a class="skip" href="#contenido">Saltar al contenido</a>
<header>
  <div class="brand-wrap">
    <a class="brand" href="/">Presupuesto óptico <span>FTTH</span></a>
    <p class="sub">Pérdidas y potencia en la ONT para redes GPON</p>
  </div>
  <button type="button" class="btn nav-toggle" id="navToggle" aria-expanded="false" aria-controls="sitio-nav">Menú</button>
  ${navHtml(page)}
  <div class="hdr-btns">${calcBtns}<button type="button" id="theme" class="btn" aria-label="Cambiar tema">🌓</button></div>
</header>
<main id="contenido">
  ${crumbsHtml(page)}
  <article class="${articleClass}">
    <h1>${escapeHtml(page.h1)}</h1>
    ${pageBody(page.path, example)}
  </article>
</main>
<footer>
  <a href="${SITE_URL}">lucianopaulucci.com</a>
</footer>
${moduleScripts}
</body>
</html>
`;
}

/**
 * @returns {string}
 */
export function robotsTxt() {
  const bots = ["*", "OAI-SearchBot", "GPTBot", "PerplexityBot", "ClaudeBot", "Google-Extended", "Bingbot"];
  const lines = bots.flatMap((bot) => [`User-agent: ${bot}`, "Allow: /", ""]);
  lines.push(`Sitemap: ${SITE_URL}/sitemap.xml`);
  lines.push("");
  return lines.join("\n");
}

/**
 * @returns {string}
 */
export function sitemapXml() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = PAGES.map((p) => {
    const loc = canonicalUrl(p.path);
    const pri = p.path === "/" ? "1.0" : "0.8";
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${pri}</priority>\n  </url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

/**
 * @returns {string}
 */
export function llmsTxt() {
  const list = PAGES.map((p) => `- ${canonicalUrl(p.path)} — ${p.h1}: ${p.description}`).join("\n");
  return `# ${SITE_NAME}

Calculadora gratuita en español del presupuesto óptico de redes FTTH/GPON.
Estima pérdidas por fibra, splitters PLC, empalmes y conectores, la potencia en la ONT, el margen remanente y la distancia máxima.

Sitio: ${SITE_URL}
Idioma: es
Gratis, sin registro. Todo el cálculo corre en el navegador.

## Páginas

${list}

## Notas
- Los valores por defecto son típicos de referencia (mercado). Las clases B+ y C+ siguen ITU-T G.984.2.
- No reemplaza mediciones con power meter u OTDR.
`;
}

/** @param {string} s */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
}

/** @param {string} s */
function escapeAttr(s) {
  return escapeHtml(s).replace(/\n/g, " ");
}
