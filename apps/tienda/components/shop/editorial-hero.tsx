import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@enjambre/ui';
import type { TextAlign } from '@enjambre/shop-chrome';
import { alignToClass } from '@enjambre/shop-chrome';
import { ScrollCue } from './scroll-cue';

export interface EditorialHeroProps {
  /** Antetítulo / kicker superior */
  kicker?: string | null;
  /** Insignia destacada */
  badge?: string | null;
  /** Título principal (h1) */
  title: string;
  /** Bajada descriptiva / subtítulo */
  subtitle?: string | null;
  /** Fotografía panorámica de fondo (para variant="cinematic" o por defecto si hay URL) */
  imageUrl?: string | null;
  /** Texto alternativo accesible para la fotografía */
  imageAlt?: string;
  /** Opacidad de la imagen (0 a 100). Default 80 para máxima riqueza cinematográfica */
  imageOpacity?: number;
  /** Posición de enfoque de la imagen (ej: 'center', 'top', 'center 30%') */
  imagePosition?: string;
  /** Botón de acción principal */
  ctaLabel?: string | null;
  ctaHref?: string | null;
  /** Botón de acción secundario */
  secondaryCtaLabel?: string | null;
  secondaryCtaHref?: string | null;
  /** Alineación del texto */
  align?: TextAlign;
  /** Elementos o tarjetas adicionales bajo el hero (dentro del flujo vertical) */
  children?: ReactNode;
  /** Clases CSS adicionales para la sección exterior */
  className?: string;
  /** Identificador de sección para el CMS */
  sectionKey?: string;
  /** Si true, la etiqueta del botón principal renderiza un Link de Next.js; si false o ancla (#), un <a> estándar */
  preferAnchor?: boolean;
  /** Variante de atmósfera visual:
   * - 'cinematic': Fotografía a sangre nítida, sin blur, con viñeta perimetral de cine y scrim inteligente.
   * - 'deep-code': Fondo generado por código (malla, partículas, biofísica) vía backgroundSlot.
   * - 'editorial': Minimalista con atmósfera lumínica sutil.
   */
  variant?: 'cinematic' | 'deep-code' | 'editorial';
  /** Ranura para lienzo de fondo (Canvas, WebGL, SVG generativo) */
  backgroundSlot?: ReactNode;
  /** Si se debe mostrar el indicador inferior "Desliza para explorar" (por defecto true) */
  showScrollCue?: boolean;
  /** Texto personalizado para el scroll cue */
  scrollCueLabel?: string;
}

