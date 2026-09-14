import Image from 'next/image';
import type { IdentidadSettings } from '@/lib/shop/store-chrome';
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

  const kicker = locale === 'en' && settings.kicker_en ? settings.kicker_en : settings.kicker;
  const title = locale === 'en' && settings.title_en ? settings.title_en : settings.title;
  const desc = locale === 'en' && settings.desc_en ? settings.desc_en : settings.desc;
  const body = locale === 'en' && settings.body_en ? settings.body_en : settings.body;

  return (
    <section
      id="identidad"
      className="editorial-section bg-surface-sunken"
      aria-labelledby="identidad-title"
    >
      <div className="editorial-container grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center max-w-5xl">
        <div className="lg:col-span-5 relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] rounded-lg overflow-hidden ring-1 ring-border/50 shadow-md">
          <Image
            src={settings.image || '/assets/editorial/experiencias.jpg'}
            alt={title}
            fill
            priority={false}
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 40vw"
          />

        </div>

        <div className="lg:col-span-7 max-w-xl">
          <span className="editorial-kicker mb-4 block">
            {kicker}
          </span>
          <h2
            id="identidad-title"
            className="font-display text-[clamp(2rem,5vw,3.5rem)] font-light text-foreground text-balance leading-tight mb-6"
          >
            {title}
          </h2>
          <p className="text-muted-foreground leading-relaxed text-base sm:text-lg mb-5">
            {desc}
          </p>
          <p className="text-foreground font-medium leading-relaxed">
            {body}
          </p>
        </div>
      </div>
    </section>
  );
}