'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const facturaSchema = z.object({
  empresaId: z.string().min(1, 'Empresa ID es requerido'),
  clienteId: z.string().optional(),
  numero: z.string().min(1, 'Número es requerido'),
  fecha: z.string(),
  fechaVencimiento: z.string().optional(),
  montoTotal: z.number().positive(),
  montoNeto: z.number().positive(),
  montoIva: z.number().positive(),
  montoExento: z.number().optional().default(0),
  montoIvaUsado: z.number().optional().default(0),
  descripcion: z.string().optional(),
  tipoDocumento: z.string().default('Factura')
});

export type FacturaFormData = z.infer<typeof facturaSchema>;

export async function createFacturaEmitida(data: FacturaFormData) {
  try {
    const validated = facturaSchema.parse(data);
    
    const fechaFactura = new Date(validated.fecha);
    const currentMonth = fechaFactura.getMonth() + 1;
    const currentYear = fechaFactura.getFullYear();

    let periodo = await db.periodoContable.findFirst({
      where: {
        empresaId: validated.empresaId,
        mes: currentMonth,
        anio: currentYear
      }
    });

    if (!periodo) {
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0);

      periodo = await db.periodoContable.create({
        data: {
          empresaId: validated.empresaId,
          nombre: `${new Date(currentYear, currentMonth - 1).toLocaleDateString('es-ES', { month: 'long' })} ${currentYear}`,
          mes: currentMonth,
          anio: currentYear,
          fechaInicio: startDate,
          fechaTermino: endDate,
          estado: 'Abierto'
        }
      });
    }

    const factura = await db.facturaEmitida.create({
      data: {
        empresaId: validated.empresaId,
        clienteId: validated.clienteId || null,
        periodoId: periodo.id,
        numero: validated.numero,
        fecha: fechaFactura,
        fechaVencimiento: validated.fechaVencimiento ? new Date(validated.fechaVencimiento) : null,
        montoTotal: validated.montoTotal,
        montoNeto: validated.montoNeto,
        montoIva: validated.montoIva,
        montoExento: validated.montoExento || 0,
        montoIvaUsado: validated.montoIvaUsado || 0,
        descripcion: validated.descripcion || null,
        tipoDocumento: validated.tipoDocumento,
        estado: 'Pendiente'
      },
      include: {
        cliente: true,
        periodo: true
      }
    });

    revalidatePath('/');
    revalidatePath('/facturas');
    
    return { success: true, data: factura };
  } catch (error) {
    console.error('Error creando factura:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    };
  }
}

export async function getFacturasEmitidas(empresaId: string, periodoId?: string) {
  const where: { empresaId: string; periodoId?: string } = { empresaId };
  if (periodoId) {
    where.periodoId = periodoId;
  }

  const facturas = await db.facturaEmitida.findMany({
    where,
    include: {
      cliente: true,
      periodo: true
    },
    orderBy: {
      fecha: 'desc'
    }
  });

  return facturas;
}

export async function deleteFacturaEmitida(id: string) {
  await db.facturaEmitida.delete({
    where: { id }
  });
  
  revalidatePath('/');
  revalidatePath('/facturas');
}
