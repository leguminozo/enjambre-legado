import type { Metadata } from 'next';
import {
  ChevronDown,
  Calendar,
  Users,
  MapPin,
  Clock,
  Shield,
  Layers,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { getLocale } from 'next-intl/server';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { EditorialHero } from '@/components/shop/editorial-hero';
import { JsonLd } from '@/components/ui/JsonLd';
import { breadcrumbJsonLd, faqJsonLd, mergeJsonLd } from '@/lib/shop/json-ld';
import { FLORACIONES_EXPERIENCE } from '@/lib/experiencias/content';
import { ExperienceInquiryForm } from '@/components/experiencias/experience-inquiry-form';
import { getSiteContent } from '@/lib/cms';
import { parseFloracionesExperienceSettings, resolveLocalized, alignToClass } from '@enjambre/shop-chrome';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export const metadata: Metadata = {
  title: 'Degustaciones & Cata: Mieles de Chile · La Obrera y el Zángano',
  description:
    'Cata sensorial guiada y degustación de mieles nativas de Chiloé para empresas y grupos privados. Conducido por Cristina Miranda en Santiago.',
  alternates: { canonical: `${SITE_URL}/experiencias/degustaciones` },
  openGraph: {
    title: 'Degustaciones & Cata: Mieles de Chile · La Obrera y el Zángano',
    description:
      'Cata sensorial y degustación de mieles nativas de Chiloé para empresas y grupos privados. Conducido por Cristina Miranda.',
    url: `${SITE_URL}/experiencias/degustaciones`,
    type: 'website',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
    images: [{ url: `${SITE_URL}${FLORACIONES_EXPERIENCE.heroImage}`, width: 1600, height: 900 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Degustaciones & Cata: Mieles de Chile · La Obrera y el Zángano',
    description:
      'Cata sensorial y degustación de mieles nativas de Chiloé para empresas y grupos privados. Conducido por Cristina Miranda.',
  },
};

function renderSpecText(value: string | undefined, defaultPrefix: string): string {
  if (!value) return '';
  let trimmed = value.trim();
  trimmed = trimmed.replace(
    /^(?:Espacio|Aforo|Duración|Enfoque|Modalidad|Cupo|Dónde|Space|Capacity|Duration|Focus|Location):\s*(?:Espacio|Aforo|Duración|Enfoque|Modalidad|Cupo|Dónde|Space|Capacity|Duration|Focus|Location):\s*/i,
    (m) => {
      const parts = m.split(':').map((s) => s.trim()).filter(Boolean);
      const prefix = parts[1] || parts[0];
      return `${prefix}: `;
    },
  );
  if (/^[^:]+:\s*.+$/.test(trimmed)) {
    return trimmed;
  }
  return `${defaultPrefix}: ${trimmed}`;
}

export default async function DegustacionesPage({
  searchParams,
}: {
  searchParams?: Promise<{ cms_preview?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const draft = resolvedParams.cms_preview === '1';

  const [rows, locale] = await Promise.all([
    getSiteContent('floraciones_experience_settings', { draft }),
    getLocale(),
  ]);
  const isEn = locale === 'en';
  const cmsContent = (rows?.[0]?.content as Record<string, unknown>) ?? null;
  const content = parseFloracionesExperienceSettings(cmsContent);

  const kicker = resolveLocalized(content.kicker, content.kicker_en, locale);
  const title = resolveLocalized(content.title, content.title_en, locale);
  const subtitle = resolveLocalized(content.subtitle, content.subtitle_en, locale);
  const editionNote = resolveLocalized(content.edition_note, content.edition_note_en, locale);
  const heroImage = content.hero_image || FLORACIONES_EXPERIENCE.heroImage;
  const biography = {
    name: content.bio_name,
    location: content.bio_location,
    trajectoryYears: content.bio_trajectory_years,
    paragraphs: content.bio_paragraphs,
    metrics: content.bio_metrics,
  };
  const movements = content.movements;
  const formats = content.formats;
  const deferredPurchaseProtocol = {
    headline: content.protocol_headline,
    description: content.protocol_description,
    artifact: content.protocol_artifact,
  };
  const faq = content.faq;

  const jsonLdData = mergeJsonLd([
    breadcrumbJsonLd([
      { name: 'Inicio', href: '/' },
      { name: 'Experiencias', href: '/experiencias' },
      { name: title, href: '/experiencias/degustaciones' },
    ]),
    faqJsonLd(faq),
  ]);

  return (
    <StoreShell>
      <ShopHeader />
      <JsonLd data={jsonLdData} />

      <main
        data-cms-section="floraciones_experience_settings"
        className="min-h-[var(--vh-full)] bg-background"
      >
        {/* ── Hero Cinemático & Editorial ── */}
        <EditorialHero
          sectionKey="floraciones_experience_settings"
          kicker={kicker}
          badge={editionNote}
          title={title}
          subtitle={subtitle}
          imageUrl={heroImage}
          imageOpacity={content.hero_image_opacity ?? 35}
          imageAlt="Apiario y bosque nativo en Pureo, Chiloé"
          align={content.text_align}
          ctaLabel="Solicitar fecha privada"
          ctaHref="#solicitud"
          secondaryCtaLabel="Estructura de la sesión"
          secondaryCtaHref="#movimientos"
          preferAnchor
        />

        {/* ── Cristina Miranda / El Activo Biográfico ── */}
        <section className="py-16 md:py-24 px-4 border-b border-border/20 bg-surface-raised/20">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-5">
                <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-2">
                  Quién conduce la sesión
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-light text-foreground">
                  {biography.name}
                </h2>
                <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-accent-text shrink-0" />
                  <span>{biography.location}</span>
                </p>

                <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border/20 pt-6">
                  {biography.metrics.map((m) => (
                    <div key={m.label}>
                      <div className="font-display text-2xl text-foreground">{m.value}</div>
                      <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-0.5">
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`md:col-span-7 space-y-4 text-sm text-muted-foreground leading-relaxed ${alignToClass(content.text_align)}`}>
                {biography.paragraphs.map((p, idx) => (
                  <p key={idx} className="whitespace-pre-line">{p}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Los 4 Movimientos de la Sesión ── */}
        <section id="movimientos" className="py-20 md:py-28 px-4 border-b border-border/20 scroll-mt-28 md:scroll-mt-36">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-3">
                Protocolo sensorial
              </span>
              <h2 className="font-display text-[clamp(1.75rem,5vw,2.75rem)] font-light text-foreground text-balance">
                Cuatro movimientos de la sesión
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Una secuencia metódica de 90 a 120 minutos diseñada para evitar la fatiga gustativa y profundizar
                en el origen botánico de cada miel.
              </p>
            </div>

            <div className="space-y-6">
              {movements.map((m) => (
                <div
                  key={m.step}
                  className="rounded-2xl border border-border/30 bg-surface-raised/30 p-6 sm:p-8 hover:border-border/60 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 mb-3">
                    <span className="font-mono text-xs uppercase tracking-widest text-accent-text">
                      Movimiento {m.step}
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl font-light text-foreground">
                      {m.title}
                    </h3>
                  </div>

                  <p className={`text-sm text-muted-foreground leading-relaxed mb-5 whitespace-pre-line ${alignToClass(content.text_align)}`}>
                    {m.description}
                  </p>

                  <div className="border-t border-border/20 pt-4">
                    <div className="text-[0.65rem] uppercase tracking-wider text-accent-text mb-2.5">
                      Elementos en mesa
                    </div>
                    <ul className="grid sm:grid-cols-3 gap-2">
                      {m.elements.map((el, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed"
                        >
                          <span className="text-accent-text/60 mt-0.5">•</span>
                          <span>{el}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Principio de No-Comercialización & Cierre Diferido ── */}
        <section className="py-16 px-4 border-b border-border/20 bg-surface-raised/30">
          <div className="max-w-3xl mx-auto rounded-2xl border border-border/30 bg-background/70 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <Shield className="w-5 h-5 text-accent-text shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display text-lg sm:text-xl font-light text-foreground mb-2">
                  {deferredPurchaseProtocol.headline}
                </h3>
                <p className={`text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4 whitespace-pre-line ${alignToClass(content.text_align)}`}>
                  {deferredPurchaseProtocol.description}
                </p>
                <div className="flex items-center gap-2 text-[0.7rem] text-accent-text uppercase tracking-wider border-t border-border/20 pt-3">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{deferredPurchaseProtocol.artifact}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Formatos Disponibles ── */}
        <section className="py-20 md:py-28 px-4 border-b border-border/20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-3">
                Formatos
              </span>
              <h2 className="font-display text-[clamp(1.75rem,5vw,2.75rem)] font-light text-foreground text-balance">
                Modalidades de encuentro
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {formats.map((f) => {
                const rawCta = ('cta_label' in f && typeof (f as { cta_label?: unknown }).cta_label === 'string')
                  ? resolveLocalized((f as { cta_label?: string }).cta_label, (f as { cta_label_en?: string }).cta_label_en, locale)
                  : '';
                const ctaText = rawCta || (
                  f.id === 'estacion_origen'
                    ? (locale === 'en' ? 'Check availability' : 'Consultar disponibilidad')
                    : (locale === 'en' ? 'Inquire about this format' : 'Cotizar esta modalidad')
                );

                return (
                  <div
                    key={f.id}
                    id={f.id === 'estacion_origen' ? 'estacion-origen' : undefined}
                    className="rounded-2xl border border-border/30 bg-surface-raised/30 p-6 sm:p-8 flex flex-col justify-between hover:border-accent/30 transition-colors"
                  >
                    <div>
                      <span className="block text-[0.65rem] uppercase tracking-wider text-accent-text mb-2">
                        {f.kicker}
                      </span>
                      <h3 className="font-display text-2xl font-light text-foreground mb-3">
                        {f.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                        {f.summary}
                      </p>

                      <div className="space-y-2 border-y border-border/20 py-4 mb-6 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-accent-text shrink-0" />
                          <span>{renderSpecText(f.capacity, isEn ? 'Capacity' : 'Aforo')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-accent-text shrink-0" />
                          <span>{renderSpecText(f.duration, isEn ? 'Duration' : 'Duración')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-accent-text shrink-0" />
                          <span>{renderSpecText(f.context, isEn ? 'Space' : 'Espacio')}</span>
                        </div>
                      </div>

                      <div className="text-[0.65rem] uppercase tracking-wider text-accent-text mb-3">
                        {isEn ? 'What is included' : 'Qué incluye'}
                      </div>
                      <ul className="space-y-2 mb-8">
                        {f.includes.map((inc, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed"
                          >
                            <span className="text-accent-text mt-0.5">•</span>
                            <span>{inc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <a
                      href="#solicitud"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border/40 bg-surface-raised/60 px-5 text-xs font-semibold uppercase tracking-wider text-foreground hover:border-accent hover:text-accent-text transition-colors"
                    >
                      <span>{ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Formulario de Solicitud Directa ── */}
        <section id="solicitud" className="py-20 md:py-28 px-4 border-b border-border/20 scroll-mt-28 md:scroll-mt-36">
          <div className="max-w-2xl mx-auto">
            <ExperienceInquiryForm initialFormat="corporativo" />
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20 px-4 border-b border-border/20 bg-surface-raised/20">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-2">
                Preguntas frecuentes
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground text-balance">
                Aspectos técnicos y operativos
              </h2>
            </div>

            <div className="space-y-3">
              {faq.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-xl border border-border/30 bg-surface-raised/40 overflow-hidden"
                >
                  <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-foreground font-display text-base sm:text-lg font-light list-none">
                    {item.question}
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-6 pb-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pie Editorial ── */}
        <section className="py-12 px-4 text-center">
          <div className="max-w-xl mx-auto">
            <p className="text-xs text-muted-foreground">
              La Obrera y el Zángano · Pureo, Queilén, Chiloé & Santiago de Chile.
            </p>
            <p className="text-[0.7rem] text-muted-foreground/60 mt-1">
              Coordinación institucional: +56 9 4083 1358 · obrerayzangano@gmail.com
            </p>
          </div>
        </section>
      </main>

      <ShopFooter />
    </StoreShell>
  );
}
