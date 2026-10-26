import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createAnonServerClient } from '@/utils/supabase/anon-server';
import { z } from 'zod';

export type ShopProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  videoUrl: string | null;
  ingredientes: string | null;
  trazabilidadQr: boolean;
  pesoNetoG: number | null;
  price: number;
  stock: number | null;
  format: string | null;
  formatLabel: string | null;
  category: string | null;
  categoryLabel: string | null;
  tags: string[];
  origenApicola: string | null;
  photos: string[];
  visible: boolean;
  channels?: string[] | null;
  blockchain_hash?: string | null;
  lote_id?: string | null;
  lote_publico?: boolean;
  colmena_origen?: string | null;
  fecha_cosecha?: string | null;
  fecha_envasado?: string | null;
  nombre_lote?: string | null;
  descripcion_lote?: string | null;
  sustituye_azucar_g?: number | null;
  co2_evitado_kg?: number | null;
  irr_referencia?: number | null;
  perfil_sensorial?: {
    intensidad?: number;
    dulzor_acidez?: number;
    textura?: number;
    descriptores_intensidad?: { izq?: string; der?: string };
    descriptores_dulzor?: { izq?: string; der?: string };
    descriptores_textura?: { izq?: string; der?: string };
    notas_aromaticas?: string[];
    maridajes?: Array<{ titulo: string; detalle: string }>;
    momento_consumo?: string;
  } | null;
  tipo_sensorial?: string | null;
  tipoSensorialLabel?: string | null;
  variantes?: ProductoVarianteItem[];
};

export type ProductoVarianteItem = {
  id: string;
  producto_id: string;
  sku: string;
  nombre_variante: string;
  tipo_variante: 'formato' | 'fortificacion' | 'edicion_especial' | 'pack';
  ingrediente_fortificante: string;
  peso_neto_g: number;
  precio_override: number | null;
  stock: number;
  activo: boolean;
  perfil_sensorial_override: unknown | null;
  sort_order: number;
};

const PRODUCT_SELECT_BASE = [
  'id',
  'slug',
  'nombre',
  'descripcion_regenerativa',
  'descripcion_corta',
  'video_url',
  'ingredientes',
  'trazabilidad_qr',
  'peso_neto_g',
  'precio',
  'stock',
  'formato',
  'categoria',
  'tags',
  'origen_apicola',
  'fotos',
  'visible',
  'channels',
  'sustituye_azucar_g',
  'co2_evitado_kg',
  'irr_referencia',
  'lote_id',
  'perfil_sensorial',
  'lotes(blockchain_hash, cosecha_ids, nombre_lote, descripcion, fecha_envasado, publico)',
].join(', ');

const PRODUCT_SELECT = `${PRODUCT_SELECT_BASE}, tipo_sensorial`;

const LoteJoinSchema = z.object({
  blockchain_hash: z.string().nullable(),
  cosecha_ids: z.array(z.string()).nullable(),
  nombre_lote: z.string().nullable(),
  descripcion: z.string().nullable(),
  fecha_envasado: z.string().nullable(),
  publico: z.boolean().nullable(),
});

/** Supabase a veces devuelve numéricos como string; coerce evita catálogo vacío. */
const nullableNum = z.preprocess((v) => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return v;
}, z.number().nullable());

const stringArray = z.preprocess((v) => {
  if (v == null) return null;
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : null;
    } catch {
      return null;
    }
  }
  return null;
}, z.array(z.string()).nullable());

/** Join FK: objeto, array (0|1) o null — no tumbar todo el catálogo. */
const lotesField = z.preprocess((v) => {
  if (v == null) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}, LoteJoinSchema.nullable());

const ProductRowSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().nullable(),
  nombre: z.string().nullable(),
  descripcion_regenerativa: z.string().nullable(),
  descripcion_corta: z.string().nullable().optional(),
  video_url: z.string().nullable().optional(),
  ingredientes: z.string().nullable().optional(),
  trazabilidad_qr: z.boolean().nullable().optional(),
  peso_neto_g: nullableNum.optional(),
  precio: nullableNum,
  stock: nullableNum,
  formato: z.string().nullable(),
  categoria: z.string().nullable(),
  tags: stringArray,
  origen_apicola: z.string().nullable(),
  fotos: stringArray,
  visible: z.boolean().nullable(),
  channels: z.array(z.string()).nullable().optional(),
  sustituye_azucar_g: nullableNum,
  co2_evitado_kg: nullableNum,
  irr_referencia: nullableNum,
  lote_id: z.string().nullable(),
  perfil_sensorial: z.unknown().nullable().optional(),
  tipo_sensorial: z.string().nullable().optional(),
  lotes: lotesField,
});

const CosechaJoinSchema = z.object({
  fecha: z.string().nullable(),
  colmenas: z.object({ name: z.string().nullable() }).nullable(),
});

type ProductRow = z.infer<typeof ProductRowSchema>;

export type TaxonomyMaps = {
  formats: Record<string, string>;
  categories: Record<string, string>;
  sensoryFamilies: Record<string, string>;
};

async function fetchTaxonomyMapsDirect(): Promise<TaxonomyMaps> {
  const supabase = createAnonServerClient();
  try {
    const [fRes, cRes, sRes] = await Promise.all([
      supabase.from('product_formats').select('value, label').eq('active', true),
      supabase.from('product_categories').select('value, label').eq('active', true),
      supabase.from('product_sensory_families').select('value, label').eq('active', true),
    ]);
    const formats: Record<string, string> = {};
    for (const r of fRes.data ?? []) {
      if (r.value && r.label) formats[r.value] = r.label;
    }
    const categories: Record<string, string> = {};
    for (const r of cRes.data ?? []) {
      if (r.value && r.label) categories[r.value] = r.label;
    }
    const sensoryFamilies: Record<string, string> = {};
    for (const r of sRes.data ?? []) {
      if (r.value && r.label) sensoryFamilies[r.value] = r.label;
    }
    return { formats, categories, sensoryFamilies };
  } catch (err) {
    console.warn('[products] fetchTaxonomyMaps fallback:', err);
    return { formats: {}, categories: {}, sensoryFamilies: {} };
  }
}

const getCachedTaxonomyMaps = unstable_cache(
  fetchTaxonomyMapsDirect,
  ['taxonomy_maps'],
  { revalidate: 300, tags: ['products', 'taxonomies'] },
);

export const fetchTaxonomyMaps = cache(async function fetchTaxonomyMaps(): Promise<TaxonomyMaps> {
  // Desarrollo/test: sin caché para ver el CMS al recargar (en producción
  // rige ISR 300s + revalidación bajo demanda).
  if (process.env.NODE_ENV !== 'production') {
    return fetchTaxonomyMapsDirect();
  }
  return getCachedTaxonomyMaps();
});

