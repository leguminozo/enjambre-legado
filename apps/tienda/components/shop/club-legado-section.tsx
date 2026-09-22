'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowRight, Sparkles, Smartphone, ShieldCheck } from 'lucide-react';
import { type ClubLegadoSettings, resolveLocalized, alignToClass } from '@/lib/shop/store-chrome';

export interface ClubLegadoSectionProps {
  settings?: ClubLegadoSettings;
}

/**
 * Sección del landing que promueve el Club Legado del Bosque.
 * Configurable desde el editor CMS de Núcleo (club_legado_settings).
 */
export function ClubLegadoSection({ settings }: ClubLegadoSectionProps = {}) {
  const tBridge = useTranslations('perfil.bridge');
  const locale = useLocale();

  const kicker =
    resolveLocalized(settings?.kicker, settings?.kicker_en, locale) ||
    tBridge('clubTitle') ||
    'Club Legado del Bosque';
  const title =
    resolveLocalized(settings?.title, settings?.title_en, locale) ||
    'Vínculo y recolecciones de temporada';
  const subtitle =
    resolveLocalized(settings?.subtitle, settings?.subtitle_en, locale) ||
    'Como miembro acreditado, accede a las floraciones limitadas del Predio Pureo: ulmo, tiaca y quillay con trazabilidad de colmena y cata de origen.';
  const ctaLabel =
    resolveLocalized(settings?.button_text, settings?.button_text_en, locale) ||
    tBridge('clubCta') ||
    'Unirme al Club';
  const ctaHref = settings?.button_href?.trim() || '/club-legado-del-bosque';

  return (
    <section
      className="editorial-section relative overflow-hidden border-y border-border/30 bg-surface-sunken"
      aria-labelledby="club-legado-title"
    >
      <div className="editorial-container">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center max-w-5xl mx-auto">
          {/* Columna Izquierda: Mensaje y Acción */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <span className="editorial-kicker block">{kicker}</span>
              <span className="text-border/60">·</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-accent-text">
                <Sparkles className="w-3 h-3" />
                <span>Mecenazgo Territorial</span>
              </span>
            </div>

            <h2
              id="club-legado-title"
              className="font-display text-[clamp(2rem,5vw,3.25rem)] font-light text-foreground text-balance leading-tight"
            >
              {title}
            </h2>

            <p
              className={`text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0 whitespace-pre-line ${alignToClass(
                settings?.text_align,
              )}`}
            >
              {subtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-accent-text" />
                <span>Pase Apple / Google Wallet</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-accent-text" />
                <span>Pasaporte de Lote Verificado</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={ctaHref}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-[0.65rem] uppercase tracking-[0.2em] font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_24px_rgba(201,162,39,0.1)] active:scale-[0.98]"
              >
                <span>{ctaLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta Visual con el Objeto de Deseo */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[320px] aspect-[4/5] rounded-3xl border border-border/40 bg-card p-6 flex flex-col justify-between shadow-xl overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b border-border/20 pb-3">
                <span className="font-mono uppercase tracking-wider text-accent-text font-semibold">
                  Pureo · Chiloé
                </span>
                <span>Edición Limitada</span>
              </div>

              <div className="relative flex-1 flex items-center justify-center py-4">
                <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-border/30">
                  <Image
                    src="/assets/editorial/experiencias.jpg"
                    alt="Apiario en bosque nativo de Queilén, Chiloé"
                    fill
                    sizes="280px"
                    className="object-cover transition-transform duration-elegant hover:scale-105"
                  />
                </div>
              </div>

              <div className="border-t border-border/20 pt-3 text-center">
                <p className="font-display text-lg font-light text-foreground">
                  Recolección de Temporada
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Reserva prioritaria para miembros del Club
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}