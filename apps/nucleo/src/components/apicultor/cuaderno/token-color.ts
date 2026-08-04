// Resuelve tokens CSS de Enjambre (triplets `H S L%`) a `rgb()`/`rgba()` para
// el canvas de cytoscape (que no entiende `hsl(var(--token))`). Se resuelve en
// runtime con getComputedStyle para no hardcodear colores (regla AGENTS.md).

const cache = new Map<string, string>();

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sat = s / 100;
  const lig = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function resolve(name: string): string {
  if (typeof document === 'undefined') return 'rgb(128,128,128)';
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
  const m = raw.match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!m) return 'rgb(128,128,128)';
  const [r, g, b] = hslToRgb(Number(m[1]), Number(m[2]), Number(m[3]));
  return `rgb(${r}, ${g}, ${b})`;
}

/** Color sólido de un token semántico (p. ej. `tokenRgb('primary')`). */
export function tokenRgb(name: string): string {
  const cached = cache.get(name);
  if (cached) return cached;
  const color = resolve(name);
  cache.set(name, color);
  return color;
}

/** Color con opacidad de un token semántico (p. ej. `tokenRgbAlpha('primary', 0.15)`). */
export function tokenRgbAlpha(name: string, alpha: number): string {
  const key = `${name}:${alpha}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const raw = tokenRgb(name).replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  cache.set(key, raw);
  return raw;
}