export function EditorialHero({
  kicker,
  badge,
  title,
  subtitle,
  imageUrl,
  imageAlt = 'Fotografía de bosque nativo austral',
  imageOpacity,
  imagePosition = 'center',
  ctaLabel,
  ctaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  align,
  children,
  className,
  sectionKey,
  preferAnchor = false,
  variant,
  backgroundSlot,
  showScrollCue = true,
  scrollCueLabel,
}: EditorialHeroProps) {
  const cleanKicker = kicker?.trim() ?? '';
  const cleanBadge = badge?.trim() ?? '';
  const cleanTitle = title?.trim() ?? '';
  const cleanSubtitle = subtitle?.trim() ?? '';
  const cleanCtaLabel = ctaLabel?.trim() ?? '';
  const cleanCtaHref = ctaHref?.trim() ?? '';
  const cleanSecondaryLabel = secondaryCtaLabel?.trim() ?? '';
  const cleanSecondaryHref = secondaryCtaHref?.trim() ?? '';

  // Determinar variante activa si no se especificó explícitamente
  const resolvedVariant =
    variant ??
    (backgroundSlot ? 'deep-code' : imageUrl ? 'cinematic' : 'editorial');

  // Opacidad fotográfica: default a 85 si no se especifica
  const rawOpacity = imageOpacity ?? 85;
  const clampedOpacity = Math.max(0, Math.min(100, rawOpacity));
  const hasImage = Boolean(imageUrl && clampedOpacity > 0 && resolvedVariant === 'cinematic');
  // La opacidad configurada en el CMS gobierna directamente la presencia visual de la foto (0 a 1)
  const heroOpacity = clampedOpacity / 100;

  const hasHeaderMeta = Boolean(cleanKicker || cleanBadge);
  const hasButtons = Boolean(
    (cleanCtaLabel && cleanCtaHref) || (cleanSecondaryLabel && cleanSecondaryHref),
  );

  const renderButton = (
    label: string,
    href: string,
    variantType: 'primary' | 'secondary',
  ) => {
    const isAnchor = preferAnchor || href.startsWith('#');
    const classes =
      variantType === 'primary'
        ? 'w-full sm:w-auto inline-flex min-h-[46px] items-center justify-center rounded-full bg-primary px-8 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_24px_rgba(201,162,39,0.15)] active:scale-[0.98]'
        : 'w-full sm:w-auto inline-flex min-h-[46px] items-center justify-center rounded-full border border-border/70 bg-surface-raised/60 backdrop-blur-md px-7 text-xs font-medium uppercase tracking-wider text-foreground hover:border-accent hover:text-accent-text transition-colors active:scale-[0.98]';

    if (isAnchor) {
      return (
        <a key={label} href={href} className={classes}>
          {label}
        </a>
      );
    }

    return (
      <Link key={label} href={href} className={classes}>
        {label}
      </Link>
    );
  };

  return (
    <section
      data-cms-section={sectionKey}
      className={cn(
        'relative flex flex-col justify-between items-center overflow-hidden border-b border-border/20 bg-background text-center px-4 sm:px-6',
        'min-h-[var(--svh-full)] md:min-h-[var(--vh-full)]',
        'pt-[max(6rem,calc(env(safe-area-inset-top)+5rem))]',
        'pb-[max(4.5rem,calc(env(safe-area-inset-bottom)+3.5rem))]',
        className,
      )}
    >
      {/* ── Lienzo Fotográfico & Atmósfera Cinematográfica (Sin Blur) ── */}
      {hasImage ? (
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0" aria-hidden>
          <Image
            src={imageUrl as string}
            alt={imageAlt}
            fill
            sizes="100vw"
            priority
            className="object-cover scale-[1.02] transition-transform duration-1000"
            style={{
              opacity: heroOpacity,
              objectPosition: imagePosition,
            }}
          />
          {/* Scrim superior para proteger legibilidad de la cabecera */}
          <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-background/95 via-background/40 to-transparent" />
          {/* Scrim inferior para fusión perfecta con la sección que sigue */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/70 to-transparent" />
          {/* Viñeta perimetral de cine */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.18)_50%,rgba(0,0,0,0.75)_100%)]" />
        </div>
      ) : null}

      {/* ── Atmósfera de Código Profundo (Canvas / Geometría generativa) ── */}
      {resolvedVariant === 'deep-code' && backgroundSlot ? (
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0" aria-hidden>
          {backgroundSlot}
          {/* Scrim superior e inferior sutil para fundir con el layout */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background via-background/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      ) : null}

      {/* ── Atmósfera Editorial Minimalista ── */}
      {resolvedVariant === 'editorial' && !hasImage && !backgroundSlot ? (
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0" aria-hidden>
          <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-accent/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-[20%] right-1/4 w-[500px] h-[350px] bg-primary/5 rounded-full blur-3xl" />
        </div>
      ) : null}

      {/* ── Espaciador superior para balance vertical con my-auto ── */}
      <div className="h-2 sm:h-4 shrink-0" aria-hidden />

      {/* ── Contenido Central (Centrado verticalmente con my-auto) ── */}
      <div className="relative my-auto px-2 sm:px-4 max-w-5xl xl:max-w-6xl mx-auto z-10 w-full py-6">
        {hasHeaderMeta ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/35 bg-surface-raised/70 backdrop-blur-md px-4 py-1.5 text-[0.65rem] sm:text-[0.68rem] uppercase tracking-[0.25em] text-accent-text mb-6 shadow-xs">
            {cleanKicker ? <span>{cleanKicker}</span> : null}
            {cleanKicker && cleanBadge ? (
              <span className="opacity-50" aria-hidden>
                ·
              </span>
            ) : null}
            {cleanBadge ? <span className="font-semibold">{cleanBadge}</span> : null}
          </div>
        ) : null}

        {cleanTitle ? (
          <h1 className="font-display text-[clamp(2.25rem,5.5vw,4.5rem)] font-light text-foreground mb-6 text-balance max-w-4xl lg:max-w-5xl mx-auto leading-[1.08] tracking-tight">
            {cleanTitle}
          </h1>
        ) : null}

        {cleanSubtitle ? (
          <p
            className={cn(
              'text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl lg:max-w-4xl mx-auto text-pretty mb-8 leading-relaxed whitespace-pre-line',
              alignToClass(align),
            )}
          >
            {cleanSubtitle}
          </p>
        ) : null}

        {hasButtons ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-8">
            {cleanCtaLabel && cleanCtaHref
              ? renderButton(cleanCtaLabel, cleanCtaHref, 'primary')
              : null}
            {cleanSecondaryLabel && cleanSecondaryHref
              ? renderButton(cleanSecondaryLabel, cleanSecondaryHref, 'secondary')
              : null}
          </div>
        ) : null}

        {/* ── Slot para contenido adicional (tarjetas, badges, métricas) ── */}
        {children}
      </div>

      {/* ── Scroll Cue Orgánico al pie del hero ── */}
      {showScrollCue ? (
        <ScrollCue label={scrollCueLabel} className="shrink-0 mt-4" />
      ) : (
        <div className="h-6 shrink-0" aria-hidden />
      )}
    </section>
  );
}
