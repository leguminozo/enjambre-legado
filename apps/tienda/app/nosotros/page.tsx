import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { getSiteContentBatch } from '@/lib/cms';
import { parseNosotrosSettings, resolveLocalized, alignToClass } from '@/lib/shop/store-chrome';
import { articleJsonLd, breadcrumbJsonLd, mergeJsonLd } from '@/lib/shop/json-ld';
import { JsonLd } from '@/components/ui/JsonLd';
import { ArrowRight, Edit3 } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { isNucleoStaffRole } from '@/lib/shop/staff-roles';
import { getNucleoAppUrl } from '@/lib/shop/nucleo-app-url';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

const aspectClassMap: Record<string, string> = {
  '16/10': 'aspect-[16/10]',
  '16/9': 'aspect-[16/9]',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
  '3/4': 'aspect-[3/4]',
  'auto': 'aspect-auto',
};

import { createPageMetadata } from '@/lib/shop/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata('/nosotros', {
    title: 'Nosotros · Trayectoria y Vínculo',
    description:
      'Presencia en el bosque nativo de Chiloé, estándar de recolección apícola y regeneración territorial — La Obrera y el Zángano.',
    ogType: 'article',
  });
}

export default async function NosotrosPage({
  searchParams,
}: {
  searchParams: Promise<{ cms_preview?: string }>;
}) {
  const draft = (await searchParams).cms_preview === '1';
  const supabase = await createClient();
  const [{ data: { user } }, [batch, locale]] = await Promise.all([
    supabase.auth.getUser(),
    Promise.all([
      getSiteContentBatch(['nosotros', 'nosotros_settings'], { draft }),
      getLocale(),
    ]),
  ]);
  const staffRole = (user?.app_metadata?.role as string | undefined) ?? null;
  const isStaff = isNucleoStaffRole(staffRole);

  const cmsRows = batch.nosotros ?? [];
  const nosotrosSettings = parseNosotrosSettings((batch.nosotros_settings?.[0]?.content as Record<string, unknown>) ?? null);

  const cms = cmsRows[0]?.content as Record<string, string | undefined> | undefined;
  const heroKicker =
    resolveLocalized(nosotrosSettings.kicker, nosotrosSettings.kicker_en, locale) ||
    (locale === 'en' ? 'Our Story' : 'Nuestra Historia');
  const heroTitle =
    resolveLocalized(nosotrosSettings.title, nosotrosSettings.title_en, locale) ||
    resolveLocalized(cms?.title, cms?.title_en, locale) ||
    (locale === 'en' ? 'Journey and Legacy' : 'Trayectoria y Vínculo');
  const heroDesc =
    resolveLocalized(nosotrosSettings.subtitle, nosotrosSettings.subtitle_en, locale) ||
    resolveLocalized(cms?.desc, cms?.desc_en, locale) ||
    (locale === 'en'
      ? 'Our presence in the native rainforest of Chiloé and standard of origin beekeeping.'
      : 'Nuestra presencia en el bosque nativo de Chiloé y estándar de recolección apícola.');
  const heroImage =
    (typeof nosotrosSettings.hero_image === 'string' && nosotrosSettings.hero_image) ||
    (typeof cms?.image === 'string' && (cms.image.startsWith('http') || cms.image.startsWith('/')) ? cms.image : null) ||
    '/assets/editorial/nosotros-hero.jpg';
  const historia = resolveLocalized(cms?.historia, cms?.historia_en, locale) || null;
  const fuentesIntro =
    resolveLocalized(cms?.fuentes_intro, cms?.fuentes_intro_en, locale) ||
    (locale === 'en'
      ? 'The following notes provide bibliographic context on honey and native flora. They do not constitute therapeutic indication or medical claims. The food is presented strictly by its standard of origin and beekeeping technique. Full laboratory analyses and sensory protocols in /ciencia:'
      : 'Las notas que siguen son contexto bibliográfico sobre miel y flora nativa. No constituyen indicación terapéutica ni rotulado medicinal. El alimento se presenta por su estándar de origen y técnica apícola. Análisis completos de laboratorio y protocolo sensorial en /ciencia:');
  const misionTitle =
    resolveLocalized(cms?.mision_title, cms?.mision_title_en, locale) ||
    (locale === 'en' ? 'Our Mission' : 'Nuestra Misión');
  const mision = resolveLocalized(cms?.mision, cms?.mision_en, locale) || null;
  const visionTitle =
    resolveLocalized(cms?.vision_title, cms?.vision_title_en, locale) ||
    (locale === 'en' ? 'Our Vision' : 'Nuestra Visión');
  const vision = resolveLocalized(cms?.vision, cms?.vision_en, locale) || null;

  const aspectClass = aspectClassMap[nosotrosSettings.image_aspect_ratio] || 'aspect-[16/9]';
  const fitClass = nosotrosSettings.image_fit === 'contain' ? 'object-contain p-4' : 'object-cover';

  // Stats: etiqueta/valor desde CMS con fallback a cifras verificadas
  const statDefs = [
    { label: locale === 'en' ? 'Years of Presence' : 'Años de Presencia', value: '22' },
    { label: locale === 'en' ? 'Melliferous Species' : 'Especies Melíferas', value: '18+' },
    { label: locale === 'en' ? 'Cold-creamed' : 'Batido en Frío', value: '48h' },
    { label: locale === 'en' ? 'Native Forest' : 'Bosque Nativo*', value: '100%' },
  ];
  const stats = statDefs.map((s, i) => {
    const rawLabel = resolveLocalized(
      cms?.[`stat${i + 1}_label`],
      cms?.[`stat${i + 1}_label_en`],
      locale,
    );
    const rawVal =
      typeof cms?.[`stat${i + 1}_value`] === 'string' &&
      (cms[`stat${i + 1}_value`] as string).trim()
        ? (cms[`stat${i + 1}_value`] as string)
        : s.value;
    return {
      label: rawLabel || s.label,
      value: rawVal,
    };
  });
  const statsDisclaimer =
    resolveLocalized(cms?.stats_disclaimer, cms?.stats_disclaimer_en, locale) ||
    (locale === 'en'
      ? '* 100% native forest: apiaries situated strictly within native canopy enclosures in Chiloé, without agrochemical exposure. See /ciencia.'
      : '* 100% bosque nativo: colmenas emplazadas exclusivamente en predios rodeados de dosel autóctono en Chiloé, sin cultivos industriales ni agroquímicos. Ver detalles analíticos en /ciencia.');

  // CTA final de página configurable
  const ctaKicker = resolveLocalized(nosotrosSettings.cta_kicker, nosotrosSettings.cta_kicker_en, locale);
  const ctaTitle = resolveLocalized(nosotrosSettings.cta_title, nosotrosSettings.cta_title_en, locale);
  const ctaLabel = resolveLocalized(nosotrosSettings.cta_label, nosotrosSettings.cta_label_en, locale) ||
    (locale === 'en' ? 'Explore Catalog' : 'Explorar Catálogo');
  const ctaHref = nosotrosSettings.cta_href || '/catalogo';
  const nucleoAppUrl = getNucleoAppUrl();

  const nosotrosJsonLd = mergeJsonLd([
    articleJsonLd({
      headline: 'Renacer de las Cenizas en Chiloé',
      description:
        '22 años de regeneración en Chiloé. Apicultura regenerativa, reforestación nativa y miel cruda del bosque valdiviano.',
      url: `${SITE_URL}/nosotros`,
      datePublished: '2025-07-02',
    }),
    breadcrumbJsonLd([
      { name: 'Inicio', href: '/' },
      { name: 'Nuestra Historia', href: '/nosotros' },
    ]),
  ]);

  return (
    <StoreShell>
      <ShopHeader />
      <JsonLd data={nosotrosJsonLd} />
      <main
        data-cms-section="nosotros"
        className="mx-auto max-w-6xl px-4 sm:px-8 pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] pb-16 lg:py-24"
      >
        {/* Hero */}
        <div data-cms-section="nosotros_settings" className="text-center mb-16 md:mb-20">
          {heroKicker ? (
            <span className="block text-[0.65rem] uppercase tracking-[0.4em] text-accent-text mb-6">
              {heroKicker}
            </span>
          ) : null}
          {heroTitle ? (
            <h1 className="font-display text-[clamp(2rem,6.5vw,4.5rem)] md:text-6xl lg:text-7xl font-light text-foreground mb-6 md:mb-8 text-balance max-w-4xl lg:max-w-5xl mx-auto leading-[1.08]">
              {heroTitle}
            </h1>
          ) : null}
          {heroDesc ? (
            <p className={`text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl lg:max-w-4xl mx-auto text-pretty whitespace-pre-line leading-relaxed ${alignToClass(nosotrosSettings.text_align)}`}>
              {heroDesc}
            </p>
          ) : null}
          {heroImage ? (
            <div className={`relative ${aspectClass} max-w-4xl mx-auto mt-8 rounded-[var(--tienda-radius,0.5rem)] overflow-hidden border border-border/30`}>
              <Image
                src={heroImage}
                alt={heroTitle || 'Nosotros'}
                fill
                sizes="(max-width: 1024px) 100vw, 896px"
                className={fitClass}
                style={{ opacity: (nosotrosSettings.hero_image_opacity ?? 100) / 100 }}
              />
            </div>
          ) : null}
        </div>

{/* Main Story - Texto completo (CMS 'historia' con fallback al texto hardcodeado) */}
{historia ? (
  <div className="prose prose-lg prose-invert max-w-none mb-24">
    <p className={`text-lg md:text-xl leading-relaxed text-muted-foreground whitespace-pre-line text-left ${alignToClass(nosotrosSettings.text_align)}`}>
      {historia}
    </p>
    <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-12 mb-6 text-balance">Fuentes</h2>
    <p className="text-lg leading-relaxed text-muted-foreground text-left">
      {fuentesIntro}
    </p>
    <div className="mt-12 flex justify-center">
      <a
        href="#evidencia"
        className="group relative inline-flex min-h-12 items-center justify-center px-8 py-4 border border-accent text-accent-text uppercase tracking-[0.2em] text-xs hover:bg-accent hover:text-accent-foreground transition-all duration-500"
      >
        Ver Evidencia Científica
      </a>
    </div>
  </div>
) : null}
<div className={`prose prose-lg prose-invert max-w-none mb-24 ${historia ? 'hidden' : ''}`}>
  <div className="text-sm text-accent-text uppercase tracking-[0.2em] mb-4">Crónica de Territorio y Origen</div>

  <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-8 mb-4 text-balance">
    2004 · El Terreno y las Cenizas
  </h2>
  <p className="text-base sm:text-lg leading-relaxed text-muted-foreground whitespace-pre-line text-left">
    En 2004, Cristina Miranda Bahamonde y su familia llegaron al sector de Pureo, en la comuna de Queilén, Chiloé. El predio presentaba una marcada erosión tras los incendios que afectaron históricamente la cordillera de la Costa chilota, dejando laderas desnudas cubiertas por matorral de rebrote y suelo expuesto a la intemperie marítima del golfo Corcovado.
  </p>

  <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-10 mb-4 text-balance">
    2006–2010 · La Primera Plantación
  </h2>
  <p className="text-base sm:text-lg leading-relaxed text-muted-foreground whitespace-pre-line text-left">
    Durante cuatro temporadas se inició la recuperación forestal mediante enriquecimiento botánico manual. A partir de semillas y plántulas recolectadas en quebradas húmedas protegidas, se reintrodujeron doseles de ulmo (<em>Eucryphia cordifolia</em>), tepú (<em>Tepualia stipularis</em>), tiaca (<em>Caldcluvia paniculata</em>), avellano chileno (<em>Gevuina avellana</em>) y canelo (<em>Drimys winteri</em>), devolviendo la cobertura vegetal que retiene la humedad y estabiliza el suelo.
  </p>

  <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-10 mb-4 text-balance">
    2012 · La Primera Colmena
  </h2>
  <p className="text-base sm:text-lg leading-relaxed text-muted-foreground whitespace-pre-line text-left">
    En 2012 se instalaron los primeros núcleos de abeja melífera (<em>Apis mellifera</em>) en el predio. El manejo apícola en Chiloé demandó una técnica adaptada a la alta pluviosidad insular: alzas ventiladas, monitoreo sanitario estricto sin residuos en cera, y la decisión de prescindir de alimentación artificial con jarabes de azúcar durante los flujos de néctar para asegurar la autenticidad botánica.
  </p>

  <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-10 mb-4 text-balance">
    Hoy · Censo, Origen y Maestría Apícola
  </h2>
  <p className="text-base sm:text-lg leading-relaxed text-muted-foreground whitespace-pre-line text-left">
    Hoy el predio alberga apiarios en producción y más de 18 especies melíferas nativas identificadas. La recolección se realiza en frío: la miel se desoperculariza y se somete a un batido mecánico controlado (48 horas a temperatura ambiente de 14 °C a 18 °C) que orienta la cristalización natural hacia una textura cremosa sedosa, sin pasteurización ni aditivos. Cada lote cuenta con análisis físico-químico documental (humedad &lt;18%, HMF según norma Codex) y pasaporte digital verificable.
  </p>

  <div className="mt-12 not-prose rounded-2xl border border-border/40 bg-surface-raised/40 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
      <h3 className="font-display text-xl font-light text-foreground mb-1">
        Evidencia Científica & Protocolo Sensorial
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground">
        Curvas de floración observadas, límites analíticos por lote y metodología ST-CATA documentados en detalle.
      </p>
    </div>
    <Link
      href="/ciencia"
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-accent bg-accent/10 px-6 text-xs font-semibold uppercase tracking-wider text-accent-text hover:bg-accent hover:text-accent-foreground transition-all shrink-0"
    >
      <span>Explorar /ciencia</span>
      <ArrowRight className="w-3.5 h-3.5" />
    </Link>
  </div>
</div>

{/* Mission */}
<div className="border-t border-border pt-16 mb-24">
  <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mb-8 text-center text-balance">
    {misionTitle}
  </h2>
  <p className={`text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-12 text-pretty whitespace-pre-line ${alignToClass(nosotrosSettings.text_align)}`}>
    {mision ?? (locale === 'en'
      ? 'At La Obrera y el Zángano, we cultivate a direct bridge between the native temperate rainforest and daily tables, offering raw honey extracted and cold-creamed from ulmo, tepú, and ancient canopy trees of Chiloé.'
      : 'En La Obrera y el Zángano, acercamos la miel cruda de Chiloé como un estándar de origen territorial y maestría apícola, elaborada a partir de ulmos, tepús y doseles del bosque templado lluvioso en Pureo y Queilén.')}
  </p>
</div>

{/* Vision */}
<div className="border-t border-border pt-16 mb-24">
  <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mb-8 text-center text-balance">
    {visionTitle}
  </h2>
  <p className={`text-lg text-muted-foreground text-center max-w-3xl mx-auto text-pretty whitespace-pre-line ${alignToClass(nosotrosSettings.text_align)}`}>
    {vision ?? (locale === 'en'
      ? 'We uphold beekeeping mastery in harmony with native flora, climate, and the biology of the honeybee, preserving the living cadence of Chiloé through rigorous batch-by-batch traceability.'
      : 'Consolidamos una apicultura de alta precisión y respeto por la abeja melífera y la flora nativa, resguardando la cadencia viva de Chiloé a través de trazabilidad verificable de lote a lote.')}
  </p>
</div>

{/* Stats — etiqueta/valor desde CMS con fallback */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-border pt-16">
  {stats.map((s) => (
    <div key={s.label} className="text-center">
      <div className="font-display text-4xl md:text-5xl text-accent-text mb-2">{s.value}</div>
      <div className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">{s.label}</div>
    </div>
  ))}
</div>
<p className="mt-4 text-xs text-muted-foreground text-center max-w-2xl mx-auto">
  {statsDisclaimer}
</p>

{/* CTA Cierre de Página — configurable desde el CMS para redirigir donde se desee */}
{ctaLabel ? (
  <section className="border-t border-border pt-16 mt-16 text-center">
    {ctaKicker ? (
      <span className="block text-[0.65rem] uppercase tracking-[0.3em] text-accent-text mb-3">
        {ctaKicker}
      </span>
    ) : null}
    {ctaTitle ? (
      <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground mb-6 text-balance">
        {ctaTitle}
      </h2>
    ) : null}
    <div className="flex justify-center">
      <Link
        href={ctaHref}
        className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-accent bg-accent/10 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent-text transition hover:bg-accent hover:text-accent-foreground cursor-pointer"
      >
        <span>{ctaLabel}</span>
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  </section>
) : null}

{/* Atajo de administración directo a Editor Tienda en Núcleo */}
{isStaff && nucleoAppUrl ? (
  <div className="mt-12 flex justify-center">
    <a
      href={`${nucleoAppUrl}/editor-tienda?section=nosotros`}
      className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface-raised px-4 py-2 text-xs font-mono text-muted-foreground transition hover:border-accent hover:text-accent-text"
      title="Editar esta sección directamente en Núcleo"
    >
      <Edit3 size={13} />
      <span>Editar página en Editor Tienda (Núcleo)</span>
    </a>
  </div>
) : null}
</main>
<ShopFooter /></StoreShell>
);
}
