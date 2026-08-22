import Link from 'next/link';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';
import { PrintButton } from '@/components/territorio/PrintButton';
import { COMUNAS_CHILOE } from '@/lib/chiloe-comunas';
import { FileSpreadsheet, BookOpen, ShieldCheck, Scale, CheckCircle2, ArrowLeft, Download, Building2 } from 'lucide-react';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kit Municipal — Registro Territorial Apícola de Chiloé',
  description:
    'Documentación técnica para SECPLAC y Concejos Municipales: propuesta de servicio, borrador de ordenanza apícola, términos de referencia (TDR) Compra Ágil e informe comunal.',
  alternates: {
    canonical: 'https://www.registroapicolachiloe.me/municipalidades/kit',
  },
  openGraph: {
    title: 'Kit Municipal Apícola · Registro Territorial de Chiloé',
    description:
      'Propuesta de servicio, borrador de ordenanza e informe comunal para municipios del archipiélago.',
    url: 'https://www.registroapicolachiloe.me/municipalidades/kit',
    siteName: 'Registro Apícola de Chiloé',
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kit Municipal Apícola · Registro Territorial de Chiloé',
    description:
      'Propuesta de servicio, borrador de ordenanza e informe comunal para municipios del archipiélago.',
  },
};

const PIEZAS = [
  {
    titulo: 'Propuesta Técnica y Económica',
    detalle:
      'Fundamentación jurídica (Ley 18.695), desglose de costos bajo 30 UTM para Compra Ágil directa, vías de financiamiento (FIGEM / SUBDERE / GORE) y matriz de competencias.',
    href: '/municipalidades',
    extra: 'Propuesta',
    icono: Building2,
  },
  {
    titulo: 'Borrador Canónico de Ordenanza Modelo',
    detalle:
      'Articulado estructurado con Vistos, Considerando, Títulos temáticos I al VI y Disposiciones Transitorias, listo para revisión de Asesoría Jurídica y votación del Concejo.',
    href: '/municipalidades/ordenanza-modelo',
    extra: 'Borrador Legal',
    icono: BookOpen,
  },
  {
    titulo: 'Planilla de Registro Municipal Vacía',
    detalle:
      'Estructura CSV/Excel estandarizada con los campos interoperables (RUT, RUP SAG, coordenadas aproximadas, categorías y fechas) para levantamiento asistido en terreno.',
    href: '/assets/kits/registro-municipal-vacio.csv',
    extra: 'Planilla CSV',
    icono: FileSpreadsheet,
    download: true,
  },
  {
    titulo: 'Informe de Situación Comunal en Vivo',
    detalle:
      'Reporte agregado con cifras reales de apicultores, apiarios, floraciones y alertas fitosanitarias por comuna, sin números de muestra.',
    href: '/comuna',
    extra: 'Datos Vivos',
    icono: Scale,
  },
  {
    titulo: 'Carta Constitutiva Territorial',
    detalle:
      'Gobernanza comunitaria, principios de custodia soberana, derechos de los titulares y no invasión de potestades del SAG (v0.3.1).',
    href: '/carta',
    extra: 'Instrumento Base',
    icono: ShieldCheck,
  },
];

const TDR_ITEMS = [
  {
    k: 'Denominación del Servicio',
    v: 'Implementación, configuración e inducción del Registro Municipal de Actividad Apícola y Gestión Preventiva Territorial.',
  },
  {
    k: 'Mecanismo de Contratación',
    v: 'Compra Ágil en Mercado Público (Ley N° 19.886 y Ley N° 21.634), por monto inferior a 30 UTM (~$900.000 a $1.200.000 CLP).',
  },
  {
    k: 'Unidad Técnica Municipal Responsable',
    v: 'Dirección de Fomento Productivo / DIDECO / SECPLAC en coordinación con Medio Ambiente.',
  },
  {
    k: 'Objetivo General',
    v: 'Disponer de un panel comunal georreferenciado para ordenar la actividad apícola, advertir saturaciones de carga floral, coordinar trashumancia y canalizar avisos de plaguicidas bajo la Ley N° 21.489.',
  },
  {
    k: 'Entregables Principales',
    v: '1. Despliegue y configuración del módulo comunal en plataforma cloud. 2. Jornada de inducción técnica a funcionarios municipales. 3. Jornada de censo asistido en terreno con apicultores locales. 4. Propuesta de ordenanza adaptada a la comuna. 5. Soporte continuo y exportaciones oficiales para el SAG y Concejo Municipal.',
  },
  {
    k: 'Plazo de Ejecución y Garantía',
    v: 'Treinta (30) días corridos para la puesta en marcha inicial y doce (12) meses de soporte operativo continuo.',
  },
];

