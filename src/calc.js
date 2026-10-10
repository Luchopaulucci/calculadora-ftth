// Lógica de cálculo de presupuesto óptico FTTH (valores TÍPICOS, verificar con datasheets).

export const CLASSES = {
  "B+": { txMin: 1.5, txMax: 5, sens: -27, overload: -8 },
  "C+": { txMin: 3, txMax: 7, sens: -30, overload: -8 },
};

/** @type {Record<string, number>} */
export const WAVELENGTHS = { 1310: 0.35, 1490: 0.25, 1550: 0.22 };
/** @type {Record<string, number>} */
export const SPLITTERS = { 2: 3.7, 4: 7.3, 8: 10.5, 16: 13.7, 32: 17.1, 64: 20.5 };
export const MARGINAL_DB = 2;
/** Alcance físico típico de GPON (km). No es un límite duro de la herramienta. */
export const TYPICAL_GPON_REACH_KM = 20;

/** Entrada por defecto de la calculadora (clase B+, 1490 nm, 1:32, 10 km). */
export const DEFAULT_INPUT = {
  txMin: 1.5,
  txMax: 5,
  attenuation: 0.25,
  length: 10,
  splitters: [{ ratio: 32, loss: 17.1 }],
  fusionCount: 4,
  fusionLoss: 0.1,
  mechCount: 0,
  mechLoss: 0.5,
  connCount: 2,
  connLoss: 0.3,
  margin: 3,
  sens: -27,
  overload: -8,
};

/**
 * @param {unknown} v
 * @param {number} [d=0]
 * @returns {number}
 */
export function n(v, d = 0) {
  if (v === "" || v == null) return d;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : d;
}

/**
 * @param {unknown} v
 * @param {number} [d=0]
 * @returns {number}
 */
export function nonNeg(v, d = 0) {
  return Math.max(0, n(v, d));
}

/**
 * @param {unknown} v
 * @param {number} [d=0]
 * @returns {number}
 */
export function intCount(v, d = 0) {
  return Math.max(0, Math.round(n(v, d)));
}

/**
 * @param {number} x
 * @returns {number}
 */
function round6(x) {
  if (!Number.isFinite(x)) return x;
  return Math.round(x * 1e6) / 1e6;
}

/**
 * @typedef {object} SplitterInput
 * @property {unknown} [ratio]
 * @property {unknown} [loss]
 *
 * @typedef {object} CalcInput
 * @property {unknown} [attenuation]
 * @property {unknown} [length]
 * @property {SplitterInput[]} [splitters]
 * @property {unknown} [fusionCount]
 * @property {unknown} [fusionLoss]
 * @property {unknown} [mechCount]
 * @property {unknown} [mechLoss]
 * @property {unknown} [connCount]
 * @property {unknown} [connLoss]
 * @property {unknown} [margin]
 * @property {unknown} [txMin]
 * @property {unknown} [txMax]
 * @property {unknown} [sens]
 * @property {unknown} [overload]
 *
 * @typedef {object} LossItem
 * @property {string} key
 * @property {string} label
 * @property {number} loss
 *
 * @typedef {object} CalcResult
 * @property {LossItem[]} items
 * @property {number} totalLoss
 * @property {number} passiveLoss
 * @property {number} rxMin
 * @property {number} rxMax
 * @property {number} rxNominal
 * @property {number} remaining
 * @property {number} overloadMargin
 * @property {"ok"|"marginal"|"low"|"overload"} verdict
 * @property {number} maxDistance
 * @property {boolean} exceedsTypicalReach
 */

/**
 * @param {CalcInput} p
 * @returns {CalcResult}
 */
export function calculate(p) {
  const att = nonNeg(p.attenuation);
  const len = nonNeg(p.length);
  const splitters = (p.splitters || [])
    .map((s) => ({ ratio: n(s.ratio), loss: nonNeg(s.loss) }))
    .filter((s) => s.ratio > 0);
  const fusionCount = intCount(p.fusionCount);
  const fusionLoss = nonNeg(p.fusionLoss);
  const mechCount = intCount(p.mechCount);
  const mechLoss = nonNeg(p.mechLoss);
  const connCount = intCount(p.connCount);
  const connLoss = nonNeg(p.connLoss);
  const margin = nonNeg(p.margin);

  const items = [
    { key: "fiber", label: `Fibra (${len} km × ${att} dB/km)`, loss: round6(len * att) },
    {
      key: "splitters",
      label: `Splitters (${splitters.map((s) => "1:" + s.ratio).join(" + ") || "ninguno"})`,
      loss: round6(splitters.reduce((a, s) => a + s.loss, 0)),
    },
    { key: "fusion", label: `Empalmes por fusión (${fusionCount} × ${fusionLoss} dB)`, loss: round6(fusionCount * fusionLoss) },
    { key: "mech", label: `Empalmes mecánicos (${mechCount} × ${mechLoss} dB)`, loss: round6(mechCount * mechLoss) },
    { key: "conn", label: `Conectores (${connCount} × ${connLoss} dB)`, loss: round6(connCount * connLoss) },
    { key: "margin", label: "Margen de seguridad / envejecimiento", loss: round6(margin) },
  ];
  const totalLoss = round6(items.reduce((a, i) => a + i.loss, 0));
  const passiveLoss = round6(totalLoss - margin);
  const txA = n(p.txMin);
  const txB = n(p.txMax);
  const txLo = Math.min(txA, txB);
  const txHi = Math.max(txA, txB);
  const rxMin = round6(txLo - totalLoss);
  const rxMax = round6(txHi - passiveLoss);
  const rxNominal = round6((txLo + txHi) / 2 - passiveLoss);
  const sens = n(p.sens);
  const overload = n(p.overload);
  const remaining = round6(rxMin - sens);
  const overloadMargin = round6(overload - rxMax);
  /** @type {CalcResult["verdict"]} */
  let verdict;
  if (remaining < 0) verdict = "low";
  else if (overloadMargin < 0) verdict = "overload";
  else if (remaining < MARGINAL_DB) verdict = "marginal";
  else verdict = "ok";
  const nonFiber = round6(totalLoss - items[0].loss);
  const budgetForFiber = txLo - sens - nonFiber;
  let maxDistance;
  if (budgetForFiber < 0) maxDistance = 0;
  else if (att > 0) maxDistance = round6(budgetForFiber / att);
  else maxDistance = Infinity;
  const exceedsTypicalReach = maxDistance > TYPICAL_GPON_REACH_KM;
  return {
    items,
    totalLoss,
    passiveLoss,
    rxMin,
    rxMax,
    rxNominal,
    remaining,
    overloadMargin,
    verdict,
    maxDistance,
    exceedsTypicalReach,
  };
}
