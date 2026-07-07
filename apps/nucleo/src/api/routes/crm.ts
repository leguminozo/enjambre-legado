import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";

const CreateInteraccionSchema = z.object({
  cliente_id: z.string().uuid(),
  tipo: z.enum([
    "llamada",
    "email",
    "visita",
    "feria",
    "whatsapp",
    "reunion",
    "seguimiento",
    "otro",
  ]),
  notas: z.string().optional(),
  resultado: z
    .enum(["positivo", "neutral", "negativo", "pendiente", "seguimiento"])
    .optional(),
  proximo_seguimiento: z.string().optional(),
});

const CreateClienteSchema = z.object({
  name: z.string().min(1).max(200),
  type: z
    .enum(["B2B", "D2C", "Gourmet", "Retail", "Exportacion", "Particular"])
    .optional(),
  email: z.string().email().optional().or(z.literal("")),
  telefono: z.string().max(50).optional(),
  empresa: z.string().max(200).optional(),
  direccion: z.string().max(500).optional(),
  fuente: z
    .enum(["feria", "referido", "web", "visita", "cold_call", "red_social", "otro"])
    .optional(),
  status: z
    .enum(["activo", "inactivo", "prospecto", "frecuente"])
    .optional()
    .default("prospecto"),
});

const UpdateClienteSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z
    .enum(["B2B", "D2C", "Gourmet", "Retail", "Exportacion", "Particular"])
    .optional(),
  email: z.string().email().optional().or(z.literal("")),
  telefono: z.string().max(50).optional(),
  empresa: z.string().max(200).optional(),
  direccion: z.string().max(500).optional(),
  fuente: z
    .enum(["feria", "referido", "web", "visita", "cold_call", "red_social", "otro"])
    .optional(),
  status: z
    .enum(["activo", "inactivo", "prospecto", "frecuente"])
    .optional(),
  notes: z.string().optional(),
});

const AssignRepSchema = z.object({
  evento_id: z.string().uuid(),
  rep_id: z.string().uuid(),
  rol_evento: z.enum(["vendedor", "coordinador", "soporte"]).default("vendedor"),
  meta_ventas: z.number().min(0).default(0),
});

export const crmRoutes = new Hono<{
  Variables: AppVariables;
}>();

crmRoutes.use("*", authMiddleware, tenantMiddleware);

