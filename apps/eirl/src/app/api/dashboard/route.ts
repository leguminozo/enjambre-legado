import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId');
    const periodo = searchParams.get('periodo') || 'actual';

    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa ID es requerido' }, { status: 400 });
    }

    // Obtener fecha actual
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Obtener período actual
    let periodoContable;
    if (periodo === 'actual') {
      periodoContable = await db.periodoContable.findFirst({
        where: {
          empresaId,
          mes: currentMonth,
          anio: currentYear
        }
      });
    } else {
      // Parsear período en formato "YYYY-MM"
      const [year, month] = periodo.split('-').map(Number);
      periodoContable = await db.periodoContable.findFirst({
        where: {
          empresaId,
          mes: month,
          anio: year
        }
      });
    }

    // Si no existe el período, crearlo
    if (!periodoContable) {
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0);
      
      periodoContable = await db.periodoContable.create({
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

    // Obtener facturas emitidas del período
    const facturasEmitidas = await db.facturaEmitida.findMany({
      where: {
        empresaId,
        periodoId: periodoContable.id
      }
    });

    // Obtener facturas recibidas del período
    const facturasRecibidas = await db.facturaRecibida.findMany({
      where: {
        empresaId,
        periodoId: periodoContable.id
      }
    });

    // Obtener gastos del período
    const gastos = await db.gasto.findMany({
      where: {
        empresaId,
        periodoId: periodoContable.id
      }
    });

    // Calcular métricas
    const ingresosMes = facturasEmitidas.reduce((sum, factura) => sum + factura.montoNeto, 0);
    const gastosMes = gastos.reduce((sum, gasto) => sum + gasto.montoNeto, 0);
    const utilidadNeta = ingresosMes - gastosMes;
    const margenUtilidad = ingresosMes > 0 ? (utilidadNeta / ingresosMes) * 100 : 0;

    // Calcular IVA
    const ivaDebito = facturasEmitidas.reduce((sum, factura) => sum + factura.montoIva, 0);
    const ivaCredito = facturasRecibidas.reduce((sum, factura) => sum + factura.montoIva, 0) + 
                      gastos.reduce((sum, gasto) => sum + gasto.montoIva, 0);
    const ivaPagar = Math.max(0, ivaDebito - ivaCredito);

    // Obtener último cálculo de PPM si existe
    const ultimoPPM = await db.impuesto.findFirst({
      where: {
        empresaId,
        tipo: 'PPM',
        anio: currentYear
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Obtener cálculos de IA recientes
    const calculosIA = await db.calculoIA.findMany({
      where: {
        empresaId,
        estado: 'Completado'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    return NextResponse.json({
      periodo: periodoContable,
      metricas: {
        ingresosMes,
        gastosMes,
        utilidadNeta,
        margenUtilidad,
        ivaDebito,
        ivaCredito,
        ivaPagar,
        ppm: ultimoPPM?.montoCalculadoIA || 0
      },
      resumen: {
        totalFacturasEmitidas: facturasEmitidas.length,
        totalFacturasRecibidas: facturasRecibidas.length,
        totalGastos: gastos.length,
        facturasPendientes: facturasEmitidas.filter(f => f.estado === 'Pendiente').length
      },
      calculosIA
    });

  } catch (error) {
    console.error('Error en dashboard API:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}