"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  useEffect(() => {
    cargarAnalisis();
  }, [empresaId]);

  const cargarAnalisis = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/calculos-ia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: 'AnalisisRentabilidad',
          parametros: {
            empresaId,
            mesesAnalisis: 12
          }
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
    if (value > 20) return 'text-green-400';
    if (value > 10) return 'text-yellow-400';
    if (value > 0) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRentabilidadLevel = (value: number) => {
    if (value > 20) return { label: 'Excelente', color: 'bg-green-500' };
    if (value > 10) return { label: 'Buena', color: 'bg-yellow-500' };
    if (value > 0) return { label: 'Regular', color: 'bg-orange-500' };
    return { label: 'Crítica', color: 'bg-red-500' };
  };

  if (!analisis) {
    return (
      <Card className="bg-black border-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-light flex items-center gap-2">
            <Target className="h-5 w-5" />
            Análisis de Rentabilidad IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400 mb-4">Análisis de rentabilidad no disponible</p>
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
    <Card className="bg-black border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-light flex items-center gap-2">
            <Target className="h-5 w-5" />
            Análisis de Rentabilidad IA
          </CardTitle>
          <div className="flex items-center gap-2">
            {ultimoAnalisis && (
              <span className="text-sm text-gray-400">
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
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Rentabilidad Neta</span>
                {analisis.rentabilidadNeta > 0 ? 
                  <TrendingUp className="h-4 w-4 text-green-400" /> : 
                  <TrendingDown className="h-4 w-4 text-red-400" />
                }
              </div>
              <div className={`text-2xl font-bold ${getRentabilidadColor(analisis.rentabilidadNeta)}`}>
                {formatPercentage(analisis.rentabilidadNeta)}
              </div>
              <Badge className={`${rentabilidadLevel.color} text-white mt-2`}>
                {rentabilidadLevel.label}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Margen Utilidad</span>
                <Percent className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {formatPercentage(analisis.margenUtilidad)}
              </div>
              <Progress value={Math.min(analisis.margenUtilidad, 100)} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">ROI</span>
                <DollarSign className="h-4 w-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-400">
                {formatPercentage(analisis.roi)}
              </div>
              <Progress value={Math.min(analisis.roi, 100)} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Punto Equilibrio</span>
                <Target className="h-4 w-4 text-purple-400" />
              </div>
              <div className="text-lg font-bold text-purple-400">
                {formatCurrency(analisis.puntoEquilibrio)}
              </div>
              <div className="text-xs text-gray-400 mt-1">Mensual</div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas y Oportunidades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alertas */}
          <Card className="bg-red-500/10 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analisis.alertas.length === 0 ? (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span>No hay alertas críticas</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {analisis.alertas.map((alerta, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="text-red-300">{alerta}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Oportunidades */}
          <Card className="bg-green-500/10 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2 text-green-400">
                <TrendingUp className="h-5 w-5" />
                Oportunidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analisis.oportunidades.length === 0 ? (
                <div className="text-sm text-gray-400">
                  No se identificaron oportunidades inmediatas
                </div>
              ) : (
                <div className="space-y-2">
                  {analisis.oportunidades.map((oportunidad, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-green-300">{oportunidad}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recomendaciones */}
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2 text-blue-400">
              <Brain className="h-5 w-5" />
              Recomendaciones Inteligentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analisis.recomendaciones.map((recomendacion, index) => (
                <div key={index} className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-400">{index + 1}</span>
                    </div>
                    <p className="text-sm text-blue-300">{recomendacion}</p>
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