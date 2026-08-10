import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  authMiddleware, tenantMiddleware, requireProfileRole,
} from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";
import {
  puntoVentaFormSchema,
  revendedorFormSchema,
  setEntradaFormSchema,
  setItemFormSchema,
  pedidoFormSchema,
  fidProgramaFormSchema,
  fidValorFormSchema,
  retribucionReglaFormSchema,
  retribucionTierFormSchema,
  chipCatalogoFormSchema,
  resenaRevendedorFormSchema,
} from "@/lib/microcanales-types";

/**
 * Microcanales — BFF autenticado (admin + portales de dueño/revendedor).
 * Los flujos públicos viven en b2b-publico.ts / percepcion.ts.
 * Retribución al por mayor: calculada al CONFIRMAR el pedido (rebate escalonado
 * + velocity + depth + co-op), crédito lock-in aplicado al próximo pedido,
 * contra-asiento en cancelaciones.
 */
export const b2bRoutes = new Hono<{ Variables: AppVariables }>();

b2bRoutes.use("*", authMiddleware, tenantMiddleware);

const CODIGO_ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generarCodigo(longitud = 6): string {
  const bytes = new Uint8Array(longitud);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += CODIGO_ALFABETO[b % CODIGO_ALFABETO.length];
  return out;
}

/** Normaliza WhatsApp a solo dígitos (+56 9 1234 → 5691234): evita duplicados. */
export function normalizarWhatsapp(v: string | null | undefined): string | null {
  if (!v) return null;
  const digits = v.replace(/\D/g, "");
  return digits || null;
}

const toNum = (v: unknown): number => Number(v ?? 0);

async function leerValor(
  supabase: AppVariables["supabase"],
  clave: string,
  fallback: number,
): Promise<number> {
  const { data } = await supabase
    .from("fid_valores")
    .select("valor")
    .eq("clave", clave)
    .eq("activo", true)
    .maybeSingle();
  return data?.valor != null ? Number(data.valor) : fallback;
}

