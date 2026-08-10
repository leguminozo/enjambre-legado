import Link from 'next/link';
import { headers } from 'next/headers';
import { ArrowRight, Map, Lock } from 'lucide-react';
import { CensoStats, type CensoStatsData } from '@/components/censo/CensoStats';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';

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
 * Arco: hero → mapa → por qué → cómo → origen → FAQ → cierre.
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
      <TerritorioHeader />

      {/* A. HERO */}
      <section className="relative flex min-h-[min(88dvh,820px)] flex-col items-center justify-center px-6 sm:px-10 lg:px-20 pt-16 pb-20 sm:pt-20 sm:pb-28 text-center overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'radial-gradient(circle at center, currentColor 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-primary/[0.07] rounded-full blur-[100px]" />

        <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center">
          <p className="text-[0.7rem] sm:text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-8 sm:mb-10">
            Censo apícola · Chiloé · 2026–2027
          </p>

          <h1 className="font-existencial font-semibold tracking-tight text-balance text-[clamp(2.35rem,6vw,4.5rem)] leading-[1.06] text-foreground mb-6 sm:mb-8">
            Tu zona de pecoreo ya tiene defensa.
            <span className="block mt-2 sm:mt-3 text-primary italic font-serif font-normal">
              Falta que esté en el mapa.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground font-light leading-relaxed text-pretty max-w-xl mb-10 sm:mb-12">
            Inscribe tus apiarios. El mapa muestra zonas aproximadas — nunca tu punto exacto.
            El registro básico es gratis.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full max-w-md">
            <Link
              href="/login?mode=signup"
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/15 transition-opacity hover:opacity-95 active:scale-[0.99] group"
            >
              Inscribirme
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/mapa-chiloe"
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-transparent px-7 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-raised"
            >
              <Map className="w-4 h-4 shrink-0 opacity-70" />
              Ver el mapa
            </Link>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link
              href="/login"
              className="text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors"
            >
              Entrar
            </Link>
          </p>
        </div>
      </section>

      {/* B. MAPA */}
      <section className="px-6 sm:px-10 lg:px-16 xl:px-24 py-24 sm:py-32 border-t border-border/60">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground text-balance mb-4">
              El mapa de la isla
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg font-light leading-relaxed">
              Todos ven las zonas. Nadie ve tu nombre ni tu GPS exacto.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-surface-sunken ring-1 ring-border/50 shadow-xl shadow-black/[0.04]">
            <iframe
              src="/mapa-chiloe?embed=1"
              title="Mapa apícola público de Chiloé"
              className="w-full h-[min(56vh,520px)] sm:h-[560px] bg-surface-sunken"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {mapaVacio && (
              <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 pointer-events-none">
                <p className="mx-auto max-w-md rounded-full bg-background/90 backdrop-blur-md px-4 py-2.5 text-center text-xs sm:text-sm text-muted-foreground shadow-sm ring-1 ring-border/40">
                  El censo recién empieza. Las zonas van a aparecer a medida que la gente se inscriba.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="min-w-0">
              <CensoStats initialStats={stats} variant="strip" />
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
                Zonas de ~1 km · sin nombres ni contactos
              </p>
            </div>
            <Link
              href="/mapa-chiloe"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Abrir mapa completo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* C. POR QUÉ */}
      <section className="bg-surface-sunken px-6 sm:px-10 lg:px-16 xl:px-24 py-24 sm:py-32">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-14 sm:mb-20 max-w-lg text-balance">
            Para qué sirve estar en el mapa
          </h2>

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
                body: 'Cuando toque la cosecha, el pasaporte QR conecta el frasco con el territorio. Sin promesas vacías.',
              },
            ].map((item) => (
              <li
                key={item.n}
                className="grid grid-cols-1 sm:grid-cols-[4rem_1fr] gap-3 sm:gap-10 py-10 sm:py-12 first:pt-0 last:pb-0"
              >
                <span className="font-mono text-xs tracking-widest text-muted-foreground/80 pt-1">
                  {item.n}
                </span>
                <div className="min-w-0 max-w-2xl">
                  <h3 className="text-lg sm:text-xl font-medium text-foreground mb-2.5 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground font-light leading-relaxed text-[0.95rem] sm:text-base">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* D. CÓMO */}
      <section className="px-6 sm:px-10 lg:px-16 xl:px-24 py-24 sm:py-32 border-t border-border/60">
        <div className="max-w-5xl mx-auto">
          <div className="mb-14 sm:mb-20 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-4">
              Cómo se hace
            </h2>
            <p className="text-muted-foreground font-light text-base sm:text-lg leading-relaxed">
              Tres pasos. Si no te llevas bien con el computador, te ayudamos en persona.
            </p>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10">
            {[
              {
                step: '1',
                title: 'Creas tu cuenta',
                body: 'Cinco minutos, gratis. O te inscribimos en una reunión, en la feria o en el apiario.',
              },
              {
                step: '2',
                title: 'Declaras tus apiarios',
                body: 'Tu zona queda en el mapa de la red. Lo exacto se queda contigo.',
              },
              {
                step: '3',
                title: 'Usas lo que necesites',
                body: 'Alertas, apoyo para la declaración SAG de octubre, y el pasaporte cuando vendas.',
              },
            ].map((s) => (
              <li key={s.step} className="relative">
                <span className="font-existencial text-5xl sm:text-6xl font-light text-primary/20 leading-none select-none">
                  {s.step}
                </span>
                <h3 className="mt-4 text-lg font-medium text-foreground tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm sm:text-[0.95rem] text-muted-foreground font-light leading-relaxed max-w-xs">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* E. ORIGEN */}
      <section className="bg-surface-sunken px-6 sm:px-10 lg:px-16 xl:px-24 py-24 sm:py-32">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div
            className="lg:col-span-5 aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/20 via-surface-raised to-accent/10 ring-1 ring-border/40 flex items-end p-8 sm:p-10"
            aria-hidden
          >
            <p className="font-existencial text-2xl sm:text-3xl italic text-foreground/90 leading-snug max-w-[14ch]">
              Bosque nativo entre Pureo, Quemchi y Queilén.
            </p>
          </div>

          <div className="lg:col-span-7 max-w-xl">
            <h2 className="font-existencial text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-6">
              Hecho en Chiloé
            </h2>
            <p className="text-muted-foreground font-light leading-relaxed text-base sm:text-lg mb-6">
              Nació en una apicultura real de la isla: La Obrera y el Zángano, más de veinte años
              con bosque nativo. La misma herramienta con la que ordenamos nuestros apiarios es la
              que abrimos a toda la isla.
            </p>
            <p className="text-foreground font-medium leading-relaxed border-l-2 border-primary pl-5">
              El registro básico es y va a seguir siendo gratis. Es un bien común para defender el
              territorio apícola.
            </p>
          </div>
        </div>
      </section>

      {/* F. FAQ */}
      <section id="faq" className="px-6 sm:px-10 lg:px-16 xl:px-24 py-24 sm:py-32 border-t border-border/60">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-12 sm:mb-16 text-center">
            Preguntas frecuentes
          </h2>

          <div className="space-y-2">
            {[
              {
                q: '¿De verdad es gratis?',
                a: 'Sí. El censo, el mapa, las alertas y la ayuda con la declaración SAG son gratis. Solo se cobran herramientas extras si vendes más y las quieres — por ejemplo pasaportes ilimitados o el cuaderno digital completo.',
              },
              {
                q: '¿Quién ve mis colmenas?',
                a: 'Nadie ve el punto exacto. En el mapa público hay zonas de más o menos un kilómetro, sin nombres ni teléfonos. Solo tú ves tus coordenadas reales.',
              },
              {
                q: 'No me llevo bien con el computador',
                a: 'No hay problema. Te podemos inscribir en persona: en una reunión, en INDAP, en la feria o en tu apiario. Después te podemos seguir por WhatsApp.',
              },
              {
                q: '¿Esto reemplaza al SAG?',
                a: 'No. Te ayuda a cumplir. En octubre, cuando toca actualizar ante el SAG, la red te deja la declaración casi lista para imprimir y firmar.',
              },
              {
                q: '¿Y si soy trashumante?',
                a: 'Bienvenido. Lo que la isla necesita es que quien llega declare. La red no persigue la trashumancia: persigue la que no se avisa.',
              },
            ].map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-2xl border border-transparent open:border-border/60 open:bg-surface-raised px-5 py-4 transition-colors"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[0.95rem] font-medium text-foreground">
                  {q}
                  <span
                    className="text-muted-foreground text-xl leading-none transition-transform group-open:rotate-45 shrink-0"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-8 text-sm text-muted-foreground font-light leading-relaxed">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* G. CIERRE */}
      <section className="bg-surface-sunken px-6 sm:px-10 lg:px-20 py-24 sm:py-32 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="font-existencial text-3xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance mb-5">
            El censo cierra el {cierre}
          </h2>
          <p className="text-muted-foreground font-light leading-relaxed mb-10 text-base sm:text-lg">
            Tu zona de pecoreo empieza a existir en el mapa cuando la inscribes. Si quieres, te
            ayudamos a hacerlo en persona.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/login?mode=signup"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/15 transition-opacity hover:opacity-95 group"
            >
              Inscribirme gratis
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-border px-8 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-background"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      <TerritorioFooter />
    </main>
  );
}
