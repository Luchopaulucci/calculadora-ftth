import { calculate, DEFAULT_INPUT, SPLITTERS, WAVELENGTHS, CLASSES } from "./calc.js";
import { fmtEs } from "./format.js";

/** @typedef {{ path: string, title: string, description: string, h1: string, navLabel: string, ogType?: string }} PageMeta */

export const SITE_NAME = "Calculadora FTTH";

export const FAQ_ITEMS = [
  {
    q: "¿Qué potencia tiene que llegar a la ONT en GPON?",
    a: "Tiene que quedar entre la sensibilidad y la saturación de la ONT. En clase B+ son −27 dBm y −8 dBm, y en C+ son −30 dBm y −8 dBm. Lo recomendable es tener al menos unos dB de margen sobre la sensibilidad.",
  },
  {
    q: "¿Cuánto pierde un splitter 1:32?",
    a: "Unos 17,1 dB de referencia. El valor exacto depende del fabricante y figura en el datasheet.",
  },
  {
    q: "¿Qué pasa si la potencia en la ONT es demasiado alta?",
    a: "La ONT se puede saturar y tener errores. Pasa en enlaces cortos con poca división. Se soluciona con un atenuador óptico.",
  },
  {
    q: "¿Cuál es la diferencia entre la clase B+ y la C+?",
    a: "La C+ tiene más potencia de transmisión y una ONT más sensible, así que tolera más pérdida. Permite enlaces más largos o más división.",
  },
  {
    q: "¿Qué margen de seguridad conviene dejar?",
    a: "La calculadora usa 3 dB por defecto, para cubrir envejecimiento, reparaciones futuras y tolerancias de los componentes. Ajustalo según el criterio de tu red.",
  },
  {
    q: "¿Por qué se calcula con 1490 nm?",
    a: "Porque es la longitud de onda de bajada en GPON, la que va de la OLT a la ONT. La subida usa 1310 nm, que atenúa más por km, y conviene verificarla también.",
  },
  {
    q: "¿La calculadora reemplaza una medición?",
    a: "No. Da una estimación con valores típicos. El enlace real se valida con power meter u OTDR.",
  },
  {
    q: "¿Es gratis? ¿Necesito registrarme?",
    a: "Sí, es gratis y funciona en el navegador sin registro. Cada cálculo se puede compartir con el botón \"Copiar link\".",
  },
];

/** Cifras del ejemplo resuelto publicadas por SEO (deben coincidir con calculate()). */
export const SEO_EXAMPLE = {
  rxMin: -22.1,
  remaining: 4.9,
  totalLoss: 23.6,
  rxMax: -15.6,
  fiber: 2.5,
  splitter: 17.1,
  fusion: 0.4,
  conn: 0.6,
  margin: 3.0,
};

