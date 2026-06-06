import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";

export const tercerosRoutes = new Hono<{
  Variables: AppVariables;
}>();

tercerosRoutes.use("*", authMiddleware, tenantMiddleware);

tercerosRoutes.get("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const tipo = c.req.query("tipo");
  const search = c.req.query("search");

  let query = supabase
    .from("terceros")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("nombre", { ascending: true });

  if (tipo) {
    query = query.eq("tipo", tipo);
  }

  if (search && search.length >= 2) {
    query = query.ilike("nombre", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json(data ?? []);
});

tercerosRoutes.post("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const body = await c.req.json();

  const { tipo, rut, nombre, email, telefono, direccion, giro } = body;

  if (!tipo || !rut || !nombre) {
    return c.json({ code: "validation_error", message: "tipo, rut y nombre son requeridos" }, 400);
  }

  const { data: existing } = await supabase
    .from("terceros")
    .select("id")
    .eq("rut", rut)
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (existing) {
    return c.json({ code: "duplicate", message: "Ya existe un tercero con ese RUT" }, 400);
  }

  const { data, error } = await supabase
    .from("terceros")
    .insert({
      empresa_id: empresaId,
      tipo,
      rut,
      nombre,
      email: email ?? null,
      telefono: telefono ?? null,
      direccion: direccion ?? null,
      giro: giro ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "tercero_create_failed", message: error.message }, 400);
  }

  return c.json(data, 201);
});
