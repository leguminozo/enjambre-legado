import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

/**
 * Router para conciliación bancaria
 * Permite conciliar movimientos bancarios con ventas/gastos
 */
export const conciliacionRouter = new Hono();

// Listar movimientos para conciliar
conciliacionRouter.get('/', async (c) => {
  try {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');

    const { data, error } = await supabase
      .from('banco_chile_movimientos')
      .select(`
        *,
        cuentas:bano_chile_cuentas (
          numero_cuenta,
          tipo_cuenta
        )
      `)
      .eq('empresa_id', empresaId)
      .is('conciliado', false)
      .order('fecha_contable', { ascending: false });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ movimientos: data || [] });
  } catch (error) {
    console.error('Error listing movimientos:', error);
    return c.json({ error: 'Error al listar movimientos' }, 500);
  }
});

// Conciliar movimiento con venta
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
    })
  ),
  async (c) => {
    try {
      const supabase = c.get('supabase');
      const { movimientoId, ventaId, gastoId, monto, concepto } = c.req.valid('json');

      // Verificar que el movimiento existe
      const { data: movimiento, error: moveError } = await supabase
        .from('banco_chile_movimientos')
        .select('*')
        .eq('id', movimientoId)
        .single();

      if (moveError || !movimiento) {
        return c.json({ error: 'Movimiento no encontrado' }, 404);
      }

      // Crear registro de conciliación
      const { error: concilError } = await supabase
        .from('banco_chile_conciliaciones')
        .insert({
          movimiento_id: movimientoId,
          venta_id: ventaId,
          gasto_id: gastoId,
          monto: monto,
          concepto: concepto,
          fecha_conciliacion: new Date().toISOString(),
        });

      if (concilError) {
        return c.json({ error: concilError.message }, 500);
      }

      // Marcar movimiento como conciliado
      await supabase
        .from('banco_chile_movimientos')
        .update({ conciliado: true })
        .eq('id', movimientoId);

      return c.json({ success: true, message: 'Movimiento conciliado' });
    } catch (error) {
      console.error('Error conciliando:', error);
      return c.json({ error: 'Error al conciliar' }, 500);
    }
  }
);

// Desconciliar movimiento
conciliacionRouter.post('/desconciliar/:id', async (c) => {
  try {
    const supabase = c.get('supabase');
    const { id } = c.req.param();

    // Eliminar conciliación
    await supabase.from('banco_chile_conciliaciones').delete().eq('movimiento_id', id);

    // Marcar como no conciliado
    await supabase.from('banco_chile_movimientos').update({ conciliado: false }).eq('id', id);

    return c.json({ success: true, message: 'Desconciliado' });
  } catch (error) {
    console.error('Error desconciliando:', error);
    return c.json({ error: 'Error al desconciliar' }, 500);
  }
});
