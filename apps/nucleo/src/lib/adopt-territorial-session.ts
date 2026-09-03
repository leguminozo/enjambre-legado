import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@enjambre/auth';

export type AdoptTerritorialResult = {
  ok: boolean;
  adopted?: boolean;
  code?: string;
};

let inFlightAdopt: Promise<AdoptTerritorialResult> | null = null;

/** Adopta rol territorial + refresca sesión solo si hubo mutación real. Idempotente. */
export async function adoptTerritorialSession(): Promise<AdoptTerritorialResult> {
  const currentAuth = useAuthStore.getState();
  // Si el usuario ya está autenticado y consolidado con rol territorial y subrol,
  // no es necesario hacer ninguna llamada a la red ni refrescar tokens.
  if (currentAuth.user?.role === 'territorial' && currentAuth.user?.territorial_rol) {
    return { ok: true, adopted: false };
  }

  if (inFlightAdopt) return inFlightAdopt;

  inFlightAdopt = (async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return { ok: false, code: 'no_token' };

      const res = await fetch('/api/auth-territorial/adoptar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) return { ok: false, code: 'adopt_failed' };

      const json = (await res.json().catch(() => ({}))) as {
        data?: { adopted?: boolean; role?: string };
      };
      const wasAdopted = Boolean(json.data?.adopted);

      // Solo refrescar la sesión e invalidar stores si el servidor efectivamente
      // ejecutó una promoción de rol o creación de actor.
      if (wasAdopted) {
        await supabase.auth.refreshSession();
        await useAuthStore.getState().checkUser();
      }

      return { ok: true, adopted: wasAdopted };
    } finally {
      inFlightAdopt = null;
    }
  })();

  return inFlightAdopt;
}

