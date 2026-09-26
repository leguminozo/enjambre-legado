import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Coffee,
  Hotel,
  ShoppingBag,
  Award,
  Users,
  ArrowRight,
  ShieldCheck,
  Truck,
  FileText,
} from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { EditorialHero } from '@/components/shop/editorial-hero';
import { JsonLd } from '@/components/ui/JsonLd';
import { breadcrumbJsonLd } from '@/lib/shop/json-ld';
import { getSiteContent } from '@/lib/cms';
import { parseB2BHubSettings, resolveLocalized, alignToClass } from '@enjambre/shop-chrome';
import { getLocale } from 'next-intl/server';
import { B2BRegisterForm } from '@/components/b2b/b2b-register-form';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<{ cms_preview?: string }>;
}): Promise<Metadata> {
  const resolvedParams = searchParams ? await searchParams : {};
  const draft = resolvedParams.cms_preview === '1';

  const [rows, locale] = await Promise.all([
    getSiteContent('b2b_hub_settings', { draft }),
    getLocale(),
  ]);

  const cmsContent = (rows?.[0]?.content as Record<string, unknown>) ?? null;
  const content = parseB2BHubSettings(cmsContent);

  const title =
    resolveLocalized(content.seo_title, content.seo_title_en, locale) ||
    'Alianzas & Negocios · La Obrera y el Zángano';
  const description =
    resolveLocalized(content.seo_description, content.seo_description_en, locale) ||
    'Soluciones mayoristas y programas de colaboración para cafeterías de especialidad, hoteles, tiendas gourmet, ferias y revendedores. Miel cruda de bosque nativo con trazabilidad certificada.';
  const heroImage = content.hero_image || '/images/b2b/hero-cafeterias.jpg';

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/alianzas` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/alianzas`,
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'es_CL',
      siteName: 'La Obrera y el Zángano',
      images: [{ url: `${SITE_URL}${heroImage}`, width: 1600, height: 900 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function ParaHubPage({
  searchParams,
}: {
  searchParams?: Promise<{ cms_preview?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const draft = resolvedParams.cms_preview === '1';

  const [rows, locale] = await Promise.all([
    getSiteContent('b2b_hub_settings', { draft }),
    getLocale(),
  ]);

  const cmsContent = (rows?.[0]?.content as Record<string, unknown>) ?? null;
  const content = parseB2BHubSettings(cmsContent);

  const heroKicker = resolveLocalized(content.hero_kicker, content.hero_kicker_en, locale);
  const heroBadge = resolveLocalized(content.hero_badge, content.hero_badge_en, locale);
  const heroTitle =
    resolveLocalized(content.hero_title, content.hero_title_en, locale) ||
    'El Bosque Austral en tu Espacio';
  const heroSubtitle = resolveLocalized(content.hero_subtitle, content.hero_subtitle_en, locale);
  const heroImage = content.hero_image || '/images/b2b/hero-cafeterias.jpg';
  const heroOpacity = content.hero_image_opacity ?? 35;
  const ctaLabel = resolveLocalized(content.cta_label, content.cta_label_en, locale);
  const ctaHref = content.cta_href || '#solicitud';
  const secondaryCtaLabel =
    resolveLocalized(content.hero_secondary_cta_label, content.hero_secondary_cta_label_en, locale) ||
    'Explorar formatos & segmentos';
  const secondaryCtaHref = content.hero_secondary_cta_href || '#segmentos';

  // Hero Pills
  const pill1Title =
    resolveLocalized(content.pill1_title, content.pill1_title_en, locale) || 'Pureza de Origen';
  const pill1Subtitle =
    resolveLocalized(content.pill1_subtitle, content.pill1_subtitle_en, locale) ||
    '<18% humedad · Cruda y sin pasteurizar';
  const pill2Title =
    resolveLocalized(content.pill2_title, content.pill2_title_en, locale) || 'Despacho Nacional';
  const pill2Subtitle =
    resolveLocalized(content.pill2_subtitle, content.pill2_subtitle_en, locale) ||
    'Cobertura prioritaria con seguro de quiebre';
  const pill3Title =
    resolveLocalized(content.pill3_title, content.pill3_title_en, locale) || 'Facturación Formal';
  const pill3Subtitle =
    resolveLocalized(content.pill3_subtitle, content.pill3_subtitle_en, locale) ||
    'Emisión tributaria inmediata con RUT empresa';

  // Segmentos Header & Cards
  const segmentosKicker =
    resolveLocalized(content.segmentos_kicker, content.segmentos_kicker_en, locale) ||
    'Formatos a Medida';
  const segmentosTitle =
    resolveLocalized(content.segmentos_title, content.segmentos_title_en, locale) ||
    'Cinco propuestas para diferentes tipos de espacio';
  const segmentosSubtitle =
    resolveLocalized(content.segmentos_subtitle, content.segmentos_subtitle_en, locale) ||
    'Selecciona tu área de actividad para conocer los formatos específicos, volúmenes de entrega y ventajas comerciales asociadas.';
  const segmentosCtaLabel =
    resolveLocalized(content.segmentos_cta_label, content.segmentos_cta_label_en, locale) ||
    'Ver propuesta completa';

  const segmentCards = [
    {
      slug: 'cafeterias',
      title:
        resolveLocalized(content.seg_cafeterias_title, content.seg_cafeterias_title_en, locale) ||
        'Cafeterías de Especialidad',
      icon: Coffee,
      badge:
        resolveLocalized(content.seg_cafeterias_badge, content.seg_cafeterias_badge_en, locale) ||
        'Barismo & Repostería',
      description:
        resolveLocalized(content.seg_cafeterias_desc, content.seg_cafeterias_desc_en, locale) ||
        'Sachets monodosis para servicio de barra, miel cruda a granel para repostería fina y descriptores de cata para maridar con orígenes de café.',
      highlights: [
        resolveLocalized(content.seg_cafeterias_h1, content.seg_cafeterias_h1_en, locale) ||
          'Sachets 15g sellados',
        resolveLocalized(content.seg_cafeterias_h2, content.seg_cafeterias_h2_en, locale) ||
          'Formato granel 1.2kg y 5kg',
        resolveLocalized(content.seg_cafeterias_h3, content.seg_cafeterias_h3_en, locale) ||
          'Fichas de cata para baristas',
      ],
      image: content.seg_cafeterias_image || '/images/b2b/hero-cafeterias.jpg',
    },
    {
      slug: 'hoteles',
      title:
        resolveLocalized(content.seg_hoteles_title, content.seg_hoteles_title_en, locale) ||
        'Hoteles & Amenities',
      icon: Hotel,
      badge:
        resolveLocalized(content.seg_hoteles_badge, content.seg_hoteles_badge_en, locale) ||
        'Hospitalidad de Lujo',
      description:
        resolveLocalized(content.seg_hoteles_desc, content.seg_hoteles_desc_en, locale) ||
        'Frascos de cortesía de 25g para habitaciones, formatos para salón de desayuno y amenities de autor formulados con propóleo virgen.',
      highlights: [
        resolveLocalized(content.seg_hoteles_h1, content.seg_hoteles_h1_en, locale) ||
          'Frascos miniatura 25g',
        resolveLocalized(content.seg_hoteles_h2, content.seg_hoteles_h2_en, locale) ||
          'Línea de cuidado con cera y propóleo',
        resolveLocalized(content.seg_hoteles_h3, content.seg_hoteles_h3_en, locale) ||
          'Presentación de cortesía elegante',
      ],
      image: content.seg_hoteles_image || '/images/b2b/hero-hoteles.jpg',
    },
    {
      slug: 'tiendas-gourmet',
      title:
        resolveLocalized(content.seg_gourmet_title, content.seg_gourmet_title_en, locale) ||
        'Tiendas Gourmet & Emporios',
      icon: ShoppingBag,
      badge:
        resolveLocalized(content.seg_gourmet_badge, content.seg_gourmet_badge_en, locale) ||
        'Retail Seleccionado',
      description:
        resolveLocalized(content.seg_gourmet_desc, content.seg_gourmet_desc_en, locale) ||
        'Ediciones numeradas de autor con trazabilidad verificable por lote, formatos de alta rotación para mesón y márgenes comerciales protegidos.',
      highlights: [
        resolveLocalized(content.seg_gourmet_h1, content.seg_gourmet_h1_en, locale) ||
          'Embalaje de lujo para regalo',
        resolveLocalized(content.seg_gourmet_h2, content.seg_gourmet_h2_en, locale) ||
          'Material de apoyo y fichas de origen',
        resolveLocalized(content.seg_gourmet_h3, content.seg_gourmet_h3_en, locale) ||
          'Rotación y reposición prioritaria',
      ],
      image: content.seg_gourmet_image || '/images/b2b/hero-tiendas-gourmet.jpg',
    },
    {
      slug: 'ferias',
      title:
        resolveLocalized(content.seg_ferias_title, content.seg_ferias_title_en, locale) ||
        'Encuentros & Presentaciones Privadas',
      icon: Award,
      badge:
        resolveLocalized(content.seg_ferias_badge, content.seg_ferias_badge_en, locale) ||
        'Activaciones de Marca',
      description:
        resolveLocalized(content.seg_ferias_desc, content.seg_ferias_desc_en, locale) ||
        'Packs de degustación sensorial, presencia en stands gastronómicos de autor y formatos institucionales que cuentan la historia del bosque chilote.',
      highlights: [
        resolveLocalized(content.seg_ferias_h1, content.seg_ferias_h1_en, locale) ||
          'Muestras sensoriales guiadas',
        resolveLocalized(content.seg_ferias_h2, content.seg_ferias_h2_en, locale) ||
          'Formatos institucionales para regalo',
        resolveLocalized(content.seg_ferias_h3, content.seg_ferias_h3_en, locale) ||
          'Soporte narrativo y fichas botánicas',
      ],
      image: content.seg_ferias_image || '/images/b2b/hero-ferias.jpg',
    },
    {
      slug: 'revendedores',
      title:
        resolveLocalized(content.seg_revendedores_title, content.seg_revendedores_title_en, locale) ||
        'Programa de Revendedores',
      icon: Users,
      badge:
        resolveLocalized(content.seg_revendedores_badge, content.seg_revendedores_badge_en, locale) ||
        'Embajadores Territoriales',
      description:
        resolveLocalized(content.seg_revendedores_desc, content.seg_revendedores_desc_en, locale) ||
        'Para distribuidores y tiendas de especialidad que comparten nuestro estándar de calidad. Margen por volumen, catálogo digital y soporte logístico continuo.',
      highlights: [
        resolveLocalized(content.seg_revendedores_h1, content.seg_revendedores_h1_en, locale) ||
          'Escala progresiva de descuentos',
        resolveLocalized(content.seg_revendedores_h2, content.seg_revendedores_h2_en, locale) ||
          'Acceso a terminal de venta en ferias',
        resolveLocalized(content.seg_revendedores_h3, content.seg_revendedores_h3_en, locale) ||
          'Capacitación en producto y origen',
      ],
      image: content.seg_revendedores_image || '/images/b2b/hero-revendedores.jpg',
    },
  ];

  // Garantías
  const garantiasKicker =
    resolveLocalized(content.garantias_kicker, content.garantias_kicker_en, locale);
  const garantiasTitle =
    resolveLocalized(content.garantias_title, content.garantias_title_en, locale);

  const g1Title =
    resolveLocalized(content.garantia1_title, content.garantia1_title_en, locale) ||
    'Pureza Certificada';
  const g1Desc =
    resolveLocalized(content.garantia1_desc, content.garantia1_desc_en, locale) ||
    'Cada lote cuenta con análisis de laboratorio acreditado: humedad controlada (<18%), HMF Codex y pureza botánica documentada en nuestra sección de ciencia.';

  const g2Title =
    resolveLocalized(content.garantia2_title, content.garantia2_title_en, locale) ||
    'Despacho Nacional';
  const g2Desc =
    resolveLocalized(content.garantia2_desc, content.garantia2_desc_en, locale) ||
    'Envíos protegidos a todo Chile con courier prioritario y reposición asegurada en caso de quiebre o demora.';

  const g3Title =
    resolveLocalized(content.garantia3_title, content.garantia3_title_en, locale) ||
    'Facturación Formal';
  const g3Desc =
    resolveLocalized(content.garantia3_desc, content.garantia3_desc_en, locale) ||
    'Emisión inmediata de Factura Electrónica (afecta o exenta según el producto) con RUT de empresa y soporte tributario.';

  const g4Title =
    resolveLocalized(content.garantia4_title, content.garantia4_title_en, locale) ||
    'Soporte de Marca';
  const g4Desc =
    resolveLocalized(content.garantia4_desc, content.garantia4_desc_en, locale) ||
    'Material gráfico, fichas técnicas de origen y apoyo en el relato de producto para capacitar a tu equipo de atención.';

  // Formulario de Registro / Solicitud
  const formKicker =
    resolveLocalized(content.form_kicker, content.form_kicker_en, locale) || 'Registro de Alianzas';
  const formTitle =
    resolveLocalized(content.form_title, content.form_title_en, locale) ||
    'Inicia una conversación comercial';
  const formSubtitle =
    resolveLocalized(content.form_subtitle, content.form_subtitle_en, locale) ||
    'Completa tus datos y nos pondremos en contacto en menos de 24 horas hábiles con la lista de precios mayoristas y condiciones de entrega.';

  const jsonLdData = breadcrumbJsonLd([
    { name: 'Inicio', href: '/' },
    { name: 'Alianzas & Negocios', href: '/alianzas' },
  ]);

  return (
    <StoreShell>
      <ShopHeader />
      <JsonLd data={jsonLdData} />

      <main
        data-cms-section="b2b_hub_settings"
        className="min-h-[var(--vh-full)] bg-background"
      >
        {/* ── Hero Dedicado: Alta Hospitalidad & Estándar Gastronómico ── */}
        <EditorialHero
          sectionKey="b2b_hub_settings"
          kicker={heroKicker}
          badge={heroBadge}
          title={heroTitle}
          subtitle={heroSubtitle}
          imageUrl={heroImage}
          imageOpacity={heroOpacity}
          imageAlt="Alianzas comerciales de La Obrera y el Zángano"
          ctaLabel={ctaLabel}
          ctaHref={ctaHref}
          secondaryCtaLabel={secondaryCtaLabel}
          secondaryCtaHref={secondaryCtaHref}
          align={content.text_align}
          preferAnchor
        >
          {/* Tres pilares operativos tangibles para el comprador */}
          {content.show_hero_pills !== false ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto text-left">
              <div className="rounded-xl border border-border/60 bg-surface-raised/80 backdrop-blur-sm p-3.5 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-accent-text shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">{pill1Title}</div>
                  <div className="text-[11px] text-muted-foreground">{pill1Subtitle}</div>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-surface-raised/80 backdrop-blur-sm p-3.5 flex items-center gap-3">
                <Truck className="w-5 h-5 text-accent-text shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">{pill2Title}</div>
                  <div className="text-[11px] text-muted-foreground">{pill2Subtitle}</div>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-surface-raised/80 backdrop-blur-sm p-3.5 flex items-center gap-3">
                <FileText className="w-5 h-5 text-accent-text shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">{pill3Title}</div>
                  <div className="text-[11px] text-muted-foreground">{pill3Subtitle}</div>
                </div>
              </div>
            </div>
          ) : null}
        </EditorialHero>

        {/* ── Segmentos B2B ── */}
        <section id="segmentos" className="py-20 md:py-28 px-4 border-b border-border/20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-2">
                {segmentosKicker}
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-light text-foreground text-balance">
                {segmentosTitle}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {segmentosSubtitle}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
              {segmentCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.slug}
                    href={`/alianzas/${card.slug}`}
                    className="group rounded-2xl border border-border/40 bg-card p-6 flex flex-col justify-between hover:border-accent/60 transition-colors w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[0.65rem] uppercase tracking-wider text-accent-text font-semibold">
                          {card.badge}
                        </span>
                      </div>

                      <h3 className="font-display text-xl font-light text-foreground mb-2 group-hover:text-accent transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4 whitespace-pre-line">
                        {card.description}
                      </p>

                      <ul className="space-y-1 text-[11px] text-foreground/80 border-t border-border/20 pt-3 mb-4">
                        {card.highlights.map((h) => (
                          <li key={h} className="flex items-center gap-1.5">
                            <span className="text-accent-text">•</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-text pt-2">
                      <span>{segmentosCtaLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Pilares de Confianza Operativa ── */}
        {content.show_garantias !== false && (
          <section className="py-16 md:py-24 px-4 border-b border-border/20 bg-surface-raised/20">
            <div className="max-w-4xl mx-auto">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="block text-[0.65rem] tracking-[0.3em] uppercase text-accent-text mb-2">
                  {garantiasKicker}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground">
                  {garantiasTitle}
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
                <div className="rounded-2xl border border-border/30 bg-card p-5">
                  <ShieldCheck className="w-6 h-6 text-accent-text mb-3 mx-auto sm:mx-0" />
                  <h4 className="font-display text-base font-light text-foreground mb-1">
                    {g1Title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {g1Desc}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/30 bg-card p-5">
                  <Truck className="w-6 h-6 text-accent-text mb-3 mx-auto sm:mx-0" />
                  <h4 className="font-display text-base font-light text-foreground mb-1">
                    {g2Title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {g2Desc}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/30 bg-card p-5">
                  <FileText className="w-6 h-6 text-accent-text mb-3 mx-auto sm:mx-0" />
                  <h4 className="font-display text-base font-light text-foreground mb-1">
                    {g3Title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {g3Desc}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/30 bg-card p-5">
                  <Award className="w-6 h-6 text-accent-text mb-3 mx-auto sm:mx-0" />
                  <h4 className="font-display text-base font-light text-foreground mb-1">
                    {g4Title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {g4Desc}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Formulario de Registro / Solicitud ── */}
        <section id="solicitud" className="py-20 md:py-28 px-4 border-b border-border/20">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <span className="block text-[0.65rem] tracking-[0.3em] uppercase text-accent-text mb-2">
                {formKicker}
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-light text-foreground">
                {formTitle}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {formSubtitle}
              </p>
            </div>

            <B2BRegisterForm
              segmentType="otro"
              segmentLabel="Alianzas y Negocios"
              kind="punto_venta"
            />
          </div>
        </section>
      </main>

      <ShopFooter />
    </StoreShell>
  );
}
