'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Star,
  Compass,
  ShieldCheck,
  X,
  ExternalLink,
  MapPin,
  ChevronRight,
  PackageCheck,
} from 'lucide-react';
import type { ShopProduct } from '@/lib/shop/products';

export interface ProductQrCompanionBannerProps {
  product: ShopProduct;
  qrCode?: string | null;
  onClose?: () => void;
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
  const formatName = product.formatLabel || product.format || 'Frasco Oficial';

  // Overrides configurados desde Núcleo
  const customKicker = custom?.qr_modo === 'trazabilidad'
    ? 'Certificado Oficial · En tus Manos'
    : custom?.qr_modo === 'comercial'
      ? 'Acompañamiento de Producto · Registro de Origen'
      : 'Guía de Cata & Origen · En tus Manos';

  const defaultTitles: Record<string, string> = {
    miel: 'Apreciación Sensorial de Bosque Nativo',
    miel_fortificada: 'Alquimia Sensorial de Miel & Botánicos',
    hidromiel: 'Cata de Fermentación Sagrada de Miel',
    extracto: 'Potencia Botánica de Alta Pureza',
    cosmetica: 'Ritual Biológico de Cuidado & Regeneración',
    infusion: 'Aroma & Esencia de Bosque Lluvioso',
  };

  const defaultMessages: Record<string, string> = {
    miel: `Tienes en tus manos un ${formatName.toLowerCase()} de recolección viva del bosque nativo de Chiloé. Te invitamos a abrirlo, apreciar su bouquet aromático y dejar tu huella en la constelación sensorial de la comunidad.`,
    miel_fortificada: `Tienes en tus manos una unión de miel nativa con botánicos seleccionados. Te invitamos a explorar su textura, intensidad y compartir tu percepción organoléptica.`,
    hidromiel: `Tienes en tus manos una fermentación viva con historia territorial. Aprecia sus notas aromáticas, balance y califica tu experiencia de cata.`,
    extracto: `Tienes en tus manos una formulación botánica de alta pureza. Te invitamos a conocer su trazabilidad y registrar tus impresiones de uso.`,
    cosmetica: `Tienes en tus manos una emulsión elaborada bajo estándares nobles de origen. Descubre su textura sobre la piel y comparte tu evaluación.`,
    infusion: `Tienes en tus manos hojas y flores recolectadas en el bosque templado lluvioso. Disfruta su infusión y evalúa su perfil sensorial.`,
  };

  const title = custom?.qr_titulo?.trim() || defaultTitles[tipo] || 'Experiencia Sensorial de Origen';
  const message = custom?.qr_mensaje?.trim() || defaultMessages[tipo] || `Tienes en tus manos una creación oficial de origen. Explora su perfil biofísico y comparte tu evaluación de cata.`;
  const ctaText = custom?.qr_cta_resena?.trim() || 'Aportar Nota de Cata ★';

  return {
    kicker: customKicker,
    title,
    message,
    ctaText,
  };
}

export function ProductQrCompanionBanner({
  product,
  qrCode,
  onClose,
}: ProductQrCompanionBannerProps) {
  const [minimized, setMinimized] = useState(false);

  const welcome = useMemo(() => resolveCompanionWelcome(product), [product]);
  const perfil = product.perfil_sensorial;
  const qrModo = perfil?.qr_modo || 'experiencia';

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

  if (minimized) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-surface-raised/90 backdrop-blur-md px-4 py-2.5 text-xs shadow-md">
        <div className="flex items-center gap-2 text-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="font-medium text-foreground">
            {product.name} · {welcome.kicker}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenEvaluation}
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline cursor-pointer"
          >
            <span>Evaluar</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setMinimized(false)}
            aria-label="Expandir acompañamiento de producto"
            className="rounded-full p-1 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside
      aria-label="Guía interactiva de cata y origen en mano"
      className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card/95 via-surface-raised/90 to-card/90 p-5 sm:p-6 shadow-xl backdrop-blur-md transition"
    >
      {/* Botón cerrar / minimizar */}
      <button
        type="button"
        onClick={() => {
          setMinimized(true);
          onClose?.();
        }}
        aria-label="Minimizar acompañamiento"
        className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-muted-foreground transition hover:bg-surface-sunken/60 hover:text-foreground cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Indicador de lectura de etiqueta física */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
          {welcome.kicker}
        </span>
        {qrCode && (
          <>
            <span className="text-muted-foreground/40 text-xs" aria-hidden="true">·</span>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-primary">
              Sello {qrCode}
            </span>
          </>
        )}
        {product.nombre_lote && (
          <>
            <span className="text-muted-foreground/40 text-xs" aria-hidden="true">·</span>
            <span className="rounded-full border border-border/80 bg-surface-sunken/60 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
              Lote {product.nombre_lote}
            </span>
          </>
        )}
        {product.origenApicola && (
          <>
            <span className="text-muted-foreground/40 text-xs" aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary/80 shrink-0" />
              <span>{product.origenApicola}</span>
            </span>
          </>
        )}
      </div>

      {/* Titular y mensaje editorial */}
      <div className="mt-3 max-w-3xl">
        <h2 className="font-display text-xl sm:text-2xl font-semibold leading-snug text-foreground">
          {welcome.title}
        </h2>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-foreground/80">
          {welcome.message}
        </p>
      </div>

      {/* Ficha rápida de cata y notas aromáticas (si existen) */}
      {(notasAromaticas.length > 0 || perfil?.momento_consumo) && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
          {notasAromaticas.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Notas de bouquet:
              </span>
              {notasAromaticas.slice(0, 4).map((nota) => (
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

      {/* Acciones principales del acompañante */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {qrModo === 'experiencia' && (
          <button
            type="button"
            onClick={handleOpenEvaluation}
            className="inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Star className="h-4 w-4 fill-primary-foreground" />
            <span>{welcome.ctaText}</span>
          </button>
        )}

        {qrModo === 'trazabilidad' && (
          <Link
            href={qrCode ? `/qr-scan?code=${encodeURIComponent(qrCode)}` : `/producto/${product.slug}/trazabilidad`}
            className="inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{welcome.ctaText !== 'Aportar Nota de Cata ★' ? welcome.ctaText : 'Ver Pasaporte de Origen'}</span>
          </Link>
        )}

        {qrModo === 'comercial' && (
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('comprar-ahora') || document.querySelector('.tienda-sticky-cta');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <PackageCheck className="h-4 w-4" />
            <span>{welcome.ctaText !== 'Aportar Nota de Cata ★' ? welcome.ctaText : 'Repetir Pedido / Formatos'}</span>
          </button>
        )}

        {qrModo !== 'experiencia' && (
          <button
            type="button"
            onClick={handleOpenEvaluation}
            className="inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
          >
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            <span>Aportar Nota de Cata</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleScrollToSensory}
          className="inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-1.5 rounded-full border border-border/80 bg-surface-sunken/60 px-4 py-2 text-xs font-medium text-foreground transition hover:bg-surface-sunken hover:border-primary/40"
        >
          <Compass className="h-3.5 w-3.5 text-primary" />
          <span>Ver Constelación Sensorial</span>
        </button>

        {product.trazabilidadQr && qrModo !== 'trazabilidad' && (
          <Link
            href={qrCode ? `/qr-scan?code=${encodeURIComponent(qrCode)}` : `/producto/${product.slug}/trazabilidad`}
            className="inline-flex min-h-[42px] items-center gap-1 text-xs text-muted-foreground transition hover:text-primary px-2"
          >
            <span>Certificado de origen</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    </aside>
  );
}
