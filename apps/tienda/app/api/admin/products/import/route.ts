import { NextResponse } from 'next/server';
import { slugify } from '@/lib/shop/slug';
import { createClient } from '@/utils/supabase/server';

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || (profile.role !== 'tienda_admin' && profile.role !== 'gerente')) {
    return { error: NextResponse.json({ error: 'Sin permisos' }, { status: 403 }) };
  }
  return { supabase };
}

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

