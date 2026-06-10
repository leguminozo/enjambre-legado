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
      <main className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-foreground">Experiencias</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
Experiencias del bosque inmersivas ligadas a toda nuestra actividad.
        </p>
        <Link href="/" className="mt-8 inline-block text-sm text-accent underline underline-offset-2">
          ← Inicio
        </Link>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
