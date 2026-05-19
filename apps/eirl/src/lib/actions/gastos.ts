'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const gastoSchema = z.object({
  empresaId: z.string().min(1, 'Empresa ID es requerido'),
  proveedorId: z.string().optional(),
  fecha: z.string(),
  descripcion: z.string().min(1, 'Descripción es requerida'),
  monto: z.number().positive(),
  montoIva: z.number().positive(),
  montoNeto: z.number().positive(),
  categoria: z.string().min(1, 'Categoría es requerida'),
  tipoComprobante: z.string().min(1, 'Tipo de comprobante es requerido'),
  numeroComprobante: z.string().optional(),
  estado: z.string().default('Pendiente')
});

export type GastoFormData = z.infer<typeof gastoSchema>;

export async function createGasto(data: GastoFormData) {
  try {
    const validated = gastoSchema.parse(data);
    
    const fechaGasto = new Date(validated.fecha);
    const currentMonth = fechaGasto.getMonth() + 1;
    const currentYear = fechaGasto.getFullYear();

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

    const gasto = await db.gasto.create({
      data: {
        empresaId: validated.empresaId,
        proveedorId: validated.proveedorId || null,
        periodoId: periodo.id,
        fecha: fechaGasto,
        descripcion: validated.descripcion,
        monto: validated.monto,
        montoIva: validated.montoIva,
        montoNeto: validated.montoNeto,
        categoria: validated.categoria,
        tipoComprobante: validated.tipoComprobante,
        numeroComprobante: validated.numeroComprobante || null,
        estado: validated.estado
      },
      include: {
        proveedor: true,
        periodo: true
      }
    });

    revalidatePath('/');
    revalidatePath('/gastos');
    
    return { success: true, data: gasto };
  } catch (error) {
    console.error('Error creando gasto:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    };
  }
}

export async function getGastos(empresaId: string, periodoId?: string) {
  const where: { empresaId: string; periodoId?: string } = { empresaId };
  if (periodoId) {
    where.periodoId = periodoId;
  }

  const gastos = await db.gasto.findMany({
    where,
    include: {
      proveedor: true,
      periodo: true
    },
    orderBy: {
      fecha: 'desc'
    }
  });

  return gastos;
}

export async function deleteGasto(id: string) {
  await db.gasto.delete({
    where: { id }
  });
  
  revalidatePath('/');
  revalidatePath('/gastos');
}
