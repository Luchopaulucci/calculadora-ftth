# Calculadora de presupuesto óptico FTTH / GPON

Sitio estático (Vite, HTML + CSS + JS, sin backend) para calcular pérdidas en una red FTTH y verificar si la potencia en la ONT entra en rango.

- Clases GPON B+ / C+ o personalizada (TX OLT, sensibilidad y saturación de la ONT).
- Longitudes de onda 1310 / 1490 / 1550 nm con atenuación editable.
- Splitters PLC en varias etapas (1:2 a 1:64), empalmes por fusión y mecánicos, conectores SC/APC y margen.
- Resultado: desglose y barra apilada, RX estimada (peor, nominal y mejor caso), veredicto, margen remanente y distancia máxima.
- El estado se guarda en la URL (botón "Copiar link"), con tema claro/oscuro y diseño mobile.

> ⚠️ Los valores por defecto son **típicos de referencia** (ITU-T G.984.2 y valores comunes de mercado). Verificalos siempre con los datasheets y con mediciones reales.

## Páginas

- `/` calculadora
- `/como-calcular-presupuesto-optico`
- `/perdidas-tipicas`
- `/glosario-ftth-gpon`
- `/preguntas-frecuentes`
- `/acerca-de`

La URL canónica se lee de `SITE_URL` / `VITE_SITE_URL` (ver `src/config.js`). Si no está definida, se usa `https://lucianopaulucci.com` (dominio mencionado en el README original).

## Uso local
```bash
npm install
npm run dev       # http://localhost:5173
npm test          # tests de la lógica y del HTML estático
npm run lint
npm run typecheck
npm run build     # genera dist/
```

## Deploy en Vercel
**Opción 1, repo conectado:** subí la carpeta a un repo de GitHub, entrá a vercel.com → *Add New → Project*, importá el repo. El `vercel.json` indica `npm run build` y `dist/`.

**Opción 2, CLI:**
```bash
npm i -g vercel
vercel          # preview
vercel --prod   # producción
```

**Dominio:** en el proyecto, *Settings → Domains*, agregá `lucianopaulucci.com` (o un subdominio como `ftth.lucianopaulucci.com`) y creá en Cloudflare el registro DNS que te indique Vercel (CNAME a `cname.vercel-dns.com`, con el proxy en gris, solo DNS).
