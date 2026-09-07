import React from 'react';
import Link from 'next/link';
import { Star, ShieldCheck, MessageSquareQuote, ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';

type MineResena = {
  id: string;
  modo: string;
  estado: string;
  rating: number;
  comentario_corto: string | null;
  venta_id: string | null;
  ciclos_otorgados: number;
  created_at: string;
  productos: { nombre: string | null; slug: string | null } | null;
};

const ESTADO_LABEL: Record<string, { label: string; className: string }> = {
  pendiente: {
    label: 'En moderación',
    className: 'bg-accent/15 text-accent-text border border-accent/25',
  },
  aprobada: {
    label: 'Publicada',
    className: 'bg-success/15 text-success-text border border-success/25',
  },
  rechazada: {
    label: 'Rechazada',
    className: 'bg-destructive/10 text-destructive border border-destructive/20',
  },
  oculta: {
    label: 'Oculta',
    className: 'bg-secondary text-muted-foreground border border-border',
  },
};

export default async function PerfilResenasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let items: MineResena[] = [];
  let pendingProducts: Array<{ nombre: string; slug: string }> = [];

  if (user) {
    const [resenasResult, ventasResult] = await Promise.all([
      supabase
        .from('resenas_producto')
        .select(
          'id, modo, estado, rating, comentario_corto, venta_id, ciclos_otorgados, created_at, productos(nombre, slug)',
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('ventas')
        .select('productos')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    items = (resenasResult.data ?? []).map((row) => {
      const p = row.productos;
      const prod = Array.isArray(p) ? p[0] : p;
      return {
        id: row.id,
        modo: row.modo,
        estado: row.estado,
        rating: row.rating,
        comentario_corto: row.comentario_corto,
        venta_id: row.venta_id,
        ciclos_otorgados: Number(row.ciclos_otorgados) || 0,
        created_at: row.created_at,
        productos:
          prod && typeof prod === 'object'
            ? {
                nombre: (prod as { nombre?: string | null }).nombre ?? null,
                slug: (prod as { slug?: string | null }).slug ?? null,
              }
            : null,
      };
    });

    // Determine pending products from purchases
    if (ventasResult.data && ventasResult.data.length > 0) {
      const reviewedSlugs = new Set(
        items.map((r) => r.productos?.slug).filter(Boolean) as string[],
      );
      const seenSlugs = new Set<string>();

      for (const v of ventasResult.data) {
        const prods = Array.isArray(v.productos)
          ? (v.productos as Array<Record<string, unknown>>)
          : [];
        for (const p of prods) {
          const slug = typeof p.slug === 'string' ? p.slug : null;
          const nombre = typeof p.nombre === 'string' ? p.nombre : typeof p.name === 'string' ? p.name : 'Miel Nativa';
          if (slug && !reviewedSlugs.has(slug) && !seenSlugs.has(slug)) {
            seenSlugs.add(slug);
            pendingProducts.push({ nombre, slug });
          }
        }
      }
    }
  }

  return (
    <div className="space-y-12 animate-in">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent-text">
            <MessageSquareQuote size={20} />
          </div>
          <h1 className="font-display text-4xl font-light text-foreground">Mis Reseñas</h1>
        </div>
        <p className="text-muted-foreground text-sm tracking-wide">
          Historial de impresiones y huellas de cata que custodian la calidad del enjambre.
        </p>
      </div>

      {/* Sección de productos pendientes de reseña si existen */}
      {pendingProducts.length > 0 && (
        <div className="p-6 md:p-8 rounded-3xl bg-secondary/40 border border-border/80 space-y-4">
          <div className="flex items-center gap-2 text-accent-text">
            <Sparkles size={18} />
            <h3 className="font-display text-lg text-foreground">
              Cosechas pendientes de tu testimonio
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Has recibido estos productos en tus compras recientes. Tu valoración de cata ayuda a otros guardianes y suma ciclos a tu nivel:
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {pendingProducts.map((prod) => (
              <div
                key={prod.slug}
                className="p-4 rounded-2xl bg-card border border-border flex flex-col justify-between gap-3"
              >
                <div>
                  <span className="text-xs font-semibold text-foreground line-clamp-1">
                    {prod.nombre}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    Compra confirmada
                  </span>
                </div>
                <Link
                  href={`/producto/${prod.slug}#resenas`}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/15 hover:bg-accent/25 text-accent-text text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  <span>Dejar Reseña</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listado de reseñas o Empty State operativo */}
      {items.length === 0 ? (
        <div className="rounded-3xl border border-border bg-secondary/30 p-12 text-center max-w-2xl mx-auto space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text mx-auto">
            <Star size={26} className="fill-accent/20" />
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-2xl text-foreground">
              Sin testimonios registrados
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              Aún no has compartido impresiones de cata. Cada reseña honesta custodia el estándar biocultural y otorga ciclos de fidelización a tu legado de Guardián.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground text-[0.7rem] uppercase tracking-[0.3em] font-bold rounded-xl hover:shadow-glow transition-all"
            >
              <span>Explorar Catálogo</span>
              <ArrowRight size={14} />
            </Link>

            <Link
              href="/perfil/pedidos"
              className="inline-flex items-center gap-2 px-6 py-4 bg-secondary/70 hover:bg-secondary border border-border text-[0.7rem] uppercase tracking-[0.2em] font-medium text-foreground rounded-xl transition-all"
            >
              <ShoppingBag size={14} />
              <span>Ver Mis Pedidos</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((r) => {
            const statusConfig = ESTADO_LABEL[r.estado] ?? {
              label: r.estado,
              className: 'bg-secondary text-muted-foreground border border-border',
            };

            return (
              <article
                key={r.id}
                className="rounded-2xl border border-border bg-card/60 p-6 space-y-4 transition-colors hover:border-accent/30"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
                  <div>
                    {r.productos?.slug ? (
                      <Link
                        href={`/producto/${r.productos.slug}`}
                        className="font-display text-lg text-foreground hover:text-accent transition-colors"
                      >
                        {r.productos.nombre ?? 'Miel Nativa'}
                      </Link>
                    ) : (
                      <span className="font-display text-lg text-foreground">
                        {r.productos?.nombre ?? 'Producto'}
                      </span>
                    )}

                    <div className="flex items-center gap-2.5 mt-1.5">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={
                              i < r.rating
                                ? 'fill-accent text-accent-text'
                                : 'text-muted-foreground/25'
                            }
                          />
                        ))}
                      </div>
                      {r.modo === 'guardian' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-text uppercase tracking-wider bg-accent/10 px-2 py-0.5 rounded-full">
                          <ShieldCheck size={11} /> Guardian
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${statusConfig.className}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {r.comentario_corto && (
                  <p className="text-sm text-foreground/90 leading-relaxed italic bg-secondary/30 p-4 rounded-xl border border-border/40">
                    &ldquo;{r.comentario_corto}&rdquo;
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground pt-1">
                  <div className="flex items-center gap-3">
                    {r.venta_id && (
                      <span className="inline-flex items-center gap-1 text-accent-text font-medium">
                        <ShieldCheck size={13} /> Compra verificada
                      </span>
                    )}
                    {r.ciclos_otorgados > 0 && (
                      <span className="text-success-text font-semibold">
                        +{r.ciclos_otorgados} ciclos otorgados
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono">
                    {new Date(r.created_at).toLocaleDateString('es-CL', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}