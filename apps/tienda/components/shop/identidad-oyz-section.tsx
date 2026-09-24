import Image from 'next/image';
import type { IdentidadSettings } from '@/lib/shop/store-chrome';
import { alignToClass, resolveLocalized } from '@/lib/shop/store-chrome';
import { useLocale } from 'next-intl';

export interface IdentidadOyzSectionProps {
  settings?: IdentidadSettings;
}

/**
 * Bloque de identidad territorial de La Obrera y el Zángano (2ª posición
 * tras el hero). Estructura del bloque "Hecho en Chiloé" del registro
 * territorial, adaptada al lenguaje y la identidad de la tienda: la casa
 * productora es la protagonista — sin referencias a la red comunal.
 */
export function IdentidadOyzSection({ settings }: IdentidadOyzSectionProps) {
  const locale = useLocale();

  if (!settings) return null;

  const kicker = resolveLocalized(settings.kicker, settings.kicker_en, locale);
  const title = resolveLocalized(settings.title, settings.title_en, locale);
  const desc = resolveLocalized(settings.desc, settings.desc_en, locale);
  const body = resolveLocalized(settings.body, settings.body_en, locale);
  const imageAlt = resolveLocalized(settings.image_alt, settings.image_alt_en, locale);
  const imageSrc = settings.image?.trim() || '/assets/editorial/experiencias.jpg';

  return (
    <section
      id="identidad"
      data-cms-section="identidad_settings"
      className="editorial-section bg-surface-sunken"
      aria-labelledby="identidad-title"
    >
      <div className="editorial-container grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center max-w-5xl">
        <div className="lg:col-span-5 relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] rounded-lg overflow-hidden ring-1 ring-border/50 shadow-md">
          <Image
            src={imageSrc}
            alt={imageAlt || title || 'Identidad territorial'}
            fill
            priority={false}
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 40vw"
          />

        </div>

        <div className="lg:col-span-7 max-w-xl">
          {kicker ? <span className="editorial-kicker mb-4 block">{kicker}</span> : null}
          {title ? (
            <h2
              id="identidad-title"
              className="font-display text-[clamp(2rem,5vw,3.5rem)] font-light text-foreground text-balance leading-tight mb-6"
            >
              {title}
            </h2>
          ) : null}
          {desc ? (
            <p className={`text-muted-foreground leading-relaxed text-base sm:text-lg mb-5 whitespace-pre-line ${alignToClass(settings.text_align)}`}>
              {desc}
            </p>
          ) : null}
          {body ? (
            <p className={`text-foreground font-medium leading-relaxed whitespace-pre-line ${alignToClass(settings.text_align)}`}>
              {body}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}