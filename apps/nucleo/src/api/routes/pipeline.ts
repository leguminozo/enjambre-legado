import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";

const CreateLeadSchema = z.object({
  nombre: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal("")),
  telefono: z.string().max(50).optional(),
  empresa: z.string().max(200).optional(),
  origen: z.enum(["web", "feria", "referido", "redes", "directo", "otro"]).optional(),
  estado: z.enum(["nuevo", "contactado", "calificado", "propuesta", "negociacion", "cerrado_ganado", "cerrado_perdido"]).default("nuevo"),
  etapa_pipeline: z.enum(["prospecto", "cualificado", "reunion_agendada", "propuesta_enviada", "negociacion", "cerrado"]).default("prospecto"),
  valor_estimado: z.number().min(0).optional(),
  probabilidad_cierre: z.number().min(0).max(100).optional(),
  fecha_cierre_estimada: z.string().optional(),
  notas: z.string().optional(),
});

const UpdateLeadSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  email: z.string().email().optional().or(z.literal("")),
  telefono: z.string().max(50).optional(),
  empresa: z.string().max(200).optional(),
  estado: z.enum(["nuevo", "contactado", "calificado", "propuesta", "negociacion", "cerrado_ganado", "cerrado_perdido"]).optional(),
  etapa_pipeline: z.enum(["prospecto", "cualificado", "reunion_agendada", "propuesta_enviada", "negociacion", "cerrado"]).optional(),
  valor_estimado: z.number().min(0).optional(),
  probabilidad_cierre: z.number().min(0).max(100).optional(),
  fecha_cierre_estimada: z.string().optional(),
  notas: z.string().optional(),
});

const MoverLeadSchema = z.object({
  nueva_etapa: z.enum([
    "prospecto",
    "cualificado",
    "reunion_agendada",
    "propuesta_enviada",
    "negociacion",
    "cerrado",
  ]),
});

const UpdateTareaEstadoSchema = z.object({
  estado: z.enum(["pendiente", "completada", "cancelada"]),
});

const CreateTareaSchema = z.object({
  lead_id: z.string().uuid().optional(),
  titulo: z.string().min(1).max(200),
  descripcion: z.string().optional(),
  tipo: z.enum(["llamada", "email", "reunion", "visita", "otro"]).default("otro"),
  fecha_vencimiento: z.string(),
  hora: z.string().optional(),
  prioridad: z.enum(["baja", "media", "alta", "urgente"]).default("media"),
});

export const pipelineRoutes = new Hono<{
  Variables: AppVariables;
}>();

pipelineRoutes.use("*", authMiddleware, tenantMiddleware);

pipelineRoutes.get("/dashboard", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const user = c.get("user");

  const [leadsRes, tareasRes] = await Promise.all([
    supabase
      .from("crm_leads")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("crm_tareas")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("vendedor_id", user.id)
      .order("fecha_vencimiento", { ascending: true })
      .limit(50),
  ]);

  const leads = leadsRes.data ?? [];
  const tareas = tareasRes.data ?? [];

  const byEtapa: Record<string, number> = {};
  leads.forEach((l: { etapa_pipeline: string }) => {
    byEtapa[l.etapa_pipeline] = (byEtapa[l.etapa_pipeline] ?? 0) + 1;
  });

  const valorTotalPipeline = leads.reduce(
    (acc: number, l: { valor_estimado: number | null }) => acc + (l.valor_estimado ?? 0),
    0
  );

  const tareasVencidas = tareas.filter(
    (t: { estado: string; fecha_vencimiento: string }) =>
      t.estado === "pendiente" && new Date(t.fecha_vencimiento) < new Date()
  ).length;

  const tareasPendientes = tareas.filter(
    (t: { estado: string }) => t.estado === "pendiente"
  ).length;

  return c.json({
    data: {
      leads,
      tareas,
      stats: {
        totalLeads: leads.length,
        byEtapa,
        valorTotalPipeline,
        tareasVencidas,
        tareasPendientes,
      },
    },
  });
});

