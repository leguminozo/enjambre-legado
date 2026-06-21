import type { SupabaseClient } from '@supabase/supabase-js';

export type CreadorCapabilities = {
  puede_retirar: boolean;
  tope_retiro_mensual: number;
  puede_ver_ranking: boolean;
  material_descargable: string[];
  canales_permitidos: string[];
};

export const DEFAULT_CREADOR_CAPABILITIES: CreadorCapabilities = {
  puede_retirar: true,
  tope_retiro_mensual: 500_000,
  puede_ver_ranking: false,
  material_descargable: ['ficha_producto'],
  canales_permitidos: ['instagram', 'tiktok', 'youtube', 'blog', 'podcast', 'otro'],
};

export type ParticipacionActiva = {
  esCreador: boolean;
  creadorEstado: string | null;
  esAliadoB2B: boolean;
  aliadoEstado: string | null;
};

export function parseCreadorCapabilities(raw: unknown): CreadorCapabilities {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return DEFAULT_CREADOR_CAPABILITIES;
  }
  const c = raw as Record<string, unknown>;
  return {
    puede_retirar: typeof c.puede_retirar === 'boolean' ? c.puede_retirar : DEFAULT_CREADOR_CAPABILITIES.puede_retirar,
    tope_retiro_mensual:
      typeof c.tope_retiro_mensual === 'number' ? c.tope_retiro_mensual : DEFAULT_CREADOR_CAPABILITIES.tope_retiro_mensual,
    puede_ver_ranking:
      typeof c.puede_ver_ranking === 'boolean' ? c.puede_ver_ranking : DEFAULT_CREADOR_CAPABILITIES.puede_ver_ranking,
    material_descargable: Array.isArray(c.material_descargable)
      ? c.material_descargable.filter((x): x is string => typeof x === 'string')
      : DEFAULT_CREADOR_CAPABILITIES.material_descargable,
    canales_permitidos: Array.isArray(c.canales_permitidos)
      ? c.canales_permitidos.filter((x): x is string => typeof x === 'string')
      : DEFAULT_CREADOR_CAPABILITIES.canales_permitidos,
  };
}

export async function getParticipacionActiva(
  supabase: SupabaseClient,
  userId: string,
): Promise<ParticipacionActiva> {
  const [creadorRes, aliadoRes] = await Promise.all([
    supabase.from('creadores').select('estado').eq('user_id', userId).maybeSingle(),
    supabase.from('revendedor_profile').select('estado').eq('user_id', userId).maybeSingle(),
  ]);

  const creadorEstado = creadorRes.data?.estado ?? null;
  const aliadoEstado = aliadoRes.data?.estado ?? null;

  return {
    esCreador: Boolean(creadorRes.data),
    creadorEstado,
    esAliadoB2B: Boolean(aliadoRes.data),
    aliadoEstado,
  };
}