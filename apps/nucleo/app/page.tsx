import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import { Lock } from 'lucide-react';
import { CensoStats, type CensoStatsData } from '@/components/censo/CensoStats';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';
import { LandingAnimations } from '@/components/territorio/LandingAnimations';
import { PrivacyVisual } from '@/components/territorio/PrivacyVisual';
import { CensoCountdown } from '@/components/territorio/CensoCountdown';

export const metadata = {
  title: 'Registro Apícola de Chiloé — Mapa y defensa de tu zona de pecoreo',
  description:
    'Inscribe tus apiarios en el registro territorial de Chiloé. Es gratis. El mapa muestra zonas, no tu punto exacto. Te ayudamos si prefieres hacerlo en persona.',
  openGraph: {
    title: 'Tu zona de pecoreo ya tiene defensa. Falta que esté en el mapa.',
    description: 'Registro territorial apícola de Chiloé — gratis, hecho en la isla.',
  },
};

/**
 * Landing pública del Registro Territorial Apícola de Chiloé.
 * Arco: hero → privacidad visual → por qué → cómo → origen → FAQ → cierre.
 */
async function getCensoStats(): Promise<CensoStatsData | null> {
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
    const proto = h.get('x-forwarded-proto') ?? 'http';
    const res = await fetch(`${proto}://${host}/api/censo-publico/stats`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: CensoStatsData };
    return json.data ?? null;
  } catch {
    return null;
  }
}

