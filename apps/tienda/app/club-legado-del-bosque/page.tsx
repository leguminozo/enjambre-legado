import Link from 'next/link';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import {
  Award,
  Sparkles,
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
import { ClubCosechaBadge } from '@/components/shop/club-cosecha-badge';
import { listActiveSubscriptionPlans } from '@/lib/shop/subscription-plans';
import {
  getClubCosechaContext,
  groupLotesByClub,
  resolveClubPlanId,
} from '@/lib/shop/club-cosecha';
import {
  parseSeasonalOverrides,
  parseClubPageSettings,
  DEFAULT_CLUB_PAGE_SETTINGS,
  resolveLocalized,
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

export const metadata: Metadata = {
  title: 'Club Legado del Bosque · Membresía y Suscripciones',
  description:
    'Comunidad de guardianes del patrimonio forestal. Suscripciones de reposición recurrente y reservas anticipadas de recolecciones nativas con pasaporte de lote — La Obrera y el Zángano.',
  alternates: { canonical: `${SITE_URL}/club-legado-del-bosque` },
  openGraph: {
    title: 'Club Legado del Bosque · Membresía y Suscripciones',
    description:
      'Comunidad de guardianes del patrimonio forestal. Suscripciones de reposición recurrente y reservas anticipadas de recolecciones nativas con pasaporte de lote.',
    url: `${SITE_URL}/club-legado-del-bosque`,
    type: 'website',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
  },
};

export default async function ClubCosechaPage() {
  const isDraft = await isCmsPreviewRequest();
  // Contenido estacional del CMS (sección seasonal_settings) sobre el default por mes.
  const [chrome, plans, lotesPublicos, ecosystemMetrics, clubSettingsRows] = await Promise.all([
    loadStoreChrome({ draft: isDraft }),
    listActiveSubscriptionPlans('tienda_club'),
    fetchLotesPublicosForClub(24),
    getEcosystemMetrics(),
    getSiteContent('club_page_settings', { draft: isDraft }),
  ]);
  const locale = await getLocale();
  const clubSettings = clubSettingsRows?.[0]
    ? parseClubPageSettings(clubSettingsRows[0].content as Record<string, unknown>)
    : DEFAULT_CLUB_PAGE_SETTINGS;
  const ctx = getClubCosechaContext(
    new Date(),
    parseSeasonalOverrides(chrome.seasonal),
    locale,
  );
  const nucleo = getNucleoAppUrl();
  const lotesByClub = groupLotesByClub(lotesPublicos);
  const suggestedId = resolveClubPlanId(ctx.suggestedPlanKey, plans);
  const suggestedPlan = plans.find((p) => p.id === suggestedId) ?? null;

  return (
    <StoreShell>
      <ShopHeader />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] pb-24">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
          {ctx.seasonal.seasonLabel} · {ctx.seasonal.harvestStatus}
        </p>
        <h1 className="mt-2 font-display text-[clamp(1.85rem,6vw,2.5rem)] font-semibold text-foreground text-balance">
          {resolveLocalized(clubSettings.hero_title, clubSettings.hero_title_en, locale) || ctx.copy.titulo}
        </h1>
        <p className="mt-4 text-muted-foreground leading-relaxed text-pretty max-w-2xl">
          {resolveLocalized(clubSettings.hero_subtitle, clubSettings.hero_subtitle_en, locale) || ctx.copy.subtitulo}
        </p>
        <p className="mt-3 text-sm text-foreground/80 leading-relaxed border-l-2 border-accent/50 pl-4">
          {ctx.seasonal.message}
        </p>

        {/* CTA principal */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href={
              suggestedPlan
                ? `/perfil/reposicion?plan=${encodeURIComponent(suggestedPlan.key)}`
                : '/perfil/reposicion'
            }
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {suggestedPlan
              ? `Suscribirme · ${suggestedPlan.name}`
              : 'Ver suscripciones'}
            {suggestedPlan ? ` · ${formatCLP(suggestedPlan.price_clp)}` : ''}
          </Link>
          <Link
            href="/catalogo"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground hover:border-primary/40 transition-colors"
          >
            Ver catálogo
          </Link>
        </div>

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

        {/* Custodia y Plantaciones Vivas */}
        <section className="mt-14 rounded-3xl border border-border/50 bg-card p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-accent-text font-semibold">
              {resolveLocalized(clubSettings.custodia_badge, clubSettings.custodia_badge_en, locale) ||
                'Custodia Territorial Activa'}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {ecosystemMetrics.sectores > 0 ? `${ecosystemMetrics.sectores} sectores censados` : 'Predio Pureo · Chiloé'}
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-light text-foreground">
            {resolveLocalized(clubSettings.custodia_title, clubSettings.custodia_title_en, locale) ||
              'Cada membresía financia el bosque que nos sobrevivirá'}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
            {resolveLocalized(clubSettings.custodia_text, clubSettings.custodia_text_en, locale) ||
              'Al suscribirte a una recolección del Club, tu aporte financia directamente la siembra, cuidado y censo de árboles nativos en los predios apícolas de Chiloé. La apicultura no extrae: devuelve vida al bosque valdiviano.'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-border/30 text-center sm:text-left">
            <div>
              <p className="font-display text-2xl sm:text-3xl font-light text-accent-text tabular-nums">
                {ecosystemMetrics.arboles_total.toLocaleString('es-CL')}+
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Árboles nativos censados</p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-light text-accent-text tabular-nums">
                ~{Math.round(ecosystemMetrics.co2_ton > 0 ? ecosystemMetrics.co2_ton : ecosystemMetrics.arboles_total * 0.05).toLocaleString('es-CL')} ton
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">CO₂ capturado vivo</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="font-display text-2xl sm:text-3xl font-light text-accent-text tabular-nums">
                {ecosystemMetrics.especies_nativas > 0 ? `${ecosystemMetrics.especies_nativas}+` : '18+'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Especies de flora nativa</p>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold text-foreground">
            {resolveLocalized(clubSettings.how_it_works_title, clubSettings.how_it_works_title_en, locale) ||
              'Cómo funciona'}
          </h2>
          <ol className="mt-4 space-y-3">
            {[
              resolveLocalized(clubSettings.step1_text, clubSettings.step1_text_en, locale) || ctx.copy.comoFunciona[0],
              resolveLocalized(clubSettings.step2_text, clubSettings.step2_text_en, locale) || ctx.copy.comoFunciona[1],
              resolveLocalized(clubSettings.step3_text, clubSettings.step3_text_en, locale) || ctx.copy.comoFunciona[2],
              resolveLocalized(clubSettings.step4_text, clubSettings.step4_text_en, locale) || ctx.copy.comoFunciona[3],
            ]
              .filter(Boolean)
              .map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-accent-text text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="pt-1">{step}</span>
                </li>
              ))}
          </ol>
        </section>

        {/* ── Niveles de Custodia: Los Cuatro Ciclos del Guardián ── */}
        <section className="mt-14 rounded-3xl border border-border/50 bg-surface-raised/20 p-6 sm:p-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs uppercase tracking-[0.2em] text-accent-text font-semibold block mb-1">
              Comunidad de Guardianes
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground text-balance">
              Cuatro ciclos de custodia y reciprocidad
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              En el bosque austral la lealtad es un círculo vivo. Cada entrega de cosecha, cada frasco retornado y cada año de permanencia suma ciclos que profundizan tu vínculo con los apiarios.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Tier 1: Obrera */}
            <div className="rounded-2xl border border-border/40 bg-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-accent-text">
                    Ciclo I
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">0+ ciclos</span>
                </div>
                <h3 className="font-display text-xl font-light text-foreground mb-1.5">
                  Guardián Obrera
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Punto de entrada al enjambre. Trazabilidad pública de cada lote recibido, acceso al pasaporte digital QR y financiamiento directo de la siembra de árboles nativos en Chiloé.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/20 text-[11px] text-accent-text flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Pasaporte de lote y bienvenida comunitaria</span>
              </div>
            </div>

            {/* Tier 2: Zángano */}
            <div className="rounded-2xl border border-border/40 bg-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-accent-text">
                    Ciclo II
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">500+ ciclos</span>
                </div>
                <h3 className="font-display text-xl font-light text-foreground mb-1.5">
                  Guardián Zángano
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Custodio recurrente del territorio. Acceso preferente y anticipado a floraciones escasas de temporada (Ulmo puro de altura y Tiaca silvestre) antes de cualquier apertura general.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/20 text-[11px] text-accent-text flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Reserva prioritaria en cosechas de baja producción</span>
              </div>
            </div>

            {/* Tier 3: Reina */}
            <div className="rounded-2xl border border-border/40 bg-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-accent-text">
                    Ciclo III
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">2.000+ ciclos</span>
                </div>
                <h3 className="font-display text-xl font-light text-foreground mb-1.5">
                  Guardián Reina
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Liderazgo activo en la regeneración biocultural. Apadrinamiento formal de árboles nativos censados en Predio Pureo e invitación prioritaria a catas privadas de autor conducidas por Cristina Miranda.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/20 text-[11px] text-accent-text flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 shrink-0" />
                <span>Árbol nativo apadrinado y acceso a catas privadas</span>
              </div>
            </div>

            {/* Tier 4: Colmena */}
            <div className="rounded-2xl border border-border/40 bg-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-accent-text">
                    Ciclo Mayor
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">5.000+ ciclos</span>
                </div>
                <h3 className="font-display text-xl font-light text-foreground mb-1.5">
                  Guardián Colmena
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El más alto compromiso con el ecosistema. Asignación directa de microlotes de recolección ultra-limitada y derecho preferente para estadías e inmersiones territoriales en Predio Pureo.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/20 text-[11px] text-accent-text flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span>Microlotes de autor y prioridad en estadías Pureo</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Privilegios Digitales & Economía Circular ── */}
        <section className="mt-14 grid sm:grid-cols-2 gap-6">
          {/* Card Billetera Móvil */}
          <div className="rounded-3xl border border-border/50 bg-card p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text mb-4">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-[0.65rem] uppercase tracking-wider text-accent-text font-semibold block mb-1">
                Pase Móvil
              </span>
              <h3 className="font-display text-xl font-light text-foreground mb-2">
                Apple Wallet & Google Wallet
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Lleva tu credencial de guardián en la billetera de tu teléfono. El pase actualiza en tiempo real tus ciclos acumulados, sellos de temporada y tu código QR personal para ferias y encuentros.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/20">
              <Link
                href="/perfil/billetera"
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-text hover:underline"
              >
                <span>Descargar pase en tu perfil</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card Retorno Circular */}
          <div className="rounded-3xl border border-border/50 bg-card p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text mb-4">
                <RotateCcw className="w-5 h-5" />
              </div>
              <span className="text-[0.65rem] uppercase tracking-wider text-accent-text font-semibold block mb-1">
                Economía Circular
              </span>
              <h3 className="font-display text-xl font-light text-foreground mb-2">
                Retorno de Frascos de Vidrio
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Nuestros frascos de vidrio están diseñados para circular. Por cada envase limpio que entregues en ferias, catas o puntos asociados, se acreditan <strong>$500 CLP de saldo</strong> en tu cuenta y <strong>2 ciclos de custodia</strong>.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/20">
              <span className="text-xs text-muted-foreground">
                Esterilización limpia y recirculación en apiarios de Chiloé
              </span>
            </div>
          </div>
        </section>

        {/* Recolecciones */}
        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Temporadas del club
          </h2>
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
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.tagline}</p>
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">
                      Cata
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
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Maridaje: </span>
                    {c.maridaje}
                  </p>
                  {/* Lotes con pasaporte público de esta floración */}
                  {(() => {
                    const lotes = lotesByClub[c.key]?.slice(0, 3) ?? [];
                    if (lotes.length === 0) return null;
                    return (
                      <div className="rounded-xl bg-surface-sunken/80 border border-border/50 p-3 space-y-2">
                        <p className="text-[0.65rem] uppercase tracking-wider font-bold text-muted-foreground">
                          Lotes con pasaporte
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
                                    {new Date(l.fecha).toLocaleDateString('es-CL', {
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
                        ? `Suscribir · ${formatCLP(planResolved.price_clp)}`
                        : 'Suscribir'}
                      {plan ? '' : planResolved && planResolved.key !== c.planKey ? ' *' : ''}
                    </Link>
                    {c.origenPath && (
                      <Link
                        href={c.origenPath}
                        className="inline-flex min-h-10 items-center rounded-full border border-border px-4 text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        Origen
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <p className="mt-3 text-[0.65rem] text-muted-foreground">
            * Si el plan de floración aún no está en catálogo de suscripciones, usamos el plan
            trimestral o mensual activo.
          </p>
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

        {/* Territorio */}
        <section className="mt-14 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Origen y prueba
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            El club se alimenta de la misma trama: lotes con pasaporte público, mapa territorial
            de Chiloé e impacto con metodología abierta.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/perfil/trazabilidad" className="text-accent-text hover:underline">
              Trazabilidad en tu perfil
            </Link>
            {nucleo && (
              <a
                href={`${nucleo.replace(/\/$/, '')}/mapa-chiloe`}
                className="text-accent-text hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Mapa Chiloé
              </a>
            )}
            <Link href="/ciencia" className="text-accent-text hover:underline">
              Ciencia y regeneración del bosque
            </Link>
          </div>
        </section>

        <Link
          href="/"
          className="mt-10 inline-flex min-h-11 items-center text-sm text-accent-text underline underline-offset-2"
        >
          ← Inicio
        </Link>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
