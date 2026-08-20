import { Hono } from "hono";
import { createAdminClient } from "@enjambre/auth/browser";
import { hasTerritorialSignupIntent } from "@enjambre/auth/role-redirect";
import { authMiddleware, type AppVariables } from "@/api/lib/middleware";
import { isTerritorialRol } from "@/lib/territorial-rol";

/**
 * Adopta el rol territorial en un login de Núcleo.
 * Cierra el caso: signup de la red (o correo que ya era cliente de tienda)
 * con JWT/perfil en `cliente` → el middleware te mandaba al catálogo.
 *
 * No toca admin / patio / rep / creador.
 */
export const authTerritorialRoutes = new Hono<{ Variables: AppVariables }>();

authTerritorialRoutes.use("*", authMiddleware);

authTerritorialRoutes.post("/adoptar", async (c) => {
  const user = c.get("user");
  const admin = createAdminClient();

  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr) {
    return c.json({ code: "profile_failed", message: profileErr.message }, 500);
  }

  const currentRole = typeof profile?.role === "string" ? profile.role.trim() : "";
  if (currentRole === "admin" || currentRole === "apicultor" || currentRole === "rep_ventas" || currentRole === "creador") {
    return c.json({ data: { role: currentRole, adopted: false } });
  }

  const meta = user.user_metadata ?? {};
  const intent = hasTerritorialSignupIntent(meta);

  const { data: actor } = await admin
    .from("actores_registro")
    .select("id, rol")
    .eq("user_id", user.id)
    .maybeSingle();

  // En /login de Núcleo el adopt se llama siempre: es la puerta de la red.
  // Si no hay metadata ni actor, igual se adopta (alta desde esta pantalla).
  const shouldAdopt = currentRole !== "territorial" || !actor;
  if (!shouldAdopt) {
    return c.json({ data: { role: "territorial", adopted: false } });
  }

  if (currentRole !== "territorial") {
    const { error: updErr } = await admin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email ?? "",
          full_name:
            (typeof profile?.full_name === "string" && profile.full_name) ||
            (typeof meta.full_name === "string" ? meta.full_name : "") ||
            "",
          role: "territorial",
        },
        { onConflict: "id" },
      );
    if (updErr) {
      return c.json({ code: "adopt_failed", message: updErr.message }, 500);
    }
  }

  if (!actor) {
    const rawRol = typeof meta.territorial_rol === "string" ? meta.territorial_rol.trim() : "";
    const rol = isTerritorialRol(rawRol) ? rawRol : "api_residente";
    const { error: actorErr } = await admin.from("actores_registro").insert({
      user_id: user.id,
      rol,
      nombre_actor:
        (typeof meta.full_name === "string" && meta.full_name.trim()) ||
        (user.email ? user.email.split("@")[0] : "Apicultor/a"),
      comuna:
        (typeof meta.territorial_comuna === "string" && meta.territorial_comuna.trim()) ||
        "Desconocida",
      region:
        (typeof meta.territorial_region === "string" && meta.territorial_region.trim()) ||
        "Los Lagos",
      acepta_carta: meta.territorial_acepta_carta === true,
      acepta_politica_datos: meta.territorial_acepta_politica_datos === true,
      consentimientos:
        meta.territorial_consentimientos && typeof meta.territorial_consentimientos === "object"
          ? meta.territorial_consentimientos
          : {},
    });
    if (actorErr && !actorErr.message.toLowerCase().includes("duplicate")) {
      return c.json({ code: "actor_failed", message: actorErr.message }, 500);
    }
  }

  return c.json({
    data: {
      role: "territorial",
      adopted: true,
      from_intent: intent,
    },
  });
});