/** Calcula e inserta las retribuciones de un pedido al por mayor confirmado. */
async function calcularRetribucion(
  supabase: AppVariables["supabase"],
  revendedorId: string,
  pedidoId: string,
  monto: number,
  setSkus: number,
  fechaPedido: string,
): Promise<number> {
  const { data: reglas } = await supabase
    .from("fid_retribucion_reglas")
    .select("*")
    .eq("activo", true)
    .order("sort_order");
  const filas: { tipo: string; cantidad: number; pct: number | null; notas: string }[] = [];

  for (const r of reglas ?? []) {
    const valor = toNum(r.valor);
    if (r.tipo === "puntos_por_clp") {
      filas.push({ tipo: "puntos", cantidad: Math.floor(monto * valor), pct: null, notas: `${r.nombre} (${monto.toLocaleString("es-CL")} CLP)` });
    } else if (r.tipo === "rebate_porcentual") {
      const enTramo =
        (r.umbral_min_clp == null || monto >= toNum(r.umbral_min_clp)) &&
        (r.umbral_max_clp == null || monto <= toNum(r.umbral_max_clp));
      if (enTramo) {
        filas.push({ tipo: "rebate", cantidad: Math.round((monto * valor) / 100), pct: valor, notas: `${r.nombre} (${valor}%)` });
      }
    } else if (r.tipo === "bonus_recompra_rapida" && r.dias_max != null) {
      const { data: previo } = await supabase
        .from("b2b_pedidos")
        .select("fecha")
        .eq("revendedor_id", revendedorId)
        .not("estado", "eq", "cancelado")
        .lt("fecha", fechaPedido)
        .order("fecha", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (previo) {
        const dias = (new Date(fechaPedido).getTime() - new Date(previo.fecha).getTime()) / 86400000;
        if (dias <= toNum(r.dias_max)) {
          filas.push({ tipo: "bonus", cantidad: Math.round(valor), pct: null, notas: `${r.nombre} (recompra en ${Math.round(dias)} días)` });
        }
      }
    } else if (r.tipo === "bonus_rango" && r.skus_min != null && setSkus >= toNum(r.skus_min)) {
      filas.push({ tipo: "bonus", cantidad: Math.round(valor), pct: null, notas: `${r.nombre} (${setSkus} SKUs)` });
    } else if (r.tipo === "co_op") {
      filas.push({ tipo: "co_op", cantidad: Math.round((monto * valor) / 100), pct: valor, notas: `${r.nombre} (${valor}%)` });
    }
  }

  for (const f of filas) {
    await supabase.from("fid_retribuciones").insert({
      revendedor_id: revendedorId,
      pedido_id: pedidoId,
      tipo: f.tipo,
      cantidad: f.cantidad,
      pct_aplicado: f.pct,
      estado: "acreditada",
      notas: f.notas,
    });
  }
  return filas.reduce((a, f) => a + f.cantidad, 0);
}

/** Contra-asiento: al cancelar/eliminar un pedido con retribuciones. */
async function revertirRetribuciones(
  supabase: AppVariables["supabase"],
  pedidoId: string,
  motivo: string,
) {
  const { data: rets } = await supabase
    .from("fid_retribuciones")
    .select("id, revendedor_id, tipo, cantidad, pct_aplicado, notas")
    .eq("pedido_id", pedidoId)
    .not("estado", "eq", "revertida");
  for (const r of rets ?? []) {
    const { data: contra } = await supabase
      .from("fid_retribuciones")
      .insert({
        revendedor_id: r.revendedor_id,
        pedido_id: pedidoId,
        tipo: r.tipo,
        cantidad: -toNum(r.cantidad),
        pct_aplicado: r.pct_aplicado,
        estado: "revertida",
        notas: `${motivo} — contra-asiento de ${r.notas ?? r.tipo}`,
      })
      .select("id")
      .single();
    await supabase
      .from("fid_retribuciones")
      .update({ estado: "revertida", contra_parte_id: contra?.id ?? null })
      .eq("id", r.id);
  }
}

async function aplicarCreditoLockIn(
  supabase: AppVariables["supabase"],
  revendedorId: string,
  pedidoId: string,
  monto: number,
): Promise<number> {
  // Crédito lock-in: puntos/bonus acreditados se descuentan del próximo pedido.
  const { data: rets } = await supabase
    .from("fid_retribuciones")
    .select("id, cantidad")
    .eq("revendedor_id", revendedorId)
    .in("tipo", ["puntos", "bonus"])
    .eq("estado", "acreditada");
  const credito = (rets ?? []).reduce((a, r) => a + toNum(r.cantidad), 0);
  if (credito <= 0 || monto <= 0) return monto;

  // 1 punto = $1 de descuento (regla declarada en dos oraciones).
  const descuento = Math.min(credito, monto);
  await supabase.from("b2b_pedidos").update({ monto_clp: monto - descuento }).eq("id", pedidoId);
  const { data: usadas } = await supabase
    .from("fid_retribuciones")
    .select("id")
    .eq("revendedor_id", revendedorId)
    .in("tipo", ["puntos", "bonus"])
    .eq("estado", "acreditada")
    .limit(rets?.length ?? 0);
  for (const u of usadas ?? []) {
    await supabase.from("fid_retribuciones").update({ estado: "aplicada" }).eq("id", u.id);
  }
  return monto - descuento;
}

/* ── Puntos de venta ───────────────────────────────────────────────────────── */

/** GET /api/b2b/puntos-venta */
b2bRoutes.get("/puntos-venta", requireProfileRole("admin"), async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await supabase
    .from("b2b_puntos_venta")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

/** POST /api/b2b/puntos-venta */
b2bRoutes.post(
  "/puntos-venta",
  requireProfileRole("admin"),
  zValidator("json", puntoVentaFormSchema),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const codigo = generarCodigo();
    const { data, error } = await supabase
      .from("b2b_puntos_venta")
      .insert({ ...input, codigo_acceso: codigo, origen: "marca", contacto_email: input.contacto_email ?? null })
      .select("*")
      .single();
    if (error) return c.json({ code: "create_failed", message: error.message }, 400);
    return c.json({ data }, 201);
  },
);

/** PATCH /api/b2b/puntos-venta/:id */
b2bRoutes.patch(
  "/puntos-venta/:id",
  requireProfileRole("admin"),
  zValidator("json", puntoVentaFormSchema.partial()),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase
      .from("b2b_puntos_venta")
      .update({ ...input, contacto_email: input.contacto_email === undefined ? undefined : input.contacto_email ?? null })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);

/** POST /api/b2b/puntos-venta/:id/regenerar-codigo */
b2bRoutes.post("/puntos-venta/:id/regenerar-codigo", requireProfileRole("admin"), async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const { data, error } = await supabase
    .from("b2b_puntos_venta")
    .update({ codigo_acceso: generarCodigo() })
    .eq("id", id)
    .select("id, codigo_acceso")
    .single();
  if (error) return c.json({ code: "update_failed", message: error.message }, 400);
  return c.json({ data });
});

/* ── Revendedores ──────────────────────────────────────────────────────────── */

