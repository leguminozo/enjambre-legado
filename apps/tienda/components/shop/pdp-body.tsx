'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, RotateCcw, ShieldCheck, Truck, AlertCircle } from 'lucide-react';
import { formatCLP } from '@/lib/shop/format';
import { type ShopProduct, resolveProductBadges } from '@/lib/shop/products';
import type { ReplenishmentPlan } from '@/lib/shop/replenishment';
import { ProductGallery } from '@/components/shop/product-gallery';
import { ProductPurchaseActions } from '@/components/shop/product-purchase-actions';
import { ProductQrCompanionBanner } from '@/components/shop/product-qr-companion-banner';
import { ResenasSection } from '@/components/shop/resenas-section';
import { PerfilSensorialSection } from '@/components/shop/perfil-sensorial-section';
import { TraceabilitySection, AddToCartButton, BuyNowButton } from '@/app/producto/[slug]/ui';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import { resolveLocalized } from '@/lib/shop/store-chrome';
import { useMetaTracking } from '@/lib/tracking/client';
import type { ResenasListResponse } from '@/lib/shop/resenas-api';
import type { AnalisisPublico } from '@/lib/shop/analisis-lote';

type Props = {
  product: ShopProduct;
  inStock: boolean;
  plans: ReplenishmentPlan[];
  resenasAggregate: { ratingValue: number; reviewCount: number } | null;
  resenasData?: ResenasListResponse | null;
  analisis?: AnalisisPublico | null;
};

type ParsedAttribute = {
  label: string;
  value: string;
};

