"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Calculator, TrendingUp, Shield, Play, RefreshCw, CheckCircle, Clock, AlertCircle } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const [ejecutando, setEjecutando] = useState<string | null>(null);

  useEffect(() => {
    cargarCalculos();
  }, [empresaId]);

  const cargarCalculos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/calculos-ia?empresaId=${empresaId}`);
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

  const ejecutarCalculo = async (tipo: string) => {
    try {
      setEjecutando(tipo);
      
      let parametros: any = { empresaId };
      
      switch (tipo) {
        case 'ImpuestoMensual':
          parametros = {
            empresaId,
            periodo: new Date().toISOString().slice(0, 7)
          };
          break;
        case 'PPM':
          parametros = {
            empresaId,
            anio: new Date().getFullYear()
          };
          break;
        case 'ProyeccionUtilidad':
          parametros = {
            empresaId,
            mesesHistoricos: 6
          };
          break;
        case 'OptimizacionFiscal':
          parametros = {
            empresaId
          };
          break;
      }

      const response = await fetch('/api/calculos-ia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo,
          parametros
        })
      });

      if (response.ok) {
        await cargarCalculos();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al ejecutar cálculo');
      }
    } catch (error) {
      console.error('Error ejecutando cálculo:', error);
      alert('Error al ejecutar cálculo');
    } finally {
      setEjecutando(null);
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'Completado':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'Procesando':
        return <Clock className="h-4 w-4 text-yellow-400 animate-spin" />;
      case 'Error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
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
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'PPM':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'ProyeccionUtilidad':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'OptimizacionFiscal':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tiposCalculo = [
    { value: 'ImpuestoMensual', label: 'Impuestos Mensuales', icon: Calculator },
    { value: 'PPM', label: 'PPM Mensual', icon: TrendingUp },
    { value: 'ProyeccionUtilidad', label: 'Proyección Utilidad', icon: TrendingUp },
    { value: 'OptimizacionFiscal', label: 'Optimización Fiscal', icon: Shield }
  ];

  return (
    <div className="space-y-6">
      {/* Acciones Rápidas */}
      <Card className="bg-black border-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-light flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Cálculos Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiposCalculo.map((tipo) => {
              const Icon = tipo.icon;
              const isEjecutando = ejecutando === tipo.value;
              
              return (
                <Button
                  key={tipo.value}
                  onClick={() => ejecutarCalculo(tipo.value)}
                  disabled={isEjecutando}
                  className="h-20 flex-col bg-black border-gray-700 hover:bg-gray-800"
                >
                  <Icon className="h-6 w-6 mb-2" />
                  {isEjecutando ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span className="text-sm">{tipo.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Historial de Cálculos */}
      <Card className="bg-black border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-light">Historial de Cálculos</CardTitle>
            <Button
              variant="outline"
              onClick={cargarCalculos}
              disabled={loading}
              className="border-gray-600"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {calculos.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No hay cálculos realizados</h3>
              <p className="text-gray-400">Ejecuta un cálculo inteligente para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {calculos.map((calculo) => (
                <div key={calculo.id} className="border border-gray-800 rounded-lg p-4">
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
                    <div className="text-right text-sm text-gray-400">
                      {formatDate(calculo.createdAt)}
                    </div>
                  </div>

                  {calculo.estado === 'Error' && calculo.error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded p-3 mb-3">
                      <p className="text-red-400 text-sm">{calculo.error}</p>
                    </div>
                  )}

                  {calculo.estado === 'Completado' && calculo.resultado && (
                    <div className="bg-gray-900 rounded p-3">
                      <h4 className="text-sm font-medium mb-2">Resultado:</h4>
                      <pre className="text-xs text-gray-300 overflow-x-auto">
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
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div 
                          className="bg-green-400 h-2 rounded-full" 
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