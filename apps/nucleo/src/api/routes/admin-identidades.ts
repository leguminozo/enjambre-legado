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
  perfil_acceso_id: z.string().uuid().nullable().optional(),
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
    const { email, password, fullName, role, perfil_acceso_id, rolTerritorial, comuna } =
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
            : role === "colaborador"
              ? "nucleo_colaborador"
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
      let friendlyMsg = authError.message || "No se pudo crear la cuenta";
      const lower = friendlyMsg.toLowerCase();
      if (lower.includes("already been registered") || lower.includes("already registered")) {
        friendlyMsg = "Ya existe una cuenta registrada con este correo electrónico.";
      } else if (lower.includes("password") && lower.includes("characters")) {
        friendlyMsg = "La contraseña debe tener al menos 8 caracteres.";
      }
      return c.json(
        {
          code: "auth_create_failed",
          message: friendlyMsg,
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
          perfil_acceso_id: role === "colaborador" ? (perfil_acceso_id ?? null) : null,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      return c.json(
        { code: "profile_create_failed", message: profileError.message },
        500
      );
    }

    // 3. Vincular a la empresa del admin: admin, operador, colaborador, apicultor o rep
    if (role === "admin" || role === "apicultor" || role === "rep_ventas" || role === "operador" || role === "colaborador") {
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
    const cleanQ = q.replace(/[,()]/g, " ").trim();
    if (cleanQ) {
      query = query.or(`full_name.ilike.%${cleanQ}%,email.ilike.%${cleanQ}%`);
    }
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
    const currentUserId = c.get("user")?.id;
    const targetId = c.req.param("id");
    const { role: newRole, perfil_acceso_id } = c.req.valid("json");

    // 1. Impedir auto-democión de cuenta administradora activa
    if (currentUserId && currentUserId === targetId && newRole !== "admin") {
      return c.json(
        {
          code: "cannot_demote_self",
          message: "No puedes degradar tu propia cuenta administradora activa. Solicita el cambio a otro administrador.",
        },
        400
      );
    }

    const admin = createAdminClient();
    if (!admin) {
      return c.json(
        { code: "admin_client_unavailable", message: "Servicio no disponible" },
        503
      );
    }

    // 2. Obtener perfil actual
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("id", targetId)
      .maybeSingle();

    if (profileErr || !profile) {
      return c.json(
        { code: "profile_not_found", message: "Usuario no encontrado" },
        404
      );
    }

    // 3. Impedir degradar al único administrador del sistema
    if (profile.role === "admin" && newRole !== "admin") {
      const { count: adminCount, error: countErr } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");

      if (!countErr && (adminCount ?? 0) <= 1) {
        return c.json(
          {
            code: "cannot_demote_last_admin",
            message: "No es posible degradar al único administrador de la plataforma.",
          },
          400
        );
      }
    }

    // 4. Actualizar profiles.role y perfil_acceso_id (limpiar perfil si no es colaborador)
    const updatePayload: Record<string, unknown> = {
      role: newRole,
      perfil_acceso_id: newRole === "colaborador" ? (perfil_acceso_id ?? null) : null,
    };

    const { error: updateErr } = await admin
      .from("profiles")
      .update(updatePayload)
      .eq("id", targetId);

    if (updateErr) {
      return c.json(
        { code: "update_failed", message: updateErr.message },
        500
      );
    }

    // 5. Sincronizar auth.users.app_metadata.role para mantener el JWT y middleware alineados
    try {
      await admin.auth.admin.updateUserById(targetId, {
        app_metadata: { role: newRole },
      });
    } catch (authSyncErr) {
      console.warn("[admin-identidades] Advertencia sincronizando app_metadata.role:", authSyncErr);
    }

    // 6. Sincronizar membresía de empresa según el nuevo rol
    const empresaId = c.get("empresaId");
    if (empresaId) {
      if (
        newRole === "admin" ||
        newRole === "operador" ||
        newRole === "colaborador" ||
        newRole === "apicultor" ||
        newRole === "rep_ventas"
      ) {
        const empresaRol = newRole === "admin" ? "admin" : "operador";
        await admin.from("usuarios_empresas").upsert(
          { user_id: targetId, empresa_id: empresaId, rol: empresaRol },
          { onConflict: "user_id,empresa_id" }
        );
      } else {
        // Si el usuario pasa a cliente o creador, removerlo de la gestión interna de la empresa
        await admin
          .from("usuarios_empresas")
          .delete()
          .eq("user_id", targetId)
          .eq("empresa_id", empresaId);
      }
    }

    // 7. Si es rep_ventas, asegurar rep_profiles
    if (empresaId && newRole === "rep_ventas") {
      await admin.from("rep_profiles").upsert(
        {
          user_id: targetId,
          empresa_id: empresaId,
          display_name: profile.full_name || profile.email || "Representante",
          active: true,
        },
        { onConflict: "user_id" }
      );
    }

    return c.json({
      ok: true,
      id: targetId,
      role: newRole,
      perfil_acceso_id: newRole === "colaborador" ? (perfil_acceso_id ?? null) : null,
      message: `Rol actualizado correctamente a ${newRole} para ${profile.full_name || profile.email}`,
    });
  }
);

