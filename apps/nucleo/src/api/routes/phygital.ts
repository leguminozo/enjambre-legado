import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createAdminClient } from '@enjambre/auth/server-index';
import type { AppVariables } from '@/api/lib/middleware';
import { authMiddleware } from '@/api/lib/middleware';

export const phygitalRoutes = new Hono<{ Variables: AppVariables }>();

// Requiere sesión autenticada para interactuar con los recursos gráficos y QRs
phygitalRoutes.use('*', authMiddleware);

const UUID_RE = /^[0-9a-f-]{36}$/i;

const GenerarQrSchema = z.object({
  producto_id: z.string().regex(UUID_RE, 'UUID de producto inválido'),
  lote_id: z.string().trim().min(1, 'El lote es requerido'),
  variante_id: z.string().regex(UUID_RE, 'UUID de variante inválido').optional().nullable(),
  tipo_destino: z.enum(['cata_sensorial', 'pasaporte_lote', 'tienda_producto', 'frasco_autenticidad']).default('cata_sensorial'),
  cantidad: z.number().int().min(1).max(50).default(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const GuardarEtiquetaArteSchema = z.object({
  id: z.string().regex(UUID_RE).optional(),
  producto_id: z.string().regex(UUID_RE, 'UUID de producto inválido'),
  variante_id: z.string().regex(UUID_RE).optional().nullable(),
  lote_id: z.string().optional().nullable(),
  qr_codigo: z.string().optional().nullable(),
  nombre: z.string().trim().min(2, 'Nombre de etiqueta muy corto').max(200),
  tipo: z.enum(['frontal', 'dorsal', 'troquel', 'faja_seguridad', 'completa', 'set_completo']).default('frontal'),
  dimensiones_mm: z.string().trim().min(2).max(100).default('140 x 55 mm'),
  sustrato: z.string().trim().min(2).max(200).default('Papel autoadhesivo Tintoretto texturado'),
  acabados: z.string().max(300).optional().nullable(),
  archivo_url: z.string().url('URL de archivo inválida'),
  archivo_nombre: z.string().trim().min(1),
  archivo_tamano_bytes: z.number().int().min(0).optional().default(0),
  archivo_tipo: z.enum(['pdf', 'ai', 'psd', 'svg', 'png', 'zip', 'otro']).default('pdf'),
  version: z.string().trim().min(1).max(50).default('v1.0'),
  notas_imprenta: z.string().max(1000).optional().nullable(),
  estado: z.enum(['borrador', 'en_revision', 'aprobado_imprenta', 'en_produccion', 'obsoleto']).default('aprobado_imprenta'),
  activo: z.boolean().default(true),
});

/** Helper para generar código QR alfanumérico único para el frasco */
function generarCodigoUnicoFrasco(): string {
  const anio = new Date().getFullYear();
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return `OZ-${anio}-${rand}`;
}

/**
 * GET /api/phygital/etiquetas
 * Retorna las fichas técnicas y archivos de etiquetas vinculadas a productos y frascos.
 */
phygitalRoutes.get('/etiquetas', async (c) => {
  const admin = createAdminClient();
  const productoId = c.req.query('producto_id');
  const loteId = c.req.query('lote_id');

  let query = admin
    .from('etiquetas_artes')
    .select(`
      *,
      productos ( id, nombre, formato, fotos, slug, categoria ),
      producto_variantes ( id, nombre_variante, sku, peso_neto_g )
    `)
    .order('created_at', { ascending: false });

  if (productoId && UUID_RE.test(productoId)) {
    query = query.eq('producto_id', productoId);
  }
  if (loteId) {
    query = query.eq('lote_id', loteId);
  }

  const { data, error } = await query;
  if (error) {
    return c.json({ code: 'etiquetas_query_failed', message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

/**
 * POST /api/phygital/etiquetas
 * Crea o actualiza una ficha técnica de etiqueta con su archivo imprimible (subido desde núcleo).
 */
phygitalRoutes.post('/etiquetas', zValidator('json', GuardarEtiquetaArteSchema), async (c) => {
  const input = c.req.valid('json');
  const admin = createAdminClient();
  const user = c.get('user');

  // Buscar empresa principal si no viene especificada
  const { data: empresa } = await admin
    .from('empresas')
    .select('id')
    .limit(1)
    .single();

  const payload = {
    ...input,
    empresa_id: empresa?.id ?? null,
    created_by: user.id,
  };

  if (input.id) {
    const { data, error } = await admin
      .from('etiquetas_artes')
      .update(payload)
      .eq('id', input.id)
      .select(`
        *,
        productos ( id, nombre, formato, fotos, slug ),
        producto_variantes ( id, nombre_variante, sku, peso_neto_g )
      `)
      .single();

    if (error) {
      return c.json({ code: 'etiqueta_update_failed', message: error.message }, 400);
    }
    return c.json({ data, message: 'Ficha de etiqueta actualizada' });
  }

  const { data, error } = await admin
    .from('etiquetas_artes')
    .insert([payload])
    .select(`
      *,
      productos ( id, nombre, formato, fotos, slug ),
      producto_variantes ( id, nombre_variante, sku, peso_neto_g )
    `)
    .single();

  if (error) {
    return c.json({ code: 'etiqueta_insert_failed', message: error.message }, 400);
  }

  return c.json({ data, message: 'Ficha de etiqueta y archivo registrados' }, 201);
});

/**
 * DELETE /api/phygital/etiquetas/:id
 * Elimina una ficha de etiqueta.
 */
phygitalRoutes.delete('/etiquetas/:id', async (c) => {
  const id = c.req.param('id');
  if (!UUID_RE.test(id)) {
    return c.json({ code: 'invalid_id', message: 'ID de etiqueta inválido' }, 400);
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('etiquetas_artes')
    .delete()
    .eq('id', id);

  if (error) {
    return c.json({ code: 'etiqueta_delete_failed', message: error.message }, 400);
  }

  return c.json({ ok: true, message: 'Etiqueta eliminada correctamente' });
});

/**
 * POST /api/phygital/qr/generar
 * Genera y almacena códigos QR para frascos con trazabilidad phygital inmutable.
 */
phygitalRoutes.post('/qr/generar', zValidator('json', GenerarQrSchema), async (c) => {
  const input = c.req.valid('json');
  const admin = createAdminClient();
  const user = c.get('user');

  // Obtener producto para armar URL canónica
  const { data: producto, error: prodErr } = await admin
    .from('productos')
    .select('id, nombre, slug')
    .eq('id', input.producto_id)
    .single();

  if (prodErr || !producto) {
    return c.json({ code: 'product_not_found', message: 'Producto no encontrado' }, 404);
  }

  const { data: empresa } = await admin
    .from('empresas')
    .select('id')
    .limit(1)
    .single();

  const tiendaBase = (process.env.NEXT_PUBLIC_URL_TIENDA || 'https://tienda.obrera-zangano.cl').replace(/\/$/, '');
  const nucleoBase = (process.env.NEXT_PUBLIC_APP_URL || 'https://nucleo.obrera-zangano.cl').replace(/\/$/, '');

  const creados: Array<{
    id: string;
    codigo: string;
    url_destino: string;
    tipo_destino: string;
    created_at: string;
  }> = [];

  for (let i = 0; i < input.cantidad; i++) {
    const codigo = generarCodigoUnicoFrasco();
    let urlDestino = `${tiendaBase}/cata/${codigo}`;

    if (input.tipo_destino === 'pasaporte_lote') {
      urlDestino = `${nucleoBase}/lote/${encodeURIComponent(input.lote_id)}`;
    } else if (input.tipo_destino === 'tienda_producto' && producto.slug) {
      urlDestino = `${tiendaBase}/producto/${encodeURIComponent(producto.slug)}`;
    }

    const { data: qrInsert, error: qrErr } = await admin
      .from('qr_codes')
      .insert([
        {
          codigo,
          producto_id: input.producto_id,
          lote_id: input.lote_id,
          fecha_produccion: new Date().toISOString().split('T')[0],
          empresa_id: empresa?.id ?? null,
          activo: true,
          created_by: user.id,
          tipo_destino: input.tipo_destino,
          url_destino: urlDestino,
          metadata: {
            ...input.metadata,
            variante_id: input.variante_id ?? null,
            origen_generacion: 'hub_phygital_nucleo',
          },
        },
      ])
      .select('id, codigo, tipo_destino, url_destino, created_at')
      .single();

    if (qrErr || !qrInsert) {
      continue;
    }

    // Registrar primer eslabón en audit trail inmutable
    await admin.from('qr_audit_trail').insert([
      {
        qr_id: qrInsert.id,
        evento: 'creado',
        usuario_id: user.id,
        metadata: {
          producto_id: input.producto_id,
          lote_id: input.lote_id,
          variante_id: input.variante_id ?? null,
          origen: 'hub_phygital',
        },
      },
    ]);

    creados.push(qrInsert);
  }

  if (creados.length === 0) {
    return c.json({ code: 'qr_creation_failed', message: 'No se pudo generar ningún código QR' }, 500);
  }

  return c.json({
    data: creados,
    message: `${creados.length} código(s) QR generado(s) y almacenado(s) correctamente`,
  }, 201);
});

/**
 * GET /api/phygital/qr
 * Lista los códigos QR almacenados para frascos con filtros por producto y lote.
 */
phygitalRoutes.get('/qr', async (c) => {
  const admin = createAdminClient();
  const productoId = c.req.query('producto_id');
  const loteId = c.req.query('lote_id');
  const limit = Math.min(Number(c.req.query('limit') || 50), 100);

  let query = admin
    .from('qr_codes')
    .select(`
      id, codigo, lote_id, tipo_destino, url_destino, created_at, activo, metadata,
      productos ( id, nombre, formato, slug, fotos )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (productoId && UUID_RE.test(productoId)) {
    query = query.eq('producto_id', productoId);
  }
  if (loteId) {
    query = query.eq('lote_id', loteId);
  }

  const { data, error } = await query;
  if (error) {
    return c.json({ code: 'qr_query_failed', message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

/**
 * GET /api/phygital/productos-galeria
 * Lista productos con sus fotos, formatos y variantes listos para el estudio de diseño e imprenta.
 */
phygitalRoutes.get('/productos-galeria', async (c) => {
  const admin = createAdminClient();

  const { data: productos, error: prodErr } = await admin
    .from('productos')
    .select(`
      id, nombre, formato, fotos, slug, categoria, descripcion_corta, peso_neto_g,
      producto_variantes ( id, nombre_variante, sku, peso_neto_g, tipo_variante, ingrediente_fortificante, activo )
    `)
    .order('nombre', { ascending: true });

  if (prodErr) {
    return c.json({ code: 'productos_query_failed', message: prodErr.message }, 500);
  }

  return c.json({ data: productos ?? [] });
});
