import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FlaskConical, Clock, Leaf } from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { createAnonServerClient } from '@/utils/supabase/anon-server';
import { DISCLAIMER_LEY_20606 } from '@enjambre/ciencia';
import { DEFAULT_BOTANICAL_MONOGRAPHS } from '@enjambre/shop-chrome';
import { formatCalendarDate } from '@enjambre/ui';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export const revalidate = 3600;

interface EspecieRow {
  id: string;
  slug: string;
  nombre_comun: string;
  nombre_cientifico: string;
  familia: string | null;
  ventana_ini: number | null;
  ventana_fin: number | null;
  gdd_umbral: number | null;
}

interface AlertaRow {
  fecha_predicha: string;
  estado: string;
  gdd_calculado: number | null;
}

interface AnalisisRow {
  fecha: string;
  laboratorio: string;
  humedad_pct: number | null;
  hmf_mgkg: number | null;
  diastasa: number | null;
  conductividad_ms: number | null;
  lotes: { nombre: string; fecha_recoleccion: string | null } | null;
}

const MES_NOMBRES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function ventanaTexto(ini: number | null, fin: number | null): string {
  if (!ini || !fin) return 'Temporada variable';
  return `${MES_NOMBRES[ini]} – ${MES_NOMBRES[fin]}`;
}

function diasParaFecha(fechaStr: string): number {
  const hoy = new Date();
  const fecha = new Date(fechaStr);
  return Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAnonServerClient();
  const { data } = await supabase
    .from('especies_fenologicas')
    .select('nombre_comun, nombre_cientifico')
    .eq('slug', slug)
    .single();

  const mono = DEFAULT_BOTANICAL_MONOGRAPHS.find((m) => m.slug === slug);
  const nombreComun = data?.nombre_comun || mono?.common_name || slug;
  const nombreCientifico = data?.nombre_cientifico || mono?.scientific_name || '';

  return {
    title: `${nombreComun} · Biblioteca Botánica · La Obrera y el Zángano`,
    description: `Ficha botánica, ventana fenológica y análisis de laboratorio de ${nombreComun} (${nombreCientifico}) del bosque nativo de Chiloé.`,
    alternates: { canonical: `${SITE_URL}/ciencia/${slug}` },
    openGraph: {
      title: `${nombreComun} · Flora del Bosque Austral`,
      description: `${nombreCientifico} — conocimiento botánico y análisis de laboratorio de origen territorial.`,
      url: `${SITE_URL}/ciencia/${slug}`,
      type: 'article',
      locale: 'es_CL',
    },
  };
}

export async function generateStaticParams() {
  const supabase = createAnonServerClient();
  const { data } = await supabase
    .from('especies_fenologicas')
    .select('slug')
    .not('slug', 'is', null)
    .eq('activo', true);

  const slugsFromDb = (data ?? [])
    .filter((r): r is { slug: string } => typeof r.slug === 'string')
    .map((r) => r.slug);

  const allSlugs = Array.from(new Set([...slugsFromDb, ...DEFAULT_BOTANICAL_MONOGRAPHS.map((m) => m.slug)]));
  return allSlugs.map((slug) => ({ slug }));
}

