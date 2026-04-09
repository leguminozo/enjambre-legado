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

    const facturas = await db.facturaEmitida.findMany({
      where: whereClause,
      include: {
        cliente: true,
        periodo: true
      },
      orderBy: {
        fecha: 'desc'
      }
    });

    return NextResponse.json(facturas);
  } catch (error) {
    console.error('Error obteniendo facturas emitidas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      empresaId,
      clienteId,
      numero,
      fecha,
      fechaVencimiento,
      montoTotal,
      montoNeto,
      montoIva,
      montoExento = 0,
      montoIvaUsado = 0,
      descripcion,
      tipoDocumento = 'Factura'
    } = body;

    // Validaciones básicas
    if (!empresaId || !numero || !fecha || !montoTotal || !montoNeto || !montoIva) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Obtener o crear período contable
    const fechaFactura = new Date(fecha);
    const currentMonth = fechaFactura.getMonth() + 1;
    const currentYear = fechaFactura.getFullYear();

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

    // Crear factura
    const factura = await db.facturaEmitida.create({
      data: {
        empresaId,
        clienteId: clienteId || null,
        periodoId: periodo.id,
        numero,
        fecha: fechaFactura,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        montoTotal: parseFloat(montoTotal),
        montoNeto: parseFloat(montoNeto),
        montoIva: parseFloat(montoIva),
        montoExento: parseFloat(montoExento),
        montoIvaUsado: parseFloat(montoIvaUsado),
        descripcion: descripcion || null,
        tipoDocumento,
        estado: 'Pendiente'
      },
      include: {
        cliente: true,
        periodo: true
      }
    });

    return NextResponse.json(factura, { status: 201 });
  } catch (error) {
    console.error('Error creando factura emitida:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}