/** GET /api/b2b/revendedores */
b2bRoutes.get("/revendedores", requireProfileRole("admin"), async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await supabase
    .from("b2b_revendedores")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

/** POST /api/b2b/revendedores */
b2bRoutes.post(
  "/revendedores",
  requireProfileRole("admin"),
  zValidator("json", revendedorFormSchema),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase
      .from("b2b_revendedores")
      .insert({ ...input, codigo_revendedor: generarCodigo(), origen: "marca", whatsapp: input.whatsapp ?? null })
      .select("*")
      .single();
    if (error) return c.json({ code: "create_failed", message: error.message }, 400);
    return c.json({ data }, 201);
  },
);

/** PATCH /api/b2b/revendedores/:id */
b2bRoutes.patch(
  "/revendedores/:id",
  requireProfileRole("admin"),
  zValidator("json", revendedorFormSchema.partial()),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase
      .from("b2b_revendedores")
      .update({ ...input, whatsapp: input.whatsapp === undefined ? undefined : input.whatsapp ?? null })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);

/** GET /api/b2b/revendedores/:id/retribuciones */
b2bRoutes.get("/revendedores/:id/retribuciones", requireProfileRole("admin"), async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const { data, error } = await supabase
    .from("fid_retribuciones")
    .select("*")
    .eq("revendedor_id", id)
    .order("created_at", { ascending: false });
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

/* ── Sets ──────────────────────────────────────────────────────────────────── */

/** GET /api/b2b/productos — catálogo de tienda visible (para armar sets) */
b2bRoutes.get("/productos", async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await supabase
    .from("productos")
    .select("id, nombre, precio")
    .eq("visible", true)
    .order("nombre");
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

/** GET /api/b2b/sets — todos (admin) o activos (cualquier autenticado, para portales) */
b2bRoutes.get("/sets", async (c) => {
  const supabase = c.get("supabase");
  const profileRole = c.get("profileRole");
  const { data, error } = await supabase
    .from("b2b_sets_entrada")
    .select("*, b2b_set_items(*, productos(id, nombre, precio))")
    .order("sort_order");
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  const rows = (data ?? [])
    .filter((s) => profileRole === "admin" || s.activo)
    .map((s) => ({ ...s, items: s.b2b_set_items ?? [] }));
  return c.json({ data: rows });
});

/** POST /api/b2b/sets */
b2bRoutes.post(
  "/sets",
  requireProfileRole("admin"),
  zValidator("json", setEntradaFormSchema),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase
      .from("b2b_sets_entrada")
      .insert(input)
      .select("*")
      .single();
    if (error) return c.json({ code: "create_failed", message: error.message }, 400);
    return c.json({ data }, 201);
  },
);

/** PATCH /api/b2b/sets/:id */
b2bRoutes.patch(
  "/sets/:id",
  requireProfileRole("admin"),
  zValidator("json", setEntradaFormSchema.partial()),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase
      .from("b2b_sets_entrada")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);

/** DELETE /api/b2b/sets/:id */
b2bRoutes.delete("/sets/:id", requireProfileRole("admin"), async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const { error } = await supabase.from("b2b_sets_entrada").delete().eq("id", id);
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/** POST /api/b2b/sets/:id/items */
b2bRoutes.post(
  "/sets/:id/items",
  requireProfileRole("admin"),
  zValidator("json", setItemFormSchema),
  async (c) => {
    const setId = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase
      .from("b2b_set_items")
      .insert({ set_id: setId, ...input, notas: input.notas ?? null })
      .select("*")
      .single();
    if (error) return c.json({ code: "create_failed", message: error.message }, 400);
    return c.json({ data }, 201);
  },
);

/** PATCH /api/b2b/sets/:id/items/:itemId */
b2bRoutes.patch(
  "/sets/:id/items/:itemId",
  requireProfileRole("admin"),
  zValidator("json", setItemFormSchema.partial()),
  async (c) => {
    const itemId = c.req.param("itemId");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase
      .from("b2b_set_items")
      .update({ ...input, notas: input.notas === undefined ? undefined : input.notas ?? null })
      .eq("id", itemId)
      .select("*")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);

/** DELETE /api/b2b/sets/:id/items/:itemId */
b2bRoutes.delete("/sets/:id/items/:itemId", requireProfileRole("admin"), async (c) => {
  const itemId = c.req.param("itemId");
  const supabase = c.get("supabase");
  const { error } = await supabase.from("b2b_set_items").delete().eq("id", itemId);
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/* ── Pedidos ───────────────────────────────────────────────────────────────── */

/** GET /api/b2b/pedidos?estado=&punto_venta_id=&revendedor_id= — admin (el portal usa /portal) */
b2bRoutes.get("/pedidos", requireProfileRole("admin"), async (c) => {
  const supabase = c.get("supabase");
  let q = supabase
    .from("b2b_pedidos")
    .select("*, b2b_sets_entrada(id, nombre), b2b_puntos_venta(id, nombre), b2b_revendedores(id, nombre)")
    .order("created_at", { ascending: false });
  const estado = c.req.query("estado");
  const punto = c.req.query("punto_venta_id");
  const rev = c.req.query("revendedor_id");
  if (estado) q = q.eq("estado", estado);
  if (punto) q = q.eq("punto_venta_id", punto);
  if (rev) q = q.eq("revendedor_id", rev);
  const { data, error } = await q;
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  const rows = (data ?? []).map((r) => ({
    ...r,
    set: r.b2b_sets_entrada,
    punto_venta: r.b2b_puntos_venta,
    revendedor: r.b2b_revendedores,
  }));
  return c.json({ data: rows });
});

/** POST /api/b2b/pedidos — admin o el portal (dueño/revendedor) */
b2bRoutes.post("/pedidos", zValidator("json", pedidoFormSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data: set } = await supabase
    .from("b2b_sets_entrada")
    .select("id, precio_clp, activo")
    .eq("id", input.set_id)
    .eq("activo", true)
    .maybeSingle();
  if (!set) return c.json({ code: "set_invalido", message: "Set no disponible" }, 400);

  const payload: Record<string, unknown> = {
    set_id: input.set_id,
    monto_clp: Number(set.precio_clp),
    notas: input.notas ?? null,
    user_id: user.id,
  };
  if (input.punto_venta_id) {
    const { data: pv } = await supabase
      .from("b2b_puntos_venta")
      .select("id")
      .eq("id", input.punto_venta_id)
      .maybeSingle();
    if (pv) payload.punto_venta_id = pv.id;
  }
  if (input.revendedor_id) {
    const { data: rv } = await supabase
      .from("b2b_revendedores")
      .select("id")
      .eq("id", input.revendedor_id)
      .maybeSingle();
    if (rv) payload.revendedor_id = rv.id;
  }

  const { data, error } = await supabase.from("b2b_pedidos").insert(payload).select("*").single();
  if (error) return c.json({ code: "create_failed", message: error.message }, 400);
  return c.json({ data }, 201);
});

/** PATCH /api/b2b/pedidos/:id — admin: confirmar dispara retribución; cancelar, contra-asiento */
b2bRoutes.patch(
  "/pedidos/:id",
  requireProfileRole("admin"),
  zValidator("json", z.object({ estado: z.enum(["solicitado", "confirmado", "enviado", "entregado", "cancelado"]) }).strict()),
  async (c) => {
    const id = c.req.param("id");
    const { estado } = c.req.valid("json");
    const supabase = c.get("supabase");

    const { data: pedido } = await supabase
      .from("b2b_pedidos")
      .select("id, revendedor_id, set_id, monto_clp, estado, fecha")
      .eq("id", id)
      .maybeSingle();
    if (!pedido) return c.json({ code: "not_found", message: "Pedido no encontrado" }, 404);

    if (estado === "confirmado" && pedido.estado !== "confirmado" && pedido.revendedor_id) {
      // SKUs del set (para bonus_rango)
      const setSkus = pedido.set_id
        ? ((await supabase.from("b2b_set_items").select("id").eq("set_id", pedido.set_id)).data?.length ?? 0)
        : 0;
      const credito = await aplicarCreditoLockIn(supabase, pedido.revendedor_id, id, Number(pedido.monto_clp));
      await calcularRetribucion(
        supabase, pedido.revendedor_id, id, credito, setSkus, pedido.fecha,
      );
    }

    if (estado === "cancelado" && pedido.estado !== "cancelado") {
      await revertirRetribuciones(supabase, id, "Pedido cancelado");
    }

    const { data, error } = await supabase
      .from("b2b_pedidos")
      .update({ estado })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);

/** DELETE /api/b2b/pedidos/:id — admin; bloqueado si el pedido tiene retribuciones
 *  (los ledgers no se borran: cámbialo a «cancelado» para generar el contra-asiento). */
b2bRoutes.delete("/pedidos/:id", requireProfileRole("admin"), async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const { count } = await supabase
    .from("fid_retribuciones")
    .select("id", { count: "exact", head: true })
    .eq("pedido_id", id);
  if ((count ?? 0) > 0) {
    return c.json(
      {
        code: "cancelar_primero",
        message: "Este pedido tiene retribuciones: cámbialo a «cancelado» para generar el contra-asiento (los ledgers no se borran).",
      },
      409,
    );
  }
  const { error } = await supabase.from("b2b_pedidos").delete().eq("id", id);
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/* ── Claim (el código es un gatillante, no el único) ───────────────────────── */

/** POST /api/b2b/claim { codigo } — vincula un punto de venta o revendedor al usuario */
b2bRoutes.post(
  "/claim",
  zValidator("json", z.object({ codigo: z.string().min(4).max(20) }).strict()),
  async (c) => {
    const { codigo } = c.req.valid("json");
    const supabase = c.get("supabase");
    const user = c.get("user");
    const codigoNorm = codigo.trim().toUpperCase();

    const [pv, rv] = await Promise.all([
      supabase.from("b2b_puntos_venta").select("id, user_id").eq("codigo_acceso", codigoNorm).maybeSingle(),
      supabase.from("b2b_revendedores").select("id, user_id").eq("codigo_revendedor", codigoNorm).maybeSingle(),
    ]);

    if (!pv.data && !rv.data) {
      return c.json({ code: "codigo_invalido", message: "El código no corresponde a ningún local o revendedor" }, 404);
    }

    if (pv.data) {
      if (pv.data.user_id && pv.data.user_id !== user.id) {
        return c.json({ code: "ya_reclamado", message: "Este local ya tiene dueño" }, 409);
      }
      const { data, error } = await supabase
        .from("b2b_puntos_venta")
        .update({ user_id: user.id })
        .eq("id", pv.data.id)
        .select("id, nombre, codigo_acceso")
        .single();
      if (error) return c.json({ code: "update_failed", message: error.message }, 400);
      return c.json({ data: { tipo: "punto_venta", ...data } });
    }

    if (!rv.data || (rv.data.user_id && rv.data.user_id !== user.id)) {
      return c.json({ code: "ya_reclamado", message: "Este revendedor ya está vinculado a otra cuenta" }, 409);
    }
    const { data, error } = await supabase
      .from("b2b_revendedores")
      .update({ user_id: user.id })
      .eq("id", rv.data.id)
      .select("id, nombre, codigo_revendedor")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data: { tipo: "revendedor", ...data } });
  },
);

/* ── Portal (dueño de local y revendedor) ──────────────────────────────────── */

/** GET /api/b2b/portal — todo lo del usuario autenticado */
b2bRoutes.get("/portal", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const [pv, rv] = await Promise.all([
    supabase.from("b2b_puntos_venta").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("b2b_revendedores").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const pedidosOr = pv.data && rv.data
    ? `punto_venta_id.eq.${pv.data.id},revendedor_id.eq.${rv.data.id}`
    : pv.data
      ? `punto_venta_id.eq.${pv.data.id}`
      : rv.data
        ? `revendedor_id.eq.${rv.data.id}`
        : "punto_venta_id.is.null";

  const [sets, pedidos, programas, retribuciones, tiers, resenas] = await Promise.all([
    supabase
      .from("b2b_sets_entrada")
      .select("*, b2b_set_items(*, productos(id, nombre, precio))")
      .eq("activo", true)
      .order("sort_order"),
    supabase
      .from("b2b_pedidos")
      .select("*, b2b_sets_entrada(id, nombre)")
      .or(pedidosOr)
      .order("created_at", { ascending: false }),
    pv.data
      ? supabase.from("fid_programas").select("*").eq("punto_venta_id", pv.data.id)
      : Promise.resolve({ data: [] }),
    rv.data
      ? supabase.from("fid_retribuciones").select("*").eq("revendedor_id", rv.data.id).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase.from("fid_retribucion_tiers").select("*").eq("activo", true).order("sort_order"),
    rv.data
      ? supabase
          .from("b2b_resenas_revendedor")
          .select("*, b2b_revendedores(id, nombre)")
          .or(`revendedor_id.eq.${rv.data.id},estado.eq.aprobada`)
          .order("created_at", { ascending: false })
      : supabase.from("b2b_resenas_revendedor").select("*, b2b_revendedores(id, nombre)").eq("estado", "aprobada"),
  ]);

  // Compras de 12 meses (ventana móvil) + tier + crédito disponible
  let compras12m = 0;
  let credito = 0;
  if (rv.data) {
    const { data: compras } = await supabase
      .from("b2b_pedidos")
      .select("monto_clp")
      .eq("revendedor_id", rv.data.id)
      .not("estado", "eq", "cancelado")
      .gte("fecha", new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10));
    compras12m = (compras ?? []).reduce((a, p) => a + toNum(p.monto_clp), 0);
    const { data: rets } = await supabase
      .from("fid_retribuciones")
      .select("tipo, cantidad")
      .eq("revendedor_id", rv.data.id)
      .in("estado", ["acreditada", "aplicada"]);
    credito = (rets ?? []).reduce((a, r) => a + (r.tipo === "co_op" || r.tipo === "rebate" ? 0 : toNum(r.cantidad)), 0);
  }

  const tierConProgreso = (tiers.data ?? []).map((t) => ({
    ...t,
    progreso_clp: compras12m,
    compras_12m_clp: compras12m,
  }));

  return c.json({
    data: {
      punto: pv.data ?? null,
      revendedor: rv.data ?? null,
      sets: (sets.data ?? []).map((s) => ({ ...s, items: s.b2b_set_items ?? [] })),
      pedidos: (pedidos.data ?? []).map((p) => ({ ...p, set: p.b2b_sets_entrada })),
      programas: programas.data ?? [],
      retribuciones: retribuciones.data ?? [],
      tiers: tierConProgreso,
      resenas_revendedor: (resenas.data ?? []).map((r) => ({ ...r, revendedor: r.b2b_revendedores })),
      credito_disponible: credito,
    },
  });
});

/* ── Fidelización del punto (dueño/admin) ──────────────────────────────────── */

/** GET /api/b2b/fidelizacion?punto_id= — admin (el portal ve su fidelización vía /portal) */
b2bRoutes.get("/fidelizacion", requireProfileRole("admin"), async (c) => {
  const supabase = c.get("supabase");
  const puntoId = c.req.query("punto_id");
  if (!puntoId) return c.json({ code: "invalid_params", message: "Falta punto_id" }, 400);

  const [programas, membresias, eventos, canjes] = await Promise.all([
    supabase.from("fid_programas").select("*").eq("punto_venta_id", puntoId).order("created_at"),
    supabase
      .from("fid_membresias")
      .select("*, fid_clientes(id, nombre, email, whatsapp, codigo_cliente)")
      .eq("punto_venta_id", puntoId)
      .order("saldo_sellos", { ascending: false }),
    supabase
      .from("fid_eventos")
      .select("*")
      .eq("punto_venta_id", puntoId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("fid_canjes")
      .select("*, fid_clientes(id, nombre, email, whatsapp)")
      .eq("punto_venta_id", puntoId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return c.json({
    data: {
      programas: programas.data ?? [],
      membresias: (membresias.data ?? []).map((m) => ({ ...m, cliente: m.fid_clientes })),
      eventos: eventos.data ?? [],
      canjes: (canjes.data ?? []).map((x) => ({ ...x, cliente: x.fid_clientes })),
    },
  });
});

/** POST /api/b2b/fidelizacion/programas */
b2bRoutes.post(
  "/fidelizacion/programas",
  zValidator("json", fidProgramaFormSchema.extend({ punto_venta_id: z.string().uuid() })),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase.from("fid_programas").insert(input).select("*").single();
    if (error) return c.json({ code: "create_failed", message: error.message }, 400);
    return c.json({ data }, 201);
  },
);

/** PATCH /api/b2b/fidelizacion/programas/:id */
b2bRoutes.patch(
  "/fidelizacion/programas/:id",
  zValidator("json", fidProgramaFormSchema.partial()),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase.from("fid_programas").update(input).eq("id", id).select("*").single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);

/** DELETE /api/b2b/fidelizacion/programas/:id */
b2bRoutes.delete("/fidelizacion/programas/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const { error } = await supabase.from("fid_programas").delete().eq("id", id);
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/** POST /api/b2b/fidelizacion/eventos — el dueño registra una compra del cliente */
b2bRoutes.post(
  "/fidelizacion/eventos",
  zValidator(
    "json",
    z.object({
      punto_venta_id: z.string().uuid(),
      identidad: z.string().min(1).max(120),  // email, whatsapp o codigo_cliente
      monto_clp: z.number().int().min(0),
    }).strict(),
  ),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = c.get("supabase");

    // Resolver cliente por identidad (email / whatsapp / codigo_cliente)
    const ident = input.identidad.trim().toLowerCase();
    const identWhatsapp = normalizarWhatsapp(input.identidad) ?? ident;
    let query = supabase
      .from("fid_clientes")
      .select("*")
      .eq("email", ident);
    const { data: porEmail } = await query.maybeSingle();
    const { data: porWhatsapp } = porEmail
      ? { data: null }
      : await supabase.from("fid_clientes").select("*").eq("whatsapp", identWhatsapp).maybeSingle();
    const { data: porCodigo } = porEmail || porWhatsapp
      ? { data: null }
      : await supabase.from("fid_clientes").select("*").eq("codigo_cliente", input.identidad.trim().toUpperCase()).maybeSingle();

    let cliente = porEmail ?? porWhatsapp ?? porCodigo;
    if (!cliente) {
      const nuevo = await supabase
        .from("fid_clientes")
        .insert({
          email: ident.includes("@") ? ident : null,
          whatsapp: ident.includes("@") ? null : identWhatsapp,
          codigo_cliente: await generarCodigo(8),
          consentimiento: false,
        })
        .select("*")
        .single();
      cliente = nuevo.data;
    }
    if (!cliente) return c.json({ code: "cliente_error", message: "No se pudo resolver el cliente" }, 400);

    // Asegurar membresía (endowed progress: sellos_iniciales = 1)
    let membresia = await supabase
      .from("fid_membresias")
      .select("*")
      .eq("cliente_id", cliente.id)
      .eq("punto_venta_id", input.punto_venta_id)
      .maybeSingle();
    if (!membresia.data) {
      const creada = await supabase
        .from("fid_membresias")
        .insert({
          cliente_id: cliente.id,
          punto_venta_id: input.punto_venta_id,
          saldo_sellos: 1,  // endowed progress (Nunes & Drèze 2006)
          sellos_iniciales: 1,
        })
        .select("*")
        .single();
      membresia = creada;
    }
    const mem = membresia.data;
    if (!mem) return c.json({ code: "membresia_error", message: "No se pudo crear la membresía" }, 400);

    const { data: programa } = await supabase
      .from("fid_programas")
      .select("*")
      .eq("punto_venta_id", input.punto_venta_id)
      .eq("activo", true)
      .order("created_at")
      .limit(1)
      .maybeSingle();

    const puntosPorClp = await leerValor(supabase, "cliente_puntos_por_clp", 1000);
    const cantidad = programa?.tipo === "puntos"
      ? Math.floor(input.monto_clp / puntosPorClp)
      : 1;  // sellos: 1 por compra

    await supabase.from("fid_eventos").insert({
      cliente_id: cliente.id,
      punto_venta_id: input.punto_venta_id,
      membresia_id: mem.id,
      tipo: "compra",
      cantidad,
      origen: "portal",
      notas: `Compra de ${input.monto_clp.toLocaleString("es-CL")} CLP`,
    });

    const saldo = programa?.tipo === "puntos"
      ? { saldo_puntos: Number(mem.saldo_puntos) + cantidad }
      : { saldo_sellos: Number(mem.saldo_sellos) + cantidad };
    const { data: actualizada } = await supabase
      .from("fid_membresias")
      .update(saldo)
      .eq("id", mem.id)
      .select("*")
      .single();

    return c.json({ data: { cliente, membresia: actualizada, puntos_ganados: cantidad, programa: programa?.tipo ?? "sellos" } }, 201);
  },
);

/** POST /api/b2b/fidelizacion/canjes — el dueño aprueba y aplica el canje (con re-enganche) */
b2bRoutes.post(
  "/fidelizacion/canjes",
  zValidator(
    "json",
    z.object({
      punto_venta_id: z.string().uuid(),
      cliente_id: z.string().uuid(),
      programa_id: z.string().uuid(),
    }).strict(),
  ),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = c.get("supabase");

    const { data: programa } = await supabase
      .from("fid_programas")
      .select("*")
      .eq("id", input.programa_id)
      .eq("punto_venta_id", input.punto_venta_id)
      .maybeSingle();
    if (!programa) return c.json({ code: "programa_invalido", message: "Programa no válido para este local" }, 400);

    const { data: mem } = await supabase
      .from("fid_membresias")
      .select("*")
      .eq("cliente_id", input.cliente_id)
      .eq("punto_venta_id", input.punto_venta_id)
      .maybeSingle();
    if (!mem) return c.json({ code: "sin_membresia", message: "El cliente no tiene membresía en este local" }, 404);

    const saldo = programa.tipo === "puntos" ? Number(mem.saldo_puntos) : Number(mem.saldo_sellos);
    if (saldo < programa.umbral) {
      return c.json({ code: "saldo_insuficiente", message: `Faltan ${programa.umbral - saldo} para la recompensa` }, 409);
    }

    await supabase.from("fid_canjes").insert({
      cliente_id: input.cliente_id,
      punto_venta_id: input.punto_venta_id,
      membresia_id: mem.id,
      programa_id: programa.id,
      recompensa: programa.recompensa,
      costo: programa.umbral,
      estado: "aprobado",
    });

    // Descuento + re-enganche: primer sello/puntos del siguiente ciclo al instante (Kivetz 2006).
    const saldoNuevo = programa.tipo === "puntos"
      ? { saldo_puntos: saldo - programa.umbral }
      : { saldo_sellos: saldo - programa.umbral + 1 };
    await supabase.from("fid_membresias").update(saldoNuevo).eq("id", mem.id);

    return c.json({ data: { ok: true, recompensa: programa.recompensa } }, 201);
  },
);

/* ── Configuración (admin) ─────────────────────────────────────────────────── */

/** GET /api/b2b/configuracion */
b2bRoutes.get("/configuracion", requireProfileRole("admin"), async (c) => {
  const supabase = c.get("supabase");
  const [valores, reglas, tiers, chips] = await Promise.all([
    supabase.from("fid_valores").select("*").order("clave"),
    supabase.from("fid_retribucion_reglas").select("*").order("sort_order"),
    supabase.from("fid_retribucion_tiers").select("*").order("sort_order"),
    supabase.from("perc_chip_catalogos").select("*").order("bloque, sort_order"),
  ]);
  return c.json({
    data: {
      valores: valores.data ?? [],
      reglas: reglas.data ?? [],
      tiers: tiers.data ?? [],
      chips: chips.data ?? [],
    },
  });
});

/** PATCH /api/b2b/configuracion/valores/:id */
b2bRoutes.patch(
  "/configuracion/valores/:id",
  requireProfileRole("admin"),
  zValidator("json", fidValorFormSchema.partial()),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase.from("fid_valores").update(input).eq("id", id).select("*").single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);

/** POST /api/b2b/configuracion/reglas */
b2bRoutes.post(
  "/configuracion/reglas",
  requireProfileRole("admin"),
  zValidator("json", retribucionReglaFormSchema),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase
      .from("fid_retribucion_reglas")
      .insert(input)
      .select("*")
      .single();
    if (error) return c.json({ code: "create_failed", message: error.message }, 400);
    return c.json({ data }, 201);
  },
);

/** PATCH /api/b2b/configuracion/reglas/:id */
b2bRoutes.patch(
  "/configuracion/reglas/:id",
  requireProfileRole("admin"),
  zValidator("json", retribucionReglaFormSchema.partial()),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase
      .from("fid_retribucion_reglas")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);

/** DELETE /api/b2b/configuracion/reglas/:id */
b2bRoutes.delete("/configuracion/reglas/:id", requireProfileRole("admin"), async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const { error } = await supabase.from("fid_retribucion_reglas").delete().eq("id", id);
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/** POST /api/b2b/configuracion/tiers */
b2bRoutes.post(
  "/configuracion/tiers",
  requireProfileRole("admin"),
  zValidator("json", retribucionTierFormSchema),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase.from("fid_retribucion_tiers").insert(input).select("*").single();
    if (error) return c.json({ code: "create_failed", message: error.message }, 400);
    return c.json({ data }, 201);
  },
);

/** PATCH /api/b2b/configuracion/tiers/:id */
b2bRoutes.patch(
  "/configuracion/tiers/:id",
  requireProfileRole("admin"),
  zValidator("json", retribucionTierFormSchema.partial()),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase
      .from("fid_retribucion_tiers")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);

/** DELETE /api/b2b/configuracion/tiers/:id */
b2bRoutes.delete("/configuracion/tiers/:id", requireProfileRole("admin"), async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const { error } = await supabase.from("fid_retribucion_tiers").delete().eq("id", id);
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/** POST /api/b2b/configuracion/chips */
b2bRoutes.post(
  "/configuracion/chips",
  requireProfileRole("admin"),
  zValidator("json", chipCatalogoFormSchema),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase.from("perc_chip_catalogos").insert(input).select("*").single();
    if (error) return c.json({ code: "create_failed", message: error.message }, 400);
    return c.json({ data }, 201);
  },
);

/** PATCH /api/b2b/configuracion/chips/:id */
b2bRoutes.patch(
  "/configuracion/chips/:id",
  requireProfileRole("admin"),
  zValidator("json", chipCatalogoFormSchema.partial()),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase
      .from("perc_chip_catalogos")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);

/** DELETE /api/b2b/configuracion/chips/:id */
b2bRoutes.delete("/configuracion/chips/:id", requireProfileRole("admin"), async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const { error } = await supabase.from("perc_chip_catalogos").delete().eq("id", id);
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/* ── Reseñas de revendedores ───────────────────────────────────────────────── */

/** POST /api/b2b/resenas-revendedor — el revendedor cuenta su experiencia */
b2bRoutes.post(
  "/resenas-revendedor",
  zValidator("json", resenaRevendedorFormSchema),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { data: rv } = await supabase
      .from("b2b_revendedores")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!rv) return c.json({ code: "sin_revendedor", message: "Necesitas un perfil de revendedor vinculado" }, 403);
    const { data, error } = await supabase
      .from("b2b_resenas_revendedor")
      .insert({ revendedor_id: rv.id, ...input })
      .select("*")
      .single();
    if (error) return c.json({ code: "create_failed", message: error.message }, 400);
    return c.json({ data }, 201);
  },
);

/** PATCH /api/b2b/resenas-revendedor/:id/moderar — admin */
b2bRoutes.patch(
  "/resenas-revendedor/:id/moderar",
  requireProfileRole("admin"),
  zValidator("json", z.object({ estado: z.enum(["pendiente", "aprobada", "rechazada"]) }).strict()),
  async (c) => {
    const id = c.req.param("id");
    const { estado } = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase
      .from("b2b_resenas_revendedor")
      .update({ estado })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);
