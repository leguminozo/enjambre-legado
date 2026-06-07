"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@enjambre/ui";
import { Button } from "@enjambre/ui";
import { Badge } from "@enjambre/ui";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  DollarSign, 
  TrendingDown, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Brain,
  Calculator,
  FileText,
  Lightbulb
} from "lucide-react";
import { useApiFetch } from '@/lib/use-api-fetch';

interface OptimizacionFiscal {
  ahorroPotencial: number;
  riesgoCumplimiento: string;
  deduccionesDisponibles: Array<{
    nombre: string;
    montoMaximo: number;
    aplicabilidad: string;
  }>;
  recomendaciones: string[];
  alertas: string[];
  planAccion: Array<{
    plazo: 'Corto' | 'Mediano' | 'Largo';
    accion: string;
    impacto: string;
  }>;
}

export function OptimizacionFiscalIA({ empresaId }: { empresaId: string }) {
  const [optimizacion, setOptimizacion] = useState<OptimizacionFiscal | null>(null);
  const [loading, setLoading] = useState(false);
  const [ultimoAnalisis, setUltimoAnalisis] = useState<string | null>(null);
  const apiFetch = useApiFetch();

  useEffect(() => {
    cargarOptimizacion();
  }, [empresaId]);

  const cargarOptimizacion = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/calculos-ia', {
        method: 'POST',
        body: JSON.stringify({
          tipo: 'OptimizacionFiscal',
          parametros: { periodo: new Date().toISOString().slice(0, 7) }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setOptimizacion(data.resultado);
        setUltimoAnalisis(new Date().toLocaleString('es-CL'));
      }
    } catch (error) {
      console.error('Error cargando optimización fiscal:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getAhorroColor = (value: number) => {
    if (value > 1000000) return 'text-green-400';
    if (value > 500000) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getRiesgoColor = (riesgo: string) => {
    switch (riesgo.toLowerCase()) {
      case 'bajo':
        return 'bg-green-500 text-foreground';
      case 'medio':
        return 'bg-yellow-500 text-foreground';
      case 'alto':
        return 'bg-red-500 text-foreground';
      default:
        return 'bg-muted text-foreground';
    }
  };

  if (!optimizacion) {
    return (
      <Card className="bg-background border-border">
        <CardHeader>
          <CardTitle className="text-xl font-light flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Optimización Fiscal IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Optimización fiscal no disponible</p>
            <Button onClick={cargarOptimizacion} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Ejecutar Optimización
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-background border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-light flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Optimización Fiscal IA
          </CardTitle>
          <div className="flex items-center gap-2">
            {ultimoAnalisis && (
              <span className="text-sm text-muted-foreground">
                Último análisis: {ultimoAnalisis}
              </span>
            )}
            <Button onClick={cargarOptimizacion} disabled={loading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Ahorro Potencial</span>
                <DollarSign className="h-4 w-4 text-green-400" />
              </div>
              <div className={`text-2xl font-bold ${getAhorroColor(optimizacion.ahorroPotencial)}`}>
                {formatCurrency(optimizacion.ahorroPotencial)}
              </div>
              <Progress value={Math.min((optimizacion.ahorroPotencial / 10000000) * 100, 100)} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Riesgo Cumplimiento</span>
                <Shield className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getRiesgoColor(optimizacion.riesgoCumplimiento)}>
                  {optimizacion.riesgoCumplimiento}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-2">Nivel de riesgo fiscal</div>
            </CardContent>
          </Card>

          <Card className="bg-purple-500/10 border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Deducciones</span>
                <Calculator className="h-4 w-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {optimizacion.deduccionesDisponibles.length}
              </div>
              <div className="text-xs text-muted-foreground mt-2">Oportunidades identificadas</div>
            </CardContent>
          </Card>
        </div>

        {/* Deducciones Disponibles */}
        <Card className="bg-background border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Deducciones Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {optimizacion.deduccionesDisponibles.map((deduccion, index) => (
                <div key={index} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{deduccion.nombre}</h4>
                    <span className="text-sm text-green-400">
                      {formatCurrency(deduccion.montoMaximo)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{deduccion.aplicabilidad}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        {optimizacion.alertas.length > 0 && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Alertas de Cumplimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {optimizacion.alertas.map((alerta, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-red-300">{alerta}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan de Acción */}
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2 text-blue-400">
              <Lightbulb className="h-5 w-5" />
              Plan de Acción Inteligente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {optimizacion.planAccion.map((accion, index) => (
                <div key={index} className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                         
                        className={
                          accion.plazo === 'Corto' ? 'border-green-500 text-green-400' :
                          accion.plazo === 'Mediano' ? 'border-yellow-500 text-yellow-400' :
                          'border-purple-500 text-purple-400'
                        }
                      >
                        {accion.plazo} Plazo
                      </Badge>
                      <span className="text-sm font-medium">{accion.impacto}</span>
                    </div>
                  </div>
                  <p className="text-sm text-blue-300">{accion.accion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recomendaciones Generales */}
        <Card className="bg-background border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Recomendaciones Generales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {optimizacion.recomendaciones.map((recomendacion, index) => (
                <div key={index} className="flex items-start gap-2 p-2">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-secondary-foreground">{recomendacion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}