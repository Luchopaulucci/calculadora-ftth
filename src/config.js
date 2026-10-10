/**
 * URL canónica del sitio (sin barra final).
 *
 * Producción: https://calculadora-ftth.vercel.app
 * Se puede sobrescribir con SITE_URL o VITE_SITE_URL.
 */
export const DEFAULT_SITE_URL = "https://calculadora-ftth.vercel.app";

/**
 * @returns {string}
 */
export function getSiteUrl() {
  const envUrl =
    (typeof process !== "undefined" &&
      process.env &&
      (process.env.VITE_SITE_URL || process.env.SITE_URL)) ||
    "";
  return String(envUrl || DEFAULT_SITE_URL).replace(/\/$/, "");
}

export const SITE_URL = getSiteUrl();
