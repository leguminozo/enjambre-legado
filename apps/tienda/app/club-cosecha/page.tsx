import Link from 'next/link';
import type { Metadata } from 'next';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { listActiveSubscriptionPlans } from '@/lib/shop/subscription-plans';
import {
  getClubCosechaContext,
  groupLotesByClub,
  resolveClubPlanId,
} from '@/lib/shop/club-cosecha';
import { formatCLP } from '@/lib/shop/format';
import { getNucleoAppUrl } from '@/lib/shop/nucleo-app-url';
import {
  fetchLotesPublicosForClub,
  pasaporteLoteUrl,
} from '@/lib/shop/club-lotes-publicos';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';

export const metadata: Metadata = {
  title: 'Club de la Cosecha',
  description:
    'Suscripción al ritmo del bosque nativo: ulmo, tiaca y quillay con cata, origen y trazabilidad de lote — La Obrera y el Zángano.',
  alternates: { canonical: `${SITE_URL}/club-cosecha` },
  openGraph: {
    title: 'Club de la Cosecha · La Obrera y el Zángano',
    description:
      'Miel por temporada melífera: cata guiada, origen territorial y pasaporte de lote.',
    url: `${SITE_URL}/club-cosecha`,
    type: 'website',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
  },
};

export default async function ClubCosechaPage() {
  const ctx = getClubCosechaContext();
  const [plans, lotesPublicos] = await Promise.all([
    listActiveSubscriptionPlans(),
    fetchLotesPublicosForClub(24),
  ]);
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
              ? `Unirme · ${suggestedPlan.name}`
              : 'Ir a reposición'}
            {suggestedPlan ? ` · ${formatCLP(suggestedPlan.price_clp)}` : ''}
          </Link>
          <Link
            href="/catalogo"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground hover:border-primary/40 transition-colors"
          >
            Ver catálogo
          </Link>
        </div>

        {/* Cómo funciona */}
        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold text-foreground">Cómo funciona</h2>
          <ol className="mt-4 space-y-3">
            {ctx.copy.comoFunciona.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {i + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Cosechas */}
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
                    <span
                      className="text-[0.65rem] font-bold uppercase tracking-wider px-2 py-1 rounded-full shrink-0"
                      style={{
                        background: `${c.color}22`,
                        color: c.color,
                        border: `1px solid ${c.color}44`,
                      }}
                    >
                      {c.statusLabel}
                    </span>
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
                                    className="text-primary hover:underline font-medium"
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
                      className="inline-flex min-h-10 items-center rounded-full bg-primary/10 px-4 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/15"
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
                        className="text-xs font-bold uppercase tracking-wider text-primary shrink-0"
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
            <Link href="/perfil/trazabilidad" className="text-primary hover:underline">
              Trazabilidad en tu perfil
            </Link>
            {nucleo && (
              <>
                <a
                  href={`${nucleo.replace(/\/$/, '')}/mapa-chiloe`}
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Mapa Chiloé
                </a>
                <a
                  href={`${nucleo.replace(/\/$/, '')}/impacto`}
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open-book impacto
                </a>
              </>
            )}
            <Link href="/ciencia" className="text-primary hover:underline">
              Ciencia del bosque
            </Link>
          </div>
        </section>

        <Link
          href="/"
          className="mt-10 inline-flex min-h-11 items-center text-sm text-accent underline underline-offset-2"
        >
          ← Inicio
        </Link>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