// ---------------------------------------------------------------------------
// DELETE /api/admin/usuarios/:id — eliminar cuenta permanentemente
// ---------------------------------------------------------------------------

adminIdentidadesRoutes.delete("/usuarios/:id", async (c) => {
  try {
    const currentUserId = c.get("user")?.id;
    const targetId = c.req.param("id");

    if (currentUserId && currentUserId === targetId) {
      return c.json(
        {
          code: "cannot_delete_self",
          message: "No puedes eliminar tu propia cuenta administradora con la sesión activa.",
        },
        400
      );
    }

    let admin;
    try {
      admin = createAdminClient();
    } catch (clientErr) {
      console.error("[admin-identidades] Error inicializando createAdminClient:", clientErr);
      return c.json(
        { code: "admin_client_unavailable", message: "Servicio administrativo no disponible" },
        503
      );
    }

    if (!admin) {
      return c.json(
        { code: "admin_client_unavailable", message: "Servicio administrativo no disponible" },
        503
      );
    }

    // 1. Obtener datos del perfil a eliminar
    const { data: targetProfile, error: profileErr } = await admin
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("id", targetId)
      .maybeSingle();

    if (profileErr) {
      console.error("[admin-identidades] Error consultando targetProfile:", profileErr);
      return c.json({ code: "fetch_failed", message: "Error al consultar la cuenta a eliminar" }, 500);
    }

    // 2. Si el usuario es admin, impedir borrar el último admin del sistema
    if (targetProfile?.role === "admin") {
      const { count: adminCount, error: countErr } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");

      if (!countErr && (adminCount ?? 0) <= 1) {
        return c.json(
          {
            code: "cannot_delete_last_admin",
            message: "No es posible eliminar al único administrador del sistema.",
          },
          400
        );
      }
    }

    // 3. Desarmar dependencias de Foreign Key en cascada previa antes de borrar auth.users
    // (Previene errores 23503 foreign_key_violation en tablas que no tienen ON DELETE CASCADE)
    try {
      // A. Tablas donde debemos reasignar al admin activo (custodia y ledger criptográfico no-nulo)
      if (currentUserId) {
        await Promise.allSettled([
          admin.from("invitation_codes").update({ created_by: currentUserId }).eq("created_by", targetId),
          admin.from("bitacora_eventos").update({ created_by: currentUserId }).eq("created_by", targetId),
        ]);
      }

      // B. Tablas históricas/transaccionales donde se debe anonimizar (SET NULL) para preservar auditoría legal
      await Promise.allSettled([
        admin.from("ventas").update({ cliente_id: null }).eq("cliente_id", targetId),
        admin.from("ventas").update({ vendedor_id: null }).eq("vendedor_id", targetId),
        admin.from("ventas").update({ claimed_by: null }).eq("claimed_by", targetId),
        admin.from("notification_events").update({ created_by: null }).eq("created_by", targetId),
        admin.from("apiarios").update({ created_by: null }).eq("created_by", targetId),
        admin.from("source_files").update({ uploaded_by: null }).eq("uploaded_by", targetId),
        admin.from("sii_sync_runs").update({ executed_by: null }).eq("executed_by", targetId),
        admin.from("tickets_fidelizacion").update({ cliente_id: null }).eq("cliente_id", targetId),
        admin.from("conciliaciones").update({ conciliado_por: null }).eq("conciliado_por", targetId),
        admin.from("gastos_extranjeros").update({ reviewed_by: null }).eq("reviewed_by", targetId),
        admin.from("cash_sessions").update({ reconciled_by: null }).eq("reconciled_by", targetId),
        admin.from("commission_records").update({ paid_by: null }).eq("paid_by", targetId),
        admin.from("creador_comisiones").update({ creado_por: null }).eq("creado_por", targetId),
        admin.from("creador_retiros").update({ revisado_por: null }).eq("revisado_por", targetId),
        admin.from("creador_solicitudes").update({ revisado_por: null }).eq("revisado_por", targetId),
        admin.from("crm_interacciones").update({ created_by: null }).eq("created_by", targetId),
        admin.from("descuentos").update({ created_by: null }).eq("created_by", targetId),
        admin.from("incentivo_ledger").update({ aprobado_por: null }).eq("aprobado_por", targetId),
        admin.from("participante_arqueo").update({ cerrado_por: null }).eq("cerrado_por", targetId),
        admin.from("price_observations").update({ created_by: null }).eq("created_by", targetId),
        admin.from("puntos_transacciones").update({ created_by: null }).eq("created_by", targetId),
        admin.from("qr_audit_trail").update({ usuario_id: null }).eq("usuario_id", targetId),
        admin.from("qr_codes").update({ created_by: null }).eq("created_by", targetId),
        admin.from("store_seasons").update({ created_by: null }).eq("created_by", targetId),
        admin.from("logistica_envios").update({ user_id: null }).eq("user_id", targetId),
        admin.from("stock_centers").update({ user_id: null }).eq("user_id", targetId),
        admin.from("proveedores").update({ user_id: null }).eq("user_id", targetId),
        admin.from("marketing_posts").update({ user_id: null }).eq("user_id", targetId),
        admin.from("marketing_campaigns").update({ user_id: null }).eq("user_id", targetId),
        admin.from("reflexiones").update({ user_id: null }).eq("user_id", targetId),
        admin.from("arco_solicitudes").update({ revisado_por: null }).eq("revisado_por", targetId),
      ]);

      // C. Tablas personales del usuario que deben eliminarse
      await Promise.allSettled([
        admin.from("security_events").delete().eq("user_id", targetId),
        admin.from("alerts").delete().eq("user_id", targetId),
        admin.from("notification_events").delete().eq("recipient_user_id", targetId),
        admin.from("invitation_redemptions").delete().eq("user_id", targetId),
        admin.from("usuarios_empresas").delete().eq("user_id", targetId),
        admin.from("user_roles").delete().eq("user_id", targetId),
        admin.from("rep_profiles").delete().eq("user_id", targetId),
        admin.from("revendedor_profile").delete().eq("user_id", targetId),
        admin.from("actores_registro").delete().eq("user_id", targetId),
        admin.from("arco_solicitudes").delete().eq("user_id", targetId),
        admin.from("reembolsos").delete().or(`solicitado_por.eq.${targetId},cliente_id.eq.${targetId}`),
        admin.from("pedidos_cliente").delete().eq("user_id", targetId),
        admin.from("reviews").delete().eq("cliente_id", targetId),
        admin.from("web_push_subscriptions").delete().eq("user_id", targetId),
        admin.from("creador_solicitudes").delete().eq("user_id", targetId),
      ]);
    } catch (cleanupErr) {
      console.warn("[admin-identidades] Advertencia en limpieza previa:", cleanupErr);
    }

    // 4. Eliminar el registro en profiles explícitamente
    await admin.from("profiles").delete().eq("id", targetId);

    // 5. Eliminar usuario en Supabase Auth
    const { error: deleteAuthErr } = await admin.auth.admin.deleteUser(targetId);
    if (deleteAuthErr && !deleteAuthErr.message.toLowerCase().includes("not found")) {
      console.error("[admin-identidades] Error en deleteUser:", deleteAuthErr);
      return c.json(
        {
          code: "auth_delete_failed",
          message: deleteAuthErr.message || "No se pudo eliminar el usuario en autenticación",
        },
        500
      );
    }

    const userName = targetProfile?.full_name || targetProfile?.email || "Usuario";
    return c.json({
      ok: true,
      message: `Cuenta de «${userName}» eliminada correctamente`,
    });
  } catch (error) {
    console.error("[admin-identidades] Error inesperado en DELETE /usuarios/:id:", error);
    return c.json(
      { code: "internal_error", message: "Error interno al procesar la eliminación de la cuenta." },
      500
    );
  }
});

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
    let slug = nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (!slug) {
      slug = `rol-${Date.now().toString(36)}`;
    }

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
      if (error.code === "23505" || error.message.includes("uq_roles_personalizados_empresa_slug")) {
        return c.json(
          {
            code: "duplicate_role",
            message: `Ya existe un rol personalizado con el nombre «${nombre}» en tu empresa.`,
          },
          409
        );
      }
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
      let slug = body.nombre
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      if (!slug) slug = `rol-${Date.now().toString(36)}`;
      updatePayload.slug = slug;
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
      if (error.code === "23505" || error.message.includes("uq_roles_personalizados_empresa_slug")) {
        return c.json(
          {
            code: "duplicate_role",
            message: `Ya existe un rol personalizado con ese nombre en tu empresa.`,
          },
          409
        );
      }
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
