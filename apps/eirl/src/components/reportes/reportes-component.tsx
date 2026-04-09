"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Download, 
  Eye, 
  RefreshCw, 
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  BookOpen,
  DollarSign
} from "lucide-react";

interface Reporte {
  id: string;
  tipo: string;
  nombre: string;
  descripcion?: string;
  periodo: string;
  mes?: number;
  anio: number;
  datos: string;
  archivoUrl?: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
}

interface ReportesComponentProps {
  empresaId: string;
}

export function ReportesComponent({ empresaId }: ReportesComponentProps) {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(false);
  const [generando, setGenerando] = useState<string | null>(null);

  useEffect(() => {
    cargarReportes();
  }, [empresaId]);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reportes?empresaId=${empresaId}`);
      if (response.ok) {
        const data = await response.json();
        setReportes(data);
      }
    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  const generarReporte = async (tipo: string) => {
    try {
      setGenerando(tipo);
      
      const now = new Date();
      const response = await fetch('/api/reportes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresaId,
          tipo,
          periodo: 'Mensual',
          mes: now.getMonth() + 1,
          anio: now.getFullYear()
        })
      });

      if (response.ok) {
        await cargarReportes();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al generar reporte');
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
      alert('Error al generar reporte');
    } finally {
      setGenerando(null);
    }
  };

  const descargarReporte = (reporte: Reporte) => {
    try {
      const datos = JSON.parse(reporte.datos);
      const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reporte.nombre}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando reporte:', error);
      alert('Error al descargar reporte');
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'Completado':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'Generando':
        return <Clock className="h-4 w-4 text-yellow-400 animate-spin" />;
      case 'Error':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'BalanceGeneral':
        return <BarChart3 className="h-5 w-5" />;
      case 'EstadoResultados':
        return <TrendingUp className="h-5 w-5" />;
      case 'FlujoEfectivo':
        return <DollarSign className="h-5 w-5" />;
      case 'LibroCompras':
      case 'LibroVentas':
        return <BookOpen className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'BalanceGeneral':
        return 'Balance General';
      case 'EstadoResultados':
        return 'Estado de Resultados';
      case 'FlujoEfectivo':
        return 'Flujo de Efectivo';
      case 'LibroCompras':
        return 'Libro de Compras';
      case 'LibroVentas':
        return 'Libro de Ventas';
      default:
        return tipo;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'BalanceGeneral':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'EstadoResultados':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'FlujoEfectivo':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'LibroCompras':
      case 'LibroVentas':
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

  const tiposReporte = [
    { value: 'BalanceGeneral', label: 'Balance General', icon: BarChart3 },
    { value: 'EstadoResultados', label: 'Estado de Resultados', icon: TrendingUp },
    { value: 'FlujoEfectivo', label: 'Flujo de Efectivo', icon: DollarSign },
    { value: 'LibroCompras', label: 'Libro de Compras', icon: BookOpen },
    { value: 'LibroVentas', label: 'Libro de Ventas', icon: BookOpen }
  ];

  return (
    <div className="space-y-6">
      {/* Generación de Reportes */}
      <Card className="bg-black border-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-light flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generador de Reportes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tiposReporte.map((tipo) => {
              const Icon = tipo.icon;
              const isGenerando = generando === tipo.value;
              
              return (
                <Button
                  key={tipo.value}
                  onClick={() => generarReporte(tipo.value)}
                  disabled={isGenerando}
                  className="h-20 flex-col bg-black border-gray-700 hover:bg-gray-800"
                >
                  <Icon className="h-6 w-6 mb-2" />
                  {isGenerando ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span className="text-sm">{tipo.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Reportes */}
      <Card className="bg-black border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-light">Reportes Generados</CardTitle>
            <Button
              variant="outline"
              onClick={cargarReportes}
              disabled={loading}
              className="border-gray-600"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reportes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No hay reportes generados</h3>
              <p className="text-gray-400">Genera tu primer reporte financiero</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reportes.map((reporte) => (
                <div key={reporte.id} className="border border-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getTipoIcon(reporte.tipo)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{getTipoLabel(reporte.tipo)}</h3>
                          <Badge className={getTipoColor(reporte.tipo)}>
                            {reporte.tipo}
                          </Badge>
                          {getEstadoIcon(reporte.estado)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-400">
                          <div>
                            <span className="text-gray-500">Período:</span>
                            <span className="ml-2 text-white">
                              {reporte.mes ? `${reporte.mes}/` : ''}{reporte.anio}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Generado:</span>
                            <span className="ml-2 text-white">
                              {formatDate(reporte.createdAt)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Tamaño:</span>
                            <span className="ml-2 text-white">
                              {(JSON.stringify(reporte.datos).length / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => descargarReporte(reporte)}
                        className="hover:bg-gray-800"
                        disabled={reporte.estado !== 'Completado'}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-gray-800"
                        disabled={reporte.estado !== 'Completado'}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {reporte.estado === 'Error' && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded">
                      <p className="text-sm text-red-400">Error al generar el reporte</p>
                    </div>
                  )}

                  {reporte.estado === 'Generando' && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 text-sm text-yellow-400">
                        <Clock className="h-4 w-4 animate-spin" />
                        <span>Generando reporte...</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información de Exportación */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Exportación para Hostinger Business</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Formatos Disponibles</h4>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>• JSON (para integración con sistemas)</li>
                <li>• CSV (para Excel y hojas de cálculo)</li>
                <li>• PDF (para impresión y archivo)</li>
                <li>• Excel (para análisis avanzado)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Ventajas para Hostinger</h4>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>• Almacenamiento a largo plazo seguro</li>
                <li>• Acceso rápido desde cualquier dispositivo</li>
                <li>• Backup automático de todos los reportes</li>
                <li>• Cumplimiento con normativas legales</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}