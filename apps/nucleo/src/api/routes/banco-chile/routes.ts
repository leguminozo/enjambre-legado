import type { AppVariables } from '@/api/lib/middleware';
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { resolveBancoChileClient } from '@/api/lib/banco-chile-client';

/**
 * Router para operaciones generales de Banco Chile
 */
export const bancoChileRouter = new Hono<{ Variables: AppVariables }>();

// Obtener cuentas (API + upsert local)
bancoChileRouter.get('/cuentas', async (c) => {
  try {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');

    const resolved = await resolveBancoChileClient(supabase, empresaId);
    if (!resolved.ok) {
      return c.json({ code: resolved.code, message: resolved.message }, 400);
    }

    const result = await resolved.client.getCuentas();

    if (!result.success) {
      return c.json({ code: 'cuentas_failed', message: result.error.message }, 502);
    }

    if (result.data.length > 0) {
      const cuentas = result.data.map((cuenta) => ({
        config_id: resolved.config.id,
        empresa_id: empresaId,
        numero_cuenta: cuenta.numeroCuenta,
        tipo_cuenta: cuenta.tipoCuenta,
        moneda: cuenta.moneda,
        saldo_disponible: cuenta.saldoDisponible,
        saldo_contable: cuenta.saldoContable,
        ultimo_movimiento: cuenta.fechaActualizacion,
        activa: cuenta.activa,
      }));

      await supabase.from('banco_chile_cuentas').upsert(cuentas);
    }

    await supabase
      .from('banco_chile_config')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', resolved.config.id);

    return c.json({ data: result.data, cuentas: result.data });
  } catch (error) {
    console.error('Error getting cuentas:', error);
    return c.json({ code: 'cuentas_error', message: 'Error al obtener cuentas' }, 500);
  }
});

// Obtener movimientos
bancoChileRouter.get(
  '/movimientos/:cuentaId',
  zValidator(
    'query',
    z.object({
      desde: z.string().optional(),
      hasta: z.string().optional(),
      limite: z.string().transform((v) => (v ? parseInt(v) : undefined)).optional(),
    }),
  ),
  async (c) => {
    try {
      const supabase = c.get('supabase');
      const empresaId = c.get('empresaId');
      const { cuentaId } = c.req.param();
      const { desde, hasta, limite } = c.req.valid('query');

      const resolved = await resolveBancoChileClient(supabase, empresaId);
      if (!resolved.ok) {
        return c.json({ code: resolved.code, message: resolved.message }, 400);
      }

      const result = await resolved.client.getMovimientos(cuentaId, { desde, hasta, limite });

      if (!result.success) {
        return c.json({ code: 'movimientos_failed', message: result.error.message }, 502);
      }

      if (result.data.length > 0) {
        const movimientos = result.data.map((mov) => ({
          cuenta_id: cuentaId,
          empresa_id: empresaId,
          fecha_contable: mov.fechaContable,
          fecha_valor: mov.fechaValor,
          descripcion: mov.descripcion,
          descripcion_detallada: mov.descripcionDetallada,
          monto: mov.monto,
          moneda: mov.moneda,
          tipo: mov.tipo,
          categoria: mov.categoria,
          subcategoria: mov.subcategoria,
          referencia: mov.referencia,
          rut_contraparte: mov.rutContraparte,
          nombre_contraparte: mov.nombreContraparte,
          banco_contraparte: mov.bancoContraparte,
          numero_operacion: mov.numeroOperacion,
          saldo_posterior: mov.saldoPosterior,
        }));

        await supabase.from('banco_chile_movimientos').upsert(movimientos);
      }

      return c.json({ data: result.data, movimientos: result.data });
    } catch (error) {
      console.error('Error getting movimientos:', error);
      return c.json({ code: 'movimientos_error', message: 'Error al obtener movimientos' }, 500);
    }
  },
);
