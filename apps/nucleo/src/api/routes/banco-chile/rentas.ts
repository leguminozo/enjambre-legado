import type { AppVariables } from '@/api/lib/middleware';
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { BancoChileClient } from '@enjambre/banco-chile';

/**
 * Router para rentas depuradas
 */
export const rentasRouter = new Hono<{ Variables: AppVariables }>();

// Listar rentas
rentasRouter.get('/', async (c) => {
  try {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');

    const { data, error } = await supabase
      .from('banco_chile_rentas')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('periodo', { ascending: false });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ rentas: data || [] });
  } catch (error) {
    console.error('Error listing rentas:', error);
    return c.json({ error: 'Error al listar rentas' }, 500);
  }
});

// Obtener renta depurada de una persona
rentasRouter.get(
  '/:rutPersona',
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
      const { rutPersona } = c.req.param();
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

      const result = await client.getRentaDepurada(rutPersona, periodo);

      if (!result.success) {
        return c.json({ error: (result as { success: false; error: { message: string } }).error.message }, 500);
      }

      // Guardar en DB
      const renta = result.data;
      await supabase
        .from('banco_chile_rentas')
        .upsert({
          empresa_id: empresaId,
          rut_persona: renta.rutPersona,
          nombre_persona: renta.nombrePersona,
          periodo: renta.periodo,
          renta_bruta: renta.rentaBruta,
          renta_liquida: renta.rentaLiquida,
          ingresos_no_renta: renta.ingresosNoRenta,
          fuente: renta.fuente,
          confianza: renta.confianza,
        });

      return c.json({ renta: result.data });
    } catch (error) {
      console.error('Error getting renta:', error);
      return c.json({ error: 'Error al obtener renta depurada' }, 500);
    }
  }
);
