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
  actores: { id: string; nombre_actor: string }[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function AlertasPanel({ alertas, actores, isLoading, onRefresh }: AlertasPanelProps) {
  const apiFetch = useApiFetch();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleConfirm = async (alertaId: string) => {
    // Para el MVP asumimos que el admin usa el primer actor disponible, o podríamos tener un selector.
    // Lo más simple para validar el flujo es usar el primer actor de la lista
    if (actores.length === 0) {
      toast.error('Debe existir al menos un actor registrado para confirmar');
      return;
    }
    
    const actorId = actores[0].id;
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
                className="p-4 rounded-lg bg-surface-raised border border-border flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{alerta.producto}</p>
                  <p className="text-xs text-muted-foreground">
                    Zona: {alerta.zona} | Fecha: {new Date(alerta.fecha_programada).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="default" className="border border-border text-foreground">
                    {alerta.estado}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-8"
                    onClick={() => handleConfirm(alerta.id)}
                    disabled={confirmingId === alerta.id}
                  >
                    {confirmingId === alerta.id ? (
                      <Spinner className="w-3 h-3 mr-1" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 mr-1 text-primary" />
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
