import type { Metadata } from 'next';
import {
  Compass,
  Home,
  Waves,
  Flower2,
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
import { EditorialHero } from '@/components/shop/editorial-hero';
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

  const heroKicker = resolveLocalized(content.kicker, content.kicker_en, locale);
  const heroTitle = resolveLocalized(content.title, content.title_en, locale);
  const heroSubtitle = resolveLocalized(content.subtitle, content.subtitle_en, locale);
  const heroImage = content.hero_image || '/assets/editorial/experiencias.jpg';
  const heroCtaLabel = resolveLocalized(content.hero_cta_label, content.hero_cta_label_en, locale) || 'Consultar disponibilidad';
  const heroCtaHref = content.hero_cta_href || '#solicitud';
  const heroSecondaryLabel = resolveLocalized(content.hero_secondary_label, content.hero_secondary_label_en, locale) || 'Conocer la experiencia';
  const heroSecondaryHref = content.hero_secondary_href || '#pilares';

  const pilaresKicker = resolveLocalized(content.pilares_kicker, content.pilares_kicker_en, locale);
  const pilaresTitle = resolveLocalized(content.pilares_title, content.pilares_title_en, locale) || 'Tres dimensiones del territorio insular';

  const cabanaTitle = resolveLocalized(content.cabana_title, content.cabana_title_en, locale);
  const cabanaDesc = resolveLocalized(content.cabana_desc, content.cabana_desc_en, locale);
  const cabanaBadge = resolveLocalized(content.cabana_badge, content.cabana_badge_en, locale) || 'Fogón y combustión lenta';

  const kayakTitle = resolveLocalized(content.kayak_title, content.kayak_title_en, locale);
  const kayakDesc = resolveLocalized(content.kayak_desc, content.kayak_desc_en, locale);
  const kayakBadge = resolveLocalized(content.kayak_badge, content.kayak_badge_en, locale) || 'Esteros y arrayanales costeros';

  const apiturismoTitle = resolveLocalized(content.apiturismo_title, content.apiturismo_title_en, locale);
  const apiturismoDesc = resolveLocalized(content.apiturismo_desc, content.apiturismo_desc_en, locale);
  const apiturismoBadge = resolveLocalized(content.apiturismo_badge, content.apiturismo_badge_en, locale) || 'Equipo de seguridad incluido';

  const logisticaTitle = resolveLocalized(content.logistica_title, content.logistica_title_en, locale);
  const logisticaText = resolveLocalized(content.logistica_text, content.logistica_text_en, locale);

  const solicitudKicker = resolveLocalized(content.solicitud_kicker, content.solicitud_kicker_en, locale);
  const solicitudTitle = resolveLocalized(content.solicitud_title, content.solicitud_title_en, locale) || 'Solicitud de Inmersión Territorial';
  const solicitudSubtitle = resolveLocalized(content.solicitud_subtitle, content.solicitud_subtitle_en, locale);

  const jsonLdData = breadcrumbJsonLd([
    { name: 'Inicio', href: '/' },
    { name: 'Experiencias', href: '/experiencias' },
    { name: 'Territorio · Chiloé', href: '/experiencias/territorio' },
  ]);

  return (
    <StoreShell>
      <ShopHeader />
      <JsonLd data={jsonLdData} />

      <main
        data-cms-section="experiencias_pureo_settings"
        className="min-h-[var(--vh-full)] bg-background"
      >
        {/* ── Hero Cinemático & Editorial ── */}
        <EditorialHero
          sectionKey="experiencias_pureo_settings"
          kicker={heroKicker}
          title={heroTitle}
          subtitle={heroSubtitle}
          imageUrl={heroImage}
          imageOpacity={content.hero_image_opacity ?? 30}
          imageAlt="Territorio y bosque nativo en Chiloé"
          align={content.text_align}
          ctaLabel={heroCtaLabel}
          ctaHref={heroCtaHref}
          secondaryCtaLabel={heroSecondaryLabel}
          secondaryCtaHref={heroSecondaryHref}
          preferAnchor
        />

        {/* ── Los Tres Pilares de la Inmersión ── */}
        <section id="pilares" className="py-20 md:py-28 px-4 border-b border-border/20 bg-surface-raised/20 scroll-mt-28 md:scroll-mt-36">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              {pilaresKicker ? (
                <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-2">
                  {pilaresKicker}
                </span>
              ) : null}
              <h2 className="font-display text-3xl sm:text-4xl font-light text-foreground">
                {pilaresTitle}
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
                {cabanaBadge ? (
                  <div className="mt-8 pt-4 border-t border-border/20 flex items-center gap-2 text-xs text-accent-text font-mono">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{cabanaBadge}</span>
                  </div>
                ) : null}
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
                {kayakBadge ? (
                  <div className="mt-8 pt-4 border-t border-border/20 flex items-center gap-2 text-xs text-accent-text font-mono">
                    <Compass className="w-3.5 h-3.5" />
                    <span>{kayakBadge}</span>
                  </div>
                ) : null}
              </div>

              {/* Pilar 3: Apiarios */}
              <div className="rounded-2xl border border-border/30 bg-card p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text mb-5">
                    <Flower2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-2xl font-light text-foreground mb-3">
                    {apiturismoTitle}
                  </h3>
                  <p className={`text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line ${alignToClass(content.text_align)}`}>
                    {apiturismoDesc}
                  </p>
                </div>
                {apiturismoBadge ? (
                  <div className="mt-8 pt-4 border-t border-border/20 flex items-center gap-2 text-xs text-accent-text font-mono">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{apiturismoBadge}</span>
                  </div>
                ) : null}
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
        <section id="solicitud" className="py-20 md:py-28 px-4 bg-surface-raised/10 scroll-mt-28 md:scroll-mt-36">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-10">
              {solicitudKicker ? (
                <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-2">
                  {solicitudKicker}
                </span>
              ) : null}
              <h2 className="font-display text-3xl font-light text-foreground">
                {solicitudTitle}
              </h2>
              {solicitudSubtitle ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {solicitudSubtitle}
                </p>
              ) : null}
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
