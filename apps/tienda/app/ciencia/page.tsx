import Link from 'next/link';
import type { Metadata } from 'next';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { getEcosystemMetrics } from '@/lib/shop/ecosystem-metrics';
import { getSiteContentBatch } from '@/lib/cms';
import { parseCienciaSettings } from '@/lib/shop/store-chrome';
import { claimsTrianguladas, DISCLAIMER_LEY_20606, getClaim } from '@enjambre/ciencia';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export const metadata: Metadata = {
  title: 'La ciencia del bosque · La Obrera y el Zángano',
  description:
    'Composición de la miel cruda, índice glucémico de referencia y el Índice de Regeneración Relativa (IRR). Contexto bibliográfico con límites explícitos.',
  alternates: { canonical: `${SITE_URL}/ciencia` },
  openGraph: {
    title: 'La ciencia del bosque · La Obrera y el Zángano',
    description:
      'Composición de la miel cruda, índice glucémico de referencia y el Índice de Regeneración Relativa (IRR).',
    url: `${SITE_URL}/ciencia`,
    type: 'article',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'La ciencia del bosque · La Obrera y el Zángano',
    description:
      'Composición de la miel cruda, índice glucémico de referencia y el Índice de Regeneración Relativa (IRR).',
  },
};

export default async function CienciaPage({
  searchParams,
}: {
  searchParams?: Promise<{ cms_preview?: string }>;
}) {
  const draft = (await searchParams)?.cms_preview === '1';
  const [m, batch] = await Promise.all([
    getEcosystemMetrics(),
    getSiteContentBatch(['ciencia_settings'], { draft }),
  ]);
  const cienciaSettings = parseCienciaSettings((batch.ciencia_settings?.[0]?.content as Record<string, unknown>) ?? null);

  // Coeficientes y límites desde la metodología publicada (paquete compartido).
  const ig = getClaim('ig_referencia');
  const enzimas = getClaim('composicion_enzimas');
  const h2o2 = getClaim('h2o2_antimicrobiana');
  const hmf = getClaim('hmf_limite_codex');
  const perfil = getClaim('perfil_organoleptico');
  const claims = claimsTrianguladas();

  // IRR sin números mágicos: solo se muestra cuando el dato de emisión existe.
  const co2CapturadoAnual = m.co2_capturado_kg > 0 ? m.co2_capturado_kg : null;
  const co2EmitidoAnual = m.co2_emitido_kg > 0 ? m.co2_emitido_kg : null;
  const irrCalculado =
    co2CapturadoAnual != null && co2EmitidoAnual != null && co2EmitidoAnual > 0
      ? Number((co2CapturadoAnual / co2EmitidoAnual).toFixed(2))
      : (m.irr_ecosistema ?? null);

  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-[var(--vh-full)] bg-background">
        {/* ── Hero ── */}
        <section className="relative px-4 text-center pt-[max(7rem,calc(env(safe-area-inset-top)+5.5rem))] pb-16 md:py-32">
          <div className="max-w-3xl mx-auto">
            <span className="block text-[0.65rem] tracking-[0.5em] uppercase text-accent-text mb-8">
              {cienciaSettings.kicker || 'Ciencia'}
            </span>
            <h1 className="font-display text-[clamp(2.25rem,8vw,4.5rem)] md:text-7xl font-light text-foreground mb-6 text-balance">
              La ciencia del bosque
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty text-justify">
              Cada frasco condensa un proceso biofísico observable. Estas son las referencias
              bibliográficas que lo acompañan, con sus límites explícitos.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-8 pb-24 space-y-20">
          {/* ── Fórmula 01: composición ── */}
          <section>
            <div className="mb-6">
              <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-2">
                Fórmula 01
              </span>
              <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.5rem)] font-light text-foreground">
                Composición de la miel cruda
              </h2>
              <p className="mt-4 text-muted-foreground max-w-3xl leading-relaxed text-justify">
                La miel no es un producto fabricado: es energía solar transformada en biomolécula
                por una cadena causal directa. La abeja concentra el néctar con enzimas y lo
                estabiliza por deshidratación. Frente al azúcar refinada —molienda,
                clarificación, centrifugación, decoloración—, la miel cruda es un alimento sin
                etapas industriales.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-left text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                    <th className="py-3 pr-4 font-normal">Parámetro</th>
                    <th className="py-3 pr-4 font-normal text-accent-text">Miel cruda</th>
                    <th className="py-3 font-normal">Azúcar refinada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {ig && (
                    <tr>
                      <td className="py-4 pr-4 text-muted-foreground">Índice glucémico (referencia)</td>
                      <td className="py-4 pr-4 text-accent-text">~55</td>
                      <td className="py-4 text-foreground">65</td>
                    </tr>
                  )}
                  {enzimas && (
                    <tr>
                      <td className="py-4 pr-4 text-muted-foreground">Enzimas activas</td>
                      <td className="py-4 pr-4 text-accent-text">Diastasa, invertasa, GOx</td>
                      <td className="py-4 text-foreground">0</td>
                    </tr>
                  )}
                  {h2o2 && (
                    <tr>
                      <td className="py-4 pr-4 text-muted-foreground">Acción antibacteriana (contexto)</td>
                      <td className="py-4 pr-4 text-accent-text">Asociada a H₂O₂ y bajo Aw</td>
                      <td className="py-4 text-foreground">No aplica</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <ul className="mt-6 space-y-2 text-xs text-muted-foreground border-t border-border/20 pt-6">
              {[ig, enzimas, h2o2].filter(Boolean).map((c) => c && (
                <li key={c.id}>
                  <strong className="text-foreground">{c.titulo}.</strong> {c.fuente}
                </li>
              ))}
            </ul>
          </section>

          {/* ── Fórmula 02: IRR ── */}
          <section>
            <div className="mb-6">
              <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-2">
                Fórmula 02
              </span>
              <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.5rem)] font-light text-foreground">
                Índice de Regeneración Relativa (IRR)
              </h2>
              <p className="mt-4 text-muted-foreground max-w-3xl leading-relaxed text-justify">
                El IRR es el cociente entre el CO₂ capturado por el ecosistema asociado y el CO₂
                emitido por la producción y la logística. Mayor a 1 significa captura neta. Es un
                indicador interno de transparencia —no un ACV certificado— con coeficientes
                publicados y versionados.
              </p>
            </div>

            <div className="rounded-2xl border border-border/40 bg-card p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
              <Metric label="Árboles en el ecosistema" value={m.arboles_total.toLocaleString('es-CL')} />
              <Metric
                label="CO₂ capturado/año"
                value={co2CapturadoAnual != null ? `${co2CapturadoAnual.toLocaleString('es-CL')} kg` : '—'}
              />
              <Metric
                label="CO₂ emitido producción + logística"
                value={co2EmitidoAnual != null ? `${co2EmitidoAnual.toLocaleString('es-CL')} kg` : '—'}
              />
              <Metric label="IRR" value={irrCalculado != null ? String(irrCalculado) : '—'} />
            </div>
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed text-justify">
              {irrCalculado != null
                ? `IRR = ${co2CapturadoAnual?.toLocaleString('es-CL') ?? '—'} / ${co2EmitidoAnual?.toLocaleString('es-CL') ?? '—'} = ${irrCalculado}.`
                : 'Datos de emisión en proceso de registro: el indicador se publica cuando existe el dato real, no una estimación.'}{' '}
              Coeficientes y límites en la{' '}
              <Link href="/impacto" className="text-primary hover:underline">
                metodología publicada
              </Link>
              .
            </p>
          </section>

          {/* ── Fórmula 03: propiedades que no se fabrican ── */}
          <section>
            <div className="mb-6">
              <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-2">
                Fórmula 03
              </span>
              <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.5rem)] font-light text-foreground">
                Propiedades que no se fabrican
              </h2>
              <p className="mt-4 text-muted-foreground max-w-3xl leading-relaxed text-justify">
                La miel del bosque húmedo del sur de Chile posee características de composición
                que la refinación destruye y la industria no puede replicar. Lo que sigue es
                contexto bibliográfico, no un sello sobre el frasco.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {[h2o2, enzimas, hmf, perfil].filter(Boolean).map((c) => c && (
                <div key={c.id} className="rounded-2xl border border-border/40 bg-card p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-2">{c.titulo}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed text-justify">{c.texto}</p>
                  <p className="mt-3 text-xs text-muted-foreground/70">{c.fuente}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Límites ── */}
          <section className="rounded-2xl border border-border/40 p-8 space-y-4">
            <h2 className="font-display text-2xl font-light text-foreground">Límites (léelos)</h2>
            <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed text-justify">
              <li>· Estas notas son contexto bibliográfico y de composición, no indicación terapéutica ni rotulado MINSAL (Ley 20.606).</li>
              <li>· El IRR es un cociente interno con coeficientes conservadores publicados; no es un Análisis de Ciclo de Vida certificado ni un instrumento de trading de carbono.</li>
              <li>· Los valores de referencia (índice glucémico, HMF, enzimas) provienen de las fuentes citadas; no sustituyen análisis de laboratorio por lote.</li>
              <li>· Cuando exista medición en predio o laboratorio, se actualizará la metodología y se documentará el cambio.</li>
            </ul>
          </section>

          <p className="text-xs text-muted-foreground px-2 leading-relaxed text-justify">{DISCLAIMER_LEY_20606}</p>
          <p className="sr-only">Afirmaciones publicadas: {claims.map((c) => c.id).join(', ')}</p>
        </div>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-3xl font-light text-foreground tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-snug">{label}</p>
    </div>
  );
}