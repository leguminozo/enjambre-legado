import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Coffee,
  Hotel,
  ShoppingBag,
  Award,
  Users,
  Megaphone,
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
import {
  parseB2BHubSettings,
  resolveLocalized,
  alignToClass,
  B2B_STORAGE_IMAGES,
} from '@enjambre/shop-chrome';
import { getLocale, getTranslations } from 'next-intl/server';
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
  const ogImageUrl = heroImage.startsWith('http') ? heroImage : `${SITE_URL}${heroImage}`;

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
      images: [{ url: ogImageUrl, width: 1600, height: 900 }],
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
  const tEmbajadores = await getTranslations('embajadores');

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
    'Empaque reforzado y reposición por rotura en transporte';
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
        'Barismo de Especialidad',
      description:
        resolveLocalized(content.seg_cafeterias_desc, content.seg_cafeterias_desc_en, locale) ||
        'Piezas individuales de 25 g para servicio de mesa, frascos de vitrina de 150 g para venta en mostrador y fichas de cata para maridar con café de especialidad.',
      highlights: [
        resolveLocalized(content.seg_cafeterias_h1, content.seg_cafeterias_h1_en, locale) ||
          'Piezas de mesa 25 g y frascos 150 g',
        resolveLocalized(content.seg_cafeterias_h2, content.seg_cafeterias_h2_en, locale) ||
          'Fichas de cata y maridaje con café',
        resolveLocalized(content.seg_cafeterias_h3, content.seg_cafeterias_h3_en, locale) ||
          'Exhibidor de mesón y microespátulas de bambú',
      ],
      image: content.seg_cafeterias_image || B2B_STORAGE_IMAGES.cafeterias,
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
        'Frascos individuales de 25g para habitación, formatos para salón de desayuno gourmet y presentación sobria con trazabilidad de origen.',
      highlights: [
        resolveLocalized(content.seg_hoteles_h1, content.seg_hoteles_h1_en, locale) ||
          'Frascos miniatura 25g',
        resolveLocalized(content.seg_hoteles_h2, content.seg_hoteles_h2_en, locale) ||
          'Frascos de 150 g para vitrina y recepción',
        resolveLocalized(content.seg_hoteles_h3, content.seg_hoteles_h3_en, locale) ||
          'Presentación de cortesía elegante',
      ],
      image: content.seg_hoteles_image || B2B_STORAGE_IMAGES.hoteles,
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
        'Ediciones de autor con trazabilidad verificable por lote, formatos de alta rotación para mesón y escala de descuento mayorista.',
      highlights: [
        resolveLocalized(content.seg_gourmet_h1, content.seg_gourmet_h1_en, locale) ||
          'Frascos de 150 g y 500 g Reserva',
        resolveLocalized(content.seg_gourmet_h2, content.seg_gourmet_h2_en, locale) ||
          'Fichas botánicas y notas de cata',
        resolveLocalized(content.seg_gourmet_h3, content.seg_gourmet_h3_en, locale) ||
          'Rotación y reposición prioritaria',
      ],
      image: content.seg_gourmet_image || B2B_STORAGE_IMAGES['tiendas-gourmet'],
    },
    {
      slug: 'ferias',
      title:
        resolveLocalized(content.seg_ferias_title, content.seg_ferias_title_en, locale) ||
        'Encuentros & Presentaciones Privadas',
      icon: Award,
      badge:
        resolveLocalized(content.seg_ferias_badge, content.seg_ferias_badge_en, locale) ||
        'Eventos Gastronómicos',
      description:
        resolveLocalized(content.seg_ferias_desc, content.seg_ferias_desc_en, locale) ||
        'Packs de degustación sensorial, presencia en stands gastronómicos de autor y formatos institucionales que cuentan la historia del bosque chilote.',
      highlights: [
        resolveLocalized(content.seg_ferias_h1, content.seg_ferias_h1_en, locale) ||
          'Muestras sensoriales guiadas',
        resolveLocalized(content.seg_ferias_h2, content.seg_ferias_h2_en, locale) ||
          'Formatos institucionales para obsequio',
        resolveLocalized(content.seg_ferias_h3, content.seg_ferias_h3_en, locale) ||
          'Soporte narrativo y fichas botánicas',
      ],
      image: content.seg_ferias_image || B2B_STORAGE_IMAGES.ferias,
    },
    {
      slug: 'revendedores',
      title:
        resolveLocalized(content.seg_revendedores_title, content.seg_revendedores_title_en, locale) ||
        'Programa de Revendedores',
      icon: Users,
      badge:
        resolveLocalized(content.seg_revendedores_badge, content.seg_revendedores_badge_en, locale) ||
        'Distribución & Reventa',
      description:
        resolveLocalized(content.seg_revendedores_desc, content.seg_revendedores_desc_en, locale) ||
        'Para distribuidores y tiendas de especialidad que incorporan miel cruda de bosque nativo. Margen por volumen, catálogo directo y soporte logístico.',
      highlights: [
        resolveLocalized(content.seg_revendedores_h1, content.seg_revendedores_h1_en, locale) ||
          'Escala progresiva de descuentos (5% y 10%)',
        resolveLocalized(content.seg_revendedores_h2, content.seg_revendedores_h2_en, locale) ||
          'Material técnico de apoyo de uso libre',
        resolveLocalized(content.seg_revendedores_h3, content.seg_revendedores_h3_en, locale) ||
          'Fichas botánicas y notas de cata',
      ],
      image: content.seg_revendedores_image || B2B_STORAGE_IMAGES.revendedores,
    },
  ];

  // Garantías
  const garantiasKicker =
    resolveLocalized(content.garantias_kicker, content.garantias_kicker_en, locale);
  const garantiasTitle =
    resolveLocalized(content.garantias_title, content.garantias_title_en, locale);

  const g1Title =
    resolveLocalized(content.garantia1_title, content.garantia1_title_en, locale) ||
    'Análisis de Laboratorio por Lote';
  const g1Desc =
    resolveLocalized(content.garantia1_desc, content.garantia1_desc_en, locale) ||
    'Cada lote cuenta con análisis documental (humedad controlada <18%, HMF según norma Codex) disponible para consulta técnica en su pasaporte.';

  const g2Title =
    resolveLocalized(content.garantia2_title, content.garantia2_title_en, locale) ||
    'Despacho Nacional Protegido';
  const g2Desc =
    resolveLocalized(content.garantia2_desc, content.garantia2_desc_en, locale) ||
    'Envíos protegidos a todo Chile con reposición inmediata por rotura en transporte y ventana de reclamos técnicos a 30 días.';

  const g3Title =
    resolveLocalized(content.garantia3_title, content.garantia3_title_en, locale) ||
    'Facturación Formal';
  const g3Desc =
    resolveLocalized(content.garantia3_desc, content.garantia3_desc_en, locale) ||
    'Emisión inmediata de Factura Electrónica (afecta o exenta según el producto) con RUT de empresa y soporte tributario.';

  const g4Title =
    resolveLocalized(content.garantia4_title, content.garantia4_title_en, locale) ||
    'Material Técnico de Apoyo';
  const g4Desc =
    resolveLocalized(content.garantia4_desc, content.garantia4_desc_en, locale) ||
    'Fichas botánicas de floración, descriptores organolépticos y material de apoyo de uso libre para tu equipo, sin subordinación operativa.';

  // Condiciones Comerciales y Logística Mayorista
  const condicionesKicker =
    resolveLocalized(content.condiciones_kicker, content.condiciones_kicker_en, locale) ||
    'Términos Transparentes';
  const condicionesTitle =
    resolveLocalized(content.condiciones_title, content.condiciones_title_en, locale) ||
    'Condiciones Comerciales y Logística Mayorista';
  const condicionesSubtitle =
    resolveLocalized(content.condiciones_subtitle, content.condiciones_subtitle_en, locale) ||
    'Parámetros operativos claros para compras institucionales, distribución y hostelería.';

  const moqTitle =
    resolveLocalized(content.moq_title, content.moq_title_en, locale) || 'Pedido Mínimo (MOQ)';
  const moqDescription =
    resolveLocalized(content.moq_description, content.moq_description_en, locale) ||
    '120 frascos surtidos para pedidos mayoristas regulares de reposición.';
  const moqHighlight =
    resolveLocalized(content.moq_highlight, content.moq_highlight_en, locale) ||
    'Excepción: Los Sets de Entrada para cafeterías, hoteles, tiendas gourmet y revendedores (desde $78.400 neto) no exigen el mínimo de 120 unidades, facilitando la primera degustación en barra o vitrina.';

  const despachoTitle =
    resolveLocalized(content.despacho_title, content.despacho_title_en, locale) ||
    'Despacho & Cobertura';
  const despachoDescription =
    resolveLocalized(content.despacho_description, content.despacho_description_en, locale) ||
    'Despacho gratuito en la Región Metropolitana en compras netas a partir de $900.000.';
  const despachoNota =
    resolveLocalized(content.despacho_nota, content.despacho_nota_en, locale) ||
    'Envíos a todo Chile vía courier prioritario con embalaje técnico de alta protección y reposición inmediata por rotura en transporte.';

  const descuentosTitle =
    resolveLocalized(content.descuentos_title, content.descuentos_title_en, locale) ||
    'Escala de Descuentos';
  const descuentosItems =
    resolveLocalized(content.descuentos_items, content.descuentos_items_en, locale) ||
    '• 5% de descuento adicional en compras sobre $500.000 neto.\n• 10% de descuento adicional en compras sobre $1.000.000 neto.\n• Facturación formal inmediata con RUT empresa (afecta o exenta según ítem).';

  const garantiaTitle =
    resolveLocalized(content.garantia_title, content.garantia_title_en, locale) ||
    'Respaldo & Garantía Técnica';
  const garantiaDescription =
    resolveLocalized(content.garantia_description, content.garantia_description_en, locale) ||
    'Ventana de 30 días corridos desde la recepción para cualquier reclamo técnico o ajuste de lote.';
  const garantiaNota =
    resolveLocalized(content.garantia_nota, content.garantia_nota_en, locale) ||
    'Conservación recomendada: almacenar entre 15 °C y 25 °C en ambiente seco y protegido de la luz solar directa para mantener intacta la actividad enzimática.';

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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl lg:max-w-5xl mx-auto text-left">
              <div className="rounded-xl border border-border/60 bg-surface-raised/85 backdrop-blur-md p-3.5 flex items-center gap-3 shadow-[0_4px_16px_rgba(0,0,0,0.35)]">
                <ShieldCheck className="w-5 h-5 text-accent-text shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">{pill1Title}</div>
                  <div className="text-[11px] text-foreground/80">{pill1Subtitle}</div>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-surface-raised/85 backdrop-blur-md p-3.5 flex items-center gap-3 shadow-[0_4px_16px_rgba(0,0,0,0.35)]">
                <Truck className="w-5 h-5 text-accent-text shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">{pill2Title}</div>
                  <div className="text-[11px] text-foreground/80">{pill2Subtitle}</div>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-surface-raised/85 backdrop-blur-md p-3.5 flex items-center gap-3 shadow-[0_4px_16px_rgba(0,0,0,0.35)]">
                <FileText className="w-5 h-5 text-accent-text shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">{pill3Title}</div>
                  <div className="text-[11px] text-foreground/80">{pill3Subtitle}</div>
                </div>
              </div>
            </div>
          ) : null}
        </EditorialHero>

        {/* ── Segmentos B2B ── */}
        <section id="segmentos" className="py-20 md:py-28 px-4 border-b border-border/20 scroll-mt-28 md:scroll-mt-36">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl lg:max-w-4xl mx-auto mb-16">
              <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-2">
                {segmentosKicker}
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-foreground text-balance">
                {segmentosTitle}
              </h2>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
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
                    className="group rounded-2xl border border-border/40 bg-card overflow-hidden flex flex-col justify-between hover:border-accent/60 transition-colors w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                  >
                    <div>
                      <div className="relative h-44 w-full overflow-hidden bg-surface-sunken border-b border-border/30">
                        <Image
                          src={card.image}
                          alt={card.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2">
                          <div className="w-9 h-9 rounded-xl bg-background/85 backdrop-blur-sm border border-accent/30 flex items-center justify-center text-accent-text">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="rounded-full bg-background/85 backdrop-blur-sm border border-border/50 px-2.5 py-1 text-[0.6rem] uppercase tracking-wider text-accent-text font-semibold">
                            {card.badge}
                          </span>
                        </div>
                      </div>

                      <div className="p-6 pb-2">
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
                    </div>

                    <div className="px-6 pb-6 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-text pt-1">
                      <span>{segmentosCtaLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>

            <Link
              href="/embajadores"
              className="group mt-6 flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-accent/30 bg-accent/5 p-6 hover:border-accent/60 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-[0.65rem] uppercase tracking-wider text-accent-text font-semibold mb-1">
                  {tEmbajadores('hubKicker')}
                </p>
                <h3 className="font-display text-xl font-light text-foreground mb-1">
                  {tEmbajadores('hubTitle')}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tEmbajadores('hubDesc')}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-text shrink-0">
                <span>{tEmbajadores('hubCta')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        </section>

        {/* ── Condiciones Comerciales y Logística Mayorista ── */}
        <section className="py-16 md:py-24 px-4 border-b border-border/20 bg-background">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="block text-[0.65rem] tracking-[0.3em] uppercase text-accent-text mb-2">
                {condicionesKicker}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-light text-foreground">
                {condicionesTitle}
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                {condicionesSubtitle}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-border/40 bg-surface-raised/40 p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent-text text-xs font-bold font-mono">1</span>
                  <h3 className="font-display text-lg font-medium text-foreground">{moqTitle}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {moqDescription}
                </p>
                {moqHighlight && (
                  <div className="rounded-xl border border-border/30 bg-background/60 p-3 text-[11px] text-accent-text">
                    {moqHighlight}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border/40 bg-surface-raised/40 p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent-text text-xs font-bold font-mono">2</span>
                  <h3 className="font-display text-lg font-medium text-foreground">{despachoTitle}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {despachoDescription}
                </p>
                {despachoNota && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {despachoNota}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-border/40 bg-surface-raised/40 p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent-text text-xs font-bold font-mono">3</span>
                  <h3 className="font-display text-lg font-medium text-foreground">{descuentosTitle}</h3>
                </div>
                <div className="text-xs text-muted-foreground space-y-1.5 leading-relaxed whitespace-pre-line">
                  {descuentosItems}
                </div>
              </div>

              <div className="rounded-2xl border border-border/40 bg-surface-raised/40 p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent-text text-xs font-bold font-mono">4</span>
                  <h3 className="font-display text-lg font-medium text-foreground">{garantiaTitle}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {garantiaDescription}
                </p>
                {garantiaNota && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {garantiaNota}
                  </p>
                )}
              </div>
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
        <section id="solicitud" className="py-20 md:py-28 px-4 border-b border-border/20 scroll-mt-28 md:scroll-mt-36">
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