export function mapProduct(p: ProductRow, taxonomies?: TaxonomyMaps): ShopProduct {
  const formatLabel = p.formato ? (taxonomies?.formats[p.formato] ?? p.formato) : null;
  const categoryLabel = p.categoria ? (taxonomies?.categories[p.categoria] ?? p.categoria) : null;
  const sensoryLabel = p.tipo_sensorial ? (taxonomies?.sensoryFamilies[p.tipo_sensorial] ?? p.tipo_sensorial) : null;

  return {
    id: p.id,
    slug: p.slug ?? String(p.id),
    name: p.nombre ?? '',
    description: p.descripcion_regenerativa ?? null,
    shortDescription: p.descripcion_corta ?? null,
    videoUrl: p.video_url ?? null,
    ingredientes: p.ingredientes ?? null,
    trazabilidadQr: p.trazabilidad_qr ?? true,
    pesoNetoG: p.peso_neto_g ?? null,
    price: p.precio ?? 0,
    stock: p.stock ?? null,
    format: p.formato ?? null,
    formatLabel,
    category: p.categoria ?? null,
    categoryLabel,
    tags: p.tags ?? [],
    origenApicola: p.origen_apicola ?? null,
    photos: p.fotos ?? [],
    visible: p.visible ?? true,
    channels: p.channels ?? ['tienda', 'campo'],
    blockchain_hash: p.lotes?.blockchain_hash ?? null,
    lote_id: p.lote_id ?? null,
    lote_publico: p.lotes?.publico ?? false,
    colmena_origen: null,
    fecha_cosecha: null,
    fecha_envasado: p.lotes?.fecha_envasado ?? null,
    nombre_lote: p.lotes?.nombre_lote ?? null,
    descripcion_lote: p.lotes?.descripcion ?? null,
    sustituye_azucar_g: p.sustituye_azucar_g ?? null,
    co2_evitado_kg: p.co2_evitado_kg ?? null,
    irr_referencia: p.irr_referencia ?? null,
    perfil_sensorial: (p.perfil_sensorial as ShopProduct['perfil_sensorial']) ?? null,
    tipo_sensorial: p.tipo_sensorial ?? 'miel',
    tipoSensorialLabel: sensoryLabel,
    variantes: [],
  };
}

async function listVisibleProductsDirect(): Promise<ShopProduct[]> {
  const supabase = createAnonServerClient();
  const [initialProductsRes, taxonomies] = await Promise.all([
    supabase
      .from('productos')
      .select(PRODUCT_SELECT)
      .eq('visible', true)
      .order('created_at', { ascending: false }),
    fetchTaxonomyMapsDirect(),
  ]);
  let productsRes = initialProductsRes;

  if (productsRes.error && productsRes.error.code === '42703') {
    productsRes = await supabase
      .from('productos')
      .select(PRODUCT_SELECT_BASE)
      .eq('visible', true)
      .order('created_at', { ascending: false });
  }

  if (productsRes.error) {
    console.error('[products] listVisibleProducts error:', productsRes.error);
    return [];
  }
  const rawRows = productsRes.data ?? [];
  // Parse fila a fila: un producto roto no debe vaciar todo el catálogo
  const rows: ProductRow[] = [];
  let failed = 0;
  for (const raw of rawRows) {
    const one = ProductRowSchema.safeParse(raw);
    if (one.success) rows.push(one.data);
    else {
      failed += 1;
      console.warn('[products] row skipped:', one.error.flatten());
    }
  }
  if (rows.length === 0 && rawRows.length > 0) {
    console.error('[products] listVisibleProducts: todas las filas fallaron schema', {
      total: rawRows.length,
      failed,
    });
    return [];
  }
  return rows
    .filter((r) => !r.channels || r.channels.length === 0 || r.channels.includes('tienda'))
    .map((r) => mapProduct(r, taxonomies));
}

const getCachedVisibleProducts = unstable_cache(
  listVisibleProductsDirect,
  ['visible_products'],
  { revalidate: 120, tags: ['products'] },
);

export const listVisibleProducts = cache(async function listVisibleProducts(): Promise<ShopProduct[]> {
  // Desarrollo/test: sin caché para ver el CMS al recargar (en producción
  // rige ISR 120s + revalidación bajo demanda vía /api/revalidate).
  if (process.env.NODE_ENV !== 'production') {
    return listVisibleProductsDirect();
  }
  return getCachedVisibleProducts();
});

