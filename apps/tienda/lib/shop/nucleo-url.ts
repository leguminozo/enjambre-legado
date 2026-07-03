/** URL del BFF nucleo — nunca localhost en build/produccion sin env explicita. */
export function getNucleoApiUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_NUCLEO_API_URL?.trim();
  if (raw) return raw.replace(/\/$/, '');

  const isProdBuild =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.CI);

  if (isProdBuild) return null;
  return 'http://localhost:3000';
}

export function requireNucleoApiUrl(): string {
  const url = getNucleoApiUrl();
  if (!url) {
    throw new Error('NEXT_PUBLIC_NUCLEO_API_URL no esta configurada');
  }
  return url;
}
