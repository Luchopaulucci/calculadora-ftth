import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = dirname(fileURLToPath(import.meta.url));

const PAGE_DIRS = [
  "como-calcular-presupuesto-optico",
  "perdidas-tipicas",
  "glosario-ftth-gpon",
  "preguntas-frecuentes",
  "acerca-de",
];

/** Sirve /ruta → /ruta/index.html (sin fallback SPA a la home). */
function mpaIndex() {
  /** @param {import("vite").ViteDevServer} server */
  const apply = (server) => {
    server.middlewares.use((req, _res, next) => {
      const raw = req.url ?? "";
      const [pathname, query] = raw.split("?");
      if (!pathname || pathname === "/" || pathname.includes(".")) return next();
      const slug = pathname.replace(/\/$/, "").replace(/^\//, "");
      if (!PAGE_DIRS.includes(slug)) return next();
      const q = query ? `?${query}` : "";
      req.url = `/${slug}/index.html${q}`;
      next();
    });
  };
  return {
    name: "mpa-index",
    configureServer: apply,
    configurePreviewServer: apply,
  };
}

export default defineConfig({
  root,
  publicDir: "public",
  appType: "mpa",
  plugins: [mpaIndex()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        como: resolve(root, "como-calcular-presupuesto-optico/index.html"),
        perdidas: resolve(root, "perdidas-tipicas/index.html"),
        glosario: resolve(root, "glosario-ftth-gpon/index.html"),
        faq: resolve(root, "preguntas-frecuentes/index.html"),
        about: resolve(root, "acerca-de/index.html"),
      },
    },
  },
});
