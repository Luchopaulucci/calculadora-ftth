import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root,
  publicDir: "public",
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
