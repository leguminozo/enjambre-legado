import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@enjambre/database/database.types';
import { decryptSiiSecret } from './sii-crypto';

export type SiiCredentials = {
  p12Base64: string;
  p12Password: string;
  source: 'storage' | 'env';
  certName?: string;
};

export type SiiCredentialsError = {
  ok: false;
  code: 'no_certificado' | 'no_credenciales';
  message: string;
};

export type SiiCredentialsResult =
  | { ok: true; credentials: SiiCredentials }
  | SiiCredentialsError;

type SiiSupabase = SupabaseClient<Database>;

export async function resolveSiiCredentials(
  supabase: SiiSupabase,
  empresaId: string,
): Promise<SiiCredentialsResult> {
  const { data: certData, error: certError } = await supabase
    .from('sii_certificados')
    .select('storage_path, nombre, p12_password_encriptada')
    .eq('empresa_id', empresaId)
    .eq('activo', true)
    .maybeSingle();

  if (certError) {
    console.error('[sii-credentials] cert lookup failed', { empresaId, certError });
  }

  let p12Base64 = '';
  if (certData?.storage_path) {
    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('sii-certificados')
        .download(certData.storage_path);

      if (!downloadError && fileData) {
        const buffer = await fileData.arrayBuffer();
        p12Base64 = Buffer.from(buffer).toString('base64');
      } else if (downloadError) {
        console.warn('[sii-credentials] storage download failed:', downloadError.message);
      }
    } catch (storageErr) {
      console.warn('[sii-credentials] storage read error:', storageErr);
    }
  }

  const envBase64 = process.env.SII_P12_BASE64?.trim() ?? '';
  const envPassword = process.env.SII_P12_PASSWORD?.trim() ?? '';

  if (!p12Base64 && envBase64) {
    p12Base64 = envBase64;
  }

  let p12Password = '';
  if (certData?.p12_password_encriptada) {
    const decrypted = await decryptSiiSecret(certData.p12_password_encriptada);
    if (decrypted) p12Password = decrypted;
  }
  if (!p12Password && envPassword) {
    p12Password = envPassword;
  }

  if (!p12Base64 || !p12Password) {
    const hasCertRecord = Boolean(certData);
    return {
      ok: false,
      code: hasCertRecord ? 'no_credenciales' : 'no_certificado',
      message: hasCertRecord
        ? 'Certificado encontrado pero falta contraseña (subí de nuevo el P12 con clave en Configuración SII, o SII_P12_PASSWORD).'
        : 'Credenciales SII no configuradas. Subí un certificado P12 activo en Configuración SII (o SII_P12_BASE64 + SII_P12_PASSWORD).',
    };
  }

  return {
    ok: true,
    credentials: {
      p12Base64,
      p12Password,
      source: certData?.storage_path && p12Base64 !== envBase64 ? 'storage' : 'env',
      certName: certData?.nombre ?? undefined,
    },
  };
}

export function resolveSiiAmbiente(
  raw: string | null | undefined,
): 'CERTIFICACION' | 'PRODUCCION' {
  return raw?.toUpperCase() === 'PRODUCCION' ? 'PRODUCCION' : 'CERTIFICACION';
}
