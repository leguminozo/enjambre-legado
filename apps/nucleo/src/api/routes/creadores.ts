import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware } from "@/api/lib/middleware";
import { tenantMiddleware } from "@/api/lib/middleware";

const SAFE_EDIT_FIELDS = [
  "nombre_publico",
  "plataforma",
  "plataforma_url",
  "nicho",
  "seguidores_aprox",
  "bio",
  "avatar_url",
] as const;

const CreadorSchema = z.object({
  nombre_publico: z.string().min(2).max(60),
  plataforma: z.enum(["instagram", "tiktok", "youtube", "blog", "podcast", "otro"]),
  plataforma_url: z.string().url().optional().or(z.literal("")),
  nicho: z.string().max(100).optional(),
  seguidores_aprox: z.number().int().min(0).optional(),
  porcentaje_comision: z.number().min(0).max(30).optional(),
  descuento_cliente: z.number().min(0).max(15).optional(),
  bio: z.string().max(500).optional(),
  notas_internas: z.string().max(1000).optional(),
  avatar_url: z.string().url().optional().or(z.literal("")),
});

const CreadorSelfEditSchema = z.object({
  nombre_publico: z.string().min(2).max(60).optional(),
  plataforma: z.enum(["instagram", "tiktok", "youtube", "blog", "podcast", "otro"]).optional(),
  plataforma_url: z.string().url().optional().or(z.literal("")).optional(),
  nicho: z.string().max(100).optional(),
  seguidores_aprox: z.number().int().min(0).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional().or(z.literal("")).optional(),
});

const AplicarCodigoSchema = z.object({
  codigo: z.string().min(2).max(20),
  venta_id: z.string().uuid(),
  cliente_id: z.string().uuid().optional(),
  monto_venta: z.number().positive(),
});

const RetiroSchema = z.object({
  monto_solicitado: z.number().positive().min(5000),
  metodo_pago: z.enum(["transferencia", "paypal", "bizum", "otro"]),
  datos_pago: z.record(z.string(), z.unknown()).optional(),
});

const AprobarRetiroSchema = z.object({
  estado: z.enum(["aprobado", "pagado", "rechazado"]),
  monto_aprobado: z.number().positive().optional(),
  notas: z.string().max(500).optional(),
});

const AprobarComisionSchema = z.object({
  estado: z.enum(["aprobada", "rechazada"]),
});

const publicRoutes = new Hono<{ Variables: AppVariables }>();
publicRoutes.use("*", authMiddleware);

publicRoutes.post("/aplicar-codigo", zValidator("json", AplicarCodigoSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");

  const { data, error } = await supabase.rpc("aplicar_codigo_creador", {
    p_codigo: input.codigo,
    p_venta_id: input.venta_id,
    p_cliente_id: input.cliente_id || "00000000-0000-0000-0000-000000000000",
    p_monto_venta: input.monto_venta,
  });

  if (error) {
    return c.json({ code: "code_apply_failed", message: error.message }, 400);
  }

  if (data && !data[0]?.valido) {
    return c.json({ code: "invalid_code", message: data[0]?.creador_nombre || "Código de creador no válido o inactivo" }, 404);
  }

  return c.json({ data: data[0] });
});

publicRoutes.get("/validar/:codigo", async (c) => {
  const codigo = c.req.param("codigo");
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("creadores")
    .select("nombre_publico, descuento_cliente, plataforma")
    .ilike("codigo_ref", codigo)
    .eq("estado", "activo")
    .single();

  if (error || !data) {
    return c.json({ code: "invalid_code", message: "Código no encontrado o inactivo" }, 404);
  }

  return c.json({
    data: {
      valido: true,
      nombre_publico: data.nombre_publico,
      descuento_cliente: data.descuento_cliente,
      plataforma: data.plataforma,
    },
  });
});

const protectedRoutes = new Hono<{ Variables: AppVariables }>();
protectedRoutes.use("*", authMiddleware, tenantMiddleware);

