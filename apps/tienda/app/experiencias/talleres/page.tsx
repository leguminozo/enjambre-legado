import type { Metadata } from 'next';
import Image from 'next/image';
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
    id: 'taller_oficio',
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

  const heroKicker =
    resolveLocalized(settings.kicker, settings.kicker_en, locale) ||
    'Técnica & Supervivencia en el Bosque Austral';
  const heroTitle =
    resolveLocalized(settings.title, settings.title_en, locale) || 'Talleres de Técnica Apícola';
  const heroSubtitle =
    resolveLocalized(settings.subtitle, settings.subtitle_en, locale) ||
    'Encuentros de formación rigurosa en torno al manejo técnico de la colmena, sanidad y adaptación biológica en los ecosistemas templados lluviosos de Chiloé.';
  const heroImage = settings.hero_image || '/assets/editorial/experiencias.jpg';

  const prog1Title =
    resolveLocalized(settings.programa1_title, settings.programa1_title_en, locale) ||
    'Análisis Sensorial de Mieles Crudas';
  const prog1Desc =
    resolveLocalized(settings.programa1_desc, settings.programa1_desc_en, locale) ||
    'Calibración de receptores olfativos y gustativos para discernir notas florales, ácidas, minerales y balsámicas en mieles monoflorales de Ulmo, Tiaca, Arrayán y poliflorales de cordillera.';

  const prog2Title =
    resolveLocalized(settings.programa2_title, settings.programa2_title_en, locale) ||
    'Técnica y Manejo Apícola';
  const prog2Desc =
    resolveLocalized(settings.programa2_desc, settings.programa2_desc_en, locale) ||
    'Fundamentos de la vida en la colmena: castas, comunicación por feromonas, manejo del humo frío, diagnóstico sanitario natural y adaptación a climas hostiles sin jarabes de azúcar.';

  const prog3Title =
    resolveLocalized(settings.programa3_title, settings.programa3_title_en, locale) ||
    'Botánica Melífera & Polen';
  const prog3Desc =
    resolveLocalized(settings.programa3_desc, settings.programa3_desc_en, locale) ||
    'Reconocimiento morfológico de especies nativas (Eucryphia cordifolia, Caldcluvia paniculata, Luma apiculata) y su correlación con los granos de polen observados bajo microscopio óptico.';

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
        {/* ── Hero ── */}
        <section className="relative overflow-hidden border-b border-border/20">
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt="Talleres de técnica apícola y botánica nativa"
              fill
              sizes="100vw"
              priority
              className="object-cover opacity-25"
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
            <p className={`font-display italic text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty mb-8 leading-relaxed whitespace-pre-line ${alignToClass(settings.text_align)}`}>
              {heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#solicitud"
                className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <span>Coordinar taller privado</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <a
                href="#programas"
                className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center rounded-full border border-border/40 bg-surface-raised/40 px-6 text-xs font-medium uppercase tracking-wider text-foreground hover:border-accent transition-colors"
              >
                Ver programas formativos
              </a>
            </div>
          </div>
        </section>

        {/* ── Las Tres Líneas Formativas ── */}
        <section id="programas" className="py-20 md:py-28 px-4 border-b border-border/20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-2">
                Curatoria Pedagógica
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-light text-foreground text-balance">
                Líneas de aprendizaje e inmersión
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Diseñados para instituciones educativas, equipos corporativos, profesionales de la gastronomía
                y comunidades interesadas en la soberanía biológica.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Programa 1: Análisis Sensorial */}
              <div className="rounded-2xl border border-border/30 bg-surface-raised/30 p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text mb-4">
                    <Compass className="w-5 h-5" />
                  </div>
                  <span className="text-[0.65rem] uppercase tracking-wider text-accent-text font-medium">
                    Metodología de Cata
                  </span>
                  <h3 className="font-display text-2xl font-light text-foreground mt-1 mb-3">
                    {prog1Title}
                  </h3>
                  <p className={`text-xs text-muted-foreground leading-relaxed mb-4 whitespace-pre-line ${alignToClass(settings.text_align)}`}>
                    {prog1Desc}
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground border-t border-border/20 pt-3">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-text shrink-0" />
                      <span>Rueda de descriptores y fichas técnicas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-accent-text shrink-0" />
                      <span>Duración: 2.5 horas</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Programa 2: Manejo y Técnica Apícola */}
              <div className="rounded-2xl border border-border/30 bg-surface-raised/30 p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text mb-4">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="text-[0.65rem] uppercase tracking-wider text-accent-text font-medium">
                    Manejo Respetuoso
                  </span>
                  <h3 className="font-display text-2xl font-light text-foreground mt-1 mb-3">
                    {prog2Title}
                  </h3>
                  <p className={`text-xs text-muted-foreground leading-relaxed mb-4 whitespace-pre-line ${alignToClass(settings.text_align)}`}>
                    {prog2Desc}
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground border-t border-border/20 pt-3">
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent-text shrink-0" />
                      <span>Seguridad práctica y uso del velo</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-accent-text shrink-0" />
                      <span>Jornada de 4 a 6 horas</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Programa 3: Botánica Austral */}
              <div className="rounded-2xl border border-border/30 bg-surface-raised/30 p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text mb-4">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <span className="text-[0.65rem] uppercase tracking-wider text-accent-text font-medium">
                    Ecología del Bosque
                  </span>
                  <h3 className="font-display text-2xl font-light text-foreground mt-1 mb-3">
                    {prog3Title}
                  </h3>
                  <p className={`text-xs text-muted-foreground leading-relaxed mb-4 whitespace-pre-line ${alignToClass(settings.text_align)}`}>
                    {prog3Desc}
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground border-t border-border/20 pt-3">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-text shrink-0" />
                      <span>Melisopalinología aplicada a origen</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-accent-text shrink-0" />
                      <span>Duración: 3 horas</span>
                    </li>
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
                <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-2">
                  Convocatorias Abiertas
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground">
                  Próximas fechas programadas
                </h2>
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
        <section id="solicitud" className="py-20 md:py-28 px-4 border-b border-border/20">
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
