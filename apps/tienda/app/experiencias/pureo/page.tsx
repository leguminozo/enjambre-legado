import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export const metadata: Metadata = {
  title: 'Territorio & Bosque Austral · La Obrera y el Zángano',
  description: 'Inmersión en el bosque templado lluvioso y colmenas en Chiloé.',
  alternates: { canonical: `${SITE_URL}/experiencias/territorio` },
  robots: { index: false, follow: true },
};

export default function PureoRedirectPage() {
  redirect('/experiencias/territorio');
}
