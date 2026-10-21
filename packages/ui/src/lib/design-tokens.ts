/**
 * Lector de tokens de diseño en runtime para contextos que no resuelven CSS.
 *
 * Tailwind y los estilos del DOM resuelven `var(--x)` por sí mismos, pero un
 * contexto 2D (`ctx.fillStyle`, `ctx.strokeStyle`) no entiende variables CSS.
 * Este módulo cierra ese puente: lee la custom property desde `:root` y la
 * devuelve como color utilizable por Canvas.
 *
 * Regla: el hex vive una sola vez, en `tokens.css`. Ningún motor de render
 * debe escribir un literal de color.
 */

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const HSL_TRIPLET_PATTERN = /^(-?[\d.]+)\s+(-?[\d.]+)%\s+(-?[\d.]+)%$/;

/**
 * Los tokens editoriales viven en `:root` y no cambian con el tema, así que se
 * cachean. Solo se cachea una lectura efectiva: si el token no existe, cada
 * motor conserva su valor de respaldo sin ensuciar la caché.
 */
const colorCache = new Map<string, string>();

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function normalizeHex(value: string): string | null {
  const match = HEX_PATTERN.exec(value.trim());
  if (!match) return null;
  let hex = match[1].toLowerCase();
  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }
  return `#${hex}`;
}

/**
 * Convierte un triplete HSL de tokens (`44 85% 46%`) a hex opaco.
 * El canal alfa no existe en el formato de tokens; si aparece, se recorta.
 */
export function hslTripletToHex(value: string): string | null {
  const match = HSL_TRIPLET_PATTERN.exec(value.trim());
  if (!match) return null;

  const hue = ((parseFloat(match[1]) % 360) + 360) % 360;
  const saturation = Math.min(100, Math.max(0, parseFloat(match[2])));
  const lightness = Math.min(100, Math.max(0, parseFloat(match[3])));

  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const sector = hue / 60;
  const secondary = chroma * (1 - Math.abs((sector % 2) - 1));

  let rgb: [number, number, number];
  if (sector < 1) rgb = [chroma, secondary, 0];
  else if (sector < 2) rgb = [secondary, chroma, 0];
  else if (sector < 3) rgb = [0, chroma, secondary];
  else if (sector < 4) rgb = [0, secondary, chroma];
  else if (sector < 5) rgb = [secondary, 0, chroma];
  else rgb = [chroma, 0, secondary];

  const offset = l - chroma / 2;
  const toHex = (channel: number) =>
    Math.round((channel + offset) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
}

/**
 * Lee una custom property desde `:root`.
 * Devuelve el fallback cuando no hay DOM (SSR, build, pruebas en Node) o
 * cuando el token no existe.
 */
export function readDesignToken(name: string, fallback: string): string {
  if (!isBrowser()) return fallback;
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!raw) return fallback;
    return raw;
  } catch {
    return fallback;
  }
}

/**
 * Lee un token de color y lo normaliza a `#rrggbb`.
 * Acepta hex (`#d6aa5c`), triplet HSL (`44 85% 46%`) y `hsl(...)`.
 */
export function resolveTokenColor(name: string, fallback: string): string {
  const cached = colorCache.get(name);
  if (cached) return cached;

  const raw = readDesignToken(name, fallback);
  const hex = normalizeHex(raw);
  if (hex) {
    colorCache.set(name, hex);
    return hex;
  }

  const hsl = hslTripletToHex(raw);
  if (hsl) {
    colorCache.set(name, hsl);
    return hsl;
  }

  const functional = /^hsl\(([^)]+)\)$/i.exec(raw);
  if (functional) {
    const inner = functional[1].replace(/,/g, ' ').trim();
    const converted = hslTripletToHex(inner);
    if (converted) {
      colorCache.set(name, converted);
      return converted;
    }
  }

  return fallback;
}

/**
 * Vacía la caché de tokens. Se llama cuando cambia el tema o se recarga la
 * hoja de estilos, para que los motores vuelvan a leer los valores reales.
 */
export function clearDesignTokenCache(): void {
  colorCache.clear();
}

/**
 * Resuelve un grupo de tokens de una sola vez.
 * `names` mapea clave de resultado → nombre del token; `fallbacks` mapea la
 * misma clave → valor de respaldo.
 */
export function readTokenSet(
  names: Record<string, string>,
  fallbacks: Record<string, string>,
): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const key of Object.keys(names)) {
    resolved[key] = resolveTokenColor(names[key], fallbacks[key] ?? '#000000');
  }
  return resolved;
}

/**
 * Indica si el motor puede leer tokens del documento en este momento.
 * En `false`, los motores deben usar sus fallbacks estáticos (sin cambio de valor).
 */
export function canReadDesignTokens(): boolean {
  return isBrowser();
}
