import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { BancoChileClient } from '@enjambre/banco-chile';

/**
 * Router para montos preaprobados
 */
export const montosRouter = new Hono();

// Listar montos preaprobados
montosRouter.get('/', async (c) => {
  try {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');

    const { data, error } = await supabase
      .from('banco_chile_montos_preaprobados')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('fecha_vencimiento', { ascending: true });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ montos: data || [] });
  } catch (error) {
    console.error('Error listing montos:', error);
    return c.json({ error: 'Error al listar montos preaprobados' }, 500);
  }
});

// Obtener monto preaprobado de un cliente
montosRouter.get('/:rutCliente', async (c) => {
  try {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');
    const { rutCliente } = c.req.param();

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

    const result = await client.getMontoPreaprobado(rutCliente);

    if (!result.success) {
      return c.json({ error: result.error.message }, 500);
    }

    // Guardar en DB
    const monto = result.data;
    await supabase
      .from('banco_chile_montos_preaprobados')
      .upsert({
        empresa_id: empresaId,
        rut_cliente: monto.rutCliente,
        nombre_cliente: monto.nombreCliente,
        monto_preaprobado: monto.montoPreaprobado,
        monto_disponible: monto.montoDisponible,
        fecha_aprobacion: monto.fechaAprobacion,
        fecha_vencimiento: monto.fechaVencimiento,
        producto: monto.producto,
        tasa_interes: monto.tasaInteres,
        condiciones: monto.condiciones,
      });

    return c.json({ monto: result.data });
  } catch (error) {
    console.error('Error getting monto:', error);
    return c.json({ error: 'Error al obtener monto preaprobado' }, 500);
  }
});

// Listar todos los montos preaprobados desde Banco Chile
montosRouter.get('/external/list', async (c) => {
  try {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');

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

    const result = await client.getMontosPreaprobados();

    if (!result.success) {
      return c.json({ error: result.error.message }, 500);
    }

    // Guardar en DB
    if (result.data.length > 0) {
      const montos = result.data.map((m) => ({
        empresa_id: empresaId,
        rut_cliente: m.rutCliente,
        nombre_cliente: m.nombreCliente,
        monto_preaprobado: m.montoPreaprobado,
        monto_disponible: m.montoDisponible,
        fecha_aprobacion: m.fechaAprobacion,
        fecha_vencimiento: m.fechaVencimiento,
        producto: m.producto,
        tasa_interes: m.tasaInteres,
        condiciones: m.condiciones,
      }));

      await supabase.from('banco_chile_montos_preaprobados').upsert(montos);
    }

    return c.json({ montos: result.data });
  } catch (error) {
    console.error('Error listing montos externos:', error);
    return c.json({ error: 'Error al listar montos preaprobados' }, 500);
  }
});
