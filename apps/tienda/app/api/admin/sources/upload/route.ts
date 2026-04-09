import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

type SourceType = 'boletas' | 'bancos' | 'sii' | 'notificaciones';

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
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || (profile.role !== 'tienda_admin' && profile.role !== 'gerente')) {
    return { error: NextResponse.json({ error: 'Sin permisos' }, { status: 403 }) };
  }
  return { supabase, profileId: profile.id as string };
}

function parseBoletasCsv(text: string, sourceFileId: string) {
  const lines = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0] || '').map((h) => h.toLowerCase());
  const ix = {
    folio: headers.indexOf('folio'),
    fecha: headers.indexOf('fecha'),
    rut: headers.indexOf('rut_receptor'),
    razon: headers.indexOf('razon_social'),
    neto: headers.indexOf('monto_neto'),
    iva: headers.indexOf('monto_iva'),
    total: headers.indexOf('monto_total'),
  };
  return lines.slice(1).map((line) => {
    const c = splitCsvLine(line);
    return {
      source_file_id: sourceFileId,
      folio: ix.folio >= 0 ? c[ix.folio] || null : null,
      emision_fecha: ix.fecha >= 0 ? c[ix.fecha] || null : null,
      rut_receptor: ix.rut >= 0 ? c[ix.rut] || null : null,
      razon_social: ix.razon >= 0 ? c[ix.razon] || null : null,
      monto_neto: ix.neto >= 0 && c[ix.neto] ? Number(c[ix.neto]) : null,
      monto_iva: ix.iva >= 0 && c[ix.iva] ? Number(c[ix.iva]) : null,
      monto_total: ix.total >= 0 && c[ix.total] ? Number(c[ix.total]) : null,
      raw: { row: c },
    };
  });
}

function parseBankCsv(text: string, sourceFileId: string) {
  const lines = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0] || '').map((h) => h.toLowerCase());
  const ix = {
    fecha: headers.indexOf('fecha'),
    descripcion: headers.indexOf('descripcion'),
    referencia: headers.indexOf('referencia'),
    monto: headers.indexOf('monto'),
    moneda: headers.indexOf('moneda'),
    tipo: headers.indexOf('tipo'),
  };
  return lines.slice(1).map((line) => {
    const c = splitCsvLine(line);
    return {
      source_file_id: sourceFileId,
      movimiento_fecha: ix.fecha >= 0 ? c[ix.fecha] || null : null,
      descripcion: ix.descripcion >= 0 ? c[ix.descripcion] || null : null,
      referencia: ix.referencia >= 0 ? c[ix.referencia] || null : null,
      monto: ix.monto >= 0 && c[ix.monto] ? Number(c[ix.monto]) : null,
      moneda: ix.moneda >= 0 ? c[ix.moneda] || 'CLP' : 'CLP',
      tipo: ix.tipo >= 0 ? c[ix.tipo] || null : null,
      raw: { row: c },
    };
  });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { supabase, profileId } = guard;

  const form = await request.formData();
  const sourceType = (form.get('sourceType') as SourceType | null) ?? null;
  const file = form.get('file');
  if (!sourceType || !['boletas', 'bancos', 'sii', 'notificaciones'].includes(sourceType)) {
    return NextResponse.json({ error: 'sourceType inválido' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Falta archivo' }, { status: 400 });
  }

  const path = `fuentes/${sourceType}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
  const { error: uploadError } = await supabase.storage.from('fuentes').upload(path, file, {
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: sourceFile, error: fileError } = await supabase
    .from('source_files')
    .insert({
      source_type: sourceType,
      filename: file.name,
      mime_type: file.type || null,
      storage_path: path,
      uploaded_by: profileId,
      status: 'uploaded',
      meta: { size: file.size },
    })
    .select('id')
    .single();

  if (fileError || !sourceFile) {
    return NextResponse.json({ error: fileError?.message || 'Error guardando archivo' }, { status: 500 });
  }

  let inserted = 0;
  if ((sourceType === 'boletas' || sourceType === 'bancos') && file.name.toLowerCase().endsWith('.csv')) {
    const text = await file.text();
    if (sourceType === 'boletas') {
      const rows = parseBoletasCsv(text, sourceFile.id as string).filter((r) => r.folio || r.razon_social);
      if (rows.length > 0) {
        const { error } = await supabase.from('boletas_ingest').insert(rows);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        inserted = rows.length;
      }
    } else {
      const rows = parseBankCsv(text, sourceFile.id as string).filter((r) => r.descripcion || r.monto != null);
      if (rows.length > 0) {
        const { error } = await supabase.from('bank_movements').insert(rows);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        inserted = rows.length;
      }
    }
  }

  const { error: statusError } = await supabase
    .from('source_files')
    .update({
      status: inserted > 0 ? 'ingested' : 'uploaded',
      meta: { size: file.size, inserted },
    })
    .eq('id', sourceFile.id);
  if (statusError) return NextResponse.json({ error: statusError.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    sourceFileId: sourceFile.id,
    inserted,
  });
}