function formatNarrativeParagraphs(raw: string | null): string[] {
  if (!raw || !raw.trim()) {
    return [];
  }

  // Normalizar vocabulario sagrado
  const normalized = raw
    .replace(/\bcosechas\b/gi, 'recolecciones')
    .replace(/\bcosechado\b/gi, 'recolectado')
    .replace(/\bcosecha\b/gi, 'recolección')
    .trim();

  return normalized
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

interface OriginAndTrustBlocksProps {
  attributes: ParsedAttribute[];
  advertenciaSanitaria?: string | null;
  ingredientes?: string | null;
  warrantyText: string;
  retractoText: string;
  isHoneyProduct: boolean;
  infantWarningText: string;
  showTraceability: boolean;
  product: ShopProduct;
}

function OriginAndTrustBlocks({
  attributes,
  advertenciaSanitaria,
  ingredientes,
  warrantyText,
  retractoText,
  isHoneyProduct,
  infantWarningText,
  showTraceability,
  product,
}: OriginAndTrustBlocksProps) {
  return (
    <div className="space-y-6">
      {/* Advertencia Sanitaria / Precaución Botánica Explícita */}
      {advertenciaSanitaria ? (
        <div className="rounded-2xl border border-accent/40 bg-accent/5 p-4 sm:p-5 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-accent-text uppercase tracking-wider text-[10px] sm:text-[11px]">
                Nota Importante & Precaución de Uso
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {advertenciaSanitaria}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Atributos y especificaciones estructuradas neutrales */}
      {attributes.length > 0 ? (
        <div className="rounded-2xl border border-border/70 bg-card/40 p-5 sm:p-6">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            Atributos de Origen & Elaboración
          </p>
          <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
            {attributes.map((attr, idx) => {
              const isWarning = /nota importante|precauci[oó]n|advertencia|salud/i.test(attr.label);
              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-3.5 transition-colors ${
                    isWarning
                      ? 'border-accent/40 bg-accent/5'
                      : 'border-border/50 bg-surface-sunken/40'
                  }`}
                >
                  {attr.label ? (
                    <p className={`text-xs font-semibold ${isWarning ? 'text-accent-text' : 'text-foreground/90'}`}>
                      {attr.label}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {attr.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Ingredientes */}
      {ingredientes ? (
        <div className="rounded-xl border border-border/60 bg-card/40 p-4 text-xs">
          <span className="font-semibold text-foreground/90 uppercase tracking-wider text-[10px] block mb-1.5">
            Ingredientes
          </span>
          <p className="text-muted-foreground leading-relaxed">
            {ingredientes}
          </p>
        </div>
      ) : null}

      {/* Garantías Legales y Autenticidad */}
      <div className="rounded-2xl border border-border/80 bg-gradient-to-b from-card/60 to-card/30 p-4 sm:p-5 text-xs">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-center gap-2.5 rounded-xl border border-border/40 bg-surface-sunken/30 p-3 text-center">
            <ShieldCheck className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
            <p className="text-xs font-medium text-foreground">{warrantyText}</p>
          </div>

          <div className="flex items-center justify-center gap-2.5 rounded-xl border border-border/40 bg-surface-sunken/30 p-3 text-center">
            <RotateCcw className="h-4 w-4 text-accent/80 shrink-0" aria-hidden="true" />
            <p className="text-xs font-medium text-foreground">{retractoText}</p>
          </div>
        </div>

        {isHoneyProduct && infantWarningText.trim() ? (
          <div className="mt-3 pt-2.5 border-t border-border/30 flex items-center justify-center text-center gap-2 text-[11px] text-muted-foreground/80">
            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" aria-hidden="true" />
            <span>{infantWarningText}</span>
          </div>
        ) : null}
      </div>

      {/* Trazabilidad Certificada */}
      {showTraceability && (product.trazabilidadQr ?? true) ? (
        <TraceabilitySection
          slug={product.slug}
          blockchainHash={product.blockchain_hash}
          colmenaOrigen={product.colmena_origen}
          fechaCosecha={product.fecha_cosecha}
          fechaEnvasado={product.fecha_envasado}
          nombreLote={product.nombre_lote}
          descripcionLote={product.descripcion_lote}
          loteId={product.lote_id}
          lotePublico={product.lote_publico}
          videoUrl={product.videoUrl}
          origenApicola={product.origenApicola}
        />
      ) : null}
    </div>
  );
}

export function PdpBody({
  product,
  inStock,
  plans,
  resenasAggregate,
  resenasData,
  analisis,
}: Props) {
  const locale = useLocale();
  const { pdp } = useStoreChrome();
  const warrantyText = resolveLocalized(pdp.legal_warranty_text, pdp.legal_warranty_text_en, locale) || 'Garantía Legal de 6 meses (Ley 19.496 / 21.398)';
  const retractoText = resolveLocalized(pdp.legal_retracto_text, pdp.legal_retracto_text_en, locale) || 'Derecho a retracto de 10 días (con precinto intacto)';
  const infantWarningText = resolveLocalized(pdp.infant_warning_text, pdp.infant_warning_text_en, locale) || 'Por norma sanitaria (DTO 977/96 MINSAL), no administrar a menores de 1 año de edad.';
  const isHoneyProduct = product.category === 'miel' || !product.category || product.tags.some((t) => t.toLowerCase().includes('miel'));
  const track = useMetaTracking();
  const viewedRef = useRef(false);
  const badges = useMemo(() => resolveProductBadges(product), [product]);

  const leadParagraphs = useMemo(
    () => formatNarrativeParagraphs(product.description),
    [product.description],
  );

  const structuredAttributes: ParsedAttribute[] = useMemo(() => {
    const rawList = product.perfil_sensorial?.atributos;
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList
        .filter((a) => a && (a.label?.trim() || a.value?.trim()))
        .map((a) => ({ label: a.label?.trim() ?? '', value: a.value?.trim() ?? '' }));
    }
    return [];
  }, [product.perfil_sensorial?.atributos]);

  const advertenciaSanitaria = product.perfil_sensorial?.advertencia_sanitaria?.trim() || null;

  const collectionKicker = useMemo(() => {
    const found = badges.find((b) => /reserva|edici[oó]n|bosque|colecci[oó]n|legado/i.test(b));
    if (found) return found;
    if (product.categoryLabel) return product.categoryLabel;
    if (badges.length > 0) return badges[0];
    return 'Colección de Origen';
  }, [badges, product.categoryLabel]);

  const [isQrMode, setIsQrMode] = useState(false);
  const [scannedQrCode, setScannedQrCode] = useState<string | null>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const purchaseBlockRef = useRef<HTMLDivElement | null>(null);

  const isDedicatedQrView =
    isQrMode && product.perfil_sensorial?.qr_modo !== 'comercial';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pathname = window.location.pathname || '';
    const search = window.location.search || '';
    const params = search ? new URLSearchParams(search) : null;
    const origen = params?.get('origen');
    const qrParam = params?.get('qr')?.trim() || null;

    if (
      pathname.startsWith('/q/') ||
      pathname.startsWith('/f/') ||
      origen === 'qr' ||
      origen === 'frasco' ||
      origen === 'etiqueta' ||
      Boolean(qrParam)
    ) {
      setIsQrMode(true);
      if (qrParam) setScannedQrCode(qrParam);
    }
  }, []);

  // Evitar duplicidad en móvil: la barra fija inferior solo aparece cuando el
  // bloque de compra principal ya salió por arriba del viewport al hacer scroll.
  useEffect(() => {
    if (isDedicatedQrView) {
      setShowStickyCta(false);
      return;
    }
    const target = purchaseBlockRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const scrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        setShowStickyCta(scrolledPast);
      },
      { threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [isDedicatedQrView]);

  // ViewContent (Meta) — una vez por montaje del PDP (gatea por consentimiento)
  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    track({
      eventName: 'ViewContent',
      value: Math.round(product.price),
      currency: 'CLP',
      contentIds: [product.id],
      contents: [{ id: product.id, quantity: 1, itemPrice: product.price }],
      contentName: product.name,
    });
  }, [track, product.id, product.name, product.price]);

  return (
    <main
      data-cms-section="pdp_settings"
      className={`bg-background ${isDedicatedQrView ? 'pb-16' : 'pb-28 md:pb-16'}`}
    >
      {isDedicatedQrView ? (
        <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
          <ProductQrCompanionBanner
            product={product}
            collectionKicker={collectionKicker}
            qrCode={scannedQrCode}
            onSwitchToStore={() => setIsQrMode(false)}
          />

          <PerfilSensorialSection
            productName={product.name}
            productSlug={product.slug}
            productTags={product.tags}
            origenApicola={product.origenApicola}
            nombreLote={product.nombre_lote}
            perfilSensorial={product.perfil_sensorial}
            tipoSensorial={product.tipo_sensorial}
            variantes={product.variantes}
            resenasData={resenasData}
            analisisLote={analisis}
            pdpSettings={pdp}
          />

          <ResenasSection
            productoId={product.id}
            productName={product.name}
            productSlug={product.slug}
            initialAggregate={resenasAggregate}
            tipoSensorial={product.tipo_sensorial}
            tipoSensorialLabel={product.tipoSensorialLabel}
            perfilSensorial={product.perfil_sensorial}
            variantes={product.variantes}
          />

          {pdp.show_traceability && (product.trazabilidadQr ?? true) ? (
            <TraceabilitySection
              slug={product.slug}
              blockchainHash={product.blockchain_hash}
              colmenaOrigen={product.colmena_origen}
              fechaCosecha={product.fecha_cosecha}
              fechaEnvasado={product.fecha_envasado}
              nombreLote={product.nombre_lote}
              descripcionLote={product.descripcion_lote}
              loteId={product.lote_id}
              lotePublico={product.lote_publico}
              videoUrl={product.videoUrl}
              origenApicola={product.origenApicola}
            />
          ) : null}

          {/* Pie discreto de reposición comercial (solo si el usuario desea ir a tienda) */}
          <div className="rounded-2xl border border-border/70 bg-card/40 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                Reposición de Ejemplar
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                ¿Deseas adquirir otro ejemplar de <strong className="text-foreground">{product.name}</strong> o explorar más creaciones en nuestro catálogo?
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsQrMode(false);
                  if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <span>Ver ficha en tienda · {formatCLP(product.price)}</span>
              </button>
              <Link
                href="/catalogo"
                className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                Explorar catálogo
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          {pdp.show_breadcrumb ? (
            <div className="border-b border-border px-4 py-2 sm:px-6 sm:py-3 md:py-4">
              <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 text-xs text-muted-foreground sm:text-sm">
                <Link
                  href="/catalogo"
                  className="inline-flex min-h-11 items-center font-medium text-accent-text hover:text-accent/80 md:hidden"
                >
                  ← Catálogo
                </Link>
                <span className="hidden md:contents">
                  <Link href="/" className="inline-flex min-h-11 items-center hover:text-accent">
                    Inicio
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
                  <Link href="/catalogo" className="inline-flex min-h-11 items-center hover:text-accent">
                    Creaciones
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
                  <span className="inline-flex min-h-11 items-center font-medium text-foreground/70">
                    {product.name}
                  </span>
                </span>
              </div>
            </div>
          ) : null}

          <div className="mx-auto grid max-w-6xl gap-8 px-0 py-0 sm:gap-14 sm:px-6 sm:py-10 lg:grid-cols-[1fr_minmax(280px,400px)] lg:items-start lg:px-6 lg:py-14">
            <div className="px-0 sm:px-0">
              <ProductGallery
                photos={product.photos}
                alt={product.name}
                overlayOpacity={pdp.gallery_overlay_opacity ?? 0}
              />

              {/* En escritorio (lg+): Atributos de origen, ingredientes, garantías y trazabilidad bajo la galería */}
              <div className="hidden lg:block mt-8">
                <OriginAndTrustBlocks
                  attributes={structuredAttributes}
                  advertenciaSanitaria={advertenciaSanitaria}
                  ingredientes={product.ingredientes}
                  warrantyText={warrantyText}
                  retractoText={retractoText}
                  isHoneyProduct={isHoneyProduct}
                  infantWarningText={infantWarningText}
                  showTraceability={pdp.show_traceability}
                  product={product}
                />
              </div>
            </div>

            <div className="px-4 sm:px-0 lg:sticky lg:top-28">
              {/* Kicker tipográfico de colección & formato */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.22em] uppercase text-accent">
                  {collectionKicker}
                </span>
                {pdp.show_format_badge && (product.formatLabel || product.format) ? (
                  <>
                    <span className="text-muted-foreground/40 text-xs" aria-hidden="true">·</span>
                    <span className="rounded-full border border-border/80 bg-surface-raised/70 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-foreground/80">
                      {product.formatLabel ?? product.format}
                    </span>
                  </>
                ) : null}
              </div>

              <h1 className="mt-2.5 font-display text-2xl font-semibold leading-tight text-foreground text-balance sm:text-3xl lg:text-4xl">
                {product.name}
              </h1>

              <p className="mt-3 font-display text-2xl tabular-nums text-accent-text sm:text-3xl md:mt-4">
                {formatCLP(product.price)}
              </p>

              <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
                <Truck className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                <span>Despacho de cortesía sobre $45.000 a todo Chile</span>
              </div>

              {/* Bloque editorial sin borde lateral */}
              {leadParagraphs.length > 0 ? (
                <div className="mt-5 space-y-3.5 sm:mt-6">
                  {leadParagraphs.map((paragraph, idx) => (
                    <p
                      key={idx}
                      className="text-sm leading-relaxed text-foreground/80 sm:text-[15px]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : product.description ? (
                <p className="mt-5 text-sm leading-relaxed text-foreground/80 sm:mt-6 sm:text-[15px]">
                  {product.description}
                </p>
              ) : (
                <p className="mt-5 text-sm italic text-muted-foreground/60 sm:mt-6">
                  Descripción disponible pronto.
                </p>
              )}

              {/* Selector de formatos & variantes entrelazadas */}
              {product.variantes && product.variantes.length > 0 && (() => {
                const areAllFormats = product.variantes.every((v) => v.tipo_variante === 'formato');
                const weightsDiffer = product.variantes.some((v) => v.peso_neto_g && v.peso_neto_g !== product.pesoNetoG);
                const isPureFormatSwitch = areAllFormats && weightsDiffer;

                const cleanThisName = (product.name || '')
                  .replace(/\s*\(\d+\s*g\)/i, '')
                  .replace(/\s*\d+\s*g$/i, '')
                  .trim();

                const activeProductLabel = isPureFormatSwitch
                  ? product.formatLabel || product.format || (product.pesoNetoG ? `${product.pesoNetoG}g` : 'Formato Actual')
                  : cleanThisName || product.formatLabel || 'Original';

                const getVariantLabel = (v: typeof product.variantes[number]) => {
                  if (isPureFormatSwitch && v.peso_neto_g) {
                    return `${v.peso_neto_g}g`;
                  }
                  // If this is a variety/infusion switch, check if nombre_variante was erroneously set to a weight (e.g. "13g")
                  const isWeightOnly = Boolean(v.nombre_variante && /^\d+\s*(g|kg|ml|l|u|un)$/i.test(v.nombre_variante.trim()));
                  if (v.nombre_variante && v.nombre_variante.trim() && (!isWeightOnly || isPureFormatSwitch)) {
                    return v.nombre_variante;
                  }
                  if (v.producto_vinculado?.nombre) {
                    return v.producto_vinculado.nombre
                      .replace(/\s*\(\d+\s*g\)/i, '')
                      .replace(/\s*\d+\s*g$/i, '')
                      .trim();
                  }
                  if (v.nombre_variante && v.nombre_variante.trim()) {
                    return v.nombre_variante;
                  }
                  if (v.producto_vinculado?.formato) {
                    return v.producto_vinculado.formato;
                  }
                  if (v.peso_neto_g && weightsDiffer) {
                    return `${v.peso_neto_g}g`;
                  }
                  return 'Opción';
                };

                return (
                  <div className="mt-5 rounded-xl border border-border/70 bg-card/40 p-3.5 space-y-2.5 text-center">
                    <div className="flex items-center justify-center">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                        {isPureFormatSwitch ? 'Formatos' : 'Variantes'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
                      <span className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground border border-primary shadow-sm max-w-full">
                        {product.photos[0] ? (
                          <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md border border-primary-foreground/30 bg-black/20">
                            <Image
                              src={product.photos[0]}
                              alt={activeProductLabel}
                              fill
                              className="object-cover"
                              sizes="24px"
                            />
                          </span>
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground shrink-0 animate-pulse" />
                        )}
                        <span className="truncate">{activeProductLabel}</span>
                      </span>

                      {product.variantes.map((v) => {
                        const linkedSlug = v.producto_vinculado?.slug;
                        const displayLabel = getVariantLabel(v);
                        const displayPrice = v.precio_override ?? v.producto_vinculado?.precio ?? null;
                        const variantPhotosRaw = v.producto_vinculado?.fotos;
                        const variantPhoto = Array.isArray(variantPhotosRaw) && variantPhotosRaw.length > 0
                          ? variantPhotosRaw[0]
                          : typeof variantPhotosRaw === 'string'
                            ? variantPhotosRaw
                            : null;

                        if (linkedSlug) {
                          return (
                            <Link
                              key={v.id}
                              href={`/producto/${linkedSlug}`}
                              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-sunken/60 hover:bg-surface-raised text-foreground/80 hover:text-foreground border border-border/60 hover:border-primary/50 transition-all duration-150 group max-w-full"
                              title={`Ver ${v.nombre_variante || displayLabel}`}
                            >
                              {variantPhoto ? (
                                <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md border border-border/60 bg-surface-sunken group-hover:border-primary/50 transition-colors">
                                  <Image
                                    src={variantPhoto}
                                    alt={displayLabel}
                                    fill
                                    className="object-cover"
                                    sizes="24px"
                                  />
                                </span>
                              ) : null}
                              <span className="truncate">{displayLabel}</span>
                              {displayPrice != null && displayPrice !== product.price && (
                                <span className="text-[10px] text-muted-foreground group-hover:text-foreground/90 font-mono shrink-0">
                                  {formatCLP(displayPrice)}
                                </span>
                              )}
                            </Link>
                          );
                        }

                        return (
                          <span
                            key={v.id}
                            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-sunken/40 text-muted-foreground border border-border/40 max-w-full"
                            title={v.nombre_variante || displayLabel}
                          >
                            {variantPhoto ? (
                              <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md border border-border/40 bg-surface-sunken">
                                <Image
                                  src={variantPhoto}
                                  alt={displayLabel}
                                  fill
                                  className="object-cover"
                                  sizes="24px"
                                />
                              </span>
                            ) : null}
                            <span className="truncate">{displayLabel}</span>
                            {displayPrice != null && (
                              <span className="text-[10px] opacity-70 font-mono shrink-0">
                                {formatCLP(displayPrice)}
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div id="comprar-ahora" ref={purchaseBlockRef}>
                {/* Desktop / tablet purchase actions */}
                <div className="hidden md:block">
                  <ProductPurchaseActions
                    product={product}
                    plans={pdp.show_replenishment ? plans : []}
                    inStock={inStock}
                  />
                </div>

                {/* Mobile inline purchase actions */}
                <div className="mt-6 md:hidden">
                  <ProductPurchaseActions
                    product={product}
                    plans={pdp.show_replenishment ? plans : []}
                    inStock={inStock}
                    hidePrimaryAdd={false}
                  />
                </div>
              </div>

              {/* En móvil (<lg): Atributos de origen, ingredientes, garantías y trazabilidad tras el bloque de compra */}
              <div className="lg:hidden mt-6">
                <OriginAndTrustBlocks
                  attributes={structuredAttributes}
                  advertenciaSanitaria={advertenciaSanitaria}
                  ingredientes={product.ingredientes}
                  warrantyText={warrantyText}
                  retractoText={retractoText}
                  isHoneyProduct={isHoneyProduct}
                  infantWarningText={infantWarningText}
                  showTraceability={pdp.show_traceability}
                  product={product}
                />
              </div>
            </div>
          </div>

          {pdp.show_sensory_profile !== false &&
          (product.perfil_sensorial != null ||
            Boolean(product.tipo_sensorial) ||
            product.category === 'miel' ||
            !product.category ||
            product.tags.some((t) => t.toLowerCase().includes('miel'))) ? (
            <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-8">
              <PerfilSensorialSection
                productName={product.name}
                productSlug={product.slug}
                productTags={product.tags}
                origenApicola={product.origenApicola}
                nombreLote={product.nombre_lote}
                perfilSensorial={product.perfil_sensorial}
                tipoSensorial={product.tipo_sensorial}
                variantes={product.variantes}
                resenasData={resenasData}
                analisisLote={analisis}
                pdpSettings={pdp}
              />
            </div>
          ) : null}

          {pdp.show_reviews ? (
            <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-8">
              <ResenasSection
                productoId={product.id}
                productName={product.name}
                productSlug={product.slug}
                initialAggregate={resenasAggregate}
                tipoSensorial={product.tipo_sensorial}
                tipoSensorialLabel={product.tipoSensorialLabel}
                perfilSensorial={product.perfil_sensorial}
                variantes={product.variantes}
              />
            </div>
          ) : null}

          {/* Sticky thumb CTA — solo móvil, y solo aparece al pasar el bloque de compra principal */}
          {showStickyCta ? (
            <div className="tienda-sticky-cta md:hidden" data-testid="pdp-sticky-cta">
              <div className="tienda-sticky-cta-inner">
                <div className="min-w-0">
                  <p className="truncate text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                    {product.name}
                  </p>
                  <p className="tienda-sticky-cta-price">{formatCLP(product.price)}</p>
                </div>
                <BuyNowButton product={product} disabled={!inStock} className="tienda-sticky-cta-btn" />
              </div>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}
