import type { WalletGuardianSnapshot } from '@enjambre/wallet';
import { getAuthToken } from '@/lib/shop/resenas-api';

const NUCLEO_URL = process.env.NEXT_PUBLIC_NUCLEO_API_URL || 'http://localhost:3001';

export async function fetchWalletSnapshot(token?: string): Promise<WalletGuardianSnapshot | null> {
  const authToken = token ?? (await getAuthToken());
  if (!authToken) return null;

  const res = await fetch(`${NUCLEO_URL}/api/wallet/stamps`, {
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

  const res = await fetch(`${NUCLEO_URL}/api/wallet/apple/download`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    return { ok: false, message: typeof json.message === 'string' ? json.message : 'Error' };
  }

  if (json.unsigned) {
    const blob = new Blob([JSON.stringify(json.pass, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'oyz-guardian-pass.json';
    a.click();
    URL.revokeObjectURL(url);
    return {
      ok: true,
      message:
        typeof json.message === 'string'
          ? json.message
          : 'Pass generado (unsigned). Configura certs Apple para .pkpass.',
    };
  }

  return { ok: true };
}

export async function getGoogleSaveLink(): Promise<{ ok: boolean; saveUrl?: string; message?: string }> {
  const token = await getAuthToken();
  if (!token) return { ok: false, message: 'Inicia sesión' };

  const res = await fetch(`${NUCLEO_URL}/api/wallet/google/save-link`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      origin: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001',
    },
  });

  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    return { ok: false, message: typeof json.message === 'string' ? json.message : 'Error' };
  }

  if (typeof json.saveUrl === 'string') {
    window.open(json.saveUrl, '_blank');
    return { ok: true, saveUrl: json.saveUrl };
  }

  return {
    ok: true,
    message:
      typeof json.message === 'string'
        ? json.message
        : 'Google Wallet pendiente de configuración en servidor',
  };
}