import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("la entrada LCP de h1/.lead no arranca en opacity 0 ni hidden", () => {
  const src = readFileSync(join(root, "src/animations.js"), "utf8");
  const lcpBlock = src.split("LCP:")[1];
  assert.ok(lcpBlock, "falta el bloque LCP en animations.js");
  const tween = lcpBlock.slice(0, lcpBlock.indexOf("const cards"));
  assert.match(tween, /main h1,\s*main \.lead/);
  assert.match(tween, /opacity:\s*1/);
  assert.match(tween, /visibility:\s*"visible"/);
  assert.doesNotMatch(tween, /opacity:\s*0/);
  assert.doesNotMatch(tween, /autoAlpha/);
  assert.doesNotMatch(tween, /visibility:\s*"hidden"/);
});

test("CSS no oculta main h1 / main .lead ni con html.js", () => {
  const css = readFileSync(join(root, "src/style.css"), "utf8");
  assert.match(css, /html\.js main h1/);
  assert.match(css, /html\.js main \.lead/);
  const h1Rules = [...css.matchAll(/main h1[^{]*\{([^}]+)\}/g)].map((m) => m[1]);
  assert.ok(h1Rules.length);
  for (const body of h1Rules) {
    assert.doesNotMatch(body, /opacity\s*:\s*0/);
    assert.doesNotMatch(body, /visibility\s*:\s*hidden/);
  }
});
