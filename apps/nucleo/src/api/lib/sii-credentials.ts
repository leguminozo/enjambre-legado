import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@enjambre/database/database.types';

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
    .select('storage_path, nombre')
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

  if (!p12Base64 || !envPassword) {
    const hasCertRecord = Boolean(certData);
    return {
      ok: false,
      code: hasCertRecord ? 'no_credenciales' : 'no_certificado',
      message: hasCertRecord
        ? 'Certificado encontrado pero no se pudo leer. Verifique storage o defina SII_P12_BASE64 y SII_P12_PASSWORD.'
        : 'Credenciales SII no configuradas. Suba un certificado activo o defina SII_P12_BASE64 y SII_P12_PASSWORD.',
    };
  }

  return {
    ok: true,
    credentials: {
      p12Base64,
      p12Password: envPassword,
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