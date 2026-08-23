import { ContactForm } from './contact-form';
import { Suspense } from 'react';
import { ViewLoading } from '@enjambre/ui';
import { getSiteContent } from '@/lib/cms';
import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

// Metadata con datos de contacto del CMS (contact_settings) — no hardcodeados
export async function generateMetadata(): Promise<Metadata> {
  const contactRows = await getSiteContent('contact_settings');
  const contact = contactRows[0]?.content as Record<string, unknown> | undefined;
  const email =
    typeof contact?.email === 'string' && contact.email.trim()
      ? contact.email
      : 'obrerayzangano@gmail.com';
  const address =
    typeof contact?.address === 'string' && contact.address.trim()
      ? contact.address.split('\n')[0]
      : 'Pureo, Quellón, Chiloé';
  const description = `Escríbenos a ${email} o por WhatsApp. Estamos en ${address} — La Obrera y el Zángano.`;
  return {
    title: 'Contacto',
    description,
    alternates: { canonical: `${SITE_URL}/contacto` },
    openGraph: {
      title: 'Contacto · La Obrera y el Zángano',
      description,
      url: `${SITE_URL}/contacto`,
      type: 'website',
      locale: 'es_CL',
      siteName: 'La Obrera y el Zángano',
    },
    twitter: {
      card: 'summary',
      title: 'Contacto · La Obrera y el Zángano',
      description,
    },
  };
}
export const revalidate = 3600;

export default async function ContactoPage({
  searchParams,
}: {
  searchParams: Promise<{ cms_preview?: string }>;
}) {
  const draft = (await searchParams).cms_preview === '1';
  // Cabecera editable desde el Editor de Tienda (site_content 'contacto').
  // Vacío = copy hardcodeado actual.
  const cmsRows = await getSiteContent('contacto', { draft });
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
