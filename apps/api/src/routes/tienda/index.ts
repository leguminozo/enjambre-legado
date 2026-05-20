import type { AppVariables } from '../../types/hono';
import { Hono } from 'hono';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { zValidator } from '@hono/zod-validator';
import { env } from '../../lib/env';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

const ProductSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().min(1).max(200),
  descripcion_regenerativa: z.string().max(2000).nullable().optional(),
  precio: z.number().int().nonnegative(),
  stock: z.number().int().nullable().optional(),
  formato: z.string().max(100).nullable().optional(),
  fotos: z.array(z.string().url()).optional(),
  visible: z.boolean().optional(),
  slug: z.string().max(120).nullable().optional(),
});

const OrderSchema = z.object({
  id: z.string().uuid().optional(),
  estado: z.enum(['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado']).optional(),
});

export const tiendaRoutes = new Hono<{ Variables: AppVariables }>();

tiendaRoutes.get('/products', async (c) => {
  const { data, error } = await supabase
    .from('productos')
    .select('id, slug, nombre, descripcion_regenerativa, precio, stock, formato, fotos, visible, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }
  return c.json({ data: data ?? [] });
});

tiendaRoutes.post(
  '/products',
  zValidator('json', ProductSchema.omit({ id: true })),
  async (c) => {
    const body = c.req.valid('json');
    const { data, error } = await supabase.from('productos').insert(body).select().single();
    
    if (error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ data }, 201);
  }
);

tiendaRoutes.patch(
  '/products/:id',
  zValidator('param', z.object({ id: z.string().uuid() })),
  zValidator('json', ProductSchema.partial()),
  async (c) => {
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');

    const { data, error } = await supabase
      .from('productos')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ data });
  }
);

tiendaRoutes.delete('/products/:id', async (c) => {
  const id = c.req.param('id');
  const { error } = await supabase.from('productos').delete().eq('id', id);

  if (error) {
    return c.json({ error: error.message }, 500);
  }
  return c.json({ ok: true });
});

tiendaRoutes.get('/orders', async (c) => {
  const { data, error } = await supabase
    .from('ventas')
    .select('id, origen, estado, total, metodo_pago, items, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return c.json({ error: error.message }, 500);
  }
  return c.json({ data: data ?? [] });
});

tiendaRoutes.patch(
  '/orders/:id',
  zValidator('param', z.object({ id: z.string().uuid() })),
  zValidator('json', OrderSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');

    const patch: Record<string, unknown> = {};
    if (body.estado) patch.estado = body.estado;

    const { data, error } = await supabase
      .from('ventas')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ data });
  }
);

tiendaRoutes.get('/customers', async (c) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }
  return c.json({ data: data ?? [] });
});

tiendaRoutes.get('/dashboard', async (c) => {
  const { data: ventas } = await supabase
    .from('ventas')
    .select('total, created_at')
    .order('created_at', { ascending: false });

  const { data: productos } = await supabase
    .from('productos')
    .select('precio, stock');

  const totalVentas = ventas?.reduce((acc, v) => acc + (v.total || 0), 0) || 0;
  const totalProductos = productos?.length || 0;
  const valorInventario = productos?.reduce((acc, p) => acc + (p.precio || 0) * (p.stock || 0), 0) || 0;

  return c.json({
    data: {
      totalVentas,
      totalProductos,
      valorInventario,
      ventas,
    },
  });
});