/** @type {PageMeta[]} */
export const PAGES = [
  {
    path: "/",
    title: "Calculadora FTTH online: presupuesto óptico GPON y pérdidas de fibra",
    description:
      "Calculá gratis el presupuesto óptico de una red FTTH/GPON: pérdidas por fibra, splitters, empalmes y conectores, potencia en la ONT, margen y distancia máxima.",
    h1: "Calculadora de presupuesto óptico FTTH / GPON",
    navLabel: "Calculadora",
  },
  {
    path: "/como-calcular-presupuesto-optico",
    title: "Cómo calcular el presupuesto óptico de una red FTTH (paso a paso)",
    description:
      "El presupuesto óptico es la diferencia entre la potencia que emite la OLT y la sensibilidad mínima de la ONT, y el enlace funciona si la suma de todas las pérdidas no la supera.",
    h1: "Cómo calcular el presupuesto óptico de una red FTTH",
    navLabel: "Cómo calcular",
  },
  {
    path: "/perdidas-tipicas",
    title: "Pérdidas típicas en FTTH: splitters, fibra, empalmes y conectores",
    description:
      "Pérdidas típicas de splitters PLC (1:2 a 1:64), fibra por longitud de onda, empalmes y conectores SC/APC, más las clases GPON B+ y C+.",
    h1: "Pérdidas típicas en una red FTTH / GPON",
    navLabel: "Pérdidas típicas",
  },
  {
    path: "/glosario-ftth-gpon",
    title: "Glosario FTTH y GPON: OLT, ONT, splitter, dBm y más",
    description:
      "Definiciones cortas de FTTH, GPON, OLT, ONT, splitter PLC, presupuesto óptico, dBm, sensibilidad, saturación y más términos de redes de fibra.",
    h1: "Glosario FTTH / GPON",
    navLabel: "Glosario",
  },
  {
    path: "/preguntas-frecuentes",
    title: "Preguntas frecuentes sobre presupuesto óptico FTTH y GPON",
    description:
      "Respuestas sobre potencia en la ONT, pérdida del splitter 1:32, saturación, clases B+ y C+, margen de seguridad, 1490 nm y si la calculadora reemplaza una medición.",
    h1: "Preguntas frecuentes",
    navLabel: "Preguntas frecuentes",
  },
  {
    path: "/acerca-de",
    title: "Acerca de la Calculadora FTTH",
    description:
      "La Calculadora FTTH es una herramienta gratuita en español para estimar el presupuesto óptico de redes GPON, pensada para técnicos, instaladores, ISP y estudiantes.",
    h1: "Acerca de esta calculadora",
    navLabel: "Acerca de",
  },
];

export const HOME = PAGES[0];

/**
 * Tabla del ejemplo resuelto, con pérdidas tomadas de calculate().
 * @param {ReturnType<typeof calculate>} r
 */
export function workedExampleTable(r) {
  const fiber = r.items.find((i) => i.key === "fiber")?.loss ?? 0;
  const split = r.items.find((i) => i.key === "splitters")?.loss ?? 0;
  const fusion = r.items.find((i) => i.key === "fusion")?.loss ?? 0;
  const conn = r.items.find((i) => i.key === "conn")?.loss ?? 0;
  const margin = r.items.find((i) => i.key === "margin")?.loss ?? 0;
  return `<table>
  <caption>Ejemplo resuelto: enlace GPON clase B+ a 1490 nm</caption>
  <thead><tr><th>Elemento</th><th>Cálculo</th><th>Pérdida</th></tr></thead>
  <tbody>
    <tr><td>Fibra</td><td>10 km × 0,25 dB/km</td><td>${fmtEs(fiber, 1)} dB</td></tr>
    <tr><td>Splitter 1:32</td><td>1 × 17,1 dB</td><td>${fmtEs(split, 1)} dB</td></tr>
    <tr><td>Empalmes por fusión</td><td>4 × 0,1 dB</td><td>${fmtEs(fusion, 1)} dB</td></tr>
    <tr><td>Conectores SC/APC</td><td>2 × 0,3 dB</td><td>${fmtEs(conn, 1)} dB</td></tr>
    <tr><td>Margen de seguridad</td><td>—</td><td>${fmtEs(margin, 1)} dB</td></tr>
  </tbody>
  <tfoot><tr><th scope="row">Total</th><td></td><th>${fmtEs(r.totalLoss, 1)} dB</th></tr></tfoot>
</table>`;
}

export function defaultResult() {
  return calculate(DEFAULT_INPUT);
}

