import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin, ShieldCheck, Compass } from 'lucide-react';
import { getLocale } from 'next-intl/server';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { EditorialHero } from '@/components/shop/editorial-hero';
import { CienciaCanvas } from '@/components/shop/ciencia-canvas';
import { JsonLd } from '@/components/ui/JsonLd';
import { breadcrumbJsonLd } from '@/lib/shop/json-ld';
import { getSiteContent } from '@/lib/cms';
import {
  parseOrigenSettings,
  parseBotanicalMonographs,
  resolveLocalized,
  alignToClass,
} from '@enjambre/shop-chrome';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export const metadata: Metadata = {
  title: 'Origen & Floraciones · Biblioteca de Monografías Botánicas · La Obrera y el Zángano',
  description:
    'Estudio profundo de las especies nectaríferas del bosque templado lluvioso de Chiloé que dan origen a nuestras creaciones. Fenología, perfiles sensoriales y monografías.',
  alternates: { canonical: `${SITE_URL}/origen` },
  openGraph: {
    title: 'Origen & Floraciones · Biblioteca Botánica de Chiloé',
    description:
      'Las especies botánicas nativas del bosque templado austral que dan origen a la miel cruda de nuestras creaciones.',
    url: `${SITE_URL}/origen`,
    type: 'website',
    siteName: 'La Obrera y el Zángano',
  },
};

interface BotanicalDetails {
  temporada: string;
  temporada_en?: string;
  colorMiel: string;
  colorMiel_en?: string;
  descriptores: string[];
  descriptores_en?: string[];
  notasSensoriales: string;
  notasSensoriales_en?: string;
  maridaje: string;
  maridaje_en?: string;
}

