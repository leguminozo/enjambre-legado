'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  Compass,
  ShieldCheck,
  ExternalLink,
  MapPin,
  ShoppingBag,
} from 'lucide-react';
import { formatCLP } from '@/lib/shop/format';
import type { ShopProduct } from '@/lib/shop/products';

export interface ProductQrCompanionBannerProps {
  product: ShopProduct;
  collectionKicker?: string;
  qrCode?: string | null;
  onSwitchToStore?: () => void;
}

/**
 * Mensajes de bienvenida de alta gama según la tipología sensorial de origen.
 * Tono de Poder Silencioso: proyecta elegancia, maestría y respeto por el territorio.
 */
function resolveCompanionWelcome(product: ShopProduct): {
  kicker: string;
  title: string;
  message: string;
  ctaText: string;
} {
  const custom = product.perfil_sensorial;
  const tipo = product.tipo_sensorial || 'miel';
  const formatName = product.formatLabel || product.format || 'Ejemplar Oficial';

  const customKicker = custom?.qr_modo === 'trazabilidad'
    ? 'Certificado Oficial · Ejemplar en Mano'
    : 'Experiencia de Cata & Origen · En tus Manos';

  const defaultTitles: Record<string, string> = {
    miel: 'Apreciación Sensorial de Bosque Nativo',
    miel_fortificada: 'Alquimia Sensorial de Miel & Botánicos',
    hidromiel: 'Cata de Fermentación Sagrada de Miel',
    extracto: 'Potencia Botánica de Alta Pureza',
    cosmetica: 'Ritual Biológico de Cuidado & Piel',
    infusion: 'Aroma & Esencia de Bosque Lluvioso',
  };

  const defaultMessages: Record<string, string> = {
    miel: `Sostienes en tus manos un ${formatName.toLowerCase()} de recolección viva del bosque nativo de Chiloé. Te invitamos a abrirlo, apreciar su bouquet aromático y registrar tu percepción en la constelación sensorial.`,
    miel_fortificada: `Sostienes en tus manos una unión de miel nativa con botánicos seleccionados (${formatName.toLowerCase()}). Explora su textura, intensidad y comparte tu evaluación organoléptica.`,
    hidromiel: `Sostienes en tus manos una fermentación viva con historia territorial. Aprecia sus notas aromáticas, balance y califica tu experiencia de cata.`,
    extracto: `Sostienes en tus manos una formulación botánica de alta pureza. Conoce su trazabilidad y registra tus impresiones.`,
    cosmetica: `Sostienes en tus manos una emulsión elaborada bajo estándares nobles de origen. Descubre su textura sobre la piel y comparte tu evaluación.`,
    infusion: `Sostienes en tus manos hojas y flores recolectadas en el bosque templado lluvioso. Disfruta su infusión y evalúa su perfil sensorial.`,
  };

  const title = custom?.qr_titulo?.trim() || defaultTitles[tipo] || 'Experiencia Sensorial de Origen';
  const message =
    custom?.qr_mensaje?.trim() ||
    defaultMessages[tipo] ||
    'Sostienes en tus manos una creación oficial de origen. Explora su perfil biofísico y comparte tu evaluación de cata.';
  const ctaText = custom?.qr_cta_resena?.trim() || 'Evaluar y Dejar mi Nota de Cata ★';

  return {
    kicker: customKicker,
    title,
    message,
    ctaText,
  };
}