const GLOSSARY = [
  ["FTTH", "fibra hasta el hogar. Es la red en la que la fibra óptica llega hasta la casa o el local del cliente."],
  ["GPON", "la tecnología de red óptica pasiva más usada en FTTH. Una sola fibra de la OLT se reparte entre varios clientes mediante splitters."],
  ["OLT", "el equipo de la central del proveedor que transmite y recibe la señal óptica de toda la red PON."],
  ["ONT / ONU", "el equipo en el domicilio del cliente que convierte la señal óptica en eléctrica."],
  ["Splitter PLC", "el divisor óptico pasivo que reparte la señal de una fibra en 2, 4, 8, 16, 32 o 64 salidas."],
  ["Presupuesto óptico (link budget)", "la pérdida máxima que un enlace puede tolerar entre la OLT y la ONT."],
  ["dBm", "la potencia óptica absoluta, referida a 1 mW. 0 dBm equivale a 1 mW."],
  ["dB", "la diferencia relativa entre dos potencias. Las pérdidas se expresan en dB."],
  ["Sensibilidad", "la potencia mínima que necesita la ONT para funcionar."],
  ["Saturación (overload)", "la potencia máxima que tolera la ONT antes de fallar por exceso de señal."],
  ["Clase B+ / C+", "las categorías de potencia de GPON que fijan el TX de la OLT y la sensibilidad de la ONT."],
  ["Empalme por fusión", "la unión de dos fibras fundiéndolas. Es el empalme de menor pérdida."],
  ["Empalme mecánico", "la unión de dos fibras alineadas con un dispositivo. Es más rápido, pero tiene más pérdida."],
  ["SC/APC", "el conector de pulido angular (verde), el estándar en FTTH."],
  ["OTDR", "el reflectómetro que mide pérdidas y ubica eventos a lo largo de la fibra."],
  ["Margen de seguridad", "los dB que se reservan para envejecimiento, reparaciones y tolerancias."],
];

/**
 * @param {string} path
 * @param {ReturnType<typeof calculate>} example
 */
