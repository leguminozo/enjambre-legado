'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Star,
  ShieldCheck,
  PenLine,
  Coffee,
  Hotel,
  Tent,
  Store,
  Utensils,
  UtensilsCrossed,
  Clock,
  Tag,
  Sliders,
  Sparkles,
  Compass,
  Check,
} from 'lucide-react';
import {
  FORTIFICANTES_LABELS,
  PARES_SEMANTICOS_POR_CATEGORIA,
  CATEGORIAS_SENSORIALES_LABELS,
  MOMENTO_RECOLECCION_LABELS,
  type FortificanteCanonico,
  type CategoriaSensorial,
  type MomentoRecoleccion,
} from '@enjambre/resenas';
import { type ResenaPublic, fetchResenas } from '@/lib/shop/resenas-api';
import { ResenaComposer, type VarianteOption } from './resena-composer';

type FilterTab = 'all' | 'guardian' | 'anonima';

export interface ResenasSectionProps {
  productoId: string;
  productName: string;
  productSlug?: string;
  initialAggregate?: { ratingValue: number; reviewCount: number } | null;
  tipoSensorial?: string | null;
  tipoSensorialLabel?: string | null;
  perfilSensorial?: {
    intensidad?: number;
    dulzor_acidez?: number;
    textura?: number;
    descriptores_intensidad?: { izq?: string; der?: string };
    descriptores_dulzor?: { izq?: string; der?: string };
    descriptores_textura?: { izq?: string; der?: string };
    notas_aromaticas?: string[];
    maridajes?: Array<{ titulo: string; detalle: string }>;
    momento_consumo?: string;
    ejes?: string[];
    ejes_calibracion?: Record<string, number> | null;
    pares_semanticos?: Array<{ par: string; izq: string; der: string }>;
    qr_modo?: 'experiencia' | 'trazabilidad' | 'comercial';
    qr_titulo?: string;
    qr_mensaje?: string;
    qr_cta_resena?: string;
  } | null;
  variantes?: VarianteOption[];
}

/**
 * Formatea el nombre del autor disociándolo a iniciales (conforme a Ley N° 19.628 de Protección de la Vida Privada).
 */
