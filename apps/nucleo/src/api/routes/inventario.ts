import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware, tenantMiddleware, requireProfileRole } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";
import { fromLoose, rpcLoose } from "@/api/lib/supabase-loose";
import { createAdminClient } from "@enjambre/auth/server-index";

export const inventarioRoutes = new Hono<{ Variables: AppVariables }>();

inventarioRoutes.use("*", authMiddleware, tenantMiddleware);

const CLASES = ["insumo", "etiqueta", "envase", "apicola", "destilacion"] as const;
const UNIDADES = ["unidad", "kg", "g", "l", "ml", "rollo", "plancha", "caja"] as const;
const TIPOS_MOV = ["entrada", "salida", "ajuste", "merma"] as const;

const ItemSchema = z.object({
  clase: z.enum(CLASES),
  nombre: z.string().min(1).max(200),
  sku_code: z.string().max(80).optional().nullable(),
  unidad: z.enum(UNIDADES).default("unidad"),
  stock: z.number().min(0).default(0),
  stock_minimo: z.number().min(0).default(0),
  costo_unitario: z.number().int().min(0).default(0),
  producto_id: z.string().uuid().optional().nullable(),
  proveedor_nota: z.string().max(300).optional().nullable(),
  notas: z.string().max(2000).optional().nullable(),
  activo: z.boolean().optional(),
});

const ItemPatchSchema = ItemSchema.partial();

const MovimientoSchema = z.object({
  tipo: z.enum(TIPOS_MOV),
  cantidad: z.number().positive(),
  motivo: z.string().max(500).optional().nullable(),
  ref_tipo: z.string().max(80).optional().nullable(),
  ref_id: z.string().max(120).optional().nullable(),
  doc_tipo: z
    .enum(["factura", "boleta", "guia", "orden_compra", "comprobante", "otro"])
    .optional()
    .nullable(),
  doc_numero: z.string().max(80).optional().nullable(),
  doc_fecha: z.string().max(40).optional().nullable(),
});

/** GET /api/inventario/items?clase=insumo&alertas=1 */
inventarioRoutes.get("/items", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const clase = c.req.query("clase");
  const soloAlertas = c.req.query("alertas") === "1";

  let q = fromLoose(supabase, "inventario_items")
    .select("*")
    .eq("activo", true)
    .order("nombre");

  // RLS ya filtra; preferimos user_id del owner en listados personales
  if (user?.id) {
    q = q.or(`user_id.eq.${user.id},user_id.is.null`);
  }

  if (clase && CLASES.includes(clase as (typeof CLASES)[number])) {
    q = q.eq("clase", clase);
  }

  const { data, error } = await q;
  if (error) {
    // Tabla aún no migrada: no tumbar la UI
    if (error.message?.includes("inventario_items") || error.code === "42P01") {
      return c.json({ data: [], meta: { alertas: 0, pending_migration: true } });
    }
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  let rows = data ?? [];
  if (soloAlertas) {
    rows = rows.filter((r) => Number(r.stock) <= Number(r.stock_minimo));
  }

  const alertas = (data ?? []).filter(
    (r) => r.activo !== false && Number(r.stock) <= Number(r.stock_minimo),
  ).length;

  return c.json({ data: rows, meta: { alertas } });
});

/** POST /api/inventario/items */
inventarioRoutes.post(
  "/items",
  requireProfileRole("admin"),
  zValidator("json", ItemSchema),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const user = c.get("user");
    const empresaId = c.get("empresaId");

    const { data, error } = await fromLoose(supabase, "inventario_items")
      .insert({
        ...input,
        user_id: user.id,
        empresa_id: empresaId || null,
        sku_code: input.sku_code?.trim() || null,
        proveedor_nota: input.proveedor_nota?.trim() || null,
        notas: input.notas?.trim() || null,
        producto_id: input.producto_id || null,
      })
      .select("*")
      .single();

    if (error) {
      return c.json({ code: "create_failed", message: error.message }, 400);
    }
    return c.json({ data }, 201);
  },
);

/** PATCH /api/inventario/items/:id */
inventarioRoutes.patch(
  "/items/:id",
  requireProfileRole("admin"),
  zValidator("json", ItemPatchSchema),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");

    const { data, error } = await fromLoose(supabase, "inventario_items")
      .update({
        ...input,
        sku_code: input.sku_code === undefined ? undefined : input.sku_code?.trim() || null,
        proveedor_nota:
          input.proveedor_nota === undefined ? undefined : input.proveedor_nota?.trim() || null,
        notas: input.notas === undefined ? undefined : input.notas?.trim() || null,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return c.json({ code: "update_failed", message: error.message }, 400);
    }
    return c.json({ data });
  },
);

