import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Webhook handler para eventos de SumUp
 * 
 * Configurar en SumUp Dashboard:
 * Settings → API → Webhooks
 * URL: https://tu-app.com/api/sumup/webhook
 * Eventos: checkout.completed, transaction.successful, payout.paid
 */

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar firma (opcional pero recomendado)
    // const signature = request.headers.get('x-sumup-signature');
    // const isValid = verifySignature(body, signature);
    // if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });

    const body = await request.json();
    const { type, data } = body;

    console.log(`🔔 Webhook SumUp recibido: ${type}`);

    // 2. Procesar según tipo de evento
    switch (type) {
      case 'checkout.completed':
        await handleCheckoutCompleted(data);
        break;
      
      case 'transaction.successful':
        await handleTransactionSuccessful(data);
        break;
      
      case 'transaction.failed':
        await handleTransactionFailed(data);
        break;
      
      case 'payout.paid':
        await handlePayoutPaid(data);
        break;
      
      default:
        console.log(`Evento no manejado: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Manejar checkout completado
 */
async function handleCheckoutCompleted(data: any) {
  const { checkout_id, amount, metadata } = data;

  console.log(`✅ Checkout completado: ${checkout_id}, monto: ${amount}`);

  // Actualizar estado en conciliación
  await db.conciliacionSumUp.updateMany({
    where: {
      checkoutId: checkout_id,
    },
    data: {
      estado: 'CONCILIADO',
      updatedAt: new Date(),
    },
  });

  // Si hay metadata de factura, actualizar estado
  if (metadata?.factura_id) {
    await db.facturaEmitida.update({
      where: { id: metadata.factura_id },
      data: {
        estado: 'PAGADA',
        updatedAt: new Date(),
      },
    });
  }

  // Notificar por Socket.IO (si está configurado)
  // io.to(metadata?.empresa_id || 'default').emit('pago:completado', data);
}

/**
 * Manejar transacción exitosa
 */
async function handleTransactionSuccessful(data: any) {
  const { transaction_id, amount, checkout } = data;

  console.log(`💰 Transacción exitosa: ${transaction_id}, monto: ${amount}`);

  // Buscar conciliación por checkout
  const conciliacion = await db.conciliacionSumUp.findFirst({
    where: {
      checkoutId: checkout?.checkout_id,
    },
  });

  if (!conciliacion) {
    // Crear registro si no existe
    await db.conciliacionSumUp.create({
      data: {
        empresaId: checkout?.metadata?.empresa_id || 'default',
        checkoutId: checkout?.checkout_id,
        transactionId: transaction_id,
        monto: amount,
        comision: 0, // Calcular según fee de SumUp
        neto: amount,
        estado: 'CONCILIADO',
        tipo: checkout?.metadata?.tipo || 'servicio',
        facturaId: checkout?.metadata?.factura_id,
        createdAt: new Date(),
      },
    });
  } else {
    // Actualizar existente
    await db.conciliacionSumUp.update({
      where: { id: conciliacion.id },
      data: {
        transactionId: transaction_id,
        monto: amount,
        neto: amount,
        estado: 'CONCILIADO',
      },
    });
  }
}

/**
 * Manejar transacción fallida
 */
async function handleTransactionFailed(data: any) {
  const { transaction_id, checkout } = data;

  console.log(`❌ Transacción fallida: ${transaction_id}`);

  await db.conciliacionSumUp.updateMany({
    where: {
      checkoutId: checkout?.checkout_id,
    },
    data: {
      estado: 'FALLIDO',
      observaciones: 'Transacción fallida en SumUp',
    },
  });
}

/**
 * Manejar payout pagado
 */
async function handlePayoutPaid(data: any) {
  const { payout_id, amount, transactions_count } = data;

  console.log(`💸 Payout pagado: ${payout_id}, monto: ${amount}, transacciones: ${transactions_count}`);

  // Registrar payout (opcional, si llevas control)
  // await db.payout.create({ ... })
}

// ==================== GET handler para test ====================

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString(),
  });
}