protectedRoutes.post("/", zValidator("json", CreadorSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data: existing } = await supabase
    .from("creadores")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return c.json({ code: "already_creator", message: "Este usuario ya es creador" }, 409);
  }

  const { data: codigoData, error: codigoError } = await supabase.rpc(
    "generar_codigo_creador",
    { nombre: input.nombre_publico }
  );

  if (codigoError || !codigoData) {
    return c.json({ code: "code_gen_failed", message: "No se pudo generar el código de referencia" }, 500);
  }

  const payload = {
    user_id: user.id,
    nombre_publico: input.nombre_publico,
    codigo_ref: codigoData,
    plataforma: input.plataforma,
    plataforma_url: input.plataforma_url || null,
    nicho: input.nicho || null,
    seguidores_aprox: input.seguidores_aprox || 0,
    porcentaje_comision: input.porcentaje_comision ?? 5.0,
    descuento_cliente: input.descuento_cliente ?? 3.0,
    bio: input.bio || null,
    notas_internas: input.notas_internas || null,
    avatar_url: input.avatar_url || null,
  };

  const { data, error } = await supabase
    .from("creadores")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "creator_create_failed", message: error.message }, 400);
  }

  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert({ user_id: user.id, role: "creador", is_active: true });

  if (roleError) {
    console.error("Failed to upsert creador role:", roleError.message);
  }

  return c.json({ data }, 201);
});

protectedRoutes.get("/me", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("creadores")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return c.json({ code: "not_creator", message: "No eres creador registrado" }, 404);
  }

  return c.json({ data });
});

protectedRoutes.patch("/me", zValidator("json", CreadorSelfEditSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data: creator } = await supabase
    .from("creadores")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!creator) {
    return c.json({ code: "not_creator", message: "No eres creador registrado" }, 404);
  }

  const safeInput: Record<string, unknown> = {};
  for (const key of SAFE_EDIT_FIELDS) {
    if (key in input) {
      safeInput[key] = input[key as keyof typeof input];
    }
  }

  const { data, error } = await supabase
    .from("creadores")
    .update(safeInput)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "creator_update_failed", message: error.message }, 400);
  }

  return c.json({ data });
});

protectedRoutes.get("/me/balance", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("creador_balance_view")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return c.json({ code: "not_creator", message: "Balance no disponible" }, 404);
  }

  return c.json({ data });
});

protectedRoutes.get("/me/comisiones", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const estado = c.req.query("estado");

  const { data: creator } = await supabase
    .from("creadores")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!creator) {
    return c.json({ code: "not_creator", message: "No eres creador" }, 404);
  }

  let query = supabase
    .from("creador_comisiones")
    .select("*")
    .eq("creador_id", creator.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (estado) query = query.eq("estado", estado);

  const { data, error } = await query;

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

protectedRoutes.get("/me/usos", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data: creator } = await supabase
    .from("creadores")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!creator) {
    return c.json({ code: "not_creator", message: "No eres creador" }, 404);
  }

  const { data, error } = await supabase
    .from("creador_codigo_usos")
    .select("*")
    .eq("creador_id", creator.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

protectedRoutes.get("/me/metricas", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data: creator } = await supabase
    .from("creadores")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!creator) {
    return c.json({ code: "not_creator", message: "No eres creador" }, 404);
  }

  const { data, error } = await supabase
    .from("creador_metricas_mes")
    .select("*")
    .eq("creador_id", creator.id)
    .order("mes", { ascending: false })
    .limit(12);

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

protectedRoutes.post("/me/retiros", zValidator("json", RetiroSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase.rpc("solicitar_retiro_creador", {
    p_user_id: user.id,
    p_monto: input.monto_solicitado,
    p_metodo_pago: input.metodo_pago,
    p_datos_pago: input.datos_pago || null,
  });

  if (error) {
    const msg = error.message;
    if (msg === "NOT_CREATOR") {
      return c.json({ code: "not_creator", message: "No eres creador activo" }, 404);
    }
    if (msg === "INSUFFICIENT_BALANCE") {
      return c.json({ code: "insufficient_balance", message: "Balance insuficiente para este retiro" }, 400);
    }
    if (msg === "TOO_MANY_PENDING") {
      return c.json({ code: "too_many_pending", message: "Tienes demasiados retiros pendientes (máximo 3)" }, 400);
    }
    return c.json({ code: "retiro_create_failed", message: msg }, 400);
  }

  return c.json({ data }, 201);
});

