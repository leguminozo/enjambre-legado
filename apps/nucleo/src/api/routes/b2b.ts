import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  authMiddleware, tenantMiddleware, requireProfileRole,
} from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";
import { fromLoose } from "@/api/lib/supabase-loose";
import type { Json } from "@enjambre/database/database.types";
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

/** Resuelve el punto de venta del microcanal de un vendedor de campo (por cuenta o contrato de feria). */
export async function resolverPuntoVendedor(
  supabase: AppVariables["supabase"],
  userId: string,
): Promise<{ id: string; nombre: string; codigo_acceso: string } | null> {
  const { data: contratos } = await supabase
    .from("participante_contrato")
    .select("id")
    .eq("user_id", userId);
  const contratoIds = (contratos ?? []).map((c) => c.id);
  const condicion = contratoIds.length > 0
    ? `user_id.eq.${userId},participante_contrato_id.in.(${contratoIds.join(",")})`
    : `user_id.eq.${userId}`;
  const { data: pv } = await supabase
    .from("b2b_puntos_venta")
    .select("id, nombre, codigo_acceso")
    .or(condicion)
    .maybeSingle();
  return pv ?? null;
}

/**
 * Registra una compra de fidelización del microcanal (compartido entre el
 * portal del dueño y el POS de campo): resuelve/crea el cliente global por
 * identidad, asegura la membresía (endowed progress) y acredita sellos o
 * puntos según el programa activo del punto de venta.
 */
