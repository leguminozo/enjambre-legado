'use client';

import dynamic from 'next/dynamic';
import type { TextAlign } from '@enjambre/shop-chrome';

const ContactForm = dynamic(
  () => import('./contact-form').then((m) => m.ContactForm),
  { ssr: false },
);

export function ContactoClient({
  title,
  desc,
  align,
}: {
  title: string;
  desc: string;
  align?: TextAlign;
}) {
  return <ContactForm title={title} desc={desc} align={align} />;
}
