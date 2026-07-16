"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, toast, ViewLoading, Button, Badge, GlassPanel } from "@enjambre/ui";
import { Brain, Calculator, TrendingUp, Shield, Play, RefreshCw, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { formatDate } from '@/lib/format';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface CalculoIA {
  id: string;
  tipo: string;
  parametros: string;
  resultado: string;
  confianza?: number;
  prompt?: string;
  respuestaIA?: string;
  estado: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

interface CalculosIAComponentProps {
  empresaId: string;
}

export function CalculosIAComponent({ empresaId }: CalculosIAComponentProps) {
  const [calculos, setCalculos] = useState<CalculoIA[]>([]);
  const [loading, setLoading] = useState(true);
  const [ejecutando, setEjecutando] = useState<string | null>(null);
  const apiFetch = useApiFetch();

  const cargarCalculos = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/calculos-ia');
      if (response.ok) {
        const data = await response.json();
        setCalculos(data);
      }
    } catch (error) {
      console.error('Error cargando cálculos IA:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCalculos();
  }, [empresaId]);

  const ejecutarCalculo = async (tipo: string) => {
    try {
      setEjecutando(tipo);
      
      let parametros: Record<string, unknown> = {};

      switch (tipo) {
        case 'ImpuestoMensual':
          parametros = { periodo: new Date().toISOString().slice(0, 7) };
          break;
        case 'PPM':
          parametros = { anio: new Date().getFullYear() };
          break;
        case 'ProyeccionUtilidad':
          parametros = { mesesHistoricos: 6 };
          break;
        case 'OptimizacionFiscal':
          parametros = {};
          break;
      }

      const response = await apiFetch('/api/calculos-ia', {
        method: 'POST',
        body: JSON.stringify({ tipo, parametros })
      });

      if (response.ok) {
        await cargarCalculos();
      } else {
        const error = await response.json();
        toast(error.error || 'Error al ejecutar cálculo', { type: 'error' });
      }
    } catch (error) {
console.error('Error ejecutando cálculo:', error);
		toast('Error al ejecutar cálculo', { type: 'error' });
    } finally {
      setEjecutando(null);
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
    case 'Completado':
      return <CheckCircle className="h-4 w-4 text-primary" />;
    case 'Procesando':
      return <Clock className="h-4 w-4 text-primary animate-spin" />;
    case 'Error':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'ImpuestoMensual':
        return 'Cálculo de Impuestos Mensuales';
      case 'PPM':
        return 'Cálculo de PPM';
      case 'ProyeccionUtilidad':
        return 'Proyección de Utilidad';
      case 'OptimizacionFiscal':
        return 'Optimización Fiscal';
      default:
        return tipo;
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'ImpuestoMensual':
        return <Calculator className="h-5 w-5" />;
      case 'PPM':
        return <TrendingUp className="h-5 w-5" />;
      case 'ProyeccionUtilidad':
        return <TrendingUp className="h-5 w-5" />;
      case 'OptimizacionFiscal':
        return <Shield className="h-5 w-5" />;
      default:
        return <Brain className="h-5 w-5" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
    case 'ImpuestoMensual':
      return 'bg-surface-raised text-foreground border-border';
    case 'PPM':
      return 'bg-primary/10 text-primary border-primary/30';
    case 'ProyeccionUtilidad':
      return 'bg-card text-foreground border-border';
    case 'OptimizacionFiscal':
      return 'bg-destructive/10 text-destructive border-destructive/30';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
};

const tiposCalculo = [
    { value: 'ImpuestoMensual', label: 'Impuestos Mensuales', icon: Calculator },
    { value: 'PPM', label: 'PPM Mensual', icon: TrendingUp },
    { value: 'ProyeccionUtilidad', label: 'Proyección Utilidad', icon: TrendingUp },
    { value: 'OptimizacionFiscal', label: 'Optimización Fiscal', icon: Shield }
  ];

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Ejecutar
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Corre el cálculo y continúa en contable, SII o reportes desde el riel de entorno.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {tiposCalculo.map((tipo) => {
            const Icon = tipo.icon;
            const isEjecutando = ejecutando === tipo.value;

            return (
              <button
                key={tipo.value}
                type="button"
                onClick={() => ejecutarCalculo(tipo.value)}
                disabled={isEjecutando}
                className="group text-left disabled:opacity-60"
              >
                <GlassPanel className="flex min-h-[5.5rem] flex-col items-start justify-between p-4 transition-colors group-hover:border-accent/40 group-hover:bg-accent/5">
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-accent">
                      <Icon className="h-4 w-4" />
                    </span>
                    {isEjecutando ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Play className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-accent" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground">{tipo.label}</span>
                </GlassPanel>
              </button>
            );
          })}
        </div>
      </section>

      <Card className="bg-card/70 border-border">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base font-display font-semibold">
              Historial de cálculos
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cargarCalculos}
              disabled={loading}
              className="min-h-11"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && calculos.length === 0 ? (
            <ViewLoading variant="view" label="Cálculos IA" hideLabel />
          ) : calculos.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No hay cálculos realizados</h3>
              <p className="text-muted-foreground">Ejecuta un cálculo inteligente para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {calculos.map((calculo) => (
                <div key={calculo.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getTipoIcon(calculo.tipo)}
                      <div>
                        <h3 className="font-medium">{getTipoLabel(calculo.tipo)}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getEstadoIcon(calculo.estado)}
                          <Badge className={getTipoColor(calculo.tipo)}>
                            {calculo.estado}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {formatDate(calculo.createdAt)}
                    </div>
                  </div>

                  {calculo.estado === 'Error' && calculo.error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded p-3 mb-3">
                <p className="text-destructive text-sm">{calculo.error}</p>
                    </div>
                  )}

                  {calculo.estado === 'Completado' && calculo.resultado && (
                    <div className="bg-background rounded p-3">
                      <h4 className="text-sm font-medium mb-2">Resultado:</h4>
                      <pre className="text-xs text-secondary-foreground overflow-x-auto">
                        {JSON.stringify(JSON.parse(calculo.resultado), null, 2)}
                      </pre>
                    </div>
                  )}

                  {calculo.confianza && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Confianza del cálculo:</span>
                        <span className="font-medium">{(calculo.confianza * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-surface-raised rounded-full h-2 mt-1">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${calculo.confianza * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}