/** DELETE /api/inventario/items/:id — soft delete */
inventarioRoutes.delete("/items/:id", requireProfileRole("admin"), async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const { error } = await fromLoose(supabase, "inventario_items")
    .update({ activo: false })
    .eq("id", id);
  if (error) {
    return c.json({ code: "delete_failed", message: error.message }, 400);
  }
  return c.json({ data: { deleted: true } });
});

/** POST /api/inventario/items/:id/movimiento */
inventarioRoutes.post(
  "/items/:id/movimiento",
  requireProfileRole("admin"),
  zValidator("json", MovimientoSchema),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");

    const { data, error } = await rpcLoose(supabase, "inventario_aplicar_movimiento", {
      p_item_id: id,
      p_tipo: input.tipo,
      p_cantidad: input.cantidad,
      p_motivo: input.motivo ?? null,
      p_ref_tipo: input.ref_tipo ?? null,
      p_ref_id: input.ref_id ?? null,
      p_doc_tipo: input.doc_tipo ?? null,
      p_doc_numero: input.doc_numero ?? null,
      p_doc_fecha: input.doc_fecha || null,
    });

    if (error) {
      // Fallback sin RPC (migración pendiente): update manual + insert movimiento
      if (error.message?.includes("inventario_aplicar_movimiento") || error.code === "42883") {
        return await movimientoFallback(c, id, input);
      }
      return c.json({ code: "movimiento_failed", message: error.message }, 400);
    }
    return c.json({ data });
  },
);

/** GET /api/inventario/items/:id/movimientos */
inventarioRoutes.get("/items/:id/movimientos", async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const { data, error } = await fromLoose(supabase, "inventario_movimientos")
    .select("*")
    .eq("item_id", id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    if (error.code === "42P01") return c.json({ data: [] });
    return c.json({ code: "query_failed", message: error.message }, 500);
  }
  return c.json({ data: data ?? [] });
});

/** Resumen de alertas multi-clase para badges / banner */
inventarioRoutes.get("/alertas", async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await fromLoose(supabase, "inventario_items")
    .select("id, clase, nombre, stock, stock_minimo, unidad")
    .eq("activo", true);

  if (error) {
    if (error.code === "42P01") return c.json({ data: [], meta: { total: 0 } });
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  const alertas = (data ?? []).filter((r) => Number(r.stock) <= Number(r.stock_minimo));
  const porClase: Record<string, number> = {};
  for (const a of alertas) {
    porClase[a.clase] = (porClase[a.clase] ?? 0) + 1;
  }
  return c.json({ data: alertas, meta: { total: alertas.length, por_clase: porClase } });
});

async function movimientoFallback(
  c: {
    get: (k: "supabase" | "user") => AppVariables["supabase"] | AppVariables["user"];
    json: (body: unknown, status?: number) => Response;
  },
  itemId: string,
  input: z.infer<typeof MovimientoSchema>,
) {
  const supabase = c.get("supabase") as AppVariables["supabase"];
  const user = c.get("user") as AppVariables["user"];

  const { data: item, error: readErr } = await fromLoose(supabase, "inventario_items")
    .select("id, stock")
    .eq("id", itemId)
    .single();
  if (readErr || !item) {
    return c.json({ code: "not_found", message: "Ítem no encontrado" }, 404);
  }

  const antes = Number((item as { stock: number }).stock);
  let despues: number;
  if (input.tipo === "entrada") despues = antes + input.cantidad;
  else if (input.tipo === "ajuste") despues = input.cantidad;
  else despues = antes - input.cantidad;

  if (despues < 0) {
    return c.json({ code: "stock_insuficiente", message: "Stock insuficiente" }, 400);
  }

  const { error: updErr } = await fromLoose(supabase, "inventario_items")
    .update({ stock: despues })
    .eq("id", itemId);
  if (updErr) {
    return c.json({ code: "update_failed", message: updErr.message }, 400);
  }

  await fromLoose(supabase, "inventario_movimientos").insert({
    item_id: itemId,
    user_id: user?.id ?? null,
    tipo: input.tipo,
    cantidad: input.tipo === "ajuste" ? Math.abs(despues - antes) : input.cantidad,
    stock_antes: antes,
    stock_despues: despues,
    motivo: input.motivo ?? null,
    ref_tipo: input.ref_tipo ?? null,
    ref_id: input.ref_id ?? null,
    doc_tipo: input.doc_tipo ?? null,
    doc_numero: input.doc_numero ?? null,
    doc_fecha: input.doc_fecha || null,
  });

  return c.json({
    data: { item_id: itemId, stock_antes: antes, stock_despues: despues, tipo: input.tipo },
  });
}

