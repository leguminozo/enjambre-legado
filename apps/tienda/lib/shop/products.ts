import { createClient } from '@/utils/supabase/server';

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
  'lotes(blockchain_hash, cosecha_ids)',
].join(', ');

interface LoteJoin {
  blockchain_hash: string | null;
  cosecha_ids: string[] | null;
}

interface ProductRow {
  id: string;
  slug: string | null;
  nombre: string | null;
  descripcion_regenerativa: string | null;
  precio: number | null;
  stock: number | null;
  formato: string | null;
  fotos: string[] | null;
  visible: boolean | null;
  sustituye_azucar_g: number | null;
  co2_evitado_kg: number | null;
  irr_referencia: number | null;
  lote_id: string | null;
  lotes: LoteJoin | null;
}

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
    sustituye_azucar_g: p.sustituye_azucar_g ?? null,
    co2_evitado_kg: p.co2_evitado_kg ?? null,
    irr_referencia: p.irr_referencia ?? null,
  };
}

export async function listVisibleProducts(): Promise<ShopProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('productos')
    .select(PRODUCT_SELECT)
    .eq('visible', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data as unknown as ProductRow[] | null) ?? []).map(mapProduct);
}

export async function getProductBySlugOrId(slugOrId: string): Promise<ShopProduct | null> {
  const supabase = await createClient();

  let row: ProductRow | null = null;

  const bySlug = await supabase
    .from('productos')
    .select(PRODUCT_SELECT)
    .eq('slug', slugOrId)
    .maybeSingle();

  if (bySlug.error) throw new Error(bySlug.error.message);
    row = bySlug.data as unknown as ProductRow | null;

  if (!row) {
    const byId = await supabase
      .from('productos')
      .select(PRODUCT_SELECT)
      .eq('id', slugOrId)
      .maybeSingle();

    if (byId.error) throw new Error(byId.error.message);
    row = byId.data as unknown as ProductRow | null;
  }

  if (!row) return null;

  const product = mapProduct(row);

  if (row.lote_id && row.lotes?.cosecha_ids?.length) {
    const { data: cosechas } = await supabase
      .from('cosechas')
      .select('fecha, colmenas(name)')
      .in('id', row.lotes.cosecha_ids)
      .limit(1);

    const first = cosechas?.[0] as unknown as { fecha: string; colmenas: { name: string } } | undefined;
    if (first) {
      product.fecha_cosecha = first.fecha ?? null;
      product.colmena_origen = first.colmenas?.name ?? null;
    }
  }

  return product;
}
