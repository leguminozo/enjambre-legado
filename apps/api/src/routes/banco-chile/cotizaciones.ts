import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { BancoChileClient } from '@enjambre/banco-chile';

/**
 * Router para cotizaciones previsionales
 */
export const cotizacionesRouter = new Hono();

// Listar cotizaciones
cotizacionesRouter.get('/', async (c) => {
  try {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');

    const { data, error } = await supabase
      .from('banco_chile_cotizaciones')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('periodo', { ascending: false });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ cotizaciones: data || [] });
  } catch (error) {
    console.error('Error listing cotizaciones:', error);
    return c.json({ error: 'Error al listar cotizaciones' }, 500);
  }
});

// Obtener cotización de un trabajador
cotizacionesRouter.get(
  '/:rutTrabajador',
  zValidator(
    'query',
    z.object({
      periodo: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    })
  ),
  async (c) => {
    try {
      const supabase = c.get('supabase');
      const empresaId = c.get('empresaId');
      const { rutTrabajador } = c.req.param();
      const { periodo } = c.req.valid('query');

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

      const result = await client.getCotizaciones(rutTrabajador, periodo);

      if (!result.success) {
        return c.json({ error: result.error.message }, 500);
      }

      // Guardar en DB
      if (result.data.length > 0) {
        const cotizaciones = result.data.map((cot) => ({
          empresa_id: empresaId,
          rut_trabajador: cot.rutTrabajador,
          nombre_trabajador: cot.nombreTrabajador,
          periodo: cot.periodo,
          sueldo_base: cot.sueldoBase,
          horas_trabajadas: cot.horasTrabajadas,
          afp: cot.afp,
          tramo_afp: cot.tramoAfp,
          monto_afp: cot.montoAfp,
          isapre: cot.isapre,
          tramo_isapre: cot.tramoIsapre,
          monto_isapre: cot.montoIsapre,
          seguro_cecesantia: cot.seguroCesantia,
        }));

        await supabase.from('banco_chile_cotizaciones').upsert(cotizaciones);
      }

      return c.json({ cotizaciones: result.data });
    } catch (error) {
      console.error('Error getting cotizaciones:', error);
      return c.json({ error: 'Error al obtener cotizaciones' }, 500);
    }
  }
);

// Importar cotizaciones masivamente
cotizacionesRouter.post('/import', async (c) => {
  try {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');

    // Aquí se implementaría la importación masiva
    // desde un archivo CSV o Excel

    return c.json({
      success: true,
      message: 'Importación stub - implementar con archivo real',
    });
  } catch (error) {
    console.error('Error importando cotizaciones:', error);
    return c.json({ error: 'Error al importar cotizaciones' }, 500);
  }
});
