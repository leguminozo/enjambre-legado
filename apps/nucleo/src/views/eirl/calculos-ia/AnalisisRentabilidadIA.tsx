"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@enjambre/ui";
import { Button } from "@enjambre/ui";
import { Badge } from "@enjambre/ui";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Brain,
  Target
} from "lucide-react";
import { useApiFetch } from '@/lib/use-api-fetch';

interface AnalisisRentabilidad {
  rentabilidadNeta: number;
  rentabilidadBruta: number;
  margenUtilidad: number;
  roi: number;
  puntoEquilibrio: number;
  recomendaciones: string[];
  alertas: string[];
  oportunidades: string[];
}

export function AnalisisRentabilidadIA({ empresaId }: { empresaId: string }) {
  const [analisis, setAnalisis] = useState<AnalisisRentabilidad | null>(null);
  const [loading, setLoading] = useState(false);
  const [ultimoAnalisis, setUltimoAnalisis] = useState<string | null>(null);
  const apiFetch = useApiFetch();

  const cargarAnalisis = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/calculos-ia', {
        method: 'POST',
        body: JSON.stringify({
          tipo: 'AnalisisRentabilidad',
          parametros: { mesesAnalisis: 12 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnalisis(data.resultado);
        setUltimoAnalisis(new Date().toLocaleString('es-CL'));
      }
    } catch (error) {
      console.error('Error cargando análisis de rentabilidad:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAnalisis();
  }, [empresaId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getRentabilidadColor = (value: number) => {
  if (value > 20) return 'text-primary';
  if (value > 10) return 'text-primary';
  if (value > 0) return 'text-destructive';
  return 'text-destructive';
  };

  const getRentabilidadLevel = (value: number) => {
  if (value > 20) return { label: 'Excelente', color: 'bg-primary/20' };
  if (value > 10) return { label: 'Buena', color: 'bg-primary/10' };
  if (value > 0) return { label: 'Regular', color: 'bg-destructive/10' };
  return { label: 'Crítica', color: 'bg-destructive/20' };
  };

  if (!analisis) {
    return (
      <Card className="bg-background border-border">
        <CardHeader>
          <CardTitle className="text-xl font-light flex items-center gap-2">
            <Target className="h-5 w-5" />
            Análisis de Rentabilidad IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Análisis de rentabilidad no disponible</p>
            <Button onClick={cargarAnalisis} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Ejecutar Análisis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const rentabilidadLevel = getRentabilidadLevel(analisis.rentabilidadNeta);

  return (
    <Card className="bg-background border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-light flex items-center gap-2">
            <Target className="h-5 w-5" />
            Análisis de Rentabilidad IA
          </CardTitle>
          <div className="flex items-center gap-2">
            {ultimoAnalisis && (
              <span className="text-sm text-muted-foreground">
                Último análisis: {ultimoAnalisis}
              </span>
            )}
            <Button onClick={cargarAnalisis} disabled={loading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-background border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Rentabilidad Neta</span>
        {analisis.rentabilidadNeta > 0 ?
            <TrendingUp className="h-4 w-4 text-primary" /> :
            <TrendingDown className="h-4 w-4 text-destructive" />
                }
              </div>
              <div className={`text-2xl font-bold ${getRentabilidadColor(analisis.rentabilidadNeta)}`}>
                {formatPercentage(analisis.rentabilidadNeta)}
              </div>
              <Badge className={`${rentabilidadLevel.color} text-foreground mt-2`}>
                {rentabilidadLevel.label}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-background border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Margen Utilidad</span>
        <Percent className="h-4 w-4 text-foreground" />
        </div>
        <div className="text-2xl font-bold text-foreground">
                {formatPercentage(analisis.margenUtilidad)}
              </div>
              <Progress value={Math.min(analisis.margenUtilidad, 100)} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-background border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">ROI</span>
        <DollarSign className="h-4 w-4 text-primary" />
        </div>
        <div className="text-2xl font-bold text-primary">
                {formatPercentage(analisis.roi)}
              </div>
              <Progress value={Math.min(analisis.roi, 100)} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-background border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Punto Equilibrio</span>
        <Target className="h-4 w-4 text-foreground" />
        </div>
        <div className="text-lg font-bold text-foreground">
                {formatCurrency(analisis.puntoEquilibrio)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Mensual</div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas y Oportunidades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alertas */}
    <Card className="bg-destructive/10 border-destructive/30">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analisis.alertas.length === 0 ? (
      <div className="flex items-center gap-2 text-primary">
            <CheckCircle className="h-4 w-4" />
                  <span>No hay alertas críticas</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {analisis.alertas.map((alerta, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <span className="text-destructive">{alerta}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Oportunidades */}
    <Card className="bg-primary/10 border-primary/30">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2 text-primary">
                <TrendingUp className="h-5 w-5" />
                Oportunidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analisis.oportunidades.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No se identificaron oportunidades inmediatas
                </div>
              ) : (
                <div className="space-y-2">
                  {analisis.oportunidades.map((oportunidad, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-primary">{oportunidad}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recomendaciones */}
    <Card className="bg-surface-raised border-border">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2 text-foreground">
              <Brain className="h-5 w-5" />
              Recomendaciones Inteligentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analisis.recomendaciones.map((recomendacion, index) => (
      <div key={index} className="p-3 bg-surface-sunken rounded-lg border border-border">
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 bg-surface-raised rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-foreground">{index + 1}</span>
          </div>
          <p className="text-sm text-foreground">{recomendacion}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}