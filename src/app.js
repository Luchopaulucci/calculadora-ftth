import { track } from "@vercel/analytics";
import { CLASSES, WAVELENGTHS, SPLITTERS, MARGINAL_DB, TYPICAL_GPON_REACH_KM, calculate } from "./calc.js";
import { fmt } from "./format.js";
import { pulseVerdict } from "./animations.js";
import "./ui.js";

/** @type {HTMLFormElement} */
const f = (() => {
  const el = document.getElementById("f");
  if (!(el instanceof HTMLFormElement)) throw new Error("No se encontró el formulario de la calculadora");
  return el;
})();

/** @param {string} id */
const $ = (id) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`No se encontró #${id}`);
  return el;
};

const DEFAULTS = {
  cls: "B+",
  ...CLASSES["B+"],
  wl: "1490",
  attenuation: 0.25,
  length: 10,
  fusionCount: 4,
  fusionLoss: 0.1,
  mechCount: 0,
  mechLoss: 0.5,
  connCount: 2,
  connLoss: 0.3,
  margin: 3,
  sp: "32:17.1",
};
const FIELDS = Object.keys(DEFAULTS).filter((k) => k !== "sp");

/** @param {string} s */
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
}

/**
 * @param {string|number} [ratio]
 * @param {unknown} [loss]
 */
function addSplitter(ratio = 8, loss = SPLITTERS[/** @type {keyof typeof SPLITTERS} */ (String(ratio))]) {
  const key = String(ratio);
  const numericLoss = Number(loss);
  const lossVal = Number.isFinite(numericLoss) && numericLoss >= 0 ? numericLoss : SPLITTERS[/** @type {keyof typeof SPLITTERS} */ (key)] ?? SPLITTERS[8];

  const el = document.createElement("div");
  el.className = "sp";

  const labR = document.createElement("label");
  labR.append("Relación");
  const sel = document.createElement("select");
  sel.setAttribute("aria-label", "Relación del splitter");
  for (const r of Object.keys(SPLITTERS)) {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = "1:" + r;
    if (r === key) opt.selected = true;
    sel.append(opt);
  }
  labR.append(sel);

  const labL = document.createElement("label");
  labL.append("Pérdida (dB)");
  const inp = document.createElement("input");
  inp.type = "number";
  inp.step = "0.1";
  inp.min = "0";
  inp.inputMode = "decimal";
  inp.value = String(lossVal);
  inp.setAttribute("aria-label", "Pérdida del splitter en dB");
  labL.append(inp);

  const del = document.createElement("button");
  del.type = "button";
  del.className = "btn";
  del.title = "Quitar";
  del.setAttribute("aria-label", "Quitar etapa de splitter");
  del.textContent = "✕";

  sel.addEventListener("change", () => {
    const next = SPLITTERS[/** @type {keyof typeof SPLITTERS} */ (sel.value)];
    if (next != null) inp.value = String(next);
    scheduleUpdate();
  });
  inp.addEventListener("input", scheduleUpdate);
  del.addEventListener("click", () => {
    el.remove();
    scheduleUpdate();
  });

  el.append(labR, labL, del);
  $("splitters").append(el);
}

const readSplitters = () =>
  [...$("splitters").children].map((el) => {
    const sel = el.querySelector("select");
    const inp = el.querySelector("input");
    return { ratio: Number(sel && "value" in sel ? sel.value : 0), loss: Number(inp && "value" in inp ? inp.value : 0) };
  });

/** @param {URLSearchParams} params */
function load(params) {
  const st = { ...DEFAULTS };
  for (const k of Object.keys(DEFAULTS)) {
    if (params.has(k)) {
      const got = params.get(k);
      if (got != null) st[/** @type {keyof typeof DEFAULTS} */ (k)] = /** @type {never} */ (got);
    }
  }
  FIELDS.forEach((k) => {
    const field = f.elements.namedItem(k);
    if (field && "value" in field) field.value = String(st[/** @type {keyof typeof DEFAULTS} */ (k)]);
  });
  $("splitters").innerHTML = "";
  const stages = String(st.sp)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (stages.length === 0 && !params.has("sp")) addSplitter(32, SPLITTERS[32]);
  else {
    stages.forEach((s) => {
      const [rawRatio, rawLoss] = s.split(":");
      const ratio = rawRatio;
      if (!(ratio in SPLITTERS)) return;
      const parsed = rawLoss === undefined || rawLoss === "" ? NaN : Number(rawLoss);
      addSplitter(ratio, Number.isFinite(parsed) ? parsed : SPLITTERS[/** @type {keyof typeof SPLITTERS} */ (ratio)]);
    });
  }
}

