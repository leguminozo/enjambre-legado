import { ContactForm } from './contact-form';
import { Suspense } from 'react';
import { ViewLoading } from '@enjambre/ui';
import { getSiteContent } from '@/lib/cms';
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

export default async function ContactoPage() {
  // Cabecera editable desde el Editor de Tienda (site_content 'contacto').
  // Vacío = copy hardcodeado actual.
  const cmsRows = await getSiteContent('contacto');
  const cms = cmsRows[0]?.content as Record<string, unknown> | undefined;
  const title =
    typeof cms?.title === 'string' && cms.title.trim() ? cms.title : 'Contáctenos';
  const desc =
    typeof cms?.desc === 'string' && cms.desc.trim()
      ? cms.desc
      : 'No dudes en contactarnos si tienes alguna pregunta o inquietud.';

  return (
    <Suspense fallback={<ViewLoading variant="view" label="Contacto" hideLabel />}>
      <ContactForm title={title} desc={desc} />
    </Suspense>
  );
}
