import Link from 'next/link';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
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
import { parseSeasonalOverrides } from '@/lib/shop/store-chrome';
import { isCmsPreviewRequest } from '@/lib/cms';
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
  // Contenido estacional del CMS (sección seasonal_settings) sobre el default por mes.
  const [chrome, plans, lotesPublicos, ecosystemMetrics] = await Promise.all([
    loadStoreChrome({ draft: await isCmsPreviewRequest() }),
    listActiveSubscriptionPlans(),
    fetchLotesPublicosForClub(24),
    getEcosystemMetrics(),
  ]);
  const locale = await getLocale();
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
          {ctx.copy.titulo}
        </h1>
        <p className="mt-4 text-muted-foreground leading-relaxed text-pretty max-w-2xl">
          {ctx.copy.subtitulo}
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
              Custodia Territorial Activa
            </span>
            <span className="text-[10px] text-muted-foreground">
              {ecosystemMetrics.sectores > 0 ? `${ecosystemMetrics.sectores} sectores censados` : 'Predio Pureo · Chiloé'}
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-light text-foreground">
            Cada membresía financia el bosque que nos sobrevivirá
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
            Al suscribirte a una recolección del Club, tu aporte financia directamente la siembra, cuidado y censo de árboles nativos en los predios apícolas de Chiloé. La apicultura no extrae: devuelve vida al bosque valdiviano.
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
          <h2 className="font-display text-xl font-semibold text-foreground">Cómo funciona</h2>
          <ol className="mt-4 space-y-3">
            {ctx.copy.comoFunciona.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-accent-text text-xs font-bold">
                  {i + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
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
