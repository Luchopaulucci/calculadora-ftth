import { test } from "node:test";
import assert from "node:assert/strict";
import { calculate } from "../calc.js";
const base = { txMin: 1.5, txMax: 5, attenuation: 0.25, length: 10, splitters: [{ ratio: 32, loss: 17.1 }],
  fusionCount: 4, fusionLoss: 0.1, mechCount: 0, mechLoss: 0.5, connCount: 2, connLoss: 0.3, margin: 3, sens: -27, overload: -8 };
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
test("pérdida total", () => { const r = calculate(base); close(r.totalLoss, 2.5 + 17.1 + 0.4 + 0.6 + 3); });
test("potencia RX peor caso y margen", () => { const r = calculate(base); close(r.rxMin, 1.5 - 23.6); close(r.remaining, -22.1 + 27); assert.equal(r.verdict, "ok"); });
test("distancia máxima", () => { const r = calculate(base); close(r.maxDistance, (1.5 + 27 - 21.1) / 0.25); });
test("debajo de sensibilidad", () => { assert.equal(calculate({ ...base, splitters: [{ ratio: 64, loss: 20.5 }, { ratio: 2, loss: 3.7 }] }).verdict, "low"); });
test("marginal", () => { assert.equal(calculate({ ...base, length: 26 }).verdict, "marginal"); });
test("saturación", () => { assert.equal(calculate({ ...base, txMax: 7, splitters: [], length: 0.1, connCount: 0, fusionCount: 0 }).verdict, "overload"); });
test("valores inválidos no rompen", () => { const r = calculate({ ...base, length: "abc", splitters: [] }); assert.ok(Number.isFinite(r.totalLoss)); });
