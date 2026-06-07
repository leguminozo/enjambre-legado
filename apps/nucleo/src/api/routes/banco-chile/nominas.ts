import type { AppVariables } from '@/api/lib/middleware';
import { Hono } from 'hono';
import { z } from 'zod';

interface BancoChileNomina {
  id: string;
  [key: string]: unknown;
}
import { zValidator } from '@hono/zod-validator';
import { BancoChileClient, NominaRequestSchema } from '@enjambre/banco-chile';

/**
 * Router para nóminas (Confirming)
 */
export const nominasRouter = new Hono<{ Variables: AppVariables }>();

// Listar nóminas
nominasRouter.get('/', async (c) => {
  try {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');

    const { data, error } = await supabase
      .from('banco_chile_nominas')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ nominas: data || [] });
  } catch (error) {
    console.error('Error listing nominas:', error);
    return c.json({ error: 'Error al listar nóminas' }, 500);
  }
});

// Crear/processar nómina
nominasRouter.post(
  '/',
  zValidator(
    'json',
    z.object({
      numeroNomina: z.string(),
      periodo: z.string().regex(/^\d{4}-\d{2}$/),
      detalles: z.array(
        z.object({
          rutBeneficiario: z.string(),
          nombreBeneficiario: z.string(),
          banco: z.string(),
          tipoCuenta: z.string(),
          numeroCuenta: z.string(),
          monto: z.number().positive(),
          concepto: z.string().optional(),
        })
      ),
    })
  ),
  async (c) => {
    try {
      const supabase = c.get('supabase');
      const empresaId = c.get('empresaId');
      const body = c.req.valid('json');

      // Validar con schema
      const validated = NominaRequestSchema.parse(body);

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

      // Procesar nómina
      const result = await client.procesarNomina(validated);

      if (!result.success) {
        return c.json({ error: (result as { success: false; error: { message: string } }).error.message }, 500);
      }

      // Calcular total
      const totalNominas = body.detalles.reduce((sum, det) => sum + det.monto, 0);

      // Guardar nómina principal
      const { data: nominaData, error: nominaError } = await supabase
        .from('banco_chile_nominas')
        .insert({
          config_id: config.id,
          empresa_id: empresaId,
          numero_nomina: body.numeroNomina,
          periodo: body.periodo,
          total_nominas: totalNominas,
          estado: 'procesada',
        })
        .select()
        .single();

      if (nominaError || !nominaData) {
        return c.json({ error: 'Error guardando nómina' }, 500);
      }

      // Guardar detalles
      const detalles = body.detalles.map((det) => ({
        nomina_id: (nominaData as BancoChileNomina).id,
        rut_beneficiario: det.rutBeneficiario,
        nombre_beneficiario: det.nombreBeneficiario,
        banco: det.banco,
        tipo_cuenta: det.tipoCuenta,
        numero_cuenta: det.numeroCuenta,
        monto: det.monto,
        concepto: det.concepto,
        estado: 'pagado' as const,
      }));

      await supabase.from('banco_chile_nomina_detalles').insert(detalles);

      return c.json({
        success: true,
        nomina: {
          numeroNomina: result.data.numeroNomina,
          estado: result.data.estado,
          totalNominas: result.data.totalNominas,
        },
      });
    } catch (error) {
      console.error('Error procesando nómina:', error);
      return c.json({ error: 'Error al procesar nómina' }, 500);
    }
  }
);

// Obtener detalles de nómina
nominasRouter.get('/:id/detalles', async (c) => {
  try {
    const supabase = c.get('supabase');
    const { id } = c.req.param();

    const { data, error } = await supabase
      .from('banco_chile_nomina_detalles')
      .select('*')
      .eq('nomina_id', id);

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ detalles: data || [] });
  } catch (error) {
    console.error('Error getting detalles:', error);
    return c.json({ error: 'Error al obtener detalles' }, 500);
  }
});
