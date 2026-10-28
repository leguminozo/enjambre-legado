'use client';

import dynamic from 'next/dynamic';
import type { TextAlign, ContactSettings } from '@enjambre/shop-chrome';

const ContactForm = dynamic(
  () => import('./contact-form').then((m) => m.ContactForm),
  { ssr: false },
);

export function ContactoClient({
  title,
  desc,
  align,
  contactSettings,
  locale,
}: {
  title: string;
  desc: string;
  align?: TextAlign;
  contactSettings?: ContactSettings;
  locale?: string;
}) {
  return (
    <ContactForm
      title={title}
      desc={desc}
      align={align}
      contactSettings={contactSettings}
      locale={locale}
    />
  );
}