export default async function FloracionPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createAnonServerClient();

  // ── 1. Especie ─────────────────────────────────────────────────────────────
  const { data: especieData } = await supabase
    .from('especies_fenologicas')
    .select('id, slug, nombre_comun, nombre_cientifico, familia, ventana_ini, ventana_fin, gdd_umbral')
    .eq('slug', slug)
    .eq('activo', true)
    .single<EspecieRow>();

  let especie = especieData;
  if (!especie) {
    const mono = DEFAULT_BOTANICAL_MONOGRAPHS.find((m) => m.slug === slug);
    if (!mono) notFound();
    especie = {
      id: mono.slug,
      slug: mono.slug,
      nombre_comun: mono.common_name,
      nombre_cientifico: mono.scientific_name,
      familia: null,
      ventana_ini: null,
      ventana_fin: null,
      gdd_umbral: null,
    };
  }

  // ── 2. Alerta fenológica activa ────────────────────────────────────────────
  const alerta = especie.id.length === 36
    ? (await supabase
        .from('alertas_floracion')
        .select('fecha_predicha, estado, gdd_calculado')
        .eq('especie_id', especie.id)
        .eq('estado', 'pendiente')
        .order('fecha_predicha', { ascending: true })
        .limit(1)
        .maybeSingle<AlertaRow>()).data
    : null;
  const diasAlerta = alerta ? diasParaFecha(alerta.fecha_predicha) : null;

  // ── 3. Análisis de laboratorio (via lotes.floracion_slug) ──────────────────
  const { data: analisis } = await supabase
    .from('analisis_laboratorio')
    .select('fecha, laboratorio, humedad_pct, hmf_mgkg, diastasa, conductividad_ms, lotes(nombre, fecha_recoleccion)')
    .eq('lotes.floracion_slug', slug)
    .order('fecha', { ascending: false })
    .limit(3)
    .returns<AnalisisRow[]>();

  // ── 4. Huellas de cata y percepción sensorial colectiva ─────────────────────
  // Reseñas que coinciden con esta floración (vía atributos_sensoriales->>floracion_slug o lote o slug)
  const { data: resenasRaw } = await supabase
    .from('resenas_producto')
    .select('id, rating, comentario_corto, notas_personales, display_name, created_at, atributos_sensoriales, productos(id, slug, nombre, lotes(floracion_slug))')
    .eq('estado', 'aprobada')
    .order('created_at', { ascending: false })
    .limit(30);

  const resenas = (resenasRaw ?? []).filter((r) => {
    const attr = r.atributos_sensoriales as Record<string, unknown> | null;
    const directSlug = attr?.floracion_slug;
    if (typeof directSlug === 'string' && directSlug.toLowerCase() === slug.toLowerCase()) return true;

    const prod = r.productos as { slug?: string; lotes?: { floracion_slug?: string } | null } | null;
    if (prod?.lotes?.floracion_slug && prod.lotes.floracion_slug.toLowerCase() === slug.toLowerCase()) return true;
    if (prod?.slug && prod.slug.toLowerCase().includes(slug.toLowerCase())) return true;
    return false;
  });

  const ratingPromedio = resenas.length > 0
    ? (resenas.reduce((acc, curr) => acc + (curr.rating || 0), 0) / resenas.length).toFixed(1)
    : null;

  const chipsFreqMap: Record<string, number> = {};
  for (const r of resenas) {
    const attr = r.atributos_sensoriales as { chips?: Array<{ chip: string }> } | null;
    if (Array.isArray(attr?.chips)) {
      for (const ch of attr.chips) {
        if (ch.chip) {
          chipsFreqMap[ch.chip] = (chipsFreqMap[ch.chip] || 0) + 1;
        }
      }
    }
  }
  const topChips = Object.entries(chipsFreqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([chip]) => chip);

  return (
    <StoreShell>
      <ShopHeader />

      <main className="mx-auto max-w-4xl px-4 py-12 space-y-16">
        {/* ── Breadcrumb ── */}
        <nav className="text-xs text-muted-foreground flex items-center gap-2">
          <Link href="/ciencia" className="hover:text-foreground transition-colors">
            Biblioteca de Floraciones
          </Link>
          <span>/</span>
          <span className="text-foreground">{especie.nombre_comun}</span>
        </nav>

        {/* ── Hero de especie ── */}
        <header className="space-y-4">
          <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text">
            Botánica Melífera · {ventanaTexto(especie.ventana_ini, especie.ventana_fin)}
          </span>
          <h1 className="font-display text-[clamp(2.2rem,7vw,4rem)] font-light text-foreground leading-tight">
            {especie.nombre_comun}
          </h1>
          <p className="text-sm italic text-accent-text font-serif">{especie.nombre_cientifico}</p>
          {especie.familia && (
            <p className="text-xs text-muted-foreground">Familia: {especie.familia}</p>
          )}
        </header>

        {/* ── Alerta fenológica ── */}
        {alerta && diasAlerta !== null && (
          <section className="rounded-2xl border border-accent/40 bg-accent/5 p-6 flex items-start gap-4">
            <Clock size={20} className="text-accent-text mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {diasAlerta > 0
                  ? `Floración predicha en ${diasAlerta} días`
                  : diasAlerta === 0
                  ? 'Floración predicha para hoy'
                  : `Floración predicha hace ${Math.abs(diasAlerta)} días`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Fecha estimada: {formatCalendarDate(alerta.fecha_predicha, { day: 'numeric', month: 'long', year: 'numeric' })}
                {alerta.gdd_calculado && ` · GDD acumulado: ${alerta.gdd_calculado}`}
              </p>
            </div>
          </section>
        )}

        {/* ── Análisis de laboratorio ── */}
        {(analisis ?? []).length > 0 && (
          <section className="space-y-4">
            <div>
              <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-1">
                Codex Alimentarius · Norma CXS 12-1981
              </span>
              <h2 className="font-display text-2xl font-light text-foreground flex items-center gap-2">
                <FlaskConical size={20} className="text-accent-text" />
                Análisis de laboratorio
              </h2>
            </div>
            <div className="grid gap-4">
              {(analisis ?? []).map((a, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border/60 bg-card p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {a.lotes?.nombre ?? 'Lote asociado'}
                      </p>
                      <p className="text-xs text-muted-foreground">{a.laboratorio}</p>
                    </div>
                    <span className="text-[0.65rem] font-mono text-muted-foreground">
                      {formatCalendarDate(a.fecha, { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {a.humedad_pct !== null && (
                      <div className="text-center">
                        <p className="text-lg font-mono text-foreground">{a.humedad_pct}%</p>
                        <p className="text-[0.6rem] text-muted-foreground uppercase tracking-wide">Humedad</p>
                      </div>
                    )}
                    {a.hmf_mgkg !== null && (
                      <div className="text-center">
                        <p className={`text-lg font-mono ${a.hmf_mgkg > 40 ? 'text-destructive' : 'text-foreground'}`}>
                          {a.hmf_mgkg}
                        </p>
                        <p className="text-[0.6rem] text-muted-foreground uppercase tracking-wide">HMF mg/kg</p>
                      </div>
                    )}
                    {a.diastasa !== null && (
                      <div className="text-center">
                        <p className="text-lg font-mono text-foreground">{a.diastasa}</p>
                        <p className="text-[0.6rem] text-muted-foreground uppercase tracking-wide">Diastasa</p>
                      </div>
                    )}
                    {a.conductividad_ms !== null && (
                      <div className="text-center">
                        <p className="text-lg font-mono text-foreground">{a.conductividad_ms}</p>
                        <p className="text-[0.6rem] text-muted-foreground uppercase tracking-wide">Conduct. mS/cm</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[0.65rem] text-muted-foreground/60 leading-relaxed">
              {DISCLAIMER_LEY_20606}
            </p>
          </section>
        )}

        {/* ── Huellas de cata colectivas ── */}
        <section className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-1">
                Percepción Sensorial Colectiva
              </span>
              <h2 className="font-display text-2xl font-light text-foreground flex items-center gap-2">
                <Leaf size={18} className="text-accent-text" />
                Huellas de cata y calibración organoléptica
              </h2>
            </div>
            {ratingPromedio && (
              <div className="text-right shrink-0">
                <p className="text-2xl font-mono text-foreground">{ratingPromedio}</p>
                <p className="text-[0.6rem] text-muted-foreground">{resenas.length} huellas registradas</p>
              </div>
            )}
          </div>

          {topChips.length > 0 && (
            <div className="p-4 rounded-2xl border border-border/50 bg-surface-raised/40 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Descriptores más frecuentes en mesa
              </span>
              <div className="flex flex-wrap gap-1.5">
                {topChips.map((chip) => (
                  <span
                    key={chip}
                    className="text-xs px-2.5 py-0.5 rounded-full bg-surface-sunken border border-border/60 text-foreground font-medium"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          )}

          {resenas.length === 0 ? (
            <div className="rounded-2xl border border-border/40 bg-surface-sunken p-8 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Aún no hay huellas de cata registradas para esta floración.
              </p>
              <p className="text-xs text-muted-foreground/60 max-w-md mx-auto">
                Las huellas se integran en tiempo real tras las sesiones de cata y calibración sensorial territorial en mesa.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {resenas.map((r) => (
                <article
                  key={r.id}
                  className="rounded-2xl border border-border/60 bg-card p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-xs font-mono text-accent-text">
                        <span>★</span>
                        <span>{r.rating}/7</span>
                      </div>
                      <p className="text-xs font-medium text-foreground">
                        {r.display_name || 'Comensal en mesa'}
                      </p>
                    </div>
                    <span className="text-[0.65rem] font-mono text-muted-foreground">
                      {formatCalendarDate(r.created_at, { month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {r.comentario_corto && (
                    <p className="text-sm text-foreground/90 leading-relaxed italic">
                      &ldquo;{r.comentario_corto}&rdquo;
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ── Volver a la Biblioteca ── */}
        <footer className="pt-4 border-t border-border/40">
          <Link
            href="/ciencia"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            ← Volver a la Biblioteca de Floraciones
          </Link>
        </footer>
      </main>

      <ShopFooter />
    </StoreShell>
  );
}