const BOTANICAL_DETAILS: Record<string, BotanicalDetails> = {
  ulmo: {
    temporada: 'Verano Austral (Enero a Marzo)',
    temporada_en: 'Austral Summer (January to March)',
    colorMiel: 'Blanco marfil a ámbar perlado',
    colorMiel_en: 'Ivory white to pearled amber',
    descriptores: ['Aroma floral a jazmín', 'Textura cremosa natural', 'Final aterciopelado'],
    descriptores_en: ['Jasmine floral bouquet', 'Naturally creamy texture', 'Velvety finish'],
    notasSensoriales:
      'La floración insignia del archipiélago. Su néctar da lugar a una miel untable espontánea, con notas cálidas a toffee suave, vainilla y flor blanca recién abierta.',
    notasSensoriales_en:
      'The archipelago flagship bloom. Its nectar gives birth to a spontaneous buttery honey with warm vanilla, mild toffee, and freshly opened white blossoms.',
    maridaje: 'Quesos de pasta blanda, higos frescos, té Earl Grey y tostadas de centeno.',
    maridaje_en: 'Soft cheeses, fresh figs, Earl Grey tea, and rye sourdough toast.',
  },
  tiaca: {
    temporada: 'Primavera Austral (Febrero a Abril · Cierre de verano)',
    temporada_en: 'Austral Spring / Late Summer (February to April)',
    colorMiel: 'Ámbar claro y traslúcido',
    colorMiel_en: 'Translucent light amber',
    descriptores: ['Frescor herbal silvestre', 'Acidez cítrica sutil', 'Cristalización fina'],
    descriptores_en: ['Wild herbal freshness', 'Subtle citrus acidity', 'Fine crystallization'],
    notasSensoriales:
      'Brota en las quebradas húmedas junto a cursos de agua. Su perfil es ligero, vibrante y balsámico, con un retrogusto fresco y mineral que equilibra la dulzura.',
    notasSensoriales_en:
      'Flourishes along shaded ravines and streams. Vibrant, light, and balsamic with a fresh mineral finish that balances sweetness.',
    maridaje: 'Quesos de cabra madurados, infusiones de menta o melisa, y vinagretas de ensalada verde.',
    maridaje_en: 'Aged goat cheeses, mint infusions, and green herb vinaigrettes.',
  },
  meli: {
    temporada: 'Pleno Verano (Diciembre a Enero)',
    temporada_en: 'Mid Summer (December to January)',
    colorMiel: 'Dorado intenso',
    colorMiel_en: 'Deep golden amber',
    descriptores: ['Especias de mirto', 'Aroma resinoso', 'Complejidad profunda'],
    descriptores_en: ['Wild myrtle spice', 'Resinous warmth', 'Deep complexity'],
    notasSensoriales:
      'Árbol endémico de la familia de las mirtáceas en Chiloé. Aporta un carácter balsámico inconfundible con matices a pimienta dulce, clavo de olor y madera nativa.',
    notasSensoriales_en:
      'Endemic myrtle tree of Chiloé. Brings an unmistakable balsamic profile with sweet pepper, wild clove, and noble wood notes.',
    maridaje: 'Carnes asadas de caza, tablas de charcutería curada y panes rústicos con masa madre.',
    maridaje_en: 'Roasted meats, cured charcuterie boards, and rustic sourdough loaves.',
  },
  tepu: {
    temporada: 'Otoño Austral (Febrero a Abril)',
    temporada_en: 'Austral Autumn (February to April)',
    colorMiel: 'Ámbar rojizo oscuro',
    colorMiel_en: 'Dark reddish amber',
    descriptores: ['Notas de turba y musgo', 'Mineralidad marina', 'Gran persistencia'],
    descriptores_en: ['Peat and moss notes', 'Marine minerality', 'Exceptional persistence'],
    notasSensoriales:
      'Crecen en los tepuales pantanosos de Chiloé donde la tierra y el mar se entrelazan. Es una miel de paladar denso, mineral, con notas de melaza pura y bosque húmedo.',
    notasSensoriales_en:
      'Grows in the swampy tepuales of Chiloé where land and sea converge. Dense and mineral on the palate, with notes of pure molasses and humid forest floor.',
    maridaje: 'Quesos azules potentes (Roquefort, Gorgonzola), café de especialidad y frutos secos tostados.',
    maridaje_en: 'Potent blue cheeses (Roquefort, Gorgonzola), specialty coffee, and roasted nuts.',
  },
  quillay: {
    temporada: 'Bosque Templado Austral (Octubre a Diciembre)',
    temporada_en: 'Austral Temperate Forest (October to December)',
    colorMiel: 'Ámbar del bosque nativo',
    colorMiel_en: 'Native forest golden amber',
    descriptores: ['Flora nativa', 'Miel virgen', 'Riqueza fitoquímica'],
    descriptores_en: ['Native flora', 'Virgin honey', 'Phytochemical richness'],
    notasSensoriales:
      'El árbol sagrado de la vertiente templada. Miel densa y floral intensa con toques tostados, sutil amargor noble y altísima riqueza fitoquímica natural.',
    notasSensoriales_en:
      'Sacred tree of the temperate range. Dense, intensely floral with toasted accents, noble bitterness, and natural phytochemical richness.',
    maridaje: 'Maridaje botánico de alta gama, quesos maduros y charcutería artesanal.',
    maridaje_en: 'High-end botanical pairings, aged hard cheeses, and artisan charcuterie.',
  },
  avellano: {
    temporada: 'Bosque Templado Austral (Octubre a Noviembre)',
    temporada_en: 'Austral Temperate Forest (October to November)',
    colorMiel: 'Ámbar claro y sedoso',
    colorMiel_en: 'Silky light amber',
    descriptores: ['Notas amaderadas', 'Fruto seco tostado', 'Final sedoso'],
    descriptores_en: ['Woody accents', 'Toasted hazelnut', 'Silky finish'],
    notasSensoriales:
      'Inflorescencias densas del bosque siempreverde. Miel amaderada con sutiles matices tostados que recuerdan frutos secos y un final sedoso muy elegante.',
    notasSensoriales_en:
      'Evergreen forest dense blooms. Woody notes with subtle roasted nut undertones and an exceptionally elegant, smooth finish.',
    maridaje: 'Maridaje botánico de alta gama, repostería austera y frutos secos.',
    maridaje_en: 'Botanical gastronomy, refined pastries, and roasted dried fruits.',
  },
  arrayan_tepa: {
    temporada: 'Bosque Templado Austral (Diciembre a Febrero)',
    temporada_en: 'Austral Temperate Forest (December to February)',
    colorMiel: 'Ámbar del bosque nativo',
    colorMiel_en: 'Native forest amber',
    descriptores: ['Carácter balsámico', 'Retrogusto fresco', 'Resinas nobles'],
    descriptores_en: ['Balsamic profile', 'Fresh herbal finish', 'Noble resins'],
    notasSensoriales:
      'Asociación de dosel y sotobosque húmedo. Aporta notas balsámicas y alcanforadas con retrogusto fresco y propóleos puros de gran actividad biológica.',
    notasSensoriales_en:
      'Canopy and humid understory synergy. Delivers balsamic and camphoric accents, crisp finish, and pure biologically active propolis.',
    maridaje: 'Maridaje botánico de alta gama, quesos maduros y charcutería artesanal.',
    maridaje_en: 'High-end botanical pairings, aged cheeses, and artisan charcuterie.',
  },
};

