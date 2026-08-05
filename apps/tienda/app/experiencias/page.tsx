import Link from 'next/link';
import type { Metadata } from 'next';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';

export const metadata: Metadata = {
  title: 'Experiencias',
  description:
    'Experiencias inmersivas del bosque: talleres, visitas al apiario y rituales de miel en Chiloé — La Obrera y el Zángano.',
  alternates: { canonical: `${SITE_URL}/experiencias` },
  openGraph: {
    title: 'Experiencias · La Obrera y el Zángano',
    description:
      'Experiencias inmersivas del bosque: talleres, visitas al apiario y rituales de miel en Chiloé.',
    url: `${SITE_URL}/experiencias`,
    type: 'website',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Experiencias · La Obrera y el Zángano',
    description:
      'Experiencias inmersivas del bosque: talleres, visitas al apiario y rituales de miel en Chiloé.',
  },
};

export default function ExperienciasPage() {
  return (
    <StoreShell>
      <ShopHeader />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] pb-20">
        <h1 className="font-display text-[clamp(1.75rem,6vw,2.25rem)] font-semibold text-foreground text-balance">
          Experiencias
        </h1>
        <p className="mt-4 leading-relaxed text-muted-foreground text-pretty">
          Experiencias del bosque inmersivas ligadas a toda nuestra actividad.
        </p>
        <div className="mt-8 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Club de la Cosecha
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Suscripción al ritmo del ulmo, la tiaca y el quillay: cata, origen y
            trazabilidad de lote.
          </p>
          <Link
            href="/club-cosecha"
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-xs font-bold uppercase tracking-wider text-primary-foreground"
          >
            Conocer el club
          </Link>
        </div>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center text-sm text-accent underline underline-offset-2"
        >
          ← Inicio
        </Link>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
