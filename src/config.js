/**
 * URL canónica del sitio (sin barra final).
 *
 * El README indica desplegar en lucianopaulucci.com (o un subdominio
 * como ftth.lucianopaulucci.com). No hay homepage en package.json ni
 * dominio confirmado en vercel.json; se usa esa URL descubierta en el
 * README y se puede sobrescribir con SITE_URL o VITE_SITE_URL.
 */
export const DEFAULT_SITE_URL = "https://lucianopaulucci.com";

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
