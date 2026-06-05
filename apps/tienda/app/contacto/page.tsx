import { ContactForm } from './contact-form';
import { Suspense } from 'react';

export const metadata = { title: 'Contacto' };
export const dynamic = 'force-dynamic';

export default function ContactoPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ContactForm />
    </Suspense>
  );
}
