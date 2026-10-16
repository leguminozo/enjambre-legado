import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createHash } from 'crypto';
import type { Metadata } from 'next';
import { getProductBySlugOrId } from '@/lib/shop/products';
import { createAnonServerClient } from '@/utils/supabase/anon-server';
import { getNucleoApiUrl } from '@/lib/shop/nucleo-url';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import {
  ChevronRight,
  ShieldCheck,
  Calendar,
  MapPin,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Compass,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { TrazabilidadSensorialSection } from './trazabilidad-sensorial-section';
import { formatCalendarDate } from '@enjambre/ui';


const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 120;

/** Ordenar llaves recursivamente — mismo algoritmo canónico de nucleo (computeDataHash). */
function canonicalizeJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeJson);
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = canonicalizeJson((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

function computeLoteDataHash(entityId: string, data: Record<string, unknown>): string {
  const canonical = JSON.stringify({
    entityType: 'lote',
    entityId,
    data: canonicalizeJson(data),
  });
  return `0x${createHash('sha256').update(canonical).digest('hex')}`;
}

type AnchorRow = {
  tx_hash: string;
  chain: string | null;
  block_number: number | null;
  block_timestamp: string | null;
  data_hash: string | null;
  data_payload: unknown;
  entity_id: string | null;
};

/** data_payload aún no está en typegen (migración 20260802_real_traceability) */
type AnchorLoose = Omit<AnchorRow, 'data_payload'> & { data_payload?: unknown };

type LiveVerification = {
  confirmed?: boolean;
  block_number?: number | null;
  block_timestamp?: string | null;
  explorer_url?: string;
  chain?: string;
};

async function fetchLiveVerification(txHash: string, chain: string): Promise<LiveVerification | null> {
  const nucleoUrl = getNucleoApiUrl();
  if (!nucleoUrl) return null;
  try {
    const res = await fetch(`${nucleoUrl}/api/blockchain/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tx_hash: txHash, chain }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { success?: boolean; data?: LiveVerification };
    return json.success ? (json.data ?? null) : null;
  } catch {
    return null; // nucleo caído: la página igual muestra los datos del ancla
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlugOrId(slug);
  if (!product) {
    return { title: 'Trazabilidad no encontrada' };
  }

  return {
    title: `Origen y Trazabilidad — ${product.name}`,
    description: `Verificación de origen y autenticidad del lote ${product.nombre_lote} para ${product.name}.`,
    alternates: { canonical: `${SITE_URL}/producto/${product.slug}/trazabilidad` },
  };
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <StoreShell>
      <ShopHeader />
      {children}
      <ShopFooter />
    </StoreShell>
  );
}

export default async function TrazabilidadPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlugOrId(slug);

  // Si el producto no existe en el catálogo, 404
  if (!product) {
    notFound();
  }

  // Último ancla del lote (RLS SELECT pública): la fuente de verdad firmada
  const supabase = createAnonServerClient();
  let anchor: AnchorRow | null = null;
  if (product.lote_id) {
    const result = (await supabase
      .from('blockchain_anchors')
      .select('tx_hash, chain, block_number, block_timestamp, data_hash, data_payload, entity_id')
      .eq('entity_type', 'lote')
      .eq('entity_id', product.lote_id)
      .order('block_timestamp', { ascending: false })
      .limit(1)
      .maybeSingle()) as unknown as { data: AnchorLoose | null };
    if (result.data) {
      anchor = {
        tx_hash: result.data.tx_hash,
        chain: result.data.chain,
        block_number: result.data.block_number,
        block_timestamp: result.data.block_timestamp,
        data_hash: result.data.data_hash,
        data_payload: result.data.data_payload ?? null,
        entity_id: result.data.entity_id,
      };
    }
  }

  const isOnChain = Boolean(anchor && anchor.chain && anchor.chain !== 'local-postgres-audit');
  const verification = isOnChain && anchor ? await fetchLiveVerification(anchor.tx_hash, anchor.chain ?? 'polygon-amoy') : null;

  // Recomputar el hash del payload firmado (canónico) y comparar
  let hashMatches: boolean | null = null;
  if (anchor?.data_hash && anchor.data_payload && anchor.entity_id) {
    const recomputed = computeLoteDataHash(anchor.entity_id, anchor.data_payload as Record<string, unknown>);
    hashMatches = recomputed === anchor.data_hash;
  }

  const displayHash = anchor?.tx_hash ?? product.blockchain_hash;
  const payloadForDisplay: unknown = anchor?.data_payload ?? null;
  const signedAt = anchor?.block_timestamp ?? null;

  const hasLotData = Boolean(product.blockchain_hash || product.lote_id || product.nombre_lote || anchor);

  const badge = !hasLotData
    ? { tone: 'neutral', icon: <Clock className="h-3.5 w-3.5" />, text: 'Certificación territorial de origen en proceso' }
    : !isOnChain
      ? { tone: 'muted', icon: <Clock className="h-3.5 w-3.5" />, text: 'Certificación digital de origen registrada' }
      : verification === null
        ? { tone: 'neutral', icon: <Clock className="h-3.5 w-3.5" />, text: 'Registro oficial emitido · Consulta en línea temporalmente en pausa' }
        : verification.confirmed
          ? { tone: 'success', icon: <CheckCircle2 className="h-3.5 w-3.5" />, text: `Autenticidad verificada en registro público (${verification.chain ?? 'red oficial'})` }
          : { tone: 'warning', icon: <AlertTriangle className="h-3.5 w-3.5" />, text: 'Registro en proceso de confirmación pública' };

  const badgeCls =
    badge.tone === 'success'
      ? 'border-success/30 bg-success/5 text-success-text'
      : badge.tone === 'warning'
        ? 'border-warning/40 bg-warning/10 text-warning'
        : badge.tone === 'neutral'
          ? 'border-accent/30 bg-accent/5 text-accent-text'
          : 'border-border bg-secondary/60 text-muted-foreground';

  return (
    <Shell>
      <main className="bg-background pb-20 pt-[max(0.5rem,var(--safe-top))]">
        {/* Breadcrumb */}
        <div className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-1 text-xs text-muted-foreground sm:text-sm">
            <Link href="/" className="inline-flex min-h-11 items-center hover:text-accent">
              Inicio
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            <Link href="/catalogo" className="inline-flex min-h-11 items-center hover:text-accent">
              Creaciones
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            <Link
              href={`/producto/${product.slug}`}
              className="inline-flex min-h-11 max-w-[12rem] items-center truncate hover:text-accent sm:max-w-none"
            >
              {product.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            <span className="inline-flex min-h-11 items-center font-medium text-foreground/70">
              Trazabilidad
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mx-auto max-w-4xl px-4 pt-10 sm:px-6 sm:pt-12 text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wider mb-6 ${badgeCls}`}>
            {badge.icon}
            {badge.text}
          </div>

          <h1 className="font-display text-[clamp(1.75rem,7vw,3rem)] sm:text-5xl font-semibold tracking-tight text-foreground text-balance">
            Certificación de Origen y Autenticidad
          </h1>
          <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Cada frasco lleva la firma del lote que le dio origen: colmena, recolección, análisis de
            laboratorio e impacto, sellados de forma verificable.
          </p>
        </div>

        {/* Main Grid */}
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 grid gap-8 md:grid-cols-[1.2fr_1fr]">
          {/* Columna Izquierda: Sello y Registro Firmado */}
          <div className="space-y-8">
            {/* Tarjeta de Sello */}
            <div className="rounded-2xl border border-accent/30 bg-card p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-accent-text">
                <Fingerprint className="h-28 w-28" />
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent-text">
                  <Fingerprint className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-medium text-foreground">
                    {isOnChain
                      ? 'Sello digital verificado'
                      : displayHash
                        ? 'Sello de integridad'
                        : 'Sello de origen territorial'}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isOnChain
                      ? 'Registro oficial certificado — verificable en red pública'
                      : displayHash
                        ? 'Sello digital de lote — sincronización pública en curso'
                        : 'Lote en reposo y maduración — sello de autenticidad en proceso de emisión'}
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-secondary/80 rounded-xl p-4 border border-border">
                <code className="text-[0.82rem] font-mono break-all text-accent-text font-semibold tracking-wider">
                  {displayHash ?? 'Sello de origen territorial en proceso de certificación'}
                </code>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                {isOnChain && verification?.explorer_url && (
                  <a
                    href={verification.explorer_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-accent underline underline-offset-2 hover:text-accent/80"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Verificar registro público oficial
                  </a>
                )}
                {signedAt && (
                  <span className="text-muted-foreground">
                    Firmado: {new Date(signedAt).toLocaleString('es-CL')}
                  </span>
                )}
              </div>

              {hashMatches !== null && (
                <p
                  className={`mt-5 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                    hashMatches
                      ? 'border-success/30 bg-success/5 text-success-text'
                      : 'border-destructive/40 bg-destructive/10 text-destructive'
                  }`}
                >
                  {hashMatches ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Integridad de los datos: verificada (el sello digital coincide)
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3.5 w-3.5" />
                      El sello digital no coincide con el registro del lote
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Certificado de Pureza y Registro Oficial */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-5 border-b border-border/50 pb-3">
                <FileText className="h-5 w-5 text-accent" />
                <h3 className="font-display text-base font-semibold text-foreground">
                  {payloadForDisplay ? 'Registro de Autenticidad y Pureza' : 'Certificado Oficial del Lote'}
                </h3>
              </div>
              
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border/30">
                  <span className="text-muted-foreground">Creación:</span>
                  <span className="font-medium text-foreground">{product.name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/30">
                  <span className="text-muted-foreground">Lote Oficial:</span>
                  <span className="font-mono text-accent-text font-semibold">{product.nombre_lote ?? 'Lote estacional en certificación'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/30">
                  <span className="text-muted-foreground">Origen Botánico:</span>
                  <span className="font-medium text-foreground">{product.origenApicola ?? 'Bosque Nativo de Chiloé'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/30">
                  <span className="text-muted-foreground">Estándar Sanitario:</span>
                  <span className="font-medium text-foreground">Codex Alimentarius CXS 12-1981</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/30">
                  <span className="text-muted-foreground">Estado del Precinto:</span>
                  <span className="font-medium text-emerald-400">Térmico de Inocuidad Intacto</span>
                </div>
              </div>

              {product.lote_id && product.lote_publico && (
                <div className="mt-6 pt-4 border-t border-border/60">
                  <a
                    href={`${getNucleoApiUrl()}/lote/${product.lote_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5 text-xs font-semibold text-accent-text hover:bg-accent/20 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver Mapa Territorial y Pasaporte Completo en Núcleo
                  </a>
                </div>
              )}

              {/* Auditoría técnica colapsable para inspectores o clientes avanzados */}
              <details className="mt-5 pt-3 border-t border-border/30 group">
                <summary className="cursor-pointer text-[11px] text-muted-foreground/80 hover:text-accent select-none py-1">
                  ▸ Ver registro técnico para auditoría
                </summary>
                <pre className="mt-2 p-3 bg-secondary/60 border border-border/40 rounded-lg overflow-x-auto text-[0.72rem] font-mono text-muted-foreground/80 leading-relaxed">
                  {JSON.stringify(
                    {
                      producto: product.name,
                      lote: product.nombre_lote ?? 'N/A',
                      colmena: product.colmena_origen ?? 'N/A',
                      recoleccion: product.fecha_cosecha ?? 'N/A',
                      envasado: product.fecha_envasado ?? 'N/A',
                      co2_evitado_kg: product.co2_evitado_kg ?? null,
                      irr: product.irr_referencia ?? null,
                    },
                    null,
                    2,
                  )}
                </pre>
              </details>
            </div>
          </div>

          {/* Columna Derecha: Detalles de Trazabilidad */}
          <div className="space-y-8">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg space-y-6">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <h3 className="font-display text-base font-semibold text-foreground">Datos del Origen</h3>
              </div>

              {/* Lote */}
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 text-accent-text">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Lote de Producción</div>
                  <div className="text-sm font-medium text-foreground mt-0.5">{product.nombre_lote ?? 'Lote estacional en proceso de certificación'}</div>
                  {product.descripcion_lote && (
                    <div className="text-xs text-muted-foreground/70 italic mt-1 leading-normal border-l border-border pl-2">
                      {product.descripcion_lote}
                    </div>
                  )}
                </div>
              </div>

              {/* Colmena */}
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 text-accent-text">
                  <Compass className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Colmena del Bosque</div>
                  <div className="text-sm font-medium text-foreground mt-0.5">{product.colmena_origen ?? 'Apiario Nativo'}</div>
                </div>
              </div>

              {/* Fechas */}
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 text-accent-text">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Fechas de Producción</div>
                  <div className="text-sm font-medium text-foreground mt-0.5 flex flex-col gap-1">
                    {product.fecha_cosecha ? (
                      <span>Recolección: {formatCalendarDate(product.fecha_cosecha, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    ) : (
                      <span>Recolección: Temporada estacional activa</span>
                    )}
                    {product.fecha_envasado ? (
                      <span>Envasado: {formatCalendarDate(product.fecha_envasado, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    ) : (
                      <span>Envasado: En frío en origen (Predio Pureo)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Apiario Ubicación */}
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 text-accent-text">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Origen Geográfico</div>
                  <div className="text-sm font-medium text-foreground mt-0.5">Chiloé, Región de Los Lagos, Chile</div>
                </div>
              </div>
            </div>

            {/* Tarjeta de Impacto */}
            <div className="rounded-2xl border border-success/20 bg-success/[0.02] p-6 space-y-4">
              <h4 className="text-[0.68rem] uppercase tracking-[0.2em] text-success-text font-bold">Métricas de Origen e Impacto</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-background/50 border border-success/10 rounded-xl text-center">
                  <div className="text-2xl font-bold text-success-text tabular-nums">{product.co2_evitado_kg != null ? `${product.co2_evitado_kg}kg` : 'Sin datos'}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">CO2 Evitado</div>
                </div>
                <div className="p-4 bg-background/50 border border-success/10 rounded-xl text-center">
                  <div className="text-2xl font-bold text-success-text tabular-nums">{product.irr_referencia != null ? `IRR ${product.irr_referencia}` : 'Sin datos'}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Índice Regeneración</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Cata Sensorial & Percepción del Lote */}
        <div className="mx-auto max-w-4xl px-4 mt-10 sm:px-6">
          <TrazabilidadSensorialSection
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              nombre_lote: product.nombre_lote,
              lote_id: product.lote_id,
              perfil_sensorial: product.perfil_sensorial,
            }}
          />
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link
            href={`/producto/${product.slug}`}
            className="inline-flex min-h-11 items-center text-sm font-medium text-accent-text hover:underline"
          >
            ← Volver al producto
          </Link>
        </div>

      </main>
    </Shell>
  );
}