export function pageBody(path, example) {
  if (path === "/") {
    return `
<p class="lead">Esta calculadora FTTH gratuita estima la pérdida total de un enlace de fibra óptica GPON y te dice si la potencia que llega a la ONT entra en rango. Cargás la clase óptica (B+, C+ o personalizada), la distancia, la longitud de onda, los splitters PLC, los empalmes y los conectores, y te devuelve la RX en el peor caso, el nominal y el mejor caso, el margen remanente, el riesgo de saturación y la distancia máxima. Funciona en el navegador, sin registro, y podés compartir cada cálculo con un link.</p>
${calculatorMarkup(example)}
<section class="card prose" id="ejemplo-resuelto">
  <h2>Ejemplo resuelto</h2>
  <p>Un enlace GPON clase B+ a 1490 nm, con 10 km de fibra, un splitter 1:32, 4 empalmes por fusión, 2 conectores SC/APC y 3 dB de margen.</p>
  ${workedExampleTable(example)}
  <p>Con un TX mínimo de 1,5 dBm, la potencia en la ONT en el peor caso es 1,5 − 23,6 = <strong>−22,1 dBm</strong>. Como la sensibilidad B+ es −27 dBm, quedan <strong>4,9 dB de margen remanente</strong>: el enlace entra en rango. En el mejor caso (TX 5 dBm, sin margen) llegan −15,6 dBm, lejos de la saturación de −8 dBm.</p>
</section>`;
  }

  if (path === "/como-calcular-presupuesto-optico") {
    return `
<p>El presupuesto óptico es la diferencia entre la potencia que emite la OLT y la sensibilidad mínima de la ONT, y el enlace funciona si la suma de todas las pérdidas no la supera. En la práctica se calcula en cuatro pasos.</p>
<h2>Paso 1: definí la clase óptica</h2>
<p>La clase fija la potencia de transmisión de la OLT y la sensibilidad y saturación de la ONT. Por ejemplo, en GPON clase B+ el TX va de 1,5 a 5 dBm, la sensibilidad es −27 dBm y la saturación −8 dBm. En clase C+ el TX va de 3 a 7 dBm y la sensibilidad es −30 dBm.</p>
<h2>Paso 2: sumá las pérdidas pasivas</h2>
<p>Pérdida total = (distancia × atenuación por km) + pérdida de splitters + (empalmes × pérdida por empalme) + (conectores × pérdida por conector) + margen de seguridad.</p>
<h2>Paso 3: calculá la potencia en la ONT</h2>
<p>RX peor caso = TX mínimo − pérdida total. RX mejor caso = TX máximo − pérdidas pasivas (sin el margen).</p>
<h2>Paso 4: verificá los dos límites</h2>
<ul>
  <li><strong>Margen remanente</strong> = RX peor caso − sensibilidad. Si da negativo, la señal no alcanza. Si da menos de 2 dB, el enlace queda justo.</li>
  <li><strong>Margen a saturación</strong> = saturación − RX mejor caso. Si da negativo, la ONT puede saturarse en enlaces cortos, y conviene agregar un atenuador.</li>
</ul>
<p>Mirá el <a href="/#ejemplo-resuelto">ejemplo resuelto</a> y usá la <a href="/#calculadora">calculadora</a> con tus datos.</p>`;
  }

  if (path === "/perdidas-tipicas") {
    const splitterRows = Object.entries(SPLITTERS)
      .map(([ratio, loss]) => `<tr><td>1:${ratio}</td><td>${fmtEs(loss, 1)} dB</td></tr>`)
      .join("");
    const wlRows = [
      [1310, "Subida"],
      [1490, "Bajada"],
      [1550, "Video RF"],
    ]
      .map(
        ([wl, uso]) =>
          `<tr><td>${wl} nm</td><td>${uso}</td><td>${fmtEs(WAVELENGTHS[String(wl)], 2)} dB/km</td></tr>`,
      )
      .join("");
    const b = CLASSES["B+"];
    const c = CLASSES["C+"];
    return `
<p>Estos son los valores de referencia que usa la calculadora por defecto. Son típicos de mercado, no garantías: verificá siempre con el datasheet de cada componente y con mediciones de OTDR o power meter.</p>
<h2>Splitters PLC</h2>
<table>
  <caption>Pérdida típica por relación de splitter PLC</caption>
  <thead><tr><th>Relación</th><th>Pérdida típica</th></tr></thead>
  <tbody>${splitterRows}</tbody>
</table>
<p>En cascada se suman: un 1:4 seguido de un 1:8 da 7,3 + 10,5 = 17,8 dB, apenas más que un 1:32 directo (17,1 dB).</p>
<h2>Atenuación de la fibra por longitud de onda</h2>
<table>
  <caption>Atenuación típica de la fibra por longitud de onda</caption>
  <thead><tr><th>Longitud de onda</th><th>Uso en GPON</th><th>Atenuación típica</th></tr></thead>
  <tbody>${wlRows}</tbody>
</table>
<h2>Empalmes y conectores</h2>
<table>
  <caption>Pérdida típica de empalmes y conectores</caption>
  <thead><tr><th>Elemento</th><th>Pérdida típica</th></tr></thead>
  <tbody>
    <tr><td>Empalme por fusión</td><td>0,1 dB</td></tr>
    <tr><td>Empalme mecánico</td><td>0,5 dB</td></tr>
    <tr><td>Conector SC/APC</td><td>0,3 dB</td></tr>
  </tbody>
</table>
<h2>Clases ópticas GPON (ITU-T G.984.2)</h2>
<table>
  <caption>Potencias de las clases ópticas GPON B+ y C+</caption>
  <thead><tr><th>Clase</th><th>TX OLT</th><th>Sensibilidad ONT</th><th>Saturación ONT</th></tr></thead>
  <tbody>
    <tr><td>B+</td><td>${fmtEs(b.txMin, 1)} a ${fmtEs(b.txMax, 0)} dBm</td><td>${fmtEs(b.sens, 0)} dBm</td><td>${fmtEs(b.overload, 0)} dBm</td></tr>
    <tr><td>C+</td><td>${fmtEs(c.txMin, 0)} a ${fmtEs(c.txMax, 0)} dBm</td><td>${fmtEs(c.sens, 0)} dBm</td><td>${fmtEs(c.overload, 0)} dBm</td></tr>
  </tbody>
</table>`;
  }

  if (path === "/glosario-ftth-gpon") {
    return GLOSSARY.map(([term, def]) => `<h3>${term}</h3><p>${def.charAt(0).toUpperCase() + def.slice(1)}</p>`).join(
      "\n",
    );
  }

  if (path === "/preguntas-frecuentes") {
    return FAQ_ITEMS.map((item) => `<h2>${item.q}</h2><p>${item.a}</p>`).join("\n");
  }

  if (path === "/acerca-de") {
    return `
<!-- TODO: Luciano decide si incluir crédito de autor en esta página -->
<p>La Calculadora FTTH es una herramienta gratuita en español para estimar el presupuesto óptico de redes GPON. Está pensada para técnicos, instaladores, ISP y estudiantes que necesitan verificar rápido si un enlace va a funcionar antes de salir a campo.</p>
<p><strong>Qué calcula:</strong> la pérdida por fibra, splitters PLC en varias etapas, empalmes y conectores, la RX en el peor caso, el nominal y el mejor caso, el margen remanente, el riesgo de saturación y la distancia máxima.</p>
<p><strong>De dónde salen los valores:</strong> las clases ópticas siguen la ITU-T G.984.2. El resto son valores típicos de mercado y se pueden editar.</p>
<p><strong>Privacidad:</strong> todo se calcula en tu navegador. No se guardan datos en ningún servidor; el estado queda solo en la URL que compartís.</p>
<p><strong>Limitaciones:</strong> es una estimación. Siempre verificá con los datasheets y con mediciones reales.</p>`;
  }

  return "";
}

