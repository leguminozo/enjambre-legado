import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { friendlyError, friendlySupabaseError, toast } from '@enjambre/ui';
import { Shield, Users, Star, Check, X, Loader2 } from 'lucide-react';

interface Revendedor {
  user_id: string;
  razon_social: string;
  rut: string;
  volumen_kg_mes: number;
  estado: 'pendiente' | 'activo' | 'suspendido';
  profiles: {
    full_name: string;
    email: string;
  } | null;
}

interface Resena {
  id: string;
  created_at: string;
  cristalizacion_percibida: string;
  familia_aromatica: string;
  intensidad_fondo: number;
  notas_personales: string;
  profiles: {
    full_name: string;
  } | null;
  lotes: {
    blockchain_hash: string;
  } | null;
}

export function VanguardiaPanel() {
  const [revendedores, setRevendedores] = useState<Revendedor[]>([]);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVanguardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch pending revendedores (Limit to 50 for performance)
      const { data: revs, error: revError } = await supabase
        .from('revendedor_profile')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (revError) throw revError;
      if (revs) setRevendedores(Array.isArray(revs) ? (revs as Revendedor[]) : []);

      // 2. Fetch recent sensory reviews
      const { data: reviews, error: reviewError } = await supabase
        .from('resenas_sensoriales')
        .select('*, profiles(full_name), lotes(blockchain_hash)')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (reviewError) throw reviewError;
      if (reviews) setResenas(Array.isArray(reviews) ? (reviews as Resena[]) : []);
	} catch (err) {
			console.error("Error fetching vanguard data:", err);
			toast(friendlyError(err, "Error al cargar datos de vanguardia"), { type: "error" });
		} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVanguardData();
  }, []);

  const updateRevendedorStatus = async (userId: string, status: 'activo' | 'suspendido') => {
    setActionLoading(userId);
    try {
      const { error: updateError } = await supabase
        .from('revendedor_profile')
        .update({ estado: status })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Ensure the role is in user_roles if activating
      if (status === 'activo') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: 'revendedor', is_active: true });
        
        if (roleError) throw roleError;
      }

      toast(`Revendedor ${status === 'activo' ? 'activado' : 'suspendido'} con éxito`, { type: "success" });
      await fetchVanguardData();
	} catch (err) {
			console.error("Error updating status:", err);
			toast(friendlyError(err, "No se pudo actualizar el estado"), { type: "error" });
		} finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-accent" size={32} />
        <p className="text-sm text-muted-foreground font-datos uppercase tracking-widest">Sincronizando con la Colmena...</p>
      </div>
    );
  }

  return (
  <div className="space-y-8 animate-in relative">
    <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
          <Shield size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-display text-primary">Centro de Mando Vanguardia</h2>
          <p className="text-sm text-muted-foreground">Gestión de roles, economía de ciclos y huella sensorial</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gestión de Revendedores B2B */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-accent" />
              <h3 className="font-display text-lg">Solicitudes B2B (Revendedores)</h3>
            </div>
            <span className="badge badge-gold">{revendedores.filter(r => r.estado === 'pendiente').length} Pendientes</span>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {revendedores.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4">No hay solicitudes registradas.</p>
            ) : (
              revendedores.map((rev) => (
                <div key={rev.user_id} className="p-4 rounded-lg bg-background/5 border border-foreground/5 flex items-center justify-between group hover:border-accent/30 transition-colors">
                  <div>
                    <p className="font-bold text-sm text-primary">{rev.razon_social}</p>
                    <p className="text-xs text-muted-foreground">{rev.profiles?.full_name || 'Sin nombre'} · RUT: {rev.rut}</p>
                    <p className="text-[0.65rem] text-accent mt-1 font-medium">Volumen estimado: {rev.volumen_kg_mes} kg/mes</p>
                  </div>
                  <div className="flex gap-2">
                    {rev.estado === 'pendiente' ? (
                      <>
                        <button 
                          disabled={actionLoading === rev.user_id}
                          onClick={() => updateRevendedorStatus(rev.user_id, 'activo')}
                          className="w-9 h-9 rounded-full bg-success/10 text-success flex items-center justify-center hover:bg-success hover:text-foreground transition-all disabled:opacity-50"
                        >
                          {actionLoading === rev.user_id ? <Loader2 className="animate-spin" size={16} /> : <Check size={18} />}
                        </button>
                        <button 
                          disabled={actionLoading === rev.user_id}
                          onClick={() => updateRevendedorStatus(rev.user_id, 'suspendido')}
                          className="w-9 h-9 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-foreground transition-all disabled:opacity-50"
                        >
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${rev.estado === 'activo' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                        {rev.estado}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Huella Sensorial de la Comunidad */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Star size={18} className="text-accent" />
            <h3 className="font-display text-lg">Huella Sensorial Reciente</h3>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {resenas.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4">Sin reseñas sensoriales aún.</p>
            ) : (
              resenas.map((res) => (
                <div key={res.id} className="p-5 rounded-lg bg-background/5 border border-foreground/5 hover:border-accent/20 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm font-bold text-primary">{res.profiles?.full_name || 'Anónimo'}</p>
                      <p className="text-[0.6rem] text-accent mt-1">Lote: {res.lotes?.blockchain_hash?.slice(0, 12) || 'Sin Hash'}...</p>
                    </div>
                    <span className="text-[0.6rem] text-muted-foreground font-medium bg-surface-raised px-2 py-1 rounded">
                      {new Date(res.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 rounded-lg bg-accent/10 border border-accent/5">
                      <p className="text-[0.55rem] uppercase text-muted-foreground mb-1">Cuerpo</p>
                      <p className="text-[0.7rem] font-bold text-primary">{res.cristalizacion_percibida}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-accent/10 border border-accent/5">
                      <p className="text-[0.55rem] uppercase text-muted-foreground mb-1">Aroma</p>
                      <p className="text-[0.7rem] font-bold text-primary">{res.familia_aromatica}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-accent/10 border border-accent/5">
                      <p className="text-[0.55rem] uppercase text-muted-foreground mb-1">Intensidad</p>
                      <p className="text-[0.7rem] font-bold text-primary">{res.intensidad_fondo}/10</p>
                    </div>
                  </div>
                  
                  {res.notas_personales && (
                    <div className="mt-2 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground italic leading-relaxed">"{res.notas_personales}"</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
