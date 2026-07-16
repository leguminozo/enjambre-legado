"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, toast, Button, Badge, GlassPanel } from "@enjambre/ui";
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
import { formatDate } from '@/lib/format';
import { useApiFetch } from '@/hooks/use-api-fetch';

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
  const apiFetch = useApiFetch();

  const cargarReportes = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/reportes');
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

  useEffect(() => {
    cargarReportes();
  }, [empresaId]);

  const generarReporte = async (tipo: string) => {
    try {
      setGenerando(tipo);
      
      const now = new Date();
      const response = await apiFetch('/api/reportes', {
        method: 'POST',
        body: JSON.stringify({
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
        toast(error.error || 'Error al generar reporte', { type: 'error' });
      }
    } catch (error) {
console.error('Error generando reporte:', error);
		toast('Error al generar reporte', { type: 'error' });
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
		toast('Error al descargar reporte', { type: 'error' });
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
    case 'Completado':
      return <CheckCircle className="h-4 w-4 text-primary" />;
    case 'Generando':
      return <Clock className="h-4 w-4 text-primary animate-spin" />;
    case 'Error':
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
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
      return 'bg-surface-raised text-foreground border-border';
    case 'EstadoResultados':
      return 'bg-primary/10 text-primary border-primary/30';
    case 'FlujoEfectivo':
      return 'bg-card text-foreground border-border';
    case 'LibroCompras':
    case 'LibroVentas':
      return 'bg-destructive/10 text-destructive border-destructive/30';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
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
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Generar
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Produce el informe y salta a contable o SII desde el riel de acciones.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tiposReporte.map((tipo) => {
            const Icon = tipo.icon;
            const isGenerando = generando === tipo.value;

            return (
              <button
                key={tipo.value}
                type="button"
                onClick={() => generarReporte(tipo.value)}
                disabled={isGenerando}
                className="group text-left disabled:opacity-60"
              >
                <GlassPanel className="flex min-h-[5.5rem] flex-col items-start justify-between p-4 transition-colors group-hover:border-accent/40 group-hover:bg-accent/5">
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-accent">
                      <Icon className="h-4 w-4" />
                    </span>
                    {isGenerando ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Plus className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-accent" />
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
              Reportes generados
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cargarReportes}
              disabled={loading}
              className="min-h-11"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reportes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No hay reportes generados</h3>
              <p className="text-muted-foreground">
                Genera tu primer reporte financiero desde las tarjetas de arriba
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reportes.map((reporte) => (
                <div key={reporte.id} className="border border-border rounded-lg p-4">
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
<div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <div>
                        <span className="text-muted-foreground">Período:</span>
                        <span className="ml-2 text-foreground">
                              {reporte.mes ? `${reporte.mes}/` : ''}{reporte.anio}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Generado:</span>
                            <span className="ml-2 text-foreground">
                              {formatDate(reporte.createdAt)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tamaño:</span>
                            <span className="ml-2 text-foreground">
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
className="hover:bg-surface-sunken"
                    disabled={reporte.estado !== 'Completado'}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-surface-sunken"
                        disabled={reporte.estado !== 'Completado'}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {reporte.estado === 'Error' && (
        <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded">
          <p className="text-sm text-destructive">Error al generar el reporte</p>
                    </div>
                  )}

                  {reporte.estado === 'Generando' && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 text-sm text-primary">
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
      <Card className="bg-gradient-to-r from-surface-raised to-card border-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Exportación para Hostinger Business</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Formatos Disponibles</h4>
<ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• JSON (para integración con sistemas)</li>
                        <li>• CSV (para Excel y hojas de cálculo)</li>
                        <li>• PDF (para impresión y archivo)</li>
                        <li>• Excel (para análisis avanzado)</li>
                    </ul>
                    </div>
                    <div>
                        <h4 className="font-medium mb-2">Ventajas para Hostinger</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
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