crmRoutes.get("/dashboard", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const [
    repsRes,
    clientesRes,
    interaccionesRes,
    eventosRes,
    assignmentsRes,
    commissionRes,
    ventasByChannelRes,
  ] = await Promise.all([
    supabase
      .from("rep_performance_view")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("active", true),
    supabase
      .from("clientes")
      .select("id, name, type, status, total_spent, last_purchase, fuente, vendedor_id, ultimo_contacto, user_id")
      .order("last_purchase", { ascending: true, nullsFirst: true })
      .limit(200),
    (supabase as any)
      .from("interacciones")
      .select("id, tipo, resultado, created_at, proximo_seguimiento, rep_id, cliente_id")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("eventos")
      .select("id, nombre, fecha_inicio, fecha_fin, ubicacion")
      .gte("fecha_fin", new Date().toISOString().slice(0, 10))
      .order("fecha_inicio", { ascending: true })
      .limit(20),
    (supabase as any)
      .from("evento_rep_assignments")
      .select("id, evento_id, rep_id, rol_evento, meta_ventas")
      .eq("empresa_id", empresaId),
    supabase
      .from("commission_records")
      .select("rep_id, total_commission, paid, calculated_at")
      .eq("empresa_id", empresaId)
      .order("calculated_at", { ascending: false })
      .limit(200),
    supabase
      .from("ventas")
      .select("channel, total, is_new_client, vendedor_id")
      .eq("empresa_id", empresaId),
  ]);

  const reps = repsRes.data ?? [];
  const clientes = clientesRes.data ?? [];
  const interacciones = interaccionesRes.data ?? [];
  const eventos = eventosRes.data ?? [];
  const assignments = assignmentsRes.data ?? [];

  const totalClientes = clientes.length;
  const clientesByStatus: Record<string, number> = {};
  clientes.forEach((cl: any) => {
    const s = cl.status ?? "sin_status";
    clientesByStatus[s] = (clientesByStatus[s] ?? 0) + 1;
  });

  const clientesByFuente: Record<string, number> = {};
  clientes.forEach((cl: any) => {
    const f = cl.fuente ?? "sin_fuente";
    clientesByFuente[f] = (clientesByFuente[f] ?? 0) + 1;
  });

  const interaccionesByTipo: Record<string, number> = {};
  interacciones.forEach((i: any) => {
    interaccionesByTipo[i.tipo] = (interaccionesByTipo[i.tipo] ?? 0) + 1;
  });

  const interaccionesByResultado: Record<string, number> = {};
  interacciones.forEach((i: any) => {
    const r = i.resultado ?? "sin_resultado";
    interaccionesByResultado[r] = (interaccionesByResultado[r] ?? 0) + 1;
  });

  const proximosSeguimientos = interacciones.filter(
    (i: any) =>
      i.proximo_seguimiento != null &&
      i.proximo_seguimiento >= new Date().toISOString().slice(0, 10)
  );

  const totalVentas = (ventasByChannelRes.data ?? []).reduce(
    (acc: number, v: { total: number }) => acc + Number(v.total),
    0
  );
  const newClients = (ventasByChannelRes.data ?? []).filter(
    (v: { is_new_client: boolean | null }) => v.is_new_client === true
  ).length;
  const conversionRate = totalClientes > 0 && newClients > 0
    ? Math.round((newClients / totalClientes) * 10000) / 100
    : 0;

  const channelRevenue: Record<string, number> = {};
  const channelCount: Record<string, number> = {};
  (ventasByChannelRes.data ?? []).forEach(
    (v: { channel: string | null; total: number }) => {
      const ch = v.channel ?? "sin_canal";
      channelRevenue[ch] = (channelRevenue[ch] ?? 0) + Number(v.total);
      channelCount[ch] = (channelCount[ch] ?? 0) + 1;
    }
  );

  const repConversion: Array<{
    rep_id: string;
    display_name: string;
    clients_captured: number;
    total_sales: number;
    total_revenue: number;
    commission_balance: number;
    streak: number;
    tier: string;
  }> = reps.map(
    (r: any) => ({
      rep_id: r.user_id,
      display_name: r.display_name,
      clients_captured: Number(r.clients_captured ?? 0),
      total_sales: Number(r.total_sales_lifetime ?? 0),
      total_revenue: Number(r.total_revenue_lifetime ?? 0),
      commission_balance: Number(r.balance_pendiente ?? 0),
      streak: Number(r.current_streak_days ?? 0),
      tier: r.commission_tier ?? "base",
    })
  );

  return c.json({
    data: {
      reps: repConversion,
      clientes,
      interacciones,
      eventos,
      assignments,
      stats: {
        totalClientes,
        clientesByStatus,
        clientesByFuente,
        interaccionesTotal: interacciones.length,
        interaccionesByTipo,
        interaccionesByResultado,
        proximosSeguimientos: proximosSeguimientos.length,
        totalVentas,
        newClients,
        conversionRate,
        channelRevenue,
        channelCount,
        activeReps: reps.length,
        upcomingEventos: eventos.length,
      },
    },
  });
});

