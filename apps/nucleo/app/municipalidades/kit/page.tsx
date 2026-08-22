import Link from 'next/link';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';
import { PrintButton } from '@/components/territorio/PrintButton';
import { COMUNAS_CHILOE } from '@/lib/chiloe-comunas';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kit Municipal — Registro Territorial Apícola de Chiloé',
  description:
    'Documentación técnica para SECPLAC y Concejos Municipales: propuesta de servicio, borrador de ordenanza apícola e informe comunal con datos reales.',
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
    titulo: 'Propuesta de servicio',
    detalle:
      'Lo que la municipalidad contrata, competencias (Ley 18.695), financiamiento (Compra Ágil < 30 UTM, FIGEM) y marco legal. Imprimible.',
    href: '/municipalidades',
    extra: 'Página viva',
  },
  {
    titulo: 'Borrador de ordenanza modelo',
    detalle:
      'Articulado de trabajo para adaptar a la comuna. No es norma vigente ni ha sido votada. Cita Ley 21.489 y la Carta territorial.',
    href: '/municipalidades/ordenanza-modelo',
    extra: 'Borrador',
  },
  {
    titulo: 'Registro municipal vacío',
    detalle:
      'Planilla CSV (Excel la abre) con las columnas que ya usa el sistema. Para partir en papel o cargar después.',
    href: '/assets/kits/registro-municipal-vacio.csv',
    extra: 'CSV',
    download: true,
  },
  {
    titulo: 'Informe comunal',
    detalle:
      'Agregados reales por comuna. Si el censo está vacío, el informe lo dice. No hay números de demostración.',
    href: '/comuna',
    extra: 'Datos vivos',
  },
  {
    titulo: 'Carta territorial',
    detalle: 'Gobernanza, roles, consentimiento y relación con el Estado. Texto constitutivo de la red.',
    href: '/carta',
    extra: 'Documento',
  },
  {
    titulo: 'Mapa público',
    detalle: 'Zonas aproximadas, sin nombres ni GPS exacto. Lo que un funcionario puede mostrar en una mesa.',
    href: '/mapa-chiloe',
    extra: 'Mapa',
  },
];

export default function KitMunicipalPage() {
  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground font-sans flex flex-col">
      <TerritorioHeader />
      <article className="flex-1 px-6 sm:px-12 lg:px-24 py-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Material para la mesa
          </p>
          <h1 className="font-existencial text-[clamp(1.8rem,4vw,2.8rem)] font-semibold tracking-tight mb-4 text-balance">
            Kit municipal
          </h1>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Todo lo que se puede llevar hoy a una reunión con Fomento o el Concejo. Nada de
            sellos que no existen. Nada de estadísticas inventadas.
          </p>
          <div className="flex flex-wrap gap-3 mb-12 print:hidden">
            <PrintButton label="Imprimir esta lista" />
            <Link
              href="/municipalidades#contacto"
              className="inline-flex min-h-11 items-center px-5 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
            >
              Pedir presentación
            </Link>
          </div>

          <section className="mb-12 rounded-xl border border-border bg-surface-sunken/40 px-5 py-5">
            <h2 className="font-medium text-foreground mb-3">Cómo se usa en la reunión</h2>
            <ol className="list-decimal pl-5 space-y-1.5 text-sm text-muted-foreground">
              <li>Imprime la propuesta de servicio (esta misma web, Cmd/P).</li>
              <li>Imprime el informe de la comuna. Si está en cero, el cero es el argumento.</li>
              <li>Deja el borrador de ordenanza para Asesoría Jurídica — está marcado como borrador.</li>
              <li>Deja la planilla vacía si quieren partir en papel.</li>
              <li>Pide 30 minutos de seguimiento. El formulario y el WhatsApp están en la propuesta.</li>
            </ol>
          </section>

          <ol className="space-y-4 mb-14">
            {PIEZAS.map((p, i) => (
              <li key={p.titulo} className="border border-border rounded-xl p-5">
                <p className="text-xs font-mono text-primary mb-1">
                  {String(i + 1).padStart(2, '0')} · {p.extra}
                </p>
                <h2 className="font-medium text-foreground mb-1">{p.titulo}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{p.detalle}</p>
                {'download' in p && p.download ? (
                  <a
                    href={p.href}
                    download
                    className="text-sm underline underline-offset-4"
                  >
                    Descargar
                  </a>
                ) : (
                  <Link href={p.href} className="text-sm underline underline-offset-4">
                    Abrir
                  </Link>
                )}
              </li>
            ))}
          </ol>

          <section className="mb-12">
            <h2 className="font-serif text-xl font-bold mb-3">Informe de una comuna</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Elige la comuna de la reunión. El PDF se genera con Imprimir del navegador.
            </p>
            <ul className="flex flex-wrap gap-2">
              {COMUNAS_CHILOE.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/comuna/${c.slug}`}
                    className="inline-flex min-h-10 items-center px-3 border border-border rounded-lg text-sm hover:bg-surface-sunken"
                  >
                    {c.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Este kit documenta la infraestructura que ya opera (censo, mapa anonimizado, declaración
            de trashumancia, alertas, exportación autenticada). No sustituye al SAG ni a una
            ordenanza que el Concejo todavía no aprueba.
          </p>
        </div>
      </article>
      <TerritorioFooter />
    </main>
  );
}
