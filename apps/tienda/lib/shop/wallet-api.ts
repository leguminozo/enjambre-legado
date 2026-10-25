import type { WalletGuardianSnapshot } from '@enjambre/wallet';
import { getAuthToken } from '@/lib/shop/resenas-api';
import { getNucleoApiUrl } from '@/lib/shop/nucleo-url';
import { friendlyError } from '@enjambre/ui';

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

  try {
    const res = await fetch(`${nucleoUrl}/api/wallet/capabilities`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) return null;
    return (await res.json()) as WalletCapabilities;
  } catch {
    // Fail-soft: Núcleo 502/HTML rompería res.json() y dejaría la UI sin
    // capacidades (mismo patrón que club-lotes-publicos).
    return null;
  }
}

export async function fetchWalletSnapshot(token?: string): Promise<WalletGuardianSnapshot | null> {
  const authToken = token ?? (await getAuthToken());
  if (!authToken) return null;

  const nucleoUrl = getNucleoApiUrl();
  if (!nucleoUrl) return null;

  try {
    const res = await fetch(`${nucleoUrl}/api/wallet/stamps`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;
    const json = (await res.json()) as { snapshot?: WalletGuardianSnapshot };
    return json.snapshot ?? null;
  } catch {
    // Fail-soft: si Núcleo responde 502/HTML, res.json() lanzaría y la
    // sección "Sellos del bosque" quedaría en "Cargando..." eterno.
    return null;
  }
}

export async function downloadApplePass(): Promise<{ ok: boolean; message?: string }> {
  const token = await getAuthToken();
  if (!token) return { ok: false, message: 'Inicia sesión' };
  const nucleoUrl = getNucleoApiUrl();
  if (!nucleoUrl) return { ok: false, message: 'Servicio no disponible' };

  try {
    const res = await fetch(`${nucleoUrl}/api/wallet/apple/download`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
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
  }
}

export async function getGoogleSaveLink(): Promise<{ ok: boolean; saveUrl?: string; message?: string }> {
  const token = await getAuthToken();
  if (!token) return { ok: false, message: 'Inicia sesión' };
  const nucleoUrl = getNucleoApiUrl();
  if (!nucleoUrl) return { ok: false, message: 'Servicio no disponible' };

  try {
    const res = await fetch(`${nucleoUrl}/api/wallet/google/save-link`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        origin: typeof window !== 'undefined' ? window.location.origin : nucleoUrl,
      },
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
  }
}