export function ProductQrCompanionBanner({
  product,
  collectionKicker = 'Colección de Origen',
  qrCode,
  onSwitchToStore,
}: ProductQrCompanionBannerProps) {
  const welcome = useMemo(() => resolveCompanionWelcome(product), [product]);
  const perfil = product.perfil_sensorial;
  const qrModo = perfil?.qr_modo || 'experiencia';
  const primaryPhoto = product.photos[0] ?? null;

  const notasAromaticas = useMemo(() => {
    if (perfil?.notas_aromaticas && Array.isArray(perfil.notas_aromaticas)) {
      return perfil.notas_aromaticas.filter((n) => typeof n === 'string' && n.trim().length > 0);
    }
    return [];
  }, [perfil]);

  const handleOpenEvaluation = () => {
    const el = document.getElementById('voces-del-bosque');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('enjambre:open-resena-composer'));
    }
  };

  const handleScrollToSensory = () => {
    const el = document.getElementById('constelacion-sensorial');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      aria-label="Aterrizaje de cata y reseña del ejemplar escaneado"
      className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-b from-surface-raised/95 via-card/90 to-card/70 p-5 sm:p-8 shadow-xl"
    >
      {/* Barra superior: Estado Phygital + Paso opcional a tienda */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            {welcome.kicker}
          </span>
          {qrCode && (
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-primary">
              Sello {qrCode}
            </span>
          )}
        </div>

        {onSwitchToStore && (
          <button
            type="button"
            onClick={onSwitchToStore}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface-sunken/70 px-3 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground cursor-pointer"
          >
            <ShoppingBag className="h-3 w-3 text-primary" />
            <span>Ver en tienda ({formatCLP(product.price)})</span>
          </button>
        )}
      </div>

      {/* Identidad del Ejemplar Escaneado (Sin precios ni botones de carrito) */}
      <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-5">
        {primaryPhoto ? (
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md">
            <Image
              src={primaryPhoto}
              alt={product.name}
              fill
              className="object-cover"
              sizes="112px"
            />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
              {collectionKicker}
            </span>
            {product.formatLabel || product.format ? (
              <span className="rounded-full border border-border/80 bg-surface-sunken/80 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-foreground/80">
                {product.formatLabel ?? product.format}
              </span>
            ) : null}
            {product.nombre_lote ? (
              <span className="rounded-full border border-border/80 bg-surface-sunken/60 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                Lote {product.nombre_lote}
              </span>
            ) : null}
            {product.origenApicola ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="h-3 w-3 text-primary/80 shrink-0" />
                <span>{product.origenApicola}</span>
              </span>
            ) : null}
          </div>

          <h1 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight text-foreground">
            {product.name}
          </h1>

          <p className="mt-1.5 font-display text-sm sm:text-base italic text-primary/90">
            {welcome.title}
          </p>
        </div>
      </div>

      {/* Mensaje de bienvenida y contexto de cata */}
      <p className="mt-4 max-w-3xl text-xs sm:text-sm leading-relaxed text-foreground/85">
        {welcome.message}
      </p>

      {/* Notas de bouquet y momento sugerido */}
      {(notasAromaticas.length > 0 || perfil?.momento_consumo) && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/40 pt-3.5">
          {notasAromaticas.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Notas de bouquet:
              </span>
              {notasAromaticas.slice(0, 5).map((nota) => (
                <span
                  key={nota}
                  className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-medium text-primary"
                >
                  {nota}
                </span>
              ))}
            </div>
          )}

          {perfil?.momento_consumo && (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="text-muted-foreground/40 hidden sm:inline" aria-hidden="true">·</span>
              <span className="font-semibold uppercase tracking-wider">Momento sugerido:</span>
              <span className="text-foreground/90">{perfil.momento_consumo}</span>
            </div>
          )}
        </div>
      )}

      {/* Llamados a la acción centrados en Cata, Reseña y Origen */}
      <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
        <button
          type="button"
          onClick={handleOpenEvaluation}
          className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90"
        >
          <Star className="h-4 w-4 fill-primary-foreground" />
          <span>{welcome.ctaText}</span>
        </button>

        <button
          type="button"
          onClick={handleScrollToSensory}
          className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-full border border-border/80 bg-surface-sunken/70 px-5 py-2.5 text-xs font-medium text-foreground transition hover:bg-surface-sunken hover:border-primary/40"
        >
          <Compass className="h-4 w-4 text-primary" />
          <span>Explorar Constelación Sensorial</span>
        </button>

        {product.trazabilidadQr && (
          <Link
            href={qrCode ? `/qr-scan?code=${encodeURIComponent(qrCode)}` : `/producto/${product.slug}/trazabilidad`}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-border/50 px-4 py-2 text-xs text-muted-foreground transition hover:border-primary/30 hover:text-primary"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>Certificado de origen</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    </section>
  );
}
