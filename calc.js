// Lógica de cálculo de presupuesto óptico FTTH (valores TÍPICOS, verificar con datasheets).
export const CLASSES = {
  "B+": { txMin: 1.5, txMax: 5, sens: -27, overload: -8 },
  "C+": { txMin: 3, txMax: 7, sens: -30, overload: -8 },
};
export const WAVELENGTHS = { 1310: 0.35, 1490: 0.25, 1550: 0.22 };
export const SPLITTERS = { 2: 3.7, 4: 7.3, 8: 10.5, 16: 13.7, 32: 17.1, 64: 20.5 };
export const MARGINAL_DB = 2; // margen remanente por debajo del cual se considera "justo"

const n = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

export function calculate(p) {
  const att = n(p.attenuation), len = Math.max(0, n(p.length));
  const splitters = (p.splitters || []).map(s => ({ ratio: s.ratio, loss: n(s.loss) }));
  const items = [
    { key: "fiber", label: `Fibra (${len} km × ${att} dB/km)`, loss: len * att },
    { key: "splitters", label: `Splitters (${splitters.map(s => "1:" + s.ratio).join(" + ") || "ninguno"})`, loss: splitters.reduce((a, s) => a + s.loss, 0) },
    { key: "fusion", label: `Empalmes por fusión (${n(p.fusionCount)} × ${n(p.fusionLoss)} dB)`, loss: n(p.fusionCount) * n(p.fusionLoss) },
    { key: "mech", label: `Empalmes mecánicos (${n(p.mechCount)} × ${n(p.mechLoss)} dB)`, loss: n(p.mechCount) * n(p.mechLoss) },
    { key: "conn", label: `Conectores (${n(p.connCount)} × ${n(p.connLoss)} dB)`, loss: n(p.connCount) * n(p.connLoss) },
    { key: "margin", label: "Margen de seguridad / envejecimiento", loss: n(p.margin) },
  ];
  const totalLoss = items.reduce((a, i) => a + i.loss, 0);
  const passiveLoss = totalLoss - n(p.margin);
  const txMin = n(p.txMin), txMax = n(p.txMax);
  const rxMin = txMin - totalLoss;          // peor caso (incluye margen)
  const rxMax = txMax - passiveLoss;        // mejor caso, sin margen (riesgo de saturación)
  const rxNominal = (txMin + txMax) / 2 - passiveLoss;
  const remaining = rxMin - n(p.sens);
  const overloadMargin = n(p.overload) - rxMax;
  let verdict;
  if (remaining < 0) verdict = "low";
  else if (overloadMargin < 0) verdict = "overload";
  else if (remaining < MARGINAL_DB) verdict = "marginal";
  else verdict = "ok";
  const nonFiber = totalLoss - len * att;
  const maxDistance = att > 0 ? Math.max(0, (txMin - n(p.sens) - nonFiber) / att) : Infinity;
  return { items, totalLoss, passiveLoss, rxMin, rxMax, rxNominal, remaining, overloadMargin, verdict, maxDistance };
}
