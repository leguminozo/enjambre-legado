import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import {
  Award,
  Shield,
  RotateCcw,
  Smartphone,
  CheckCircle,
  ArrowRight,
  HeartHandshake,
  Crown,
} from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { ScrollCue } from '@/components/shop/scroll-cue';
import { formatCalendarDate } from '@enjambre/ui';
import { ClubCosechaBadge } from '@/components/shop/club-cosecha-badge';
import { listActiveSubscriptionPlans } from '@/lib/shop/subscription-plans';
import {
  getClubCosechaContext,
  groupLotesByClub,
  resolveClubPlanId,
  splitCataLines,
  type CosechaKey,
  type FloracionCardOverride,
} from '@/lib/shop/club-cosecha';
import { fetchEspeciesBotanicas } from '@/lib/shop/floraciones-publicas';
import {
  parseSeasonalOverrides,
  parseClubPageSettings,
  DEFAULT_CLUB_PAGE_SETTINGS,
  resolveLocalized,
  alignToClass,
} from '@/lib/shop/store-chrome';
import { isCmsPreviewRequest, getSiteContent } from '@/lib/cms';
import { loadStoreChrome } from '@/lib/shop/load-store-chrome';
import { EmptyState } from '@enjambre/ui';
import { formatCLP } from '@/lib/shop/format';
import { getNucleoAppUrl } from '@/lib/shop/nucleo-app-url';
import {
  fetchLotesPublicosForClub,
  pasaporteLoteUrl,
} from '@/lib/shop/club-lotes-publicos';
import { getEcosystemMetrics } from '@/lib/shop/ecosystem-metrics';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

import { createPageMetadata } from '@/lib/shop/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata('/club-legado-del-bosque', {
    title: 'Club Legado del Bosque · Membresía y Privilegios de Cliente',
    description:
      'Comunidad de clientes y guardianes del bosque nativo de Chiloé. Membresía libre al registrarte, reposición a tu ritmo, reservas exclusivas y trazabilidad de origen — La Obrera y el Zángano.',
  });
}

function formatHarvestStatus(status: string): string {
  switch (status) {
    case 'active':
      return 'Recolección activa';
    case 'upcoming':
      return 'Próxima recolección';
    case 'preparing':
      return 'Preparación de colmenas y floraciones';
    case 'resting':
      return 'Reposo de invierno';
    default:
      return 'Temporada en curso';
  }
}

