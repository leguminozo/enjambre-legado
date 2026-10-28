'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, FlaskConical, RotateCcw, ShieldCheck, Truck, AlertCircle, Star } from 'lucide-react';
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

type ParsedDescription = {
  leadParagraphs: string[];
  attributes: ParsedAttribute[];
};

function parseProductDescription(raw: string | null): ParsedDescription {
  if (!raw || !raw.trim()) {
    return { leadParagraphs: [], attributes: [] };
  }

  // Normalizar vocabulario sagrado
  const normalized = raw
    .replace(/\bcosechas\b/gi, 'recolecciones')
    .replace(/\bcosechado\b/gi, 'recolectado')
    .replace(/\bcosecha\b/gi, 'recolección')
    .trim();

  const sectionRegex = /(?:Beneficios(?:\s+Clave)?|Caracter[íi]sticas|Atributos(?:\s+de\s+Origen)?|Propiedades|Notas\s+de\s+Cata):?\s*/i;
  const match = normalized.match(sectionRegex);

  let narrativePart = normalized;
  let attributesPart = '';

  if (match && match.index !== undefined) {
    narrativePart = normalized.slice(0, match.index).trim();
    attributesPart = normalized.slice(match.index + match[0].length).trim();
  }

  const leadParagraphs = narrativePart
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const attributes: ParsedAttribute[] = [];
  if (attributesPart) {
    const rawItems = attributesPart
      .split(/(?:[\n\r]+|[•*–—]\s+)/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0 && item !== '•' && item !== '-' && item !== '*');

    for (const item of rawItems) {
      const colonIdx = item.indexOf(':');
      if (colonIdx > 0 && colonIdx < 40) {
        const label = item.slice(0, colonIdx).trim();
        const value = item.slice(colonIdx + 1).trim();
        if (label && value) {
          attributes.push({ label, value });
        }
      } else {
        attributes.push({ label: '', value: item });
      }
    }
  }

  return { leadParagraphs, attributes };
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
  const continueLabel = resolveLocalized(pdp.continue_label, pdp.continue_label_en, locale);
  const warrantyText = resolveLocalized(pdp.legal_warranty_text, pdp.legal_warranty_text_en, locale) || 'Garantía Legal de 6 meses (Ley 19.496 / 21.398)';
  const retractoText = resolveLocalized(pdp.legal_retracto_text, pdp.legal_retracto_text_en, locale) || 'Derecho a retracto de 10 días (con precinto intacto)';
  const disclaimerTitle = resolveLocalized(pdp.food_disclaimer_title, pdp.food_disclaimer_title_en, locale) || 'Alimento natural del bosque nativo.';
  const disclaimerText = resolveLocalized(pdp.food_disclaimer_text, pdp.food_disclaimer_text_en, locale) || 'No constituye consejo médico ni diagnóstico de salud (Reglamento Sanitario de los Alimentos).';
  const disclaimerLinkText = resolveLocalized(pdp.food_disclaimer_link_text, pdp.food_disclaimer_link_text_en, locale) || 'evidencia botánica y organoléptica';
  const disclaimerLinkHref = pdp.food_disclaimer_link_href || '/ciencia';
  const infantWarningText = resolveLocalized(pdp.infant_warning_text, pdp.infant_warning_text_en, locale) || 'Por norma sanitaria (DTO 977/96 MINSAL), no administrar a menores de 1 año de edad.';
  const isHoneyProduct = product.category === 'miel' || !product.category || product.tags.some((t) => t.toLowerCase().includes('miel'));
  const track = useMetaTracking();
  const viewedRef = useRef(false);
  const badges = useMemo(() => resolveProductBadges(product), [product]);

  const { leadParagraphs, attributes } = useMemo(
    () => parseProductDescription(product.description),
    [product.description],
  );

  const collectionKicker = useMemo(() => {
    const found = badges.find((b) => /reserva|edici[oó]n|bosque|colecci[oó]n|legado/i.test(b));
    if (found) return found;
    if (product.categoryLabel) return product.categoryLabel;
    if (badges.length > 0) return badges[0];
    return 'Colección de Origen';
  }, [badges, product.categoryLabel]);

  const secondaryBadges = useMemo(() => {
    return badges.filter((b) => b !== collectionKicker);
  }, [badges, collectionKicker]);

  const [isQrMode, setIsQrMode] = useState(false);
  const [scannedQrCode, setScannedQrCode] = useState<string | null>(null);
  const [qrBannerDismissed, setQrBannerDismissed] = useState(false);

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
      className="bg-background pb-28 md:pb-16"
    >
      {isQrMode && !qrBannerDismissed ? (
        <div className="border-b border-primary/20 bg-primary/5 px-4 py-4 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <ProductQrCompanionBanner
              product={product}
              qrCode={scannedQrCode}
              onClose={() => setQrBannerDismissed(true)}
            />
          </div>
        </div>
      ) : null}

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

          {/* Atributos y especificaciones estructuradas */}
          {attributes.length > 0 ? (
            <div className="mt-6 rounded-xl border border-border/70 bg-card/40 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                Atributos de Origen & Elaboración
              </p>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {attributes.map((attr, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-border/40 bg-surface-sunken/40 p-2.5"
                  >
                    {attr.label ? (
                      <p className="text-xs font-semibold text-foreground/90">
                        {attr.label}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                      {attr.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Micro-badges secundarios */}
          {pdp.show_badges && secondaryBadges.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {secondaryBadges.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/60 px-2.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground"
                >
                  <span className="h-1 w-1 rounded-full bg-accent/60" aria-hidden="true" />
                  {b}
                </span>
              ))}
            </div>
          ) : null}

          {product.ingredientes ? (
            <div className="mt-4 rounded-lg border border-border/60 bg-card/40 p-3 text-xs">
              <span className="font-semibold text-foreground/90 uppercase tracking-wider text-[10px] block mb-1">
                Ingredientes
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {product.ingredientes}
              </p>
            </div>
          ) : null}

          <div id="comprar-ahora">
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

          {/* Certificado de Autenticidad, Garantías Legales y Respaldo Científico */}
          <div className="mt-6 rounded-xl border border-border/80 bg-gradient-to-b from-card/60 to-card/30 p-4 text-xs">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                Garantía de Origen & Autenticidad
              </span>
              <span className="text-[9px] font-mono tracking-widest text-muted-foreground/60 uppercase">
                Estándar Chiloé
              </span>
            </div>

            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              <div className="flex items-start gap-2 rounded-lg border border-border/40 bg-surface-sunken/30 p-2.5">
                <ShieldCheck className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-[11px] font-medium text-foreground">{warrantyText}</p>
                  <p className="text-[10px] text-muted-foreground">Compromiso legal de calidad oficial</p>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-border/40 bg-surface-sunken/30 p-2.5">
                <RotateCcw className="h-3.5 w-3.5 text-accent/80 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-[11px] font-medium text-foreground">{retractoText}</p>
                  <p className="text-[10px] text-muted-foreground">Derecho a retracto con precinto seguro</p>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border/40 flex items-start gap-2.5 text-[11px] text-muted-foreground">
              <FlaskConical className="h-4 w-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="text-foreground/90 font-medium">{disclaimerTitle}</span>{' '}
                <span>Conoce nuestra evidencia botánica certificada en </span>
                <Link
                  href={disclaimerLinkHref}
                  className="text-accent underline underline-offset-2 hover:text-accent/80 font-medium"
                >
                  {disclaimerLinkText}
                </Link>
                .
                <p className="text-[10px] text-muted-foreground/75 mt-0.5 leading-relaxed">
                  {disclaimerText}
                </p>
              </div>
            </div>

            {isHoneyProduct && infantWarningText.trim() ? (
              <div className="mt-2.5 pt-2 border-t border-border/30 flex items-center gap-2 text-[10px] text-muted-foreground/80">
                <AlertCircle className="h-3 w-3 text-muted-foreground/70 shrink-0" aria-hidden="true" />
                <span>{infantWarningText}</span>
              </div>
            ) : null}
          </div>

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

          {continueLabel.trim() ? (
            <Link
              href="/catalogo"
              className="mt-8 inline-flex min-h-11 items-center text-sm font-medium text-accent-text hover:underline md:mt-10"
            >
              ← {continueLabel}
            </Link>
          ) : null}
        </div>
      </div>

      {pdp.show_sensory_profile !== false &&
      (product.perfil_sensorial != null ||
        Boolean(product.tipo_sensorial) ||
        product.category === 'miel' ||
        !product.category ||
        product.tags.some((t) => t.toLowerCase().includes('miel')) ||
        isQrMode) ? (
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
          />
        </div>
      ) : null}

      {pdp.show_reviews || isQrMode ? (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-8">
          <ResenasSection
            productoId={product.id}
            productName={product.name}
            initialAggregate={resenasAggregate}
            tipoSensorial={product.tipo_sensorial}
            variantes={product.variantes}
          />
        </div>
      ) : null}

      {/* Sticky thumb CTA — solo móvil */}
      <div className="tienda-sticky-cta md:hidden" data-testid="pdp-sticky-cta">
        <div className="tienda-sticky-cta-inner">
          <div className="min-w-0">
            <p className="truncate text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              {product.name}
            </p>
            <p className="tienda-sticky-cta-price">{formatCLP(product.price)}</p>
          </div>
          <div className="flex items-center gap-2">
            {isQrMode && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('voces-del-bosque');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  window.dispatchEvent(new CustomEvent('enjambre:open-resena-composer'));
                }}
                className="inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20 shrink-0"
              >
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span>Evaluar</span>
              </button>
            )}
            <BuyNowButton product={product} disabled={!inStock} className="tienda-sticky-cta-btn" />
          </div>
        </div>
      </div>
    </main>
  );
}
