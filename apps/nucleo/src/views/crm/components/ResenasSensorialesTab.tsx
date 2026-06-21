import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { friendlyError, toast } from '@enjambre/ui';
import { Star, Loader2 } from 'lucide-react';

interface Resena {
  id: string;
  created_at: string;
  cristalizacion_percibida: string;
  familia_aromatica: string;
  intensidad_fondo: number;
  notas_personales: string;
  profiles: { full_name: string } | null;
  lotes: { blockchain_hash: string } | null;
}

export function ResenasSensorialesTab() {
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('resenas_sensoriales')
          .select('*, profiles!resenas_sensoriales_user_id_fkey(full_name), lotes(blockchain_hash)')
          .order('created_at', { ascending: false })
          .limit(30);

        if (error) throw error;
        setResenas(Array.isArray(data) ? (data as Resena[]) : []);
      } catch (err) {
        console.error('Error fetching reseñas:', err);
        toast(friendlyError(err, 'Error al cargar reseñas'), { type: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-accent" size={24} />
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <Star size={18} className="text-accent" />
        <h3 className="font-display text-lg">Huella Sensorial de la Comunidad</h3>
      </div>

      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
        {resenas.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4">Sin reseñas sensoriales aún.</p>
        ) : (
          resenas.map((res) => (
            <div key={res.id} className="p-5 rounded-lg bg-background/5 border border-foreground/5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm font-bold text-primary">{res.profiles?.full_name || 'Anónimo'}</p>
                  <p className="text-[0.6rem] text-accent mt-1">
                    Lote: {res.lotes?.blockchain_hash?.slice(0, 12) || 'Sin hash'}...
                  </p>
                </div>
                <span className="text-[0.6rem] text-muted-foreground">
                  {new Date(res.created_at).toLocaleDateString('es-CL')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center p-2 rounded-lg bg-accent/10">
                  <p className="text-[0.55rem] uppercase text-muted-foreground">Cuerpo</p>
                  <p className="text-[0.7rem] font-bold">{res.cristalizacion_percibida}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-accent/10">
                  <p className="text-[0.55rem] uppercase text-muted-foreground">Aroma</p>
                  <p className="text-[0.7rem] font-bold">{res.familia_aromatica}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-accent/10">
                  <p className="text-[0.55rem] uppercase text-muted-foreground">Intensidad</p>
                  <p className="text-[0.7rem] font-bold">{res.intensidad_fondo}/10</p>
                </div>
              </div>
              {res.notas_personales && (
                <p className="text-xs text-muted-foreground italic border-t border-border pt-3">
                  &ldquo;{res.notas_personales}&rdquo;
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}