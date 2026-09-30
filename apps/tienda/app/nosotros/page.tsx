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
import { claimsTrianguladas, DISCLAIMER_LEY_20606 } from '@enjambre/ciencia';
import { createClient } from '@/utils/supabase/server';
import { isNucleoStaffRole } from '@/lib/shop/staff-roles';
import { getNucleoAppUrl } from '@/lib/shop/nucleo-app-url';

// Evidencia pública = SOLO claims triangulados del catálogo @enjambre/ciencia.
// Un claim sin fuente verificada (estado pendiente/retirado) no existe aquí:
// es estructuralmente imposible renderizarlo.
const EVIDENCIA_CIENTIFICA = claimsTrianguladas().map((c) => ({
  categoria: 'Composición y origen',
  titulo: c.titulo,
  texto: c.texto,
  fuente: c.fuente,
}));

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
      'Nuestra presencia en el bosque nativo de Chiloé y el compromiso con la abeja virgen — La Obrera y el Zángano.',
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
      ? 'Our presence in the native rainforest of Chiloé and dedication to the wild bee.'
      : 'Nuestra presencia en el bosque nativo de Chiloé y el compromiso con la abeja virgen.');
  const heroImage =
    (typeof nosotrosSettings.hero_image === 'string' && nosotrosSettings.hero_image) ||
    (typeof cms?.image === 'string' && (cms.image.startsWith('http') || cms.image.startsWith('/')) ? cms.image : null) ||
    '/assets/editorial/nosotros-hero.jpg';
  const historia = resolveLocalized(cms?.historia, cms?.historia_en, locale) || null;
  const fuentesIntro =
    resolveLocalized(cms?.fuentes_intro, cms?.fuentes_intro_en, locale) ||
    (locale === 'en'
      ? 'The following notes provide bibliographic context on honey and native flora. They do not constitute therapeutic indication or Minsal labeling (Law 20.606). The food is presented by its standard of origin and beekeeping mastery. Contextualized to Pureo, Yerba Loza and apiaries across Chiloé:'
      : 'Las notas que siguen son contexto bibliográfico sobre miel y flora nativa. No son indicación terapéutica ni rotulado Minsal (Ley 20.606). El alimento se presenta por su estándar de origen y técnica apícola. Contextualizadas a Pureo, Yerba Loza y apiarios de Chiloé:');
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

  // Stats: etiqueta/valor desde CMS con fallback a los valores actuales
  const statDefs = [
    { label: locale === 'en' ? 'Years in the Forest' : 'Años en el Bosque', value: '22' },
    { label: locale === 'en' ? 'Reference GI (lit.)' : 'IG de referencia (lit.)', value: '55' },
    { label: locale === 'en' ? 'Cold Maturation' : 'Maduración en Frío', value: '48h' },
    { label: locale === 'en' ? 'Native Rainforest' : 'Bosque Nativo', value: '100%' },
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
      ? 'The glycemic index is a literature reference value (see /ciencia), not a nutritional seal for this jar (Law 20.606).'
      : 'El índice glucémico es un valor de referencia de literatura (ver /ciencia), no un sello nutricional de este frasco (Ley 20.606).');

  // CTA final de página configurable
  const ctaKicker = resolveLocalized(nosotrosSettings.cta_kicker, nosotrosSettings.cta_kicker_en, locale);
  const ctaTitle = resolveLocalized(nosotrosSettings.cta_title, nosotrosSettings.cta_title_en, locale);
  const ctaLabel = resolveLocalized(nosotrosSettings.cta_label, nosotrosSettings.cta_label_en, locale) ||
    (locale === 'en' ? 'Explore Catalog' : 'Explorar Catálogo');
  const ctaHref = nosotrosSettings.cta_href || '/catalogo';
  const nucleoAppUrl = getNucleoAppUrl();

  // Evidencia pública = SOLO claims triangulados del catálogo @enjambre/ciencia.
  // El CMS ya NO alimenta esta sección: un claim sin cita verificada no puede
  // salir al HTML (gate estructural; ver packages/ciencia + CIENCIA_PUBLICA.md).
  const gruposEvidencia = EVIDENCIA_CIENTIFICA.reduce<
    { categoria: string; evidencias: { titulo: string; texto: string; fuente: string }[] }[]
  >((acc, item) => {
    let group = acc.find((g) => g.categoria === item.categoria);
    if (!group) {
      group = { categoria: item.categoria, evidencias: [] };
      acc.push(group);
    }
    group.evidencias.push({ titulo: item.titulo, texto: item.texto, fuente: item.fuente });
    return acc;
  }, []);

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
        className="mx-auto max-w-5xl px-4 sm:px-8 pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] pb-16 lg:py-24"
      >
        {/* Hero */}
        <div data-cms-section="nosotros_settings" className="text-center mb-16 md:mb-20">
          {heroKicker ? (
            <span className="block text-[0.65rem] uppercase tracking-[0.4em] text-accent-text mb-6">
              {heroKicker}
            </span>
          ) : null}
          {heroTitle ? (
            <h1 className="font-display text-[clamp(2rem,7vw,4.5rem)] md:text-7xl font-light text-foreground mb-6 md:mb-8 text-balance">
              {heroTitle}
            </h1>
          ) : null}
          {heroDesc ? (
            <p className={`text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-pretty whitespace-pre-line ${alignToClass(nosotrosSettings.text_align)}`}>
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
<p className="text-lg md:text-xl leading-relaxed text-muted-foreground whitespace-pre-line text-left">
En términos generales, hacemos que la miel de Chiloé sea un puente entre el bosque nativo y una mesa consciente. La recolectamos en bosques antiguos y regenerados; el néctar llega crudo, batido en frío, con el perfil de las floraciones de ulmo y tepú. Cada frasco es un alimento de origen, no un medicamento ni un sustituto etiquetado de azúcar.

En &ldquo;La Obrera y el Zángano&rdquo;, hacemos que este puente invite a un consumo consciente, sencillo y lujoso, que fusiona ciencia con existencia.
</p>

<h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-12 mb-6 text-balance">Renacer de las Cenizas en Chiloé</h2>
<p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line text-left">
Hace 22 años iniciamos la recuperación forestal en un predio erosionado por incendios históricos en Pureo, Chiloé. Con paciencia y selección cuidada, reintrodujimos doseles de ulmo, tepú, tiaca y avellano chileno hasta conformar un refugio vivo de bosque templado lluvioso. En este entorno aislado, las colmenas recolectan néctar silvestre libre de agroquímicos, transformándolo en una miel cruda, ámbar y de textura cremosa natural.

Nuestra labor no persigue la extracción masiva, sino preservar la cadencia viva del territorio: un alimento noble que nace de la floración nativa y se proyecta como estándar de origen. De la recuperación del suelo en Pureo a los batidos en frío de ulmo-tepú, el proceso es pausado y riguroso. Preferimos la miel viva del bosque al azúcar industrial; esa elección responde a la pureza sensorial y a la maestría apícola, no a una promesa clínica.
</p>

<h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-12 mb-6 text-balance">Sincronía con los Ritmos del Bosque Austral</h2>
<p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line text-left">
En Chiloé, trabajamos colaborativamente con nuestras colmenas, son sociedades complejas y sincronizadas al ritmo de las estaciones, al ritmo del sol. Cada verano es un nuevo comienzo en la recolección de miel.

Luego, innovamos con formatos mínimos: sachets de 15 g, frascos de 150 g o 900 g. Cada uno invita a un acto cotidiano —una cucharada, un té, un desayuno— con el sabor del bosque, no con una promesa clínica.
</p>

<h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-12 mb-6 text-balance">Formatos</h2>
<p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line text-left">
Sachets, frascos de 150 g y 900 g, a veces con avellana, polen o cacao nibs. Alimento de Chiloé.

<strong>Sachets:</strong> 15 g de crema con avellana o polen, para llevar.

<strong>Miel virgen en panal:</strong> sellada como sale de la colmena.

<strong>Frascos:</strong> 150 g o 900 g de crema ulmo-tepú.

<strong>Cajas de sachets:</strong> 25 unidades. Precio publicado en el catálogo.

<strong>Suscripciones:</strong> al ritmo de la floración; detalle en Club Legado del Bosque.
</p>

<h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-12 mb-6 text-balance">Compromiso con la Regeneración</h2>
<p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line text-left">
Desde el sur del planeta, promovemos agroecología en ferias locales y el cuidado de los polinizadores. La miel es el fruto de esa relación con el bosque, no un tratamiento.
</p>

<h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-12 mb-6 text-balance">Dónde va</h2>
<p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line text-left">
Cada frasco sale de apiarios entre Pureo, Quemchi y Queilén. Los sachets también se usan como amenities en hoteles que piden origen, no un slogan.

El catálogo y el Club Legado del Bosque están abiertos. La ciencia y los límites del impacto, en /ciencia.
</p>

{/* Fuentes Section */}
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

{/* Evidencia Científica — CMS 'ciencia' agrupada por categoría (fallback: array hardcodeado) */}
<div id="evidencia" className="scroll-mt-24 border-t border-border pt-16 mb-24">
  <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mb-8 text-center text-balance">
    Evidencia Científica
  </h2>
  {gruposEvidencia.map((g) => (
    <div key={g.categoria} className="mb-10">
      <h3 className="font-display text-xl font-medium text-foreground mb-4 text-center">
        {g.categoria}
      </h3>
      <div className="flex flex-wrap justify-center gap-4">
        {g.evidencias.map((e, i) => (
          <div
            key={`${g.categoria}-${i}`}
            className="rounded-xl border border-border/40 bg-surface-raised p-5 flex flex-col justify-between w-full md:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] max-w-sm"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">{e.titulo}</p>
              <p className={`mt-2 text-sm text-muted-foreground text-left whitespace-pre-line ${alignToClass(nosotrosSettings.text_align)}`}>{e.texto}</p>
            </div>
            <span className="mt-3 inline-block text-[0.6rem] uppercase tracking-[0.2em] text-accent-text">
              {e.fuente}
            </span>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>

{/* Mission */}
<div className="border-t border-border pt-16 mb-24">
<h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mb-8 text-center text-balance">
{misionTitle}
</h2>
<p className={`text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-12 text-pretty whitespace-pre-line ${alignToClass(nosotrosSettings.text_align)}`}>
{mision ?? (locale === 'en'
  ? 'At La Obrera y el Zángano, we cultivate a deep bond between pristine ancient rainforests and mindful living, offering our raw Creamed Honey forged from ulmo, tepú, and native canopy trees of Chiloé.'
  : 'En La Obrera y el Zángano, buscamos fomentar y transformar el consumo de Miel en un acto de existencialismo saludable y cósmico, ofreciendo para esto nuestra Crema de Miel, forjada a partir de los ulmos, tepús y otros árboles antiguos y únicos del bosque nativo al sur del planeta, en Pureo, Queilen y otros entornos de Chiloé.')}
</p>
</div>

{/* Vision */}
<div className="border-t border-border pt-16 mb-24">
<h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mb-8 text-center text-balance">
{visionTitle}
</h2>
<p className={`text-lg text-muted-foreground text-center max-w-3xl mx-auto text-pretty whitespace-pre-line ${alignToClass(nosotrosSettings.text_align)}`}>
{vision ?? (locale === 'en'
  ? 'We interconnect native bees, pristine ecosystems, human stewardship, and mindful vitality. We craft raw creamed honey of sublime, velvety texture, capturing the pure living essence of the Patagonian temperate rainforest.'
  : 'Interconectamos la Miel, las abejas, nosotros como humanos y toda la complejidad natural de la tierra como planeta en medio del cosmos. Vemos energía y cultura, creada directa desde el sol, que nutre y regenera. Damos cuenta a través de nuestra historia y procesos con los que logramos la posibilidad de ofrecer nuestra Crema de Miel, color blanco cremoso, sublime y suave.')}
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
