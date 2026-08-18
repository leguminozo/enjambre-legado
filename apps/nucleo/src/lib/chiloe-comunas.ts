/**
 * Comunas de la provincia de Chiloé (división político-administrativa).
 * Localidades (Pureo, Molulco, etc.) no van aquí.
 */
export const COMUNAS_CHILOE = [
  { slug: 'ancud', nombre: 'Ancud' },
  { slug: 'castro', nombre: 'Castro' },
  { slug: 'chonchi', nombre: 'Chonchi' },
  { slug: 'curaco-de-velez', nombre: 'Curaco de Vélez' },
  { slug: 'dalcahue', nombre: 'Dalcahue' },
  { slug: 'puqueldon', nombre: 'Puqueldón' },
  { slug: 'queilen', nombre: 'Queilén' },
  { slug: 'quellon', nombre: 'Quellón' },
  { slug: 'quemchi', nombre: 'Quemchi' },
  { slug: 'quinchao', nombre: 'Quinchao' },
] as const;

export type ComunaChiloeSlug = (typeof COMUNAS_CHILOE)[number]['slug'];
export type ComunaChiloeNombre = (typeof COMUNAS_CHILOE)[number]['nombre'];

const ALIAS: Record<string, ComunaChiloeSlug> = {
  ancud: 'ancud',
  castro: 'castro',
  chonchi: 'chonchi',
  'curaco-de-velez': 'curaco-de-velez',
  curaco: 'curaco-de-velez',
  'curaco de velez': 'curaco-de-velez',
  'curaco de vélez': 'curaco-de-velez',
  dalcahue: 'dalcahue',
  puqueldon: 'puqueldon',
  puqueldón: 'puqueldon',
  queilen: 'queilen',
  queilén: 'queilen',
  quellon: 'quellon',
  quellón: 'quellon',
  quemchi: 'quemchi',
  quinchao: 'quinchao',
};

export function slugifyComuna(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function resolveComunaChiloe(
  raw: string | null | undefined,
): (typeof COMUNAS_CHILOE)[number] | null {
  if (!raw) return null;
  const key = slugifyComuna(raw);
  const slug = ALIAS[key] ?? ALIAS[raw.trim().toLowerCase()];
  if (!slug) return null;
  return COMUNAS_CHILOE.find((c) => c.slug === slug) ?? null;
}

export function nombreCanonicoComuna(raw: string): string {
  return resolveComunaChiloe(raw)?.nombre ?? raw.trim();
}
