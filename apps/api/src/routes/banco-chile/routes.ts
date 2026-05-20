import type { AppVariables } from '../../types/hono';
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { BancoChileClient } from '@enjambre/banco-chile';

/**
 * Router para operaciones generales de Banco Chile
 */
export const bancoChileRouter = new Hono<{ Variables: AppVariables }>();

// Obtener cuentas
bancoChileRouter.get('/cuentas', async (c) => {
  try {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');

    // Obtener configuración
    const { data: config } = await supabase
      .from('banco_chile_config')
      .select('*')
      .eq('empresa_id', empresaId)
      .single();

    if (!config || !config.enabled) {
      return c.json({ error: 'Banco Chile no configurado' }, 400);
    }

    const client = new BancoChileClient({
      clientId: config.client_id,
      clientSecret: config.client_secret,
      username: config.username,
      password: config.password,
      environment: config.environment as 'sandbox' | 'production',
    });

    const result = await client.getCuentas();

    if (!result.success) {
      return c.json({ error: result.error.message }, 500);
    }

    // Guardar en DB
    if (result.data.length > 0) {
      const cuentas = result.data.map((cuenta) => ({
        config_id: config.id,
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

    return c.json({ cuentas: result.data });
  } catch (error) {
    console.error('Error getting cuentas:', error);
    return c.json({ error: 'Error al obtener cuentas' }, 500);
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
    })
  ),
  async (c) => {
    try {
      const supabase = c.get('supabase');
      const empresaId = c.get('empresaId');
      const { cuentaId } = c.req.param();
      const { desde, hasta, limite } = c.req.valid('query');

      const { data: config } = await supabase
        .from('banco_chile_config')
        .select('*')
        .eq('empresa_id', empresaId)
        .single();

      if (!config || !config.enabled) {
        return c.json({ error: 'Banco Chile no configurado' }, 400);
      }

      const client = new BancoChileClient({
        clientId: config.client_id,
        clientSecret: config.client_secret,
        username: config.username,
        password: config.password,
        environment: config.environment as 'sandbox' | 'production',
      });

      const result = await client.getMovimientos(cuentaId, { desde, hasta, limite });

      if (!result.success) {
        return c.json({ error: result.error.message }, 500);
      }

      // Guardar en DB
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

      return c.json({ movimientos: result.data });
    } catch (error) {
      console.error('Error getting movimientos:', error);
      return c.json({ error: 'Error al obtener movimientos' }, 500);
    }
  }
);