export async function registrarEventoFid(
  supabase: AppVariables["supabase"],
  puntoVentaId: string,
  identidad: string,
  montoClp: number,
  origen: string = "portal",
): Promise<{ ok: boolean; puntos_ganados: number; cliente_id?: string; error?: string }> {
  const ident = identidad.trim().toLowerCase();
  const identWhatsapp = normalizarWhatsapp(identidad) ?? ident;

  const { data: porEmail } = await supabase
    .from("fid_clientes")
    .select("*")
    .eq("email", ident)
    .maybeSingle();
  const { data: porWhatsapp } = porEmail
    ? { data: null }
    : await supabase.from("fid_clientes").select("*").eq("whatsapp", identWhatsapp).maybeSingle();
  const { data: porCodigo } = porEmail || porWhatsapp
    ? { data: null }
    : await supabase.from("fid_clientes").select("*").eq("codigo_cliente", identidad.trim().toUpperCase()).maybeSingle();

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
  if (!cliente) return { ok: false, puntos_ganados: 0, error: "No se pudo resolver el cliente" };

  let membresia = await supabase
    .from("fid_membresias")
    .select("*")
    .eq("cliente_id", cliente.id)
    .eq("punto_venta_id", puntoVentaId)
    .maybeSingle();
  if (!membresia.data) {
    const creada = await supabase
      .from("fid_membresias")
      .insert({
        cliente_id: cliente.id,
        punto_venta_id: puntoVentaId,
        saldo_sellos: 1,
        sellos_iniciales: 1,
      })
      .select("*")
      .single();
    membresia = creada;
  }
  const mem = membresia.data;
  if (!mem) return { ok: false, puntos_ganados: 0, error: "No se pudo crear la membresía" };

  const { data: programa } = await supabase
    .from("fid_programas")
    .select("*")
    .eq("punto_venta_id", puntoVentaId)
    .eq("activo", true)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  const puntosPorClp = await leerValor(supabase, "cliente_puntos_por_clp", 1000);
  const cantidad = programa?.tipo === "puntos"
    ? Math.floor(montoClp / puntosPorClp)
    : 1;

  await supabase.from("fid_eventos").insert({
    cliente_id: cliente.id,
    punto_venta_id: puntoVentaId,
    membresia_id: mem.id,
    tipo: "compra",
    cantidad,
    origen,
    notas: `Compra de ${montoClp.toLocaleString("es-CL")} CLP`,
  });

  const saldo = programa?.tipo === "puntos"
    ? { saldo_puntos: Number(mem.saldo_puntos) + cantidad }
    : { saldo_sellos: Number(mem.saldo_sellos) + cantidad };
  await supabase.from("fid_membresias").update(saldo).eq("id", mem.id);

  return { ok: true, puntos_ganados: cantidad, cliente_id: cliente.id };
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

/** Calcula e inserta las retribuciones de un pedido al por mayor confirmado.
 *  El motor de reglas es commission_rules (rule_type 'mayorista', parameter JSONB)
 *  — consolidado desde fid_retribucion_reglas. El ledger fid_retribuciones se
 *  conserva (contra-asientos; incentivo_ledger no soporta sin-cuenta ni negativos). */
async function calcularRetribucion(
  supabase: AppVariables["supabase"],
  revendedorId: string,
  pedidoId: string,
  monto: number,
  setSkus: number,
  fechaPedido: string,
): Promise<number> {
  const { data: reglas } = await supabase
    .from("commission_rules")
    .select("*")
    .eq("rule_type", "mayorista")
    .eq("active", true)
    .order("priority");
  const filas: { tipo: string; cantidad: number; pct: number | null; notas: string }[] = [];

  // El último pedido previo es el mismo para todas las reglas bonus_recompra_rapida:
  // una sola consulta, no una por regla.
  let previoPedido: { fecha: string } | null = null;
  const hayRecompraRapida = (reglas ?? []).some(
    (r) => String(((r.parameter ?? {}) as Record<string, unknown>).tipo_original ?? "puntos_por_clp") === "bonus_recompra_rapida",
  );
  if (hayRecompraRapida) {
    const { data: previo } = await supabase
      .from("b2b_pedidos")
      .select("fecha")
      .eq("revendedor_id", revendedorId)
      .not("estado", "eq", "cancelado")
      .lt("fecha", fechaPedido)
      .order("fecha", { ascending: false })
      .limit(1)
      .maybeSingle();
    previoPedido = previo;
  }

  for (const r of reglas ?? []) {
    const p = (r.parameter ?? {}) as Record<string, unknown>;
    const tipo = String(p.tipo_original ?? "puntos_por_clp");
    const valor = Number(p.valor ?? 0);
    if (tipo === "puntos_por_clp") {
      filas.push({ tipo: "puntos", cantidad: Math.floor(monto * valor), pct: null, notas: `${r.name} (${monto.toLocaleString("es-CL")} CLP)` });
    } else if (tipo === "rebate_porcentual") {
      const enTramo =
        (p.umbral_min_clp == null || monto >= Number(p.umbral_min_clp)) &&
        (p.umbral_max_clp == null || monto <= Number(p.umbral_max_clp));
      if (enTramo) {
        filas.push({ tipo: "rebate", cantidad: Math.round((monto * valor) / 100), pct: valor, notas: `${r.name} (${valor}%)` });
      }
    } else if (tipo === "bonus_recompra_rapida" && p.dias_max != null) {
      if (previoPedido) {
        const dias = (new Date(fechaPedido).getTime() - new Date(previoPedido.fecha).getTime()) / 86400000;
        if (dias <= Number(p.dias_max)) {
          filas.push({ tipo: "bonus", cantidad: Math.round(valor), pct: null, notas: `${r.name} (recompra en ${Math.round(dias)} días)` });
        }
      }
    } else if (tipo === "bonus_rango" && p.skus_min != null && setSkus >= Number(p.skus_min)) {
      filas.push({ tipo: "bonus", cantidad: Math.round(valor), pct: null, notas: `${r.name} (${setSkus} SKUs)` });
    } else if (tipo === "co_op") {
      filas.push({ tipo: "co_op", cantidad: Math.round((monto * valor) / 100), pct: valor, notas: `${r.name} (${valor}%)` });
    }
  }

  // Un solo insert batch (antes N inserts secuenciales, uno por fila)
  if (filas.length > 0) {
    await supabase.from("fid_retribuciones").insert(
      filas.map((f) => ({
        revendedor_id: revendedorId,
        pedido_id: pedidoId,
        tipo: f.tipo,
        cantidad: f.cantidad,
        pct_aplicado: f.pct,
        estado: "acreditada",
        notas: f.notas,
      })),
    );
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

const UUID_RE_B2B = /^[0-9a-f-]{36}$/i;

// POST /api/b2b/puntos-venta/:id/aprobar — prospecto → activo + credenciales.
// Genera invitación al contacto (crea el usuario y lo vincula), publica el
// punto y avisa por la cola. Idempotente por estado.
b2bRoutes.post("/puntos-venta/:id/aprobar", requireProfileRole("admin"), async (c) => {
  const id = c.req.param("id");
  if (!UUID_RE_B2B.test(id)) return c.json({ code: "invalid_id", message: "ID inválido" }, 400);
  const supabase = c.get("supabase");

  // fromLoose: columnas de solicitud en runtime (migración 20260922160000).
  const { data: puntoRaw, error: pErr } = await fromLoose(supabase, "b2b_puntos_venta")
    .select("id, nombre, contacto_email, contacto_nombre, estado, user_id, codigo_acceso, tier_sugerido")
    .eq("id", id)
    .maybeSingle();
  if (pErr || !puntoRaw) return c.json({ code: "not_found", message: "Punto no encontrado" }, 404);
  const punto = puntoRaw as {
    id: string; nombre: string; contacto_email: string | null; contacto_nombre: string | null;
    estado: string; user_id: string | null; codigo_acceso: string; tier_sugerido: string | null;
  };
  if (punto.estado === "activo") {
    return c.json({ data: { ...punto, deduped: true } });
  }

  let userId: string | null = punto.user_id;
  if (!userId && punto.contacto_email) {
    try {
      const { createAdminClient } = await import("@enjambre/auth/server-index");
      const admin = createAdminClient();
      const { data: invitado, error: invError } = await admin.auth.admin.inviteUserByEmail(
        punto.contacto_email,
        { data: { full_name: punto.contacto_nombre ?? punto.nombre, rol_solicitado: "punto_b2b" } },
      );
      if (!invError && invitado?.user) userId = invitado.user.id;
    } catch (err) {
      console.warn("[b2b] invite failed, el punto se activa sin usuario vinculado:", err);
    }
  }

  const { data, error } = await fromLoose(supabase, "b2b_puntos_venta")
    .update({ estado: "activo", publico: true, user_id: userId })
    .eq("id", id)
    .select("id, nombre, estado, codigo_acceso, user_id, tier_sugerido")
    .single();
  if (error) return c.json({ code: "update_failed", message: (error as { message?: string }).message ?? "Error" }, 400);

  if (punto.contacto_email) {
    try {
      const { createAdminClient } = await import("@enjambre/auth/server-index");
      const admin = createAdminClient();
      await admin.from("notification_queue").insert({
        channel: "email",
        recipient: punto.contacto_email,
        subject: `Tu punto B2B quedó activo: ${punto.nombre}`,
        body: [
          `¡Bienvenido al canal mayorista! Tu local quedó aprobado${punto.tier_sugerido ? ` en tramo ${punto.tier_sugerido}` : ""}.`,
          `Tu código de acceso es ${punto.codigo_acceso}.`,
          userId
            ? "Revisa tu correo: te enviamos la invitación para crear tu contraseña y entrar al portal."
            : "Te contactaremos para activar tu acceso al portal.",
          "Portal: /punto-de-venta/portal",
        ].join("\n"),
        status: "pending",
        metadata: { via: "b2b_aprobacion", punto_venta_id: id },
      });
    } catch (err) {
      console.warn("[b2b] approval notify failed:", err);
    }
  }

  return c.json({ data });
});

// GET /api/b2b/puntos-venta/:id/patente — URL firmada de la patente (admin).
b2bRoutes.get("/puntos-venta/:id/patente", requireProfileRole("admin"), async (c) => {
  const id = c.req.param("id");
  if (!UUID_RE_B2B.test(id)) return c.json({ code: "invalid_id", message: "ID inválido" }, 400);
  const supabase = c.get("supabase");
  const { data: punto } = await fromLoose(supabase, "b2b_puntos_venta")
    .select("patente_path")
    .eq("id", id)
    .maybeSingle();
  const path = (punto as { patente_path?: string | null } | null)?.patente_path;
  if (!path) return c.json({ code: "not_found", message: "Sin patente adjunta" }, 404);
  try {
    const { createAdminClient } = await import("@enjambre/auth/server-index");
    const admin = createAdminClient();
    const { data: signed, error } = await admin.storage
      .from("b2b-patentes")
      .createSignedUrl(path, 600);
    if (error || !signed) return c.json({ code: "sign_failed", message: error?.message ?? "Error" }, 500);
    return c.json({ data: { url: signed.signedUrl } });
  } catch {
    return c.json({ code: "internal_error", message: "No se pudo firmar" }, 500);
  }
});

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

    // Consistencia con el sistema existente de aliados B2B (AliadosB2BTab del CRM).
    const { data: yaRol } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("role", "revendedor")
      .maybeSingle();
    if (!yaRol) {
      await supabase.from("user_roles").insert({ user_id: user.id, role: "revendedor" });
    }
    return c.json({ data: { tipo: "revendedor", ...data } });
  },
);

/* ── Portal (dueño de local y revendedor) ──────────────────────────────────── */

/** GET /api/b2b/mi-punto — el vendedor de campo resuelve SU punto del microcanal
 *  (por cuenta propia o por contrato de feria) para registrar fidelización. */
b2bRoutes.get("/mi-punto", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const punto = await resolverPuntoVendedor(supabase, user.id);
  if (!punto) return c.json({ data: null });
  const origin = new URL(c.req.url).origin;
  return c.json({
    data: {
      punto,
      url_landing: `${origin}/punto-de-venta/${punto.codigo_acceso}`,
    },
  });
});

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
          .from("resenas_producto")
          .select("*, b2b_revendedores(id, nombre)")
          .eq("modo", "revendedor")
          .or(`revendedor_id.eq.${rv.data.id},estado.eq.aprobada`)
          .order("created_at", { ascending: false })
      : supabase
          .from("resenas_producto")
          .select("*, b2b_revendedores(id, nombre)")
          .eq("modo", "revendedor")
          .eq("estado", "aprobada")
          .order("created_at", { ascending: false }),
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
      resenas_revendedor: (resenas.data ?? []).map((r) => ({
        id: r.id,
        revendedor_id: r.revendedor_id,
        rating: r.rating,
        texto: r.comentario_corto ?? "",
        estado: r.estado,
        created_at: r.created_at,
        revendedor: r.b2b_revendedores,
      })),
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
    const resultado = await registrarEventoFid(supabase, input.punto_venta_id, input.identidad, input.monto_clp, "portal");
    if (!resultado.ok || !resultado.cliente_id) {
      return c.json({ code: "cliente_error", message: resultado.error ?? "Error al registrar la compra" }, 400);
    }
    const { data: membresia } = await supabase
      .from("fid_membresias")
      .select("*, fid_clientes(id, nombre, email, whatsapp, codigo_cliente)")
      .eq("cliente_id", resultado.cliente_id)
      .eq("punto_venta_id", input.punto_venta_id)
      .maybeSingle();
    return c.json({
      data: {
        cliente: membresia?.fid_clientes ?? null,
        membresia,
        puntos_ganados: resultado.puntos_ganados,
      },
    }, 201);
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
    supabase.from("commission_rules").select("*").eq("rule_type", "mayorista").order("priority"),
    supabase.from("fid_retribucion_tiers").select("*").order("sort_order"),
    supabase.from("perc_chip_catalogos").select("*").order("bloque, sort_order"),
  ]);
  // Mapear commission_rules (parameter JSONB) a la forma del frontend
  const reglasMapeadas = (reglas.data ?? []).map((r) => {
    const p = (r.parameter ?? {}) as Record<string, unknown>;
    return {
      id: r.id,
      tipo: String(p.tipo_original ?? "puntos_por_clp"),
      nombre: r.name,
      valor: Number(p.valor ?? 0),
      umbral_min_clp: p.umbral_min_clp != null ? Number(p.umbral_min_clp) : null,
      umbral_max_clp: p.umbral_max_clp != null ? Number(p.umbral_max_clp) : null,
      dias_max: p.dias_max != null ? Number(p.dias_max) : null,
      skus_min: p.skus_min != null ? Number(p.skus_min) : null,
      activo: r.active,
      sort_order: r.priority,
    };
  });
  return c.json({
    data: {
      valores: valores.data ?? [],
      reglas: reglasMapeadas,
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

/** POST /api/b2b/configuracion/reglas — regla mayorista en commission_rules */
b2bRoutes.post(
  "/configuracion/reglas",
  requireProfileRole("admin"),
  zValidator("json", retribucionReglaFormSchema),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const empresaId = await empresaDeMarca(supabase, c.get("empresaId"));
    const { data, error } = await supabase
      .from("commission_rules")
      .insert({
        empresa_id: empresaId,
        rule_type: "mayorista",
        name: input.nombre,
        parameter: {
          tipo_original: input.tipo,
          valor: input.valor,
          umbral_min_clp: input.umbral_min_clp ?? null,
          umbral_max_clp: input.umbral_max_clp ?? null,
          dias_max: input.dias_max ?? null,
          skus_min: input.skus_min ?? null,
        },
        active: input.activo,
        priority: input.sort_order,
      })
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
    const payload: { name?: string; active?: boolean; priority?: number; parameter?: Json } = {};
    if (input.nombre !== undefined) payload.name = input.nombre;
    if (input.activo !== undefined) payload.active = input.activo;
    if (input.sort_order !== undefined) payload.priority = input.sort_order;
    if (input.tipo !== undefined || input.valor !== undefined || input.umbral_min_clp !== undefined
      || input.umbral_max_clp !== undefined || input.dias_max !== undefined || input.skus_min !== undefined) {
      const { data: actual } = await supabase
        .from("commission_rules")
        .select("parameter")
        .eq("id", id)
        .maybeSingle();
      const p = { ...((actual?.parameter ?? {}) as Record<string, unknown>) };
      if (input.tipo !== undefined) p.tipo_original = input.tipo;
      if (input.valor !== undefined) p.valor = input.valor;
      if (input.umbral_min_clp !== undefined) p.umbral_min_clp = input.umbral_min_clp ?? null;
      if (input.umbral_max_clp !== undefined) p.umbral_max_clp = input.umbral_max_clp ?? null;
      if (input.dias_max !== undefined) p.dias_max = input.dias_max ?? null;
      if (input.skus_min !== undefined) p.skus_min = input.skus_min ?? null;
      payload.parameter = p as unknown as Json;
    }
    const { data, error } = await supabase
      .from("commission_rules")
      .update(payload)
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
  const { error } = await supabase.from("commission_rules").delete().eq("id", id).eq("rule_type", "mayorista");
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/** Empresa de la marca: la del tenant o la primera (single-brand). */
async function empresaDeMarca(
  supabase: AppVariables["supabase"],
  tenantEmpresa: string,
): Promise<string> {
  if (tenantEmpresa) return tenantEmpresa;
  const { data } = await supabase.from("empresas").select("id").order("created_at").limit(1).maybeSingle();
  return data?.id ?? "";
}

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

/** POST /api/b2b/resenas-revendedor — el revendedor cuenta su experiencia
 *  (consolidado en resenas_producto, modo 'revendedor' — moderación existente) */
b2bRoutes.post(
  "/resenas-revendedor",
  zValidator("json", resenaRevendedorFormSchema),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { data: rv } = await supabase
      .from("b2b_revendedores")
      .select("id, nombre")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!rv) return c.json({ code: "sin_revendedor", message: "Necesitas un perfil de revendedor vinculado" }, 403);
    const { data, error } = await supabase
      .from("resenas_producto")
      .insert({
        modo: "revendedor",
        estado: "pendiente",
        rating: input.rating,
        comentario_corto: input.texto.slice(0, 2000),
        display_name: rv.nombre,
        revendedor_id: rv.id,
      })
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
      .from("resenas_producto")
      .update({ estado })
      .eq("id", id)
      .eq("modo", "revendedor")
      .select("*")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);

const B2B_CONDICIONES_SCHEMA = z.object({
  rules: z
    .object({
      moq_frascos_mixtos: z.number().int().min(1).optional(),
      moq_sachets: z.number().int().min(1).optional(),
      umbral_despacho_gratis_rm_neto_clp: z.number().min(0).optional(),
      temperatura_minima_celsius: z.number().optional(),
      temperatura_maxima_celsius: z.number().optional(),
      dias_habiles_inspeccion: z.number().int().min(1).optional(),
      dias_maximo_reclamo: z.number().int().min(1).optional(),
      dias_garantia_devolucion: z.number().int().min(1).optional(),
      porcentaje_contenido_minimo_devolucion: z.number().min(0).max(100).optional(),
    })
    .optional(),
  tiers: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        desde_clp: z.number().min(0),
        hasta_clp: z.number().nullable().optional(),
        descuento_pct: z.number().min(0).max(1),
        etiqueta: z.string().min(1),
        prioridad: z.number().int().min(1),
      }),
    )
    .optional(),
});

