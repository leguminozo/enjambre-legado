import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { friendlyError, toast, ViewLoading, Button, SkeletonTable } from '@enjambre/ui';
import { Users, Check, X, Loader2, FileText, Copy } from 'lucide-react';
import { generateWholesaleAgreementMarkdown } from '@enjambre/pricing';

interface Revendedor {
  user_id: string;
  razon_social: string;
  rut: string;
  volumen_kg_mes: number;
  estado: 'pendiente' | 'activo' | 'suspendido';
  profiles: { full_name: string; email: string } | null;
}

export function AliadosB2BTab() {
  const [revendedores, setRevendedores] = useState<Revendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('revendedor_profile')
        .select('*, profiles!revendedor_profile_user_id_fkey(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setRevendedores(Array.isArray(data) ? (data as Revendedor[]) : []);
    } catch (err) {
      console.error('Error fetching aliados B2B:', err);
      toast(friendlyError(err, 'Error al cargar aliados B2B'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStatus = async (userId: string, status: 'activo' | 'suspendido') => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('revendedor_profile')
        .update({ estado: status })
        .eq('user_id', userId);

      if (error) throw error;

      if (status === 'activo') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: 'revendedor', is_active: true });
        if (roleError) throw roleError;
      }

      toast(`Aliado ${status === 'activo' ? 'activado' : 'suspendido'}`, { type: 'success' });
      await fetchData();
    } catch (err) {
      console.error('Error updating aliado:', err);
      toast(friendlyError(err, 'No se pudo actualizar'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const copyAgreementForAlly = async (rev: Revendedor) => {
    try {
      const text = generateWholesaleAgreementMarkdown({
        razonSocial: rev.razon_social,
        rut: rev.rut,
        contactoNombre: rev.profiles?.full_name,
      });
      await navigator.clipboard.writeText(text);
      toast(`Ficha de Condiciones Comerciales copiada para ${rev.razon_social}`, { type: 'success' });
    } catch {
      toast('No se pudo copiar el documento', { type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="card space-y-4">
        <SkeletonTable rows={4} columns={5} />
      </div>
    );
  }

  const pendientes = revendedores.filter((r) => r.estado === 'pendiente').length;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-accent" />
          <h3 className="font-display text-lg">Aliados B2B (Mayoristas)</h3>
        </div>
        <span className="badge badge-gold">{pendientes} pendientes</span>
      </div>

      <p className="text-xs text-muted-foreground">
        Aprobación de revendedores mayoristas. Al activar, el aliado accede a precio mayorista en tienda.
        Requiere validación de RUT e inicio de actividades según política comercial.
      </p>

      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
        {revendedores.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4">No hay solicitudes registradas.</p>
        ) : (
          revendedores.map((rev) => (
            <div
              key={rev.user_id}
              className="p-4 rounded-lg bg-background/5 border border-foreground/5 flex items-center justify-between gap-3"
            >
              <div>
                <p className="font-bold text-sm text-primary">{rev.razon_social}</p>
                <p className="text-xs text-muted-foreground">
                  {rev.profiles?.full_name || 'Sin nombre'} · RUT: {rev.rut}
                </p>
                <p className="text-[0.65rem] text-accent mt-1">
                  Volumen estimado: {rev.volumen_kg_mes} kg/mes
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  title="Copiar Ficha de Condiciones Comerciales"
                  onClick={() => copyAgreementForAlly(rev)}
                  className="min-w-9 min-h-9 p-0 text-muted-foreground hover:text-foreground"
                >
                  <FileText size={16} />
                </Button>

                {rev.estado === 'pendiente' ? (
                  <>
                    <button
                      type="button"
                      disabled={actionLoading === rev.user_id}
                      onClick={() => updateStatus(rev.user_id, 'activo')}
                      aria-label="Aprobar aliado"
                      className="min-h-11 min-w-11 h-11 w-11 rounded-full bg-success/10 text-success inline-flex items-center justify-center hover:bg-success hover:text-foreground disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === rev.user_id ? <Loader2 className="animate-spin" size={16} /> : <Check size={18} />}
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading === rev.user_id}
                      onClick={() => updateStatus(rev.user_id, 'suspendido')}
                      aria-label="Suspender aliado"
                      className="min-h-11 min-w-11 h-11 w-11 rounded-full bg-destructive/10 text-destructive inline-flex items-center justify-center hover:bg-destructive hover:text-foreground disabled:opacity-50 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </>
                ) : (
                  <span
                    className={`text-[0.6rem] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                      rev.estado === 'activo' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {rev.estado}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}