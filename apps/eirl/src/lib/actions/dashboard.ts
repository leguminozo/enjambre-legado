'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface DashboardData {
  periodo: {
    nombre: string;
    estado: string;
    mes: number;
    anio: number;
  };
  metricas: {
    ingresosMes: number;
    gastosMes: number;
    utilidadNeta: number;
    margenUtilidad: number;
    ivaDebito: number;
    ivaCredito: number;
    ivaPagar: number;
    ppm: number;
  };
  resumen: {
    totalFacturasEmitidas: number;
    totalFacturasRecibidas: number;
    totalGastos: number;
    facturasPendientes: number;
  };
  calculosIA: Array<{
    id: string;
    tipo: string;
    resultado: string;
    confianza?: number;
    estado: string;
    createdAt: string;
  }>;
}

export async function getDashboardData(empresaId: string, periodo: string = 'actual'): Promise<DashboardData> {
  if (!empresaId) {
    throw new Error('Empresa ID es requerido');
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

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
    const [year, month] = periodo.split('-').map(Number);
    periodoContable = await db.periodoContable.findFirst({
      where: {
        empresaId,
        mes: month,
        anio: year
      }
    });
  }

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

  const facturasEmitidas = await db.facturaEmitida.findMany({
    where: {
      empresaId,
      periodoId: periodoContable.id
    }
  });

  const facturasRecibidas = await db.facturaRecibida.findMany({
    where: {
      empresaId,
      periodoId: periodoContable.id
    }
  });

  const gastos = await db.gasto.findMany({
    where: {
      empresaId,
      periodoId: periodoContable.id
    }
  });

  const ingresosMes = facturasEmitidas.reduce((sum, factura) => sum + factura.montoNeto, 0);
  const gastosMes = gastos.reduce((sum, gasto) => sum + gasto.montoNeto, 0);
  const utilidadNeta = ingresosMes - gastosMes;
  const margenUtilidad = ingresosMes > 0 ? (utilidadNeta / ingresosMes) * 100 : 0;

  const ivaDebito = facturasEmitidas.reduce((sum, factura) => sum + factura.montoIva, 0);
  const ivaCredito = facturasRecibidas.reduce((sum, factura) => sum + factura.montoIva, 0) +
    gastos.reduce((sum, gasto) => sum + gasto.montoIva, 0);
  const ivaPagar = Math.max(0, ivaDebito - ivaCredito);

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

  return {
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
  };
}

export async function refreshDashboardData() {
  revalidatePath('/');
}
