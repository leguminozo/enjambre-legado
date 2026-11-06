import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { StoreShell } from '@/components/shop/store-shell';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { listVisibleProducts } from '@/lib/shop/products';
import { requireNucleoApiUrl } from '@/lib/shop/nucleo-url';
import { CataView } from './cata-view';

export async function generateMetadata({ params }: { params: Promise<{ codigo: string }> }): Promise<Metadata> {
  const p = await params;
  return {
    title: `Cata Sensorial · La Obrera y el Zángano`,
    description: 'Registra tu percepción sensorial, calibra notas organolépticas y acumula Puntos del Bosque en tu Billetera.',
  };
}

export default async function CataPage({
  params,
  searchParams,
}: {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<{ producto?: string; variante?: string; pabellon?: string; modo?: string }>;
}) {
  const { codigo } = await params;
  const {
    producto: initialProductSlugOrId,
    variante: initialVarianteId,
    pabellon: queryPabellon,
  } = await searchParams;
  const nucleoUrl = requireNucleoApiUrl();
  
  // Fetch punto de venta info
  const res = await fetch(`${nucleoUrl}/api/b2b-publico/portal/${encodeURIComponent(codigo)}`, {
    next: { revalidate: 60 }
  });
  
  let punto: { id: string; nombre: string; tipo: string; ciudad: string | null; codigo_acceso?: string } | null = null;
  let customConfig: unknown = null;

  if (res.ok) {
    const json = await res.json().catch(() => null);
    punto = json?.data?.punto ?? null;
    customConfig = json?.data?.configuracion ?? null;
  }

  if (!punto) {
    // Si no es un local B2B, verificar si es un código QR individual de envase (ej. OZ-2026-XXXXXX)
    const qrRes = await fetch(`${nucleoUrl}/api/trazabilidad/qr/${encodeURIComponent(codigo)}`, {
      next: { revalidate: 60 },
    }).catch(() => null);

    if (qrRes && qrRes.ok) {
      const qrJson = (await qrRes.json().catch(() => null)) as {
        data?: { codigo?: string; producto?: { id: string; slug?: string | null } | null };
      } | null;
      const prod = qrJson?.data?.producto;
      if (prod && (prod.slug || prod.id)) {
        redirect(
          `/producto/${encodeURIComponent(prod.slug || prod.id)}?origen=qr&qr=${encodeURIComponent(codigo)}`,
        );
      }
      redirect(`/qr-scan?code=${encodeURIComponent(codigo)}`);
    }

    const normCode = codigo.toUpperCase();
    if (
      normCode === 'FERIA' ||
      normCode === 'STAND' ||
      normCode === 'CREACIONES' ||
      normCode === 'DEGUSTACION' ||
      normCode === 'CHILE' ||
      normCode === 'MIELES_CHILE'
    ) {
      const isChile = normCode === 'CHILE' || normCode === 'MIELES_CHILE';
      punto = {
        id: isChile ? 'chile-canonico' : 'feria-canonica',
        nombre: isChile
          ? 'Atlas Botánico de Chile · Mieles Monoflorales'
          : 'Estación de Degustación en Vivo · Stand Feria',
        tipo: 'feria_evento',
        ciudad: 'Chile',
        codigo_acceso: normCode,
      };
    } else {
      notFound();
    }
  }

  // Determinar modo de pabellón según el código o parámetro query
  const normCode = codigo.toUpperCase();
  let initialPabellon: 'casa' | 'geografias' = 'casa';
  let lockPabellon: 'casa' | 'geografias' | null = null;

  if (
    normCode === 'CHILE' ||
    normCode === 'MIELES_CHILE' ||
    queryPabellon === 'geografias' ||
    queryPabellon === 'chile'
  ) {
    initialPabellon = 'geografias';
    lockPabellon = 'geografias';
  } else if (
    normCode === 'FERIA' ||
    normCode === 'CREACIONES' ||
    normCode === 'STAND' ||
    queryPabellon === 'casa' ||
    queryPabellon === 'creaciones'
  ) {
    initialPabellon = 'casa';
    lockPabellon = 'casa';
  } else if (normCode === 'DEGUSTACION' || queryPabellon === 'ambos') {
    initialPabellon = 'casa';
    lockPabellon = null; // flexible: permite conmutar entre ambos pabellones
  }

  // Fetch chips and active variants in parallel via Nucleo BFF ISR
  const [chipsRes, variantesRes] = await Promise.all([
    fetch(`${nucleoUrl}/api/b2b-publico/portal/chips`, {
      next: { revalidate: 3600 },
    }),
    fetch(`${nucleoUrl}/api/variantes?solo_activas=true`, {
      next: { revalidate: 60 },
    }),
  ]);
  const chipsJson = chipsRes.ok ? await chipsRes.json() : { data: [] };
  const variantesJson = variantesRes.ok ? await variantesRes.json() : { data: [] };

  // Fetch visible products from store catalog
  let products: Awaited<ReturnType<typeof listVisibleProducts>> = [];
  try {
    products = await listVisibleProducts();
  } catch {
    // Fallback to empty catalog on db error
  }

  return (
    <StoreShell>
      {/* En móvil se oculta el header completo (menú, logo, perfil y bolsa) para dar foco total al ritual de cata inmersivo; en desktop permanece disponible */}
      <div className="hidden md:block">
        <ShopHeader />
      </div>
      <main className="min-h-[var(--svh-full)] pt-[max(1.5rem,calc(env(safe-area-inset-top)+1rem))] md:pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] pb-20 bg-background">
        <CataView
          punto={punto}
          codigo={codigo}
          chipsCatalog={chipsJson.data ?? []}
          products={products}
          variantes={variantesJson.data ?? []}
          initialProductSlugOrId={initialProductSlugOrId}
          initialVarianteId={initialVarianteId}
          initialPabellon={initialPabellon}
          lockPabellon={lockPabellon}
          config={customConfig as never}
        />
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
