import Link from 'next/link';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';
import { getTerritorioCmsContent } from '@/lib/territorio-cms';
import { PrintButton } from '@/components/territorio/PrintButton';
import { COMUNAS_CHILOE } from '@/lib/chiloe-comunas';
import { DIDECO_CHILOE, mailtoDideco } from '@/lib/dideco-chiloe';
import { CONTACTO_INSTITUCIONAL, lineaProveedor } from '@/lib/contacto-institucional';
import { FileSpreadsheet, BookOpen, ShieldCheck, Scale, CheckCircle2, ArrowLeft, Download, Building2, FileText } from 'lucide-react';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Kit Municipal — Piloto 90 días para DIDECO',
  description:
    'Carpeta para DIDECO: piloto de 90 días, borrador de ordenanza, TDR de Compra Ágil (100 UTM, tres cotizaciones) e informe comunal. No sustituye al SIPEC.',
  alternates: {
    canonical: 'https://www.registroapicolachiloe.me/municipalidades/kit',
  },
  openGraph: {
    title: 'Kit Municipal · Piloto 90 días para DIDECO',
    description:
      'Propuesta de piloto, borrador de ordenanza y TDR de Compra Ágil para municipios de Chiloé.',
    url: 'https://www.registroapicolachiloe.me/municipalidades/kit',
    siteName: 'Registro Apícola de Chiloé',
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kit Municipal · Piloto 90 días para DIDECO',
    description:
      'Propuesta de piloto, borrador de ordenanza y TDR de Compra Ágil para municipios de Chiloé.',
  },
};

const PIEZAS = [
  {
    titulo: 'Propuesta Técnica y Económica',
    detalle:
      'Fundamentación jurídica (Ley 18.695) y operativa para la adopción del piloto de 90 días ($2,4 a $3,6 millones + IVA), encuadrado en Compra Ágil bajo 100 UTM con tres cotizaciones.',
    href: '/municipalidades',
    extra: 'Propuesta',
    icono: Building2,
  },
  {
    titulo: 'Borrador de Ordenanza Modelo',
    detalle:
      'Articulado para Jurídica y Concejo. No nombra proveedor. No sustituye al SIPEC. El registro comunal es complementario y el Art. 6 queda abierto a la Ley 19.886.',
    href: '/municipalidades/ordenanza-modelo',
    extra: 'Borrador Legal',
    icono: BookOpen,
  },
  {
    titulo: 'Planilla de Registro Municipal Vacía',
    detalle:
      'CSV/Excel con campos interoperables a mano (RUT, RUP SAG, coordenadas aproximadas, categorías y fechas) para el censo asistido. No hay volcado automático al SIPEC.',
    href: '/assets/kits/registro-municipal-vacio.csv',
    extra: 'Planilla CSV',
    icono: FileSpreadsheet,
    download: true,
  },
  {
    titulo: 'Informe de Situación Comunal en Vivo',
    detalle:
      'Agregados reales por comuna. Si una celda está en cero, es porque no hay declaraciones: no se rellena.',
    href: '/comuna',
    extra: 'Datos Vivos',
    icono: Scale,
  },
  {
    titulo: 'Carta Constitutiva Territorial',
    detalle:
      'Gobernanza comunitaria, soberanía de datos, derechos de los titulares y no invasión de potestades del SAG.',
    href: '/carta',
    extra: 'Instrumento Base',
    icono: ShieldCheck,
  },
  {
    titulo: 'Minuta Ejecutiva para Alcalde y Concejo',
    detalle:
      'Documento sintético de respaldo legal, operativo y presupuestario (100 UTM / Compra Ágil) listo para entregar a Alcaldía, Concejo o DIDECO.',
    href: '/municipalidades/minuta',
    extra: 'Minuta Ejecutiva',
    icono: FileText,
  },
];

