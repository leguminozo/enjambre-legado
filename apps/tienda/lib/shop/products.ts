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

export async function listVisibleProducts(): Promise<ShopProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('productos')
    .select('id, slug, nombre, descripcion_regenerativa, precio, stock, formato, fotos, visible, blockchain_hash, sustituye_azucar_g, co2_evitado_kg, irr_referencia')
    .eq('visible', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({
  id: p.id as string,
  slug: (p.slug as string) ?? String(p.id),
  name: (p.nombre as string) ?? '',
  description: (p.descripcion_regenerativa as string) ?? null,
  price: (p.precio as number) ?? 0,
  stock: (p.stock as number) ?? null,
  format: (p.formato as string) ?? null,
  photos: (p.fotos as string[]) ?? [],
  visible: (p.visible as boolean) ?? true,
  blockchain_hash: (p.blockchain_hash as string) ?? null,
  sustituye_azucar_g: (p.sustituye_azucar_g as number) ?? null,
  co2_evitado_kg: (p.co2_evitado_kg as number) ?? null,
  irr_referencia: (p.irr_referencia as number) ?? null,
}));
}

export async function getProductBySlugOrId(slugOrId: string): Promise<ShopProduct | null> {
  const supabase = await createClient();

  // Primero intenta por slug.
  const bySlug = await supabase
    .from('productos')
    .select('id, slug, nombre, descripcion_regenerativa, precio, stock, formato, fotos, visible, blockchain_hash, sustituye_azucar_g, co2_evitado_kg, irr_referencia')
    .eq('slug', slugOrId)
    .maybeSingle();

  if (bySlug.error) throw new Error(bySlug.error.message);
  if (bySlug.data) {
    const p = bySlug.data;
    return {
      id: p.id as string,
      slug: (p.slug as string) ?? String(p.id),
      name: (p.nombre as string) ?? '',
      description: (p.descripcion_regenerativa as string) ?? null,
      price: (p.precio as number) ?? 0,
      stock: (p.stock as number) ?? null,
      format: (p.formato as string) ?? null,
      photos: (p.fotos as string[]) ?? [],
      visible: (p.visible as boolean) ?? true,
      blockchain_hash: (p.blockchain_hash as string) ?? null,
      sustituye_azucar_g: (p.sustituye_azucar_g as number) ?? null,
      co2_evitado_kg: (p.co2_evitado_kg as number) ?? null,
      irr_referencia: (p.irr_referencia as number) ?? null,
    };
  }

  // Fallback por id.
  const byId = await supabase
    .from('productos')
    .select('id, slug, nombre, descripcion_regenerativa, precio, stock, formato, fotos, visible, blockchain_hash, sustituye_azucar_g, co2_evitado_kg, irr_referencia')
    .eq('id', slugOrId)
    .maybeSingle();

  if (byId.error) throw new Error(byId.error.message);
  if (!byId.data) return null;
  const p = byId.data;
  return {
    id: p.id as string,
    slug: (p.slug as string) ?? String(p.id),
    name: (p.nombre as string) ?? '',
    description: (p.descripcion_regenerativa as string) ?? null,
    price: (p.precio as number) ?? 0,
    stock: (p.stock as number) ?? null,
    format: (p.formato as string) ?? null,
    photos: (p.fotos as string[]) ?? [],
    visible: (p.visible as boolean) ?? true,
    blockchain_hash: (p.blockchain_hash as string) ?? null,
    sustituye_azucar_g: (p.sustituye_azucar_g as number) ?? null,
    co2_evitado_kg: (p.co2_evitado_kg as number) ?? null,
    irr_referencia: (p.irr_referencia as number) ?? null,
  };
}

