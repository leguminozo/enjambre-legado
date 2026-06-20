import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getCafAlertThreshold } from '@/api/lib/fiscal/caf-guard';
import { notifyCafLowFolios } from '@/lib/notifications/enqueue-transactional';

function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials for CAF alert worker');
  return createClient(url, key, { auth: { persistSession: false } });
}

type FiscalAlertRecipient = {
  email: string;
  userId: string | null;
};

export async function resolveFiscalAlertRecipients(
  admin: SupabaseClient,
  empresaId: string,
): Promise<FiscalAlertRecipient[]> {
  const recipients: FiscalAlertRecipient[] = [];
  const seen = new Set<string>();

  const { data: empresa } = await admin
    .from('empresas')
    .select('email')
    .eq('id', empresaId)
    .maybeSingle();

  if (empresa?.email && !seen.has(empresa.email)) {
    recipients.push({ email: empresa.email, userId: null });
    seen.add(empresa.email);
  }

  const { data: members } = await admin
    .from('usuarios_empresas')
    .select('user_id, rol, profiles(email)')
    .eq('empresa_id', empresaId)
    .in('rol', ['owner', 'contador']);

  for (const member of members ?? []) {
    const row = member as {
      user_id: string;
      profiles: { email: string | null } | { email: string | null }[] | null;
    };
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const email = profile?.email;
    if (email && !seen.has(email)) {
      recipients.push({ email, userId: row.user_id });
      seen.add(email);
    }
  }

  return recipients;
}

export type CafAlertWorkerResult = {
  scanned: number;
  alertsQueued: number;
  skipped: number;
  errors: string[];
};

export async function monitorCafFolios(): Promise<CafAlertWorkerResult> {
  const admin = createAdminClient();
  const alertThreshold = getCafAlertThreshold();
  const result: CafAlertWorkerResult = {
    scanned: 0,
    alertsQueued: 0,
    skipped: 0,
    errors: [],
  };

  const { data: cafRows, error } = await admin
    .from('sii_caf')
    .select('id, empresa_id, tipo_dte, folio_desde, folio_hasta, folio_actual')
    .eq('activo', true);

  if (error) {
    result.errors.push(error.message);
    return result;
  }

  for (const row of cafRows ?? []) {
    result.scanned += 1;

    const caf = row as {
      id: string;
      empresa_id: string;
      tipo_dte: number;
      folio_desde: number;
      folio_hasta: number;
      folio_actual: number;
    };

    const restantes = Math.max(0, Number(caf.folio_hasta) - Number(caf.folio_actual));
    if (restantes > alertThreshold) continue;

    const recipients = await resolveFiscalAlertRecipients(admin, caf.empresa_id);
    if (!recipients.length) {
      result.errors.push(`sin destinatarios para empresa ${caf.empresa_id}`);
      continue;
    }

    const { data: empresa } = await admin
      .from('empresas')
      .select('razon_social')
      .eq('id', caf.empresa_id)
      .maybeSingle();

    const empresaNombre = (empresa as { razon_social?: string } | null)?.razon_social ?? 'Empresa';

    for (const recipient of recipients) {
      try {
        const notifyResult = await notifyCafLowFolios(admin, {
          empresaId: caf.empresa_id,
          empresaNombre,
          tipoDte: Number(caf.tipo_dte),
          foliosRestantes: restantes,
          folioDesde: Number(caf.folio_desde),
          folioHasta: Number(caf.folio_hasta),
          cafId: caf.id,
          email: recipient.email,
          userId: recipient.userId,
        });

        if (notifyResult.skipped || notifyResult.preferenceSkipped) {
          result.skipped += 1;
        } else if (notifyResult.emailQueued || notifyResult.inAppCreated) {
          result.alertsQueued += 1;
        }
      } catch (err) {
        result.errors.push(
          `${caf.empresa_id}/${caf.tipo_dte}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  return result;
}