const TDR_ITEMS = [
  {
    k: 'Denominación del Servicio',
    v: 'Piloto de 90 días: implementación, configuración, censo asistido e inducción del Registro Municipal de Actividad Apícola.',
  },
  {
    k: 'Proveedor',
    v: `${lineaProveedor()}. Sociedad constituida el ${CONTACTO_INSTITUCIONAL.constituida} en ${CONTACTO_INSTITUCIONAL.comuna} (${CONTACTO_INSTITUCIONAL.domicilioLegal}). Inicio de actividades SII vigente desde el ${CONTACTO_INSTITUCIONAL.inicioActividadesSii} en Primera Categoría (cód. ${CONTACTO_INSTITUCIONAL.codigoActividadSii}: ${CONTACTO_INSTITUCIONAL.giroSii}). Habilitación en ChileProveedores en trámite.`,
  },
  {
    k: 'Mecanismo de Contratación',
    v: 'Compra Ágil en Mercado Público (Ley N° 19.886 y Ley N° 21.634), bajo 100 UTM. No es trato directo. Al menos tres cotizaciones. Primer llamado a Empresa de Menor Tamaño. Proveedor hábil en ChileProveedores al adjudicar.',
  },
  {
    k: 'Unidad Técnica Municipal Responsable',
    v: 'DIDECO (unidad técnica titular). Tramitación interna con Asesoría Jurídica, Adquisiciones / SECPLAC y Medio Ambiente.',
  },
  {
    k: 'Objetivo General',
    v: 'Que la comuna disponga de un panel georreferenciado para coordinar la actividad apícola local, canalizar avisos de plaguicidas y apoyar la mediación, sin sustituir al SAG ni al SIPEC.',
  },
  {
    k: 'Entregables Principales',
    v: '1. Despliegue del módulo comunal. 2. Inducción a funcionarios. 3. Jornada de censo asistido en terreno. 4. Borrador de ordenanza adaptado a la comuna (sin nombrar proveedor). 5. Informe de línea base y exportación CSV para DIDECO/Concejo. 6. Doce meses de alojamiento del módulo.',
  },
  {
    k: 'Lo que no se entrega',
    v: 'Interoperabilidad automática con SIPEC. Motor de carga floral. Validación legal automática de distancias. Inscripción del apicultor ante el SAG a nombre del municipio.',
  },
  {
    k: 'Plazo',
    v: 'Noventa (90) días corridos de piloto. Doce (12) meses de alojamiento del módulo comunal incluidos en el mismo precio.',
  },
  {
    k: 'Valor referencial',
    v: '$2.400.000 a $3.600.000 + IVA según comuna (~33 a 50 UTM; UTM ago-2026 $71.649). Continuidad año 2: desde $1.200.000 + IVA / año, cotizada de nuevo.',
  },
];

