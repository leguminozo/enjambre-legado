import { cache } from 'react';
import { createAnonServerClient } from '@/utils/supabase/anon-server';
import { z } from 'zod';

export type ShopProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  stock: number | null;
  format: string | null;
  category: string | null;
  tags: string[];
  origenApicola: string | null;
  photos: string[];
  visible: boolean;
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
};

const PRODUCT_SELECT = [
  'id',
  'slug',
  'nombre',
  'descripcion_regenerativa',
  'precio',
  'stock',
  'formato',
  'categoria',
  'tags',
  'origen_apicola',
  'fotos',
  'visible',
  'sustituye_azucar_g',
  'co2_evitado_kg',
  'irr_referencia',
  'lote_id',
  'lotes(blockchain_hash, cosecha_ids, nombre_lote, descripcion, fecha_envasado, publico)',
].join(', ');

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
  precio: nullableNum,
  stock: nullableNum,
  formato: z.string().nullable(),
  categoria: z.string().nullable(),
  tags: stringArray,
  origen_apicola: z.string().nullable(),
  fotos: stringArray,
  visible: z.boolean().nullable(),
  sustituye_azucar_g: nullableNum,
  co2_evitado_kg: nullableNum,
  irr_referencia: nullableNum,
  lote_id: z.string().nullable(),
  lotes: lotesField,
});

const CosechaJoinSchema = z.object({
  fecha: z.string().nullable(),
  colmenas: z.object({ name: z.string().nullable() }).nullable(),
});

type ProductRow = z.infer<typeof ProductRowSchema>;

export function mapProduct(p: ProductRow): ShopProduct {
  return {
    id: p.id,
    slug: p.slug ?? String(p.id),
    name: p.nombre ?? '',
    description: p.descripcion_regenerativa ?? null,
    price: p.precio ?? 0,
    stock: p.stock ?? null,
    format: p.formato ?? null,
    category: p.categoria ?? null,
    tags: p.tags ?? [],
    origenApicola: p.origen_apicola ?? null,
    photos: p.fotos ?? [],
    visible: p.visible ?? true,
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
  };
}

export const listVisibleProducts = cache(async function listVisibleProducts(): Promise<ShopProduct[]> {
  const supabase = createAnonServerClient();
  const { data, error } = await supabase
    .from('productos')
    .select(PRODUCT_SELECT)
    .eq('visible', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error('No se pudieron cargar los productos');
  const rawRows = data ?? [];
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
    throw new Error('No se pudieron interpretar los productos del catálogo');
  }
  return rows.map(mapProduct);
});

export const getProductBySlugOrId = cache(async function getProductBySlugOrId(
  slugOrId: string,
): Promise<ShopProduct | null> {
  const supabase = createAnonServerClient();

  let decodedSlugOrId = slugOrId;
  try {
    decodedSlugOrId = decodeURIComponent(slugOrId);
  } catch (e) {
    // ignore
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedSlugOrId);
  const { data, error } = await supabase
    .from('productos')
    .select(PRODUCT_SELECT)
    .eq(isUuid ? 'id' : 'slug', decodedSlugOrId)
    .maybeSingle();

  if (error) throw new Error('No se pudieron cargar los productos');
  
  let row: ProductRow | null = null;
  if (data) {
    const parsed = ProductRowSchema.safeParse(data);
    if (parsed.success) row = parsed.data;
    else console.warn('[products] getProductBySlugOrId schema:', parsed.error.flatten());
  }

  if (!row) return null;

  const product = mapProduct(row);

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

  return product;
});
