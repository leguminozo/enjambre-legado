import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export const metadata: Metadata = {
  title: 'Degustaciones · Cata de Mieles de Chile · La Obrera y el Zángano',
  description: 'Cata de mieles de Chile, kit de degustación y análisis sensorial.',
  alternates: { canonical: `${SITE_URL}/experiencias/degustaciones` },
  robots: { index: false, follow: true },
};

export default function FloracionesRedirectPage() {
  redirect('/experiencias/degustaciones');
}
