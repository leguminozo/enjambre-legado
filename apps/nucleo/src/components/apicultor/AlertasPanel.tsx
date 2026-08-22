'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button, Spinner, toast } from '@enjambre/ui';
import { RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface AlertaResumen {
  id: string;
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
}

export function AlertasPanel({ alertas, actorId, isLoading, onRefresh }: AlertasPanelProps) {
  const apiFetch = useApiFetch();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

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
        body: JSON.stringify({ actor_id: actorId }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        if (error.message === 'Ya confirmado previamente') {
          toast.success('Esta alerta ya fue confirmada');
        } else {
          throw new Error('Error al confirmar');
        }
      } else {
        toast.success('Alerta confirmada exitosamente');
      }
      onRefresh();
    } catch {
      toast.error('Error al confirmar la alerta');
    } finally {
      setConfirmingId(null);
    }
  };
  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 flex justify-center items-center">
          <Spinner className="h-6 w-6 text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg font-semibold text-foreground">
            Alertas Fitosanitarias
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Aplicaciones programadas en su radio de influencia apícola
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="border-border text-foreground hover:bg-surface-raised"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        {alertas.length === 0 ? (
          <div className="py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-60" />
            <p className="text-sm text-muted-foreground">
              No hay alertas fitosanitarias registradas en su zona actualmente.
            </p>
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
                <div className="flex sm:flex-col items-stretch sm:items-end justify-end gap-2 shrink-0 pt-1 sm:pt-0">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs min-h-11 sm:min-h-9 w-full sm:w-auto font-medium"
                    onClick={() => handleConfirm(alerta.id)}
                    disabled={confirmingId === alerta.id || !actorId}
                    title={actorId ? undefined : 'Inscríbete para confirmar alertas'}
                  >
                    {confirmingId === alerta.id ? (
                      <Spinner className="w-3.5 h-3.5 mr-1.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-primary" />
                    )}
                    Confirmar Recepción
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
