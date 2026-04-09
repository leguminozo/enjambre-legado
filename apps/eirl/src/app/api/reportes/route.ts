import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId');
    const tipo = searchParams.get('tipo');
    const periodo = searchParams.get('periodo');

    if (!empresaId || !tipo) {
      return NextResponse.json({ error: 'Empresa ID y tipo son requeridos' }, { status: 400 });
    }

    const reportes = await db.reporte.findMany({
      where: {
        empresaId,
        ...(tipo && { tipo }),
        ...(periodo && { periodo })
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(reportes);
  } catch (error) {
    console.error('Error obteniendo reportes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { empresaId, tipo, periodo, mes, anio } = body;

    if (!empresaId || !tipo) {
      return NextResponse.json({ error: 'Empresa ID y tipo son requeridos' }, { status: 400 });
    }

    // Crear registro de reporte
    const reporte = await db.reporte.create({
      data: {
        empresaId,
        tipo,
        periodo: periodo || 'Mensual',
        mes,
        anio,
        datos: '{}',
        estado: 'Generando'
      }
    });

    // Generar datos del reporte según el tipo
    let datosReporte: any = {};

    switch (tipo) {
      case 'BalanceGeneral':
        datosReporte = await generarBalanceGeneral(empresaId, anio, mes);
        break;
      case 'EstadoResultados':
        datosReporte = await generarEstadoResultados(empresaId, anio, mes);
        break;
      case 'FlujoEfectivo':
        datosReporte = await generarFlujoEfectivo(empresaId, anio, mes);
        break;
      case 'LibroCompras':
        datosReporte = await generarLibroCompras(empresaId, anio, mes);
        break;
      case 'LibroVentas':
        datosReporte = await generarLibroVentas(empresaId, anio, mes);
        break;
      default:
        throw new Error(`Tipo de reporte no soportado: ${tipo}`);
    }

    // Actualizar reporte con datos generados
    await db.reporte.update({
      where: { id: reporte.id },
      data: {
        datos: JSON.stringify(datosReporte),
        estado: 'Completado'
      }
    });

    return NextResponse.json({
      ...reporte,
      datos: datosReporte
    });

  } catch (error) {
    console.error('Error generando reporte:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error interno del servidor' }, { status: 500 });
  }
}

async function generarBalanceGeneral(empresaId: string, anio?: number, mes?: number) {
  // Obtener períodos contables
  const whereClause: any = { empresaId };
  if (anio) whereClause.anio = anio;
  if (mes) whereClause.mes = mes;

  const periodos = await db.periodoContable.findMany({
    where: whereClause,
    include: {
      facturasEmitidas: true,
      facturasRecibidas: true,
      gastos: true
    }
  });

  // Calcular totales
  const totales = periodos.reduce((acc, periodo) => {
    const ingresos = periodo.facturasEmitidas.reduce((sum, f) => sum + f.montoNeto, 0);
    const egresos = periodo.gastos.reduce((sum, g) => sum + g.montoNeto, 0);
    
    return {
      ingresosNetos: acc.ingresosNetos + ingresos,
      egresosNetos: acc.egresosNetos + egresos,
      utilidadNeta: acc.utilidadNeta + (ingresos - egresos)
    };
  }, { ingresosNetos: 0, egresosNetos: 0, utilidadNeta: 0 });

  return {
    tipo: 'BalanceGeneral',
    fechaGeneracion: new Date().toISOString(),
    periodo: mes ? `${mes}/${anio}` : `${anio}`,
    activos: {
      corriente: totales.ingresosNetos,
      noCorriente: 0
    },
    pasivos: {
      corriente: totales.egresosNetos,
      noCorriente: 0
    },
    patrimonio: {
      capital: 1000000, // Valor base
      utilidadesAcumuladas: totales.utilidadNeta
    },
    totales
  };
}

async function generarEstadoResultados(empresaId: string, anio?: number, mes?: number) {
  const whereClause: any = { empresaId };
  if (anio) whereClause.anio = anio;
  if (mes) whereClause.mes = mes;

  const periodos = await db.periodoContable.findMany({
    where: whereClause,
    include: {
      facturasEmitidas: true,
      facturasRecibidas: true,
      gastos: true
    }
  });

  const ingresos = periodos.reduce((acc, periodo) => {
    const ingresosNetos = periodo.facturasEmitidas.reduce((sum, f) => sum + f.montoNeto, 0);
    const ivaDebito = periodo.facturasEmitidas.reduce((sum, f) => sum + f.montoIva, 0);
    
    return {
      netos: acc.netos + ingresosNetos,
      iva: acc.iva + ivaDebito,
      total: acc.total + ingresosNetos + ivaDebito
    };
  }, { netos: 0, iva: 0, total: 0 });

  const gastos = periodos.reduce((acc, periodo) => {
    const gastosNetos = periodo.gastos.reduce((sum, g) => sum + g.montoNeto, 0);
    const ivaCredito = periodo.gastos.reduce((sum, g) => sum + g.montoIva, 0);
    
    return {
      netos: acc.netos + gastosNetos,
      iva: acc.iva + ivaCredito,
      total: acc.total + gastosNetos + ivaCredito
    };
  }, { netos: 0, iva: 0, total: 0 });

  const utilidadBruta = ingresos.netos - gastos.netos;
  const utilidadNeta = utilidadBruta - (ingresos.iva - gastos.iva);

  return {
    tipo: 'EstadoResultados',
    fechaGeneracion: new Date().toISOString(),
    periodo: mes ? `${mes}/${anio}` : `${anio}`,
    ingresos,
    gastos,
    utilidadBruta,
    utilidadNeta,
    margenUtilidad: ingresos.netos > 0 ? (utilidadNeta / ingresos.netos) * 100 : 0
  };
}

async function generarFlujoEfectivo(empresaId: string, anio?: number, mes?: number) {
  const whereClause: any = { empresaId };
  if (anio) whereClause.anio = anio;
  if (mes) whereClause.mes = mes;

  const periodos = await db.periodoContable.findMany({
    where: whereClause,
    include: {
      facturasEmitidas: true,
      gastos: true
    }
  });

  const flujoOperacion = periodos.reduce((acc, periodo) => {
    const ingresosCobrados = periodo.facturasEmitidas
      .filter(f => f.estado === 'Pagada')
      .reduce((sum, f) => sum + f.montoTotal, 0);
    
    const gastosPagados = periodo.gastos
      .filter(g => g.estado === 'Pagado')
      .reduce((sum, g) => sum + g.monto, 0);
    
    return acc + (ingresosCobrados - gastosPagados);
  }, 0);

  return {
    tipo: 'FlujoEfectivo',
    fechaGeneracion: new Date().toISOString(),
    periodo: mes ? `${mes}/${anio}` : `${anio}`,
    flujoOperacion,
    flujoInversion: 0,
    flujoFinanciacion: 0,
    flujoNeto: flujoOperacion,
    saldoInicial: 0,
    saldoFinal: flujoOperacion
  };
}

async function generarLibroCompras(empresaId: string, anio?: number, mes?: number) {
  const whereClause: any = { empresaId };
  if (anio) whereClause.anio = anio;
  if (mes) whereClause.mes = mes;

  const periodos = await db.periodoContable.findMany({
    where: whereClause,
    include: {
      facturasRecibidas: {
        include: {
          proveedor: true
        }
      },
      gastos: {
        include: {
          proveedor: true
        }
      }
    }
  });

  const compras: any[] = [];

  periodos.forEach(periodo => {
    // Agregar facturas recibidas
    periodo.facturasRecibidas.forEach(factura => {
      compras.push({
        tipo: 'Factura',
        fecha: factura.fecha,
        numero: factura.numero,
        proveedor: factura.proveedor?.nombre || 'Sin proveedor',
        rutProveedor: factura.proveedor?.rut || '',
        montoNeto: factura.montoNeto,
        montoIva: factura.montoIva,
        montoTotal: factura.montoTotal,
        tipoDocumento: factura.tipoDocumento,
        periodo: periodo.nombre
      });
    });

    // Agregar gastos con boletas
    periodo.gastos.forEach(gasto => {
      if (gasto.tipoComprobante === 'Boleta') {
        compras.push({
          tipo: 'Boleta',
          fecha: gasto.fecha,
          numero: gasto.numeroComprobante || '',
          proveedor: gasto.proveedor?.nombre || 'Sin proveedor',
          rutProveedor: gasto.proveedor?.rut || '',
          montoNeto: gasto.montoNeto,
          montoIva: gasto.montoIva,
          montoTotal: gasto.monto,
          tipoDocumento: gasto.tipoComprobante,
          periodo: periodo.nombre
        });
      }
    });
  });

  return {
    tipo: 'LibroCompras',
    fechaGeneracion: new Date().toISOString(),
    periodo: mes ? `${mes}/${anio}` : `${anio}`,
    compras,
    resumen: {
      totalNeto: compras.reduce((sum, c) => sum + c.montoNeto, 0),
      totalIva: compras.reduce((sum, c) => sum + c.montoIva, 0),
      totalTotal: compras.reduce((sum, c) => sum + c.montoTotal, 0),
      cantidadCompras: compras.length
    }
  };
}

async function generarLibroVentas(empresaId: string, anio?: number, mes?: number) {
  const whereClause: any = { empresaId };
  if (anio) whereClause.anio = anio;
  if (mes) whereClause.mes = mes;

  const periodos = await db.periodoContable.findMany({
    where: whereClause,
    include: {
      facturasEmitidas: {
        include: {
          cliente: true
        }
      }
    }
  });

  const ventas: any[] = [];

  periodos.forEach(periodo => {
    periodo.facturasEmitidas.forEach(factura => {
      ventas.push({
        tipo: 'Factura',
        fecha: factura.fecha,
        numero: factura.numero,
        cliente: factura.cliente?.nombre || 'Sin cliente',
        rutCliente: factura.cliente?.rut || '',
        montoNeto: factura.montoNeto,
        montoIva: factura.montoIva,
        montoTotal: factura.montoTotal,
        tipoDocumento: factura.tipoDocumento,
        estado: factura.estado,
        periodo: periodo.nombre
      });
    });
  });

  return {
    tipo: 'LibroVentas',
    fechaGeneracion: new Date().toISOString(),
    periodo: mes ? `${mes}/${anio}` : `${anio}`,
    ventas,
    resumen: {
      totalNeto: ventas.reduce((sum, v) => sum + v.montoNeto, 0),
      totalIva: ventas.reduce((sum, v) => sum + v.montoIva, 0),
      totalTotal: ventas.reduce((sum, v) => sum + v.montoTotal, 0),
      cantidadVentas: ventas.length
    }
  };
}