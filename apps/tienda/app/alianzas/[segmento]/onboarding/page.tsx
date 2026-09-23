import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { StoreShell } from '@/components/shop/store-shell';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import {
  isValidSegment,
  getSegmentContent,
  getSegmentKits,
  type B2BSegmentSlug,
} from '@/lib/b2b/segment-content';
import { B2BOnboardingWizard } from '@/components/b2b/b2b-onboarding-wizard';
import { getSiteContent } from '@/lib/cms';
import { parseB2BSegmentContent, type B2BSegmentSlug as ChromeB2BSegmentSlug } from '@enjambre/shop-chrome';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ segmento: string }>;
}): Promise<Metadata> {
  const { segmento } = await params;
  if (!isValidSegment(segmento)) return {};
  const segment = getSegmentContent(segmento);

  return {
    title: `Configuración Inicial & Primer Pedido · ${segment?.kicker || 'Alianzas'}`,
    description: 'Completa tus datos de facturación y configura tu primer pedido mayorista con condiciones oficiales.',
  };
}

export default async function B2BSegmentOnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ segmento: string }>;
  searchParams?: Promise<{ kit?: string }>;
}) {
  const { segmento } = await params;
  if (!isValidSegment(segmento)) {
    notFound();
  }

  const resolvedSearch = searchParams ? await searchParams : {};
  const initialKitId = resolvedSearch.kit || '';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentPath = `/alianzas/${segmento}/onboarding${initialKitId ? `?kit=${encodeURIComponent(initialKitId)}` : ''}`;

  if (!user) {
    redirect(`/login?returnTo=${encodeURIComponent(currentPath)}`);
  }

  const segment = getSegmentContent(segmento);
  const sectionKey = `b2b_${segmento.replace(/-/g, '_')}`;
  const rows = await getSiteContent(sectionKey);
  const cmsContent = (rows?.[0]?.content as Record<string, unknown>) ?? null;
  const parsed = parseB2BSegmentContent(cmsContent, segmento as ChromeB2BSegmentSlug);
  const kits = getSegmentKits(segmento, parsed.kits);

  // Intentar obtener datos previos registrados
  const { data: pv } = await supabase
    .from('b2b_puntos_venta')
    .select('nombre, ciudad, contacto_nombre')
    .or(`user_id.eq.${user.id},contacto_email.eq.${user.email}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const userEstablishment =
    pv?.nombre || (user.user_metadata?.b2b_establecimiento as string) || (user.user_metadata?.full_name as string) || '';
  const userName =
    pv?.contacto_nombre || (user.user_metadata?.full_name as string) || '';

  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-[var(--vh-full)] bg-background">
        <B2BOnboardingWizard
          segmentSlug={segmento as B2BSegmentSlug}
          segmentLabel={segment?.kicker || 'Alianzas'}
          initialKitId={initialKitId}
          userEmail={user.email || ''}
          userName={userName}
          userEstablishment={userEstablishment}
          kits={kits}
        />
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
