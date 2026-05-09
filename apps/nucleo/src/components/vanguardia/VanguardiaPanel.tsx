import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Shield, Users, Star, Check, X, AlertCircle, Loader2 } from 'lucide-react';

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

export default function VanguardiaPanel() {
  const [revendedores, setRevendedores] = useState<Revendedor[]>([]);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchVanguardData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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
      if (revs) setRevendedores(revs as unknown as Revendedor[]);

      // 2. Fetch recent sensory reviews
      const { data: reviews, error: reviewError } = await supabase
        .from('resenas_sensoriales')
        .select('*, profiles(full_name), lotes(blockchain_hash)')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (reviewError) throw reviewError;
      if (reviews) setResenas(reviews as unknown as Resena[]);
    } catch (err) {
      console.error("Error fetching vanguard data:", err);
      showToast("Error al cargar datos de vanguardia", "error");
    } finally {
      setLoading(false);
    }
  };

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

      showToast(`Revendedor ${status === 'activo' ? 'activado' : 'suspendido'} con éxito`, "success");
      await fetchVanguardData();
    } catch (err) {
      console.error("Error updating status:", err);
      showToast("No se pudo actualizar el estado", "error");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-oro-miel-dark" size={32} />
        <p className="text-sm text-text-muted font-datos uppercase tracking-widest">Sincronizando con la Colmena...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in relative">
      {/* Local Toast */}
      {toast && (
        <div className={`fixed top-24 right-8 z-[100] px-6 py-3 rounded-lg shadow-xl border flex items-center gap-3 animate-in ${
          toast.type === 'success' ? 'bg-salud-optima/10 border-salud-optima text-salud-optima' : 'bg-salud-riesgo/10 border-salud-riesgo text-salud-riesgo'
        }`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-oro-miel-glow flex items-center justify-center text-oro-miel-dark">
          <Shield size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-display text-bosque-ulmo">Centro de Mando Vanguardia</h2>
          <p className="text-sm text-text-muted">Gestión de roles, economía de ciclos y huella sensorial</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gestión de Revendedores B2B */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-oro-miel-dark" />
              <h3 className="font-display text-lg">Solicitudes B2B (Revendedores)</h3>
            </div>
            <span className="badge badge-gold">{revendedores.filter(r => r.estado === 'pendiente').length} Pendientes</span>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {revendedores.length === 0 ? (
              <p className="text-sm text-text-muted italic py-4">No hay solicitudes registradas.</p>
            ) : (
              revendedores.map((rev) => (
                <div key={rev.user_id} className="p-4 rounded-lg bg-black/5 border border-white/5 flex items-center justify-between group hover:border-oro-miel/30 transition-colors">
                  <div>
                    <p className="font-bold text-sm text-bosque-ulmo">{rev.razon_social}</p>
                    <p className="text-xs text-text-muted">{rev.profiles?.full_name || 'Sin nombre'} · RUT: {rev.rut}</p>
                    <p className="text-[0.65rem] text-oro-miel-dark mt-1 font-medium">Volumen estimado: {rev.volumen_kg_mes} kg/mes</p>
                  </div>
                  <div className="flex gap-2">
                    {rev.estado === 'pendiente' ? (
                      <>
                        <button 
                          disabled={actionLoading === rev.user_id}
                          onClick={() => updateRevendedorStatus(rev.user_id, 'activo')}
                          className="w-9 h-9 rounded-full bg-salud-optima/10 text-salud-optima flex items-center justify-center hover:bg-salud-optima hover:text-white transition-all disabled:opacity-50"
                        >
                          {actionLoading === rev.user_id ? <Loader2 className="animate-spin" size={16} /> : <Check size={18} />}
                        </button>
                        <button 
                          disabled={actionLoading === rev.user_id}
                          onClick={() => updateRevendedorStatus(rev.user_id, 'suspendido')}
                          className="w-9 h-9 rounded-full bg-salud-riesgo/10 text-salud-riesgo flex items-center justify-center hover:bg-salud-riesgo hover:text-white transition-all disabled:opacity-50"
                        >
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${rev.estado === 'activo' ? 'bg-salud-optima/10 text-salud-optima' : 'bg-salud-riesgo/10 text-salud-riesgo'}`}>
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
            <Star size={18} className="text-oro-miel-dark" />
            <h3 className="font-display text-lg">Huella Sensorial Reciente</h3>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {resenas.length === 0 ? (
              <p className="text-sm text-text-muted italic py-4">Sin reseñas sensoriales aún.</p>
            ) : (
              resenas.map((res) => (
                <div key={res.id} className="p-5 rounded-lg bg-black/5 border border-white/5 hover:border-oro-miel/20 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm font-bold text-bosque-ulmo">{res.profiles?.full_name || 'Anónimo'}</p>
                      <p className="text-[0.6rem] text-oro-miel-dark mt-1">Lote: {res.lotes?.blockchain_hash?.slice(0, 12) || 'Sin Hash'}...</p>
                    </div>
                    <span className="text-[0.6rem] text-text-muted font-medium bg-white/50 px-2 py-1 rounded">
                      {new Date(res.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 rounded-lg bg-oro-miel-glow/20 border border-oro-miel/5">
                      <p className="text-[0.55rem] uppercase text-text-muted mb-1">Cuerpo</p>
                      <p className="text-[0.7rem] font-bold text-bosque-ulmo">{res.cristalizacion_percibida}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-oro-miel-glow/20 border border-oro-miel/5">
                      <p className="text-[0.55rem] uppercase text-text-muted mb-1">Aroma</p>
                      <p className="text-[0.7rem] font-bold text-bosque-ulmo">{res.familia_aromatica}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-oro-miel-glow/20 border border-oro-miel/5">
                      <p className="text-[0.55rem] uppercase text-text-muted mb-1">Intensidad</p>
                      <p className="text-[0.7rem] font-bold text-bosque-ulmo">{res.intensidad_fondo}/10</p>
                    </div>
                  </div>
                  
                  {res.notas_personales && (
                    <div className="mt-2 pt-3 border-t border-black/5">
                      <p className="text-xs text-text-secondary italic leading-relaxed">"{res.notas_personales}"</p>
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
