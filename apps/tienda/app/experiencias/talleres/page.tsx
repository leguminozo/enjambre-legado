import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen,
  Compass,
  Leaf,
  Calendar,
  Users,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { EditorialHero } from '@/components/shop/editorial-hero';
import { JsonLd } from '@/components/ui/JsonLd';
import { breadcrumbJsonLd } from '@/lib/shop/json-ld';
import { getSiteContent } from '@/lib/cms';
import { parseExperienciasTalleresSettings, resolveLocalized, alignToClass } from '@enjambre/shop-chrome';
import { getLocale } from 'next-intl/server';
import {
  ExperienceInquiryForm,
  type ExperienceFormatChoice,
} from '@/components/experiencias/experience-inquiry-form';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export const metadata: Metadata = {
  title: 'Talleres de Técnica Apícola · La Obrera y el Zángano',
  description:
    'Programas formativos de técnica apícola, sanidad y botánica del bosque nativo austral. Dictados por Cristina Miranda en formato presencial y en terreno.',
  alternates: { canonical: `${SITE_URL}/experiencias/talleres` },
  openGraph: {
    title: 'Talleres de Técnica Apícola · La Obrera y el Zángano',
    description:
      'Programas formativos de técnica apícola, manejo de colmena y botánica austral guiados por Cristina Miranda.',
    url: `${SITE_URL}/experiencias/talleres`,
    type: 'website',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
    images: [{ url: `${SITE_URL}/assets/editorial/experiencias.jpg`, width: 1600, height: 900 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Talleres de Técnica Apícola · Bosque Austral',
    description:
      'Formación técnica, apicultura adaptada y botánica nativa conducidos por Cristina Miranda.',
  },
};

type TallerCmsItem = {
  date?: string;
  title?: string;
  desc?: string;
  action?: string;
};

const TALLER_FORMATS: ExperienceFormatChoice[] = [
  {
    id: 'taller_sensorial',
    title: 'Taller de Análisis Sensorial & Cata',
    subtitle: '2 a 3 horas · 8 a 16 personas · Sala o empresa',
    defaultAttendees: '8 a 12 asistentes',
    attendeeOptions: ['8 a 10 asistentes', '10 a 16 asistentes', 'Más de 16 asistentes'],
  },
  {
    id: 'taller_tecnica',
    title: 'Técnica y Manejo Apícola en Chiloé',
    subtitle: 'Jornada completa · Teórico-práctico en apiario',
    defaultAttendees: '6 a 10 asistentes',
    attendeeOptions: ['6 asistentes', '8 asistentes', '10 a 12 asistentes'],
  },
  {
    id: 'taller_botanica',
    title: 'Botánica Austral & Reconocimiento Melífero',
    subtitle: 'Medio día · Salida botánica o aula técnica',
    defaultAttendees: '8 a 15 asistentes',
    attendeeOptions: ['8 a 12 asistentes', '12 a 20 asistentes'],
  },
];

export default async function ExperienciasTalleresPage({
  searchParams,
}: {
  searchParams?: Promise<{ cms_preview?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const draft = resolvedParams.cms_preview === '1';

  const [talleresRows, settingsRows, locale] = await Promise.all([
    getSiteContent('talleres', { draft }),
    getSiteContent('experiencias_talleres_settings', { draft }),
    getLocale(),
  ]);

  const cmsTalleres: TallerCmsItem[] = (talleresRows ?? [])
    .map((r) => (r.content as TallerCmsItem) ?? {})
    .filter((t) => Boolean(t?.title?.trim() || t?.desc?.trim()));

  const cmsSettings = (settingsRows?.[0]?.content as Record<string, unknown>) ?? null;
  const settings = parseExperienciasTalleresSettings(cmsSettings);

  const heroKicker = resolveLocalized(settings.kicker, settings.kicker_en, locale);
  const heroTitle = resolveLocalized(settings.title, settings.title_en, locale);
  const heroSubtitle = resolveLocalized(settings.subtitle, settings.subtitle_en, locale);
  const heroImage = settings.hero_image || '/assets/editorial/experiencias.jpg';
  const heroCtaLabel = resolveLocalized(settings.hero_cta_label, settings.hero_cta_label_en, locale) || 'Coordinar taller privado';
  const heroCtaHref = settings.hero_cta_href || '#solicitud';
  const heroSecondaryLabel = resolveLocalized(settings.hero_secondary_label, settings.hero_secondary_label_en, locale) || 'Ver programas formativos';
  const heroSecondaryHref = settings.hero_secondary_href || '#programas';

  const curatoriaKicker = resolveLocalized(settings.curatoria_kicker, settings.curatoria_kicker_en, locale);
  const curatoriaTitle = resolveLocalized(settings.curatoria_title, settings.curatoria_title_en, locale) || 'Líneas de aprendizaje e inmersión';
  const curatoriaSubtitle = resolveLocalized(settings.curatoria_subtitle, settings.curatoria_subtitle_en, locale);

  const prog1Tag = resolveLocalized(settings.programa1_tag, settings.programa1_tag_en, locale) || 'Metodología de Cata';
  const prog1Title = resolveLocalized(settings.programa1_title, settings.programa1_title_en, locale);
  const prog1Desc = resolveLocalized(settings.programa1_desc, settings.programa1_desc_en, locale);
  const prog1Spec1 = resolveLocalized(settings.programa1_spec1, settings.programa1_spec1_en, locale) || 'Rueda de descriptores y fichas técnicas';
  const prog1Spec2 = resolveLocalized(settings.programa1_spec2, settings.programa1_spec2_en, locale) || 'Duración: 2.5 horas';

  const prog2Tag = resolveLocalized(settings.programa2_tag, settings.programa2_tag_en, locale) || 'Manejo Respetuoso';
  const prog2Title = resolveLocalized(settings.programa2_title, settings.programa2_title_en, locale);
  const prog2Desc = resolveLocalized(settings.programa2_desc, settings.programa2_desc_en, locale);
  const prog2Spec1 = resolveLocalized(settings.programa2_spec1, settings.programa2_spec1_en, locale) || 'Seguridad práctica y uso del velo';
  const prog2Spec2 = resolveLocalized(settings.programa2_spec2, settings.programa2_spec2_en, locale) || 'Jornada de 4 a 6 horas';

  const prog3Tag = resolveLocalized(settings.programa3_tag, settings.programa3_tag_en, locale) || 'Ecología del Bosque';
  const prog3Title = resolveLocalized(settings.programa3_title, settings.programa3_title_en, locale);
  const prog3Desc = resolveLocalized(settings.programa3_desc, settings.programa3_desc_en, locale);
  const prog3Spec1 = resolveLocalized(settings.programa3_spec1, settings.programa3_spec1_en, locale) || 'Melisopalinología aplicada a origen';
  const prog3Spec2 = resolveLocalized(settings.programa3_spec2, settings.programa3_spec2_en, locale) || 'Duración: 3 horas';

  const convocatoriasKicker = resolveLocalized(settings.convocatorias_kicker, settings.convocatorias_kicker_en, locale);
  const convocatoriasTitle = resolveLocalized(settings.convocatorias_title, settings.convocatorias_title_en, locale) || 'Próximas fechas programadas';

  const jsonLdData = breadcrumbJsonLd([
    { name: 'Inicio', href: '/' },
    { name: 'Experiencias', href: '/experiencias' },
    { name: 'Talleres de Técnica Apícola', href: '/experiencias/talleres' },
  ]);

  return (
    <StoreShell>
      <ShopHeader />
      <JsonLd data={jsonLdData} />

      <main
        data-cms-section="experiencias_talleres_settings"
        className="min-h-[var(--vh-full)] bg-background"
      >
        {/* ── Hero Cinemático & Editorial ── */}
        <EditorialHero
          sectionKey="experiencias_talleres_settings"
          kicker={heroKicker}
          title={heroTitle}
          subtitle={heroSubtitle}
          imageUrl={heroImage}
          imageOpacity={settings.hero_image_opacity ?? 25}
          imageAlt="Talleres de técnica apícola y botánica nativa"
          align={settings.text_align}
          ctaLabel={heroCtaLabel}
          ctaHref={heroCtaHref}
          secondaryCtaLabel={heroSecondaryLabel}
          secondaryCtaHref={heroSecondaryHref}
          preferAnchor
        />

        {/* ── Las Tres Líneas Formativas ── */}
        <section id="programas" className="py-20 md:py-28 px-4 border-b border-border/20 scroll-mt-28 md:scroll-mt-36">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl lg:max-w-4xl mx-auto mb-16">
              {curatoriaKicker ? (
                <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-2">
                  {curatoriaKicker}
                </span>
              ) : null}
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-foreground text-balance">
                {curatoriaTitle}
              </h2>
              {curatoriaSubtitle ? (
                <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  {curatoriaSubtitle}
                </p>
              ) : null}
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Programa 1: Análisis Sensorial */}
              <div className="rounded-2xl border border-border/30 bg-surface-raised/30 p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text mb-4">
                    <Compass className="w-5 h-5" />
                  </div>
                  {prog1Tag ? (
                    <span className="text-[0.65rem] uppercase tracking-wider text-accent-text font-medium">
                      {prog1Tag}
                    </span>
                  ) : null}
                  <h3 className="font-display text-2xl font-light text-foreground mt-1 mb-3">
                    {prog1Title}
                  </h3>
                  <p className={`text-xs text-muted-foreground leading-relaxed mb-4 whitespace-pre-line ${alignToClass(settings.text_align)}`}>
                    {prog1Desc}
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground border-t border-border/20 pt-3">
                    {prog1Spec1 ? (
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent-text shrink-0" />
                        <span>{prog1Spec1}</span>
                      </li>
                    ) : null}
                    {prog1Spec2 ? (
                      <li className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-accent-text shrink-0" />
                        <span>{prog1Spec2}</span>
                      </li>
                    ) : null}
                  </ul>
                </div>
              </div>

              {/* Programa 2: Manejo y Técnica Apícola */}
              <div className="rounded-2xl border border-border/30 bg-surface-raised/30 p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text mb-4">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  {prog2Tag ? (
                    <span className="text-[0.65rem] uppercase tracking-wider text-accent-text font-medium">
                      {prog2Tag}
                    </span>
                  ) : null}
                  <h3 className="font-display text-2xl font-light text-foreground mt-1 mb-3">
                    {prog2Title}
                  </h3>
                  <p className={`text-xs text-muted-foreground leading-relaxed mb-4 whitespace-pre-line ${alignToClass(settings.text_align)}`}>
                    {prog2Desc}
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground border-t border-border/20 pt-3">
                    {prog2Spec1 ? (
                      <li className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-accent-text shrink-0" />
                        <span>{prog2Spec1}</span>
                      </li>
                    ) : null}
                    {prog2Spec2 ? (
                      <li className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-accent-text shrink-0" />
                        <span>{prog2Spec2}</span>
                      </li>
                    ) : null}
                  </ul>
                </div>
              </div>

              {/* Programa 3: Botánica Austral */}
              <div className="rounded-2xl border border-border/30 bg-surface-raised/30 p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text mb-4">
                    <Leaf className="w-5 h-5" />
                  </div>
                  {prog3Tag ? (
                    <span className="text-[0.65rem] uppercase tracking-wider text-accent-text font-medium">
                      {prog3Tag}
                    </span>
                  ) : null}
                  <h3 className="font-display text-2xl font-light text-foreground mt-1 mb-3">
                    {prog3Title}
                  </h3>
                  <p className={`text-xs text-muted-foreground leading-relaxed mb-4 whitespace-pre-line ${alignToClass(settings.text_align)}`}>
                    {prog3Desc}
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground border-t border-border/20 pt-3">
                    {prog3Spec1 ? (
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent-text shrink-0" />
                        <span>{prog3Spec1}</span>
                      </li>
                    ) : null}
                    {prog3Spec2 ? (
                      <li className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-accent-text shrink-0" />
                        <span>{prog3Spec2}</span>
                      </li>
                    ) : null}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Calendario Dinámico CMS (si existen sesiones abiertas) ── */}
        {cmsTalleres.length > 0 && (
          <section className="py-16 md:py-24 px-4 border-b border-border/20 bg-surface-raised/20">
            <div className="max-w-4xl mx-auto">
              <div className="mb-10">
                {convocatoriasKicker ? (
                  <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-2">
                    {convocatoriasKicker}
                  </span>
                ) : null}
                {convocatoriasTitle ? (
                  <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground">
                    {convocatoriasTitle}
                  </h2>
                ) : null}
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {cmsTalleres.map((taller, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-border/30 bg-card p-6 flex flex-col justify-between"
                  >
                    <div>
                      {taller.date && (
                        <span className="text-[0.65rem] uppercase tracking-wider text-accent-text font-medium">
                          {taller.date}
                        </span>
                      )}
                      <h3 className="font-display text-xl font-light text-foreground mt-1 mb-2">
                        {taller.title}
                      </h3>
                      {taller.desc && (
                        <p className="text-xs text-muted-foreground leading-relaxed mb-4 whitespace-pre-line">
                          {taller.desc}
                        </p>
                      )}
                    </div>
                    {taller.action && (
                      <a
                        href="#solicitud"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-text hover:underline"
                      >
                        <span>Inscribirme o consultar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Formulario de Solicitud de Taller ── */}
        <section id="solicitud" className="py-20 md:py-28 px-4 border-b border-border/20 scroll-mt-28 md:scroll-mt-36">
          <div className="max-w-2xl mx-auto">
            <ExperienceInquiryForm
              experienceName="Talleres de Técnica Apícola"
              inquiryTitle="Agendar o solicitar taller formativo"
              inquirySubtitle="Indícanos el tipo de taller requerido, público objetivo y fechas estimadas. Coordinación directa con Cristina Miranda."
              formatChoices={TALLER_FORMATS}
              notesPlaceholder="Ej. Taller técnico para equipo de gastronomía de 12 personas en Santiago; requerimos cotización formal para empresa."
            />
          </div>
        </section>

        {/* ── Enlace Cruzado a Experiencias ── */}
        <section className="py-12 px-4 text-center">
          <div className="max-w-xl mx-auto">
            <h3 className="font-display text-lg font-light text-foreground mb-1">
              Otras Experiencias en el Bosque
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Explora la inmersión física en Chiloé o nuestras degustaciones de mieles de Chile.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold uppercase tracking-wider text-accent-text">
              <Link href="/experiencias/territorio" className="hover:underline">
                Territorio & Bosque Austral (Chiloé) →
              </Link>
              <span className="text-border">·</span>
              <Link href="/experiencias/degustaciones" className="hover:underline">
                Degustaciones · Mieles de Chile →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <ShopFooter />
    </StoreShell>
  );
}