pipelineRoutes.get("/leads", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const etapa = c.req.query("etapa");

  let query = supabase
    .from("crm_leads")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (etapa) {
    query = query.eq("etapa_pipeline", etapa);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

pipelineRoutes.post("/leads", zValidator("json", CreateLeadSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");
  const empresaId = c.get("empresaId");

  const { data, error } = await supabase
    .from("crm_leads")
    .insert({
      empresa_id: empresaId,
      vendedor_id: user.id,
      nombre: input.nombre,
      email: input.email || null,
      telefono: input.telefono ?? null,
      empresa: input.empresa ?? null,
      origen: input.origen ?? "directo",
      estado: input.estado,
      etapa_pipeline: input.etapa_pipeline,
      valor_estimado: input.valor_estimado ?? null,
      probabilidad_cierre: input.probabilidad_cierre ?? 10,
      fecha_cierre_estimada: input.fecha_cierre_estimada ?? null,
      notas: input.notas ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "lead_create_failed", message: error.message }, 400);
  }

  return c.json({ data }, 201);
});

pipelineRoutes.patch("/leads/:id", zValidator("json", UpdateLeadSchema), async (c) => {
  const leadId = c.req.param("id");
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { data, error } = await supabase
    .from("crm_leads")
    .update(input)
    .eq("id", leadId)
    .eq("empresa_id", empresaId)
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "update_failed", message: error.message }, 400);
  }

  return c.json({ data });
});

pipelineRoutes.post("/leads/:id/mover", zValidator("json", MoverLeadSchema), async (c) => {
  const leadId = c.req.param("id");
  const { nueva_etapa } = c.req.valid("json");
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { data: lead } = await supabase
    .from("crm_leads")
    .select("id")
    .eq("id", leadId)
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (!lead) {
    return c.json({ code: "not_found", message: "Lead no encontrado" }, 404);
  }

  const { data, error } = await supabase.rpc("mover_lead_pipeline", {
    p_lead_id: leadId,
    p_nueva_etapa: nueva_etapa,
  });

  if (error) {
    return c.json({ code: "move_failed", message: error.message }, 400);
  }

  return c.json({ data });
});

pipelineRoutes.get("/tareas", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const user = c.get("user");
  const estado = c.req.query("estado");

  let query = supabase
    .from("crm_tareas")
    .select("*")
    .eq("empresa_id", empresaId)
    .eq("vendedor_id", user.id)
    .order("fecha_vencimiento", { ascending: true })
    .limit(50);

  if (estado) {
    query = query.eq("estado", estado);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

pipelineRoutes.post("/tareas", zValidator("json", CreateTareaSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");
  const empresaId = c.get("empresaId");

  const { data, error } = await supabase.rpc("crear_tarea_crm", {
    p_lead_id: input.lead_id ?? undefined,
    p_empresa_id: empresaId,
    p_vendedor_id: user.id,
    p_titulo: input.titulo,
    p_descripcion: input.descripcion ?? undefined,
    p_tipo: input.tipo,
    p_fecha_vencimiento: input.fecha_vencimiento,
    p_hora: input.hora ?? undefined,
    p_prioridad: input.prioridad,
  });

  if (error) {
    return c.json({ code: "tarea_create_failed", message: error.message }, 400);
  }

  return c.json({ data: { id: data } }, 201);
});

pipelineRoutes.patch("/tareas/:id", zValidator("json", UpdateTareaEstadoSchema), async (c) => {
  const tareaId = c.req.param("id");
  const { estado } = c.req.valid("json");
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("crm_tareas")
    .update({ estado, updated_at: new Date().toISOString() })
    .eq("id", tareaId)
    .eq("empresa_id", empresaId)
    .eq("vendedor_id", user.id)
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "update_failed", message: error.message }, 400);
  }

  return c.json({ data });
});

pipelineRoutes.delete("/tareas/:id", async (c) => {
  const tareaId = c.req.param("id");
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const user = c.get("user");

  const { error } = await supabase
    .from("crm_tareas")
    .delete()
    .eq("id", tareaId)
    .eq("empresa_id", empresaId)
    .eq("vendedor_id", user.id);

  if (error) {
    return c.json({ code: "delete_failed", message: error.message }, 400);
  }

  return c.json({ data: { deleted: true } });
});
