'use client';

import { useEffect, useState } from 'react';
import { Star, ShieldCheck } from 'lucide-react';
import { getAuthToken } from '@/lib/shop/resenas-api';

const NUCLEO_URL = process.env.NEXT_PUBLIC_NUCLEO_API_URL || 'http://localhost:3001';

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

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'En moderación',
  aprobada: 'Publicada',
  rechazada: 'Rechazada',
  oculta: 'Oculta',
};

export default function PerfilResenasPage() {
  const [items, setItems] = useState<MineResena[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const token = await getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await fetch(`${NUCLEO_URL}/api/resenas/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = (await res.json()) as { items?: MineResena[] };
        setItems(json.items ?? []);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-foreground">Mis reseñas</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Historial de huellas y opiniones que dejaste en la tienda.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground italic">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Aún no has escrito reseñas.</p>
      ) : (
        <div className="space-y-4">
          {items.map((r) => (
            <article key={r.id} className="rounded-xl border border-border bg-card/40 p-5">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="font-medium text-foreground">
                    {r.productos?.nombre ?? 'Producto'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={i < r.rating ? 'fill-accent text-accent' : 'text-muted-foreground/30'}
                        />
                      ))}
                    </div>
                    {r.modo === 'guardian' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-accent uppercase">
                        <ShieldCheck size={12} /> Guardian
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {ESTADO_LABEL[r.estado] ?? r.estado}
                </span>
              </div>
              {r.comentario_corto && (
                <p className="text-sm text-foreground/80 mt-3">&ldquo;{r.comentario_corto}&rdquo;</p>
              )}
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                {r.venta_id && <span>Compra verificada</span>}
                {r.ciclos_otorgados > 0 && (
                  <span className="text-success">+{r.ciclos_otorgados} ciclos</span>
                )}
                <span>{new Date(r.created_at).toLocaleDateString('es-CL')}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}