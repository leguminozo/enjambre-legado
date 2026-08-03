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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';

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
    title: `Trazabilidad Cruda — ${product.name}`,
    description: `Verificación criptográfica y auditoría del origen del lote ${product.nombre_lote} para ${product.name}.`,
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

  if (!product || !product.blockchain_hash) {
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

  const badge = !isOnChain
    ? { tone: 'muted', icon: <Clock className="h-3.5 w-3.5" />, text: 'Firma local de integridad — sin ancla en cadena' }
    : verification === null
      ? { tone: 'neutral', icon: <Clock className="h-3.5 w-3.5" />, text: 'Ancla en cadena — verificación en vivo no disponible' }
      : verification.confirmed
        ? { tone: 'success', icon: <CheckCircle2 className="h-3.5 w-3.5" />, text: `Verificado en ${verification.chain ?? 'cadena'} · bloque ${verification.block_number ?? '—'}` }
        : { tone: 'warning', icon: <AlertTriangle className="h-3.5 w-3.5" />, text: 'Ancla no confirmada en cadena' };

  const badgeCls =
    badge.tone === 'success'
      ? 'border-success/30 bg-success/5 text-success'
      : badge.tone === 'warning'
        ? 'border-warning/40 bg-warning/10 text-warning'
        : badge.tone === 'neutral'
          ? 'border-accent/30 bg-accent/5 text-accent'
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
            Auditoría Criptográfica de Origen
          </h1>
          <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Cada frasco lleva la firma del lote que le dio origen: colmena, cosecha, análisis de
            laboratorio e impacto, sellados de forma verificable.
          </p>
        </div>

        {/* Main Grid */}
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 grid gap-8 md:grid-cols-[1.2fr_1fr]">
          {/* Columna Izquierda: Hash y Payload Firmado */}
          <div className="space-y-8">
            {/* Tarjeta de Hash */}
            <div className="rounded-2xl border border-accent/30 bg-card p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-accent">
                <Fingerprint className="h-28 w-28" />
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent">
                  <Fingerprint className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-medium text-foreground">
                    {isOnChain ? 'Hash anclado en cadena' : 'Hash de integridad'}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isOnChain
                      ? 'Transacción de anclaje en la blockchain — verificable públicamente'
                      : 'Firma SHA-256 local — pendiente de anclaje en cadena'}
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-secondary/80 rounded-xl p-4 border border-border">
                <code className="text-[0.82rem] font-mono break-all text-accent font-semibold tracking-wider">
                  {displayHash}
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
                    Ver transacción en el explorador
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
                      ? 'border-success/30 bg-success/5 text-success'
                      : 'border-destructive/40 bg-destructive/10 text-destructive'
                  }`}
                >
                  {hashMatches ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Integridad del payload: verificada (el hash coincide)
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3.5 w-3.5" />
                      El hash no coincide con el payload firmado
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Payload firmado */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-display text-sm font-medium text-foreground">
                  {payloadForDisplay ? 'Payload Firmado' : 'Datos del lote (aún sin firmar)'}
                </h3>
              </div>
              <pre className="p-4 bg-secondary/60 border border-border/50 rounded-xl overflow-x-auto text-[0.78rem] font-mono text-muted-foreground/90 leading-relaxed">
                {payloadForDisplay
                  ? JSON.stringify(payloadForDisplay, null, 2)
                  : JSON.stringify(
                      {
                        id_producto: product.id,
                        nombre_producto: product.name,
                        lote: product.nombre_lote ?? 'N/A',
                        colmena: product.colmena_origen ?? 'N/A',
                        cosecha: product.fecha_cosecha ?? 'N/A',
                        envasado: product.fecha_envasado ?? 'N/A',
                        co2_evitado_kg: product.co2_evitado_kg ?? null,
                        irr: product.irr_referencia ?? null,
                      },
                      null,
                      2,
                    )}
              </pre>
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
                <div className="mt-0.5 text-accent">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Lote de Producción</div>
                  <div className="text-sm font-medium text-foreground mt-0.5">{product.nombre_lote}</div>
                  {product.descripcion_lote && (
                    <div className="text-xs text-muted-foreground/70 italic mt-1 leading-normal border-l border-border pl-2">
                      {product.descripcion_lote}
                    </div>
                  )}
                </div>
              </div>

              {/* Colmena */}
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 text-accent">
                  <Compass className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Colmena del Bosque</div>
                  <div className="text-sm font-medium text-foreground mt-0.5">{product.colmena_origen ?? 'Apiario Nativo'}</div>
                </div>
              </div>

              {/* Fechas */}
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 text-accent">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Fechas de Producción</div>
                  <div className="text-sm font-medium text-foreground mt-0.5 flex flex-col gap-1">
                    {product.fecha_cosecha && (
                      <span>Cosecha: {new Date(product.fecha_cosecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    )}
                    {product.fecha_envasado && (
                      <span>Envasado: {new Date(product.fecha_envasado).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Apiario Ubicación */}
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 text-accent">
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
              <h4 className="text-[0.68rem] uppercase tracking-[0.2em] text-success font-bold">Métricas Bioculturales</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-background/50 border border-success/10 rounded-xl text-center">
                  <div className="text-2xl font-bold text-success tabular-nums">{product.co2_evitado_kg != null ? `${product.co2_evitado_kg}kg` : 'Sin datos'}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">CO2 Evitado</div>
                </div>
                <div className="p-4 bg-background/50 border border-success/10 rounded-xl text-center">
                  <div className="text-2xl font-bold text-success tabular-nums">{product.irr_referencia != null ? `IRR ${product.irr_referencia}` : 'Sin datos'}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Índice Regeneración</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href={`/producto/${product.slug}`}
            className="inline-flex min-h-11 items-center text-sm font-medium text-accent hover:underline"
          >
            ← Volver al producto
          </Link>
        </div>
      </main>
    </Shell>
  );
}
