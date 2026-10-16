import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Flower2, FlaskConical, Star, Clock, Leaf } from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { createAnonServerClient } from '@/utils/supabase/anon-server';
import { DISCLAIMER_LEY_20606 } from '@enjambre/ciencia';
import { computeFloracionAggregate, PERFIL_CATA_MIN_SESIONES } from '@enjambre/resenas';
import type { PerfilFloracionAgregado } from '@enjambre/resenas';
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

interface ResenaRow {
  id: string;
  rating: number;
  modo: string;
  notas_personales: string | null;
  comentario_corto: string | null;
  familia_aromatica: string | null;
  cristalizacion_percibida: string | null;
  intensidad_fondo: number | null;
  pairing_botanico: string | null;
  momento_recoleccion: string | null;
  cosecha_fresca: boolean | null;
  display_name: string | null;
  temporada: string | null;
  created_at: string;
}

interface AlertaRow {
  fecha_predicha: string;
  estado: string;
  gdd_calculado: number | null;
}

interface PercSesionRow {
  perc_chips: Array<{ bloque: string; chip: string }>;
  perc_pares: Array<{ par: string; valor: number }>;
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

function ratingEstrellas(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(7 - rating);
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ temporada?: string }>;
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
    title: `${nombreComun} · Biblioteca de Floraciones · La Obrera y el Zángano`,
    description: `Perfil sensorial colectivo, huellas de cata y análisis de laboratorio de la miel de ${nombreComun} (${nombreCientifico}) del bosque nativo de Chiloé.`,
    alternates: { canonical: `${SITE_URL}/ciencia/${slug}` },
    openGraph: {
      title: `Miel de ${nombreComun} · Floraciones del Bosque Austral`,
      description: `${nombreCientifico} — catas, perfil sensorial y trazabilidad de origen territorial.`,
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

export default async function FloracionPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const temporadaFiltro = resolvedSearchParams?.temporada ?? null;
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

  // ── 3. Reseñas de floración aprobadas ─────────────────────────────────────
  let resenasQuery = supabase
    .from('resenas_producto')
    .select(
      'id, rating, modo, notas_personales, comentario_corto, familia_aromatica, ' +
      'cristalizacion_percibida, intensidad_fondo, pairing_botanico, momento_recoleccion, ' +
      'cosecha_fresca, display_name, temporada, created_at',
    )
    .eq('floracion_slug', slug)
    .eq('estado', 'aprobada')
    .order('created_at', { ascending: false })
    .limit(20);

  if (temporadaFiltro) {
    resenasQuery = resenasQuery.eq('temporada', temporadaFiltro);
  }

  const { data: resenas } = await resenasQuery.returns<ResenaRow[]>();

  // ── 4. Sesiones CATA de floración ─────────────────────────────────────────
  let sesionesQuery = supabase
    .from('perc_sesiones')
    .select('perc_chips(bloque, chip), perc_pares(par, valor)')
    .eq('floracion_slug', slug)
    .eq('completo', true);

  if (temporadaFiltro) {
    sesionesQuery = sesionesQuery.eq('temporada', temporadaFiltro);
  }

  const { data: sesiones } = await sesionesQuery.returns<PercSesionRow[]>();

  // ── 5. Análisis de laboratorio (via lotes.floracion_slug) ──────────────────
  const { data: analisis } = await supabase
    .from('analisis_laboratorio')
    .select('fecha, laboratorio, humedad_pct, hmf_mgkg, diastasa, conductividad_ms, lotes(nombre, fecha_recoleccion)')
    .eq('lotes.floracion_slug', slug)
    .order('fecha', { ascending: false })
    .limit(3)
    .returns<AnalisisRow[]>();

  // ── 6. Temporadas disponibles ──────────────────────────────────────────────
  const { data: temporadasData } = await supabase
    .from('resenas_producto')
    .select('temporada')
    .eq('floracion_slug', slug)
    .eq('estado', 'aprobada')
    .not('temporada', 'is', null);

  const temporadas = [...new Set(
    (temporadasData ?? [])
      .map((r: { temporada: string | null }) => r.temporada)
      .filter((t): t is string => t !== null),
  )].sort().reverse();

  // ── 7. Perfil sensorial colectivo ─────────────────────────────────────────
  const perfil: PerfilFloracionAgregado = computeFloracionAggregate({
    floracion_slug: slug,
    temporada: temporadaFiltro,
    sesiones: sesiones ?? [],
    ratings: (resenas ?? []).map((r) => ({ rating: r.rating })),
  });

  const diasAlerta = alerta ? diasParaFecha(alerta.fecha_predicha) : null;

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
            Eje 03 · Botánica Melífera · {ventanaTexto(especie.ventana_ini, especie.ventana_fin)}
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

        {/* ── Filtro por temporada ── */}
        {temporadas.length > 0 && (
          <section className="space-y-2">
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-bold">
              Temporadas con datos
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/ciencia/${slug}`}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  !temporadaFiltro
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border/60 text-muted-foreground hover:border-accent/40 hover:text-foreground'
                }`}
              >
                Todas
              </Link>
              {temporadas.map((t) => (
                <Link
                  key={t}
                  href={`/ciencia/${slug}?temporada=${t}`}
                  className={`text-xs px-3 py-1.5 rounded-full border font-mono transition-colors ${
                    temporadaFiltro === t
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border/60 text-muted-foreground hover:border-accent/40 hover:text-foreground'
                  }`}
                >
                  {t}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Perfil sensorial colectivo ── */}
        <section className="space-y-6">
          <div>
            <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-1">
              Perfil colectivo · CATA
            </span>
            <h2 className="font-display text-2xl font-light text-foreground">
              Percepción sensorial
            </h2>
          </div>

          {perfil.publicable ? (
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Chips por bloque */}
              {(['aroma', 'sabor', 'textura', 'color'] as const).map((bloque) => {
                const chipsBloque = perfil.chips
                  .filter((c) => c.bloque === bloque)
                  .slice(0, 6);
                if (chipsBloque.length === 0) return null;
                return (
                  <div key={bloque} className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
                    <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-bold capitalize flex items-center gap-1.5">
                      <Flower2 size={11} className="text-accent-text" />
                      {bloque}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {chipsBloque.map((c) => (
                        <span
                          key={c.chip}
                          className="text-xs px-2.5 py-1 rounded-full bg-surface-sunken border border-border/50 text-foreground/80 flex items-center gap-1"
                        >
                          {c.chip}
                          <span className="text-[0.6rem] text-muted-foreground font-mono">
                            {Math.round(c.frecuencia * 100)}%
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-border/40 bg-surface-sunken p-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Perfil en construcción — se necesitan al menos {PERFIL_CATA_MIN_SESIONES} catas para publicarlo.
              </p>
              <p className="text-xs text-muted-foreground/70">
                {perfil.n_sesiones} de {PERFIL_CATA_MIN_SESIONES} registradas
                {temporadaFiltro ? ` en temporada ${temporadaFiltro}` : ''}.
              </p>
            </div>
          )}
        </section>

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

        {/* ── Huellas de cata ── */}
        <section className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-1">
                Experiencias directas
              </span>
              <h2 className="font-display text-2xl font-light text-foreground flex items-center gap-2">
                <Leaf size={18} className="text-accent-text" />
                Huellas de cata
              </h2>
            </div>
            {perfil.rating_promedio !== null && (
              <div className="text-right shrink-0">
                <p className="text-2xl font-mono text-foreground">{perfil.rating_promedio}</p>
                <p className="text-[0.6rem] text-muted-foreground">{perfil.review_count} huellas</p>
              </div>
            )}
          </div>

          {(resenas ?? []).length === 0 ? (
            <div className="rounded-2xl border border-border/40 bg-surface-sunken p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Aún no hay huellas de cata registradas para esta floración
                {temporadaFiltro ? ` en temporada ${temporadaFiltro}` : ''}.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-2">
                Las huellas aparecen tras moderación.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(resenas ?? []).map((r) => (
                <article
                  key={r.id}
                  className="rounded-2xl border border-border/60 bg-card p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-mono text-accent-text">
                        {ratingEstrellas(r.rating)}
                      </p>
                      {r.familia_aromatica && (
                        <span className="inline-block text-[0.6rem] px-2 py-0.5 rounded-full bg-surface-sunken border border-border/50 text-muted-foreground">
                          {r.familia_aromatica}
                        </span>
                      )}
                    </div>
                    <div className="text-right text-[0.6rem] text-muted-foreground space-y-0.5">
                      {r.temporada && <p className="font-mono">{r.temporada}</p>}
                      <p>{new Date(r.created_at).toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>

                  {r.notas_personales && (
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {r.notas_personales}
                    </p>
                  )}

                  {r.comentario_corto && (
                    <p className="text-xs text-muted-foreground italic">
                      &ldquo;{r.comentario_corto}&rdquo;
                    </p>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.6rem] text-muted-foreground pt-1 border-t border-border/30">
                    {r.cristalizacion_percibida && (
                      <span>Textura: {r.cristalizacion_percibida}</span>
                    )}
                    {r.intensidad_fondo !== null && (
                      <span>Intensidad: {r.intensidad_fondo}/10</span>
                    )}
                    {r.momento_recoleccion && (
                      <span>
                        {r.momento_recoleccion === 'primera_extraccion' && 'Primera extracción'}
                        {r.momento_recoleccion === 'segunda_extraccion' && 'Segunda extracción'}
                        {r.momento_recoleccion === 'tardio' && 'Recolección tardía'}
                      </span>
                    )}
                    {r.cosecha_fresca !== null && (
                      <span>{r.cosecha_fresca ? 'Miel fresca' : 'Miel madurada'}</span>
                    )}
                    {r.pairing_botanico && (
                      <span>Maridaje: {r.pairing_botanico}</span>
                    )}
                  </div>
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