/** GET /api/inventario/envases-retornables — Catálogo de frascos y envases para POS / feria */
inventarioRoutes.get("/envases-retornables", async (c) => {
  const supabase = c.get("supabase");

  const { data, error } = await fromLoose(supabase, "inventario_items")
    .select("id, nombre, unidad, stock, stock_minimo, costo_unitario")
    .eq("clase", "envase")
    .eq("activo", true)
    .order("nombre");

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

const RetornoEnvaseSchema = z.object({
  envase_item_id: z.string().uuid(),
  cantidad: z.number().int().positive().max(1000),
  cliente_email: z.string().email().optional().nullable(),
  cliente_id: z.string().uuid().optional().nullable(),
  valor_puntos_unitario: z.number().int().min(0).max(50000).default(500),
  notas: z.string().max(500).optional().nullable(),
});

/** POST /api/inventario/retorno-envase — Reingreso de vidrio de cliente con acreditación en wallet */
inventarioRoutes.post("/retorno-envase", zValidator("json", RetornoEnvaseSchema), async (c) => {
  const user = c.get("user");
  const input = c.req.valid("json");
  const admin = createAdminClient({ persistSession: false });

  // 1. Obtener y verificar el envase
  const { data: item, error: readErr } = await admin
    .from("inventario_items")
    .select("id, nombre, stock")
    .eq("id", input.envase_item_id)
    .eq("clase", "envase")
    .maybeSingle();

  if (readErr || !item) {
    return c.json({ code: "not_found", message: "Envase no encontrado o no catalogado como envase" }, 404);
  }

  const stockAntes = Number(item.stock ?? 0);
  const nuevoStock = stockAntes + input.cantidad;

  // 2. Aplicar movimiento atómico a inventario_items
  const { error: updErr } = await admin
    .from("inventario_items")
    .update({ stock: nuevoStock })
    .eq("id", input.envase_item_id);

  if (updErr) {
    return c.json({ code: "update_failed", message: updErr.message }, 400);
  }

  await fromLoose(admin, "inventario_movimientos").insert({
    item_id: input.envase_item_id,
    user_id: user?.id ?? null,
    tipo: "entrada",
    cantidad: input.cantidad,
    stock_antes: stockAntes,
    stock_despues: nuevoStock,
    motivo: input.notas?.trim()
      ? `Retorno de envases en feria: ${input.notas.trim()}`
      : `Retorno de envases de vidrio (${input.cantidad} u. de ${item.nombre})`,
    ref_tipo: "pos_retorno",
  });

  // 3. Acreditar saldo/puntos si se especificó cliente
  let puntosAcreditados = 0;
  let targetUserId: string | null = null;

  if (input.cliente_id || input.cliente_email) {
    let profileQuery = admin.from("profiles").select("id, puntos_acumulados, email");
    if (input.cliente_id) {
      profileQuery = profileQuery.eq("id", input.cliente_id);
    } else if (input.cliente_email) {
      profileQuery = profileQuery.ilike("email", input.cliente_email.trim());
    }

    const { data: profile } = await profileQuery.maybeSingle();

    if (profile) {
      targetUserId = profile.id;
      puntosAcreditados = input.cantidad * (input.valor_puntos_unitario || 500);
      const saldoActual = Number(profile.puntos_acumulados ?? 0);
      const nuevoSaldo = saldoActual + puntosAcreditados;

      await admin
        .from("profiles")
        .update({ puntos_acumulados: nuevoSaldo })
        .eq("id", profile.id);

      try {
        await admin
          .from("loyalty_transactions")
          .insert({
            user_id: profile.id,
            action_type: "retorno_envase",
            points: puntosAcreditados,
            balance_after: nuevoSaldo,
            description: `Retorno de ${input.cantidad} frasco(s) en feria: ${item.nombre}`,
          });
      } catch (loyaltyErr) {
        console.error("[Inventario] Error registrando transacción de lealtad:", loyaltyErr);
      }
    }
  }

  return c.json(
    {
      data: {
        envase_item_id: input.envase_item_id,
        nombre: item.nombre,
        cantidad: input.cantidad,
        stock_anterior: stockAntes,
        stock_actual: nuevoStock,
        puntos_acreditados: puntosAcreditados,
        cliente_id: targetUserId,
      },
    },
    201,
  );
});
