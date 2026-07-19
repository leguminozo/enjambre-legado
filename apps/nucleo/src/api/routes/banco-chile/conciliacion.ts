import type { AppVariables } from '@/api/lib/middleware';
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

/**
 * Router para conciliación bancaria manual
 * Movimientos banco ↔ ventas / gastos
 */
export const conciliacionRouter = new Hono<{ Variables: AppVariables }>();

// Listar movimientos pendientes
conciliacionRouter.get('/', async (c) => {
  try {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');

    const { data, error } = await supabase
      .from('banco_chile_movimientos')
      .select(`
        *,
        cuentas:banco_chile_cuentas (
          numero_cuenta,
          tipo_cuenta
        )
      `)
      .eq('empresa_id', empresaId)
      .eq('conciliado', false)
      .order('fecha_contable', { ascending: false });

    if (error) {
      return c.json({ code: 'list_failed', message: error.message }, 500);
    }

    return c.json({ data: data || [], movimientos: data || [] });
  } catch (error) {
    console.error('Error listing movimientos:', error);
    return c.json({ code: 'list_error', message: 'Error al listar movimientos' }, 500);
  }
});

// Conciliar movimiento con venta o gasto
conciliacionRouter.post(
  '/conciliar',
  zValidator(
    'json',
    z.object({
      movimientoId: z.string().uuid(),
      ventaId: z.string().uuid().optional(),
      gastoId: z.string().uuid().optional(),
      monto: z.number(),
      concepto: z.string().optional(),
    }),
  ),
  async (c) => {
    try {
      const supabase = c.get('supabase');
      const empresaId = c.get('empresaId');
      const { movimientoId, ventaId, gastoId, monto, concepto } = c.req.valid('json');

      if (!ventaId && !gastoId) {
        return c.json(
          { code: 'entity_required', message: 'Indicá ventaId o gastoId' },
          400,
        );
      }

      const { data: movimiento, error: moveError } = await supabase
        .from('banco_chile_movimientos')
        .select('id, empresa_id, conciliado, monto')
        .eq('id', movimientoId)
        .eq('empresa_id', empresaId)
        .maybeSingle();

      if (moveError || !movimiento) {
        return c.json({ code: 'not_found', message: 'Movimiento no encontrado' }, 404);
      }

      if (movimiento.conciliado) {
        return c.json(
          { code: 'already_conciliated', message: 'El movimiento ya está conciliado' },
          409,
        );
      }

      const { error: concilError } = await supabase.from('banco_chile_conciliaciones').insert({
        movimiento_id: movimientoId,
        venta_id: ventaId ?? null,
        gasto_id: gastoId ?? null,
        monto: monto,
        concepto: concepto ?? 'Conciliación manual',
        fecha_conciliacion: new Date().toISOString(),
        tipo_conciliacion: 'manual',
      });

      if (concilError) {
        return c.json({ code: 'conciliar_failed', message: concilError.message }, 500);
      }

      await supabase
        .from('banco_chile_movimientos')
        .update({ conciliado: true })
        .eq('id', movimientoId)
        .eq('empresa_id', empresaId);

      return c.json({ data: { success: true }, message: 'Movimiento conciliado' });
    } catch (error) {
      console.error('Error conciliando:', error);
      return c.json({ code: 'conciliar_error', message: 'Error al conciliar' }, 500);
    }
  },
);

// Desconciliar movimiento
conciliacionRouter.post('/desconciliar/:id', async (c) => {
  try {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');
    const { id } = c.req.param();

    const { data: mov } = await supabase
      .from('banco_chile_movimientos')
      .select('id')
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .maybeSingle();

    if (!mov) {
      return c.json({ code: 'not_found', message: 'Movimiento no encontrado' }, 404);
    }

    await supabase.from('banco_chile_conciliaciones').delete().eq('movimiento_id', id);

    await supabase
      .from('banco_chile_movimientos')
      .update({ conciliado: false })
      .eq('id', id)
      .eq('empresa_id', empresaId);

    return c.json({ data: { success: true }, message: 'Desconciliado' });
  } catch (error) {
    console.error('Error desconciliando:', error);
    return c.json({ code: 'desconciliar_error', message: 'Error al desconciliar' }, 500);
  }
});
