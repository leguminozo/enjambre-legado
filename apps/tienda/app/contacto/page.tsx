import { ContactForm } from './contact-form';
import { Suspense } from 'react';
import { ViewLoading } from '@enjambre/ui';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { getLocale } from 'next-intl/server';
import { getSiteContent } from '@/lib/cms';
import { parseContactSettings, resolveLocalized } from '@/lib/shop/store-chrome';
import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

// Metadata con datos de contacto del CMS (contact_settings) — no hardcodeados
export async function generateMetadata(): Promise<Metadata> {
  const contactRows = await getSiteContent('contact_settings');
  const contact = contactRows[0]?.content as Record<string, unknown> | undefined;
  const email =
    typeof contact?.email === 'string' && contact.email.trim()
      ? contact.email
      : 'contacto@obrerayzangano.cl';
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

function ContactoFallback({ title, desc }: { title: string; desc: string }) {
  return (
    <StoreShell>
      <ShopHeader />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] pb-14">
        <div className="text-center">
          <h1 className="font-display text-[clamp(2rem,7vw,2.75rem)] sm:text-4xl font-semibold text-foreground text-balance">
            {title}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground text-pretty whitespace-pre-line">
            {desc}
          </p>
        </div>
        <div className="mt-12 flex justify-center py-12">
          <ViewLoading variant="view" label="Contacto" hideLabel />
        </div>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}

export default async function ContactoPage({
  searchParams,
}: {
  searchParams: Promise<{ cms_preview?: string }>;
}) {
  const draft = (await searchParams).cms_preview === '1';
  // Cabecera editable desde el Editor de Tienda (site_content 'contacto').
  const [cmsRows, contactSettingsRows, locale] = await Promise.all([
    getSiteContent('contacto', { draft }),
    getSiteContent('contact_settings', { draft }),
    getLocale(),
  ]);
  const cms = cmsRows[0]?.content as Record<string, string | undefined> | undefined;
  const rawTitle = resolveLocalized(cms?.title, cms?.title_en, locale);
  const rawDesc = resolveLocalized(cms?.desc, cms?.desc_en, locale);
  const title = rawTitle || (locale === 'en' ? 'Contact Us' : 'Contáctenos');
  const desc =
    rawDesc ||
    (locale === 'en'
      ? 'Reach out directly for inquiries regarding our native honeys, corporate orders, or private experiences.'
      : 'Escríbenos directamente para consultas sobre nuestras mieles, pedidos especiales o visitas guiadas.');
  const contactSettings = parseContactSettings(
    contactSettingsRows?.[0]?.content as Record<string, unknown> | undefined,
  );

  return (
    <Suspense fallback={<ContactoFallback title={title} desc={desc} />}>
      <ContactForm title={title} desc={desc} align={contactSettings.text_align} />
    </Suspense>
  );
}
