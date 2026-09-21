'use client';

import { useState } from 'react';
import { ViewShell } from '@/components/layout/ViewShell';
import { Shield, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { ImmersiveModal, toast, friendlyError } from '@enjambre/ui';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ArcoSolicitud {
  id: string;
  user_id: string;
  tipo: string;
  estado: 'pendiente' | 'en_revision' | 'ejecutada' | 'rechazada' | 'cancelada';
  motivo: string | null;
  fecha_limite: string;
  revisado_por: string | null;
  notas_admin: string | null;
  datos_exportados: boolean;
  ejecutada_at: string | null;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    avatar_url: string | null;
  };
}

interface Stats {
  pendientes: number;
  en_revision: number;
  ejecutadas: number;
  atrasadas: number;
  total: number;
}

export function ArcoAdminView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const apiFetch = useApiFetch();

  const { data: solicitudes, refetch: reloadSolicitudes } = useQuery<ArcoSolicitud[]>({
    queryKey: ['arco-solicitudes'],
    queryFn: async () => {
      const res = await apiFetch('/api/arco/admin/solicitudes');
      if (!res.ok) throw new Error('Error al consultar solicitudes ARCO');
      return res.json();
    },
  });

  const { data: stats, refetch: reloadStats } = useQuery<Stats>({
    queryKey: ['arco-stats'],
    queryFn: async () => {
      const res = await apiFetch('/api/arco/admin/stats');
      if (!res.ok) throw new Error('Error al consultar estadísticas ARCO');
      return res.json();
    },
  });

  const handleEjecutar = async (id: string) => {
    try {
      setLoadingAction(true);
      const res = await apiFetch(`/api/arco/admin/solicitudes/${id}/ejecutar`, {
        method: 'POST',
      });
      if (!res.ok) {
        throw await res.json();
      }
      toast.success('Anonimización ejecutada correctamente.');
      setModalOpen(false);
      void reloadSolicitudes();
      void reloadStats();
    } catch (err: unknown) {
      toast.error(friendlyError(err));
    } finally {
      setLoadingAction(false);
    }
  };

  const selectedSolicitud = solicitudes?.find(s => s.id === selectedId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Privacidad"
        title="Solicitudes ARCO"
        subtitle="Gestión de derechos de datos personales · Ley 21.719"
        icon={<Shield size={20} />}
      />

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card border-border border rounded-lg p-4">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              Pendientes
              {stats.atrasadas > 0 && <AlertCircle size={16} className="text-destructive" />}
            </div>
            <div className={`text-2xl font-semibold mt-1 ${stats.atrasadas > 0 ? 'text-destructive' : 'text-foreground'}`}>
              {stats.pendientes}
            </div>
          </div>
          <div className="bg-card border-border border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">En revisión</div>
            <div className="text-2xl font-semibold mt-1 text-foreground">{stats.en_revision}</div>
          </div>
          <div className="bg-card border-border border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">Ejecutadas</div>
            <div className="text-2xl font-semibold mt-1 text-foreground">{stats.ejecutadas}</div>
          </div>
          <div className="bg-card border-border border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-2xl font-semibold mt-1 text-foreground">{stats.total}</div>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground border-b border-border">
            <tr>
              <th className="p-3 font-medium">Fecha</th>
              <th className="p-3 font-medium">Titular</th>
              <th className="p-3 font-medium">Tipo</th>
              <th className="p-3 font-medium">Estado</th>
              <th className="p-3 font-medium">Tiempo restante</th>
              <th className="p-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {solicitudes?.map((s) => {
              const isOverdue = new Date(s.fecha_limite) < new Date() && (s.estado === 'pendiente' || s.estado === 'en_revision');
              return (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="p-3 text-foreground">
                    {new Date(s.created_at).toLocaleDateString('es-CL')}
                  </td>
                  <td className="p-3 text-foreground">
                    {s.profiles?.email || 'Desconocido'}
                  </td>
                  <td className="p-3 capitalize text-foreground">{s.tipo}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                      ${s.estado === 'ejecutada' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                        s.estado === 'rechazada' ? 'bg-destructive/10 text-destructive' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                      {s.estado.replace('_', ' ')}
                    </span>
                  </td>
                  <td className={`p-3 ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                    {s.estado === 'ejecutada' || s.estado === 'rechazada' || s.estado === 'cancelada' 
                      ? '-' 
                      : formatDistanceToNow(new Date(s.fecha_limite), { addSuffix: true, locale: es })}
                  </td>
                  <td className="p-3 text-right">
                    {s.estado !== 'ejecutada' && s.estado !== 'rechazada' && s.estado !== 'cancelada' && (
                      <button 
                        onClick={() => {
                          setSelectedId(s.id);
                          setModalOpen(true);
                        }}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Revisar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!solicitudes?.length && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No hay solicitudes registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ImmersiveModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Ejecutar eliminación"
      >
        <div className="py-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Esta acción anonimizará los datos personales del titular. Los registros de venta y documentos tributarios se conservan por obligación legal.
          </p>
          <p className="text-sm text-foreground mb-4">
            ¿Confirma que desea procesar la solicitud de <strong>{selectedSolicitud?.profiles?.email}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium border border-border rounded-md text-foreground hover:bg-muted"
              disabled={loadingAction}
            >
              Cancelar
            </button>
            <button
              onClick={() => selectedId && handleEjecutar(selectedId)}
              className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50"
              disabled={loadingAction}
            >
              {loadingAction ? 'Ejecutando...' : 'Confirmar eliminación'}
            </button>
          </div>
        </div>
      </ImmersiveModal>
    </div>
  );
}
