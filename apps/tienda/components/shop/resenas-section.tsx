'use client';

import { useCallback, useEffect, useState } from 'react';
import { Star, ShieldCheck, PenLine, Coffee, Hotel, Tent, Store, Utensils } from 'lucide-react';
import { FORTIFICANTES_LABELS, type FortificanteCanonico } from '@enjambre/resenas';
import { type ResenaPublic, fetchResenas } from '@/lib/shop/resenas-api';
import { ResenaComposer, type VarianteOption } from './resena-composer';

type Tab = 'destacadas' | 'comunidad';

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
  const atr = resena.atributos_sensoriales as Record<string, unknown> | null;
  const tipo = resena.tipo_sensorial || atr?.tipo || 'miel';

  return (
    <article className="rounded-2xl border border-border bg-card/50 p-5 space-y-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground tracking-wide">{authorName}</p>
          {/* Valoración en escala 1 a 7 estrellas */}
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <Star
                key={i}
                size={13}
                className={i < resena.rating ? 'fill-accent text-accent-text' : 'text-muted-foreground/25'}
              />
            ))}
            <span className="text-[11px] text-muted-foreground ml-1.5 font-mono tabular-nums">
              {resena.rating} / 7
            </span>
          </div>
        </div>

        {/* Badges de Legitimidad y Variante */}
        <div className="flex flex-wrap items-center gap-1.5">
          {varianteNombre && (
            <span className="inline-flex items-center gap-1 text-[10px] text-accent font-medium px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20">
              <Star size={11} />
              {varianteNombre}
            </span>
          )}
          {isGuardian && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider bg-primary/10 border border-primary/25 text-primary font-semibold">
              <ShieldCheck size={12} />
              Legado
            </span>
          )}
          {resena.venta_id && (
            <span className="inline-flex items-center gap-1 text-[10px] text-success-text/90 font-medium px-2 py-0.5 rounded-full bg-success/10 border border-success/20">
              Compra verificada
            </span>
          )}
          {resena.percepcion?.punto && <AllianceBadge punto={resena.percepcion.punto} />}
        </div>
      </div>

      {resena.comentario_corto && (
        <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed italic">
          &ldquo;{resena.comentario_corto}&rdquo;
        </p>
      )}

      {/* Ficha sensorial detallada adaptativa para miembros Legado */}
      {isGuardian && (
        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          {tipo === 'miel_fortificada' && atr?.fortificante ? (
            <div className="rounded-xl bg-surface-sunken/60 border border-border/40 p-2">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Inclusión</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">
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
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Aroma</p>
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
        </div>
      )}

      {/* Chips Organolépticos Limpios (Sin fugas de datos crudos) */}
      {resena.percepcion?.chips && resena.percepcion.chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
          {resena.percepcion.chips.map((c) => (
            <span
              key={`${c.bloque}:${c.chip}`}
              className="rounded-full bg-surface-sunken border border-border/70 px-2.5 py-0.5 text-[11px] text-muted-foreground font-medium"
            >
              {c.chip}
            </span>
          ))}
        </div>
      )}

      {resena.notas_personales && (
        <p className="text-xs text-muted-foreground border-t border-border/40 pt-2 leading-relaxed">
          {resena.notas_personales}
        </p>
      )}
    </article>
  );
}

export function ResenasSection({
  productoId,
  productName,
  initialAggregate,
  tipoSensorial,
  variantes = [],
}: {
  productoId: string;
  productName: string;
  initialAggregate?: { ratingValue: number; reviewCount: number } | null;
  tipoSensorial?: string | null;
  variantes?: VarianteOption[];
}) {
  const [tab, setTab] = useState<Tab>('comunidad');
  const [selectedVarianteFilter, setSelectedVarianteFilter] = useState<string | null>(null);
  const [items, setItems] = useState<ResenaPublic[]>([]);
  const [aggregate, setAggregate] = useState(initialAggregate ?? null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [composerOpen, setComposerOpen] = useState(false);
  const limit = 10;

  // Escuchar evento personalizado disparado desde la Constelación
  useEffect(() => {
    const handler = () => setComposerOpen(true);
    window.addEventListener('enjambre:open-resena-composer', handler);
    return () => window.removeEventListener('enjambre:open-resena-composer', handler);
  }, []);

  const load = useCallback(
    async (pageNum: number, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const modo = tab === 'destacadas' ? 'guardian' : 'all';
      const data = await fetchResenas(
        productoId,
        modo,
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

  return (
    <section className="mt-12 border-t border-border pt-8 space-y-6" id="voces-del-bosque">
      {/* Cabecera de la Sección */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground">
            Voces del bosque
          </h2>
          {aggregate && aggregate.reviewCount > 0 ? (
            <div className="flex items-center gap-2.5 mt-1.5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={
                      i < Math.round(aggregate.ratingValue)
                        ? 'fill-accent text-accent-text'
                        : 'text-muted-foreground/30'
                    }
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground font-medium tabular-nums">
                {aggregate.ratingValue} / 7.0 · {aggregate.reviewCount} {aggregate.reviewCount === 1 ? 'testimonio' : 'testimonios'}
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Testimonios sensoriales de visitantes y miembros del Enjambre Legado.
            </p>
          )}
        </div>

        {/* Botón Principal: Crear Reseña Sensorial */}
        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 py-2 text-xs uppercase tracking-wider font-semibold text-primary hover:bg-primary/20 transition-all shadow-sm"
        >
          <PenLine size={15} />
          <span>Crear Reseña Sensorial</span>
        </button>
      </div>

      {/* Pestañas de Filtrado: Visitantes vs Legado + Filtro de Variante */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['comunidad', 'destacadas'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`inline-flex min-h-10 items-center rounded-full px-4 py-1.5 text-xs uppercase tracking-wider font-medium transition ${
                tab === t
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'bg-surface-sunken text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              {t === 'comunidad' ? 'Visitantes' : 'Legado'}
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

      {/* Listado de Reseñas / Estado Vacío */}
      {loading ? (
        <p className="text-sm text-muted-foreground italic py-6">Cargando testimonios del bosque...</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-surface-sunken/30 p-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            Esta expresión botánica aún no tiene testimonios registrados. Sé el primero en compartir tu experiencia sensorial.
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
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSubmitted={() => void load(1, false)}
        tipoSensorial={tipoSensorial ?? 'miel'}
        variantes={variantes}
        initialVarianteId={selectedVarianteFilter || undefined}
      />
    </section>
  );
}