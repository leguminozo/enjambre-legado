import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware, tenantMiddleware, requireProfileRole } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";
import { createAdminClient } from "@enjambre/auth/server-index";

export const adminIdentidadesRoutes = new Hono<{ Variables: AppVariables }>();

adminIdentidadesRoutes.use("*", authMiddleware);
adminIdentidadesRoutes.use("*", tenantMiddleware);
adminIdentidadesRoutes.use("*", requireProfileRole("admin"));

// ---------------------------------------------------------------------------
// Schema de validación
// ---------------------------------------------------------------------------

const RolTerritorialSchema = z.enum([
  "api_residente",
  "api_trashumante",
  "api_mixto",
  "prop_facilitador",
  "agri_fitosanitario",
  "agri_aplicador",
  "comercial_acopio",
  "tecnico_inspector",
  "institucion_publica",
]);

const CrearCuentaSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  fullName: z.string().min(2, "Nombre demasiado corto"),
  /** Platform RoleKey — incluye apicultor, operador y colaborador */
  role: z.enum([
    "admin",
    "apicultor",
    "operador",
    "colaborador",
    "territorial",
    "cliente",
    "rep_ventas",
    "creador",
    "disenador",
  ]),
  rolTerritorial: RolTerritorialSchema.optional(),
  comuna: z.string().optional(),
});

const CambiarRolSchema = z.object({
  role: z.enum([
    "admin",
    "apicultor",
    "operador",
    "colaborador",
    "territorial",
    "cliente",
    "rep_ventas",
    "creador",
    "disenador",
  ]),
  perfil_acceso_id: z.string().uuid().nullable().optional(),
});

const CrearRolPersonalizadoSchema = z.object({
  nombre: z.string().min(2, "El nombre del rol debe tener al menos 2 caracteres"),
  descripcion: z.string().optional(),
  color: z.string().default("amber"),
  modulos: z.array(z.string()).min(1, "Debe seleccionar al menos un módulo"),
});

const ActualizarRolPersonalizadoSchema = z.object({
  nombre: z.string().min(2).optional(),
  descripcion: z.string().optional(),
  color: z.string().optional(),
  modulos: z.array(z.string()).min(1).optional(),
});

// ---------------------------------------------------------------------------
// POST /api/admin/crear-cuenta
// Admin crea una cuenta completa con control total sobre rol y datos
// ---------------------------------------------------------------------------

adminIdentidadesRoutes.post(
  "/crear-cuenta",
  zValidator("json", CrearCuentaSchema),
  async (c) => {
    const { email, password, fullName, role, rolTerritorial, comuna } =
      c.req.valid("json");

    const admin = createAdminClient();
    if (!admin) {
      return c.json(
        { code: "admin_client_unavailable", message: "Servicio no disponible" },
        503
      );
    }

    // 1. Crear el usuario en Supabase Auth con service role
    // El trigger handle_new_user() inserta el actor territorial automáticamente
    // leyendo los metadata; por eso se pasan territorial_rol/comuna aquí y no se
    // inserta actores_registro manualmente (evita doble fila y el rol perdido).
    const appSource =
      role === "territorial"
        ? "nucleo_territorial"
        : role === "apicultor"
          ? "nucleo_apicultor"
          : role === "operador"
            ? "nucleo_operador"
            : role === "disenador"
              ? "nucleo_disenador"
              : "nucleo_admin_created";

    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // la cuenta queda activa directamente
        user_metadata: {
          full_name: fullName,
          app_source: appSource,
          ...(role === "territorial" && rolTerritorial
            ? {
                territorial_rol: rolTerritorial,
                territorial_comuna: comuna ?? "Sin especificar",
                territorial_region: "Los Lagos",
              }
            : {}),
        },
        app_metadata: {
          role: role,
        },
      });

    if (authError) {
      return c.json(
        {
          code: "auth_create_failed",
          message: authError.message || "No se pudo crear la cuenta",
        },
        400
      );
    }

    const userId = authData.user.id;

    // 2. Crear o actualizar el perfil con el rol correcto
    const { error: profileError } = await admin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          role,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      return c.json(
        { code: "profile_create_failed", message: profileError.message },
        500
      );
    }

    // 3. Vincular a la empresa del admin: admin, operador, apicultor o rep
    if (role === "admin" || role === "apicultor" || role === "rep_ventas" || role === "operador") {
      const empresaId = c.get("empresaId");
      if (empresaId) {
        const empresaRol = role === "admin" ? "admin" : "operador";
        await admin
          .from("usuarios_empresas")
          .upsert(
            { user_id: userId, empresa_id: empresaId, rol: empresaRol },
            { onConflict: "user_id,empresa_id" }
          );
      }
    }

    // 4. rep_profiles si es rep de ventas
    if (role === "rep_ventas") {
      const empresaId = c.get("empresaId");
      if (empresaId) {
        await admin
          .from("rep_profiles")
          .upsert(
            {
              user_id: userId,
              empresa_id: empresaId,
              display_name: fullName,
              active: true,
            },
            { onConflict: "user_id" }
          );
      }
    }

    return c.json({
      ok: true,
      userId,
      email,
      role,
      message: `Cuenta creada correctamente para ${fullName}`,
    });
  }
);

