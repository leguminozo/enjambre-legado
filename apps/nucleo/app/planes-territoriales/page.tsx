import Link from 'next/link';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';

export const metadata = {
  title: 'Planes — Registro Territorial Apícola de Chiloé | Red gratis, Trazabilidad y Apiario Pro',
  description:
    'El registro es gratis, para siempre. Los planes —Trazabilidad y Apiario Pro— son para quienes venden miel y quieren venderla mejor. Precios finales en pesos chilenos, sin letra chica.',
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
      <section className="pt-16 pb-20 px-6 sm:px-12 lg:px-24 text-center border-b border-border">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-existencial text-foreground font-bold tracking-tight mb-4 text-[clamp(2.2rem,5vw,3.5rem)] leading-[1.1] text-balance">
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

      {/* Las tres tarjetas de planes */}
      <section className="bg-surface-sunken py-20 px-6 sm:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Tarjeta 1 — RED (gratis) */}
          <div className="bg-card p-8 rounded-2xl border border-border shadow-sm flex flex-col">
            <h2 className="font-serif text-xl font-bold text-foreground mb-1">Red Territorial</h2>
            <p className="text-2xl font-bold text-foreground mb-1">
              $0 <span className="text-sm font-normal text-muted-foreground">· para siempre</span>
            </p>
            <p className="text-sm text-muted-foreground mb-6">Para todo apicultor de la isla.</p>
            <ul className="space-y-2.5 mb-8 flex-1 text-sm text-foreground">
              {[
                'Inscripción en el censo territorial con número correlativo',
                'Tu zona de pecoreo en el mapa (ubicación exacta nunca pública)',
                'Alertas de instalaciones cercanas y avisos fitosanitarios',
                'Declaración SAG pre-llenada cada octubre, lista para firmar',
                'Credencial de apicultor registrado para compartir',
                '1 lote con Pasaporte QR por temporada, de regalo',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/login?mode=signup"
              className="w-full min-h-12 inline-flex items-center justify-center gap-2 px-6 border border-border bg-surface-raised hover:bg-surface-sunken text-foreground rounded-xl font-medium transition-colors group"
            >
              Inscribirme gratis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
              Si no sabes usar computador, te inscribimos en persona: en la feria, en INDAP o en tu
              propio apiario.
            </p>
          </div>

          {/* Tarjeta 2 — TRAZABILIDAD (destacada) */}
          <div className="relative bg-card p-8 rounded-2xl border border-primary/40 shadow-md flex flex-col">
            <span className="absolute top-4 right-4 text-[10px] uppercase tracking-wider text-primary font-semibold bg-primary/10 px-2 py-1 rounded-full">
              El favorito de las ferias
            </span>
            <h2 className="font-serif text-xl font-bold text-foreground mb-1">Trazabilidad</h2>
            <p className="text-2xl font-bold text-foreground mb-1">
              $29.990 <span className="text-sm font-normal text-muted-foreground">/ temporada</span>
            </p>
            <p className="text-sm text-muted-foreground mb-6">o $2.990 al mes</p>
            <p className="text-sm text-muted-foreground italic mb-6">
              Para el apicultor que vende su miel y quiere que se venda sola.
            </p>
            <p className="text-sm font-medium text-foreground mb-3">Todo lo de la Red, más:</p>
            <ul className="space-y-2.5 mb-8 flex-1 text-sm text-foreground">
              {[
                'Pasaportes QR ilimitados para todos tus lotes',
                'Página pública de cada lote: origen, colmenas, cosecha y análisis de laboratorio',
                'Cadena de custodia verificable — el pasaporte avisa si algo se alteró',
                'Descarga de QRs listos para imprimir y pegar en el frasco',
                'Estadísticas de escaneos: sabes cuánta gente miró tu miel',
                'Tu ficha pública con botón de contacto directo (si tú lo activas)',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/mis-planes"
              className="w-full min-h-12 inline-flex items-center justify-center gap-2 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-all duration-300 shadow-xl shadow-primary/20 group"
            >
              Activar Trazabilidad
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
              Un kilo de miel cada tres meses. Se paga solo con el primer cliente que escanea el QR
              y confía.
            </p>
          </div>

          {/* Tarjeta 3 — APIARIO PRO */}
          <div className="bg-card p-8 rounded-2xl border border-border shadow-sm flex flex-col">
            <h2 className="font-serif text-xl font-bold text-foreground mb-1">Apiario Pro</h2>
            <p className="text-2xl font-bold text-foreground mb-1">
              $59.990 <span className="text-sm font-normal text-muted-foreground">/ temporada</span>
            </p>
            <p className="text-sm text-muted-foreground mb-6">o $5.990 al mes</p>
            <p className="text-sm text-muted-foreground italic mb-6">
              Para el apicultor profesional que quiere dormir tranquilo ante el SAG.
            </p>
            <p className="text-sm font-medium text-foreground mb-3">Todo lo de Trazabilidad, más:</p>
            <ul className="space-y-2.5 mb-8 flex-1 text-sm text-foreground">
              {[
                'Cuaderno de Campo digital conforme a la Res. 4590/2025 (obligatorio por ley)',
                'Registro de tratamientos varroa/nosema, muestreos y sanitización por apiario',
                'Exportación imprimible lista para fiscalización',
                'Diario de campo por voz o texto, desde el celular',
                'Respaldo permanente: tu cuaderno no se moja, no se quema, no se pierde',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/mis-planes"
              className="w-full min-h-12 inline-flex items-center justify-center gap-2 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-all duration-300 shadow-xl shadow-primary/20 group"
            >
              Activar Apiario Pro
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
              Seis kilos de miel al año. Menos que lo que cuesta reconstruir un año de papeles ante
              una fiscalización.
            </p>
          </div>
        </div>
      </section>

      {/* Círculo de Fundadores */}
      <section className="bg-background py-20 px-6 sm:px-12 lg:px-24 border-b border-border">
        <div className="max-w-3xl mx-auto bg-surface-raised border border-primary/30 rounded-2xl p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Círculo de Fundadores — primeros 20 inscritos antes del 31 de octubre
            </h2>
          </div>
          <p className="text-muted-foreground mb-4">Los apicultores que funden la Red reciben:</p>
          <ul className="space-y-3 mb-6 text-sm text-foreground">
            {[
              'Trazabilidad gratis durante toda la primera temporada (2026–2027)',
              'Pack de etiquetas QR impresas para sus primeros lotes, sin costo',
              'Precio fundador congelado de por vida: $1.990/mes desde la segunda temporada',
              'Su número correlativo permanente: Apicultor N° ___ de la Red',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <p className="font-serif italic text-foreground mb-6">
            Quienes confiaron primero, nunca pagan más por haber confiado.
          </p>
          <Link
            href="/login?mode=signup"
            className="inline-flex min-h-12 items-center justify-center gap-2 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-all duration-300 shadow-xl shadow-primary/20 group"
          >
            Quiero ser fundador
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                t: 'Por temporada (recomendado)',
                d: 'Un solo pago al año, idealmente después de la cosecha. Aceptamos transferencia — es el medio más barato y el que todos conocen.',
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
              <div key={o.t} className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-bold text-foreground mb-2 text-sm">{o.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{o.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 border-l-4 border-primary bg-surface-raised rounded-r-xl p-5">
            <p className="font-serif italic text-foreground">
              Si no renuevas, no pierdes nada: tu censo, tu mapa, tus alertas y tu historia quedan
              intactos en la Red, gratis, para siempre. Solo se pausan las herramientas del plan.
            </p>
          </div>
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
              <details key={q} className="group bg-surface-raised border border-border rounded-xl px-5 py-4 open:pb-5">
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
            className="inline-flex min-h-12 items-center justify-center gap-2 px-8 border border-primary/40 bg-surface-sunken hover:bg-surface-raised text-foreground rounded-xl font-medium transition-colors group"
          >
            Conversemos
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <TerritorioFooter />
    </main>
  );
}
