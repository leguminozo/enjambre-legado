import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { validarRUT } from "@enjambre/contable";
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
    query = query.eq("tipo", tipo as "cliente" | "proveedor" | "mixto");
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

const terceroSchema = z.object({
  tipo: z.enum(["cliente", "proveedor", "mixto"]),
  rut: z.string().refine((rut) => validarRUT(rut), { message: "RUT inválido" }),
  nombre: z.string().min(1, "Nombre es requerido"),
  email: z.string().email("Email inválido").optional().nullable(),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  giro: z.string().optional().nullable(),
});

tercerosRoutes.post("/", zValidator("json", terceroSchema), async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const { tipo, rut, nombre, email, telefono, direccion, giro } = c.req.valid("json");

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
