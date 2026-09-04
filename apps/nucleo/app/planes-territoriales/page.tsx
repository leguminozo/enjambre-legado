import Link from 'next/link';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Planes y Servicios — Registro Territorial Apícola de Chiloé',
  description:
    'El registro comunal es gratuito y permanente. Planes de trazabilidad, cuaderno digital y herramientas avanzadas para apicultores de Chiloé.',
  alternates: {
    canonical: 'https://www.registroapicolachiloe.me/planes-territoriales',
  },
  openGraph: {
    title: 'Planes y Servicios · Registro Territorial Apícola de Chiloé',
    description:
      'El censo y la defensa de pecoreo son gratuitos y permanentes. Herramientas avanzadas de trazabilidad para apicultores.',
    url: 'https://www.registroapicolachiloe.me/planes-territoriales',
    siteName: 'Registro Apícola de Chiloé',
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planes y Servicios · Registro Territorial Apícola de Chiloé',
    description:
      'El censo y la defensa de pecoreo son gratuitos y permanentes. Herramientas avanzadas de trazabilidad para apicultores.',
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
            El registro es gratuito. <span className="text-primary italic font-serif">Para siempre.</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-4 font-light">
            Los planes son para quienes venden miel y quieren venderla mejor.
          </p>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            La Red Territorial —censo, mapa, alertas y declaración SAG— es un bien común de Chiloé.
            El acceso territorial nunca se cobra. Solo se cobran las herramientas que amplían la
            capacidad de venta y facilitan el cumplimiento normativo.
          </p>
          <p className="mt-6 text-xs text-muted-foreground">
            Precios finales, en pesos chilenos, sin cargos ocultos ni condiciones adicionales.
          </p>
        </div>
      </section>

      {/* Default: Red Territorial */}
      <section className="py-16 px-6 sm:px-12 lg:px-24 border-b border-border">
        <div className="max-w-3xl">
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">Red Territorial</h2>
          <p className="text-xl text-foreground mb-2">
            $0 <span className="text-sm font-normal text-muted-foreground">· permanente</span>
          </p>
          <p className="text-sm text-muted-foreground mb-6">Para todo apicultor de la isla.</p>
          <ul className="space-y-2 mb-8 text-sm text-foreground">
            {[
              'Inscripción en el censo territorial con número correlativo',
              'Tu zona de pecoreo en el mapa (coordenadas exactas nunca son públicas)',
              'Alertas de instalaciones cercanas y avisos fitosanitarios',
              'Declaración SAG pre-llenada cada octubre, lista para firmar',
              'Credencial de apicultor registrado para compartir',
              '1 lote con Pasaporte QR por temporada, incluido sin costo adicional',
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
            Inscribirse sin costo
          </Link>
          <p className="mt-4 text-xs text-muted-foreground leading-relaxed max-w-lg">
            Si no tienes acceso a un computador, ofrecemos asistencia presencial en ferias, en INDAP
            o directamente en tu apiario.
          </p>
        </div>
      </section>

      {/* Ampliaciones: tabla */}
      <section className="bg-surface-sunken py-16 px-6 sm:px-12 lg:px-24 border-b border-border">
        <div className="max-w-4xl">
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">Para quienes venden o deben rendir ante la autoridad</h2>
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
                  ['Todo lo incluido en la Red', 'sí', 'sí'],
                  ['Pasaportes QR ilimitados y página de lote', 'sí', 'sí'],
                  ['Cadena de custodia y QRs para el frasco', 'sí', 'sí'],
                  ['Estadísticas de escaneos y ficha pública (activable)', 'sí', 'sí'],
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
            Trazabilidad: el equivalente a un kilo de miel cada tres meses. Pro: menos que
            reconstruir un año de documentación ante una fiscalización.
          </p>
        </div>
      </section>

      {/* Círculo de Fundadores */}
      <section className="py-16 px-6 sm:px-12 lg:px-24 border-b border-border">
        <div className="max-w-3xl">
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-3">
            Primeros 20 inscritos antes del 31 de octubre de 2026
          </h2>
          <p className="text-muted-foreground mb-4">Los apicultores fundadores de la Red reciben:</p>
          <ul className="space-y-2 mb-6 text-sm text-foreground">
            {[
              'Trazabilidad incluida sin cargo durante toda la primera temporada (2026–2027)',
              'Pack de etiquetas QR impresas para sus primeros lotes, sin costo adicional',
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
            Incorporarme como fundador
          </Link>
        </div>
      </section>

      {/* Modalidades de pago */}
      <section className="bg-surface-sunken py-20 px-6 sm:px-12 lg:px-24 border-b border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-3 text-center">
            Modalidades de pago
          </h2>
          <p className="text-muted-foreground text-center mb-10">Elige la modalidad que mejor se adapte a tu ciclo productivo:</p>
          <ul className="space-y-6 max-w-2xl">
            {[
              {
                t: 'Por temporada (recomendado)',
                d: 'Un único pago anual, programado después de la temporada de recolección. Se paga por transferencia bancaria.',
              },
              {
                t: 'Mes a mes',
                d: 'Cobro automático mensual con tarjeta, sin permanencia mínima. Al cancelar vuelves al plan gratuito y tus datos del registro permanecen.',
              },
              {
                t: 'Presencial',
                d: 'Pago en la reunión anual de la Red, coordinado previamente con el equipo.',
              },
            ].map((o) => (
              <li key={o.t}>
                <h3 className="font-medium text-foreground mb-1 text-sm">{o.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{o.d}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-foreground max-w-2xl">
            Si no renuevas, no pierdes ningún dato: tu censo, tu mapa, tus alertas y tu historial
            permanecen en la Red de forma gratuita. Solo se pausan las herramientas del plan.
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
                a: 'Porque la Red es un bien común y los planes son herramientas de trabajo. Nadie paga por defender su territorio; pagan quienes venden miel y necesitan hacerlo mejor, o quienes requieren su cuaderno de campo al día. Lo que aportan esos apicultores sostiene el acceso gratuito de toda la Red.',
              },
              {
                q: '¿Y si produzco poco y no tengo ventas formales?',
                a: 'El plan gratuito está diseñado para ti. Tienes tu lugar en el mapa, un Pasaporte QR de cortesía por temporada y todas las alertas. Si en algún momento tu actividad crece, podrás explorar los planes pagos sin presión.',
              },
              {
                q: '¿El Pasaporte certifica que mi miel es inocua?',
                a: 'No, y somos explícitos al respecto: el Pasaporte traza y verifica el relato de tu miel (origen, colmenas, recolección, análisis). La inocuidad la certifica la SEREMI de Salud con tu resolución sanitaria, y el registro productivo lo lleva el SAG. El Pasaporte hace visible ese cumplimiento, no lo reemplaza.',
              },
              {
                q: '¿Quién está detrás de esto?',
                a: 'La Red pertenece a la comunidad apícola de Chiloé. Trama SpA (RUT 78.500.141-9) es el operador técnico: construyó la herramienta desde una apicultura real de Pureo y Queilén y la pone a disposición de la isla.',
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
            El Registro Territorial ofrece panel comunal, distancias geodésicas con revisión humana
            y datos agregados. No sustituye al SAG ni valida legalmente un emplazamiento.
          </p>
          <Link
            href="/municipalidades"
            className="inline-flex min-h-12 items-center justify-center px-8 border border-border bg-background hover:bg-surface-sunken text-foreground rounded-md font-medium"
          >
            Ver propuesta institucional
          </Link>
        </div>
      </section>

      <TerritorioFooter />
    </main>
  );
}
