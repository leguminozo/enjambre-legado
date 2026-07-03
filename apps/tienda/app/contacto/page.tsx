import { ContactForm } from './contact-form';
import { Suspense } from 'react';
import { ViewLoading } from '@enjambre/ui';
import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';

export const metadata: Metadata = {
  title: 'Contacto',
  description:
    'Escríbenos a hola@obrerayzangano.com o por WhatsApp. Estamos en Pureo, Quellón, Chiloé — La Obrera y el Zángano.',
  alternates: { canonical: `${SITE_URL}/contacto` },
  openGraph: {
    title: 'Contacto · La Obrera y el Zángano',
    description:
      'Escríbenos a hola@obrerayzangano.com o por WhatsApp. Estamos en Pureo, Quellón, Chiloé.',
    url: `${SITE_URL}/contacto`,
    type: 'website',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
  },
  twitter: {
    card: 'summary',
    title: 'Contacto · La Obrera y el Zángano',
    description:
      'Escríbenos a hola@obrerayzangano.com o por WhatsApp. Estamos en Pureo, Quellón, Chiloé.',
  },
};
export const revalidate = 3600;

export default function ContactoPage() {
  return (
    <Suspense fallback={<ViewLoading variant="view" label="Contacto" hideLabel />}>
      <ContactForm />
    </Suspense>
  );
}
