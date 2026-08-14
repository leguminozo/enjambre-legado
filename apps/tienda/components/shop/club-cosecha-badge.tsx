'use client';

import { useEffect, useState } from 'react';

/** Aclara un hex hacia blanco (0-1). */
function lightenHex(hex: string, amount: number): string {
  return mixHex(hex, amount, 255);
}

/** Oscurece un hex hacia negro (0-1). */
function darkenHex(hex: string, amount: number): string {
  return mixHex(hex, amount, 0);
}

function mixHex(hex: string, amount: number, target: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  const mix = (c: number) => Math.round(c + (target - c) * amount);
  return (
    '#' +
    [num >> 16, (num >> 8) & 255, num & 255]
      .map((c) => mix(c).toString(16).padStart(2, '0'))
      .join('')
  );
}

/** Luminancia relativa WCAG de un hex. */
function relativeLuminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0;
  const num = parseInt(m[1], 16);
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * lin(num >> 16) + 0.7152 * lin((num >> 8) & 255) + 0.0722 * lin(num & 255)
  );
}

const LIGHT_BG_LUMINANCE = 0.9; // ~crema de la tienda en modo claro

/**
 * Badge de estado de floración con color desde CMS. El texto se adapta al
 * tema para cumplir 4.5:1 (WCAG):
 *  - dark:  variante aclarada (el color CMS es ilegible sobre fondo oscuro)
 *  - light: variante oscurecida solo si el color CMS es demasiado claro
 * El ajuste va en useEffect (no en useState): en SSR el classList aún es el
 * default del layout y un check en hidratación produciría un mismatch de
 * estilo que React 19 resolvería conservando el HTML del server (dark roto).
 */
export function ClubCosechaBadge({ color, label }: { color: string; label: string }) {
  const [textColor, setTextColor] = useState(color);

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setTextColor(lightenHex(color, 0.5));
      return;
    }
    // Modo claro: el texto se apoya sobre el fondo TINTADO (color 13% sobre
    // crema), no sobre el fondo liso — calcular contraste contra ese mix.
    const tintLum = 0.133 * relativeLuminance(color) + 0.867 * LIGHT_BG_LUMINANCE;
    const contrast = (tintLum + 0.05) / (relativeLuminance(color) + 0.05);
    if (contrast >= 4.5) return;
    let amount = 0.2;
    let candidate = color;
    while (amount <= 0.8) {
      candidate = darkenHex(color, amount);
      const c = (tintLum + 0.05) / (relativeLuminance(candidate) + 0.05);
      if (c >= 4.5) break;
      amount += 0.1;
    }
    setTextColor(candidate);
  }, [color]);

  return (
    <span
      className="text-[0.65rem] font-bold uppercase tracking-wider px-2 py-1 rounded-full shrink-0"
      style={{
        background: `${color}22`,
        color: textColor,
        border: `1px solid ${color}44`,
      }}
    >
      {label}
    </span>
  );
}
