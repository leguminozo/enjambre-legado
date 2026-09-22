import type { SupabaseClient } from "@supabase/supabase-js";

export type ArcoSolicitudRow = {
  id: string;
  user_id: string;
};

/**
 * Ejecuta una solicitud ARCO de supresión (Ley 21.719).
 * Anonimiza en lugar de borrar: la contabilidad (ventas, DTE) se conserva
 * disociada por deber tributario; los datos personales se eliminan.
 */
export async function executeArcoSolicitud(
  admin: SupabaseClient,
  solicitud: ArcoSolicitudRow,
): Promise<void> {
  const anonEmail = `anon_${solicitud.user_id}@eliminado.local`;

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: "Usuario eliminado",
      email: anonEmail,
      notification_preferences: {
        pedidos: { email: false, in_app: false },
        floracion: { email: false, in_app: false },
        sistema: { email: false, in_app: false },
      },
    })
    .eq("id", solicitud.user_id);
  if (profileError) throw profileError;

  // Ventas: se conservan por deber tributario pero disociadas del titular.
  const { error: ventasError } = await admin
    .from("ventas")
    .update({ buyer_email: anonEmail, direccion_envio: null })
    .eq("user_id", solicitud.user_id);
  if (ventasError) throw ventasError;

  // Datos volátiles del titular.
  await admin.from("security_events").delete().eq("user_id", solicitud.user_id);
  await admin.from("cliente_direcciones").delete().eq("user_id", solicitud.user_id);
  await admin.from("carrito_items").delete().eq("user_id", solicitud.user_id);

  const { error: updateError } = await admin
    .from("arco_solicitudes")
    .update({ estado: "ejecutada", ejecutada_at: new Date().toISOString() })
    .eq("id", solicitud.id);
  if (updateError) throw updateError;
}

const ARCO_EXPIRY_BATCH_LIMIT = 20;

/**
 * Ejecuta las solicitudes vencidas (fecha_limite superada, Ley 21.719: 30 días).
 * Lo invoca el cron diario; también revoca el acceso Auth al final.
 */
export async function processArcoExpirations(
  admin: SupabaseClient,
  deleteAuthUser?: (userId: string) => Promise<void>,
): Promise<{ executed: number }> {
  const { data: vencidas, error } = await admin
    .from("arco_solicitudes")
    .select("id, user_id")
    .in("estado", ["pendiente", "en_revision"])
    .lt("fecha_limite", new Date().toISOString())
    .order("fecha_limite", { ascending: true })
    .limit(ARCO_EXPIRY_BATCH_LIMIT);

  if (error) throw new Error(`arco expirations query failed: ${error.message}`);

  let executed = 0;
  for (const solicitud of vencidas ?? []) {
    try {
      await executeArcoSolicitud(admin, solicitud as ArcoSolicitudRow);
      if (deleteAuthUser) {
        try {
          await deleteAuthUser((solicitud as ArcoSolicitudRow).user_id);
        } catch {
          // La anonimización ya quedó; la revocación Auth reintenta mañana.
        }
      }
      executed += 1;
    } catch (err) {
      console.error("[arco] expiry execution failed:", solicitud, err);
    }
  }

  return { executed };
}