export default async function ClubCosechaPage() {
  const isDraft = await isCmsPreviewRequest();
  // Contenido estacional del CMS (sección seasonal_settings) sobre el default por mes.
  const [chrome, plans, lotesPublicos, ecosystemMetrics, clubSettingsRows, botanica] = await Promise.all([
    loadStoreChrome({ draft: isDraft }),
    listActiveSubscriptionPlans('tienda_club'),
    fetchLotesPublicosForClub(24),
    getEcosystemMetrics(),
    getSiteContent('club_page_settings', { draft: isDraft }),
    fetchEspeciesBotanicas(),
  ]);
  const locale = await getLocale();
  const clubSettings = clubSettingsRows?.[0]
    ? parseClubPageSettings(clubSettingsRows[0].content as Record<string, unknown>)
    : DEFAULT_CLUB_PAGE_SETTINGS;
  // Overrides editoriales por floración (CMS club_page_settings flor_1..4_*).
  // El parseado ya preserva '' (borrado = ocultar) y rellena defaults en
  // filas viejas sin estos campos, así que leer el parseado es suficiente.
  const parsedFlor = clubSettings as unknown as Record<string, unknown>;
  const florStr = (key: string) => {
    const v = parsedFlor[key];
    return typeof v === 'string' ? v : undefined;
  };
  const florKeys: CosechaKey[] = ['ulmo', 'tiaca', 'quillay', 'multifloral'];
  const florOverrides = Object.fromEntries(
    florKeys.map((key, i): [CosechaKey, FloracionCardOverride] => {
      const n = i + 1;
      const cientifico = (florStr(`flor_${n}_cientifico`) ?? '').trim();
      const origen = (florStr(`flor_${n}_origen`) ?? '').trim();
      return [
        key,
        {
          nombre: resolveLocalized(florStr(`flor_${n}_nombre`), florStr(`flor_${n}_nombre_en`), locale),
          cientifico: cientifico ? cientifico : null,
          tagline: resolveLocalized(florStr(`flor_${n}_tagline`), florStr(`flor_${n}_tagline_en`), locale),
          cata: splitCataLines(resolveLocalized(florStr(`flor_${n}_cata`), florStr(`flor_${n}_cata_en`), locale)),
          maridaje: resolveLocalized(florStr(`flor_${n}_maridaje`), florStr(`flor_${n}_maridaje_en`), locale),
          origenPath: origen ? origen : null,
        },
      ];
    }),
  ) as Record<CosechaKey, FloracionCardOverride>;
  const ctx = getClubCosechaContext(
    new Date(),
    parseSeasonalOverrides(chrome.seasonal),
    locale,
    florOverrides,
    botanica,
  );
  const nucleo = getNucleoAppUrl();
  const lotesByClub = groupLotesByClub(lotesPublicos);
  const suggestedId = resolveClubPlanId(ctx.suggestedPlanKey, plans);
  const suggestedPlan = plans.find((p) => p.id === suggestedId) ?? null;

  const heroKicker = resolveLocalized(clubSettings.hero_kicker, clubSettings.hero_kicker_en, locale);
  const heroBadge = resolveLocalized(clubSettings.hero_badge, clubSettings.hero_badge_en, locale);
  const heroTitle = resolveLocalized(clubSettings.hero_title, clubSettings.hero_title_en, locale);
  const heroSubtitle = resolveLocalized(clubSettings.hero_subtitle, clubSettings.hero_subtitle_en, locale);
  const heroImage = clubSettings.hero_image ?? '/assets/editorial/hero-bosque-apertura.jpg';
  const heroOpacity =
    typeof clubSettings.hero_image_opacity === 'number'
      ? Math.min(100, Math.max(0, clubSettings.hero_image_opacity)) / 100
      : 0.35;
  const heroCtaLabel = resolveLocalized(clubSettings.hero_cta_label, clubSettings.hero_cta_label_en, locale);
  const heroSecondaryLabel = resolveLocalized(
    clubSettings.hero_secondary_label,
    clubSettings.hero_secondary_label_en,
    locale,
  );
  const heroSecondaryHref = clubSettings.hero_secondary_href || '#beneficios';

  const showHeroCard = clubSettings.show_hero_card !== false;
  const heroCardImage = clubSettings.hero_card_image || '/assets/editorial/experiencias.jpg';
  const heroCardKicker =
    resolveLocalized(clubSettings.hero_card_kicker, clubSettings.hero_card_kicker_en, locale);
  const heroCardBadgeTop =
    resolveLocalized(clubSettings.hero_card_badge_top, clubSettings.hero_card_badge_top_en, locale);
  const heroCardTitle = resolveLocalized(clubSettings.hero_card_title, clubSettings.hero_card_title_en, locale);
  const heroCardText = resolveLocalized(clubSettings.hero_card_text, clubSettings.hero_card_text_en, locale);
  const heroCardBadgeBottom = resolveLocalized(
    clubSettings.hero_card_badge_bottom,
    clubSettings.hero_card_badge_bottom_en,
    locale,
  );
  const heroCardLinkLabel = resolveLocalized(
    clubSettings.hero_card_link_label,
    clubSettings.hero_card_link_label_en,
    locale,
  );
  const heroCardLinkHref = clubSettings.hero_card_link_href || '#niveles';

  const floracionActiva = ctx.cosechas.find((c) => c.destacada) ?? ctx.cosechas[0];

  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-[var(--vh-full)] bg-background">
        {/* ── Hero Dedicado: Membresía Club Legado y Privilegios ── */}
        <section className="relative flex flex-col justify-between overflow-hidden border-b border-border/20 bg-background min-h-[var(--svh-full)] md:min-h-[var(--vh-full)] pt-[max(6rem,calc(env(safe-area-inset-top)+5rem))] pb-[max(4.5rem,calc(env(safe-area-inset-bottom)+3.5rem))]">
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0" aria-hidden>
            {heroImage && (
              <Image
                src={heroImage}
                alt="Bosque nativo y colmenas en Chiloé"
                fill
                sizes="100vw"
                priority
                className="object-cover scale-[1.02]"
                style={{ opacity: heroOpacity }}
              />
            )}
            <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-background/95 via-background/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/70 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.15)_50%,rgba(0,0,0,0.75)_100%)]" />
          </div>

          <div className="h-2 shrink-0" aria-hidden />

          <div className="relative my-auto max-w-6xl mx-auto px-4 sm:px-6 w-full z-10 py-6">
            <div className={`grid ${showHeroCard ? 'lg:grid-cols-12 gap-10 lg:gap-12' : 'grid-cols-1'} items-center`}>
              {/* Columna Izquierda: Relato y Acción */}
              <div className={showHeroCard ? 'lg:col-span-7' : 'max-w-3xl'}>
                {(heroKicker || heroBadge) && (
                  <div className="mb-5 flex flex-wrap items-center gap-2">
                    {heroKicker && (
                      <span className="text-[0.65rem] uppercase tracking-[0.25em] text-accent-text font-semibold">
                        {heroKicker}
                      </span>
                    )}
                    {heroKicker && heroBadge && (
                      <span className="text-[0.65rem] text-muted-foreground/60">·</span>
                    )}
                    {heroBadge && (
                      <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                        {heroBadge}
                      </span>
                    )}
                  </div>
                )}

                {heroTitle && (
                  <h1 className="font-display text-[clamp(2.25rem,6vw,4rem)] font-light text-foreground text-balance leading-[1.08] mb-5">
                    {heroTitle}
                  </h1>
                )}

                {heroSubtitle && (
                  <p
                    className={`text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl lg:max-w-4xl text-pretty mb-6 leading-relaxed whitespace-pre-line ${alignToClass(
                      clubSettings.text_align,
                    )}`}
                  >
                    {heroSubtitle}
                  </p>
                )}

                {/* CTAs */}
                {(heroCtaLabel || heroSecondaryLabel) && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    {heroCtaLabel && (
                      <Link
                        href={clubSettings.hero_cta_href || '/perfil'}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-xs sm:text-sm font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_24px_rgba(201,162,39,0.12)] active:scale-[0.98]"
                      >
                        <span>{heroCtaLabel}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}

                    {heroSecondaryLabel && (
                      <a
                        href={heroSecondaryHref}
                        className="inline-flex min-h-12 items-center justify-center rounded-full border border-border/60 bg-surface-raised/40 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-foreground hover:border-accent hover:text-accent-text transition-colors"
                      >
                        {heroSecondaryLabel}
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Columna Derecha: Tarjeta de Membresía y Privilegios */}
              {showHeroCard && (
                <div className="lg:col-span-5">
                  <div className="rounded-3xl border border-border/40 bg-card/80 backdrop-blur-md p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                    {(heroCardKicker || heroCardBadgeTop) && (
                      <div className="flex items-center justify-between gap-2 mb-4 border-b border-border/20 pb-3">
                        {heroCardKicker && (
                          <span className="text-[0.65rem] uppercase tracking-widest text-accent-text font-semibold">
                            {heroCardKicker}
                          </span>
                        )}
                        {heroCardBadgeTop && (
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {heroCardBadgeTop}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="space-y-4">
                      {heroCardImage && (
                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-surface-sunken/60 border border-border/20 flex items-center justify-center">
                          <Image
                            src={heroCardImage}
                            alt="Comunidad del Club Legado"
                            fill
                            sizes="(max-width: 768px) 100vw, 400px"
                            className="object-cover transition-transform duration-elegant hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-foreground/90">
                            <span className="font-medium">{heroCardBadgeBottom || 'Registro Libre'}</span>
                            <span className="text-accent-text font-mono text-[11px]">Acceso Inmediato</span>
                          </div>
                        </div>
                      )}

                      {(heroCardTitle || heroCardText) && (
                        <div>
                          {heroCardTitle && (
                            <h3 className="font-display text-xl sm:text-2xl font-light text-foreground">
                              {heroCardTitle}
                            </h3>
                          )}
                          {heroCardText && (
                            <p className="text-xs text-foreground/75 leading-relaxed mt-2 whitespace-pre-line">
                              {heroCardText}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Ciclos y niveles */}
                      {heroCardLinkLabel && (
                        <div className="pt-3 border-t border-border/20 flex items-center justify-end text-xs">
                          <a
                            href={heroCardLinkHref}
                            className="text-[11px] font-semibold uppercase tracking-wider text-accent-text hover:underline"
                          >
                            {heroCardLinkLabel}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <ScrollCue
            label={locale === 'en' ? 'Explore member privileges' : 'Explorar privilegios de membresía'}
            className="shrink-0 mt-4"
          />
        </section>

        {/* ── Contenido Estructurado ── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
          {plans.length === 0 ? (
            <EmptyState
              variant="composed"
              className="mt-10"
              title="Todavía no hay planes de recolección publicados"
              description="Cuando haya una temporada abierta, el plan se publicará aquí. Mientras tanto, el catálogo sigue disponible."
              action={
                <Link href="/contacto" className="underline underline-offset-4">
                  Preguntar por la próxima recolección
                </Link>
              }
            />
          ) : null}

        {/* ── Posibilidades y Privilegios del Cliente Registrado ── */}
        {(() => {
          const showBeneficios = clubSettings.show_beneficios !== false;
          const beneficiosKicker = resolveLocalized(clubSettings.beneficios_kicker, clubSettings.beneficios_kicker_en, locale);
          const beneficiosTitle =
            resolveLocalized(clubSettings.beneficios_title, clubSettings.beneficios_title_en, locale);
          const beneficiosSubtitle = resolveLocalized(clubSettings.beneficios_subtitle, clubSettings.beneficios_subtitle_en, locale);
          const raw = clubSettings as unknown as Record<string, unknown>;
          const str = (key: string) =>
            typeof raw[key] === 'string' ? (raw[key] as string) : undefined;
          const cards = [1, 2, 3, 4, 5, 6].map((n) => {
            const tag = resolveLocalized(str(`beneficio_${n}_tag`), str(`beneficio_${n}_tag_en`), locale);
            const cardTitle = resolveLocalized(str(`beneficio_${n}_title`), str(`beneficio_${n}_title_en`), locale);
            const desc = resolveLocalized(str(`beneficio_${n}_desc`), str(`beneficio_${n}_desc_en`), locale);
            return { tag, cardTitle, desc };
          }).filter((c) => c.tag || c.cardTitle || c.desc);

          if (!showBeneficios || (!beneficiosTitle && cards.length === 0)) return null;

          return (
            <section id="beneficios" className="mt-14 scroll-mt-24">
              <div className="text-center max-w-3xl lg:max-w-4xl mx-auto mb-10">
                {beneficiosKicker && (
                  <span className="text-xs uppercase tracking-[0.2em] text-accent-text font-semibold block mb-1">
                    {beneficiosKicker}
                  </span>
                )}
                {beneficiosTitle && (
                  <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground text-balance">
                    {beneficiosTitle}
                  </h2>
                )}
                {beneficiosSubtitle && (
                  <p className={`mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line ${alignToClass(clubSettings.text_align)}`}>
                    {beneficiosSubtitle}
                  </p>
                )}
              </div>

              {cards.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cards.map((c, i) => (
                    <div key={i} className="rounded-2xl border border-border/40 bg-card p-5 space-y-2">
                      {c.tag && (
                        <span className="text-[0.65rem] uppercase tracking-wider text-accent-text font-bold">
                          {c.tag}
                        </span>
                      )}
                      {c.cardTitle && (
                        <h3 className="font-display text-lg font-light text-foreground">
                          {c.cardTitle}
                        </h3>
                      )}
                      {c.desc && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {c.desc}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })()}

        {/* Presencia Territorial y Estándar de Origen */}
        {(() => {
          const custodiaBadge = resolveLocalized(clubSettings.custodia_badge, clubSettings.custodia_badge_en, locale);
          const custodiaTitle = resolveLocalized(clubSettings.custodia_title, clubSettings.custodia_title_en, locale);
          const custodiaText = resolveLocalized(clubSettings.custodia_text, clubSettings.custodia_text_en, locale);

          if (!custodiaTitle && !custodiaText) return null;

          return (
            <section className="mt-14 rounded-3xl border border-border/50 bg-card p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {custodiaBadge && (
                  <span className="text-xs uppercase tracking-[0.2em] text-accent-text font-semibold">
                    {custodiaBadge}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">
                  {ecosystemMetrics.sectores > 0 ? `${ecosystemMetrics.sectores} sectores censados` : 'Predio Pureo · Chiloé'}
                </span>
              </div>
              {custodiaTitle && (
                <h2 className="font-display text-xl sm:text-2xl font-light text-foreground">
                  {custodiaTitle}
                </h2>
              )}
              {custodiaText && (
                <p className={`text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty whitespace-pre-line ${alignToClass(clubSettings.text_align)}`}>
                  {custodiaText}
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-border/30 text-center sm:text-left">
                <div>
                  <p className="font-display text-2xl sm:text-3xl font-light text-accent-text tabular-nums">
                    {ecosystemMetrics.arboles_total > 0
                      ? `${ecosystemMetrics.arboles_total.toLocaleString('es-CL')}+`
                      : 'En censo'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {ecosystemMetrics.arboles_total > 0
                      ? 'Árboles nativos censados'
                      : 'Monitoreo territorial 2026–2027'}
                  </p>
                </div>
                <div>
                  <p className="font-display text-2xl sm:text-3xl font-light text-accent-text tabular-nums">
                    {ecosystemMetrics.co2_ton > 0
                      ? `~${Math.round(ecosystemMetrics.co2_ton).toLocaleString('es-CL')} ton`
                      : 'En medición'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {ecosystemMetrics.co2_ton > 0
                      ? 'CO₂ capturado vivo'
                      : 'Balance de captura 2026–2027'}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="font-display text-2xl sm:text-3xl font-light text-accent-text">
                    Pureo
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Predio apícola en Queilén, Chiloé
                  </p>
                </div>
              </div>
            </section>
          );
        })()}

        {/* ── Transparencia del Club: Reglas de Puntos, Ciclos y Panel Sensorial ── */}
        <section className="mt-14 rounded-3xl border border-border/50 bg-card p-6 sm:p-8 space-y-6">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-accent-text font-semibold block mb-1">
              Transparencia del Club
            </span>
            <h2 className="font-display text-2xl font-light text-foreground">
              Reglas del Programa: Puntos, Ciclos y Panel Sensorial
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Separamos con claridad el saldo económico de canje respecto a tu permanencia y colaboración en el enjambre.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 pt-2">
            <div className="rounded-2xl border border-border/30 bg-surface-raised/40 p-5 space-y-2">
              <h3 className="font-display text-base font-medium text-foreground">Puntos (Saldo Canjeable)</h3>
              <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                <li>• <strong>1 punto</strong> por cada $100 en compras web.</li>
                <li>• <strong>100 puntos = $1.000</strong> de descuento en el checkout (10% de retorno).</li>
                <li>• <strong>100 puntos de bienvenida</strong> al completar tu registro.</li>
                <li>• Canjeable exclusivamente en la tienda web (ferias y cafeterías operan libros independientes).</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border/30 bg-surface-raised/40 p-5 space-y-2">
              <h3 className="font-display text-base font-medium text-foreground">Ciclos (Nivel de Guardián)</h3>
              <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                <li>• <strong>5 ciclos</strong> por cada reseña sensorial validada de lote.</li>
                <li>• <strong>1 ciclo</strong> por cada $1.000 en compras acumuladas.</li>
                <li>• Los ciclos <strong>no se descuentan</strong> al canjear puntos de saldo.</li>
                <li>• Fijan tu acceso a reservas de floraciones escasas y fondos forestales.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border/30 bg-surface-raised/40 p-5 space-y-2">
              <h3 className="font-display text-base font-medium text-foreground">Panel Sensorial & Control</h3>
              <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                <li>• Tus evaluaciones de lote integran el panel sensorial ciudadano (ST-CATA).</li>
                <li>• Los perfiles sensoriales se publican al alcanzar N ≥ 30 sesiones validadas.</li>
                <li>• Para resguardo estadístico, un <strong>5% a 10% de usuarios</strong> opera como grupo de control sin incentivos económicos directos en catas.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        {(() => {
          const howItWorksTitle = resolveLocalized(clubSettings.how_it_works_title, clubSettings.how_it_works_title_en, locale);
          const steps = [
            resolveLocalized(clubSettings.step1_text, clubSettings.step1_text_en, locale),
            resolveLocalized(clubSettings.step2_text, clubSettings.step2_text_en, locale),
            resolveLocalized(clubSettings.step3_text, clubSettings.step3_text_en, locale),
            resolveLocalized(clubSettings.step4_text, clubSettings.step4_text_en, locale),
          ].filter(Boolean);

          if (!howItWorksTitle && steps.length === 0) return null;

          return (
            <section className="mt-14">
              {howItWorksTitle && (
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {howItWorksTitle}
                </h2>
              )}
              {steps.length > 0 && (
                <ol className="mt-4 space-y-3">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-accent-text text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className={`pt-1 whitespace-pre-line ${alignToClass(clubSettings.text_align)}`}>{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          );
        })()}

        {/* ── Niveles de Permanencia: Los Cuatro Ciclos del Enjambre ── */}
        {(() => {
          const tiersKicker = resolveLocalized(clubSettings.tiers_kicker, clubSettings.tiers_kicker_en, locale);
          const tiersTitle = resolveLocalized(clubSettings.tiers_title, clubSettings.tiers_title_en, locale);
          const tiersSubtitle = resolveLocalized(clubSettings.tiers_subtitle, clubSettings.tiers_subtitle_en, locale);
          const rawTiers = clubSettings as unknown as Record<string, unknown>;
          const strTier = (key: string) =>
            typeof rawTiers[key] === 'string' ? (rawTiers[key] as string) : undefined;
          const tiers = [1, 2, 3, 4].map((n) => ({
            badge: resolveLocalized(strTier(`tier_${n}_badge`), strTier(`tier_${n}_badge_en`), locale),
            label: resolveLocalized(strTier(`tier_${n}_label`), strTier(`tier_${n}_label_en`), locale),
            cardTitle: resolveLocalized(strTier(`tier_${n}_title`), strTier(`tier_${n}_title_en`), locale),
            desc: resolveLocalized(strTier(`tier_${n}_desc`), strTier(`tier_${n}_desc_en`), locale),
            foot: resolveLocalized(strTier(`tier_${n}_foot`), strTier(`tier_${n}_foot_en`), locale),
          })).filter((t) => t.badge || t.label || t.cardTitle || t.desc || t.foot);

          if (!tiersTitle && tiers.length === 0) return null;

          return (
            <section id="niveles" className="mt-14 scroll-mt-24 rounded-3xl border border-border/50 bg-surface-raised/20 p-6 sm:p-8">
              <div className="text-center max-w-3xl lg:max-w-4xl mx-auto mb-10">
                {tiersKicker && (
                  <span className="text-xs uppercase tracking-[0.2em] text-accent-text font-semibold block mb-1">
                    {tiersKicker}
                  </span>
                )}
                {tiersTitle && (
                  <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground text-balance">
                    {tiersTitle}
                  </h2>
                )}
                {tiersSubtitle && (
                  <p className={`mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line ${alignToClass(clubSettings.text_align)}`}>
                    {tiersSubtitle}
                  </p>
                )}
              </div>

              {tiers.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {tiers.map((t, i) => (
                    <div key={i} className="rounded-2xl border border-border/40 bg-card p-5 flex flex-col justify-between">
                      <div>
                        {(t.badge || t.label) && (
                          <div className="flex items-center justify-between gap-2 mb-3">
                            {t.badge ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-accent-text">
                                {t.badge}
                              </span>
                            ) : <span />}
                            {t.label ? (
                              <span className="text-[10px] text-muted-foreground font-mono">{t.label}</span>
                            ) : null}
                          </div>
                        )}
                        {t.cardTitle && (
                          <h3 className="font-display text-xl font-light text-foreground mb-1.5">
                            {t.cardTitle}
                          </h3>
                        )}
                        {t.desc && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {t.desc}
                          </p>
                        )}
                      </div>
                      {t.foot && (
                        <div className="mt-4 pt-3 border-t border-border/20 text-[11px] text-accent-text flex items-center gap-1.5">
                          {i === 2 ? (
                            <Crown className="w-3.5 h-3.5 shrink-0" />
                          ) : i === 3 ? (
                            <Shield className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>{t.foot}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })()}

        {/* ── Privilegios Digitales & Economía Circular ── */}
        {(() => {
          const walletKicker = resolveLocalized(clubSettings.wallet_kicker, clubSettings.wallet_kicker_en, locale);
          const walletTitle = resolveLocalized(clubSettings.wallet_title, clubSettings.wallet_title_en, locale);
          const walletText = resolveLocalized(clubSettings.wallet_text, clubSettings.wallet_text_en, locale);
          const retornoKicker = resolveLocalized(clubSettings.retorno_kicker, clubSettings.retorno_kicker_en, locale);
          const retornoTitle = resolveLocalized(clubSettings.retorno_title, clubSettings.retorno_title_en, locale);
          const retornoText = resolveLocalized(clubSettings.retorno_text, clubSettings.retorno_text_en, locale);
          const hasWallet = Boolean(walletKicker || walletTitle || walletText);
          const hasRetorno = Boolean(retornoKicker || retornoTitle || retornoText);

          if (!hasWallet && !hasRetorno) return null;

          return (
            <section className={`mt-14 grid ${hasWallet && hasRetorno ? 'sm:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'} gap-6`}>
              {/* Card Credencial Móvil */}
              {hasWallet && (
                <div className="rounded-3xl border border-border/50 bg-card p-6 sm:p-7 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text mb-4">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    {walletKicker && (
                      <span className="text-[0.65rem] uppercase tracking-wider text-accent-text font-semibold block mb-1">
                        {walletKicker}
                      </span>
                    )}
                    {walletTitle && (
                      <h3 className="font-display text-xl font-light text-foreground mb-2">
                        {walletTitle}
                      </h3>
                    )}
                    {walletText && (
                      <p className={`text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line ${alignToClass(clubSettings.text_align)}`}>
                        {walletText}
                      </p>
                    )}
                  </div>
                  <div className="mt-6 pt-4 border-t border-border/20">
                    <Link
                      href="/perfil/billetera"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-text hover:underline"
                    >
                      <span>Ver tu credencial en el perfil</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Card Retorno Circular */}
              {hasRetorno && (
                <div className="rounded-3xl border border-border/50 bg-card p-6 sm:p-7 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text mb-4">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    {retornoKicker && (
                      <span className="text-[0.65rem] uppercase tracking-wider text-accent-text font-semibold block mb-1">
                        {retornoKicker}
                      </span>
                    )}
                    {retornoTitle && (
                      <h3 className="font-display text-xl font-light text-foreground mb-2">
                        {retornoTitle}
                      </h3>
                    )}
                    {retornoText && (
                      <p className={`text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line ${alignToClass(clubSettings.text_align)}`}>
                        {retornoText}
                      </p>
                    )}
                  </div>
                  <div className="mt-6 pt-4 border-t border-border/20">
                    <span className="text-xs text-muted-foreground">
                      Esterilización limpia y recirculación en apiarios de Chiloé
                    </span>
                  </div>
                </div>
              )}
            </section>
          );
        })()}

        {/* Floraciones y Recolecciones de Temporada */}
        <section id="temporadas" className="mt-14 scroll-mt-24">
          <div>
            {(() => {
              const seasonsKicker = resolveLocalized(clubSettings.seasons_kicker, clubSettings.seasons_kicker_en, locale);
              const seasonsTitle =
                resolveLocalized(clubSettings.seasons_title, clubSettings.seasons_title_en, locale);
              const seasonsSubtitle = resolveLocalized(clubSettings.seasons_subtitle, clubSettings.seasons_subtitle_en, locale);

              return (
                <>
                  {seasonsKicker && (
                    <span className="text-xs uppercase tracking-[0.2em] text-accent-text font-semibold block mb-1">
                      {seasonsKicker}
                    </span>
                  )}
                  {seasonsTitle && (
                    <h2 className="font-display text-2xl font-light text-foreground">
                      {seasonsTitle}
                    </h2>
                  )}
                  {seasonsSubtitle && (
                    <p className={`text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed whitespace-pre-line ${alignToClass(clubSettings.text_align)}`}>
                      {seasonsSubtitle}
                    </p>
                  )}
                </>
              );
            })()}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {ctx.cosechas.map((c) => {
              const plan = plans.find((p) => p.key === c.planKey);
              const planId = resolveClubPlanId(c.planKey, plans);
              const planResolved = plans.find((p) => p.id === planId);
              return (
                <article
                  key={c.key}
                  className={`rounded-2xl border p-5 flex flex-col gap-3 transition-colors ${
                    c.destacada
                      ? 'border-accent/40 bg-accent/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {c.nombre}
                      </h3>
                      {c.nombreCientifico && (
                        <p className="text-xs italic text-muted-foreground">
                          {c.nombreCientifico}
                        </p>
                      )}
                    </div>
                    <ClubCosechaBadge color={c.color} label={c.statusLabel} />
                  </div>
                  {c.tagline ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.tagline}</p>
                  ) : null}
                  {c.cata.length > 0 && (
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">
                        {locale === 'en' ? 'Tasting' : 'Cata'}
                      </p>
                      <ul className="flex flex-wrap gap-1.5">
                        {c.cata.map((note) => (
                          <li
                            key={note}
                            className="text-xs px-2 py-0.5 rounded-full bg-surface-sunken text-foreground/80"
                          >
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {c.maridaje ? (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {locale === 'en' ? 'Pairing: ' : 'Maridaje: '}
                      </span>
                      {c.maridaje}
                    </p>
                  ) : null}
                  {/* Lotes con pasaporte público de esta floración */}
                  {(() => {
                    const lotes = lotesByClub[c.key]?.slice(0, 3) ?? [];
                    if (lotes.length === 0) return null;
                    return (
                      <div className="rounded-xl bg-surface-sunken/80 border border-border/50 p-3 space-y-2">
                        <p className="text-[0.65rem] uppercase tracking-wider font-bold text-muted-foreground">
                          {locale === 'en' ? 'Batches with passport' : 'Lotes con pasaporte'}
                        </p>
                        <ul className="space-y-1.5">
                          {lotes.map((l) => {
                            const href = pasaporteLoteUrl(nucleo, l.id);
                            return (
                              <li key={l.id} className="text-xs">
                                {href ? (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-accent-text hover:underline font-medium"
                                  >
                                    {l.nombre_lote?.trim() || l.variedad_floral}
                                  </a>
                                ) : (
                                  <span className="font-medium text-foreground">
                                    {l.nombre_lote?.trim() || l.variedad_floral}
                                  </span>
                                )}
                                {l.fecha && (
                                  <span className="text-muted-foreground">
                                    {' '}
                                    ·{' '}
                                    {formatCalendarDate(l.fecha, {
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })()}

                  <div className="mt-auto pt-2 flex flex-wrap gap-2">
                    <Link
                      href={`/perfil/reposicion?plan=${encodeURIComponent(c.planKey)}`}
                      className="inline-flex min-h-10 items-center rounded-full bg-primary/10 px-4 text-xs font-bold uppercase tracking-wider text-accent-text hover:bg-primary/15"
                    >
                      {planResolved
                        ? `${locale === 'en' ? 'Subscribe' : 'Suscribir'} · ${formatCLP(planResolved.price_clp)}`
                        : (locale === 'en' ? 'Subscribe' : 'Suscribir')}
                      {plan ? '' : planResolved && planResolved.key !== c.planKey ? ' *' : ''}
                    </Link>
                    {c.origenPath && (
                      <Link
                        href={c.origenPath}
                        className="inline-flex min-h-10 items-center rounded-full border border-border px-4 text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        {locale === 'en' ? 'Origin' : 'Origen'}
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          {(() => {
            const seasonsNote = resolveLocalized(clubSettings.seasons_note, clubSettings.seasons_note_en, locale);
            if (!seasonsNote) return null;
            return (
              <p className="mt-3 text-[0.65rem] text-muted-foreground whitespace-pre-line">
                {seasonsNote}
              </p>
            );
          })()}
        </section>

        {/* Vitrina global de pasaportes */}
        {lotesPublicos.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Pasaportes recientes
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Lotes publicados que cualquiera puede verificar — la misma prueba que llega con el
              club.
            </p>
            <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
              {lotesPublicos.slice(0, 6).map((l) => {
                const href = pasaporteLoteUrl(nucleo, l.id);
                return (
                  <li
                    key={l.id}
                    className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {l.nombre_lote?.trim() || l.variedad_floral}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {l.variedad_floral}
                        {l.humedad != null ? ` · humedad ${l.humedad}%` : ''}
                        {l.lab_nombre ? ` · ${l.lab_nombre}` : ''}
                      </p>
                      {l.relato_excerpt && (
                        <p className="text-xs text-muted-foreground/90 mt-1 italic line-clamp-2">
                          {l.relato_excerpt}
                        </p>
                      )}
                    </div>
                    {href && (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold uppercase tracking-wider text-accent-text shrink-0"
                      >
                        Ver pasaporte →
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        </div>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
