import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { friendlyError, toast } from '@enjambre/ui';
import { Star, Loader2, Check, X, EyeOff } from 'lucide-react';

type ResenaRow = {
  id: string;
  created_at: string;
  modo: string;
  estado: string;
  rating: number;
  comentario_corto: string | null;
  cristalizacion_percibida: string | null;
  familia_aromatica: string | null;
  intensidad_fondo: number | null;
  notas_personales: string | null;
  venta_id: string | null;
  display_name: string | null;
  ciclos_otorgados: number;
  profiles: { full_name: string } | null;
  productos: { nombre: string | null } | null;
};

type FilterEstado = 'pendiente' | 'aprobada' | 'all';

export function ResenasSensorialesTab() {
  const [resenas, setResenas] = useState<ResenaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterEstado>('pendiente');
  const [moderating, setModerating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('resenas_producto')
        .select(
          '*, profiles!resenas_producto_user_id_fkey(full_name), productos(nombre)',
        )
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter !== 'all') {
        query = query.eq('estado', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setResenas(Array.isArray(data) ? (data as ResenaRow[]) : []);
    } catch (err) {
      console.error('Error fetching reseñas:', err);
      toast(friendlyError(err, 'Error al cargar reseñas'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const moderar = async (id: string, estado: 'aprobada' | 'rechazada' | 'oculta') => {
    setModerating(id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Sin sesión');

      const res = await fetch(`/api/resenas/${id}/moderar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado }),
      });

      if (!res.ok) {
        const json = (await res.json()) as { message?: string };
        throw new Error(json.message ?? 'Error al moderar');
      }

      toast(
        estado === 'aprobada' ? 'Reseña aprobada' : estado === 'rechazada' ? 'Reseña rechazada' : 'Reseña oculta',
        { type: 'success' },
      );
      await load();
    } catch (err) {
      toast(friendlyError(err, 'No se pudo moderar'), { type: 'error' });
    } finally {
      setModerating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-accent" size={24} />
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Star size={18} className="text-accent" />
          <h3 className="font-display text-lg">Moderación de reseñas</h3>
        </div>
        <div className="flex gap-2">
          {(['pendiente', 'aprobada', 'all'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs uppercase tracking-wider ${
                filter === f ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
        {resenas.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4">Sin reseñas en esta cola.</p>
        ) : (
          resenas.map((res) => (
            <div key={res.id} className="p-5 rounded-lg bg-background/5 border border-foreground/5">
              <div className="flex justify-between items-start mb-3 gap-3">
                <div>
                  <p className="text-sm font-bold text-primary">
                    {res.display_name || res.profiles?.full_name || 'Anónimo'}
                  </p>
                  <p className="text-[0.6rem] text-accent mt-1">
                    {res.productos?.nombre ?? 'Producto'} · {res.modo} · {res.estado}
                  </p>
                  <p className="text-[0.6rem] text-muted-foreground mt-1">
                    {res.rating}/5
                    {res.venta_id ? ' · compra verificada' : ''}
                    {res.ciclos_otorgados > 0 ? ` · +${res.ciclos_otorgados} ciclos` : ''}
                  </p>
                </div>
                <span className="text-[0.6rem] text-muted-foreground shrink-0">
                  {new Date(res.created_at).toLocaleDateString('es-CL')}
                </span>
              </div>

              {res.comentario_corto && (
                <p className="text-xs text-muted-foreground mb-3">&ldquo;{res.comentario_corto}&rdquo;</p>
              )}

              {res.modo === 'guardian' && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center p-2 rounded-lg bg-accent/10">
                    <p className="text-[0.55rem] uppercase text-muted-foreground">Cuerpo</p>
                    <p className="text-[0.7rem] font-bold">{res.cristalizacion_percibida ?? '—'}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-accent/10">
                    <p className="text-[0.55rem] uppercase text-muted-foreground">Aroma</p>
                    <p className="text-[0.7rem] font-bold">{res.familia_aromatica ?? '—'}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-accent/10">
                    <p className="text-[0.55rem] uppercase text-muted-foreground">Intensidad</p>
                    <p className="text-[0.7rem] font-bold">
                      {res.intensidad_fondo != null ? `${res.intensidad_fondo}/10` : '—'}
                    </p>
                  </div>
                </div>
              )}

              {res.notas_personales && (
                <p className="text-xs text-muted-foreground italic border-t border-border pt-3 mb-3">
                  &ldquo;{res.notas_personales}&rdquo;
                </p>
              )}

              {res.estado === 'pendiente' && (
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    disabled={moderating === res.id}
                    onClick={() => void moderar(res.id, 'aprobada')}
                    className="inline-flex items-center gap-1 rounded-lg bg-success/20 px-3 py-1.5 text-xs text-success"
                  >
                    <Check size={14} /> Aprobar
                  </button>
                  <button
                    type="button"
                    disabled={moderating === res.id}
                    onClick={() => void moderar(res.id, 'rechazada')}
                    className="inline-flex items-center gap-1 rounded-lg bg-destructive/20 px-3 py-1.5 text-xs text-destructive"
                  >
                    <X size={14} /> Rechazar
                  </button>
                  <button
                    type="button"
                    disabled={moderating === res.id}
                    onClick={() => void moderar(res.id, 'oculta')}
                    className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground"
                  >
                    <EyeOff size={14} /> Ocultar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}