# Calculadora de presupuesto óptico FTTH / GPON

Web estática (HTML + CSS + JS, sin dependencias ni backend) para calcular pérdidas en una red FTTH y verificar si la potencia en la ONT entra en rango.

- Clases GPON B+ / C+ o personalizada (TX OLT, sensibilidad y saturación de la ONT).
- Longitudes de onda 1310 / 1490 / 1550 nm con atenuación editable.
- Splitters PLC en varias etapas (1:2 a 1:64), empalmes por fusión y mecánicos, conectores SC/APC y margen.
- Resultado: desglose y barra apilada, RX estimada (peor, nominal y mejor caso), veredicto, margen remanente y distancia máxima.
- El estado se guarda en la URL (botón "Copiar link"), con tema claro/oscuro y diseño mobile.

> ⚠️ Los valores por defecto son **típicos de referencia** (ITU-T G.984 y valores comunes de mercado). Verificalos siempre con los datasheets y con mediciones reales.

## Uso local
```bash
npm start      # sirve en http://localhost:5173 (python3 -m http.server)
npm test       # tests de la lógica (node --test)
```

## Deploy en Vercel
**Opción 1, repo conectado:** subí la carpeta a un repo de GitHub, entrá a vercel.com → *Add New → Project*, importá el repo y elegí Framework Preset "Other", sin comando de build. El `vercel.json` ya indica que se sirve la raíz.

**Opción 2, CLI:**
```bash
npm i -g vercel
vercel          # preview
vercel --prod   # producción
```

**Dominio:** en el proyecto, *Settings → Domains*, agregá `lucianopaulucci.com` (o un subdominio como `ftth.lucianopaulucci.com`) y creá en Cloudflare el registro DNS que te indique Vercel (CNAME a `cname.vercel-dns.com`, con el proxy en gris, solo DNS).

---
Hecho por Luciano Paulucci
# calculadora-ftth
