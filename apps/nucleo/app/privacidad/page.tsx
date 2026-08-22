import Link from 'next/link';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacidad y Protección de Datos — Registro Apícola de Chiloé',
  description:
    'Política de privacidad del censo territorial de Chiloé. Datos protegidos, anonimización de coordenadas GPS y control absoluto de tu información.',
  alternates: {
    canonical: 'https://www.registroapicolachiloe.me/privacidad',
  },
  openGraph: {
    title: 'Privacidad y Protección de Datos · Registro Apícola de Chiloé',
    description:
      'Garantía de confidencialidad: tu ubicación GPS exacta nunca se hace pública. Control soberano de tus datos apícolas.',
    url: 'https://www.registroapicolachiloe.me/privacidad',
    siteName: 'Registro Apícola de Chiloé',
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacidad y Protección de Datos · Registro Apícola de Chiloé',
    description:
      'Garantía de confidencialidad: tu ubicación GPS exacta nunca se hace pública. Control soberano de tus datos apícolas.',
  },
};

export default function PrivacidadTerritorialPage() {
  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground font-sans flex flex-col">
      <TerritorioHeader />
      <article className="mx-auto w-full max-w-2xl px-6 sm:px-8 py-16 sm:py-24">
        <p className="text-sm text-muted-foreground mb-4">Registro Territorial Apícola de Chiloé</p>
        <h1 className="font-existencial text-3xl sm:text-4xl font-semibold tracking-tight text-balance mb-6">
          Política de datos del censo
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-10">
          Esto no es el aviso de la tienda. Acá se trata de tu inscripción, tus apiarios y el mapa.
          El detalle de gobernanza está en la{' '}
          <Link href="/carta" className="underline underline-offset-4">
            Carta constitutiva
          </Link>
          .
        </p>

        <section className="space-y-8 text-[0.95rem] leading-relaxed">
          <div>
            <h2 className="font-medium text-foreground mb-2">Qué pedimos</h2>
            <p className="text-muted-foreground">
              Identidad de contacto, rol (residente, trashumante, institución), y la ubicación de
              tus apiarios. El punto exacto queda restringido: en el mapa público se ve un área de
              más o menos un kilómetro, sin nombre ni teléfono.
            </p>
          </div>
          <div>
            <h2 className="font-medium text-foreground mb-2">Para qué</h2>
            <p className="text-muted-foreground">
              Defender zonas de pecoreo, alertar instalaciones cercanas, preparar la declaración SAG
              de octubre y, si tú lo activas, emitir un pasaporte de lote. No vendemos listas. No
              usamos tus coordenadas para publicidad.
            </p>
          </div>
          <div>
            <h2 className="font-medium text-foreground mb-2">Quién ve qué</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Público: zonas aproximadas, nunca el GPS exacto.</li>
              <li>Tú: tus coordenadas y tu ficha.</li>
              <li>Quien autorices: lo que marques al compartir.</li>
            </ul>
          </div>
          <div>
            <h2 className="font-medium text-foreground mb-2">Retiro y corrección</h2>
            <p className="text-muted-foreground">
              Puedes corregir o pedir el retiro de tus datos. Nadie queda fuera de un servicio
              esencial del censo por negarse a un dato opcional. Escríbenos o pídelo en persona
              (feria, INDAP, apiario).
            </p>
          </div>
        </section>

        <p className="mt-12 text-sm text-muted-foreground">
          <Link href="/terminos" className="underline underline-offset-4">
            Términos de uso del registro
          </Link>
          {' · '}
          <Link href="/carta" className="underline underline-offset-4">
            Carta
          </Link>
        </p>
      </article>
      <TerritorioFooter />
    </main>
  );
}
