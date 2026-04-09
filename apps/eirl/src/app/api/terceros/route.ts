import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo'); // "Cliente" o "Proveedor"

    const whereClause: any = {};
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
  try {
    const body = await request.json();
    const { tipo, rut, nombre, email, telefono, direccion, giro } = body;

    // Validaciones básicas
    if (!tipo || !rut || !nombre) {
      return NextResponse.json({ error: 'Tipo, RUT y nombre son requeridos' }, { status: 400 });
    }

    // Verificar si ya existe un tercero con ese RUT
    const existingTercero = await db.tercero.findUnique({
      where: { rut }
    });

    if (existingTercero) {
      return NextResponse.json({ error: 'Ya existe un tercero con ese RUT' }, { status: 400 });
    }

    // Crear tercero
    const tercero = await db.tercero.create({
      data: {
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