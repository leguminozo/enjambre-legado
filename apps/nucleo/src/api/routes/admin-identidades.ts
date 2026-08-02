import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware, tenantMiddleware, requireProfileRole } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";
import { createAdminClient } from "@enjambre/auth/browser";

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
  role: z.enum(["admin", "territorial", "cliente", "rep_ventas", "creador"]),
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
    const appSource =
      role === "territorial" ? "nucleo_territorial" : "nucleo_admin_created";

    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // la cuenta queda activa directamente
        user_metadata: {
          full_name: fullName,
          app_source: appSource,
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

    // 3. Si el rol es territorial, crear registro en actores_registro
    if (role === "territorial" && rolTerritorial) {
      const { error: actorError } = await admin
        .from("actores_registro")
        .insert({
          user_id: userId,
          rol: rolTerritorial,
          comuna: comuna ?? "Sin especificar",
          estado: "activo",
          nivel_acreditacion: "base",
        });

      if (actorError) {
        // No es fatal — el usuario existe, solo falta el registro territorial
        console.error(
          "[admin-identidades] actores_registro insert failed:",
          actorError.message
        );
      }
    }

    // 4. Si es admin, vincularlo a la empresa
    if (role === "admin") {
      const empresaId = c.get("empresaId");
      if (empresaId) {
        await admin
          .from("usuarios_empresas")
          .upsert(
            { user_id: userId, empresa_id: empresaId, rol: "admin" },
            { onConflict: "user_id,empresa_id" }
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
