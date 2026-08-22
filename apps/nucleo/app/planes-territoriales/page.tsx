import Link from 'next/link';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Planes y Servicios — Registro Territorial Apícola de Chiloé',
  description:
    'El registro comunal es gratis, para siempre. Planes de proveniencia, cuaderno digital y herramientas avanzadas para apicultores de Chiloé.',
  alternates: {
    canonical: 'https://www.registroapicolachiloe.me/planes-territoriales',
  },
  openGraph: {
    title: 'Planes y Servicios · Registro Territorial Apícola de Chiloé',
    description:
      'El censo y la defensa de pecoreo son gratis para siempre. Herramientas avanzadas de proveniencia para apicultores.',
    url: 'https://www.registroapicolachiloe.me/planes-territoriales',
    siteName: 'Registro Apícola de Chiloé',
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planes y Servicios · Registro Territorial Apícola de Chiloé',
    description:
      'El censo y la defensa de pecoreo son gratis para siempre. Herramientas avanzadas de proveniencia para apicultores.',
  },
};

/**
 * Página pública de planes del Registro Territorial (Documento de precios).
 * Copy de marketing: los precios aquí son los del lanzamiento y viven en
 * subscription_plans para el checkout real (/mis-planes, autenticado).
 */
export default function PlanesTerritorialesPage() {
  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground font-sans flex flex-col">
      <TerritorioHeader />

      {/* Hero de la página */}
      <section className="pt-16 pb-16 px-6 sm:px-12 lg:px-24 border-b border-border">
        <div className="max-w-3xl">
          <h1 className="font-existencial text-foreground font-semibold tracking-tight mb-4 text-[clamp(2rem,4.5vw,3.1rem)] leading-[1.12] text-balance">
            El registro es gratis. <span className="text-primary italic font-serif">Para siempre.</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-4 font-light">
            Los planes son para quienes venden miel y quieren venderla mejor.
          </p>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            La Red Territorial —censo, mapa, alertas y declaración SAG— es un bien común de Chiloé.
            Nunca se cobra por defender tu territorio. Solo se cobra por las herramientas que hacen
            crecer tu venta y ordenan tu cumplimiento ante la ley.
          </p>
          <p className="mt-6 text-xs text-muted-foreground">
            Precios finales, en pesos chilenos, sin letra chica. Lo que ves es lo que pagas.
          </p>
        </div>
      </section>

      {/* Default: Red Territorial */}
      <section className="py-16 px-6 sm:px-12 lg:px-24 border-b border-border">
        <div className="max-w-3xl">
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">Red Territorial</h2>
          <p className="text-xl text-foreground mb-2">
            $0 <span className="text-sm font-normal text-muted-foreground">· para siempre</span>
          </p>
          <p className="text-sm text-muted-foreground mb-6">Para todo apicultor de la isla.</p>
          <ul className="space-y-2 mb-8 text-sm text-foreground">
            {[
              'Inscripción en el censo territorial con número correlativo',
              'Tu zona de pecoreo en el mapa (ubicación exacta nunca pública)',
              'Alertas de instalaciones cercanas y avisos fitosanitarios',
              'Declaración SAG pre-llenada cada octubre, lista para firmar',
              'Credencial de apicultor registrado para compartir',
              '1 lote con Pasaporte QR por temporada, de regalo',
            ].map((f) => (
              <li key={f} className="pl-4 border-l border-border">
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/login?mode=signup"
            className="inline-flex min-h-12 items-center justify-center px-6 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-95"
          >
            Inscribirme gratis
          </Link>
          <p className="mt-4 text-xs text-muted-foreground leading-relaxed max-w-lg">
            Si no sabes usar computador, te inscribimos en persona: en la feria, en INDAP o en tu
            propio apiario.
          </p>
        </div>
      </section>

      {/* Ampliaciones: tabla, no trío de cards */}
      <section className="bg-surface-sunken py-16 px-6 sm:px-12 lg:px-24 border-b border-border">
        <div className="max-w-4xl">
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">Si vendes o te fiscalizan</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
            Trazabilidad $29.990 / temporada ($2.990 al mes). Apiario Pro $59.990 / temporada
            ($5.990 al mes). Precios finales, en pesos chilenos.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 pr-4 font-medium text-foreground">Capacidad</th>
                  <th className="py-3 px-3 font-medium text-foreground">Trazabilidad</th>
                  <th className="py-3 px-3 font-medium text-foreground">Apiario Pro</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[
                  ['Todo lo de la Red', 'sí', 'sí'],
                  ['Pasaportes QR ilimitados y página de lote', 'sí', 'sí'],
                  ['Cadena de custodia y QRs para el frasco', 'sí', 'sí'],
                  ['Estadísticas de escaneos y ficha pública (si la activas)', 'sí', 'sí'],
                  ['Cuaderno Res. 4590/2025 e impresión para fiscalización', '—', 'sí'],
                  ['Tratamientos, muestreos y diario por voz', '—', 'sí'],
                ].map(([cap, t, p]) => (
                  <tr key={cap} className="border-b border-border/70">
                    <td className="py-3 pr-4 text-foreground">{cap}</td>
                    <td className="py-3 px-3">{t}</td>
                    <td className="py-3 px-3">{p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/mis-planes"
              className="inline-flex min-h-12 items-center justify-center px-6 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-95"
            >
              Activar Trazabilidad o Pro
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground max-w-lg">
            Trazabilidad: un kilo de miel cada tres meses. Pro: menos que reconstruir un año de
            papeles ante una fiscalización.
          </p>
        </div>
      </section>

      {/* Círculo de Fundadores */}
      <section className="py-16 px-6 sm:px-12 lg:px-24 border-b border-border">
        <div className="max-w-3xl">
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-3">
            Primeros 20 inscritos antes del 31 de octubre
          </h2>
          <p className="text-muted-foreground mb-4">Los que fundan la Red reciben:</p>
          <ul className="space-y-2 mb-6 text-sm text-foreground">
            {[
              'Trazabilidad gratis durante toda la primera temporada (2026–2027)',
              'Pack de etiquetas QR impresas para sus primeros lotes, sin costo',
              'Precio fundador congelado de por vida: $1.990/mes desde la segunda temporada',
              'Número correlativo permanente: Apicultor N° ___ de la Red',
            ].map((f) => (
              <li key={f} className="pl-4 border-l border-border">
                {f}
              </li>
            ))}
          </ul>
          <p className="text-sm text-foreground mb-6">
            Quienes confiaron primero no pagan más por haber confiado.
          </p>
          <Link
            href="/login?mode=signup"
            className="inline-flex min-h-12 items-center justify-center px-6 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-95"
          >
            Quiero ser fundador
          </Link>
        </div>
      </section>

      {/* Cómo se paga */}
      <section className="bg-surface-sunken py-20 px-6 sm:px-12 lg:px-24 border-b border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-3 text-center">
            Cómo se paga (pensado para el campo)
          </h2>
          <p className="text-muted-foreground text-center mb-10">Pagas como te acomode:</p>
          <ul className="space-y-6 max-w-2xl">
            {[
              {
                t: 'Por temporada (recomendado)',
                d: 'Un solo pago al año, idealmente después de la cosecha. Aceptamos transferencia: es el medio más barato y el que todos conocen.',
              },
              {
                t: 'Mes a mes',
                d: 'Cobro automático con tarjeta, sin permanencia. Cancelas cuando quieras y vuelves al plan gratuito sin perder nada de tu registro.',
              },
              {
                t: 'En persona',
                d: 'Si prefieres, coordinamos el pago en la reunión anual de la Red.',
              },
            ].map((o) => (
              <li key={o.t}>
                <h3 className="font-medium text-foreground mb-1 text-sm">{o.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{o.d}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-foreground max-w-2xl">
            Si no renuevas, no pierdes nada: tu censo, tu mapa, tus alertas y tu historia quedan
            intactos en la Red, gratis, para siempre. Solo se pausan las herramientas del plan.
          </p>
        </div>
      </section>

      {/* FAQ de la página de planes */}
      <section className="bg-background py-20 px-6 sm:px-12 lg:px-24 border-b border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-10 text-center">
            Preguntas frecuentes
          </h2>
          <div className="space-y-3">
            {[
              {
                q: '¿Por qué hay planes si la Red es gratuita?',
                a: 'Porque la Red es un bien común y los planes son herramientas de trabajo. Nadie paga por defender su territorio; pagan quienes venden miel y quieren venderla mejor, o quienes necesitan su cuaderno de campo al día. Lo que pagan esos apicultores mantiene gratis la Red para todos los demás.',
              },
              {
                q: '¿Y si soy pequeño y no vendo casi nada?',
                a: 'Entonces el plan gratis es tu plan. Tienes tu lote con Pasaporte de regalo cada temporada, tu lugar en el mapa y todas las alertas. Si algún día vendes más, ahí conversamos.',
              },
              {
                q: '¿El Pasaporte certifica que mi miel es inocua?',
                a: 'No, y somos honestos con eso: el Pasaporte traza y verifica el relato de tu miel (origen, colmenas, cosecha, análisis). La inocuidad la certifica la SEREMI de Salud con tu resolución sanitaria, y el registro productivo lo lleva el SAG. El Pasaporte hace visible ese cumplimiento, no lo reemplaza.',
              },
              {
                q: '¿Quién está detrás de esto?',
                a: 'La Red es de la comunidad apícola de Chiloé. La Obrera y el Zángano —apicultura real de Pureo y Queilén— es su proveedor tecnológico: construyó la herramienta para uso propio y la comparte. Publicamos cada año de dónde viene la plata que la sostiene.',
              },
            ].map(({ q, a }) => (
              <details key={q} className="group border-b border-border py-4">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-sm font-medium text-foreground">
                  {q}
                  <span className="text-primary transition-transform group-open:rotate-45 text-lg leading-none">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Franja final (instituciones) */}
      <section className="bg-surface-raised py-16 px-6 sm:px-12 lg:px-24 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-4">
            ¿Municipalidad, gremio o programa de fomento?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            El Registro Territorial ofrece dashboard comunal, verificación de distancias legales y
            datos agregados de la actividad apícola de tu territorio.
          </p>
          <Link
            href="/municipalidades"
            className="inline-flex min-h-12 items-center justify-center px-8 border border-border bg-background hover:bg-surface-sunken text-foreground rounded-md font-medium"
          >
            Conversemos
          </Link>
        </div>
      </section>

      <TerritorioFooter />
    </main>
  );
}
