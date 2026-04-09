import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId');
    const periodoId = searchParams.get('periodoId');

    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa ID es requerido' }, { status: 400 });
    }

    const whereClause: any = { empresaId };
    if (periodoId) {
      whereClause.periodoId = periodoId;
    }

    const gastos = await db.gasto.findMany({
      where: whereClause,
      include: {
        proveedor: true,
        periodo: true
      },
      orderBy: {
        fecha: 'desc'
      }
    });

    return NextResponse.json(gastos);
  } catch (error) {
    console.error('Error obteniendo gastos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      empresaId,
      proveedorId,
      fecha,
      descripcion,
      monto,
      montoIva,
      montoNeto,
      categoria,
      tipoComprobante,
      numeroComprobante,
      estado = 'Pendiente'
    } = body;

    // Validaciones básicas
    if (!empresaId || !fecha || !descripcion || !monto || !categoria) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Calcular montos si no se proporcionan
    const montoFinal = parseFloat(monto);
    const ivaCalculado = parseFloat(montoIva) || (montoFinal * 0.19);
    const netoCalculado = parseFloat(montoNeto) || (montoFinal - ivaCalculado);

    // Obtener o crear período contable
    const fechaGasto = new Date(fecha);
    const currentMonth = fechaGasto.getMonth() + 1;
    const currentYear = fechaGasto.getFullYear();

    let periodo = await db.periodoContable.findFirst({
      where: {
        empresaId,
        mes: currentMonth,
        anio: currentYear
      }
    });

    if (!periodo) {
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0);
      
      periodo = await db.periodoContable.create({
        data: {
          empresaId,
          nombre: `${new Date(currentYear, currentMonth - 1).toLocaleDateString('es-ES', { month: 'long' })} ${currentYear}`,
          mes: currentMonth,
          anio: currentYear,
          fechaInicio: startDate,
          fechaTermino: endDate,
          estado: 'Abierto'
        }
      });
    }

    // Crear gasto
    const gasto = await db.gasto.create({
      data: {
        empresaId,
        proveedorId: proveedorId || null,
        periodoId: periodo.id,
        fecha: fechaGasto,
        descripcion,
        monto: montoFinal,
        montoIva: ivaCalculado,
        montoNeto: netoCalculado,
        categoria,
        tipoComprobante: tipoComprobante || 'Boleta',
        numeroComprobante: numeroComprobante || null,
        estado
      },
      include: {
        proveedor: true,
        periodo: true
      }
    });

    return NextResponse.json(gasto, { status: 201 });
  } catch (error) {
    console.error('Error creando gasto:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}