async function getProductBySlugOrIdDirect(slugOrId: string): Promise<ShopProduct | null> {
  const supabase = createAnonServerClient();

  let decodedSlugOrId = slugOrId;
  try {
    decodedSlugOrId = decodeURIComponent(slugOrId);
  } catch {
    // ignore
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedSlugOrId);
  const [initialProductRes, taxonomies] = await Promise.all([
    supabase
      .from('productos')
      .select(PRODUCT_SELECT)
      .eq(isUuid ? 'id' : 'slug', decodedSlugOrId)
      .maybeSingle(),
    fetchTaxonomyMapsDirect(),
  ]);
  let productRes = initialProductRes;

  if (productRes.error && productRes.error.code === '42703') {
    productRes = await supabase
      .from('productos')
      .select(PRODUCT_SELECT_BASE)
      .eq(isUuid ? 'id' : 'slug', decodedSlugOrId)
      .maybeSingle();
  }

  if (productRes.error) {
    console.error('[products] getProductBySlugOrId error:', productRes.error);
    return null;
  }
  
  let row: ProductRow | null = null;
  if (productRes.data) {
    const parsed = ProductRowSchema.safeParse(productRes.data);
    if (parsed.success) row = parsed.data;
    else console.warn('[products] getProductBySlugOrId schema:', parsed.error.flatten());
  }

  if (!row) return null;

  const product = mapProduct(row, taxonomies);

  if (row.lote_id && row.lotes?.cosecha_ids?.length) {
    const { data: cosechas } = await supabase
      .from('cosechas')
      .select('fecha, colmenas(name)')
      .in('id', row.lotes.cosecha_ids)
      .limit(1);

    const firstRaw = cosechas?.[0];
    if (firstRaw) {
      const first = CosechaJoinSchema.safeParse(firstRaw);
      if (first.success) {
        product.fecha_cosecha = first.data.fecha ?? null;
        product.colmena_origen = first.data.colmenas?.name ?? null;
      }
    }
  }

  try {
    const { data: varsData } = await supabase
      .from('producto_variantes')
      .select('*')
      .eq('producto_id', row.id)
      .eq('activo', true)
      .order('sort_order', { ascending: true });
    if (varsData && Array.isArray(varsData)) {
      product.variantes = varsData as ProductoVarianteItem[];
    }
  } catch (err) {
    console.warn('[products] error fetching variantes for product:', err);
  }

  return product;
}

const getCachedProductBySlugOrId = unstable_cache(
  async (slugOrId: string) => getProductBySlugOrIdDirect(slugOrId),
  ['product_by_slug_or_id'],
  { revalidate: 120, tags: ['products'] },
);

export const getProductBySlugOrId = cache(async function getProductBySlugOrId(
  slugOrId: string,
): Promise<ShopProduct | null> {
  // Desarrollo/test: sin caché para ver el CMS al recargar (en producción
  // rige ISR 120s + revalidación bajo demanda vía /api/revalidate).
  if (process.env.NODE_ENV !== 'production') {
    return getProductBySlugOrIdDirect(slugOrId);
  }
  return getCachedProductBySlugOrId(slugOrId);
});

const FORBIDDEN_HEALTH_CLAIM_RE =
  /sustituye\s+az[uú]car|az[uú]car|glic[eé]mic|gluc[eé]mic|hba1c|ansi[oó]litic|antidepresiv|adicti|diabetes|s[ií]ndrome\s+metab[oó]lic/i;

export function resolveProductBadges(p: ShopProduct): string[] {
  const badges: string[] = [];
  if (p.fecha_cosecha) {
    const year = new Date(p.fecha_cosecha).getFullYear();
    if (!Number.isNaN(year)) {
      badges.push(`Recolección ${year}`);
    }
  } else if (p.nombre_lote) {
    badges.push(`Lote ${p.nombre_lote}`);
  }
  if (p.irr_referencia && p.irr_referencia > 1) badges.push('Trazable');
  if (p.format?.toLowerCase().includes('sachet')) badges.push('Bajo procesamiento');
  for (const tag of p.tags) {
    if (!tag || FORBIDDEN_HEALTH_CLAIM_RE.test(tag)) continue;
    if (!badges.includes(tag)) badges.push(tag);
    if (badges.length >= 3) break;
  }
  if (badges.length === 0 && p.origenApicola) {
    badges.push(p.origenApicola);
  }
  return badges.slice(0, 3);
}
