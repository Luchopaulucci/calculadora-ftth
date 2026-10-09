/**
 * @param {number} v
 * @param {number} [digits=2]
 * @returns {string}
 */
export function fmt(v, digits = 2) {
  return Number.isFinite(v) ? v.toFixed(digits) : "∞";
}

/**
 * Formato es-AR para textos SEO (coma decimal, menos unicode).
 * @param {number} v
 * @param {number} [digits=1]
 * @returns {string}
 */
export function fmtEs(v, digits = 1) {
  if (!Number.isFinite(v)) return "∞";
  const sign = v < 0 ? "−" : "";
  return sign + Math.abs(v).toFixed(digits).replace(".", ",");
}
