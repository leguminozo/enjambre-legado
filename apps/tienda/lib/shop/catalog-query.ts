/**
 * Mapeo de kickers/colecciones del home → filtros reales del catálogo.
 * El CMS suele dejar href="/catalogo"; el landing rellena ?q= con la primera
 * palabra del kicker (Sachets, Frascos, Hidrolatos…), que no coincide con
 * formato/categoría reales (30x15g, 250g, miel…).
 */

export type CollectionCatalogTarget = {
  /** Ruta completa (puede ser /club-… o /catalogo?…) */
  href: string;
  /** Términos adicionales que debe aceptar el buscador q= */
  searchTerms: string[];
  /** Formatos de producto que deben matchear */
  formats: string[];
};

const COLLECTION_TARGETS: Record<string, CollectionCatalogTarget> = {
  sachets: {
    href: '/catalogo?q=Sachet',
    searchTerms: ['sachet', 'sachets', 'gotas'],
    formats: ['30x15g', '10x15g', '15g'],
  },
  'cajas de sachets': {
    href: '/catalogo?q=Sachet',
    searchTerms: ['sachet', 'sachets', 'cofre', 'caja'],
    formats: ['30x15g', '10x15g'],
  },
  'frascos medios': {
    href: '/catalogo?formato=250g',
    searchTerms: ['frasco', 'frascos', 'tesoro'],
    formats: ['250g', '150g'],
  },
  frascos: {
    href: '/catalogo?formato=250g',
    searchTerms: ['frasco', 'frascos'],
    formats: ['250g', '150g', '900g', '1kg'],
  },
  'frascos mayores': {
    href: '/catalogo?formato=1kg',
    searchTerms: ['frasco', 'frascos', 'reserva'],
    formats: ['1kg', '900g'],
  },
  'frascos grandes': {
    href: '/catalogo?formato=1kg',
    searchTerms: ['frasco', 'frascos', 'reserva'],
    formats: ['1kg', '900g'],
  },
  'miel virgen': {
    href: '/catalogo?q=Virgen',
    searchTerms: ['virgen', 'panal'],
    formats: ['panal'],
  },
  hidrolatos: {
    href: '/catalogo?q=Canelo',
    searchTerms: ['hidrolato', 'hidrolatos', 'esencia', 'canelo', 'destil'],
    formats: [],
  },
  suscripciones: {
    href: '/club-legado-del-bosque',
    searchTerms: ['suscripcion', 'suscripciones', 'club', 'legado', 'reposicion'],
    formats: [],
  },
};

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function lookupCollectionTarget(
  kickerOrTitle: string | null | undefined,
): CollectionCatalogTarget | null {
  if (!kickerOrTitle?.trim()) return null;
  const key = normalizeKey(kickerOrTitle);
  if (COLLECTION_TARGETS[key]) return COLLECTION_TARGETS[key];
  const first = key.split(/\s+/)[0] ?? '';
  if (COLLECTION_TARGETS[first]) return COLLECTION_TARGETS[first];
  return null;
}

/**
 * Resuelve el href de una card de colección.
 * Respeta hrefs CMS específicos; reescribe /catalogo genérico o vacío.
 */
export function resolveCollectionCatalogHref(opts: {
  kicker?: string | null;
  title?: string | null;
  href?: string | null;
}): string {
  const raw = (opts.href ?? '').trim();
  const target =
    lookupCollectionTarget(opts.kicker) ?? lookupCollectionTarget(opts.title);

  if (raw && raw !== '/catalogo' && raw !== '/catalogo/') {
    try {
      const url = new URL(raw, 'https://obrerayzangano.cl');
      if (url.pathname === '/catalogo') {
        const q = url.searchParams.get('q');
        if (q && lookupCollectionTarget(q) && target) return target.href;
        if (
          !q &&
          !url.searchParams.get('formato') &&
          !url.searchParams.get('categoria') &&
          target
        ) {
          return target.href;
        }
      }
    } catch {
      /* keep raw */
    }
    return raw;
  }

  return target?.href ?? '/catalogo';
}

export type CatalogQueryExpansion = {
  terms: string[];
  formats: string[];
};

/** Expande q= del catálogo con alias de colecciones (Sachets → sachet + 30x15g). */
export function expandCatalogSearchQuery(q: string): CatalogQueryExpansion {
  const raw = q.trim();
  if (!raw) return { terms: [], formats: [] };
  const target = lookupCollectionTarget(raw);
  const base = normalizeKey(raw);
  const terms = new Set<string>([base, raw.toLowerCase()]);
  if (base.endsWith('es') && base.length > 4) terms.add(base.slice(0, -2));
  else if (base.endsWith('s') && base.length > 3) terms.add(base.slice(0, -1));
  const formats: string[] = [];
  if (target) {
    for (const t of target.searchTerms) terms.add(normalizeKey(t));
    formats.push(...target.formats.map((f) => f.toLowerCase()));
  }
  return { terms: [...terms], formats };
}

export function productMatchesExpandedQuery(
  product: {
    name: string;
    format: string | null;
    category: string | null;
    description: string | null;
    tags: string[];
  },
  expansion: CatalogQueryExpansion,
): boolean {
  if (expansion.terms.length === 0 && expansion.formats.length === 0) return true;

  const haystack = [
    product.name,
    product.format ?? '',
    product.category ?? '',
    product.description ?? '',
    ...product.tags,
  ]
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (expansion.terms.some((t) => t && haystack.includes(t))) return true;

  const formatNorm = (product.format ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (expansion.formats.some((f) => f && (formatNorm === f || formatNorm.includes(f)))) {
    return true;
  }
  return false;
}
