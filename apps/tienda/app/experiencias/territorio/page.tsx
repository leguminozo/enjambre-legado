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
  title: 'Territorio & Inmersión en Chiloé · La Obrera y el Zángano',
  description:
    'Inmersión física en el territorio apícola del bosque templado lluvioso en Chiloé. Cabaña nativa, navegación en kayak por esteros protegidos y vivencia directa entre colmenas guiada por Cristina Miranda.',
  alternates: { canonical: `${SITE_URL}/experiencias/territorio` },
  openGraph: {
    title: 'Territorio & Inmersión en Chiloé · La Obrera y el Zángano',
    description:
      'Inmersión física en el territorio de Chiloé. Cabaña nativa, kayak en esteros y vivencia directa entre Ulmos centenarios y colmenas nativas.',
    url: `${SITE_URL}/experiencias/territorio`,
    type: 'website',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
    images: [{ url: `${SITE_URL}/assets/editorial/experiencias.jpg`, width: 1600, height: 900 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Territorio & Inmersión en Chiloé · Bosque Austral',
    description:
      'Cabaña de madera nativa, navegación en kayak por esteros y apertura de colmenas con Cristina Miranda en Chiloé.',
  },
};

const TERRITORIO_FORMATS: ExperienceFormatChoice[] = [
  {
    id: 'estadia_completa',
    title: 'Estadía Completa & Inmersión Territorial',
    subtitle: '3 a 5 días · Cabaña, kayak y apiarios (2 a 6 personas)',
    defaultAttendees: '2 a 4 personas',
    attendeeOptions: ['2 personas', '3 a 4 personas', '5 a 6 personas'],
  },
  {
    id: 'apiturismo_dia',
    title: 'Jornada de Territorio & Kayak por el Día',
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

export default async function ExperienciaTerritorioPage({
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
    'Archipiélago de Chiloé · Bosque Templado Lluvioso · Latitud 42° 53′ S';
  const heroTitle =
    resolveLocalized(content.title, content.title_en, locale) || 'Territorio & Inmersión Viva';
  const heroSubtitle =
    resolveLocalized(content.subtitle, content.subtitle_en, locale) ||
    'La experiencia física de habitar el bosque lluvioso templado donde nace nuestra miel cruda: cabaña nativa con fogón a leña, navegación silenciosa en kayak y ronda de colmenas en Chiloé.';
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
    'Acceso directo a los brazos de agua protegidos del estero. Navegación en kayak de travesía entre cisnes de cuello negro, huillines y arrayanales inundados. Una perspectiva única del ecotono bosque-mar.';

  const apiturismoTitle =
    resolveLocalized(content.apiturismo_title, content.apiturismo_title_en, locale) ||
    'Ronda de Colmenas';
  const apiturismoDesc =
    resolveLocalized(content.apiturismo_desc, content.apiturismo_desc_en, locale) ||
    'Acompañamiento a Cristina Miranda en la revisión de apiarios. Equipado con traje de protección integral, descubrirás la arquitectura interior del panal, la danza de pecoreo y degustarás miel virgen tibia recién extraída con espátula.';

  const logisticaTitle =
    resolveLocalized(content.logistica_title, content.logistica_title_en, locale) ||
    'Cómo llegar al Territorio';
  const logisticaText = resolveLocalized(content.logistica_text, content.logistica_text_en, locale);

  const jsonLdData = breadcrumbJsonLd([
    { name: 'Inicio', href: '/' },
    { name: 'Experiencias', href: '/experiencias' },
    { name: 'Territorio · Chiloé', href: '/experiencias/territorio' },
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
              alt="Territorio y bosque nativo en Chiloé"
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
            <p className={`font-display italic text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto text-pretty mb-8 leading-relaxed whitespace-pre-line ${alignToClass(content.text_align)}`}>
              {heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#solicitud"
                className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-7 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Consultar disponibilidad
              </a>
              <a
                href="#pilares"
                className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center rounded-full border border-border/40 bg-surface-raised/40 px-6 text-xs font-medium uppercase tracking-wider text-foreground hover:border-accent transition-colors"
              >
                Conocer la experiencia
              </a>
            </div>
          </div>
        </section>

        {/* ── Los Tres Pilares de la Inmersión ── */}
        <section id="pilares" className="py-20 md:py-28 px-4 border-b border-border/20 bg-surface-raised/20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-2">
                Ejes de la Estadía
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-light text-foreground">
                Tres dimensiones del territorio insular
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Pilar 1: Cabaña */}
              <div className="rounded-2xl border border-border/30 bg-card p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text mb-5">
                    <Home className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-2xl font-light text-foreground mb-3">
                    {cabanaTitle}
                  </h3>
                  <p className={`text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line ${alignToClass(content.text_align)}`}>
                    {cabanaDesc}
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-border/20 flex items-center gap-2 text-xs text-accent-text font-mono">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Fogón y combustión lenta</span>
                </div>
              </div>

              {/* Pilar 2: Kayak */}
              <div className="rounded-2xl border border-border/30 bg-card p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text mb-5">
                    <Waves className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-2xl font-light text-foreground mb-3">
                    {kayakTitle}
                  </h3>
                  <p className={`text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line ${alignToClass(content.text_align)}`}>
                    {kayakDesc}
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-border/20 flex items-center gap-2 text-xs text-accent-text font-mono">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Esteros y arrayanales costeros</span>
                </div>
              </div>

              {/* Pilar 3: Apiarios */}
              <div className="rounded-2xl border border-border/30 bg-card p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text mb-5">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-2xl font-light text-foreground mb-3">
                    {apiturismoTitle}
                  </h3>
                  <p className={`text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line ${alignToClass(content.text_align)}`}>
                    {apiturismoDesc}
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-border/20 flex items-center gap-2 text-xs text-accent-text font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Equipo de seguridad incluido</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Logística y Ubicación ── */}
        <section className="py-16 md:py-20 px-4 border-b border-border/20">
          <div className="max-w-3xl mx-auto rounded-2xl border border-border/30 bg-surface-raised/30 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <MapPin className="w-5 h-5 text-accent-text shrink-0 mt-0.5" />
              <div className="space-y-3">
                <h3 className="font-display text-xl font-light text-foreground">
                  {logisticaTitle}
                </h3>
                <p className={`text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line ${alignToClass(content.text_align)}`}>
                  {logisticaText ||
                    'Vuelo a Castro (Aeródromo Mocopulli) o Puerto Montt (El Tepual), cruce de canal de Chacao y traslado terrestre por la Ruta 5 Sur hacia el archipiélago. Proveemos coordenadas exactas, horarios de mareas y asistencia técnica de llegada una vez confirmada la reserva.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Formulario de Solicitud ── */}
        <section id="solicitud" className="py-20 md:py-28 px-4 bg-surface-raised/10">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-10">
              <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-2">
                Reserva de Fechas
              </span>
              <h2 className="font-display text-3xl font-light text-foreground">
                Solicitud de Inmersión Territorial
              </h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Coordinación directa para estancias privadas y jornadas en Chiloé.
              </p>
            </div>

            <ExperienceInquiryForm
              experienceName="Inmersión Territorial en Chiloé"
              formatChoices={TERRITORIO_FORMATS}
            />
          </div>
        </section>
      </main>

      <ShopFooter />
    </StoreShell>
  );
}