protectedRoutes.get("/me/retiros", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data: creator } = await supabase
    .from("creadores")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!creator) {
    return c.json({ code: "not_creator", message: "No eres creador" }, 404);
  }

  const { data, error } = await supabase
    .from("creador_retiros")
    .select("id, monto_solicitado, monto_aprobado, estado, metodo_pago, created_at, notas, revisado_at")
    .eq("creador_id", creator.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

protectedRoutes.get("/admin/todos", async (c) => {
  const supabase = c.get("supabase");

  const estado = c.req.query("estado");

  let query = supabase
    .from("creadores")
    .select("*, profiles!creadores_user_id_fkey(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (estado) query = query.eq("estado", estado);

  const { data, error } = await query;

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

protectedRoutes.patch("/admin/:id/estado", async (c) => {
  const creadorId = c.req.param("id");
  const supabase = c.get("supabase");
  const body = await c.req.json<{ estado: string }>();

  if (!["activo", "suspendido", "inactivo", "pendiente"].includes(body.estado)) {
    return c.json({ code: "invalid_state", message: "Estado no válido" }, 400);
  }

  const { data, error } = await supabase
    .from("creadores")
    .update({ estado: body.estado })
    .eq("id", creadorId)
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "update_failed", message: error.message }, 400);
  }

  if (body.estado === "activo") {
    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert({ user_id: data.user_id, role: "creador", is_active: true });

    if (roleError) {
      console.error("Failed to upsert creador role on activation:", roleError.message);
    }
  }

  return c.json({ data });
});

protectedRoutes.patch("/admin/:id/comision-tasa", async (c) => {
  const creadorId = c.req.param("id");
  const supabase = c.get("supabase");
  const body = await c.req.json<{ porcentaje_comision: number; descuento_cliente?: number }>();

  const updatePayload: Record<string, unknown> = { porcentaje_comision: body.porcentaje_comision };
  if (body.descuento_cliente !== undefined) updatePayload.descuento_cliente = body.descuento_cliente;

  const { data, error } = await supabase
    .from("creadores")
    .update(updatePayload)
    .eq("id", creadorId)
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "update_failed", message: error.message }, 400);
  }

  return c.json({ data });
});

protectedRoutes.patch("/admin/comisiones/:comisionId", zValidator("json", AprobarComisionSchema), async (c) => {
  const comisionId = c.req.param("comisionId");
  const input = c.req.valid("json");
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("creador_comisiones")
    .update({ estado: input.estado })
    .eq("id", comisionId)
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "update_failed", message: error.message }, 400);
  }

  return c.json({ data });
});

protectedRoutes.patch("/admin/retiros/:retiroId", zValidator("json", AprobarRetiroSchema), async (c) => {
  const retiroId = c.req.param("retiroId");
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const updatePayload: Record<string, unknown> = {
    estado: input.estado,
    revisado_por: user.id,
    revisado_at: new Date().toISOString(),
  };
  if (input.monto_aprobado) updatePayload.monto_aprobado = input.monto_aprobado;
  if (input.notas) updatePayload.notas = input.notas;

  const { data, error } = await supabase
    .from("creador_retiros")
    .update(updatePayload)
    .eq("id", retiroId)
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "update_failed", message: error.message }, 400);
  }

  const { datos_pago, ...safeData } = data;
  return c.json({ data: safeData });
});

protectedRoutes.get("/admin/ranking", async (c) => {
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("creador_ranking_view")
    .select("*")
    .limit(50);

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

protectedRoutes.post("/admin/calcular-metricas", async (c) => {
  const supabase = c.get("supabase");
  const body = await c.req.json<{ mes: string }>();

  if (!body.mes || !/^\d{4}-\d{2}$/.test(body.mes)) {
    return c.json({ code: "invalid_month", message: "Formato de mes inválido (YYYY-MM)" }, 400);
  }

  const { error } = await supabase.rpc("calcular_metricas_creadores_mes", { p_mes: body.mes });

  if (error) {
    return c.json({ code: "metrics_calc_failed", message: error.message }, 500);
  }

  return c.json({ data: { mes: body.mes, calculado: true } });
});

export const creadoresRoutes = new Hono<{ Variables: AppVariables }>();
creadoresRoutes.route("/", publicRoutes);
creadoresRoutes.route("/", protectedRoutes);
