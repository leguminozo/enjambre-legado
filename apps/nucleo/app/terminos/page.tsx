import Link from 'next/link';
import { getUrlTienda } from '@/lib/publicUrls';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos de Uso — Registro Apícola de Chiloé',
  description:
    'Condiciones de uso del censo y mapa apícola de Chiloé. Registro básico gratuito y complementario a la fiscalización del SAG.',
  alternates: {
    canonical: 'https://www.registroapicolachiloe.me/terminos',
  },
  openGraph: {
    title: 'Términos de Uso · Registro Apícola de Chiloé',
    description:
      'Condiciones de uso del censo y mapa apícola de Chiloé. Plataforma comunitaria, gratuita y voluntaria.',
    url: 'https://www.registroapicolachiloe.me/terminos',
    siteName: 'Registro Apícola de Chiloé',
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Términos de Uso · Registro Apícola de Chiloé',
    description:
      'Condiciones de uso del censo y mapa apícola de Chiloé. Plataforma comunitaria, gratuita y voluntaria.',
  },
};

export default function TerminosTerritorialesPage() {
  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground font-sans flex flex-col">
      <TerritorioHeader />
      <article className="mx-auto w-full max-w-2xl px-6 sm:px-8 py-16 sm:py-24">
        <p className="text-sm text-muted-foreground mb-4">Registro Territorial Apícola de Chiloé</p>
        <h1 className="font-existencial text-3xl sm:text-4xl font-semibold tracking-tight text-balance mb-6">
          Términos de uso del registro
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-10">
          Estos términos regulan el uso del censo, el mapa cartográfico y las herramientas comunitarias de la red. Las compras realizadas en la tienda oficial se rigen por{' '}
          <a
            href={`${getUrlTienda()}/terminos`}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            sus propios términos y condiciones
          </a>
          .
        </p>

        <section className="space-y-8 text-[0.95rem] leading-relaxed">
          <div>
            <h2 className="font-medium text-foreground mb-2">Alcance del registro</h2>
            <p className="text-muted-foreground">
              El registro es voluntario e informativo. No sustituye al SAG, al SIPEC Apícola, a los
              municipios ni a los tribunales de justicia. Facilita la generación de evidencia, la coordinación territorial y la asistencia técnica para
              preparar la declaración anual de existencias. La potestad fiscalizadora permanece exclusivamente en los órganos
              competentes del Estado.
            </p>
          </div>
          <div>
            <h2 className="font-medium text-foreground mb-2">Servicios gratuitos y de pago</h2>
            <p className="text-muted-foreground">
              El censo, el mapa anonimizado, las alertas sanitarias y la asistencia para la declaración SAG son completamente gratuitos. Los
              planes avanzados de trazabilidad y cuaderno de campo se contratan por separado, con tarifas publicadas en{' '}
              <Link href="/planes-territoriales" className="underline underline-offset-4">
                la sección de planes
              </Link>
              .
            </p>
          </div>
          <div>
            <h2 className="font-medium text-foreground mb-2">Uso responsable</h2>
            <p className="text-muted-foreground">
              El usuario declara de buena fe la información relativa a sus apiarios. Queda estrictamente prohibido utilizar la cartografía para fines de hostigamiento o competencia desleal.
              La red reconoce el valor de la trashumancia regulada y promueve su oportuna declaración para coordinar distancias de pecoreo armónicas.
            </p>
          </div>
          <div>
            <h2 className="font-medium text-foreground mb-2">Operador y gobernanza</h2>
            <p className="text-muted-foreground">
              Trama SpA (RUT 78.500.141-9) opera la infraestructura tecnológica del registro territorial. La tienda de miel se rige por sus propios términos y corresponde a una actividad productiva distinta, con persona jurídica propia. Los principios de gobernanza se detallan en la{' '}
              <Link href="/carta" className="underline underline-offset-4">
                Carta Constitutiva Apícola Territorial
              </Link>
              .
            </p>
          </div>
        </section>

        <p className="mt-12 text-sm text-muted-foreground">
          <Link href="/privacidad" className="underline underline-offset-4">
            Política de privacidad del censo
          </Link>
        </p>
      </article>
      <TerritorioFooter />
    </main>
  );
}
