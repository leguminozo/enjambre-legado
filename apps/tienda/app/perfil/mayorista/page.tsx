import { assertStoreRouteAccess } from '@/lib/shop/assert-route-access';
import { createClient } from '@/utils/supabase/server';
import { MayoristaPortalClient } from '@/components/perfil/mayorista-portal-client';
import {
  WHOLESALE_COMMERCIAL_RULES,
  WHOLESALE_INVESTMENT_TIERS,
  type WholesaleCommercialRules,
  type WholesaleInvestmentTier,
} from '@enjambre/pricing';

export const metadata = {
  title: 'Portal Aliado Mayorista | La Obrera y el Zángano',
  description: 'Portal de pedidos institucionales B2B y catálogo para aliados autorizados.',
};

export default async function MayoristaPerfilPage() {
  await assertStoreRouteAccess('/perfil/mayorista');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let perfil = null;
  if (user) {
    const { data } = await supabase
      .from('revendedor_profile')
      .select('razon_social, rut, tipo_negocio, estado, direccion, region')
      .eq('user_id', user.id)
      .maybeSingle();
    perfil = data;
  }

  // Cargar reglas mayoristas B2B dinámicas
  let rules: WholesaleCommercialRules = { ...WHOLESALE_COMMERCIAL_RULES };
  let investmentTiers: WholesaleInvestmentTier[] = [...WHOLESALE_INVESTMENT_TIERS];

  try {
    const [rulesRes, tiersRes] = await Promise.all([
      supabase.from('b2b_wholesale_rules').select('*').limit(1).maybeSingle(),
      supabase.from('b2b_investment_tiers').select('*').order('prioridad', { ascending: true }),
    ]);

    if (rulesRes.data) {
      const r = rulesRes.data;
      rules = {
        ...WHOLESALE_COMMERCIAL_RULES,
        moqFrascosMixtos: Number(r.moq_frascos_mixtos) || WHOLESALE_COMMERCIAL_RULES.moqFrascosMixtos,
        moqSachets: Number(r.moq_sachets) || WHOLESALE_COMMERCIAL_RULES.moqSachets,
        umbralDespachoGratisRmNetoClp:
          Number(r.umbral_despacho_gratis_rm_neto_clp) ||
          WHOLESALE_COMMERCIAL_RULES.umbralDespachoGratisRmNetoClp,
        temperaturaMinimaCelsius:
          Number(r.temperatura_minima_celsius) || WHOLESALE_COMMERCIAL_RULES.temperaturaMinimaCelsius,
        temperaturaMaximaCelsius:
          Number(r.temperatura_maxima_celsius) || WHOLESALE_COMMERCIAL_RULES.temperaturaMaximaCelsius,
        diasHabilesInspeccion:
          Number(r.dias_habiles_inspeccion) || WHOLESALE_COMMERCIAL_RULES.diasHabilesInspeccion,
        diasMaximoReclamo:
          Number(r.dias_maximo_reclamo) || WHOLESALE_COMMERCIAL_RULES.diasMaximoReclamo,
        diasGarantiaDevolucion:
          Number(r.dias_garantia_devolucion) || WHOLESALE_COMMERCIAL_RULES.diasGarantiaDevolucion,
        porcentajeContenidoMinimoDevolucion:
          Number(r.porcentaje_contenido_minimo_devolucion) ||
          WHOLESALE_COMMERCIAL_RULES.porcentajeContenidoMinimoDevolucion,
      };
    }

    if (tiersRes.data && tiersRes.data.length > 0) {
      investmentTiers = tiersRes.data.map((t) => ({
        desdeClp: Number(t.desde_clp),
        hastaClp: t.hasta_clp != null ? Number(t.hasta_clp) : null,
        descuentoPct: Number(t.descuento_pct),
        etiqueta: t.etiqueta,
      }));
    }
  } catch {
    // Si falla la tabla o la red, mantiene defaults seguros de @enjambre/pricing
  }

  return (
    <MayoristaPortalClient
      userEmail={user?.email}
      perfil={perfil}
      rules={rules}
      investmentTiers={investmentTiers}
    />
  );
}