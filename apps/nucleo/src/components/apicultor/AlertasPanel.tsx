'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button, Skeleton, SkeletonCard, Spinner, toast } from '@enjambre/ui';
import { AlertTriangle, CheckCircle2, PlayCircle, Plus, XCircle } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { supabase } from '@/lib/supabase';

interface AlertaResumen {
  id: string;
  actor_id?: string | null;
  producto: string;
  zona: string;
  fecha_programada: string;
  estado: string;
  confirmaciones: unknown[];
}

interface AlertasPanelProps {
  alertas: AlertaResumen[];
  actorId?: string | null;
  isLoading: boolean;
  onRefresh: () => void;
  onCrearAlerta?: () => void;
}

export function AlertasPanel({ alertas, actorId, isLoading, onRefresh, onCrearAlerta }: AlertasPanelProps) {
  const apiFetch = useApiFetch();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cambiandoEstado, setCambiandoEstado] = useState<string | null>(null);
  // Gap 7: acuse por apiario concreto → el BFF genera tareas de resguardo
  // por yarda en el calendario del apicultor.
  const [apiarioIds, setApiarioIds] = useState<string[]>([]);
  useEffect(() => {
    supabase
      .from('apiarios')
      .select('id')
      .then(({ data }: { data: { id: string }[] | null }) => {
        setApiarioIds((data ?? []).map((a) => a.id));
      })
      .catch(() => undefined);
  }, []);

  const handleConfirm = async (alertaId: string) => {
    if (!actorId) {
      toast.error('Inscríbete para confirmar alertas');
      return;
    }

    setConfirmingId(alertaId);

    try {
      const res = await apiFetch(`/api/registro-territorial/alertas/${alertaId}/confirmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor_id: actorId,
          ...(apiarioIds.length > 0 ? { apiario_ids: apiarioIds } : {}),
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        if (error.message === 'Ya confirmado previamente') {
          toast.success('Ya habías registrado estar enterado de este aviso');
        } else {
          throw new Error('Error al registrar');
        }
      } else {
        toast.success('Has avisado que estás enterado del aviso preventivo');
      }
      onRefresh();
    } catch {
      toast.error('Error al registrar tu confirmación');
    } finally {
      setConfirmingId(null);
    }
  };

  // Cierre del ciclo de vida de la alerta: solo quien la emitió puede
  // marcarla ejecutada o cancelada (PATCH /alertas/:id/estado).
  const esPropia = (alerta: AlertaResumen) =>
    Boolean(actorId) && alerta.actor_id === actorId;

  const handleCambiarEstado = async (alertaId: string, estado: 'ejecutada' | 'cancelada') => {
    setCambiandoEstado(alertaId);
    try {
      const res = await apiFetch(`/api/registro-territorial/alertas/${alertaId}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Error al actualizar la alerta');
      }
      toast.success(estado === 'ejecutada' ? 'Alerta marcada como ejecutada' : 'Alerta cancelada');
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar la alerta');
    } finally {
      setCambiandoEstado(null);
    }
  };
  if (isLoading) {
    return (
      <Card className="bg-card border-border" aria-busy="true" aria-label="Cargando avisos preventivos">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4">
          <div className="space-y-2">
            <Skeleton variant="text" className="w-56 h-5" />
            <Skeleton variant="text" className="w-80 max-w-full h-3.5" />
          </div>
          <Skeleton variant="rectangular" className="w-24 h-8 rounded-lg" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4">
        <div>
          <CardTitle className="text-lg font-semibold text-foreground">
            Avisos Preventivos de Aplicación
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Avisos de vecinos en un radio de 3 km alrededor de tus colmenas
          </CardDescription>
        </div>
        {onCrearAlerta && (
          <Button
            size="sm"
            onClick={onCrearAlerta}
            className="bg-primary text-primary-foreground hover:opacity-90 font-medium shadow-sm transition"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Emitir Aviso Fitosanitario
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {alertas.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-1 opacity-60" />
            <p className="text-sm text-muted-foreground">
              No hay avisos de aplicación registrados en tu zona actualmente.
            </p>
            {onCrearAlerta && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCrearAlerta}
                className="border-border text-foreground hover:bg-surface-raised"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5 text-primary" />
                Emitir Aviso Fitosanitario
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {alertas.map((alerta) => (
              <div
                key={alerta.id}
                className="p-4 rounded-xl bg-surface-raised border border-border flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground text-sm">{alerta.producto}</p>
                    <Badge variant="default" className="text-[10px] uppercase font-bold tracking-wider shrink-0">
                      {alerta.estado}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Zona: <strong className="text-foreground font-medium">{alerta.zona}</strong> · Fecha: <strong className="text-foreground font-medium">{new Date(alerta.fecha_programada).toLocaleDateString('es-CL')}</strong>
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-end justify-end gap-2 shrink-0 pt-2 sm:pt-0 w-full sm:w-auto">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs min-h-11 sm:min-h-9 w-full sm:w-auto font-medium"
                    onClick={() => handleConfirm(alerta.id)}
                    disabled={confirmingId === alerta.id || !actorId}
                    title={actorId ? undefined : 'Inscríbete para avisar que estás enterado'}
                  >
                    {confirmingId === alerta.id ? (
                      <Spinner className="w-3.5 h-3.5 mr-1.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-primary" />
                    )}
                    Enterado · Resguardar piqueras
                  </Button>
                  {esPropia(alerta) && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs min-h-11 sm:min-h-9 w-full sm:w-auto font-medium text-success border-success/40 hover:bg-success/10"
                        onClick={() => void handleCambiarEstado(alerta.id, 'ejecutada')}
                        disabled={cambiandoEstado === alerta.id}
                      >
                        <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
                        Ejecutada
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs min-h-11 sm:min-h-9 w-full sm:w-auto font-medium text-destructive border-destructive/40 hover:bg-destructive/10"
                        onClick={() => void handleCambiarEstado(alerta.id, 'cancelada')}
                        disabled={cambiandoEstado === alerta.id}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
