'use client';

import { useCallback, useEffect, useState } from 'react';
import { Star, ShieldCheck, PenLine } from 'lucide-react';
import { RESENA_COPY } from '@enjambre/resenas';
import { type ResenaPublic, fetchResenas } from '@/lib/shop/resenas-api';
import { ResenaComposer } from './resena-composer';

type Tab = 'destacadas' | 'comunidad' | 'escribir';

function ResenaCard({ resena }: { resena: ResenaPublic }) {
  const isGuardian = resena.modo === 'guardian';

  return (
    <article className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {resena.display_name ?? 'Guardián del bosque'}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                className={i < resena.rating ? 'fill-accent text-accent' : 'text-muted-foreground/30'}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isGuardian && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-accent">
              <ShieldCheck size={12} />
              Guardian
            </span>
          )}
          {resena.venta_id && (
            <span className="text-[10px] text-success/80">Compra verificada</span>
          )}
        </div>
      </div>

      {resena.comentario_corto && (
        <p className="text-sm text-foreground/80">&ldquo;{resena.comentario_corto}&rdquo;</p>
      )}

      {isGuardian && (
        <div className="grid grid-cols-3 gap-2 text-center">
          {resena.cristalizacion_percibida && (
            <div className="rounded-lg bg-accent/10 p-2">
              <p className="text-[9px] uppercase text-muted-foreground">Cuerpo</p>
              <p className="text-xs font-medium">{resena.cristalizacion_percibida}</p>
            </div>
          )}
          {resena.familia_aromatica && (
            <div className="rounded-lg bg-accent/10 p-2">
              <p className="text-[9px] uppercase text-muted-foreground">Aroma</p>
              <p className="text-xs font-medium">{resena.familia_aromatica}</p>
            </div>
          )}
          {resena.intensidad_fondo != null && (
            <div className="rounded-lg bg-accent/10 p-2">
              <p className="text-[9px] uppercase text-muted-foreground">Intensidad</p>
              <p className="text-xs font-medium">{resena.intensidad_fondo}/10</p>
            </div>
          )}
        </div>
      )}

      {resena.notas_personales && (
        <p className="text-xs text-muted-foreground italic border-t border-border pt-2">
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
}: {
  productoId: string;
  productName: string;
  initialAggregate?: { ratingValue: number; reviewCount: number } | null;
}) {
  const [tab, setTab] = useState<Tab>('comunidad');
  const [items, setItems] = useState<ResenaPublic[]>([]);
  const [aggregate, setAggregate] = useState(initialAggregate ?? null);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const modo = tab === 'destacadas' ? 'guardian' : 'all';
    const data = await fetchResenas(productoId, modo);
    setItems(data.items);
    setAggregate(data.aggregate);
    setLoading(false);
  }, [productoId, tab]);

  useEffect(() => {
    if (tab === 'escribir') return;
    void load();
  }, [load, tab]);

  return (
    <section className="mt-12 border-t border-border pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-lg text-foreground">Voces del bosque</h2>
          {aggregate && aggregate.reviewCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {aggregate.ratingValue} · {aggregate.reviewCount} reseñas
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-accent/40 px-4 py-2 text-sm text-accent hover:bg-accent/10"
        >
          <PenLine size={16} />
          Escribir reseña
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {(['comunidad', 'destacadas'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-wider transition ${
              tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'comunidad' ? 'Comunidad' : 'Guardianes'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground italic">Cargando reseñas...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Aún no hay reseñas publicadas. Sé el primero en dejar tu huella.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((r) => (
            <ResenaCard key={r.id} resena={r} />
          ))}
        </div>
      )}

      <ResenaComposer
        open={composerOpen}
        productoId={productoId}
        productName={productName}
        onClose={() => setComposerOpen(false)}
        onSubmitted={() => {
          setTab('comunidad');
          void load();
        }}
      />
    </section>
  );
}