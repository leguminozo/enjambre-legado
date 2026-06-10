import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";

export const produccionRoutes = new Hono<{ Variables: AppVariables }>();

produccionRoutes.use("*", authMiddleware, tenantMiddleware);

produccionRoutes.get("/dashboard", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const [lotesRes, productosRes, ventasRes] = await Promise.all([
    supabase
      .from("lotes")
      .select("*, productos(id, nombre, stock, peso_neto_g)")
      .order("created_at", { ascending: false }),
    supabase
      .from("productos")
      .select("*")
      .eq("visible", true),
    supabase
      .from("ventas")
      .select("items, created_at")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
  ]);

  const lotes = lotesRes.data ?? [];
  const productos = productosRes.data ?? [];
  const ventas = ventasRes.data ?? [];

  const itemSchema = z.object({
    producto_id: z.string().optional(),
    id: z.string().optional(),
    cantidad: z.number().optional()
  });

  // Calcular demanda (unidades vendidas últimos 30 días por producto)
  const demandaMap: Record<string, number> = {};
  ventas.forEach((v) => {
    if (Array.isArray(v.items)) {
      v.items.forEach((rawItem) => {
        const parsed = itemSchema.safeParse(rawItem);
        if (parsed.success) {
          const item = parsed.data;
          const id = item.producto_id || item.id;
          if (id) {
            demandaMap[id] = (demandaMap[id] || 0) + (item.cantidad || 0);
          }
        }
      });
    }
  });

  return c.json({
    data: {
      lotes,
      productos: productos.map(p => ({
        ...p,
        demanda_30d: demandaMap[p.id] || 0,
        dias_stock_estimado: demandaMap[p.id] > 0 ? Math.floor((p.stock || 0) / (demandaMap[p.id] / 30)) : 999
      })),
      stats: {
        total_kg_lotes: lotes.reduce((acc, l) => acc + Number(l.kg_total || 0), 0),
        lotes_criticos: lotes.filter(l => Number(l.kg_total) < 50).length,
        productos_quiebre: productos.filter(p => (p.stock || 0) < 10).length
      }
    }
  });
});
