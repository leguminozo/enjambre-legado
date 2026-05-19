import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireEirlAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authError = requireEirlAuth(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId');
    const tipo = searchParams.get('tipo');

    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa ID es requerido' }, { status: 400 });
    }

    const whereClause: { empresaId: string; tipo?: string } = { empresaId };
    if (tipo) {
      whereClause.tipo = tipo;
    }

    const terceros = await db.tercero.findMany({
      where: whereClause,
      orderBy: {
        nombre: 'asc'
      }
    });

    return NextResponse.json(terceros);
  } catch (error) {
    console.error('Error obteniendo terceros:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError2 = requireEirlAuth(request);
  if (authError2) return authError2;
  try {
    const body = await request.json();
    const { empresaId, tipo, rut, nombre, email, telefono, direccion, giro } = body;

    if (!empresaId || !tipo || !rut || !nombre) {
      return NextResponse.json({ error: 'Empresa ID, tipo, RUT y nombre son requeridos' }, { status: 400 });
    }

    const existingTercero = await db.tercero.findUnique({
      where: { rut }
    });

    if (existingTercero) {
      return NextResponse.json({ error: 'Ya existe un tercero con ese RUT' }, { status: 400 });
    }

    const tercero = await db.tercero.create({
      data: {
        empresaId,
        tipo,
        rut,
        nombre,
        email: email || null,
        telefono: telefono || null,
        direccion: direccion || null,
        giro: giro || null
      }
    });

    return NextResponse.json(tercero, { status: 201 });
  } catch (error) {
    console.error('Error creando tercero:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}