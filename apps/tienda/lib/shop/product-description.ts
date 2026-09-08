/**
 * Sanitiza descripciones de producto del CMS/DB.
 * Reemplaza placeholders / teclado-mash por copy de marca existente en el repo
 * (llms.txt, collections i18n, página Nosotros) — sin inventar claims.
 */

const BRAND_FALLBACK_BY_SLUG: Record<string, string> = {
  'miel-virgen':
    'Miel virgen en panal, sellada como sale de la colmena. Pureza del néctar del bosque nativo de Chiloé, sin intervenciones.',
  'crema-de-miel-y0r3':
    'Crema de miel ulmo-tepú en frasco de mesa. Dulzura boscosa para tus preparaciones y cada cucharada — Tesoros del Colmenar.',
  'crema-de-miel':
    'Crema de miel ulmo-tepú en formato mayor. Reserva del bosque para el ritual cotidiano — Reservas del Bosque.',
  'sachet-de-miel-con-avellanas':
    'Sachet de 15 g de crema de miel con avellana, para llevar. Gotas de Néctar del bosque nativo de Chiloé.',
  sachet:
    'Sachet de 15 g de crema de miel ulmo-tepú. Formato mínimo para llevar, regalar o probar — Gotas de Néctar.',
  'crema-de-miel-con-polen-4crg':
    'Sachet de 15 g de crema de miel con polen. Dosis individual del bosque nativo de Chiloé — Gotas de Néctar.',
  'esencia-de-canelo':
    'Esencia de canelo del bosque nativo de Chiloé. Extracción cuidada del territorio, con la misma trazabilidad de nuestras mieles.',
};

const GENERIC_BRAND_DESCRIPTION =
  'Miel cruda del bosque nativo de Chiloé. Creaciones con legado y regeneración — La Obrera y el Zángano.';

/** Patrones típicos de placeholder / teclado-mash en CMS. */
const PLACEHOLDER_RE =
  /^(?:asdf+|qwer+|zxcv+|lorem(?:\s+ipsum)?|test+|xxx+|bla+h?|asd+a*|qwe+|tyguh|ugyv|knjb|blabla|masld)/i;

export function isPlaceholderDescription(value: string | null | undefined): boolean {
  if (value == null) return true;
  const t = value.trim();
  if (!t) return true;
  if (PLACEHOLDER_RE.test(t)) return true;

  const letters = t.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/g, '');
  if (letters.length >= 8) {
    const vowels = (letters.match(/[aeiouáéíóúüAEIOUÁÉÍÓÚÜ]/g) ?? []).length;
    if (vowels / letters.length < 0.22) return true;
  }

  // Token único largo sin espacios (mash de teclado / filler)
  if (!/\s/.test(t) && t.length >= 10 && /^[a-z0-9,._-]+$/i.test(t)) {
    const vowels = (t.match(/[aeiouáéíóúüAEIOUÁÉÍÓÚÜ]/g) ?? []).length;
    if (vowels / t.length < 0.3) return true;
  }

  return false;
}

export function brandDescriptionForSlug(slug: string | null | undefined): string {
  if (!slug) return GENERIC_BRAND_DESCRIPTION;
  return BRAND_FALLBACK_BY_SLUG[slug] ?? GENERIC_BRAND_DESCRIPTION;
}

/**
 * Devuelve descripción usable para PDP/SEO/JSON-LD.
 * Si el CMS tiene copy real, se respeta; si es placeholder, usa fallback de marca.
 */
export function resolveProductDescription(
  slug: string | null | undefined,
  raw: string | null | undefined,
): string | null {
  if (!isPlaceholderDescription(raw)) return raw!.trim();
  return brandDescriptionForSlug(slug);
}