/** GET /api/b2b/condiciones-comerciales — admin */
b2bRoutes.get("/condiciones-comerciales", requireProfileRole("admin"), async (c) => {
  const supabase = c.get("supabase");
  const [rulesRes, tiersRes] = await Promise.all([
    supabase.from("b2b_wholesale_rules").select("*").eq("id", 1).maybeSingle(),
    supabase.from("b2b_investment_tiers").select("*").order("prioridad", { ascending: true }),
  ]);

  return c.json({
    data: {
      rules: rulesRes.data ?? null,
      tiers: tiersRes.data ?? [],
    },
  });
});

/** PATCH /api/b2b/condiciones-comerciales — admin */
b2bRoutes.patch(
  "/condiciones-comerciales",
  requireProfileRole("admin"),
  zValidator("json", B2B_CONDICIONES_SCHEMA),
  async (c) => {
    const { rules, tiers } = c.req.valid("json");
    const supabase = c.get("supabase");

    if (rules && Object.keys(rules).length > 0) {
      const { error: rulesError } = await supabase
        .from("b2b_wholesale_rules")
        .upsert({ id: 1, ...rules, updated_at: new Date().toISOString() }, { onConflict: "id" });
      if (rulesError) return c.json({ code: "rules_update_failed", message: rulesError.message }, 400);
    }

    if (tiers && tiers.length > 0) {
      for (const t of tiers) {
        const payload = {
          ...(t.id ? { id: t.id } : {}),
          desde_clp: t.desde_clp,
          hasta_clp: t.hasta_clp ?? null,
          descuento_pct: t.descuento_pct,
          etiqueta: t.etiqueta,
          prioridad: t.prioridad,
          updated_at: new Date().toISOString(),
        };
        const { error: tierError } = await supabase
          .from("b2b_investment_tiers")
          .upsert(payload, { onConflict: "prioridad" });
        if (tierError) return c.json({ code: "tier_update_failed", message: tierError.message }, 400);
      }
    }

    const [updatedRules, updatedTiers] = await Promise.all([
      supabase.from("b2b_wholesale_rules").select("*").eq("id", 1).maybeSingle(),
      supabase.from("b2b_investment_tiers").select("*").order("prioridad", { ascending: true }),
    ]);

    return c.json({
      data: {
        rules: updatedRules.data ?? null,
        tiers: updatedTiers.data ?? [],
      },
    });
  },
);
