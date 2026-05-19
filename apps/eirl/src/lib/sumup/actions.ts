'use server';

import { createSumUpClient } from '@/lib/sumup/client';
import { CreateCheckoutParams, ConciliacionSumUp } from '@/lib/sumup/types';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Crear enlace de pago SumUp
 */
export async function crearLinkPago(data: {
  monto: number;
  descripcion: string;
  empresaId: string;
  facturaId?: string;
  tipo?: 'factura' | 'gasto' | 'servicio';
}) {
  try {
    const sumup = createSumUpClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const params: CreateCheckoutParams = {
      amount: data.monto,
      currency: 'CLP',
      description: data.descripcion,
      return_url: `${baseUrl}/pagos/confirmacion`,
      callback_url: `${baseUrl}/api/sumup/callback`,
      metadata: {
        empresa_id: data.empresaId,
        factura_id: data.facturaId,
        tipo: data.tipo || 'servicio',
      },
    };

    const result = await sumup.createCheckout(params);

    if (result.error) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    // Registrar en conciliación
    if (result.data) {
      await db.conciliacionSumUp.create({
        data: {
          empresaId: data.empresaId,
          checkoutId: result.data.checkout_id,
          monto: data.monto,
          estado: 'PENDIENTE',
          tipo: data.tipo || 'servicio',
          facturaId: data.facturaId,
          createdAt: new Date(),
        },
      });
    }

    revalidatePath('/pagos');
    
    return {
      success: true,
      checkoutUrl: result.data?.checkout_url,
      checkoutId: result.data?.checkout_id,
    };
  } catch (error) {
    console.error('Error creando link de pago:', error);
    return {
      success: false,
      error: 'Error al crear el enlace de pago',
    };
  }
}

/**
 * Listar transacciones SumUp
 */
export async function listarTransacciones(params?: {
  desde?: string;
  hasta?: string;
  estado?: 'SUCCESSFUL' | 'FAILED' | 'PENDING';
}) {
  try {
    const sumup = createSumUpClient();
    
    const result = await sumup.listTransactions({
      from: params?.desde,
      to: params?.hasta,
      status: params?.estado as any,
      limit: 100,
    });

    if (result.error) {
      return {
        success: false,
        error: result.error.message,
        data: [],
      };
    }

    return {
      success: true,
      data: result.data?.data || [],
      hasMore: result.data?.has_more || false,
    };
  } catch (error) {
    console.error('Error listando transacciones:', error);
    return {
      success: false,
      error: 'Error al listar transacciones',
      data: [],
    };
  }
}

/**
 * Conciliar transacción con factura/gasto
 */
export async function conciliarTransaccion(data: {
  transactionId: string;
  facturaId?: string;
  gastoId?: string;
  observaciones?: string;
}) {
  try {
    const sumup = createSumUpClient();
    
    // 1. Obtener detalles de la transacción
    const transactionResult = await sumup.getTransaction(data.transactionId);
    
    if (transactionResult.error || !transactionResult.data) {
      return {
        success: false,
        error: 'Transacción no encontrada',
      };
    }

    const transaction = transactionResult.data;
    
    // 2. Buscar conciliación existente
    const conciliacionExistente = await db.conciliacionSumUp.findFirst({
      where: {
        transactionId: data.transactionId,
      },
    });

    if (conciliacionExistente) {
      return {
        success: false,
        error: 'Transacción ya conciliada',
      };
    }

    // 3. Crear registro de conciliación
    await db.conciliacionSumUp.create({
      data: {
        empresaId: transaction.checkout?.metadata?.empresa_id || 'default',
        transactionId: data.transactionId,
        checkoutId: transaction.checkout?.checkout_id,
        monto: transaction.amount,
        comision: 0, // Calcular según fee de SumUp
        neto: transaction.amount,
        estado: 'CONCILIADO',
        tipo: transaction.checkout?.metadata?.tipo as any || 'servicio',
        facturaId: data.facturaId,
        observaciones: data.observaciones,
        createdAt: new Date(transaction.timestamp),
      },
    });

    // 4. Si hay factura_id en metadata, actualizar estado de factura
    if (data.facturaId) {
      await db.facturaEmitida.update({
        where: { id: data.facturaId },
        data: {
          estado: 'PAGADA',
          fechaVencimiento: new Date(transaction.timestamp),
        },
      });
    }

    revalidatePath('/conciliacion');
    revalidatePath('/facturas');
    
    return {
      success: true,
      data: transaction,
    };
  } catch (error) {
    console.error('Error conciliando transacción:', error);
    return {
      success: false,
      error: 'Error al conciliar transacción',
    };
  }
}

/**
 * Generar reporte de conciliación
 */
export async function generarConciliacion(params: {
  empresaId: string;
  desde: string;
  hasta: string;
}): Promise<{ success: boolean; data?: ConciliacionSumUp; error?: string }> {
  try {
    const sumup = createSumUpClient();
    
    // 1. Obtener transacciones de SumUp
    const transactionsResult = await sumup.listTransactions({
      from: params.desde,
      to: params.hasta,
    });

    if (transactionsResult.error || !transactionsResult.data) {
      return {
        success: false,
        error: 'Error al obtener transacciones de SumUp',
      };
    }

    const transactions = transactionsResult.data.data || [];
    
    // 2. Obtener conciliaciones existentes
    const conciliaciones = await db.conciliacionSumUp.findMany({
      where: {
        empresaId: params.empresaId,
        createdAt: {
          gte: new Date(params.desde),
          lte: new Date(params.hasta),
        },
      },
    });

    // 3. Calcular totales
    const montoTotal = transactions.reduce((sum, t) => sum + t.amount, 0);
    const montoComisiones = 0; // Calcular según fees reales
    const montoNeto = montoTotal - montoComisiones;

    // 4. Detectar diferencias
    const diferencias = transactions
      .filter(t => {
        const conciliado = conciliaciones.find(c => c.transactionId === t.transaction_id);
        return !conciliado;
      })
      .map(t => ({
        tipo: 'falta_factura' as const,
        transactionId: t.transaction_id,
        expected: t.amount,
        actual: 0,
      }));

    return {
      success: true,
      data: {
        empresaId: params.empresaId,
        periodo: `${params.desde} - ${params.hasta}`,
        totalTransacciones: transactions.length,
        montoTotal,
        montoComisiones,
        montoNeto,
        transacciones: transactions.map(t => ({
          transaction_id: t.transaction_id,
          amount: t.amount,
          fee: 0,
          net: t.amount,
          status: t.status,
          timestamp: t.timestamp,
          conciliated: conciliaciones.some(c => c.transactionId === t.transaction_id),
        })),
        diferencias,
      },
    };
  } catch (error) {
    console.error('Error generando conciliación:', error);
    return {
      success: false,
      error: 'Error al generar conciliación',
    };
  }
}

/**
 * Reembolsar transacción
 */
export async function reembolsarTransaccion(data: {
  transactionId: string;
  monto?: number;
  razon?: string;
}) {
  try {
    const sumup = createSumUpClient();
    
    const result = await sumup.refundTransaction(
      data.transactionId,
      data.monto
    );

    if (result.error) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    // Actualizar estado en DB
    if (result.data) {
      await db.conciliacionSumUp.updateMany({
        where: {
          transactionId: data.transactionId,
        },
        data: {
          estado: 'REEMBOLSADO',
          observaciones: data.razon,
        },
      });
    }

    revalidatePath('/conciliacion');
    
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Error reembolsando transacción:', error);
    return {
      success: false,
      error: 'Error al reembolsar transacción',
    };
  }
}