/**
 * @param {ReturnType<typeof calculate>} r
 */
function calculatorMarkup(r) {
  const bar = r.items
    .filter((i) => i.loss > 0)
    .map(
      (i) =>
        `<div class="bar-seg bar-${i.key}" style="flex:${i.loss / r.totalLoss}" title="${escapeAttr(i.label)}: ${i.loss.toFixed(2)} dB"></div>`,
    )
    .join("");
  const rows = r.items
    .map(
      (i) =>
        `<tr><td><span class="dot dot-${i.key}"></span>${escapeHtml(i.label)}</td><td>${i.loss.toFixed(2)} dB</td></tr>`,
    )
    .join("");
  const reachHidden = r.exceedsTypicalReach ? "" : " hidden";
  const maxKm = Number.isFinite(r.maxDistance) ? r.maxDistance.toFixed(1) : "∞";
  return `
<div class="calc-layout" id="calculadora">
<form id="f" autocomplete="off" novalidate>
  <section class="card">
    <h2>OLT y clase óptica</h2>
    <label>Clase
      <select name="cls" id="cls">
        <option value="B+" selected>GPON Clase B+</option>
        <option value="C+">GPON Clase C+</option>
        <option value="custom">Personalizada</option>
      </select>
    </label>
    <div class="row">
      <label>TX mín (dBm)<input name="txMin" id="txMin" type="number" step="0.1" inputmode="decimal" value="1.5" required></label>
      <label>TX máx (dBm)<input name="txMax" id="txMax" type="number" step="0.1" inputmode="decimal" value="5" required></label>
    </div>
    <div class="row">
      <label>Sensibilidad ONT (dBm)<input name="sens" id="sens" type="number" step="0.1" inputmode="decimal" value="-27" required></label>
      <label>Saturación ONT (dBm)<input name="overload" id="overload" type="number" step="0.1" inputmode="decimal" value="-8" required></label>
    </div>
    <p class="field-error" id="txError" hidden></p>
  </section>
  <section class="card">
    <h2>Fibra</h2>
    <label>Longitud de onda
      <select name="wl" id="wl">
        <option value="1490" selected>1490 nm (bajada GPON)</option>
        <option value="1310">1310 nm (subida)</option>
        <option value="1550">1550 nm (video RF)</option>
      </select>
    </label>
    <div class="row">
      <label>Distancia (km)<input name="length" id="length" type="number" step="0.1" min="0" inputmode="decimal" value="10" required></label>
      <label>Atenuación (dB/km)<input name="attenuation" id="attenuation" type="number" step="0.01" min="0" inputmode="decimal" value="0.25" required></label>
    </div>
  </section>
  <section class="card">
    <h2>Splitters PLC</h2>
    <div id="splitters"></div>
    <button type="button" id="addSp" class="btn small">+ Agregar etapa</button>
  </section>
  <section class="card">
    <h2>Empalmes, conectores y margen</h2>
    <div class="loss-rows">
      <div class="loss-row">
        <span class="loss-name">Fusión</span>
        <label>Cantidad<input name="fusionCount" type="number" min="0" step="1" inputmode="numeric" value="4" aria-label="Empalmes por fusión"></label>
        <label>dB c/u<input name="fusionLoss" type="number" step="0.01" min="0" inputmode="decimal" value="0.1" aria-label="Pérdida por fusión"></label>
      </div>
      <div class="loss-row">
        <span class="loss-name">Mecánicos</span>
        <label>Cantidad<input name="mechCount" type="number" min="0" step="1" inputmode="numeric" value="0" aria-label="Empalmes mecánicos"></label>
        <label>dB c/u<input name="mechLoss" type="number" step="0.01" min="0" inputmode="decimal" value="0.5" aria-label="Pérdida mecánico"></label>
      </div>
      <div class="loss-row">
        <span class="loss-name">Conectores SC/APC</span>
        <label>Cantidad<input name="connCount" type="number" min="0" step="1" inputmode="numeric" value="2" aria-label="Conectores"></label>
        <label>dB c/u<input name="connLoss" type="number" step="0.01" min="0" inputmode="decimal" value="0.3" aria-label="Pérdida conector"></label>
      </div>
    </div>
    <label>Margen de seguridad / envejecimiento (dB)<input name="margin" type="number" step="0.1" min="0" inputmode="decimal" value="3"></label>
  </section>
</form>
<aside id="out">
  <section class="card verdict v-ok" id="verdict" aria-live="polite">
    <div class="tag">✅ OK</div>
    <div class="big">${r.rxMin.toFixed(2)} dBm</div>
    <div>Potencia RX estimada en la ONT (peor caso)</div>
    <p class="note">La potencia en la ONT entra en rango con margen.</p>
  </section>
  <p class="reach-warn"${reachHidden} id="reachWarn" role="status">La distancia máxima calculada (${maxKm} km) supera el alcance físico típico de GPON (20 km). Verificá si tu red y equipos soportan esa distancia.</p>
  <section class="card stats" id="stats">
    <div>Pérdida total<b>${r.totalLoss.toFixed(2)} dB</b></div>
    <div>Margen remanente<b>${r.remaining.toFixed(2)} dB</b></div>
    <div>RX nominal<b>${r.rxNominal.toFixed(2)} dBm</b></div>
    <div>RX mejor caso<b>${r.rxMax.toFixed(2)} dBm</b></div>
    <div>Distancia máx.<b>${maxKm} km</b></div>
    <div>Margen a saturación<b>${r.overloadMargin.toFixed(2)} dB</b></div>
  </section>
  <section class="card">
    <h2>Desglose de pérdidas</h2>
    <div id="bar" class="bar" role="img" aria-label="Distribución de pérdidas">${bar}</div>
    <div class="table-wrap">
      <table>
        <caption class="sr-only">Desglose de pérdidas ópticas</caption>
        <thead><tr><th>Elemento</th><th>Pérdida</th></tr></thead>
        <tbody id="tbl">${rows}</tbody>
        <tfoot><tr class="total"><th scope="row">Total</th><td>${r.totalLoss.toFixed(2)} dB</td></tr></tfoot>
      </table>
    </div>
  </section>
  <section class="card note"><strong>⚠️ Valores típicos.</strong> Los valores por defecto (potencias por clase según ITU-T G.984, atenuaciones, pérdidas de splitters, empalmes y conectores) son <em>típicos de referencia</em>. Verificalos siempre contra los datasheets de tu OLT, ONT, SFP, splitters y cable, y contra mediciones reales con OTDR / power meter. El "peor caso" usa TX mínimo e incluye el margen; la saturación se evalúa con TX máximo sin margen.</section>
</aside>
</div>`;
}

/** @param {string} s */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
}

/** @param {string} s */
function escapeAttr(s) {
  return escapeHtml(s).replace(/\n/g, " ");
}
