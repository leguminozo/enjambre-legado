import type { WalletGuardianSnapshot } from '@enjambre/wallet';
import { getAuthToken } from '@/lib/shop/resenas-api';
import { getNucleoApiUrl } from '@/lib/shop/nucleo-url';
import { friendlyError } from '@enjambre/ui';

function createTimeoutController(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

export type WalletCapabilities = {
  apple: { available: boolean; reason: string | null };
  google: { available: boolean; configured: boolean; reason: string | null };
  qr: { available: boolean; reason: string | null };
};

export async function fetchWalletCapabilities(token?: string): Promise<WalletCapabilities | null> {
  const authToken = token ?? (await getAuthToken());
  if (!authToken) return null;

  const nucleoUrl = getNucleoApiUrl();
  if (!nucleoUrl) return null;

  const timeout = createTimeoutController(3500);
  try {
    const res = await fetch(`${nucleoUrl}/api/wallet/capabilities`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
      next: { revalidate: 300 },
      signal: timeout.signal,
    });

    if (!res.ok) return null;
    return (await res.json()) as WalletCapabilities;
  } catch {
    // Fail-soft: Núcleo 502/HTML/timeout rompería res.json() y dejaría la UI sin
    // capacidades (mismo patrón que club-lotes-publicos).
    return null;
  } finally {
    timeout.clear();
  }
}

export async function fetchWalletSnapshot(token?: string): Promise<WalletGuardianSnapshot | null> {
  const authToken = token ?? (await getAuthToken());
  if (!authToken) return null;

  const nucleoUrl = getNucleoApiUrl();
  if (!nucleoUrl) return null;

  const timeout = createTimeoutController(3500);
  try {
    const res = await fetch(`${nucleoUrl}/api/wallet/stamps`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
      next: { revalidate: 60 },
      signal: timeout.signal,
    });

    if (!res.ok) return null;
    const json = (await res.json()) as { snapshot?: WalletGuardianSnapshot };
    return json.snapshot ?? null;
  } catch {
    // Fail-soft: si Núcleo responde 502/HTML/timeout, res.json() lanzaría y la
    // sección "Sellos del bosque" quedaría en "Cargando..." eterno.
    return null;
  } finally {
    timeout.clear();
  }
}

export async function downloadApplePass(): Promise<{ ok: boolean; message?: string }> {
  const token = await getAuthToken();
  if (!token) return { ok: false, message: 'Inicia sesión' };
  const nucleoUrl = getNucleoApiUrl();
  if (!nucleoUrl) return { ok: false, message: 'Servicio no disponible' };

  const timeout = createTimeoutController(6000);
  try {
    const res = await fetch(`${nucleoUrl}/api/wallet/apple/download`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
      signal: timeout.signal,
    });

    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      return {
        ok: false,
        message: friendlyError(json.message, 'La tarjeta digital para Apple Wallet no está disponible en este momento'),
      };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: 'Error de conexión. Intenta de nuevo.' };
  } finally {
    timeout.clear();
  }
}

export async function getGoogleSaveLink(): Promise<{ ok: boolean; saveUrl?: string; message?: string }> {
  const token = await getAuthToken();
  if (!token) return { ok: false, message: 'Inicia sesión' };
  const nucleoUrl = getNucleoApiUrl();
  if (!nucleoUrl) return { ok: false, message: 'Servicio no disponible' };

  const timeout = createTimeoutController(6000);
  try {
    const res = await fetch(`${nucleoUrl}/api/wallet/google/save-link`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        origin: typeof window !== 'undefined' ? window.location.origin : nucleoUrl,
      },
      signal: timeout.signal,
    });

    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      return {
        ok: false,
        message: friendlyError(json.message, 'La tarjeta digital para Google Wallet no está disponible en este momento'),
      };
    }

    if (typeof json.saveUrl === 'string') {
      window.open(json.saveUrl, '_blank');
      return { ok: true, saveUrl: json.saveUrl };
    }

    return {
      ok: false,
      message: typeof json.message === 'string' ? json.message : 'Google Wallet pendiente de configuración',
    };
  } catch {
    return { ok: false, message: 'Error de conexión. Intenta de nuevo.' };
  } finally {
    timeout.clear();
  }
}

export async function redeemStampProgram(programId: string): Promise<{
  ok: boolean;
  message?: string;
  snapshot?: WalletGuardianSnapshot;
}> {
  const authToken = await getAuthToken();
  if (!authToken) return { ok: false, message: 'Inicia sesión para canjear sellos' };

  const nucleoUrl = getNucleoApiUrl();
  if (!nucleoUrl) return { ok: false, message: 'Servicio de billetera no disponible' };

  const timeout = createTimeoutController(8000);
  try {
    const res = await fetch(`${nucleoUrl}/api/wallet/stamps/redeem`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ programId }),
      signal: timeout.signal,
    });

    const json = (await res.json()) as {
      ok?: boolean;
      message?: string;
      code?: string;
      snapshot?: WalletGuardianSnapshot;
    };

    if (!res.ok || json.ok === false) {
      return {
        ok: false,
        message: friendlyError(json.message, 'No fue posible canjear los sellos'),
      };
    }

    return {
      ok: true,
      message: json.message || '¡Unidad de cortesía canjeada con éxito!',
      snapshot: json.snapshot,
    };
  } catch (err) {
    return {
      ok: false,
      message: friendlyError(err, 'Error al comunicarse con la billetera'),
    };
  } finally {
    timeout.clear();
  }
}