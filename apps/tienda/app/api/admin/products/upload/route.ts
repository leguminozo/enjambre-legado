import { NextResponse } from 'next/server';
import { slugify } from '@/lib/shop/slug';
import { requireAdmin } from '@/lib/require-admin';
import { splitCsvLine } from '@enjambre/ui';
import { z } from 'zod';

const ProductDeleteSchema = z.object({
  path: z.string().min(1),
  productId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Falta archivo CSV' }, { status: 400 });
  }

  const text = await file.text();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return NextResponse.json({ error: 'CSV vacío o sin filas' }, { status: 400 });
  }

  const headers = splitCsvLine(lines[0] || '').map((h) => h.toLowerCase());
  const idx = {
    nombre: headers.indexOf('nombre'),
    descripcion: headers.indexOf('descripcion'),
    precio: headers.indexOf('precio'),
    stock: headers.indexOf('stock'),
    formato: headers.indexOf('formato'),
    visible: headers.indexOf('visible'),
    slug: headers.indexOf('slug'),
    fotos: headers.indexOf('fotos'),
  };
  if (idx.nombre < 0 || idx.precio < 0) {
    return NextResponse.json(
      { error: 'El CSV debe incluir columnas: nombre, precio (mínimas)' },
      { status: 400 },
    );
  }

  const payload: Record<string, unknown>[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i] || '');
    const nombre = cols[idx.nombre]?.trim();
    if (!nombre) continue;
    const precio = Number(cols[idx.precio] ?? 0);
    const visibleRaw = idx.visible >= 0 ? (cols[idx.visible] || '').toLowerCase() : 'true';
    const fotosRaw = idx.fotos >= 0 ? cols[idx.fotos] || '' : '';
    payload.push({
      nombre,
      slug: (idx.slug >= 0 ? cols[idx.slug] : '') || slugify(nombre),
      descripcion_regenerativa: idx.descripcion >= 0 ? cols[idx.descripcion] || null : null,
      precio: Number.isFinite(precio) ? Math.round(precio) : 0,
      stock:
        idx.stock >= 0 && cols[idx.stock] !== ''
          ? Number.isFinite(Number(cols[idx.stock]))
            ? Number(cols[idx.stock])
            : null
          : null,
      formato: idx.formato >= 0 ? cols[idx.formato] || null : null,
      visible: !['false', '0', 'no'].includes(visibleRaw),
      fotos: fotosRaw
        ? fotosRaw
            .split('|')
            .map((f) => f.trim())
            .filter(Boolean)
        : [],
    });
  }

  if (payload.length === 0) {
    return NextResponse.json({ error: 'No se encontraron filas válidas' }, { status: 400 });
  }

  const { error } = await supabase.from('productos').upsert(payload, { onConflict: 'slug' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, imported: payload.length });
}

export async function DELETE(request: Request) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const raw = await request.json();
  const parsed = ProductDeleteSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { path, productId } = parsed.data;

  const { error: deleteError } = await supabase.storage.from('productos').remove([path]);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (productId) {
    const { data: product, error: fetchError } = await supabase
      .from('productos')
      .select('fotos')
      .eq('id', productId)
      .single();

    if (!fetchError && product) {
      const publicUrl = supabase.storage.from('productos').getPublicUrl(path).data.publicUrl;
      const updatedFotos = (Array.isArray(product.fotos) ? product.fotos : []).filter(
        (u: string) => u !== publicUrl,
      );

      await supabase.from('productos').update({ fotos: updatedFotos }).eq('id', productId);
    }
  }

  return NextResponse.json({ ok: true });
}
