import React from 'react';
import { Coffee, Hotel, UtensilsCrossed, Sparkles, Layers } from 'lucide-react';
import type { B2BMolecularPairingItem } from '@enjambre/shop-chrome';

export interface B2BMolecularPairingShowcaseProps {
  pairings?: B2BMolecularPairingItem[];
  segmentSlug?: string;
  kicker?: string;
  title?: string;
  description?: string;
  serviceLabel?: string;
  serviceNote?: string;
  serviceNoteValue?: string;
}

export function B2BMolecularPairingShowcase({
  pairings,
  segmentSlug,
  kicker,
  title,
  description,
  serviceLabel,
  serviceNote,
  serviceNoteValue,
}: B2BMolecularPairingShowcaseProps) {
  if (!pairings || pairings.length === 0) {
    return null;
  }

  const isHotel = segmentSlug === 'hoteles';

  const defaultKicker = isHotel
    ? 'Armonía Botánica & Hospitalidad'
    : 'Carta de Maridaje & Servicio en Barra';

  const defaultTitle = isHotel
    ? 'Cuatro Expresiones de Origen en la Estadía'
    : 'Cuatro Expresiones de Origen para tu Barra';

  const defaultDescription = isHotel
    ? 'Variedades y calibres diseñados para los momentos clave de hospitalidad: bienvenida en suites, cata guiada en desayuno de autor y frascos de recuerdo en recepción. Miel cruda virgen de bosque nativo con textura cremada en frío sin goteo.'
    : 'El maridaje no es un endulzante en taza: es un contrapunto sensorial en bandeja para degustar con microespátula junto al café. Cada variedad dialoga con el perfil de tueste y el método de extracción, respetando la acidez y la microespuma sin alterar la taza.';

  const defaultServiceLabel = isHotel
    ? 'Momento en la Estadía'
    : 'Par Óptimo en Barra';

  const defaultServiceNote = 'Estándar de Origen';

  const defaultServiceNoteValue = 'Chiloé 42°S · Miel Cruda Pura (<18% Humedad)';

  const finalKicker = kicker || defaultKicker;
  const finalTitle = title || defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalServiceLabel = serviceLabel || defaultServiceLabel;
  const finalServiceNote = serviceNote || defaultServiceNote;
  const finalServiceNoteValue = serviceNoteValue || defaultServiceNoteValue;

  const ServiceIcon = isHotel ? Hotel : Coffee;

  return (
    <section className="py-20 md:py-28 px-4 border-t border-border/20 bg-background relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-4 px-3 py-1 rounded-full border border-accent/20 bg-accent/5">
            <Sparkles className="w-3.5 h-3.5" />
            {finalKicker}
          </span>
          <h2 className="font-display text-[clamp(1.75rem,5.5vw,2.75rem)] md:text-5xl font-light text-foreground text-balance mb-6">
            {finalTitle}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty">
            {finalDescription}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {pairings.map((item) => (
            <article
              key={item.id}
              className="group bg-surface-raised border border-border/40 rounded-2xl p-6 sm:p-8 hover:border-accent/40 transition-all flex flex-col justify-between shadow-sm hover:shadow-md"
            >
              <div>
                {/* Badges superiores */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  {item.badge ? (
                    <span className="text-[0.6rem] tracking-[0.25em] uppercase font-medium text-accent-text px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20">
                      {item.badge}
                    </span>
                  ) : null}
                  {item.badge_bioquimico ? (
                    <span className="inline-flex items-center gap-1.5 text-[0.6rem] tracking-[0.2em] uppercase text-muted-foreground font-mono">
                      <Sparkles className="w-3 h-3 text-accent-text" />
                      {item.badge_bioquimico}
                    </span>
                  ) : null}
                </div>

                {/* Formato */}
                <div className="flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-3">
                  <Layers className="w-3 h-3 text-accent-text" />
                  <span>{item.formato}</span>
                </div>

                {/* Título y subtítulo */}
                <h3 className="font-display text-2xl font-light text-foreground mb-1 group-hover:text-accent-text transition-colors">
                  {item.nombre}
                </h3>
                {item.subtitulo ? (
                  <p className="text-xs text-muted-foreground font-mono mb-4">
                    {item.subtitulo}
                  </p>
                ) : null}

                {/* Perfil Sensorial */}
                <p className="text-sm text-foreground/90 leading-relaxed mb-6 bg-surface-sunken/40 rounded-lg p-3.5 border border-border/20">
                  {item.perfil_sensorial}
                </p>

                {/* Bloques de servicio y maridaje culinario */}
                <div className="space-y-4 mb-6">
                  {/* Servicio o Par en barra */}
                  {item.par_en_barra && (
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                        <ServiceIcon className="w-3.5 h-3.5 text-accent-text" />
                      </div>
                      <div>
                        <span className="block text-[0.65rem] uppercase tracking-[0.2em] font-medium text-accent-text">
                          {finalServiceLabel}
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                          {item.par_en_barra}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Protocolo de Degustación en Mesa */}
                  {item.perfil_bioquimico && (
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-surface-sunken border border-border/40 flex items-center justify-center shrink-0 mt-0.5">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-accent-text" />
                      </div>
                      <div>
                        <span className="block text-[0.65rem] uppercase tracking-[0.2em] font-medium text-foreground">
                          Protocolo de Degustación en Mesa
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                          {item.perfil_bioquimico}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Armonía en Paladar */}
                  {item.neurogastronomia && (
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-surface-sunken border border-border/40 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-accent-text" />
                      </div>
                      <div>
                        <span className="block text-[0.65rem] uppercase tracking-[0.2em] font-medium text-foreground">
                          Armonía en Paladar
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                          {item.neurogastronomia}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pie de tarjeta con recordatorio de servicio */}
              <div className="pt-4 border-t border-border/30 flex items-center justify-between text-[0.65rem] text-muted-foreground">
                <span>{finalServiceNote}</span>
                <span className="font-mono text-accent-text">{finalServiceNoteValue}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
