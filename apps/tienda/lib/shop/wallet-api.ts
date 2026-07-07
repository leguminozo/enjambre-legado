import type { WalletGuardianSnapshot } from '@enjambre/wallet';
import { getAuthToken } from '@/lib/shop/resenas-api';
import { getNucleoApiUrl } from '@/lib/shop/nucleo-url';

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

  const res = await fetch(`${nucleoUrl}/api/wallet/capabilities`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
      'X-Requested-With': 'XMLHttpRequest',
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) return null;
  return (await res.json()) as WalletCapabilities;
}

export async function fetchWalletSnapshot(token?: string): Promise<WalletGuardianSnapshot | null> {
  const authToken = token ?? (await getAuthToken());
  if (!authToken) return null;

  const nucleoUrl = getNucleoApiUrl();
  if (!nucleoUrl) return null;

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
}

export async function downloadApplePass(): Promise<{ ok: boolean; message?: string }> {
  const token = await getAuthToken();
  if (!token) return { ok: false, message: 'Inicia sesión' };
  const nucleoUrl = getNucleoApiUrl();
  if (!nucleoUrl) return { ok: false, message: 'Servicio no disponible' };

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
      message: typeof json.message === 'string' ? json.message : 'Apple Wallet no disponible aún',
    };
  }

  return { ok: true };
}

export async function getGoogleSaveLink(): Promise<{ ok: boolean; saveUrl?: string; message?: string }> {
  const token = await getAuthToken();
  if (!token) return { ok: false, message: 'Inicia sesión' };
  const nucleoUrl = getNucleoApiUrl();
  if (!nucleoUrl) return { ok: false, message: 'Servicio no disponible' };

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
      message: typeof json.message === 'string' ? json.message : 'Google Wallet no disponible aún',
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
}