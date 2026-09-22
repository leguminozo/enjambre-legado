import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Compass,
  Home,
  Waves,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  ArrowRight,
  Clock,
  Flame,
} from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { JsonLd } from '@/components/ui/JsonLd';
import { breadcrumbJsonLd } from '@/lib/shop/json-ld';
import { getSiteContent } from '@/lib/cms';
import { parseExperienciasPureoSettings, resolveLocalized, alignToClass } from '@enjambre/shop-chrome';
import { getLocale } from 'next-intl/server';
import {
  ExperienceInquiryForm,
  type ExperienceFormatChoice,
} from '@/components/experiencias/experience-inquiry-form';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export const metadata: Metadata = {
  title: 'Estadía & Apiturismo en Predio Pureo (Chiloé) · La Obrera y el Zángano',
  description:
    'Inmersión física en el origen apícola de Queilén, Chiloé. Cabaña de bosque nativo, navegación en kayak por esteros protegidos y apiturismo vivencial guiado por Cristina Miranda.',
  alternates: { canonical: `${SITE_URL}/experiencias/pureo` },
  openGraph: {
    title: 'Estadía & Apiturismo en Predio Pureo (Chiloé) · La Obrera y el Zángano',
    description:
      'Inmersión física en el origen de Queilén, Chiloé. Cabaña nativa, kayak en esteros y apiturismo vivencial entre Ulmos centenarios.',
    url: `${SITE_URL}/experiencias/pureo`,
    type: 'website',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
    images: [{ url: `${SITE_URL}/assets/editorial/experiencias.jpg`, width: 1600, height: 900 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Estadía & Apiturismo en Predio Pureo · Chiloé Austral',
    description:
      'Cabaña de madera nativa, navegación en kayak por esteros y apertura de colmenas con Cristina Miranda en Queilén.',
  },
};

const PUREO_FORMATS: ExperienceFormatChoice[] = [
  {
    id: 'estadia_completa',
    title: 'Estadía Completa & Inmersión Territorial',
    subtitle: '3 a 5 días · Cabaña, kayak y apiarios (2 a 6 personas)',
    defaultAttendees: '2 a 4 personas',
    attendeeOptions: ['2 personas', '3 a 4 personas', '5 a 6 personas'],
  },
  {
    id: 'apiturismo_dia',
    title: 'Jornada de Apiturismo & Kayak por el Día',
    subtitle: '1 día (10:00 a 18:00 hrs) · Visita guiada y colmenas',
    defaultAttendees: '2 a 4 personas',
    attendeeOptions: ['2 personas', '3 a 4 personas', '5 a 8 personas'],
  },
  {
    id: 'residencia_autor',
    title: 'Residencia de Estudio o Creación',
    subtitle: '7 a 14 días · Silencio, bosque templado y fogón',
    defaultAttendees: '1 a 2 personas',
    attendeeOptions: ['1 persona', '2 personas'],
  },
];

export default async function ExperienciaPureoPage({
  searchParams,
}: {
  searchParams?: Promise<{ cms_preview?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const draft = resolvedParams.cms_preview === '1';

  const [rows, locale] = await Promise.all([
    getSiteContent('experiencias_pureo_settings', { draft }),
    getLocale(),
  ]);
  const cmsContent = (rows?.[0]?.content as Record<string, unknown>) ?? null;
  const content = parseExperienciasPureoSettings(cmsContent);

  const heroKicker =
    resolveLocalized(content.kicker, content.kicker_en, locale) ||
    'Queilén · Archipiélago de Chiloé · Latitud 42° 53′ S';
  const heroTitle =
    resolveLocalized(content.title, content.title_en, locale) || 'Inmersión en Predio Pureo';
  const heroSubtitle =
    resolveLocalized(content.subtitle, content.subtitle_en, locale) ||
    'La experiencia física de habitar el bosque lluvioso templado donde nace nuestra miel cruda: cabaña nativa con fogón a leña, navegación silenciosa en kayak y ronda de colmenas.';
  const heroImage = content.hero_image || '/assets/editorial/experiencias.jpg';

  const cabanaTitle =
    resolveLocalized(content.cabana_title, content.cabana_title_en, locale) || 'Cabaña Nativa';
  const cabanaDesc =
    resolveLocalized(content.cabana_desc, content.cabana_desc_en, locale) ||
    'Construida en maderas nobles recuperadas de Tepa, Coigüe y Ciprés de las Guaitecas. Cuenta con estufa de combustión lenta, ventanales sobre la copa de los árboles y cocina equipada para preparar productos de recolección local.';

  const kayakTitle =
    resolveLocalized(content.kayak_title, content.kayak_title_en, locale) || 'Kayak en Esteros';
  const kayakDesc =
    resolveLocalized(content.kayak_desc, content.kayak_desc_en, locale) ||
    'Acceso directo a los brazos de agua protegidos del estero de Pureo. Navegación en kayak de travesía entre cisnes de cuello negro, huillines y arrayanales inundados. Una perspectiva única del ecotono bosque-mar.';

  const apiturismoTitle =
    resolveLocalized(content.apiturismo_title, content.apiturismo_title_en, locale) ||
    'Ronda de Colmenas';
  const apiturismoDesc =
    resolveLocalized(content.apiturismo_desc, content.apiturismo_desc_en, locale) ||
    'Acompañamiento a Cristina Miranda en la revisión de apiarios. Equipado con traje de protección integral, descubrirás la arquitectura interior del panal, la danza de pecoreo y degustarás miel virgen tibia recién extraída con espátula.';

  const logisticaTitle =
    resolveLocalized(content.logistica_title, content.logistica_title_en, locale) ||
    'Cómo llegar a Pureo';
  const logisticaText = resolveLocalized(content.logistica_text, content.logistica_text_en, locale);

  const jsonLdData = breadcrumbJsonLd([
    { name: 'Inicio', href: '/' },
    { name: 'Experiencias', href: '/experiencias' },
    { name: 'Predio Pureo · Chiloé', href: '/experiencias/pureo' },
  ]);

  return (
    <StoreShell>
      <ShopHeader />
      <JsonLd data={jsonLdData} />

      <main className="min-h-[var(--vh-full)] bg-background">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden border-b border-border/20">
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt="Predio Pureo en Queilén, Chiloé"
              fill
              sizes="100vw"
              priority
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-background/85" />
          </div>

          <div className="relative px-4 text-center pt-[max(7.5rem,calc(env(safe-area-inset-top)+6rem))] pb-16 md:pb-24 max-w-4xl mx-auto">
            <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-4">
              {heroKicker}
            </span>
            <h1 className="font-display text-[clamp(2.25rem,6.5vw,4.5rem)] font-light text-foreground mb-5 text-balance leading-tight">
              {heroTitle}
            </h1>
            <p className={`font-display italic text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty mb-8 leading-relaxed whitespace-pre-line ${alignToClass(content.text_align)}`}>
              {heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#reserva"
                className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <span>Consultar disponibilidad</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <Link
                href="/origen"
                className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center rounded-full border border-border/40 bg-surface-raised/40 px-6 text-xs font-medium uppercase tracking-wider text-foreground hover:border-accent transition-colors"
              >
                Conocer el Predio
              </Link>
            </div>
          </div>
        </section>

        {/* ── Los Tres Pilares Físicos de la Estadía ── */}
        <section className="py-20 md:py-28 px-4 border-b border-border/20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-2">
                Arquitectura de la Experiencia
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-light text-foreground text-balance">
                Vivir el origen en tres dimensiones
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Sin artificios turísticos. Un encuentro genuino con el ritmo apícola, los ciclos de lluvia y
                la serenidad del bosque nativo chilote.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Pilar 1: Cabaña */}
              <div className="rounded-2xl border border-border/30 bg-surface-raised/30 p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text mb-4">
                    <Home className="w-5 h-5" />
                  </div>
                  <span className="text-[0.65rem] uppercase tracking-wider text-accent-text font-medium">
                    Refugio Austral
                  </span>
                  <h3 className="font-display text-2xl font-light text-foreground mt-1 mb-3">
                    {cabanaTitle}
                  </h3>
                  <p className={`text-xs text-muted-foreground leading-relaxed mb-4 whitespace-pre-line ${alignToClass(content.text_align)}`}>
                    {cabanaDesc}
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground border-t border-border/20 pt-3">
                    <li className="flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-accent-text shrink-0" />
                      <span>Calefacción a leña seca y abrigo nórdico</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-accent-text shrink-0" />
                      <span>Capacidad máxima: 4 a 6 huéspedes</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Pilar 2: Kayak */}
              <div className="rounded-2xl border border-border/30 bg-surface-raised/30 p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text mb-4">
                    <Waves className="w-5 h-5" />
                  </div>
                  <span className="text-[0.65rem] uppercase tracking-wider text-accent-text font-medium">
                    Navegación Serena
                  </span>
                  <h3 className="font-display text-2xl font-light text-foreground mt-1 mb-3">
                    {kayakTitle}
                  </h3>
                  <p className={`text-xs text-muted-foreground leading-relaxed mb-4 whitespace-pre-line ${alignToClass(content.text_align)}`}>
                    {kayakDesc}
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground border-t border-border/20 pt-3">
                    <li className="flex items-center gap-2">
                      <Compass className="w-3.5 h-3.5 text-accent-text shrink-0" />
                      <span>Equipamiento técnico y chalecos certificados</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-accent-text shrink-0" />
                      <span>Travesías guiadas según tabla de mareas</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Pilar 3: Apiturismo */}
              <div className="rounded-2xl border border-border/30 bg-surface-raised/30 p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text mb-4">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-[0.65rem] uppercase tracking-wider text-accent-text font-medium">
                    Oficio Vivo
                  </span>
                  <h3 className="font-display text-2xl font-light text-foreground mt-1 mb-3">
                    {apiturismoTitle}
                  </h3>
                  <p className={`text-xs text-muted-foreground leading-relaxed mb-4 whitespace-pre-line ${alignToClass(content.text_align)}`}>
                    {apiturismoDesc}
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground border-t border-border/20 pt-3">
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent-text shrink-0" />
                      <span>Protocolo de bioseguridad y trajes profesionales</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-accent-text shrink-0" />
                      <span>Temporada de colmena: Octubre a Abril</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Información Práctica y Entorno ── */}
        <section className="py-16 md:py-24 px-4 border-b border-border/20 bg-surface-raised/20">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="block text-[0.65rem] tracking-[0.3em] uppercase text-accent-text mb-2">
                Coordenadas y Logística
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground mb-4">
                {logisticaTitle}
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {logisticaText ? (
                  <p className={`whitespace-pre-line ${alignToClass(content.text_align)}`}>{logisticaText}</p>
                ) : (
                  <>
                    <p>
                      Predio Pureo se ubica en la comuna de Queilén, en la costa oriental de la Isla Grande de
                      Chiloé, a 45 minutos al sur de Chonchi y 75 minutos desde el aeródromo de Mocopulli (Castro).
                    </p>
                    <p>
                      El acceso final discurre por camino ripiado rural entre lomajes de tepual y bosque
                      siempreverde. Se recomienda vehículo alto o tracción simple en verano, coordinando la llegada
                      previa con nuestro equipo.
                    </p>
                  </>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <MapPin className="w-4 h-4 text-accent-text shrink-0" />
                  <span>Sector Pureo, Queilén, Región de Los Lagos</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/30 bg-background/50 p-6 sm:p-8 space-y-4 text-xs">
              <h3 className="font-display text-lg font-light text-foreground">
                Recomendaciones para el visitante
              </h3>
              <ul className="space-y-2.5 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent-text font-bold">•</span>
                  <span>
                    <strong className="text-foreground">Clima variable:</strong> Traer calzado de caminata
                    impermeable (botas o botines), cortavientos y capas térmicas de lana.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-text font-bold">•</span>
                  <span>
                    <strong className="text-foreground">Respeto al silencio:</strong> No se admiten
                    parlantes ni actividades motorizadas que perturben los corredores biológicos de fauna.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-text font-bold">•</span>
                  <span>
                    <strong className="text-foreground">Conectividad:</strong> Señal telefónica moderada; la
                    cabaña cuenta con enlace satelital de baja latencia para emergencias y trabajo reflexivo.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── Formulario de Reserva / Consulta ── */}
        <section id="reserva" className="py-20 md:py-28 px-4 border-b border-border/20">
          <div className="max-w-2xl mx-auto">
            <ExperienceInquiryForm
              experienceName="Estadía & Apiturismo en Predio Pureo, Chiloé"
              inquiryTitle="Consultar fechas para Pureo"
              inquirySubtitle="Coordina directamente tu estadía en cabaña, jornada de kayak o visita a colmenas con la anfitrionía de Cristina Miranda."
              formatChoices={PUREO_FORMATS}
              notesPlaceholder="Ej. Buscamos 3 noches en enero para 2 adultos; nos interesa navegar en kayak y realizar la ronda de colmenas."
            />
          </div>
        </section>

        {/* ── Navegación Cruzada a Experiencias ── */}
        <section className="py-12 px-4 text-center">
          <div className="max-w-xl mx-auto">
            <h3 className="font-display text-lg font-light text-foreground mb-1">
              Otras Experiencias en el Bosque
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              ¿No puedes viajar a Chiloé? Conoce nuestras catas privadas en Santiago y talleres de técnica apícola.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold uppercase tracking-wider text-accent-text">
              <Link href="/experiencias/floraciones" className="hover:underline">
                Catas de Floraciones en Santiago →
              </Link>
              <span className="text-border">·</span>
              <Link href="/experiencias/talleres" className="hover:underline">
                Talleres de Técnica Apícola →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <ShopFooter />
    </StoreShell>
  );
}
