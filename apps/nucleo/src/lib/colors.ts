/* Los exports de abajo son strings CSS: válidos en DOM (charts, leaflet, SVG).
   WebGL NO parsea `hsl(var(--token))` → para three.js usar useScenePalette(),
   que resuelve los tokens a rgb() contra el tema activo (dark/light). */

export const BOSQUE_ULMO = 'hsl(var(--primary))'
export const BOSQUE_ULMO_LIGHT = 'hsl(var(--primary) / 0.8)'
export const BOSQUE_ULMO_DARK = 'hsl(var(--primary) / 0.7)'
export const ORO_MIEL = 'hsl(var(--accent))'
export const ORO_MIEL_LIGHT = 'hsl(var(--accent) / 0.85)'
export const ORO_MIEL_DARK = 'hsl(var(--accent) / 0.75)'
export const ORO_MIEL_ALT = 'hsl(var(--accent) / 0.9)'
export const CREMA_NATURAL = 'hsl(var(--primary-foreground))'
export const NEGRO_TINTA = 'hsl(var(--background))'
export const TEXT_MUTED = 'hsl(var(--muted-foreground))'
export const SALUD_OPTIMA = 'hsl(var(--success))'
export const SALUD_RIESGO = 'hsl(var(--destructive))'
export const SCENE_BG = 'hsl(var(--background) / 0.9)'
export const SCENE_DARK = 'hsl(var(--surface-sunken))'

// ─── Resolución runtime para WebGL ─────────────────────────────────────────
// THREE.Color no entiende `hsl(var(--token))`: sin resolver, la escena cae a
// gris (bug visible en el gemelo). resolveCssColor pasa el valor por un nodo
// probe del DOM y lee el rgb() computado del tema activo (dark/light).

import { useEffect, useState } from 'react';

export interface ScenePalette {
  isDark: boolean;
  bg: string;
  primary: string;
  accent: string;
  accentText: string;
  foreground: string;
  mutedFg: string;
  surfaceSunken: string;
  success: string;
  destructive: string;
}

let probeEl: HTMLDivElement | null = null;

export function resolveCssColor(cssValue: string, fallback = 'rgb(128,128,128)'): string {
  if (typeof window === 'undefined' || !document.body) return fallback;
  if (!probeEl) {
    probeEl = document.createElement('div');
    probeEl.style.cssText =
      'position:absolute;width:0;height:0;visibility:hidden;pointer-events:none';
    document.body.appendChild(probeEl);
  }
  probeEl.style.color = '';
  probeEl.style.color = cssValue;
  return getComputedStyle(probeEl).color || fallback;
}

function luminance01(rgb: string): number {
  const m = rgb.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (!m) return 0;
  return (0.2126 * Number(m[1]) + 0.7152 * Number(m[2]) + 0.0722 * Number(m[3])) / 255;
}

/** Riesgo (hive-state) llega como `hsl(145 63% 42%)`: se resuelve igual que tokens. */
export function resolveRiskColor(cssHsl: string): string {
  return resolveCssColor(cssHsl);
}

export function readScenePalette(): ScenePalette {
  const bg = resolveCssColor('hsl(var(--background))');
  return {
    isDark: luminance01(bg) < 0.5,
    bg,
    primary: resolveCssColor('hsl(var(--primary))'),
    accent: resolveCssColor('hsl(var(--accent))'),
    accentText: resolveCssColor('hsl(var(--accent-text))'),
    foreground: resolveCssColor('hsl(var(--foreground))'),
    mutedFg: resolveCssColor('hsl(var(--muted-foreground))'),
    surfaceSunken: resolveCssColor('hsl(var(--surface-sunken))'),
    success: resolveCssColor('hsl(var(--success))'),
    destructive: resolveCssColor('hsl(var(--destructive))'),
  };
}

export function useScenePalette(): ScenePalette {
  const [palette, setPalette] = useState<ScenePalette>(() => readScenePalette());
  useEffect(() => {
    const update = () => setPalette(readScenePalette());
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', update);
    return () => {
      obs.disconnect();
      mq.removeEventListener('change', update);
    };
  }, []);
  return palette;
}