function formatAuthorName(raw: string | null | undefined, isGuardian: boolean): string {
  if (!raw || !raw.trim()) {
    return isGuardian ? 'Miembro del Legado' : 'Visitante';
  }
  const clean = raw.trim();

  // Si ya es un título de alianza contextual, mantenerlo
  if (
    clean.includes('·') ||
    clean.startsWith('Degustación') ||
    clean.startsWith('Huésped') ||
    clean.startsWith('Encuentro')
  ) {
    return clean;
  }

  // Separar palabras
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0].toUpperCase()}. ${parts[1][0].toUpperCase()}.`;
  }
  if (parts.length === 1 && parts[0].length > 3) {
    return `${parts[0][0].toUpperCase()}.`;
  }
  return clean;
}

function AllianceBadge({ punto }: { punto?: NonNullable<NonNullable<ResenaPublic['percepcion']>['punto']> }) {
  if (!punto || !punto.tipo) return null;

  const tipo = punto.tipo;
  const ciudad = punto.ciudad ? ` · ${punto.ciudad}` : '';

  let Icon = Store;
  let label = 'Punto de Cata';

  if (tipo === 'cafeteria') {
    Icon = Coffee;
    label = `Cafetería aliada${ciudad}`;
  } else if (tipo === 'hotel') {
    Icon = Hotel;
    label = `Hotel asociado${ciudad}`;
  } else if (tipo === 'feria_evento') {
    Icon = Tent;
    label = `Feria territorial${ciudad}`;
  } else if (tipo === 'restaurante') {
    Icon = Utensils;
    label = `Restaurante aliado${ciudad}`;
  } else if (tipo === 'tienda_gourmet') {
    Icon = Store;
    label = `Tienda gourmet${ciudad}`;
  }

  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-amber-500/90 font-medium bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
      <Icon size={11} />
      <span>{label}</span>
    </span>
  );
}

function ResenaCard({
  resena,
  varianteNombre,
}: {
  resena: ResenaPublic;
  varianteNombre?: string | null;
}) {
  const isGuardian = resena.modo === 'guardian';
  const authorName = formatAuthorName(resena.display_name, isGuardian);
  const atr = (resena.atributos_sensoriales as Record<string, unknown> | null) ?? null;
  const tipo = resena.tipo_sensorial || (atr?.tipo as string) || 'miel';

  const evaluatedPares = useMemo(() => {
    const raw = atr?.pares_semanticos as Record<string, number> | undefined;
    if (raw && typeof raw === 'object') {
      return Object.entries(raw).map(([par, valor]) => {
        const parts = par.split('/');
        return {
          par,
          izq: parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Suave',
          der: parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Intenso',
          valor: Number(valor) || 5,
        };
      });
    }
    if (resena.percepcion?.pares && resena.percepcion.pares.length > 0) {
      return resena.percepcion.pares.map((p) => {
        const parts = p.par.split('/');
        return {
          par: p.par,
          izq: parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Suave',
          der: parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Intenso',
          valor: p.valor,
        };
      });
    }
    return [];
  }, [atr?.pares_semanticos, resena.percepcion?.pares]);

  const selectedNotas = useMemo(() => {
    const set = new Set<string>();
    if (Array.isArray(atr?.notas_seleccionadas)) {
      for (const n of atr.notas_seleccionadas) {
        if (typeof n === 'string' && n.trim()) set.add(n.trim());
      }
    }
    if (resena.percepcion?.chips) {
      for (const c of resena.percepcion.chips) {
        if (c.chip && c.chip.trim()) set.add(c.chip.trim());
      }
    }
    return Array.from(set);
  }, [atr?.notas_seleccionadas, resena.percepcion?.chips]);

  const momentoConsumo =
    resena.momento_consumo ||
    (typeof atr?.momento_sugerido === 'string' ? atr.momento_sugerido : null);
  const maridajeSugerido =
    resena.maridaje ||
    (typeof atr?.maridaje_sugerido === 'string' ? atr.maridaje_sugerido : null);

  return (
    <article className="rounded-2xl border border-border bg-card/60 p-5 sm:p-6 space-y-4 hover:border-border/80 transition-colors">
      {/* Cabecera de la Tarjeta */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground tracking-wide">{authorName}</p>
            {isGuardian && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider bg-primary/15 border border-primary/30 text-primary font-semibold">
                <ShieldCheck size={12} />
                <span>Legado</span>
              </span>
            )}
          </div>

          {/* Valoración en escala 1 a 7 estrellas */}
          <div className="flex items-center gap-1 mt-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < resena.rating ? 'fill-accent text-accent-text' : 'text-muted-foreground/25'}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1.5 font-mono tabular-nums">
              {resena.rating} / 7
            </span>
          </div>
        </div>

        {/* Badges de Legitimidad, Variante y Microcanal */}
        <div className="flex flex-wrap items-center gap-1.5">
          {varianteNombre && (
            <span className="inline-flex items-center gap-1 text-[11px] text-accent font-medium px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/25">
              <Star size={11} className="fill-accent" />
              <span>{varianteNombre}</span>
            </span>
          )}
          {resena.venta_id && (
            <span className="inline-flex items-center gap-1 text-[10px] text-success-text/90 font-medium px-2 py-0.5 rounded-full bg-success/10 border border-success/20">
              <Check size={11} />
              Compra verificada
            </span>
          )}
          {resena.percepcion?.punto && <AllianceBadge punto={resena.percepcion.punto} />}
          {!isGuardian && !resena.percepcion?.punto && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-medium px-2 py-0.5 rounded-full bg-surface-sunken border border-border/60">
              Visitante
            </span>
          )}
        </div>
      </div>

      {/* Testimonio / Notas de Cata */}
      {isGuardian && resena.notas_personales ? (
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
            <Sparkles size={12} className="text-primary" />
            <span>Firma Sensorial del Catador</span>
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed italic bg-surface-sunken/40 rounded-xl p-3.5 border border-border/40">
            &ldquo;{resena.notas_personales}&rdquo;
          </p>
          {resena.comentario_corto && resena.comentario_corto !== resena.notas_personales && (
            <p className="text-xs text-muted-foreground italic px-1">
              &ldquo;{resena.comentario_corto}&rdquo;
            </p>
          )}
        </div>
      ) : resena.comentario_corto ? (
        <p className="text-sm text-foreground/85 leading-relaxed italic">
          &ldquo;{resena.comentario_corto}&rdquo;
        </p>
      ) : null}

      {/* ── Huella Sensorial Ramificada para Miembros Legado ───────────── */}
      {isGuardian && (
        <div className="space-y-3 pt-1 border-t border-border/40">
          {/* Ficha Organoléptica Adaptada según Familia */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {tipo === 'miel_fortificada' && atr?.fortificante ? (
              <div className="rounded-xl bg-surface-sunken/60 border border-border/40 p-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Inclusión</p>
                <p className="text-xs font-semibold text-foreground mt-0.5 truncate">
                  {FORTIFICANTES_LABELS[atr.fortificante as FortificanteCanonico] ?? String(atr.fortificante)}
                </p>
              </div>
            ) : resena.cristalizacion_percibida ? (
              <div className="rounded-xl bg-surface-sunken/60 border border-border/40 p-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Textura</p>
                <p className="text-xs font-semibold text-foreground mt-0.5">{resena.cristalizacion_percibida}</p>
              </div>
            ) : null}

            {resena.familia_aromatica ? (
              <div className="rounded-xl bg-surface-sunken/60 border border-border/40 p-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Aroma Principal</p>
                <p className="text-xs font-semibold text-foreground mt-0.5">{resena.familia_aromatica}</p>
              </div>
            ) : atr?.estilo ? (
              <div className="rounded-xl bg-surface-sunken/60 border border-border/40 p-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Estilo</p>
                <p className="text-xs font-semibold text-foreground mt-0.5">{String(atr.estilo)}</p>
              </div>
            ) : null}

            {resena.intensidad_fondo != null && (
              <div className="rounded-xl bg-surface-sunken/60 border border-border/40 p-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Intensidad</p>
                <p className="text-xs font-semibold text-primary mt-0.5">{resena.intensidad_fondo} / 10</p>
              </div>
            )}

            {Boolean(atr?.momento_recoleccion) && (
              <div className="rounded-xl bg-surface-sunken/60 border border-border/40 p-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Recolección</p>
                <p className="text-xs font-semibold text-foreground mt-0.5 truncate">
                  {MOMENTO_RECOLECCION_LABELS[atr?.momento_recoleccion as MomentoRecoleccion] ?? String(atr?.momento_recoleccion)}
                </p>
              </div>
            )}

            {tipo === 'miel_fortificada' && atr?.balance_inclusion != null && (
              <div className="rounded-xl bg-surface-sunken/60 border border-border/40 p-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Balance</p>
                <p className="text-xs font-semibold text-foreground mt-0.5">
                  {Number(atr.balance_inclusion) <= 4
                    ? 'Domina miel'
                    : Number(atr.balance_inclusion) >= 7
                      ? 'Domina inclusión'
                      : 'Equilibrio'}
                </p>
              </div>
            )}
          </div>

          {/* Contrastes Semánticos Calibrados por el Catador */}
          {evaluatedPares.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                <Sliders size={11} className="text-primary" />
                <span>Contrastes Organolépticos Calibrados</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {evaluatedPares.map((p) => {
                  const val = p.valor;
                  const pct = Math.min(100, Math.max(0, ((val - 1) / 9) * 100));
                  return (
                    <div
                      key={p.par}
                      className="rounded-lg bg-surface-sunken/40 border border-border/40 px-3 py-2 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={val <= 4 ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                          {p.izq}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground/80">{val}/10</span>
                        <span className={val >= 7 ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                          {p.der}
                        </span>
                      </div>
                      <div className="h-1.5 bg-border/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notas Aromáticas & Botánicas Identificadas */}
          {selectedNotas.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                <Tag size={11} className="text-primary" />
                <span>Notas Botánicas Reconocidas</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedNotas.map((nota) => (
                  <span
                    key={nota}
                    className="rounded-full bg-accent/10 border border-accent/25 px-2.5 py-0.5 text-[11px] text-accent-text font-medium"
                  >
                    {nota}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Momento de Consumo & Maridaje */}
          {(momentoConsumo || maridajeSugerido) && (
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
              {momentoConsumo && (
                <div className="inline-flex items-center gap-1.5 bg-surface-sunken px-2.5 py-1 rounded-lg border border-border/50">
                  <Clock size={12} className="text-primary" />
                  <span>Momento: <strong className="text-foreground font-medium">{momentoConsumo}</strong></span>
                </div>
              )}
              {maridajeSugerido && (
                <div className="inline-flex items-center gap-1.5 bg-surface-sunken px-2.5 py-1 rounded-lg border border-border/50">
                  <UtensilsCrossed size={12} className="text-primary" />
                  <span>Maridaje: <strong className="text-foreground font-medium">{maridajeSugerido}</strong></span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function ResenasSection({
  productoId,
  productName,
  productSlug,
  initialAggregate,
  tipoSensorial,
  tipoSensorialLabel,
  perfilSensorial,
  variantes = [],
}: ResenasSectionProps) {
  const [tab, setTab] = useState<FilterTab>('all');
  const [selectedVarianteFilter, setSelectedVarianteFilter] = useState<string | null>(null);
  const [items, setItems] = useState<ResenaPublic[]>([]);
  const [aggregate, setAggregate] = useState(initialAggregate ?? null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [composerOpen, setComposerOpen] = useState(false);
  const limit = 10;

  // Escuchar evento personalizado disparado desde la Constelación o Acompañante QR
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ varianteId?: string | null }>;
      if (custom.detail?.varianteId !== undefined) {
        setSelectedVarianteFilter(custom.detail.varianteId);
      }
      setComposerOpen(true);
    };
    window.addEventListener('enjambre:open-resena-composer', handler);
    return () => window.removeEventListener('enjambre:open-resena-composer', handler);
  }, []);

  const load = useCallback(
    async (pageNum: number, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const data = await fetchResenas(
        productoId,
        tab,
        pageNum,
        limit,
        selectedVarianteFilter || undefined,
      );
      setItems((prev) => (append ? [...prev, ...data.items] : data.items));
      setAggregate(data.aggregate);
      setTotal(data.total);
      setPage(pageNum);
      setLoading(false);
      setLoadingMore(false);
    },
    [productoId, tab, selectedVarianteFilter],
  );

  useEffect(() => {
    void load(1, false);
  }, [load, tab, selectedVarianteFilter]);

  // Síntesis Sensorial Comunitaria a partir de las reseñas cargadas
  const communityInsights = useMemo(() => {
    const guardianReviews = items.filter((i) => i.modo === 'guardian');
    if (guardianReviews.length === 0) return null;

    // Conteo de notas aromáticas
    const noteCounts: Record<string, number> = {};
    for (const r of guardianReviews) {
      const atr = r.atributos_sensoriales as Record<string, unknown> | null;
      if (Array.isArray(atr?.notas_seleccionadas)) {
        for (const n of atr.notas_seleccionadas) {
          if (typeof n === 'string' && n.trim()) {
            noteCounts[n.trim()] = (noteCounts[n.trim()] || 0) + 1;
          }
        }
      }
      if (r.percepcion?.chips) {
        for (const c of r.percepcion.chips) {
          if (c.chip && c.chip.trim()) {
            noteCounts[c.chip.trim()] = (noteCounts[c.chip.trim()] || 0) + 1;
          }
        }
      }
    }

    const topNotas = Object.entries(noteCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([nota, count]) => ({ nota, count }));

    // Promedio de pares semánticos evaluados
    const pairSums: Record<string, { sum: number; count: number; izq: string; der: string }> = {};
    for (const r of guardianReviews) {
      const atr = r.atributos_sensoriales as Record<string, unknown> | null;
      const paresObj = atr?.pares_semanticos as Record<string, number> | undefined;
      if (paresObj && typeof paresObj === 'object') {
        for (const [par, val] of Object.entries(paresObj)) {
          if (typeof val === 'number') {
            const parts = par.split('/');
            const izq = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Suave';
            const der = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Intenso';
            if (!pairSums[par]) {
              pairSums[par] = { sum: val, count: 1, izq, der };
            } else {
              pairSums[par].sum += val;
              pairSums[par].count += 1;
            }
          }
        }
      }
    }

    const topPares = Object.entries(pairSums).map(([par, data]) => ({
      par,
      izq: data.izq,
      der: data.der,
      promedio: Number((data.sum / data.count).toFixed(1)),
      totalCatas: data.count,
    }));

    return {
      totalGuardian: guardianReviews.length,
      topNotas,
      topPares,
    };
  }, [items]);

  const ctaButtonText =
    perfilSensorial?.qr_cta_resena ||
    'Crear Reseña Sensorial';

  return (
    <section className="mt-12 border-t border-border pt-8 space-y-6" id="voces-del-bosque">
      {/* Cabecera de la Sección Centrada */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
          Voces del bosque
        </h2>
        {aggregate && aggregate.reviewCount > 0 ? (
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-center gap-2.5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Star
                    key={i}
                    size={15}
                    className={
                      i < Math.round(aggregate.ratingValue)
                        ? 'fill-accent text-accent-text'
                        : 'text-muted-foreground/30'
                    }
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground font-medium tabular-nums">
                {aggregate.ratingValue} / 7.0 · {aggregate.reviewCount}{' '}
                {aggregate.reviewCount === 1 ? 'testimonio' : 'testimonios'}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground/80">
              Testimonios de cata profunda del Legado y opiniones de visitantes.
            </p>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-muted-foreground">
            Testimonios y catas sensoriales de visitantes y miembros del Enjambre Legado.
          </p>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-6 py-2.5 text-xs uppercase tracking-wider font-semibold text-primary hover:bg-primary/20 transition-all shadow-sm"
          >
            <PenLine size={15} />
            <span>{ctaButtonText}</span>
          </button>
        </div>
      </div>

      {/* ── Consenso Sensorial Comunitario (Síntesis Organoléptica) ──── */}
      {communityInsights && (communityInsights.topNotas.length > 0 || communityInsights.topPares.length > 0) && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/15 pb-3">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Sparkles size={16} />
              <span>Consenso Organoléptico de la Comunidad</span>
            </div>
            <span className="text-[11px] text-primary/80 font-medium">
              Basado en {communityInsights.totalGuardian} {communityInsights.totalGuardian === 1 ? 'huella de cata' : 'huellas de cata'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Contrastes Semánticos Promedio */}
            {communityInsights.topPares.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Sliders size={12} className="text-primary" />
                  <span>Balance de Contrastes en Boca</span>
                </p>
                <div className="space-y-2">
                  {communityInsights.topPares.map((p) => {
                    const pct = Math.min(100, Math.max(0, ((p.promedio - 1) / 9) * 100));
                    return (
                      <div key={p.par} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className={p.promedio <= 4.5 ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                            {p.izq}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {p.promedio} / 10
                          </span>
                          <span className={p.promedio >= 6.5 ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                            {p.der}
                          </span>
                        </div>
                        <div className="h-2 bg-border/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notas Botánicas Más Reconocidas */}
            {communityInsights.topNotas.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Tag size={12} className="text-primary" />
                  <span>Notas Botánicas Más Percibidas</span>
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {communityInsights.topNotas.map((n) => (
                    <span
                      key={n.nota}
                      className="inline-flex items-center gap-1.5 rounded-full bg-card border border-primary/30 px-3 py-1 text-xs text-foreground font-medium shadow-xs"
                    >
                      <span>{n.nota}</span>
                      <span className="rounded-full bg-primary/15 text-primary text-[10px] px-1.5 py-0.2 font-mono font-semibold">
                        {n.count}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Pestañas de Filtrado: Todos vs Legado vs Visitantes + Filtro de Variante ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-b border-border/40 pb-3">
        <div className="flex gap-2">
          {(
            [
              { id: 'all', label: 'Todos' },
              { id: 'guardian', label: 'Huella Legado' },
              { id: 'anonima', label: 'Visitantes' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs uppercase tracking-wider font-medium transition ${
                tab === t.id
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'bg-surface-sunken text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              {t.id === 'guardian' && <ShieldCheck size={13} />}
              {t.id === 'anonima' && <Compass size={13} />}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Filtro por Variante si existen opciones */}
        {variantes.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-muted-foreground">Edición:</span>
            <button
              type="button"
              onClick={() => setSelectedVarianteFilter(null)}
              className={`text-xs px-2.5 py-1 rounded-full transition ${
                selectedVarianteFilter === null
                  ? 'bg-primary/20 text-primary font-semibold border border-primary/40'
                  : 'bg-surface-sunken text-muted-foreground hover:text-foreground border border-border/40'
              }`}
            >
              Todas
            </button>
            {variantes.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVarianteFilter(v.id)}
                className={`text-xs px-2.5 py-1 rounded-full transition ${
                  selectedVarianteFilter === v.id
                    ? 'bg-primary/20 text-primary font-semibold border border-primary/40'
                    : 'bg-surface-sunken text-muted-foreground hover:text-foreground border border-border/40'
                }`}
              >
                {v.nombre_variante}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Listado de Reseñas / Estado Vacío ─────────────────────────── */}
      {loading ? (
        <p className="text-sm text-muted-foreground italic py-6 text-center">
          Cargando testimonios del bosque...
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-surface-sunken/30 p-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            {tab === 'guardian'
              ? 'Aún no hay huellas de cata sensorial del Legado registradas para este filtro. Sé el primero en dejar tu firma organoléptica.'
              : tab === 'anonima'
                ? 'No hay testimonios de visitantes en este momento.'
                : 'Esta expresión botánica aún no tiene testimonios registrados. Sé el primero en compartir tu experiencia sensorial.'}
          </p>
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            <PenLine size={14} />
            <span>Compartir Primera Reseña</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((r) => {
            const vNombre = variantes.find((v) => v.id === r.variante_id)?.nombre_variante ?? null;
            return <ResenaCard key={r.id} resena={r} varianteNombre={vNombre} />;
          })}
          {items.length < total && (
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => void load(page + 1, true)}
              className="w-full min-h-11 rounded-full border border-border py-2.5 text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:border-primary/50 hover:text-foreground disabled:opacity-50 transition-colors"
            >
              {loadingMore ? 'Cargando más testimonios…' : 'Cargar más testimonios'}
            </button>
          )}
        </div>
      )}

      {/* Modal Bifurcado de Reseña */}
      <ResenaComposer
        productoId={productoId}
        productName={productName}
        productSlug={productSlug}
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSubmitted={() => void load(1, false)}
        tipoSensorial={tipoSensorial ?? 'miel'}
        tipoSensorialLabel={tipoSensorialLabel}
        perfilSensorial={perfilSensorial}
        variantes={variantes}
        initialVarianteId={selectedVarianteFilter || undefined}
      />
    </section>
  );
}
