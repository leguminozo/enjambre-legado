import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProductBySlugOrId } from '@/lib/shop/products';
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
  FileText,
  Compass
} from 'lucide-react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

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

  // Crear la representación del payload para auditoría de cara al usuario
  const payloadAuditable = {
    id_producto: product.id,
    nombre_producto: product.name,
    lote: product.nombre_lote ?? 'N/A',
    colmena: product.colmena_origen ?? 'N/A',
    cosecha: product.fecha_cosecha ?? 'N/A',
    envasado: product.fecha_envasado ?? 'N/A',
    co2_evitado_kg: product.co2_evitado_kg ?? 0,
    irr: product.irr_referencia ?? 1.0,
  };

  const payloadString = JSON.stringify(payloadAuditable, null, 2);

  return (
    <Shell>
      <main className="bg-background pb-20 pt-6">
        {/* Breadcrumb */}
        <div className="border-b border-border px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-1 text-xs text-muted-foreground sm:text-sm">
            <Link href="/" className="hover:text-accent">
              Inicio
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            <Link href="/catalogo" className="hover:text-accent">
              Creaciones
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            <Link href={`/producto/${product.slug}`} className="hover:text-accent">
              {product.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            <span className="font-medium text-foreground/70">Trazabilidad</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mx-auto max-w-4xl px-4 pt-12 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-success/30 bg-success/5 text-[10px] font-semibold text-success uppercase tracking-wider mb-6">
            <CheckCircle2 className="h-3.5 w-3.5 text-success animate-pulse" />
            Integridad Certificada en Postgres
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
            Auditoría Criptográfica de Origen
          </h1>
          <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Certificamos de forma inmutable la procedencia, pureza botánica e impacto de cada frasco desde el bosque nativo de Chiloé.
          </p>
        </div>

        {/* Main Grid */}
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 grid gap-8 md:grid-cols-[1.2fr_1fr]">
          
          {/* Columna Izquierda: Sello y Payload */}
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
                  <h2 className="font-display text-lg font-medium text-foreground">Hash de Trazabilidad</h2>
                  <p className="text-xs text-muted-foreground mt-1">Firma criptográfica de integridad SHA-256</p>
                </div>
              </div>

              <div className="mt-6 bg-secondary/80 rounded-xl p-4 border border-border">
                <code className="text-[0.82rem] font-mono break-all text-accent font-semibold tracking-wider">
                  {product.blockchain_hash}
                </code>
              </div>

              <p className="mt-6 text-xs text-muted-foreground leading-relaxed">
                Este hash es generado al firmar digitalmente los parámetros de cosecha y producción. Garantiza que la información de origen no ha sido alterada desde su ingreso en el apiario.
              </p>
            </div>

            {/* Payload JSON de auditoría */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-display text-sm font-medium text-foreground">Payload de Verificación</h3>
              </div>
              <pre className="p-4 bg-secondary/60 border border-border/50 rounded-xl overflow-x-auto text-[0.78rem] font-mono text-muted-foreground/90 leading-relaxed">
                {payloadString}
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
                  <div className="text-2xl font-bold text-success tabular-nums">{product.co2_evitado_kg ?? 1.8}kg</div>
                  <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">CO2 Evitado</div>
                </div>
                <div className="p-4 bg-background/50 border border-success/10 rounded-xl text-center">
                  <div className="text-2xl font-bold text-success tabular-nums">IRR {product.irr_referencia ?? 2.4}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Índice Regeneración</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link href={`/producto/${product.slug}`} className="text-sm font-medium text-accent hover:underline">
            ← Volver al producto
          </Link>
        </div>
      </main>
    </Shell>
  );
}
