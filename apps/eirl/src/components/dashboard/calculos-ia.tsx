"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface CalculoIA {
  id: string;
  tipo: string;
  resultado: string;
  confianza?: number;
  estado: string;
  createdAt: string;
}

interface CalculosIAProps {
  calculos: CalculoIA[];
}

export function CalculosIA({ calculos }: CalculosIAProps) {
  
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'Completado':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'Procesando':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'Error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'ImpuestoMensual':
        return 'Cálculo de Impuestos';
      case 'ProyeccionUtilidad':
        return 'Proyección de Utilidad';
      case 'OptimizacionFiscal':
        return 'Optimización Fiscal';
      default:
        return tipo;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (calculos.length === 0) {
    return (
      <Card className="bg-black border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-light flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Cálculos de IA Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay cálculos de IA realizados aún</p>
            <p className="text-sm mt-2">Los cálculos automáticos aparecerán aquí</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black border-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-light flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Cálculos de IA Recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {calculos.map((calculo) => (
            <div key={calculo.id} className="flex items-center justify-between p-3 border border-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                {getEstadoIcon(calculo.estado)}
                <div>
                  <div className="font-medium">{getTipoLabel(calculo.tipo)}</div>
                  <div className="text-sm text-gray-400">{formatDate(calculo.createdAt)}</div>
                </div>
              </div>
              <div className="text-right">
                {calculo.confianza && (
                  <div className="text-xs text-gray-400">
                    Confianza: {(calculo.confianza * 100).toFixed(0)}%
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  {calculo.estado}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}