import Link from 'next/link';
import { headers } from 'next/headers';
import { ShieldAlert, Map, QrCode, ArrowRight, UserCircle2, UserPlus, ShieldCheck, FileText, MapPin } from 'lucide-react';
import { CensoStats, type CensoStatsData } from '@/components/censo/CensoStats';

/**
 * Hero del Registro Territorial Apícola de Chiloé — Variante A ("Dato duro").
 * El contador se renderiza en servidor (ISR 120 s vía /api/censo-publico/stats)
 * y la fecha de cierre del censo vive en la DB (config_censo), no en el copy.
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
  if (!cierre) return '31 DE OCTUBRE';
  const d = new Date(`${cierre}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '31 DE OCTUBRE';
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long' })
    .format(d)
    .toUpperCase();
}

export default async function RedApicolaLanding() {
  const stats = await getCensoStats();
  const cierre = formatCierre(stats?.cierre ?? null);

  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground font-sans selection:bg-accent selection:text-accent-foreground flex flex-col">
      {/* Top Navbar */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold font-serif">
            CH
          </div>
          <span className="font-medium text-sm tracking-wide hidden sm:block">
            Registro Territorial Apícola de Chiloé
          </span>
        </div>
        <div>
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-surface-raised">
            <UserCircle2 className="w-4 h-4" />
            Acceso
          </Link>
        </div>
      </header>

      {/* Hero Section — Variante A */}
      <section className="relative pt-[22vh] pb-20 px-6 sm:px-12 lg:px-24 flex-1 flex flex-col items-center text-center overflow-hidden border-b border-border">
        {/* Background Decorative */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at center, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[60%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="z-10 bg-surface-raised border border-border px-4 py-1.5 rounded-full inline-flex items-center gap-2 mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Censo Apícola 2026–2027 · Cierre {cierre}
          </span>
        </div>

        <h1 className="font-existencial text-foreground font-bold tracking-tight mb-6 max-w-4xl text-balance text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1]">
          Tu zona de pecoreo ya tiene defensa legal. <br />
          <span className="text-primary italic font-serif">Falta que esté en el mapa.</span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground mb-4 max-w-2xl font-light leading-relaxed text-pretty">
          La Ley Apícola (21.102) exige distancias mínimas de hasta 2,2 km entre apiarios. Sin registro
          territorial, esa distancia no se puede exigir. Inscribe tus apiarios, recibe alertas de
          instalaciones cercanas y dale a tu miel un Pasaporte QR que la conecta con quien la compra.
        </p>

        <p className="text-sm text-primary italic font-serif mb-10">
          Creado por apicultores de Chiloé, para apicultores de Chiloé.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-xl z-10">
          <Link
            href="/login?mode=signup"
            className="w-full sm:w-auto min-h-12 inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-all duration-300 shadow-xl shadow-primary/20 active:scale-95 group"
          >
            Inscribir mis apiarios — es gratis
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/mapa-chiloe"
            className="w-full sm:w-auto min-h-12 inline-flex items-center justify-center gap-2 px-8 py-4 border border-border bg-surface-raised hover:bg-surface-sunken text-foreground rounded-xl font-medium transition-all duration-300 group"
          >
            <Map className="w-4 h-4" />
            Ver el mapa público
          </Link>
        </div>

        <div className="mt-5 z-10">
          <CensoStats initialStats={stats} />
        </div>

        {/* Barra de confianza regulatoria */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground z-10 max-w-3xl">
          <span>Alineado con el registro SAG (Res. 8.196/2015)</span>
          <span className="hidden sm:inline text-muted-foreground/50">·</span>
          <span>Cuaderno de campo digital conforme a Res. 4590/2025</span>
          <span className="hidden sm:inline text-muted-foreground/50">·</span>
          <span>Datos protegidos Ley 21.719</span>
        </div>

        <Link href="/impacto" className="mt-6 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors z-10">
          Municipalidad / prensa →
        </Link>
      </section>

      {/* Beneficios */}
      <section className="bg-surface-sunken py-24 px-6 sm:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-serif text-foreground mb-4">¿Por qué registrarse?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              No es solo un mapa. Es una plataforma integral diseñada por y para los apicultores locales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <ShieldAlert className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">Defensa Territorial</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Recibe alertas si apicultores trashumantes no registrados se instalan cerca de tu zona de pecoreo. Protege la bioseguridad de tus colmenas.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
                <Map className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">Ordenamiento Municipal</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                El registro territorial permite coordinar con las autoridades locales para exigir el cumplimiento de las normativas vigentes sobre distancias.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-6">
                <QrCode className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">Trazabilidad Comercial</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Cada uno de tus lotes de miel obtendrá un Pasaporte Público con código QR, conectando tu esfuerzo directamente con el consumidor final.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hecho por apicultores de Chiloé */}
      <section className="bg-background py-24 px-6 sm:px-12 lg:px-24 border-b border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10 items-center">
          <div className="md:col-span-2 space-y-3">
            <div className="w-full aspect-[4/5] rounded-2xl bg-surface-raised border border-border flex items-center justify-center">
              <p className="text-xs text-muted-foreground max-w-[200px] text-center px-4">
                [Foto real: apiarios en bosque nativo, Pureo/Queilén — pendiente de producción]
              </p>
            </div>
            <p className="text-xs text-muted-foreground italic">
              Apiarios en bosque nativo, entre Pureo, Quemchi y Queilén.
            </p>
          </div>
          <div className="md:col-span-3 space-y-5">
            <h2 className="text-3xl font-bold font-serif text-foreground">
              Hecho por apicultores de Chiloé
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Este registro nació dentro de una apicultura real de la isla: La Obrera y el Zángano,
              que trabaja hace más de veinte años con bosque nativo entre Pureo, Quemchi y Queilén.
              La misma herramienta que usamos para ordenar nuestros propios apiarios, cuaderno de
              campo y pasaportes QR es la que ahora compartimos con toda la isla.
            </p>
            <div className="border-l-4 border-primary bg-surface-raised rounded-r-xl p-5">
              <p className="font-serif italic text-foreground">
                El registro básico es y seguirá siendo gratuito. Es un bien común para defender el
                territorio apícola de Chiloé.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="bg-surface-sunken py-24 px-6 sm:px-12 lg:px-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold font-serif text-foreground mb-3">¿Cómo funciona?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Tres pasos simples. Si no sabes de computadores, te ayudamos en persona.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                <UserPlus className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-foreground mb-2">1 · Te inscribes (te ayudamos)</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cinco minutos, gratis. Si prefieres, te inscribimos en persona en una reunión de la
                Red, en INDAP o en la feria. No necesitas saber de computadores.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-foreground mb-2">2 · Declaras tus apiarios</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tu zona de pecoreo queda en el mapa de la Red. Tu ubicación exacta jamás se publica:
                solo se muestra una zona aproximada de 1 km.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-foreground mb-2">3 · Defiendes y vendes mejor</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Recibes alertas de instalaciones cercanas, tu declaración SAG lista para firmar en
                octubre y Pasaportes QR para que tu miel cuente su propia historia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section className="bg-background py-24 px-6 sm:px-12 lg:px-24 border-b border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-serif text-foreground mb-3">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: '¿De verdad es gratis?',
                a: 'Sí. El censo, el mapa, las alertas y la declaración SAG son gratis para siempre. Es un bien común de la isla. Solo se cobran herramientas extra para quien vende más: Pasaportes QR ilimitados y cuaderno de campo digital completo.',
              },
              {
                q: '¿Quién puede ver dónde están mis colmenas?',
                a: 'Nadie ve tu punto exacto. El mapa público muestra zonas aproximadas de 1 km, sin nombres ni contactos. Solo tú ves tus coordenadas reales. Tú decides qué compartir, con consentimiento explícito para cada cosa.',
              },
              {
                q: 'No sé usar computadores. ¿Puedo participar igual?',
                a: 'Sí. Te inscribimos en persona: en reuniones de la Red, en INDAP, en la feria o en tu propio apiario. Después puedes recibir todo por WhatsApp y usar el cuaderno en papel que nosotros te imprimimos.',
              },
              {
                q: '¿Esto reemplaza el registro del SAG?',
                a: 'No lo reemplaza: te ayuda a cumplirlo. En octubre, mes de actualización obligatoria ante el SAG, la Red te entrega tu declaración pre-llenada, lista para imprimir y firmar.',
              },
              {
                q: '¿Qué pasa si un trashumante se inscribe?',
                a: 'Bienvenido sea: la Red no persigue la trashumancia, persigue la trashumancia no declarada. Quien declara su ingreso, cumple la ley y se hace visible — eso es exactamente lo que la isla necesita.',
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

      {/* CTA final */}
      <section className="bg-surface-sunken py-24 px-6 sm:px-12 lg:px-24 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-foreground mb-4">
            El censo cierra el {cierre}.
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Tu zona de pecoreo empieza a existir cuando está en el mapa. Inscríbete gratis y sé de
            los primeros en defenderla.
          </p>
          <Link
            href="/login?mode=signup"
            className="inline-flex min-h-12 items-center justify-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-all duration-300 shadow-xl shadow-primary/20 active:scale-95 group"
          >
            Inscribir mis apiarios — es gratis
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background py-10 border-t border-border">
        <div className="max-w-5xl mx-auto px-6 flex flex-col items-center gap-4 text-center">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <Link href="/mapa-chiloe" className="hover:text-foreground transition-colors">Mapa público</Link>
            <Link href="/carta" className="hover:text-foreground transition-colors">Carta Territorial</Link>
            <Link href="/impacto" className="hover:text-foreground transition-colors">Municipalidades / prensa</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Acceso</Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Hecho por La Obrera y el Zángano, en Chiloé.
          </p>
          <p className="text-[11px] text-muted-foreground/70 max-w-md">
            La Red es un bien común; La Obrera y el Zángano es su proveedor tecnológico.
          </p>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Registro Territorial Apícola de Chiloé.
          </p>
        </div>
      </footer>
    </main>
  );
}
