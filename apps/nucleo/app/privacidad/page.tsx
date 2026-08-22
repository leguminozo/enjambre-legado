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
          Esta política rige la recolección y tratamiento de datos para la inscripción territorial, la declaración de apiarios y la visualización cartográfica.
          El marco de gobernanza y soberanía de datos se encuentra consagrado en la{' '}
          <Link href="/carta" className="underline underline-offset-4">
            Carta Constitutiva
          </Link>
          .
        </p>

        <section className="space-y-8 text-[0.95rem] leading-relaxed">
          <div>
            <h2 className="font-medium text-foreground mb-2">Datos solicitados</h2>
            <p className="text-muted-foreground">
              Identidad de contacto, calidad de operación (residente, trashumante, entidad institucional) y ubicación georreferenciada de los apiarios. Las coordenadas exactas permanecen bajo estricta reserva: en el mapa público únicamente se visualiza un área aproximada de ~1 km de radio, sin asociar nombres, RUT ni teléfonos.
            </p>
          </div>
          <div>
            <h2 className="font-medium text-foreground mb-2">Finalidad del tratamiento</h2>
            <p className="text-muted-foreground">
              Resguardo de zonas de pecoreo, emisión de alertas sanitarias ante aplicaciones fitosanitarias o cercanía de colmenares, asistencia técnica para la declaración anual de existencias ante el SAG y, de ser solicitado por el titular, emisión de pasaportes digitales de trazabilidad. No comercializamos bases de datos ni empleamos coordenadas para fines publicitarios.
            </p>
          </div>
          <div>
            <h2 className="font-medium text-foreground mb-2">Niveles de acceso</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Público general: zonas aproximadas difusas (~1 km), sin coordenadas exactas.</li>
              <li>Titular: acceso íntegro y exclusivo a sus coordenadas y fichas de manejo.</li>
              <li>Terceros autorizados: exclusivamente la información que el titular decida compartir mediante credencial o pasaporte.</li>
            </ul>
          </div>
          <div>
            <h2 className="font-medium text-foreground mb-2">Derechos de rectificación y cancelación</h2>
            <p className="text-muted-foreground">
              El titular puede rectificar o solicitar la eliminación de sus datos en cualquier momento conforme a las Leyes N° 19.628 y N° 21.719. La negativa a suministrar datos optativos en ningún caso restringe el acceso a los servicios esenciales del registro. Puede gestionar su solicitud vía digital o mediante los canales presenciales de la red.
            </p>
          </div>
        </section>

        <p className="mt-12 text-sm text-muted-foreground">
          <Link href="/terminos" className="underline underline-offset-4">
            Términos de uso del registro
          </Link>
          {' · '}
          <Link href="/carta" className="underline underline-offset-4">
            Carta Constitutiva
          </Link>
        </p>
      </article>
      <TerritorioFooter />
    </main>
  );
}