export default async function KitMunicipalPage() {
  const cms = await getTerritorioCmsContent();

  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground font-sans flex flex-col">
      <TerritorioHeader content={cms.header} />

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
        <header className="space-y-4 border-b border-border/80 pb-8">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
            <Building2 className="w-4 h-4" />
            <span>Carpeta para DIDECO</span>
          </div>
          <h1 className="font-existencial text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
            Kit del piloto de 90 días
          </h1>
          <p className="text-muted-foreground leading-relaxed text-base">
            Este kit proporciona las herramientas listas para resolver la urgencia normativa de la Ley N° 21.489
            a nivel local. Contiene los términos de referencia (TDR), el borrador legal y el informe de situación,
            armados para que DIDECO inicie el trámite sin fricción técnica.
          </p>
          <div className="flex flex-wrap gap-3 pt-2 print:hidden">
            <Link
              href="/municipalidades#contacto"
              className="inline-flex min-h-11 items-center px-5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-95 transition-opacity shadow-sm"
            >
              Solicitar presentación (30 min)
            </Link>
            <Link
              href="/municipalidades/ordenanza-modelo"
              className="inline-flex min-h-11 items-center px-5 border border-border bg-surface-raised hover:bg-surface-sunken text-foreground rounded-xl text-sm font-medium transition-colors"
            >
              Ver borrador de ordenanza
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-border bg-surface-sunken/60 p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <span>Protocolo de tramitación</span>
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <li>
              <strong className="text-foreground">Reunión con DIDECO (30 min):</strong> panel
              comunal, informe vivo (ceros incluidos) y ficha del piloto. SECPLAC y Adquisiciones
              entran al trámite, no a la primera reunión.
            </li>
            <li>
              <strong className="text-foreground">Revisión Jurídica:</strong> el borrador cita la
              Ley N° 18.695 (competencias) y la Ley N° 21.489 (deberes del apicultor ante el SAG).
              No afirma que la ley apícola obligue al municipio a comprar software.
            </li>
            <li>
              <strong className="text-foreground">Compra Ágil:</strong> publicar TDR en Mercado
              Público. Tres cotizaciones. Primer llamado a EMT. No es trato directo. El proveedor
              debe estar hábil en ChileProveedores al adjudicar.
            </li>
            <li>
              <strong className="text-foreground">Piloto de 90 días:</strong> inducción municipal,
              censo en terreno, ordenanza adaptada e informe de cierre.
            </li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary font-mono">
            Puerta de entrada · DIDECO por comuna
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Contactos publicados por cada municipio. Donde no hay correo en la ficha, no se inventa:
            queda el teléfono. El correo de presentación lo firma Gabriel Cuevas por {lineaProveedor()}.
            La primera puerta son las fichas públicas de Chonchi y Queilén; el resto de la tabla no
            es una campaña masiva.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-border bg-surface-sunken/60 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Comuna</th>
                  <th className="px-4 py-3 font-medium">Titular DIDECO</th>
                  <th className="px-4 py-3 font-medium">Correo / fono</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {DIDECO_CHILOE.map((d) => {
                  const mail = mailtoDideco(d);
                  return (
                    <tr key={d.slug}>
                      <td className="px-4 py-3 font-medium text-foreground">{d.comuna}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {d.titular ?? '—'}
                        <span className="block text-[0.65rem] uppercase tracking-wide">
                          {d.verificado === 'pendiente' ? 'Correo no publicado' : d.cargo}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {mail && d.email ? (
                          <a href={mail} className="text-primary underline underline-offset-4 print:no-underline">
                            {d.email}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">{d.telefono ?? 'Pendiente de ficha'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary font-mono">
            Piezas técnicas y documentales
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

        <section className="space-y-6 pt-6 border-t border-border/80">
          <div className="space-y-2">
            <h2 className="font-existencial text-2xl font-bold text-foreground">
              Términos de Referencia (TDR) para Compra Ágil
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Ficha bajo el estándar de Mercado Público. Compra Ágil no es trato directo:
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

        <section className="space-y-4 pt-6 border-t border-border/80">
          <h2 className="font-existencial text-xl font-bold text-foreground">
            Informe por comuna
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Reporte imprimible con datos en vivo. Cero es cero:
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

        <footer className="pt-8 border-t border-border/80 text-xs text-muted-foreground leading-relaxed space-y-2">
          <p>
            <strong className="text-foreground">Operador:</strong> {lineaProveedor()} ·{' '}
            {CONTACTO_INSTITUCIONAL.domicilioLegal}. Inicio de actividades SII vigente ({CONTACTO_INSTITUCIONAL.inicioActividadesSii}, cód. {CONTACTO_INSTITUCIONAL.codigoActividadSii}); ChileProveedores en trámite.
          </p>
          <p>
            Este kit no constituye asesoría legal vinculante. Complementa las facultades del SAG; no
            las sustituye. La ordenanza modelo no nombra proveedor.
          </p>
        </footer>
      </article>

      <TerritorioFooter />
    </main>
  );
}