function state() {
  const p = new URLSearchParams();
  FIELDS.forEach((k) => {
    const field = f.elements.namedItem(k);
    if (field && "value" in field) p.set(k, field.value);
  });
  p.set("sp", readSplitters().map((s) => `${s.ratio}:${s.loss}`).join(","));
  return p;
}

const VERDICTS = {
  ok: ["✅ OK", "La potencia en la ONT entra en rango con margen."],
  marginal: ["⚠️ Justo", `Entra en rango, pero quedan menos de ${MARGINAL_DB} dB de margen remanente.`],
  low: ["❌ Fuera de rango: debajo de la sensibilidad", "La señal no llega con potencia suficiente. Reducí pérdidas o distancia, o pasá a clase C+."],
  overload: ["❌ Fuera de rango: saturación", "Demasiada potencia en el mejor caso. Agregá un atenuador o más división."],
};

/** @param {string} name */
function fieldValue(name) {
  const field = f.elements.namedItem(name);
  return field && "value" in field ? field.value : "";
}

function validate() {
  const txMin = Number(fieldValue("txMin"));
  const txMax = Number(fieldValue("txMax"));
  const err = $("txError");
  if (Number.isFinite(txMin) && Number.isFinite(txMax) && txMin > txMax) {
    err.hidden = false;
    err.textContent = "TX mín es mayor que TX máx: el peor caso usa el menor de los dos.";
  } else {
    err.hidden = true;
    err.textContent = "";
  }
}

/**
 * @param {string} name
 * @param {number} fallback
 */
function numOrDefault(name, fallback) {
  const raw = fieldValue(name);
  if (raw === "") return fallback;
  const x = Number(raw);
  return Number.isFinite(x) ? x : fallback;
}

function update() {
  validate();
  const v = {
    cls: fieldValue("cls"),
    wl: fieldValue("wl"),
    txMin: numOrDefault("txMin", DEFAULTS.txMin),
    txMax: numOrDefault("txMax", DEFAULTS.txMax),
    sens: numOrDefault("sens", DEFAULTS.sens),
    overload: numOrDefault("overload", DEFAULTS.overload),
    attenuation: numOrDefault("attenuation", DEFAULTS.attenuation),
    length: numOrDefault("length", DEFAULTS.length),
    fusionCount: numOrDefault("fusionCount", DEFAULTS.fusionCount),
    fusionLoss: numOrDefault("fusionLoss", DEFAULTS.fusionLoss),
    mechCount: numOrDefault("mechCount", DEFAULTS.mechCount),
    mechLoss: numOrDefault("mechLoss", DEFAULTS.mechLoss),
    connCount: numOrDefault("connCount", DEFAULTS.connCount),
    connLoss: numOrDefault("connLoss", DEFAULTS.connLoss),
    margin: numOrDefault("margin", DEFAULTS.margin),
  };
  const r = calculate({ ...v, splitters: readSplitters() });
  const pair = VERDICTS[r.verdict];
  const tag = pair[0];
  const desc = pair[1];
  const verdict = $("verdict");
  const nextClass = `card verdict v-${r.verdict}`;
  const classChanged = verdict.className !== nextClass;
  verdict.className = nextClass;
  verdict.innerHTML = `<div class="tag">${tag}</div><div class="big">${fmt(r.rxMin)} dBm</div><div>Potencia RX estimada en la ONT (peor caso)</div><p class="note">${esc(desc)}</p>`;
  if (classChanged) pulseVerdict(verdict);
  $("stats").innerHTML = [
    ["Pérdida total", fmt(r.totalLoss) + " dB"],
    ["Margen remanente", fmt(r.remaining) + " dB"],
    ["RX nominal", fmt(r.rxNominal) + " dBm"],
    ["RX mejor caso", fmt(r.rxMax) + " dBm"],
    ["Distancia máx.", fmt(r.maxDistance, 1) + " km"],
    ["Margen a saturación", fmt(r.overloadMargin) + " dB"],
  ]
    .map(([a, b]) => `<div>${a}<b>${b}</b></div>`)
    .join("");
  const tot = r.totalLoss || 1;
  $("bar").innerHTML = r.items
    .filter((i) => i.loss > 0)
    .map((i) => `<div class="bar-seg bar-${i.key}" style="flex:${i.loss / tot}" title="${esc(i.label)}: ${fmt(i.loss)} dB"></div>`)
    .join("");
  $("tbl").innerHTML = r.items
    .map((i) => `<tr><td><span class="dot dot-${i.key}"></span>${esc(i.label)}</td><td>${fmt(i.loss)} dB</td></tr>`)
    .join("");
  const tfoot = $("tbl").parentElement?.querySelector("tfoot td");
  if (tfoot) tfoot.textContent = `${fmt(r.totalLoss)} dB`;
  const warn = $("reachWarn");
  const maxKm = fmt(r.maxDistance, 1);
  warn.hidden = !r.exceedsTypicalReach;
  warn.textContent = `La distancia máxima calculada (${maxKm} km) supera el alcance físico típico de GPON (${TYPICAL_GPON_REACH_KM} km). Verificá si tu red y equipos soportan esa distancia.`;
  if (syncUrl) history.replaceState(null, "", "?" + state());
}