// ---------------------------------------------------------------------------
// GET /api/admin/usuarios — lista y busca cuentas del ecosistema con roles
// ---------------------------------------------------------------------------

adminIdentidadesRoutes.get("/usuarios", async (c) => {
  const supabase = c.get("supabase");
  const q = c.req.query("q")?.trim();
  const role = c.req.query("role")?.trim();
  const limitStr = c.req.query("limit");
  const offsetStr = c.req.query("offset");
  const limit = Math.min(Math.max(parseInt(limitStr || "100", 10) || 100, 1), 200);
  const offset = Math.max(parseInt(offsetStr || "0", 10) || 0, 0);

  // 1. Obtener usuarios paginados de profiles
  let query = (supabase)
    .from("profiles")
    .select("id, email, full_name, role, perfil_acceso_id, nivel_guardian, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (role && role !== "todos") {
    query = query.eq("role", role);
  }

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return c.json({ code: "fetch_failed", message: error.message }, 500);
  }

  const userIds = ((data ?? []) as Array<{ id: string }>).map((u) => u.id);
  const commercialRolesMap: Record<string, string[]> = {};

  if (userIds.length > 0) {
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id, role, is_active")
      .in("user_id", userIds)
      .eq("is_active", true);

    if (rolesData) {
      for (const r of rolesData as Array<{ user_id: string; role: string }>) {
        if (!commercialRolesMap[r.user_id]) commercialRolesMap[r.user_id] = [];
        commercialRolesMap[r.user_id].push(r.role);
      }
    }
  }

  // Mapear perfiles de acceso personalizados
  const perfilAccesoIds = ((data ?? []) as Array<{ perfil_acceso_id?: string | null }>)
    .map((u) => u.perfil_acceso_id)
    .filter((id): id is string => typeof id === "string" && Boolean(id));

  const customRolesMap: Record<string, { id: string; nombre: string; slug: string; modulos: string[]; color: string }> = {};

  if (perfilAccesoIds.length > 0) {
    const { data: rolesData } = await (supabase)
      .from("roles_personalizados")
      .select("id, nombre, slug, modulos, color")
      .in("id", perfilAccesoIds);

    if (rolesData) {
      for (const r of rolesData as Array<{ id: string; nombre: string; slug: string; modulos: string[]; color: string }>) {
        customRolesMap[r.id] = r;
      }
    }
  }

  const enriched = ((data ?? []) as Array<Record<string, unknown>>).map((u) => ({
    ...u,
    commercial_roles: commercialRolesMap[u.id as string] ?? [],
    perfil_acceso: u.perfil_acceso_id ? customRolesMap[u.perfil_acceso_id as string] || null : null,
  }));

  return c.json({ usuarios: enriched, total: count ?? enriched.length });
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/usuarios/:id/rol — ascender o reasignar rol de plataforma o perfil
// ---------------------------------------------------------------------------

adminIdentidadesRoutes.patch(
  "/usuarios/:id/rol",
  zValidator("json", CambiarRolSchema),
  async (c) => {
    const id = c.req.param("id");
    const { role: newRole, perfil_acceso_id } = c.req.valid("json");

    const admin = createAdminClient();
    if (!admin) {
      return c.json(
        { code: "admin_client_unavailable", message: "Servicio no disponible" },
        503
      );
    }

    // 1. Obtener perfil actual
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("id", id)
      .maybeSingle();

    if (profileErr || !profile) {
      return c.json(
        { code: "profile_not_found", message: "Usuario no encontrado" },
        404
      );
    }

    // 2. Actualizar profiles.role y perfil_acceso_id
    const updatePayload: Record<string, unknown> = { role: newRole };
    if (perfil_acceso_id !== undefined) {
      updatePayload.perfil_acceso_id = perfil_acceso_id;
    }

    const { error: updateErr } = await (admin)
      .from("profiles")
      .update(updatePayload)
      .eq("id", id);

    if (updateErr) {
      return c.json(
        { code: "update_failed", message: updateErr.message },
        500
      );
    }

    // 3. Sincronizar membresía de empresa si es admin, operador, colaborador, apicultor o rep
    const empresaId = c.get("empresaId");
    if (
      empresaId &&
      (newRole === "admin" ||
        newRole === "operador" ||
        newRole === "colaborador" ||
        newRole === "apicultor" ||
        newRole === "rep_ventas")
    ) {
      const empresaRol = newRole === "admin" ? "admin" : "operador";
      await admin.from("usuarios_empresas").upsert(
        { user_id: id, empresa_id: empresaId, rol: empresaRol },
        { onConflict: "user_id,empresa_id" }
      );
    }

    // 4. Si es rep_ventas, asegurar rep_profiles
    if (empresaId && newRole === "rep_ventas") {
      await admin.from("rep_profiles").upsert(
        {
          user_id: id,
          empresa_id: empresaId,
          display_name: profile.full_name || profile.email || "Representante",
          active: true,
        },
        { onConflict: "user_id" }
      );
    }

    return c.json({
      ok: true,
      id,
      role: newRole,
      perfil_acceso_id: perfil_acceso_id ?? null,
      message: `Rol actualizado correctamente a ${newRole} para ${profile.full_name || profile.email}`,
    });
  }
);

// ---------------------------------------------------------------------------
// CRUD /api/admin/roles-personalizados
// ---------------------------------------------------------------------------

adminIdentidadesRoutes.get("/roles-personalizados", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  let query = (supabase)
    .from("roles_personalizados")
    .select("*")
    .order("created_at", { ascending: true });

  if (empresaId) {
    query = query.eq("empresa_id", empresaId);
  }

  const { data: roles, error } = await query;
  if (error) {
    return c.json({ code: "fetch_failed", message: error.message }, 500);
  }

  // Conteo de usuarios asignados a cada rol
  const { data: profilesWithRoles } = await (supabase)
    .from("profiles")
    .select("perfil_acceso_id");

  const userCountMap: Record<string, number> = {};
  for (const p of (profilesWithRoles ?? []) as Array<{ perfil_acceso_id?: string | null }>) {
    if (p.perfil_acceso_id) {
      userCountMap[p.perfil_acceso_id] = (userCountMap[p.perfil_acceso_id] || 0) + 1;
    }
  }

  const enrichedRoles = (roles ?? []).map((r: { id: string }) => ({
    ...r,
    usuarios_asignados: userCountMap[r.id] ?? 0,
  }));

  return c.json({ roles: enrichedRoles });
});

