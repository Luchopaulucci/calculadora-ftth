import { CLASSES, WAVELENGTHS, SPLITTERS, MARGINAL_DB, calculate } from "./calc.js";
const f = document.getElementById("f"), $ = id => document.getElementById(id);
const COLORS = { fiber: "#22d3ee", splitters: "#a78bfa", fusion: "#34d399", mech: "#fbbf24", conn: "#f472b6", margin: "#94a3b8" };
const DEFAULTS = { cls: "B+", ...CLASSES["B+"], wl: "1490", attenuation: 0.25, length: 10, fusionCount: 4, fusionLoss: 0.1, mechCount: 0, mechLoss: 0.5, connCount: 2, connLoss: 0.3, margin: 3, sp: "32:17.1" };
const FIELDS = Object.keys(DEFAULTS).filter(k => k !== "sp");
const fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : "∞");

function addSplitter(ratio = 8, loss = SPLITTERS[ratio]) {
  const el = document.createElement("div"); el.className = "sp";
  el.innerHTML = `<label>Relación<select>${Object.keys(SPLITTERS).map(r => `<option value="${r}"${+r === +ratio ? " selected" : ""}>1:${r}</option>`).join("")}</select></label>
    <label>Pérdida (dB)<input type="number" step="0.1" min="0" value="${loss}"></label><button type="button" class="btn" title="Quitar">✕</button>`;
  const [sel, inp, del] = [el.querySelector("select"), el.querySelector("input"), el.querySelector("button")];
  sel.onchange = () => { inp.value = SPLITTERS[sel.value]; update(); };
  inp.oninput = update; del.onclick = () => { el.remove(); update(); };
  $("splitters").append(el);
}
const readSplitters = () => [...$("splitters").children].map(el => ({ ratio: +el.querySelector("select").value, loss: +el.querySelector("input").value }));

function load(params) {
  const st = { ...DEFAULTS }; for (const k of Object.keys(DEFAULTS)) if (params.has(k)) st[k] = params.get(k);
  FIELDS.forEach(k => (f.elements.namedItem(k).value = st[k]));
  $("splitters").innerHTML = "";
  String(st.sp).split(",").filter(Boolean).forEach(s => { const [r, l] = s.split(":"); if (SPLITTERS[r]) addSplitter(r, l ?? SPLITTERS[r]); });
}
function state() { const p = new URLSearchParams(); FIELDS.forEach(k => p.set(k, f.elements.namedItem(k).value)); p.set("sp", readSplitters().map(s => `${s.ratio}:${s.loss}`).join(",")); return p; }

const VERDICTS = {
  ok: ["✅ OK", "La potencia en la ONT entra en rango con margen."],
  marginal: ["⚠️ Justo", `Entra en rango, pero quedan menos de ${MARGINAL_DB} dB de margen remanente.`],
  low: ["❌ Fuera de rango: debajo de la sensibilidad", "La señal no llega con potencia suficiente. Reducí pérdidas o distancia, o pasá a clase C+."],
  overload: ["❌ Fuera de rango: saturación", "Demasiada potencia en el mejor caso. Agregá un atenuador o más división."],
};
function update() {
  const v = Object.fromEntries(FIELDS.map(k => [k, f.elements.namedItem(k).value]));
  const r = calculate({ ...v, splitters: readSplitters() });
  const [tag, desc] = VERDICTS[r.verdict];
  $("verdict").className = `card verdict v-${r.verdict}`;
  $("verdict").innerHTML = `<div class="tag">${tag}</div><div class="big">${fmt(r.rxMin)} dBm</div><div>Potencia RX estimada en la ONT (peor caso)</div><p class="note">${desc}</p>`;
  $("stats").innerHTML = [["Pérdida total", fmt(r.totalLoss) + " dB"], ["Margen remanente", fmt(r.remaining) + " dB"], ["RX nominal", fmt(r.rxNominal) + " dBm"], ["RX mejor caso", fmt(r.rxMax) + " dBm"], ["Distancia máx.", fmt(r.maxDistance, 1) + " km"], ["Margen a saturación", fmt(r.overloadMargin) + " dB"]].map(([a, b]) => `<div>${a}<b>${b}</b></div>`).join("");
  const tot = r.totalLoss || 1;
  $("bar").innerHTML = r.items.filter(i => i.loss > 0).map(i => `<div style="flex:${i.loss / tot};background:${COLORS[i.key]}" title="${i.label}: ${fmt(i.loss)} dB"></div>`).join("");
  $("tbl").innerHTML = r.items.map(i => `<tr><td><span class="dot" style="background:${COLORS[i.key]}"></span>${i.label}</td><td>${fmt(i.loss)} dB</td></tr>`).join("") + `<tr class="total"><td>Total</td><td>${fmt(r.totalLoss)} dB</td></tr>`;
  history.replaceState(null, "", "?" + state());
}

f.addEventListener("input", e => {
  const n = e.target.name;
  if (n === "cls" && CLASSES[e.target.value]) Object.entries(CLASSES[e.target.value]).forEach(([k, x]) => (f.elements.namedItem(k).value = x));
  else if (["txMin", "txMax", "sens", "overload"].includes(n)) f.elements.namedItem("cls").value = "custom";
  if (n === "wl") f.elements.namedItem("attenuation").value = WAVELENGTHS[e.target.value];
  update();
});
$("addSp").onclick = () => { addSplitter(); update(); };
$("reset").onclick = () => { load(new URLSearchParams()); update(); };
$("theme").onclick = () => { const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = t; localStorage.theme = t; };
$("share").onclick = async () => { try { await navigator.clipboard.writeText(location.href); } catch {} const t = Object.assign(document.createElement("div"), { className: "toast", textContent: "¡Link copiado!" }); document.body.append(t); setTimeout(() => t.remove(), 1500); };
load(new URLSearchParams(location.search)); update();
