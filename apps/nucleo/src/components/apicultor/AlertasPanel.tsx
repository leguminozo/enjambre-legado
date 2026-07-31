'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button, Spinner } from '@enjambre/ui';
import { RefreshCw, AlertTriangle } from 'lucide-react';

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
  isLoading: boolean;
  onRefresh: () => void;
}

export function AlertasPanel({ alertas, isLoading, onRefresh }: AlertasPanelProps) {
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
                <Badge variant="default" className="border border-border text-foreground">
                  {alerta.estado}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
