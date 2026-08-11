/**
 * Contexto de registro **solo del usuario autenticado**.
 * Nunca mezclar filas de otros user_id (ni “admin ve todo” en un solo prompt v1).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@enjambre/database/database.types";

export type UserRegistryScope = {
  user_id: string;
  profile_role: string;
  colmenas: Array<{
    id: string;
    name: string | null;
    last_inspection: string | null;
    apiario_id: string | null;
  }>;
  apiarios: Array<{ id: string; name: string | null }>;
  actor_territorial: {
    id: string;
    rol: string;
    nombre_actor: string;
    comuna: string;
    nivel_acreditacion: string;
  } | null;
  recent_inspecciones: Array<{
    id: string;
    colmena_id: string | null;
    date: string | null;
    notes: string | null;
    fase: string | null;
  }>;
};

export async function loadUserRegistryScope(
  supabase: SupabaseClient<Database>,
  userId: string,
  profileRole: string,
): Promise<UserRegistryScope> {
  // colmenas NO tiene updated_at en schema real — ordenar por last_inspection / created_at
  const [colmenasRes, apiariosRes, actorRes, inspRes] = await Promise.all([
    supabase
      .from("colmenas")
      .select("id, name, last_inspection, apiario_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("apiarios")
      .select("id, name")
      .eq("user_id", userId)
      .limit(40),
    supabase
      .from("actores_registro")
      .select("id, rol, nombre_actor, comuna, nivel_acreditacion")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("inspecciones")
      .select("id, colmena_id, date, notes, fase")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(30),
  ]);

  // Fail soft por tabla: no tumbar el ask si un select falla (RLS / drift)
  const colmenas = colmenasRes.error
    ? []
    : ((colmenasRes.data ?? []) as UserRegistryScope["colmenas"]);
  const apiarios = apiariosRes.error
    ? []
    : ((apiariosRes.data ?? []) as UserRegistryScope["apiarios"]);
  const recent_inspecciones = inspRes.error
    ? []
    : ((inspRes.data ?? []) as UserRegistryScope["recent_inspecciones"]);
  const actor_territorial = actorRes.error
    ? null
    : ((actorRes.data as UserRegistryScope["actor_territorial"]) ?? null);

  return {
    user_id: userId,
    profile_role: profileRole,
    colmenas,
    apiarios,
    actor_territorial,
    recent_inspecciones,
  };
}

/** Serializa el scope para el system prompt (acotado, sin secretos). */
export function formatRegistryScopeForPrompt(scope: UserRegistryScope): string {
  return JSON.stringify(
    {
      profile_role: scope.profile_role,
      colmenas_count: scope.colmenas.length,
      colmenas: scope.colmenas.map((c) => ({
        id: c.id,
        name: c.name,
        last_inspection: c.last_inspection,
      })),
      apiarios: scope.apiarios.map((a) => ({ id: a.id, name: a.name })),
      actor_territorial: scope.actor_territorial,
      recent_inspecciones: scope.recent_inspecciones.map((i) => ({
        colmena_id: i.colmena_id,
        date: i.date,
        fase: i.fase,
        notes: i.notes?.slice(0, 200) ?? null,
      })),
    },
    null,
    0,
  );
}

export const REGISTRY_ASK_SYSTEM = `Eres el asistente del registro apícola personal del usuario en Enjambre Legado (Núcleo).
Reglas estrictas:
1. Solo usá el JSON de contexto del usuario. No inventes colmenas, fechas ni datos que no estén ahí.
2. Si falta información, decilo y sugerí qué registrar en el patio o en el registro territorial.
3. Respondé en español de Chile, claro y breve.
4. No pidas ni asumas datos de otros usuarios.
5. No ejecutes acciones; solo informás y orientás.`;