export default function KitMunicipalPage() {
  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground font-sans flex flex-col">
      <TerritorioHeader />

      {/* Barra de navegación rápida */}
      <div className="border-b border-border/80 bg-surface-raised/40 px-6 sm:px-12 py-3 sticky top-14 z-20 backdrop-blur-md print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/municipalidades"
            className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Portal Municipal</span>
          </Link>
          <div className="flex items-center gap-3">
            <PrintButton label="Imprimir Kit Completo / PDF" />
          </div>
        </div>
      </div>

      <article className="flex-1 max-w-4xl mx-auto px-6 sm:px-12 lg:px-16 py-12 sm:py-16 space-y-12">
        {/* Encabezado */}
        <header className="space-y-4 border-b border-border/80 pb-8">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
            <Building2 className="w-4 h-4" />
            <span>Carpeta Técnica Institucional</span>
          </div>
          <h1 className="font-existencial text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
            Kit Municipal para SECPLAC y Concejos
          </h1>
          <p className="text-muted-foreground leading-relaxed text-base">
            Documentación técnica, jurídica y operativa estandarizada para presentar, fundamentar y tramitar la adopción del Registro Apícola Territorial en cualquier municipio de Chiloé.
          </p>
          <div className="flex flex-wrap gap-3 pt-2 print:hidden">
            <Link
              href="/municipalidades#contacto"
              className="inline-flex min-h-11 items-center px-5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-95 transition-opacity shadow-sm"
            >
              Solicitar Presentación Técnica (30 min)
            </Link>
            <Link
              href="/municipalidades/ordenanza-modelo"
              className="inline-flex min-h-11 items-center px-5 border border-border bg-surface-raised hover:bg-surface-sunken text-foreground rounded-xl text-sm font-medium transition-colors"
            >
              Ver Borrador de Ordenanza
            </Link>
          </div>
        </header>

        {/* Protocolo de Uso en Reunión */}
        <section className="rounded-2xl border border-border bg-surface-sunken/60 p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <span>Protocolo de Tramitación en el Municipio</span>
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <li>
              <strong className="text-foreground">Reunión Preliminar con Fomento / SECPLAC:</strong> Presentar la propuesta de servicios (bajo 30 UTM) y el informe comunal vivo con las cifras del censo local.
            </li>
            <li>
              <strong className="text-foreground">Revisión Jurídica:</strong> Derivar el borrador de ordenanza modelo a la Dirección de Asesoría Jurídica con la cita a la Ley N° 21.489 y competencias de la Ley N° 18.695.
            </li>
            <li>
              <strong className="text-foreground">Contratación vía Compra Ágil:</strong> Publicar los Términos de Referencia estandarizados en Mercado Público para adquisición expedita sin licitación.
            </li>
            <li>
              <strong className="text-foreground">Despliegue y Censo Asistido:</strong> Realizar la jornada de inducción municipal y el levantamiento presencial en terreno con los apicultores locales.
            </li>
          </ol>
        </section>

        {/* Piezas del Kit */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary font-mono">
            PIEZAS TÉCNICAS Y DOCUMENTALES:
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {PIEZAS.map((p, i) => {
              const Icon = p.icono;
              return (
                <div key={p.titulo} className="border border-border/80 rounded-xl p-5 bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.65rem] font-mono uppercase bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">
                      Pieza {String(i + 1).padStart(2, '0')} · {p.extra}
                    </span>
                    {p.download && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                        <Download className="w-3.5 h-3.5 text-primary" /> Descarga directa
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <span>{p.titulo}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {p.detalle}
                  </p>
                  <div className="pt-2 print:hidden">
                    {p.download ? (
                      <a
                        href={p.href}
                        download
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary underline underline-offset-4"
                      >
                        Descargar archivo CSV
                      </a>
                    ) : (
                      <Link
                        href={p.href}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary underline underline-offset-4"
                      >
                        Ver documento completo →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Ficha Técnica / Términos de Referencia (TDR) */}
        <section className="space-y-6 pt-6 border-t border-border/80">
          <div className="space-y-2">
            <h2 className="font-existencial text-2xl font-bold text-foreground">
              Términos de Referencia (TDR) para Compra Ágil
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Ficha técnica redactada bajo el estándar de Mercado Público (Ley N° 19.886 y Ley N° 21.634) para facilitar la emisión de la solicitud de cotización o decreto de adjudicación:
            </p>
          </div>

          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <dl className="divide-y divide-border text-xs sm:text-sm">
              {TDR_ITEMS.map((item) => (
                <div key={item.k} className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <dt className="font-semibold text-foreground sm:col-span-1">{item.k}</dt>
                  <dd className="text-muted-foreground leading-relaxed sm:col-span-2">{item.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Selector de Informes Comunales */}
        <section className="space-y-4 pt-6 border-t border-border/80">
          <h2 className="font-existencial text-xl font-bold text-foreground">
            Descargar Informe Específico por Comuna
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Selecciona la comuna de tu interés para generar el reporte imprimible en PDF con datos en vivo:
          </p>
          <div className="flex flex-wrap gap-2">
            {COMUNAS_CHILOE.map((c) => (
              <Link
                key={c.slug}
                href={`/comuna/${c.slug}`}
                className="inline-flex min-h-10 items-center px-4 border border-border bg-surface-raised hover:bg-surface-sunken text-foreground rounded-lg text-xs font-medium transition-colors"
              >
                {c.nombre}
              </Link>
            ))}
          </div>
        </section>

        {/* Pie institucional */}
        <footer className="pt-8 border-t border-border/80 text-xs text-muted-foreground leading-relaxed space-y-2">
          <p>
            <strong className="text-foreground">Proveedor Tecnológico:</strong> La Obrera y el Zángano · Archipiélago de Chiloé · Ecosistema de innovación territorial y regeneración biocultural.
          </p>
          <p>
            Este kit documenta infraestructura que ya opera efectivamente en la provincia de Chiloé. No constituye asesoría legal vinculante y complementa las facultades del Servicio Agrícola y Ganadero.
          </p>
        </footer>
      </article>

      <TerritorioFooter />
    </main>
  );
}
