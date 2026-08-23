'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

/**
 * Sección del landing que promueve el Club Legado del Bosque.
 * Se renderiza antes del mapa: la suscripción al ritmo del bosque es la
 * puerta de entrada a la Red Biocultural para el visitante de la tienda.
 */
export function ClubLegadoSection() {
  const tBridge = useTranslations('perfil.bridge');

  return (
    <section className="editorial-section bg-surface-sunken" aria-labelledby="club-legado-title">
      <div className="editorial-container max-w-2xl mx-auto text-center px-4 sm:px-0">
        <span className="editorial-kicker mb-4 block">{tBridge('clubTitle')}</span>
        <h2
          id="club-legado-title"
          className="font-display text-[clamp(1.75rem,6vw,3.5rem)] sm:text-4xl md:text-5xl font-light text-foreground text-balance leading-tight mb-6"
        >
          Suscripción al ritmo del bosque
        </h2>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-8 max-w-xl mx-auto">
          Cada temporada una miel con cata, origen y trazabilidad de lote:
          ulmo, tiaca y quillay según florece el bosque.
        </p>
        <Link
          href="/club-legado-del-bosque"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-8 py-3.5 text-[0.65rem] uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {tBridge('clubCta')}
        </Link>
      </div>
    </section>
  );
}