import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createAdminClient } from '@enjambre/auth/server-index';
import type { AppVariables } from '@/api/lib/middleware';
import { authMiddleware, requireProfileRole } from '@/api/lib/middleware';
import { FORTIFICANTES_CANONICOS, AtributosSensorialesSchema } from '@enjambre/resenas';

export const variantesRoutes = new Hono<{ Variables: AppVariables }>();

const UUID_RE = /^[0-9a-f-]{36}$/i;

const CreateVarianteSchema = z.object({
  producto_id: z.string().regex(UUID_RE, 'UUID de producto inválido'),
  sku: z.string().trim().min(1).max(100),
  nombre_variante: z.string().trim().min(1).max(200),
  tipo_variante: z.enum(['formato', 'fortificacion', 'edicion_especial', 'pack']).default('fortificacion'),
  ingrediente_fortificante: z.enum(FORTIFICANTES_CANONICOS).optional().nullable(),
  peso_neto_g: z.number().int().min(0).optional().nullable(),
  precio_override: z.number().int().min(0).optional().nullable(),
  stock: z.number().int().min(0).default(0),
  activo: z.boolean().default(true),
  sort_order: z.number().int().default(0),
  perfil_sensorial_override: AtributosSensorialesSchema.optional().nullable(),
});

const UpdateVarianteSchema = CreateVarianteSchema.partial().omit({ producto_id: true });

/**
 * GET /api/variantes — Listado de variantes de producto.
 * Endpoint público para Tienda (PDP, /cata/[codigo]) y Campo POS.
 */
variantesRoutes.get('/', async (c) => {
  const admin = createAdminClient();
  const productoId = c.req.query('producto_id');
  const soloActivas = c.req.query('solo_activas') !== 'false';

  let query = admin
    .from('producto_variantes')
    .select('*, productos(id, nombre, slug, precio, categoria)')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (productoId && UUID_RE.test(productoId)) {
    query = query.eq('producto_id', productoId);
  }

  if (soloActivas) {
    query = query.eq('activo', true);
  }

  const { data, error } = await query;
  if (error) {
    return c.json({ code: 'query_failed', message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

/**
 * GET /api/variantes/:id — Detalle de variante individual.
 */
variantesRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  if (!UUID_RE.test(id)) {
    return c.json({ code: 'invalid_id', message: 'ID no válido' }, 400);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('producto_variantes')
    .select('*, productos(id, nombre, slug, precio, categoria)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return c.json({ code: 'query_failed', message: error.message }, 500);
  }

  if (!data) {
    return c.json({ code: 'not_found', message: 'Variante no encontrada' }, 404);
  }

  return c.json({ data });
});

/**
 * POST /api/variantes — Crear nueva variante (Admin).
 */
variantesRoutes.post('/', authMiddleware, requireProfileRole('admin'), zValidator('json', CreateVarianteSchema), async (c) => {
  const input = c.req.valid('json');
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('producto_variantes')
    .insert([
      {
        producto_id: input.producto_id,
        sku: input.sku.trim(),
        nombre_variante: input.nombre_variante.trim(),
        tipo_variante: input.tipo_variante,
        ingrediente_fortificante: input.ingrediente_fortificante ?? null,
        peso_neto_g: input.peso_neto_g ?? null,
        precio_override: input.precio_override ?? null,
        stock: input.stock ?? 0,
        activo: input.activo ?? true,
        sort_order: input.sort_order ?? 0,
        perfil_sensorial_override: (input.perfil_sensorial_override as unknown as Record<string, unknown>) ?? null,
      },
    ])
    .select()
    .single();

  if (error) {
    return c.json({ code: 'insert_failed', message: error.message }, 500);
  }

  return c.json({ data }, 201);
});

/**
 * PATCH /api/variantes/:id — Modificar variante existente (Admin).
 */
variantesRoutes.patch('/:id', authMiddleware, requireProfileRole('admin'), zValidator('json', UpdateVarianteSchema), async (c) => {
  const id = c.req.param('id');
  if (!UUID_RE.test(id)) {
    return c.json({ code: 'invalid_id', message: 'ID no válido' }, 400);
  }

  const input = c.req.valid('json');
  const admin = createAdminClient();

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.sku !== undefined) updatePayload.sku = input.sku.trim();
  if (input.nombre_variante !== undefined) updatePayload.nombre_variante = input.nombre_variante.trim();
  if (input.tipo_variante !== undefined) updatePayload.tipo_variante = input.tipo_variante;
  if (input.ingrediente_fortificante !== undefined) updatePayload.ingrediente_fortificante = input.ingrediente_fortificante;
  if (input.peso_neto_g !== undefined) updatePayload.peso_neto_g = input.peso_neto_g;
  if (input.precio_override !== undefined) updatePayload.precio_override = input.precio_override;
  if (input.stock !== undefined) updatePayload.stock = input.stock;
  if (input.activo !== undefined) updatePayload.activo = input.activo;
  if (input.sort_order !== undefined) updatePayload.sort_order = input.sort_order;
  if (input.perfil_sensorial_override !== undefined) updatePayload.perfil_sensorial_override = input.perfil_sensorial_override;

  const { data, error } = await admin
    .from('producto_variantes')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return c.json({ code: 'update_failed', message: error.message }, 500);
  }

  return c.json({ data });
});

/**
 * DELETE /api/variantes/:id — Desactivar o eliminar variante (Admin).
 */
variantesRoutes.delete('/:id', authMiddleware, requireProfileRole('admin'), async (c) => {
  const id = c.req.param('id');
  if (!UUID_RE.test(id)) {
    return c.json({ code: 'invalid_id', message: 'ID no válido' }, 400);
  }

  const hard = c.req.query('hard') === 'true';
  const admin = createAdminClient();

  if (hard) {
    const { error } = await admin.from('producto_variantes').delete().eq('id', id);
    if (error) return c.json({ code: 'delete_failed', message: error.message }, 500);
  } else {
    const { error } = await admin
      .from('producto_variantes')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return c.json({ code: 'deactivate_failed', message: error.message }, 500);
  }

  return c.json({ success: true });
});
