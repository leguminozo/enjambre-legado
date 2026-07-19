/**
 * AES-GCM helpers for SII secrets stored at rest (portal clave, P12 password).
 * Fail-closed: no empty/short material.
 */

export function resolveSiiEncryptionKeyBytes(): Uint8Array | null {
  const candidates = [
    process.env.SII_CLAVE_ENCRYPTION_KEY,
    process.env.FISCAL_ENCRYPTION_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ];
  for (const raw of candidates) {
    const v = raw?.trim();
    if (v && v.length >= 32) {
      return new TextEncoder().encode(v.slice(0, 32));
    }
  }
  return null;
}

export function hasSiiEncryptionMaterial(): boolean {
  return resolveSiiEncryptionKeyBytes() !== null;
}

export async function encryptSiiSecret(plaintext: string): Promise<string | null> {
  const keyBytes = resolveSiiEncryptionKeyBytes();
  if (!keyBytes) return null;

  const algoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes as BufferSource,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    algoKey,
    new TextEncoder().encode(plaintext),
  );
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptSiiSecret(ciphertextB64: string): Promise<string | null> {
  const keyBytes = resolveSiiEncryptionKeyBytes();
  if (!keyBytes) return null;

  try {
    const combined = Uint8Array.from(atob(ciphertextB64), (c) => c.charCodeAt(0));
    if (combined.length < 13) return null;
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const algoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes as BufferSource,
      { name: "AES-GCM" },
      false,
      ["decrypt"],
    );
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, algoKey, data);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

/** Chilean RUT with modulo-11 check digit. Accepts dots/dash. */
export function isValidChileanRut(rut: string): boolean {
  const clean = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(clean)) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let sum = 0;
  let mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const mod = 11 - (sum % 11);
  const expected = mod === 11 ? "0" : mod === 10 ? "K" : String(mod);
  return dv === expected;
}

/** Normalize to body-DV without dots (SII style). */
export function normalizeRut(rut: string): string {
  const clean = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();
  if (clean.length < 2) return clean;
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`;
}
