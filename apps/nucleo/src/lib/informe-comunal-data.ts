import { createAdminClient } from '@enjambre/auth/browser';
import {
  agregarResumenComunas,
  informeDeSlug,
  informesChiloe,
  type InformeComunalPublico,
  type ResumenComuna,
} from './informe-comunal';

async function loadResumenComunas(): Promise<{ rows: ResumenComuna[] } | { error: string }> {
  const admin = createAdminClient();
  const [actoresRes, apiariosRes, externosRes, alertasRes] = await Promise.all([
    admin.from('actores_registro').select('comuna').eq('estado', 'activo'),
    admin.from('apiarios_registro').select('comuna, n_colmenas').eq('activo', true),
    admin
      .from('apiarios_externos')
      .select('comuna_destino')
      .in('estado', ['declarado', 'activo']),
    admin.from('alertas_fitosanitarias').select('comuna').eq('estado', 'activa'),
  ]);

  for (const r of [actoresRes, apiariosRes, externosRes, alertasRes]) {
    if (r.error) return { error: r.error.message };
  }

  return {
    rows: agregarResumenComunas({
      actores: actoresRes.data ?? [],
      apiarios: apiariosRes.data ?? [],
      trashumantes: externosRes.data ?? [],
      alertas: alertasRes.data ?? [],
    }),
  };
}

export async function getInformesChiloe(): Promise<
  { informes: InformeComunalPublico[]; generado_en: string } | { error: string }
> {
  const res = await loadResumenComunas();
  if ('error' in res) return res;
  return { informes: informesChiloe(res.rows), generado_en: new Date().toISOString() };
}

export async function getInformeComunal(
  slug: string,
): Promise<{ informe: InformeComunalPublico; generado_en: string } | { error: string } | null> {
  const res = await loadResumenComunas();
  if ('error' in res) return res;
  const informe = informeDeSlug(res.rows, slug);
  if (!informe) return null;
  return { informe, generado_en: new Date().toISOString() };
}