crmRoutes.get("/clientes", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const status = c.req.query("status");
  const search = c.req.query("q");

  let query = (supabase as any)
    .from("clientes")
    .select("id, name, type, status, total_spent, last_purchase, fuente, email, telefono, empresa, vendedor_id, ultimo_contacto, notes, user_id")
    .order("last_purchase", { ascending: true, nullsFirst: true })
    .limit(200);

  if (status) {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,empresa.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

crmRoutes.post("/clientes", zValidator("json", CreateClienteSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("clientes")
    .insert({
      name: input.name,
      type: input.type ?? null,
      email: input.email || null,
      telefono: input.telefono ?? null,
      empresa: input.empresa ?? null,
      direccion: input.direccion ?? null,
      fuente: input.fuente ?? null,
      status: input.status ?? "prospecto",
      vendedor_id: user.id,
      ultimo_contacto: new Date().toISOString(),
    } as any)
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "cliente_create_failed", message: error.message }, 400);
  }

  return c.json({ data }, 201);
});

crmRoutes.patch("/clientes/:id", zValidator("json", UpdateClienteSchema), async (c) => {
  const clienteId = c.req.param("id");
  const input = c.req.valid("json");
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("clientes")
    .update(input as any)
    .eq("id", clienteId)
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "update_failed", message: error.message }, 400);
  }

  return c.json({ data });
});

crmRoutes.get("/clientes/:id/direcciones", async (c) => {
  const clienteId = c.req.param("id");
  const supabase = c.get("supabase");

  const { data: cliente, error: clienteError } = await supabase
    .from("clientes")
    .select("user_id")
    .eq("id", clienteId)
    .single();

  if (clienteError || !cliente?.user_id) {
    return c.json({ data: [] });
  }

  const { data, error } = await supabase
    .from("cliente_direcciones")
    .select("*")
    .eq("user_id", cliente.user_id)
    .order("es_predeterminada", { ascending: false });

  if (error) {
    return c.json({ code: "fetch_direcciones_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

crmRoutes.get("/interacciones", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const clienteId = c.req.query("cliente_id");

  let query = (supabase as any)
    .from("interacciones")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (clienteId) {
    query = query.eq("cliente_id", clienteId);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

crmRoutes.post(
  "/interacciones",
  zValidator("json", CreateInteraccionSchema),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const user = c.get("user");
    const empresaId = c.get("empresaId");

    const { data, error } = await (supabase as any)
      .from("interacciones")
      .insert({
        cliente_id: input.cliente_id,
        rep_id: user.id,
        empresa_id: empresaId,
        tipo: input.tipo,
        notas: input.notas ?? null,
        resultado: input.resultado ?? null,
        proximo_seguimiento: input.proximo_seguimiento ?? null,
      } as any)
      .select("*")
      .single();

    if (error) {
      return c.json({ code: "interaccion_create_failed", message: error.message }, 400);
    }

    await (supabase as any)
      .from("clientes")
      .update({ ultimo_contacto: new Date().toISOString() } as any)
      .eq("id", input.cliente_id);

    return c.json({ data }, 201);
  }
);

crmRoutes.get("/eventos", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { data, error } = await supabase
    .from("eventos")
    .select("id, nombre, fecha_inicio, fecha_fin, ubicacion")
    .order("fecha_inicio", { ascending: true })
    .limit(30);

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  const assignmentsRes = await (supabase as any)
    .from("evento_rep_assignments")
    .select("id, evento_id, rep_id, rol_evento, meta_ventas")
    .eq("empresa_id", empresaId);

  const assignments = assignmentsRes.data ?? [];

  const eventosWithAssignments = (data ?? []).map((e: Record<string, unknown>) => ({
    ...e,
    reps: (assignments as any[]).filter(
      (a) => a.evento_id === e.id
    ),
  }));

  return c.json({ data: eventosWithAssignments });
});

crmRoutes.post("/eventos/assign", zValidator("json", AssignRepSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { data, error } = await (supabase as any)
    .from("evento_rep_assignments")
    .insert({
      evento_id: input.evento_id,
      rep_id: input.rep_id,
      empresa_id: empresaId,
      rol_evento: input.rol_evento,
      meta_ventas: input.meta_ventas,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return c.json({ code: "duplicate", message: "Rep already assigned to this event" }, 409);
    }
    return c.json({ code: "assign_failed", message: error.message }, 400);
  }

  return c.json({ data }, 201);
});
