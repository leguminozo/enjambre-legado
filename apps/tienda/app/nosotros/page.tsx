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
      getSiteContentBatch(['nosotros', 'nosotros_settings', 'galeria'], { draft }),
      getLocale(),
    ]),
  ]);
  const staffRole = (user?.app_metadata?.role as string | undefined) ?? null;
  const isStaff = isNucleoStaffRole(staffRole);

  const cmsRows = batch.nosotros ?? [];
  const nosotrosSettings = parseNosotrosSettings((batch.nosotros_settings?.[0]?.content as Record<string, unknown>) ?? null);

  const rawGaleria = batch.galeria ?? [];
  const galeriaCmsItems = rawGaleria
    .map((row) => {
      const c = (row.content as Record<string, unknown>) ?? {};
      return {
        id: row.id,
        titulo: resolveLocalized(c.titulo as string, c.titulo_en as string, locale) || '',
        descripcion: resolveLocalized(c.descripcion as string, c.descripcion_en as string, locale) || '',
        url: typeof c.url === 'string' ? c.url : '',
        orden: typeof c.orden === 'number' ? c.orden : 0,
      };
    })
    .filter((img) => Boolean(img.url))
    .sort((a, b) => a.orden - b.orden);

  const defaultArchiveImages = [
    {
      id: 'def-1',
      titulo: locale === 'en' ? 'Ulmo Blossom' : 'Flor de Ulmo',
      descripcion: locale === 'en' ? 'Native blossom in Pureo' : 'Floración nativa en el dosel de Pureo',
      url: '/assets/editorial/hero-bosque-tronco.jpg',
    },
    {
      id: 'def-2',
      titulo: locale === 'en' ? 'Pureo Apiary' : 'Apiario en Pureo',
      descripcion: locale === 'en' ? 'Hives in rainforest sanctuary' : 'Colmenas en el bosque templado lluvioso',
      url: '/assets/editorial/hero-bosque-apertura.jpg',
    },
    {
      id: 'def-3',
      titulo: locale === 'en' ? 'Raw Honey Jar' : 'Miel de Origen',
      descripcion: locale === 'en' ? 'Cold-creamed living honey' : 'Miel cruda batida en frío sin aditivos',
      url: '/assets/editorial/honey-jar.png',
    },
    {
      id: 'def-4',
      titulo: locale === 'en' ? 'Territorial Immersion' : 'Inmersión Territorial',
      descripcion: locale === 'en' ? 'Coastal range of Chiloé' : 'Fiordo y bosque en la cordillera de la Costa',
      url: '/assets/editorial/experiencias.jpg',
    },
    {
      id: 'def-5',
      titulo: locale === 'en' ? 'Historic Sachet' : 'Gotas de Néctar',
      descripcion: locale === 'en' ? 'Pioneering format' : 'Formato pionero de miel virgen en sachet',
      url: '/assets/editorial/sachets.png',
    },
    {
      id: 'def-6',
      titulo: locale === 'en' ? 'Living Forest' : 'Bosque Lluvioso',
      descripcion: locale === 'en' ? 'Rainforest canopy' : 'Dosel regenerado tras dos décadas de cuidado',
      url: '/assets/editorial/immersion.png',
    },
  ];

  const archiveImages = galeriaCmsItems.length > 0 ? galeriaCmsItems.slice(0, 6) : defaultArchiveImages;

  const cms = cmsRows[0]?.content as Record<string, string | undefined> | undefined;
  const heroKicker =
    resolveLocalized(nosotrosSettings.kicker, nosotrosSettings.kicker_en, locale) ||
    (locale === 'en' ? 'Trajectory & Origin' : 'Trayectoria & Origen');
  const heroTitle =
    resolveLocalized(nosotrosSettings.title, nosotrosSettings.title_en, locale) ||
    resolveLocalized(cms?.title, cms?.title_en, locale) ||
    (locale === 'en' ? 'Born from the Ashes in Chiloé' : 'Renacer de las Cenizas en Chiloé');
  const heroDesc =
    resolveLocalized(nosotrosSettings.subtitle, nosotrosSettings.subtitle_en, locale) ||
    resolveLocalized(cms?.desc, cms?.desc_en, locale) ||
    (locale === 'en'
      ? 'A bridge between the maritime territory of Chiloé, the temperate rainforest, and beekeeping mastery without compromise.'
      : 'Un puente vivo entre el maritorio de Chiloé, el bosque templado lluvioso y una técnica apícola sin concesiones.');
  const heroImage =
    (typeof nosotrosSettings.hero_image === 'string' && nosotrosSettings.hero_image) ||
    (typeof cms?.image === 'string' && (cms.image.startsWith('http') || cms.image.startsWith('/')) ? cms.image : null) ||
    '/assets/editorial/nosotros-hero.jpg';
  const historia = resolveLocalized(cms?.historia, cms?.historia_en, locale) || null;

  const isLegacyMision = !cms?.mision_title || cms.mision_title === 'Nuestra Misión';
  const misionTitle = isLegacyMision
    ? (locale === 'en' ? 'The Standard of Origin' : 'El Estándar de Origen')
    : resolveLocalized(cms.mision_title, cms.mision_title_en, locale);
  const mision = resolveLocalized(cms?.mision, cms?.mision_en, locale) || null;

  const isLegacyVision = !cms?.vision_title || cms.vision_title === 'Nuestra Visión';
  const visionTitle = isLegacyVision
    ? (locale === 'en' ? 'Territorial Protection' : 'El Resguardo del Territorio')
    : resolveLocalized(cms.vision_title, cms.vision_title_en, locale);
  const vision = resolveLocalized(cms?.vision, cms?.vision_en, locale) || null;

  const aspectClass = aspectClassMap[nosotrosSettings.image_aspect_ratio] || 'aspect-[16/9]';
  const fitClass = nosotrosSettings.image_fit === 'contain' ? 'object-contain p-4' : 'object-cover';

  // Stats: etiqueta/valor desde CMS con fallback a cifras verificadas
  const statDefs = [
    { label: locale === 'en' ? 'Years of Presence' : 'Años de Presencia', value: '22' },
    { label: locale === 'en' ? 'Botanical Species' : 'Especies Botánicas', value: '18+' },
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

        {/* Capítulo I: El Giro Vital (De la Pesca al Bosque Lluvioso) */}
        <section className="mb-20 rounded-3xl border border-border/40 bg-surface-raised/20 p-6 sm:p-10 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl mx-auto text-left">
            <span className="block text-[0.65rem] uppercase tracking-[0.35em] text-accent-text mb-3">
              {locale === 'en' ? 'The Vital Turning Point' : 'El Giro Vital · Pureo, Chiloé'}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-light text-foreground mb-6 leading-tight text-balance">
              {locale === 'en'
                ? 'From artisanal fishing to the rainforest canopy'
                : 'Del maritorio austral a la cordillera de la Costa'}
            </h2>
            <div className="space-y-4 text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed text-pretty">
              <p>
                {locale === 'en'
                  ? 'At the beginning of the 2000s, Cristina Miranda Rojas and Guillermo Cuevas faced a radical turning point. Having spent their lives tied to artisanal fishing and navigating the inner sea channels of Chiloé, severe economic shifts in the marine sector compelled them to reimagine their path. They chose not to abandon the archipelago, but to journey deeper inland: into the rugged slopes of Pureo, in the commune of Queilén.'
                  : 'A inicios de la década del 2000, Cristina Miranda Rojas y Guillermo Cuevas enfrentaron un punto de inflexión decisivo. Vinculados durante años a la pesca artesanal y a la navegación por los canales interiores de Chiloé, las sucesivas crisis en el maritorio los impulsaron a una reinvención total. En lugar de abandonar el archipiélago, decidieron internarse hacia el relieve agreste de Pureo, en la comuna de Queilén.'}
              </p>
              <p>
                {locale === 'en'
                  ? 'They arrived at a parcel severely eroded by historic fires across the coastal range: bare soil, recovering scrubland, and open ash exposed to the maritime winds of the Corcovado Gulf. Rather than an obstacle, they embraced this remote sanctuary as their life commitment: healing the land through patient botanical enrichment, collecting native seeds from untouched rainforest ravines to restore ulmo, tepú, tiaca, hazelnut, and canelo.'
                  : 'Llegaron a un predio marcado por la erosión de antiguos incendios forestales en la cordillera de la Costa: laderas desnudas, matorral de rebrote y suelo expuesto a la intemperie marítima del golfo Corcovado. Lejos de desalentarse, asumieron el predio como un compromiso de vida: sanar la tierra mediante un enriquecimiento botánico paciente, recolectando semillas y plántulas en quebradas vírgenes para devolver el dosel de ulmo, tepú, tiaca, avellano chileno y canelo.'}
              </p>
              <p>
                {locale === 'en'
                  ? 'Chiloé challenges beekeeping with rain falling 9 to 10 months a year and high relative humidity. Paradoxically, this harsh climate became the ultimate standard of origin: an impassable ecological barrier that keeps industrial monocultures, chemical sprays, and agrochemicals away, forging honeybee colonies of extraordinary hardiness and dense, raw honey of unmatched purity.'
                  : 'Chiloé impone un rigor severo: llueve entre 9 y 10 meses al año, con persistente humedad y viento austral. Paradójicamente, esta adversidad climática se convirtió en su mayor virtud de origen: un filtro natural infranqueable que mantiene alejados los monocultivos y agroquímicos del continente, forjando colonias de abejas con un vigor biológico excepcional y una miel cruda densa, silvestre y pura.'}
              </p>
            </div>

            {historia ? (
              <div className="mt-8 pt-6 border-t border-border/40 text-sm sm:text-base text-foreground/90 italic font-light leading-relaxed">
                «{historia}»
              </div>
            ) : null}
          </div>
        </section>

        {/* Capítulo II: Crónica Territorial en 5 Movimientos */}
        <div className="max-w-4xl mx-auto mb-24">
          <div className="text-center mb-12">
            <span className="block text-[0.65rem] uppercase tracking-[0.35em] text-accent-text mb-3">
              {locale === 'en' ? 'Two Decades of Presence' : 'Crónica de Territorio y Origen'}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-foreground text-balance">
              {locale === 'en' ? '22 Years in Five Movements' : '22 Años en Cinco Movimientos'}
            </h2>
          </div>

          <div className="relative border-l border-border/60 pl-6 sm:pl-10 ml-4 sm:ml-8 space-y-12">
            {/* Movimiento 1 */}
            <div className="relative group">
              <div className="absolute -left-[31px] sm:-left-[47px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-accent bg-background group-hover:bg-accent transition-colors" />
              <div className="text-xs uppercase tracking-[0.25em] text-accent-text font-semibold mb-1">
                2004
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-light text-foreground mb-2">
                {locale === 'en' ? 'The Soil and the Ashes' : 'El Terreno y las Cenizas'}
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground text-pretty">
                {locale === 'en'
                  ? 'Cristina Miranda Rojas, Guillermo Cuevas, and their family established themselves in Pureo, Queilén. Facing soils scorched by historic fires, they set the founding principle: no artificial chemicals, no clearcutting, and absolute respect for the rainforest recovery cycle.'
                  : 'Cristina Miranda Rojas, Guillermo Cuevas y su familia se asientan en el sector de Pureo, Queilén. Frente a laderas calcinadas por incendios históricos, definen el principio fundacional: no forzar el suelo con agroquímicos, no talar y respetar la cadencia de regeneración del bosque templado.'}
              </p>
            </div>

            {/* Movimiento 2 */}
            <div className="relative group">
              <div className="absolute -left-[31px] sm:-left-[47px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-accent bg-background group-hover:bg-accent transition-colors" />
              <div className="text-xs uppercase tracking-[0.25em] text-accent-text font-semibold mb-1">
                2006–2010
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-light text-foreground mb-2">
                {locale === 'en' ? 'Restoring the Native Canopy' : 'La Siembra del Dosel'}
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground text-pretty">
                {locale === 'en'
                  ? 'Four intense seasons of manual botanical enrichment. Reintroducing ulmo (Eucryphia cordifolia), tepú (Tepualia stipularis), tiaca (Caldcluvia paniculata), Chilean hazelnut (Gevuina avellana), and canelo (Drimys winteri), rebuilding the humid microclimate necessary for forest longevity.'
                  : 'Cuatro temporadas continuas de enriquecimiento botánico manual. Se reintroducen doseles de ulmo (Eucryphia cordifolia), tepú (Tepualia stipularis), tiaca (Caldcluvia paniculata), avellano chileno (Gevuina avellana) y canelo (Drimys winteri), devolviendo la humedad estructural al suelo.'}
              </p>
            </div>

            {/* Movimiento 3 */}
            <div className="relative group">
              <div className="absolute -left-[31px] sm:-left-[47px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-accent bg-background group-hover:bg-accent transition-colors" />
              <div className="text-xs uppercase tracking-[0.25em] text-accent-text font-semibold mb-1">
                2012
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-light text-foreground mb-2">
                {locale === 'en' ? 'The First Rustic Hives' : 'La Colmena Rústica'}
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground text-pretty">
                {locale === 'en'
                  ? 'The first nuclei of Apis mellifera arrived in the sanctuary. Handling hives under 2,000+ mm of annual rainfall demanded a tailored insular technique: elevated screened bases, rigorous organic health monitoring without synthetic waxes, and the firm rule of never feeding sugar syrups during honey flows.'
                  : 'Llegan los primeros núcleos de Apis mellifera al santuario. Manejar abejas bajo más de 2.000 mm de lluvia anual exigió una técnica insular adaptada: alzas ventiladas, monitoreo sanitario estricto sin residuos en cera, y la regla inquebrantable de jamás alimentar con jarabes de azúcar durante los flujos de néctar.'}
              </p>
            </div>

            {/* Movimiento 4 */}
            <div className="relative group">
              <div className="absolute -left-[31px] sm:-left-[47px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-accent bg-background group-hover:bg-accent transition-colors" />
              <div className="text-xs uppercase tracking-[0.25em] text-accent-text font-semibold mb-1">
                2018–2022
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-light text-foreground mb-2">
                {locale === 'en' ? 'Pioneering Formats & Cold Creaming' : 'La Maestría del Formato'}
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground text-pretty">
                {locale === 'en'
                  ? 'Innovation born in the field: pioneer release of "Gotas de Néctar" (15g individual raw honey sachets) to promote natural intake among athletes, followed by "Panal del Bosque" (vacuum-sealed virgin comb with intact operculum) and the mastery of 48-hour cold creaming at 14°–18°C without pasteurization.'
                  : 'Innovación pionera nacida en Chiloé: creación de "Gotas de Néctar" (sachets individuales de 15g de miel virgen) para promover el consumo sano en deportistas, junto al "Panal del Bosque" (trozo de panal sellado al vacío con opérculo intacto) y el perfeccionamiento del batido en frío de 48 horas a 14°–18°C sin daño térmico.'}
              </p>
            </div>

            {/* Movimiento 5 */}
            <div className="relative group">
              <div className="absolute -left-[31px] sm:-left-[47px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-accent bg-background group-hover:bg-accent transition-colors" />
              <div className="text-xs uppercase tracking-[0.25em] text-accent-text font-semibold mb-1">
                {locale === 'en' ? 'Present' : 'Presente'}
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-light text-foreground mb-2">
                {locale === 'en' ? 'Enjambre Legado & Digital Sovereignty' : 'Enjambre Legado & Soberanía Territorial'}
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground text-pretty">
                {locale === 'en'
                  ? 'The second generation, led by Gabriel Cuevas Miranda (anthropology, design, and code), steps in to build sovereign technology: rejecting external commercial intermediaries to build the Enjambre Legado monorepo, direct SII fiscal compliance, offline POS for rural fairs, and community beekeeping protection under Law 21.489.'
                  : 'La segunda generación, encabezada por Gabriel Cuevas Miranda (antropología, diseño y código), consolida la soberanía del proyecto: reemplazo de plataformas intermediarias por el monorepo territorial Enjambre Legado, facturación directa SII, terminal ferial offline-first y articulación del Registro Territorial Apícola (Ley 21.489) para defender el origen de Chiloé.'}
              </p>
            </div>
          </div>
        </div>

        {/* Capítulo III: Díptico de Convicción Apícola (El Estándar de Origen & El Resguardo del Territorio) */}
        <section className="mb-24">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="block text-[0.65rem] uppercase tracking-[0.35em] text-accent-text mb-3">
              {locale === 'en' ? 'Founding Convictions' : 'Principios Fundacionales'}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-foreground text-balance">
              {locale === 'en' ? 'Our Standard & Territorial Commitment' : 'El Estándar y el Resguardo'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Tarjeta 1: El Estándar de Origen */}
            <div className="rounded-3xl border border-border/50 bg-card p-8 sm:p-10 flex flex-col justify-between hover:border-accent/50 transition-colors">
              <div>
                <span className="text-[0.65rem] uppercase tracking-[0.3em] text-accent-text block mb-3">
                  01 · {locale === 'en' ? 'Technique & Purity' : 'Técnica & Pureza'}
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-light text-foreground mb-4">
                  {misionTitle}
                </h3>
                <p className="text-sm sm:text-base leading-relaxed text-muted-foreground whitespace-pre-line text-pretty">
                  {mision ?? (locale === 'en'
                    ? 'Preserving the living cadence of Chiloé through origin-based, non-invasive beekeeping. We craft raw, cold-creamed honey where ulmo and tepú nectars reach your table without heat degradation, artificial feeding, or pasteurization.'
                    : 'Preservar la cadencia viva del territorio mediante una técnica apícola de origen, no invasiva y de alta pureza. Elaboramos alimentos nobles, crudos y trazables, donde el néctar de ulmo, tiaca y tepú llega a la mesa sin daño térmico, jarabes sustitutos ni pasteurización.')}
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-border/30 text-xs text-muted-foreground flex items-center justify-between">
                <span>{locale === 'en' ? 'Cold-creamed 48h · Raw Honey' : 'Batido en Frío 48h · Miel Cruda'}</span>
                <span className="text-accent-text font-mono">Codex Standard</span>
              </div>
            </div>

            {/* Tarjeta 2: El Resguardo del Territorio */}
            <div className="rounded-3xl border border-border/50 bg-card p-8 sm:p-10 flex flex-col justify-between hover:border-accent/50 transition-colors">
              <div>
                <span className="text-[0.65rem] uppercase tracking-[0.3em] text-accent-text block mb-3">
                  02 · {locale === 'en' ? 'Sanctuary & Future' : 'Santuario & Futuro'}
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-light text-foreground mb-4">
                  {visionTitle}
                </h3>
                <p className="text-sm sm:text-base leading-relaxed text-muted-foreground whitespace-pre-line text-pretty">
                  {vision ?? (locale === 'en'
                    ? 'Consolidating Chiloé as an international apicultural sanctuary, integrating field mastery, scientific evidence, and fine gastronomy, safeguarding the native temperate rainforest from chemical exposure through batch-level verification.'
                    : 'Consolidar a Chiloé como santuario apícola de referencia internacional, integrando maestría apícola, evidencia científica y alta gastronomía, resguardando la biodiversidad del bosque templado lluvioso frente a monocultivos y garantizando trazabilidad lote a lote.')}
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-border/30 text-xs text-muted-foreground flex items-center justify-between">
                <span>{locale === 'en' ? 'Stationary Apiary · Zero Transhumance' : 'Apiarios Fijos · Sin Trashumancia'}</span>
                <span className="text-accent-text font-mono">Pureo · Queilén</span>
              </div>
            </div>
          </div>
        </section>

        {/* Capítulo IV: Cifras de Territorio (Stats) */}
        <section className="border-t border-border/50 pt-16 mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-4xl sm:text-5xl lg:text-6xl text-accent-text mb-2 font-light tracking-tight">
                  {s.value}
                </div>
                <div className="text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground font-medium">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed">
            {statsDisclaimer}
          </p>
        </section>

{/* ── Archivo Territorial & Memoria Viva ── */}
<section className="border-t border-border pt-20 mb-20">
  <div className="text-center max-w-3xl mx-auto mb-12">
    <span className="block text-[0.65rem] uppercase tracking-[0.4em] text-accent-text mb-3">
      {locale === 'en' ? 'Territorial Archive & Living Memory' : 'Archivo Territorial & Memoria Viva'}
    </span>
    <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-foreground text-balance">
      {locale === 'en' ? 'Traces in the Forest & the Hive' : 'Huellas en el Bosque y la Colmena'}
    </h2>
    <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty">
      {locale === 'en'
        ? '22 years of records in Pureo: native botany, maritime territory, historic frames, and field life.'
        : '22 años de registros en Pureo: botánica nativa, maritorio, panales históricos y vida de campo.'}
    </p>
  </div>

  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-12">
    {archiveImages.map((img, idx) => (
      <Link
        key={img.id || idx}
        href="/galeria"
        className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-card border border-border/40 hover:border-accent/60 transition-all duration-300 hover:shadow-xl hover:shadow-black/40"
      >
        <Image
          src={img.url}
          alt={img.titulo || 'Registro de Pureo'}
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <h3 className="font-display text-base sm:text-lg text-foreground font-light mb-0.5 group-hover:text-accent transition-colors">
            {img.titulo}
          </h3>
          {img.descripcion ? (
            <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1">
              {img.descripcion}
            </p>
          ) : null}
        </div>
      </Link>
    ))}
  </div>

  <div className="flex justify-center">
    <Link
      href="/galeria"
      className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-accent bg-accent/10 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent-text transition hover:bg-accent hover:text-accent-foreground cursor-pointer"
    >
      <span>{locale === 'en' ? 'Open Full Archive' : 'Abrir Archivo Completo'}</span>
      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
    </Link>
  </div>
</section>

{/* Capítulo VI: Evidencia Científica & Protocolo */}
<section className="border-t border-border/50 pt-16 mb-16">
  <div className="rounded-3xl border border-border/40 bg-surface-raised/40 p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
    <div className="max-w-xl">
      <span className="text-[0.65rem] uppercase tracking-[0.3em] text-accent-text block mb-2">
        {locale === 'en' ? 'Analytical Rigor' : 'Rigor Analítico & Laboratorio'}
      </span>
      <h3 className="font-display text-2xl font-light text-foreground mb-2">
        {locale === 'en' ? 'Scientific Evidence & Sensory Protocol' : 'Evidencia Científica & Protocolo Sensorial'}
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {locale === 'en'
          ? 'Observed flowering curves, physical-chemical batch analysis (Codex moisture <18%, HMF), and ST-CATA sensory radar documented in detail.'
          : 'Curvas de floración observadas, análisis físico-químico por lote (humedad Codex <18%, HMF) y metodología sensorial ST-CATA documentados en detalle.'}
      </p>
    </div>
    <Link
      href="/ciencia"
      className="inline-flex min-h-12 items-center gap-2 rounded-full border border-accent bg-accent/10 px-7 text-xs font-semibold uppercase tracking-wider text-accent-text hover:bg-accent hover:text-accent-foreground transition-all shrink-0 cursor-pointer"
    >
      <span>{locale === 'en' ? 'Explore /ciencia' : 'Explorar /ciencia'}</span>
      <ArrowRight className="w-3.5 h-3.5" />
    </Link>
  </div>
</section>

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
