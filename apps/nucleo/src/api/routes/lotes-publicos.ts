import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { createAdminClient } from "@enjambre/auth/browser";

export const lotesPublicosRoutes = new Hono<{ Variables: AppVariables }>();

// GET /api/lotes-publicos/:id
lotesPublicosRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();
  const supabase = createAdminClient();

  // Validar formato UUID simple para prevenir inyecciones básicas
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  }

  // Obtenemos el lote, asumiendo que RLS (publico = true) nos protege, 
  // pero como usamos service_role para hacer join con la vista de actores, validamos explícitamente `publico = true`.
  const { data: lote, error } = await supabase
    .from("lotes")
    .select(`
      id,
      kg_total,
      estado,
      created_at,
      actor_id,
      variedad_floral,
      metodo_extraccion,
      analisis_humedad,
      analisis_hmf,
      lab_nombre,
      lab_fecha,
      relato_publico,
      publico,
      actores_registro (
        nombre_actor,
        comuna,
        nivel_acreditacion,
        predios_facilitadores (
          lat_aproximada,
          lng_aproximada
        )
      )
    `)
    .eq("id", id)
    .eq("publico", true)
    .single();

  if (error || !lote) {
    return c.json({ code: "not_found", message: "Lote no encontrado o no es público" }, 404);
  }

  // Preparamos la respuesta, abstrayendo datos internos si es necesario
  const response = {
    id: lote.id,
    variedad_floral: lote.variedad_floral || 'Multifloral',
    metodo_extraccion: lote.metodo_extraccion,
    analisis: {
      humedad: lote.analisis_humedad,
      hmf: lote.analisis_hmf,
      laboratorio: lote.lab_nombre,
      fecha_analisis: lote.lab_fecha,
    },
    relato: lote.relato_publico,
    fecha_cosecha: lote.created_at,
    actor: (() => {
      const actor = Array.isArray(lote.actores_registro) ? lote.actores_registro[0] : lote.actores_registro;
      if (!actor) return null;
      const predios = Array.isArray(actor.predios_facilitadores) ? actor.predios_facilitadores : (actor.predios_facilitadores ? [actor.predios_facilitadores] : []);
      return {
        nombre: actor.nombre_actor,
        comuna: actor.comuna,
        nivel_acreditacion: actor.nivel_acreditacion,
        zona: {
          lat: predios[0]?.lat_aproximada || -42.48,
          lng: predios[0]?.lng_aproximada || -73.76,
        }
      };
    })()
  };

  return c.json({ data: response });
});