function formatCierre(cierre: string | null | undefined): string {
  if (!cierre) return '31 de octubre';
  const d = new Date(`${cierre}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '31 de octubre';
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long' }).format(d);
}

export default async function RedApicolaLanding() {
  const stats = await getCensoStats();
  const cierre = formatCierre(stats?.cierre ?? null);
  const mapaVacio =
    !stats || (stats.apiarios_activos === 0 && stats.actores_activos === 0);

  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground font-sans selection:bg-accent selection:text-accent-foreground flex flex-col">
      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>
      <TerritorioHeader />

      <LandingAnimations>
        {/* A. HERO — el mapa es el producto */}
        <section id="hero" className="px-6 sm:px-10 lg:px-16 xl:px-24 pt-12 pb-16 sm:pt-16 sm:pb-20 border-b border-border/60">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Texto y llamado a la acción */}
            <div className="lg:col-span-5 order-1">
              <p className="hero-kicker text-sm text-muted-foreground mb-4 sm:mb-5">
                Censo apícola · Chiloé · 2026–2027
              </p>
              <h1 className="font-existencial font-semibold tracking-tight text-balance text-[clamp(2.1rem,4.5vw,3.4rem)] leading-[1.08] text-foreground mb-5">
                <span className="hero-title-line block">Tu zona de pecoreo</span>
                <span className="hero-title-line block">ya tiene defensa.</span>
                <span className="hero-title-line block mt-2 text-primary italic font-serif font-normal">
                  Falta que esté en el mapa.
                </span>
              </h1>
              <p className="hero-body text-base text-muted-foreground leading-relaxed text-pretty max-w-md mb-8">
                Inscribe tus apiarios. El mapa muestra zonas aproximadas, nunca tu punto exacto.
                El registro básico es gratis. La Red ordena el territorio; no reemplaza al SAG ni a
                la municipalidad.
              </p>
              <div className="hero-cta flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-md">
                <Link
                  href="/login?mode=signup"
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all duration-150 hover:opacity-95 shadow-sm active:scale-[0.99]"
                >
                  Inscribirme gratis
                </Link>
                <Link
                  href="/mapa-chiloe"
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-md border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-surface-raised transition-colors duration-150"
                >
                  Abrir mapa completo
                </Link>
              </div>
              <p className="hero-cta mt-5 text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                  Entrar
                </Link>
              </p>
            </div>

            {/* Mapa interactivo embebido */}
            <div className="hero-map-panel lg:col-span-7 order-2">
              <div className="relative overflow-hidden rounded-lg bg-surface-sunken ring-1 ring-border/50 shadow-md">
                <iframe
                  src="/mapa-chiloe?embed=1"
                  title="Mapa apícola público de Chiloé: zonas aproximadas, sin nombres"
                  loading="lazy"
                  className="w-full h-[min(50vh,460px)] lg:h-[500px] bg-surface-sunken border-0"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                {mapaVacio && (
                  <div className="absolute bottom-0 inset-x-0 p-3 pointer-events-none">
                    <p className="mx-auto max-w-md bg-background/95 backdrop-blur-sm px-3 py-2 text-center text-xs text-muted-foreground ring-1 ring-border/40 rounded-md shadow-sm">
                      El censo recién empieza. Las zonas van a aparecer a medida que la gente se inscriba.
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CensoStats initialStats={stats} variant="strip" />
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
                    Zonas de ~1 km · sin nombres ni contactos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* B. PRIVACIDAD VISUAL — Demostración gráfica de zona vs coordenada */}
        <section id="privacy" className="px-6 sm:px-10 lg:px-16 xl:px-24 py-16 sm:py-20 border-b border-border/60">
          <div className="max-w-5xl mx-auto">
            <div className="max-w-2xl mb-10 sm:mb-12">
              <span className="section-reveal block text-xs font-mono tracking-widest text-primary uppercase mb-2">
                Privacidad y soberanía de datos
              </span>
              <h2 className="section-reveal text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3 font-existencial">
                Tu ubicación exacta no se publica.
              </h2>
              <p className="section-reveal text-muted-foreground leading-relaxed text-base sm:text-lg">
                El mapa público muestra zonas aproximadas de pecoreo, sin RUT, nombres ni contactos.
                Tus coordenadas exactas y tus registros de manejo permanecen privados.{' '}
                <Link href="/mapa-chiloe" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                  Ver mapa público
                </Link>
                .
              </p>
            </div>

            <div className="section-reveal">
              <PrivacyVisual />
            </div>
          </div>
        </section>

        {/* C. POR QUÉ */}
        <section id="why" className="bg-surface-sunken px-6 sm:px-10 lg:px-16 xl:px-24 py-20 sm:py-28">
          <div className="max-w-5xl mx-auto">
            <div className="max-w-xl mb-12 sm:mb-16">
              <span className="section-reveal block text-xs font-mono tracking-widest text-primary uppercase mb-2">
                Beneficios del censo
              </span>
              <h2 className="section-reveal text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground font-existencial">
                Para qué sirve estar en el mapa
              </h2>
            </div>

            <ul className="divide-y divide-border/70">
              {[
                {
                  n: '01',
                  title: 'Defender tu zona de pecoreo',
                  body: 'Si alguien se instala cerca sin avisar, puedes enterarte a tiempo. La ley fija distancias; el mapa ayuda a hacerlas valer.',
                },
                {
                  n: '02',
                  title: 'Sin regalar tu ubicación',
                  body: 'En público solo se ve un área aproximada. El punto exacto lo ves tú. Tú eliges qué compartir.',
                },
                {
                  n: '03',
                  title: 'Que tu miel pueda contarse',
                  body: 'En la época de recolección, el pasaporte QR conecta el frasco con el territorio. Sin promesas vacías.',
                },
              ].map((item) => (
                <li
                  key={item.n}
                  className="why-item grid grid-cols-1 sm:grid-cols-[4rem_1fr] gap-3 sm:gap-10 py-8 sm:py-10 first:pt-0 last:pb-0"
                >
                  <span className="font-mono text-xs tracking-widest text-primary/80 pt-1 font-semibold">
                    {item.n}
                  </span>
                  <div className="min-w-0 max-w-2xl">
                    <h3 className="text-lg sm:text-xl font-medium text-foreground mb-2 tracking-tight font-existencial">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-[0.95rem] sm:text-base">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* D. CÓMO */}
        <section id="how" className="px-6 sm:px-10 lg:px-16 xl:px-24 py-20 sm:py-28 border-t border-border/60">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12 sm:mb-16 max-w-xl">
              <span className="section-reveal block text-xs font-mono tracking-widest text-primary uppercase mb-2">
                Paso a paso
              </span>
              <h2 className="section-reveal text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground mb-3 font-existencial">
                Cómo se hace
              </h2>
              <p className="section-reveal text-muted-foreground text-base sm:text-lg leading-relaxed">
                Tres pasos simples. Si no te llevas bien con el computador, te ayudamos en persona.
              </p>
            </div>

            <ol className="divide-y divide-border/70 max-w-2xl">
              {[
                {
                  step: '1',
                  title: 'Creas tu cuenta',
                  body: 'Cinco minutos, gratis. O te inscribimos en una reunión comunitaria, en INDAP, en la feria o en tu apiario.',
                },
                {
                  step: '2',
                  title: 'Declaras tus apiarios',
                  body: 'Tu zona queda en el mapa de la red. Lo exacto se queda contigo.',
                },
                {
                  step: '3',
                  title: 'Usas lo que necesites',
                  body: 'Alertas sanitarias, apoyo para armar tu declaración de octubre ante el SAG, y el pasaporte digital cuando vendas. El registro ante el SAG lo haces tú.',
                },
              ].map((s) => (
                <li key={s.step} className="how-step grid grid-cols-[2.5rem_1fr] gap-4 py-7 first:pt-0">
                  <span className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono flex items-center justify-center font-semibold shrink-0 mt-0.5">
                    {s.step}
                  </span>
                  <div>
                    <h3 className="text-lg font-medium text-foreground tracking-tight mb-1 font-existencial">
                      {s.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {s.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* E. ORIGEN — Fotografía real del bosque y apicultura */}
        <section id="origin" className="bg-surface-sunken px-6 sm:px-10 lg:px-16 xl:px-24 py-20 sm:py-28">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="section-reveal lg:col-span-5 relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] rounded-lg overflow-hidden ring-1 ring-border/50 shadow-md">
              <Image
                src="/assets/auth-bg.png"
                alt="Bosque nativo con musgo y helechos, ilustración de zona de pecoreo"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent flex items-end p-6 sm:p-8">
                <p className="font-existencial text-2xl sm:text-3xl italic text-foreground leading-snug max-w-[16ch] drop-shadow-sm">
                  Bosque nativo de Chiloé.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 max-w-xl">
              <span className="section-reveal block text-xs font-mono tracking-widest text-primary uppercase mb-2">
                Identidad territorial
              </span>
              <h2 className="section-reveal font-existencial text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-5">
                Hecho en Chiloé
              </h2>
              <p className="section-reveal text-muted-foreground leading-relaxed text-base sm:text-lg mb-5">
                Nació en una apicultura real de la isla: La Obrera y el Zángano, más de veinte años
                con bosque nativo. La misma herramienta con la que ordenamos nuestros apiarios es la
                que abrimos a toda la isla.
              </p>
              <p className="section-reveal text-foreground font-medium leading-relaxed">
                El registro básico es y va a seguir siendo gratis. Es un bien común para defender el
                territorio apícola.
              </p>
            </div>
          </div>
        </section>

        {/* E2. PUERTA INSTITUCIONAL — chica, no convierte la home en brochure */}
        <section
          id="institucional"
          className="px-6 sm:px-10 lg:px-16 xl:px-24 py-10 sm:py-12 border-t border-border/60"
        >
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-md border border-border/70 bg-surface-sunken/50 px-5 py-5">
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              ¿Trabajas en una municipalidad, INDAP, SAG o institución pública? El modelo
              territorial es otra página. Esta home es para quien tiene colmenas.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Link
                href="/municipalidades"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground hover:bg-background transition-colors"
              >
                Ver propuesta para instituciones
              </Link>
              <Link
                href="/municipalidades/kit"
                className="inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Kit para la mesa
              </Link>
            </div>
          </div>
        </section>

        {/* F. FAQ */}
        <section id="faq" className="px-6 sm:px-10 lg:px-16 xl:px-24 py-20 sm:py-28 border-t border-border/60">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <span className="section-reveal block text-xs font-mono tracking-widest text-primary uppercase mb-2">
                Resolución de dudas
              </span>
              <h2 className="section-reveal text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground font-existencial">
                Preguntas frecuentes
              </h2>
            </div>

            <div className="space-y-3">
              {[
                {
                  q: '¿De verdad es gratis?',
                  a: 'Sí. El censo, el mapa, las alertas y el apoyo para la declaración SAG son gratis. Las herramientas extras (pasaportes ilimitados, cuaderno digital) se publican en la página de planes, si las quieres.',
                },
                {
                  q: '¿Esto reemplaza al SAG o al SIPEC?',
                  a: 'No. No te hace automáticamente legal. El Registro Territorial no sustituye al SAG ni al SIPEC Apícola. Ayuda a ordenar tu información para las obligaciones que ya tienes ante la autoridad.',
                },
                {
                  q: '¿Hace falta un predio de tantas hectáreas?',
                  a: 'No. La Ley N° 21.489 reconoce al apicultor por la actividad y el registro SAG, no por hectáreas. Trashumantes y predios chicos entran igual.',
                },
                {
                  q: '¿Quién ve mis apiarios?',
                  a: 'En el mapa público hay zonas de más o menos un kilómetro, sin nombres ni teléfonos. Solo tú ves tus coordenadas. Eso no es anonimato jurídico absoluto: es un mapa anonimizado.',
                },
                {
                  q: 'No me llevo bien con el computador',
                  a: 'Te inscribimos en persona: reunión comunitaria, INDAP, feria o tu apiario. Crea la cuenta y lo completamos juntos.',
                },
                {
                  q: '¿Y si soy trashumante?',
                  a: 'Bienvenido. La red no persigue la trashumancia: necesita que se declare y se coordinen distancias. Quien no avisa es el problema, no el que llega.',
                },
              ].map(({ q, a }) => (
                <details
                  key={q}
                  className="section-reveal faq-item group rounded-md border border-border/60 bg-surface-sunken/40 px-5 py-4 transition-colors hover:border-border"
                >
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-[0.95rem] font-medium text-foreground rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span>{q}</span>
                    <span
                      className="text-muted-foreground text-xl leading-none transition-transform duration-200 group-open:rotate-45 shrink-0"
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 pr-6 text-sm text-muted-foreground leading-relaxed">
                    {a}
                  </p>
                </details>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              <Link href="/planes-territoriales" className="underline underline-offset-4 hover:text-foreground">
                Ver planes de pago
              </Link>
              {' · '}
              <Link href="/carta" className="underline underline-offset-4 hover:text-foreground">
                Carta territorial
              </Link>
            </p>
          </div>
        </section>

        {/* G. CIERRE */}
        <section id="close" className="bg-surface-sunken px-6 sm:px-10 lg:px-20 py-20 sm:py-28 text-center border-t border-border/60">
          <div className="max-w-xl mx-auto">
            <span className="section-reveal block text-xs font-mono tracking-widest text-primary uppercase mb-2">
              Inscripción abierta
            </span>
            <h2 className="section-reveal font-existencial text-3xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance mb-4">
              El censo cierra el {cierre}
            </h2>
            <p className="section-reveal text-muted-foreground leading-relaxed mb-6 text-base sm:text-lg">
              Tu zona de pecoreo empieza a existir en el mapa cuando la inscribes. Si quieres, te
              ayudamos a hacerlo en persona.
            </p>
            <div className="section-reveal">
              <CensoCountdown targetDate={stats?.cierre} />
            </div>
            <div className="section-reveal flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/login?mode=signup"
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground hover:opacity-95 transition-opacity shadow-sm active:scale-[0.99]"
              >
                Inscribirme gratis
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-border px-8 py-3.5 text-sm font-medium text-foreground hover:bg-background transition-colors"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>
      </LandingAnimations>

      <TerritorioFooter />
    </main>
  );
}