adminIdentidadesRoutes.post(
  "/roles-personalizados",
  zValidator("json", CrearRolPersonalizadoSchema),
  async (c) => {
    const admin = createAdminClient();
    const empresaId = c.get("empresaId");
    if (!admin || !empresaId) {
      return c.json({ code: "service_unavailable", message: "Servicio no disponible" }, 503);
    }

    const { nombre, descripcion, color, modulos } = c.req.valid("json");
    const slug = nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data, error } = await (admin)
      .from("roles_personalizados")
      .insert({
        empresa_id: empresaId,
        nombre,
        slug,
        descripcion: descripcion || null,
        color: color || "amber",
        modulos,
        activo: true,
      })
      .select()
      .single();

    if (error) {
      return c.json({ code: "insert_failed", message: error.message }, 500);
    }

    return c.json({ ok: true, rol: data }, 201);
  }
);

adminIdentidadesRoutes.patch(
  "/roles-personalizados/:id",
  zValidator("json", ActualizarRolPersonalizadoSchema),
  async (c) => {
    const admin = createAdminClient();
    const id = c.req.param("id");
    if (!admin) {
      return c.json({ code: "service_unavailable", message: "Servicio no disponible" }, 503);
    }

    const body = c.req.valid("json");
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (body.nombre) {
      updatePayload.nombre = body.nombre;
      updatePayload.slug = body.nombre
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    if (body.descripcion !== undefined) updatePayload.descripcion = body.descripcion;
    if (body.color !== undefined) updatePayload.color = body.color;
    if (body.modulos !== undefined) updatePayload.modulos = body.modulos;

    const { data, error } = await (admin)
      .from("roles_personalizados")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return c.json({ code: "update_failed", message: error.message }, 500);
    }

    return c.json({ ok: true, rol: data });
  }
);

adminIdentidadesRoutes.delete("/roles-personalizados/:id", async (c) => {
  const admin = createAdminClient();
  const id = c.req.param("id");
  if (!admin) {
    return c.json({ code: "service_unavailable", message: "Servicio no disponible" }, 503);
  }

  // Verificar si hay usuarios con este rol asignado
  const { count } = await (admin)
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("perfil_acceso_id", id);

  if (count && count > 0) {
    return c.json(
      {
        code: "role_in_use",
        message: `No se puede eliminar el rol porque tiene ${count} usuario(s) asignado(s). Reasigna los usuarios primero.`,
      },
      400
    );
  }

  const { error } = await (admin)
    .from("roles_personalizados")
    .delete()
    .eq("id", id);

  if (error) {
    return c.json({ code: "delete_failed", message: error.message }, 500);
  }

  return c.json({ ok: true, message: "Rol eliminado correctamente" });
});
