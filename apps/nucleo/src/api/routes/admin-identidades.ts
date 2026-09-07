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
  /** Platform RoleKey — incluye apicultor (patio). Ver docs/ROLES_Y_ACCESO.md */
  role: z.enum([
    "admin",
    "apicultor",
    "territorial",
    "cliente",
    "rep_ventas",
    "creador",
  ]),
  rolTerritorial: RolTerritorialSchema.optional(),
  comuna: z.string().optional(),
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
    // (handle_new_user puede haber insertado cliente/territorial; upsert fija SoT)
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

    // 3. (El actor territorial lo inserta el trigger handle_new_user desde los
    // metadata enviados en el createUser; no se inserta aquí para evitar doble
    // fila en actores_registro.)

    // 4. Vincular a la empresa del admin: admin + patio (apicultor) + rep
    if (role === "admin" || role === "apicultor" || role === "rep_ventas") {
      const empresaId = c.get("empresaId");
      if (empresaId) {
        const empresaRol =
          role === "admin" ? "admin" : role === "rep_ventas" ? "operador" : "operador";
        await admin
          .from("usuarios_empresas")
          .upsert(
            { user_id: userId, empresa_id: empresaId, rol: empresaRol },
            { onConflict: "user_id,empresa_id" }
          )
          .then(() => {});
      }
    }

    // 5. rep_profiles si es rep de ventas
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
          )
          .then(() => {});
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
// GET /api/admin/crear-cuenta/usuarios — lista usuarios creados por admin
// ---------------------------------------------------------------------------

adminIdentidadesRoutes.get("/usuarios", async (c) => {
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return c.json({ code: "fetch_failed", message: error.message }, 500);
  }

  return c.json({ usuarios: data ?? [] });
});
