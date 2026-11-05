import Link from 'next/link';
import { getUrlTienda } from '@/lib/publicUrls';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';
import { getTerritorioCmsContent } from '@/lib/territorio-cms';
import { CONTACTO_INSTITUCIONAL } from '@/lib/contacto-institucional';

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

export default async function TerminosTerritorialesPage() {
  const cms = await getTerritorioCmsContent();

  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground font-sans flex flex-col">
      <TerritorioHeader content={cms.header} />
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
            <h2 className="font-medium text-foreground mb-2">Gobernanza y vinculación productiva</h2>
            <p className="text-muted-foreground">
              Los principios de gobernanza, visibilidad de datos y derechos de los titulares se detallan en la{' '}
              <Link href="/carta" className="underline underline-offset-4">
                Carta Constitutiva Apícola Territorial
              </Link>
              . La tienda de miel se rige por sus propios términos y corresponde a una actividad productiva distinta, con persona jurídica propia. No obstante, conforme a la finalidad declarada en la{' '}
              <Link href="/privacidad" className="underline underline-offset-4">
                Política de datos del censo
              </Link>
              , la administración del registro podrá tomar contacto privado, directo e individual con apicultores inscritos para consultar disponibilidad y proponer adquisiciones directas de miel o productos de la colmena ante necesidades de abastecimiento local, facultad a la que el titular puede oponerse en cualquier momento sin afectar su acceso gratuito al registro.
            </p>
          </div>
          <div>
            <h2 className="font-medium text-foreground mb-2">Derechos del consumidor</h2>
            <p className="text-muted-foreground">
              La contratación de planes de pago se entiende sin perjuicio de los derechos irrenunciables que la Ley N° 19.496 y el Decreto Supremo N° 6/2021 (Reglamento de Comercio Electrónico) reconocen a quienes contratan como destinatarios finales.
            </p>
          </div>
          <div id="operador" className="scroll-mt-24">
            <h2 className="font-medium text-foreground mb-2">Identificación del operador</h2>
            <p className="text-muted-foreground mb-3">
              La infraestructura tecnológica del registro territorial es operada por:
            </p>
            <dl className="rounded-md border border-border/70 bg-surface-sunken/50 px-5 py-4 grid grid-cols-1 sm:grid-cols-[12rem_1fr] gap-x-6 gap-y-2 text-muted-foreground">
              <dt className="text-foreground">Razón social</dt>
              <dd>{CONTACTO_INSTITUCIONAL.razonSocial}</dd>
              <dt className="text-foreground">Tipo de sociedad</dt>
              <dd>{CONTACTO_INSTITUCIONAL.tipoSociedad}</dd>
              <dt className="text-foreground">RUT</dt>
              <dd>{CONTACTO_INSTITUCIONAL.rut}</dd>
              <dt className="text-foreground">Giro y actividad SII</dt>
              <dd>
                {CONTACTO_INSTITUCIONAL.giroSii} (Código SII {CONTACTO_INSTITUCIONAL.codigoActividadSii}) · {CONTACTO_INSTITUCIONAL.glosaDescriptiva}
              </dd>
              <dt className="text-foreground">Inicio de actividades</dt>
              <dd>
                {CONTACTO_INSTITUCIONAL.inicioActividadesSii} · {CONTACTO_INSTITUCIONAL.categoriaTributaria} · {CONTACTO_INSTITUCIONAL.regimenTributario}
              </dd>
              <dt className="text-foreground">Domicilio legal</dt>
              <dd>{CONTACTO_INSTITUCIONAL.domicilioLegal}</dd>
              <dt className="text-foreground">Representante legal</dt>
              <dd>{CONTACTO_INSTITUCIONAL.representante}</dd>
              <dt className="text-foreground">Teléfono de contacto</dt>
              <dd>
                <a href={`tel:+${CONTACTO_INSTITUCIONAL.whatsappE164}`} className="underline underline-offset-4">
                  {CONTACTO_INSTITUCIONAL.whatsappDisplay}
                </a>
              </dd>
              <dt className="text-foreground">Correo de contacto</dt>
              <dd>
                <a href={`mailto:${CONTACTO_INSTITUCIONAL.email}`} className="underline underline-offset-4">
                  {CONTACTO_INSTITUCIONAL.email}
                </a>
              </dd>
            </dl>
          </div>
          <div>
            <h2 className="font-medium text-foreground mb-2">Contacto, reclamos y datos personales</h2>
            <p className="text-muted-foreground">
              Consultas, reclamos y solicitudes de acceso, rectificación, supresión u otros derechos sobre tus datos se reciben en{' '}
              <a href={`mailto:${CONTACTO_INSTITUCIONAL.email}`} className="underline underline-offset-4">
                {CONTACTO_INSTITUCIONAL.email}
              </a>
              . El tratamiento de datos se rige por la{' '}
              <Link href="/privacidad" className="underline underline-offset-4">
                política de datos del censo
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
