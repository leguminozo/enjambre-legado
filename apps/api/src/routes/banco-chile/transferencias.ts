import type { AppVariables } from '../../types/hono';
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { BancoChileClient } from '@enjambre/banco-chile';

/**
 * Router para transferencias (Abono en línea)
 */
export const transferenciasRouter = new Hono<{ Variables: AppVariables }>();

// Listar transferencias
transferenciasRouter.get('/', async (c) => {
  try {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');

    const { data, error } = await supabase
      .from('banco_chile_transferencias')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ transferencias: data || [] });
  } catch (error) {
    console.error('Error listing transferencias:', error);
    return c.json({ error: 'Error al listar transferencias' }, 500);
  }
});

// Crear transferencia
transferenciasRouter.post(
  '/',
  zValidator(
    'json',
    z.object({
      cuentaOrigen: z.string(),
      cuentaDestino: z.string(),
      rutDestinatario: z.string(),
      nombreDestinatario: z.string(),
      bancoDestino: z.string(),
      monto: z.number().positive(),
      concepto: z.string().optional(),
      tipoTransferencia: z.enum(['normal', 'urgente', 'diferida']).default('normal'),
    })
  ),
  async (c) => {
    try {
      const supabase = c.get('supabase');
      const empresaId = c.get('empresaId');
      const body = c.req.valid('json');

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

      // Ejecutar transferencia
      const result = await client.crearTransferencia({
        cuentaOrigen: body.cuentaOrigen,
        cuentaDestino: body.cuentaDestino,
        rutDestinatario: body.rutDestinatario,
        nombreDestinatario: body.nombreDestinatario,
        bancoDestino: body.bancoDestino,
        monto: body.monto,
        concepto: body.concepto,
        tipoTransferencia: body.tipoTransferencia,
      });

      if (!result.success) {
        return c.json({ error: result.error.message }, 500);
      }

      // Guardar en DB
      const { error: insertError } = await supabase
        .from('banco_chile_transferencias')
        .insert({
          config_id: config.id,
          empresa_id: empresaId,
          cuenta_origen: body.cuentaOrigen,
          cuenta_destino: body.cuentaDestino,
          rut_destinatario: body.rutDestinatario,
          nombre_destinatario: body.nombreDestinatario,
          banco_destino: body.bancoDestino,
          monto: body.monto,
          concepto: body.concepto,
          tipo_transferencia: body.tipoTransferencia,
          estado: 'procesada',
          numero_operacion: result.data.numeroOperacion,
          comprobante: result.data.comprobante,
        });

      if (insertError) {
        console.error('Error guardando transferencia:', insertError);
      }

      return c.json({
        success: true,
        transferencia: {
          numeroOperacion: result.data.numeroOperacion,
          estado: result.data.estado,
          comprobante: result.data.comprobante,
        },
      });
    } catch (error) {
      console.error('Error creando transferencia:', error);
      return c.json({ error: 'Error al crear transferencia' }, 500);
    }
  }
);

// Obtear transferencia por ID
transferenciasRouter.get('/:id', async (c) => {
  try {
    const supabase = c.get('supabase');
    const { id } = c.req.param();

    const { data, error } = await supabase
      .from('banco_chile_transferencias')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return c.json({ error: 'Transferencia no encontrada' }, 404);
    }

    return c.json({ transferencia: data });
  } catch (error) {
    console.error('Error getting transferencia:', error);
    return c.json({ error: 'Error al obtener transferencia' }, 500);
  }
});
