import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@enjambre/ui';
import type { TextAlign } from '@enjambre/shop-chrome';
import { alignToClass } from '@enjambre/shop-chrome';

export interface EditorialHeroProps {
  /** Antetítulo / kicker superior */
  kicker?: string | null;
  /** Insignia destacada */
  badge?: string | null;
  /** Título principal (h1) */
  title: string;
  /** Bajada descriptiva / subtítulo */
  subtitle?: string | null;
  /** Fotografía panorámica de fondo */
  imageUrl?: string | null;
  /** Texto alternativo accesible para la fotografía */
  imageAlt?: string;
  /** Opacidad del fondo (0 a 100). Si es 0 o ausente sin imagen, no se monta el nodo */
  imageOpacity?: number;
  /** Botón de acción principal */
  ctaLabel?: string | null;
  ctaHref?: string | null;
  /** Botón de acción secundario */
  secondaryCtaLabel?: string | null;
  secondaryCtaHref?: string | null;
  /** Alineación del texto */
  align?: TextAlign;
  /** Elementos o tarjetas adicionales bajo el hero */
  children?: ReactNode;
  /** Clases CSS adicionales para la sección exterior */
  className?: string;
  /** Identificador de sección para el CMS */
  sectionKey?: string;
  /** Si true, la etiqueta del botón principal renderiza un Link de Next.js; si false o ancla (#), un <a> estándar */
  preferAnchor?: boolean;
}

export function EditorialHero({
  kicker,
  badge,
  title,
  subtitle,
  imageUrl,
  imageAlt = 'Fotografía de bosque nativo austral',
  imageOpacity = 35,
  ctaLabel,
  ctaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  align,
  children,
  className,
  sectionKey,
  preferAnchor = false,
}: EditorialHeroProps) {
  const cleanKicker = kicker?.trim() ?? '';
  const cleanBadge = badge?.trim() ?? '';
  const cleanTitle = title?.trim() ?? '';
  const cleanSubtitle = subtitle?.trim() ?? '';
  const cleanCtaLabel = ctaLabel?.trim() ?? '';
  const cleanCtaHref = ctaHref?.trim() ?? '';
  const cleanSecondaryLabel = secondaryCtaLabel?.trim() ?? '';
  const cleanSecondaryHref = secondaryCtaHref?.trim() ?? '';

  const clampedOpacity = Math.max(0, Math.min(100, imageOpacity));
  const hasImage = Boolean(imageUrl && clampedOpacity > 0);
  const heroOpacity = clampedOpacity / 100;

  const hasHeaderMeta = Boolean(cleanKicker || cleanBadge);
  const hasButtons = Boolean(
    (cleanCtaLabel && cleanCtaHref) || (cleanSecondaryLabel && cleanSecondaryHref),
  );

  const renderButton = (
    label: string,
    href: string,
    variant: 'primary' | 'secondary',
  ) => {
    const isAnchor = preferAnchor || href.startsWith('#');
    const classes =
      variant === 'primary'
        ? 'w-full sm:w-auto inline-flex min-h-[46px] items-center justify-center rounded-full bg-primary px-8 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98]'
        : 'w-full sm:w-auto inline-flex min-h-[46px] items-center justify-center rounded-full border border-border/60 bg-surface-raised/50 backdrop-blur-sm px-7 text-xs font-medium uppercase tracking-wider text-foreground hover:border-accent hover:text-accent-text transition-colors active:scale-[0.98]';

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
        'relative overflow-hidden border-b border-border/20 bg-background',
        className,
      )}
    >
      {/* ── Lienzo Fotográfico & Atmósfera ── */}
      {hasImage ? (
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden>
          <Image
            src={imageUrl as string}
            alt={imageAlt}
            fill
            sizes="100vw"
            priority
            className="object-cover scale-105"
            style={{ opacity: heroOpacity }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-transparent to-background/85" />
        </div>
      ) : null}

      {/* ── Contenido Central ── */}
      <div className="relative px-4 sm:px-6 text-center pt-[max(7.5rem,calc(env(safe-area-inset-top)+6rem))] pb-16 md:pb-24 max-w-5xl mx-auto z-10">
        {hasHeaderMeta ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-surface-raised/70 backdrop-blur-md px-4 py-1.5 text-[0.68rem] uppercase tracking-[0.25em] text-accent-text mb-6 shadow-xs">
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
          <h1 className="font-display text-[clamp(2.25rem,6.5vw,4.75rem)] font-light text-foreground mb-6 text-balance leading-[1.08] tracking-tight">
            {cleanTitle}
          </h1>
        ) : null}

        {cleanSubtitle ? (
          <p
            className={cn(
              'text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-pretty mb-8 leading-relaxed whitespace-pre-line',
              alignToClass(align),
            )}
          >
            {cleanSubtitle}
          </p>
        ) : null}

        {hasButtons ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
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
    </section>
  );
}
