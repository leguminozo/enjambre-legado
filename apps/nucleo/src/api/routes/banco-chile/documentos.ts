import type { AppVariables } from '@/api/lib/middleware';
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { BancoChileClient } from '@enjambre/banco-chile';

/**
 * Router para documentos (Factoring / Web Confirming)
 */
export const documentosRouter = new Hono<{ Variables: AppVariables }>();

// Listar documentos
documentosRouter.get('/', async (c) => {
  try {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');

    const { data, error } = await supabase
      .from('banco_chile_documentos')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('fecha_vencimiento', { ascending: true });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ documentos: data || [] });
  } catch (error) {
    console.error('Error listing documentos:', error);
    return c.json({ error: 'Error al listar documentos' }, 500);
  }
});

// Consultar documentos desde Banco Chile
documentosRouter.get(
  '/external',
  zValidator(
    'query',
    z.object({
      tipo: z.string().optional(),
      estado: z.string().optional(),
      desde: z.string().optional(),
      hasta: z.string().optional(),
    })
  ),
  async (c) => {
    try {
      const supabase = c.get('supabase');
      const empresaId = c.get('empresaId');
      const { tipo, estado, desde, hasta } = c.req.valid('query');

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

      const result = await client.consultarDocumentos({ tipo, estado, desde, hasta });

      if (!result.success) {
        return c.json({ error: (result as { success: false; error: { message: string } }).error.message }, 500);
      }

      // Guardar en DB
      if (result.data.length > 0) {
        const documentos = result.data.map((doc) => ({
          config_id: config.id,
          empresa_id: empresaId,
          tipo_documento: doc.tipoDocumento,
          numero_documento: doc.numeroDocumento,
          rut_librador: doc.rutLibrador,
          nombre_librador: doc.nombreLibrador,
          rut_libratario: doc.rutLibratario,
          nombre_libratario: doc.nombreLibratario,
          monto_nominal: doc.montoNominal,
          monto_pagar: doc.montoPagar,
          fecha_emision: doc.fechaEmision,
          fecha_vencimiento: doc.fechaVencimiento,
          estado: doc.estado,
          observaciones: doc.observaciones,
        }));

        await supabase.from('banco_chile_documentos').upsert(documentos);
      }

      return c.json({ documentos: result.data });
    } catch (error) {
      console.error('Error consultando documentos:', error);
      return c.json({ error: 'Error al consultar documentos' }, 500);
    }
  }
);

// Aceptar documento
documentosRouter.post('/:id/accept', async (c) => {
  try {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');
    const { id } = c.req.param();

    // Obtener documento
    const { data: doc } = await supabase
      .from('banco_chile_documentos')
      .select('*')
      .eq('id', id)
      .single();

    if (!doc) {
      return c.json({ error: 'Documento no encontrado' }, 404);
    }

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

    const result = await client.aceptarDocumento(id);

    if (!result.success) {
      return c.json({ error: (result as { success: false; error: { message: string } }).error.message }, 500);
    }

    // Actualizar estado
    await supabase
      .from('banco_chile_documentos')
      .update({ estado: 'aceptado' })
      .eq('id', id);

    return c.json({ success: true, message: 'Documento aceptado' });
  } catch (error) {
    console.error('Error aceptando documento:', error);
    return c.json({ error: 'Error al aceptar documento' }, 500);
  }
});

// Crear/actualizar documento manual
documentosRouter.post(
  '/',
  zValidator(
    'json',
    z.object({
      tipoDocumento: z.enum(['factura', 'pagare', 'letra', 'pagare_electronico']),
      numeroDocumento: z.string(),
      rutLibrador: z.string(),
      nombreLibrador: z.string(),
      rutLibratario: z.string().optional(),
      nombreLibratario: z.string().optional(),
      montoNominal: z.number().positive(),
      montoPagar: z.number().optional(),
      fechaEmision: z.string().optional(),
      fechaVencimiento: z.string(),
      estado: z.enum(['pendiente', 'aceptado', 'rechazado', 'pagado', 'vencido']).default('pendiente'),
      observaciones: z.string().optional(),
    })
  ),
  async (c) => {
    try {
      const supabase = c.get('supabase');
      const empresaId = c.get('empresaId');
      const body = c.req.valid('json');

      const { data: config } = await supabase
        .from('banco_chile_config')
        .select('*')
        .eq('empresa_id', empresaId)
        .single();

      const { error: insertError, data } = await (supabase as any)
        .from('banco_chile_documentos')
        .insert({
          config_id: config?.id || null,
          empresa_id: empresaId,
          tipo_documento: body.tipoDocumento,
          numero_documento: body.numeroDocumento,
          rut_librador: body.rutLibrador,
          nombre_librador: body.nombreLibrador,
          rut_libratario: body.rutLibratario,
          nombre_libratario: body.nombreLibratario,
          monto_nominal: body.montoNominal,
          monto_pagar: body.montoPagar,
          fecha_emision: body.fechaEmision,
          fecha_vencimiento: body.fechaVencimiento,
          estado: body.estado,
          observaciones: body.observaciones,
        })
        .select()
        .single();

      if (insertError) {
        return c.json({ error: insertError.message }, 500);
      }

      return c.json({ success: true, documento: data });
    } catch (error) {
      console.error('Error creando documento:', error);
      return c.json({ error: 'Error al crear documento' }, 500);
    }
  }
);
