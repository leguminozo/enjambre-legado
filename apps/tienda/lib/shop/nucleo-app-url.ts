/** URL de la app Núcleo (dashboard), no solo el origin del BFF API. */
export function getNucleoAppUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_NUCLEO_API_URL?.trim();
  if (raw) return raw.replace(/\/$/, '');

  const isProd =
    process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL) || Boolean(process.env.CI);
  if (isProd) return null;
  return 'http://localhost:3000';
}

export function getNucleoStaffEntryPath(): string {
  return '/ejecutivo';
}

export function getNucleoStaffEntryUrl(): string | null {
  const base = getNucleoAppUrl();
  if (!base) return null;
  return `${base}${getNucleoStaffEntryPath()}`;
}