import Link from 'next/link';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';
import { PrintButton } from '@/components/territorio/PrintButton';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Borrador de Ordenanza Apícola — Kit Municipal de Chiloé',
  description:
    'Articulado de trabajo para adaptar a una comuna de Chiloé. Regulación comunitaria, protección de pecoreo y coordinación de trashumancia bajo la Ley N° 21.489.',
  alternates: {
    canonical: 'https://www.registroapicolachiloe.me/municipalidades/ordenanza-modelo',
  },
  openGraph: {
    title: 'Ordenanza Apícola Modelo · Registro Territorial de Chiloé',
    description:
      'Articulado modelo para municipios de Chiloé. Protección de pecoreo y regulación comunitaria apícola.',
    url: 'https://www.registroapicolachiloe.me/municipalidades/ordenanza-modelo',
    siteName: 'Registro Apícola de Chiloé',
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ordenanza Apícola Modelo · Registro Territorial de Chiloé',
    description:
      'Articulado modelo para municipios de Chiloé. Protección de pecoreo y regulación comunitaria apícola.',
  },
};

const ARTICULOS: { n: string; t: string; p: string[] }[] = [
  {
    n: '1',
    t: 'Objeto',
    p: [
      'Esta ordenanza tiene por objeto complementar, en el territorio comunal, la Ley N° 21.489 y sus reglamentos, mediante un registro municipal de actividad apícola, la coordinación de la trashumancia declarada y la protección de zonas de pecoreo, sin sustituir las competencias del SAG ni de otros órganos del Estado.',
    ],
  },
  {
    n: '2',
    t: 'Definiciones',
    p: [
      'Apicultor o apicultora: quien realiza la actividad apícola, con independencia de la superficie del predio. La ley no exige un mínimo de hectáreas.',
      'Registro Municipal: el conjunto de declaraciones voluntarias o exigidas por esta ordenanza, llevado en soporte digital interoperable, con niveles de acceso público agregado, comunitario y restringido.',
      'Trashumancia declarada: el ingreso temporal de colmenas a la comuna con aviso previo de origen, destino aproximado, carga y antecedente sanitario, cuando corresponda.',
    ],
  },
  {
    n: '3',
    t: 'Registro Municipal de Actividad Apícola',
    p: [
      'La Municipalidad llevará un Registro Municipal de Actividad Apícola. Podrá encargar la operación técnica a un proveedor de infraestructura digital, mediante convenio escrito que fije finalidad, campos, responsables, plazos, auditoría y término.',
      'El registro no reemplaza la inscripción ni la declaración de existencia ante el SAG (SIPEC / Dto. 20). Sirve para coordinar el territorio y apoyar el cumplimiento.',
    ],
  },
  {
    n: '4',
    t: 'Datos y privacidad',
    p: [
      'Las coordenadas exactas, RUT, RUP y datos de contacto no se publican. El mapa de consulta general muestra zonas aproximadas de pecoreo, de un orden de un kilómetro.',
      'El tratamiento se rige por la Ley 21.719. La persona titular puede corregir o pedir el retiro de sus datos conforme a la política publicada y al convenio.',
    ],
  },
  {
    n: '5',
    t: 'Trashumancia',
    p: [
      'Quien ingrese colmenas a la comuna deberá declarar el movimiento en el Registro Municipal con la anticipación que fije el reglamento interno, además de cumplir las obligaciones sanitarias y de distanciamiento que correspondan ante el SAG (Dto. 21/2024).',
      'La plataforma podrá calcular distancias aproximadas como apoyo. Esa medición no constituye fiscalización ni resolución de la autoridad.',
    ],
  },
  {
    n: '6',
    t: 'Alertas y coordinación',
    p: [
      'Se promoverá el aviso temprano de aplicaciones fitosanitarias que puedan afectar zonas de pecoreo, y la mediación antes que la sanción, sin perjuicio de las potestades legales de la Municipalidad y del SAG.',
    ],
  },
  {
    n: '7',
    t: 'Instrumento técnico',
    p: [
      'Mientras el Concejo no disponga otro, se reconoce como instrumento técnico de este registro el sistema del Registro Territorial Apícola de Chiloé, operado por La Obrera y el Zángano en su calidad de proveedor tecnológico de la red, sujeto a convenio.',
    ],
  },
  {
    n: '8',
    t: 'Vigencia',
    p: [
      'La presente ordenanza entrará en vigencia una vez publicada conforme a la Ley Orgánica Constitucional de Municipalidades. El alcalde o alcaldesa dictará las instrucciones internas de operación en el plazo que fije el Concejo.',
    ],
  },
];

export default function OrdenanzaModeloPage() {
  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground font-sans flex flex-col">
      <TerritorioHeader />
      <article className="flex-1 px-6 sm:px-12 lg:px-24 py-16">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-primary mb-3">
            Borrador de trabajo · no es norma vigente
          </p>
          <h1 className="font-existencial text-[clamp(1.7rem,4vw,2.6rem)] font-semibold tracking-tight mb-4 text-balance">
            Ordenanza municipal de actividad apícola
          </h1>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Texto para adaptar a cada comuna. No ha sido votado. No es la ordenanza de Panguipulli,
            Alhué ni Colina: esas existen como precedente de registros municipales en papel; este
            articulado traduce esa idea a un registro digital ya construido.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Fuentes: Ley N° 21.489 · Dto. 20 y 21/2024 · Res. SAG 8.196/2015 y 4.590/2025 · Ley
            21.719 · Carta Territorial de la red.
          </p>
          <div className="flex flex-wrap gap-3 mb-12 print:hidden">
            <PrintButton label="Imprimir borrador / PDF" />
            <Link
              href="/municipalidades/kit"
              className="inline-flex min-h-11 items-center px-5 border border-border rounded-xl text-sm font-medium hover:bg-surface-sunken"
            >
              Volver al kit
            </Link>
          </div>

          <ol className="space-y-8">
            {ARTICULOS.map((a) => (
              <li key={a.n}>
                <h2 className="font-serif text-lg font-bold mb-2">
                  Artículo {a.n}. {a.t}
                </h2>
                {a.p.map((par) => (
                  <p key={par.slice(0, 40)} className="text-sm text-muted-foreground leading-relaxed mb-2">
                    {par}
                  </p>
                ))}
              </li>
            ))}
          </ol>

          <p className="mt-12 text-xs text-muted-foreground leading-relaxed">
            Este documento no es asesoría jurídica. Debe ser revisado por la Dirección de Asesoría
            Jurídica de la municipalidad antes de cualquier votación.
          </p>
          <p className="mt-4 text-sm print:hidden">
            <Link href="/carta" className="underline underline-offset-4">
              Carta territorial
            </Link>
            {' · '}
            <a
              href="https://www.bcn.cl/leychile/navegar?idNorma=1182623"
              className="underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ley 21.489 en BCN
            </a>
          </p>
        </div>
      </article>
      <TerritorioFooter />
    </main>
  );
}