export default async function OrigenIndexPage({
  searchParams,
}: {
  searchParams?: Promise<{ cms_preview?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const draft = resolvedSearchParams.cms_preview === '1';

  const [origenRows, monografiasRows, locale] = await Promise.all([
    getSiteContent('origen_settings', { draft }),
    getSiteContent('origen_monografias', { draft }),
    getLocale(),
  ]);

  const jsonLdData = breadcrumbJsonLd([
    { name: 'Inicio', href: '/' },
    { name: 'Origen & Biblioteca Botánica', href: '/origen' },
  ]);

  const origenSettings = parseOrigenSettings(
    (origenRows?.[0]?.content as Record<string, unknown>) ?? null,
  );
  const monographs = parseBotanicalMonographs(
    monografiasRows?.map((r) => r.content) ?? null,
  );

  const kicker = resolveLocalized(origenSettings.kicker, origenSettings.kicker_en, locale);
  const title = resolveLocalized(origenSettings.title, origenSettings.title_en, locale);
  const description = resolveLocalized(origenSettings.description, origenSettings.description_en, locale);

  const badge1 = resolveLocalized(origenSettings.badge1, origenSettings.badge1_en, locale);
  const badge2 = resolveLocalized(origenSettings.badge2, origenSettings.badge2_en, locale);
  const badge3 = resolveLocalized(origenSettings.badge3, origenSettings.badge3_en, locale);

  const manifiestoKicker = resolveLocalized(
    origenSettings.manifiesto_kicker,
    origenSettings.manifiesto_kicker_en,
    locale,
  );
  const manifiestoTitle = resolveLocalized(
    origenSettings.manifiesto_title,
    origenSettings.manifiesto_title_en,
    locale,
  );
  const manifiestoText = resolveLocalized(
    origenSettings.manifiesto_text,
    origenSettings.manifiesto_text_en,
    locale,
  );
  const manifiestoCtaLabel = resolveLocalized(
    origenSettings.manifiesto_cta_label,
    origenSettings.manifiesto_cta_label_en,
    locale,
  );
  const manifiestoCtaHref = origenSettings.manifiesto_cta_href || '/catalogo';

  return (
    <StoreShell>
      <ShopHeader />
      <JsonLd data={jsonLdData} />

      <main className="min-h-[var(--vh-full)] bg-background">
        {/* ── Hero Editorial: Código Profundo y Origen ── */}
        <EditorialHero
          sectionKey="origen_settings"
          kicker={kicker}
          title={title || 'Origen & Floraciones'}
          subtitle={description}
          align={origenSettings.text_align}
          variant="deep-code"
          backgroundSlot={<CienciaCanvas />}
          scrollCueLabel={locale === 'en' ? 'Explore botanical monographs' : 'Explorar monografías botánicas'}
        >
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-muted-foreground">
            {badge1 ? (
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-primary" /> {badge1}
              </span>
            ) : null}
            {badge1 && badge2 ? <span className="hidden sm:inline">•</span> : null}
            {badge2 ? (
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-primary" /> {badge2}
              </span>
            ) : null}
            {badge2 && badge3 ? <span className="hidden sm:inline">•</span> : null}
            {badge3 ? (
              <span className="flex items-center gap-1.5">
                <Compass size={13} className="text-primary" /> {badge3}
              </span>
            ) : null}
          </div>
        </EditorialHero>

        {/* ── Biblioteca de Especies de Bosque Nativo ── */}
        <section className="py-16 md:py-24 px-4 max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="font-display text-2xl sm:text-4xl font-light text-foreground">
              {locale === 'en'
                ? `${monographs.length} Native Forest Species`
                : monographs.length === 7
                  ? 'Siete Especies de Bosque Nativo'
                  : `${monographs.length} Especies de Bosque Nativo`}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              {locale === 'en'
                ? 'Each variety provides unique nectar and bioactive properties during rigorous seasonal windows.'
                : 'Cada variedad aporta néctares y resinas bioactivas en ventanas estacionales rigurosamente trazadas.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {monographs.map((mono) => {
              const details = BOTANICAL_DETAILS[mono.slug];
              const commonName = resolveLocalized(mono.common_name, mono.common_name_en, locale) || mono.common_name;
              const season =
                (locale === 'en' ? details?.temporada_en : details?.temporada) ||
                resolveLocalized(mono.flowering_period, mono.flowering_period_en, locale) ||
                'Bosque Templado Austral';
              const honeyColor =
                (locale === 'en' ? details?.colorMiel_en : details?.colorMiel) ||
                'Ámbar del bosque nativo';
              const sensoryNote =
                resolveLocalized(mono.sensory_profile, mono.sensory_profile_en, locale) ||
                (locale === 'en' ? details?.notasSensoriales_en : details?.notasSensoriales) ||
                resolveLocalized(mono.short_description, mono.short_description_en, locale) ||
                '';
              const descriptors =
                (locale === 'en' ? details?.descriptores_en : details?.descriptores) ||
                ['Flora nativa', 'Miel virgen', 'Bosque austral'];
              const pairing =
                (locale === 'en' ? details?.maridaje_en : details?.maridaje) ||
                'Maridaje botánico de alta gama, quesos maduros y charcutería artesanal.';

              return (
                <article
                  key={mono.slug}
                  className="rounded-2xl border border-border/40 bg-surface-raised/30 p-6 sm:p-8 space-y-5 hover:border-primary/40 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Encabezado de la especie */}
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                          {season}
                        </span>
                        <h3 className="font-display text-2xl sm:text-3xl font-light text-foreground mt-1">
                          {commonName}
                        </h3>
                        <p className="text-xs font-mono italic text-muted-foreground">
                          {mono.scientific_name}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs px-2.5 py-1 rounded-full border border-border/60 bg-background/60 text-muted-foreground font-mono">
                        {honeyColor}
                      </span>
                    </div>

                    {/* Fotografía botánica si existe */}
                    {mono.image_url ? (
                      <div className="relative h-44 w-full rounded-xl overflow-hidden bg-surface-raised border border-border/30">
                        <Image
                          src={mono.image_url}
                          alt={commonName}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-500 ease-out"
                          sizes="(max-width: 768px) 100vw, 500px"
                        />
                      </div>
                    ) : null}

                    {/* Cita sensorial */}
                    {sensoryNote ? (
                      <p className="text-sm text-foreground/90 leading-relaxed font-display italic">
                        «{sensoryNote}»
                      </p>
                    ) : null}

                    {/* Descriptores en paladar */}
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-accent-text block">
                        {locale === 'en' ? 'Palate Descriptors' : 'Descriptores en Paladar'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {descriptors.map((d) => (
                          <span
                            key={d}
                            className="text-[11px] px-2.5 py-0.5 rounded-md bg-surface-sunken border border-border text-foreground font-medium"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Armonía gastronómica */}
                    {pairing ? (
                      <div className="pt-2 border-t border-border/40 text-xs text-muted-foreground leading-relaxed">
                        <strong className="text-foreground">
                          {locale === 'en' ? 'Gastronomic harmony:' : 'Armonía gastronómica:'}
                        </strong>{' '}
                        {pairing}
                      </div>
                    ) : null}
                  </div>

                  {/* Acción única de valor: Monografía científica */}
                  <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                    <Link
                      href={`/origen/${mono.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary hover:underline transition-colors"
                    >
                      <span>
                        {locale === 'en' ? 'Read botanical monograph' : 'Leer monografía botánica'}
                      </span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── Manifiesto de No-Trashumancia ── */}
        <section className="py-16 md:py-24 px-4 border-t border-border/20 bg-surface-raised/20">
          <div className="max-w-3xl mx-auto rounded-3xl border border-border/40 bg-background/80 p-8 sm:p-12 space-y-5 text-center">
            {manifiestoKicker ? (
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary font-bold">
                {manifiestoKicker}
              </span>
            ) : null}
            <h2 className="font-display text-2xl sm:text-4xl font-light text-foreground">
              {manifiestoTitle}
            </h2>
            <p
              className={`text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto whitespace-pre-line ${alignToClass(
                origenSettings.text_align,
              )}`}
            >
              {manifiestoText}
            </p>
            {manifiestoCtaLabel ? (
              <div className="pt-4">
                <Link
                  href={manifiestoCtaHref}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-8 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  {manifiestoCtaLabel}
                </Link>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <ShopFooter />
    </StoreShell>
  );
}