let syncUrl = new URLSearchParams(location.search).toString().length > 0;
let updateTimer = 0;
function scheduleUpdate() {
  syncUrl = true;
  if (updateTimer) cancelAnimationFrame(updateTimer);
  updateTimer = requestAnimationFrame(() => update());
}

f.addEventListener("submit", (e) => e.preventDefault());
f.addEventListener("input", (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  const name = "name" in t ? String(t.name) : "";
  if (name === "cls" && t instanceof HTMLSelectElement && CLASSES[/** @type {keyof typeof CLASSES} */ (t.value)]) {
    Object.entries(CLASSES[/** @type {keyof typeof CLASSES} */ (t.value)]).forEach(([k, x]) => {
      const field = f.elements.namedItem(k);
      if (field && "value" in field) field.value = String(x);
    });
  } else if (["txMin", "txMax", "sens", "overload"].includes(name)) {
    const field = f.elements.namedItem("cls");
    if (field && "value" in field) field.value = "custom";
  }
  if (name === "wl" && t instanceof HTMLSelectElement) {
    const att = WAVELENGTHS[/** @type {keyof typeof WAVELENGTHS} */ (t.value)];
    const field = f.elements.namedItem("attenuation");
    if (att != null && field && "value" in field) field.value = String(att);
  }
  scheduleUpdate();
});

$("addSp").addEventListener("click", () => {
  addSplitter();
  scheduleUpdate();
});
$("reset").addEventListener("click", () => {
  load(new URLSearchParams());
  syncUrl = false;
  history.replaceState(null, "", location.pathname);
  update();
});

async function copyLink() {
  syncUrl = true;
  history.replaceState(null, "", "?" + state());
  const url = location.href;
  try {
    await navigator.clipboard.writeText(url);
    toast("¡Link copiado!");
    return;
  } catch {
    /* fallback */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = url;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    toast(ok ? "¡Link copiado!" : "No se pudo copiar el link");
  } catch {
    toast("No se pudo copiar el link");
  }
}

/** @param {string} text */
function toast(text) {
  const t = document.createElement("div");
  t.className = "toast";
  t.setAttribute("role", "status");
  t.textContent = text;
  document.body.append(t);
  setTimeout(() => t.remove(), 1500);
}

$("share").addEventListener("click", () => {
  try {
    track("copiar_link");
  } catch {
    /* Hobby / script ausente: el copy sigue igual */
  }
  copyLink();
});

load(new URLSearchParams(location.search));
update();
