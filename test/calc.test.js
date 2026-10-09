import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculate,
  DEFAULT_INPUT,
  TYPICAL_GPON_REACH_KM,
} from "../src/calc.js";
import { SEO_EXAMPLE } from "../src/content.js";

const base = { ...DEFAULT_INPUT };
/** @param {number} a @param {number} b */
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test("pérdida total", () => {
  const r = calculate(base);
  close(r.totalLoss, 2.5 + 17.1 + 0.4 + 0.6 + 3);
});

test("potencia RX peor caso y margen", () => {
  const r = calculate(base);
  close(r.rxMin, 1.5 - 23.6);
  close(r.remaining, -22.1 + 27);
  assert.equal(r.verdict, "ok");
});

test("distancia máxima", () => {
  const r = calculate(base);
  close(r.maxDistance, (1.5 + 27 - 21.1) / 0.25);
});

test("debajo de sensibilidad", () => {
  assert.equal(calculate({ ...base, splitters: [{ ratio: 64, loss: 20.5 }, { ratio: 2, loss: 3.7 }] }).verdict, "low");
});

test("marginal", () => {
  assert.equal(calculate({ ...base, length: 26 }).verdict, "marginal");
});

test("saturación", () => {
  assert.equal(calculate({ ...base, txMax: 7, splitters: [], length: 0.1, connCount: 0, fusionCount: 0 }).verdict, "overload");
});

test("valores inválidos no rompen", () => {
  const r = calculate({ ...base, length: "abc", splitters: [] });
  assert.ok(Number.isFinite(r.totalLoss));
});

test("ejemplo SEO: 1:32, 10 km, clase B+ → −22.1 dBm y 4.9 dB de margen", () => {
  const r = calculate(DEFAULT_INPUT);
  close(r.rxMin, SEO_EXAMPLE.rxMin);
  close(r.remaining, SEO_EXAMPLE.remaining);
  close(r.totalLoss, SEO_EXAMPLE.totalLoss);
  close(r.rxMax, SEO_EXAMPLE.rxMax);
  close(r.items.find((i) => i.key === "fiber")?.loss ?? NaN, SEO_EXAMPLE.fiber);
  close(r.items.find((i) => i.key === "splitters")?.loss ?? NaN, SEO_EXAMPLE.splitter);
  close(r.items.find((i) => i.key === "fusion")?.loss ?? NaN, SEO_EXAMPLE.fusion);
  close(r.items.find((i) => i.key === "conn")?.loss ?? NaN, SEO_EXAMPLE.conn);
  close(r.items.find((i) => i.key === "margin")?.loss ?? NaN, SEO_EXAMPLE.margin);
});

test("distancia máxima por defecto supera 20 km y marca el aviso", () => {
  const r = calculate(DEFAULT_INPUT);
  close(r.maxDistance, 29.6);
  assert.equal(r.exceedsTypicalReach, true);
  assert.ok(r.maxDistance > TYPICAL_GPON_REACH_KM);
});

test("aviso de alcance oculto si la distancia máxima cabe en 20 km", () => {
  const r = calculate({ ...DEFAULT_INPUT, splitters: [{ ratio: 64, loss: 20.5 }] });
  assert.ok(r.maxDistance <= TYPICAL_GPON_REACH_KM);
  assert.equal(r.exceedsTypicalReach, false);
});

test("cantidades y pérdidas negativas no restan del presupuesto", () => {
  const r = calculate({
    ...base,
    fusionCount: -8,
    fusionLoss: -1,
    mechCount: -2,
    connCount: -3,
    connLoss: -0.5,
    length: -10,
    attenuation: -0.25,
    margin: -5,
    splitters: [{ ratio: 32, loss: -17.1 }],
  });
  assert.equal(r.items.find((i) => i.key === "fusion")?.loss, 0);
  assert.equal(r.items.find((i) => i.key === "fiber")?.loss, 0);
  assert.equal(r.items.find((i) => i.key === "splitters")?.loss, 0);
  assert.equal(r.items.find((i) => i.key === "margin")?.loss, 0);
  assert.ok(r.totalLoss >= 0);
});

test("si TX mín y máx vienen invertidos, el peor caso usa el menor", () => {
  const r = calculate({ ...base, txMin: 5, txMax: 1.5 });
  const normal = calculate(base);
  close(r.rxMin, normal.rxMin);
  close(r.rxMax, normal.rxMax);
});

test("atenuación 0 con presupuesto ya agotado da distancia máxima 0", () => {
  const r = calculate({
    ...base,
    attenuation: 0,
    length: 0,
    splitters: [{ ratio: 64, loss: 40 }],
    margin: 10,
  });
  assert.equal(r.maxDistance, 0);
  assert.equal(r.exceedsTypicalReach, false);
});

test("atenuación 0 con presupuesto sobrante da distancia infinita", () => {
  const r = calculate({ ...base, attenuation: 0, length: 0 });
  assert.equal(r.maxDistance, Infinity);
  assert.equal(r.exceedsTypicalReach, true);
});
