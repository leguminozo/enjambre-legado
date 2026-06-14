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
  photos: string[];
  visible: boolean;
  blockchain_hash?: string | null;
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
  'fotos',
  'visible',
  'sustituye_azucar_g',
  'co2_evitado_kg',
  'irr_referencia',
  'lote_id',
  'lotes(blockchain_hash, cosecha_ids, nombre_lote, descripcion, fecha_envasado)',
].join(', ');

const LoteJoinSchema = z.object({
  blockchain_hash: z.string().nullable(),
  cosecha_ids: z.array(z.string()).nullable(),
  nombre_lote: z.string().nullable(),
  descripcion: z.string().nullable(),
  fecha_envasado: z.string().nullable(),
});

const ProductRowSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().nullable(),
  nombre: z.string().nullable(),
  descripcion_regenerativa: z.string().nullable(),
  precio: z.number().nullable(),
  stock: z.number().nullable(),
  formato: z.string().nullable(),
  fotos: z.array(z.string()).nullable(),
  visible: z.boolean().nullable(),
  sustituye_azucar_g: z.number().nullable(),
  co2_evitado_kg: z.number().nullable(),
  irr_referencia: z.number().nullable(),
  lote_id: z.string().nullable(),
  lotes: LoteJoinSchema.nullable(),
});

const CosechaJoinSchema = z.object({
  fecha: z.string().nullable(),
  colmenas: z.object({ name: z.string().nullable() }).nullable(),
});

type ProductRow = z.infer<typeof ProductRowSchema>;

function mapProduct(p: ProductRow): ShopProduct {
  return {
    id: p.id,
    slug: p.slug ?? String(p.id),
    name: p.nombre ?? '',
    description: p.descripcion_regenerativa ?? null,
    price: p.precio ?? 0,
    stock: p.stock ?? null,
    format: p.formato ?? null,
    photos: p.fotos ?? [],
    visible: p.visible ?? true,
    blockchain_hash: p.lotes?.blockchain_hash ?? null,
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

export async function listVisibleProducts(): Promise<ShopProduct[]> {
  const supabase = createAnonServerClient();
  const { data, error } = await supabase
    .from('productos')
    .select(PRODUCT_SELECT)
    .eq('visible', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  const parsed = z.array(ProductRowSchema).safeParse(data);
  if (!parsed.success) {
    console.error('[products] listVisibleProducts schema mismatch:', parsed.error.flatten());
    return [];
  }
  return parsed.data.map(mapProduct);
}

export async function getProductBySlugOrId(slugOrId: string): Promise<ShopProduct | null> {
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

  if (error) throw new Error(error.message);
  
  let row: ProductRow | null = null;
  const parsed = ProductRowSchema.safeParse(data);
  if (parsed.success) row = parsed.data;

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
}
