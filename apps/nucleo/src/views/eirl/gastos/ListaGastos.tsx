"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@enjambre/ui";
import { Button } from "@enjambre/ui";
import { Badge } from "@enjambre/ui";
import { ShoppingCart, Eye, Edit, Trash2, Plus, X } from "lucide-react";
import { formatDate } from '@/lib/format';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { toast, ImmersiveModal, ViewLoading } from '@enjambre/ui';
import { mapGastoFromApi, type Gasto } from './gasto-types';

export type { Gasto };

interface ListaGastosProps {
  onNuevoGasto: () => void;
  onVerGasto: (gasto: Gasto) => void;
  onEditarGasto: (gasto: Gasto) => void;
  onDeleted?: () => void;
}

export function ListaGastos({ onNuevoGasto, onVerGasto, onEditarGasto, onDeleted }: ListaGastosProps) {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewGasto, setViewGasto] = useState<Gasto | null>(null);
  const apiFetch = useApiFetch();

  const cargarGastos = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/gastos');
      if (response.ok) {
        const data = await response.json();
        setGastos((Array.isArray(data) ? data : []).map((row: Record<string, unknown>) => mapGastoFromApi(row)));
      }
    } catch (error) {
      console.error('Error cargando gastos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarGastos();
  }, []);

  const handleDelete = async (gasto: Gasto) => {
    if (!confirm(`¿Eliminar el gasto "${gasto.descripcion}"?`)) return;
    setDeletingId(gasto.id);
    try {
      const response = await apiFetch(`/api/gastos/${gasto.id}`, { method: 'DELETE' });
      if (response.ok) {
        setGastos((prev) => prev.filter((g) => g.id !== gasto.id));
        onDeleted?.();
        toast('Gasto eliminado', { type: 'success' });
      } else {
        const err = await response.json();
        toast(err.message || 'No se pudo eliminar', { type: 'error' });
      }
    } catch (error) {
      console.error('Error eliminando gasto:', error);
      toast('Error al eliminar gasto', { type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleVer = (gasto: Gasto) => {
    setViewGasto(gasto);
    onVerGasto(gasto);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
    case 'Pagado':
      return 'bg-primary/10 text-primary border-primary/30';
    case 'Pendiente':
      return 'bg-primary/20 text-primary border-primary/30';
    case 'Reembolsado':
    case 'Anulado':
      return 'bg-surface-raised text-foreground border-border';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const getCategoriaColor = (categoria: string) => {
  const colors: Record<string, string> = {
    'Arriendo': 'bg-card text-foreground border-border',
    'Servicios Básicos': 'bg-surface-raised text-foreground border-border',
    'Transporte': 'bg-primary/10 text-primary border-primary/30',
    'Suministros': 'bg-primary/20 text-primary border-primary/30',
    'Honorarios': 'bg-destructive/10 text-destructive border-destructive/30',
    'Publicidad': 'bg-primary/10 text-primary border-primary/30',
    'Seguros': 'bg-surface-sunken text-muted-foreground border-border',
    'Mantenimiento': 'bg-destructive/10 text-destructive border-destructive/30',
    'Telecomunicaciones': 'bg-surface-raised text-foreground border-border',
    'Impuestos': 'bg-muted/20 text-muted-foreground border-muted/30',
    'Otros': 'bg-card/20 text-muted-foreground border-input/30'
  };
    return colors[categoria] || colors['Otros'];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

if (loading) {
    return (
      <Card className="bg-background border-border">
        <CardContent>
          <ViewLoading variant="view" label="Gastos" hideLabel />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <ImmersiveModal
        open={Boolean(viewGasto)}
        onClose={() => setViewGasto(null)}
        eyebrow="Contabilidad"
        title={viewGasto?.descripcion ?? 'Detalle de gasto'}
        size="md"
        footer={
          <button className="btn btn-outline btn-sm" onClick={() => setViewGasto(null)}>Cerrar</button>
        }
      >
        {viewGasto ? (
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <Badge className={getEstadoColor(viewGasto.estado)}>{viewGasto.estado}</Badge>
              <Badge className={getCategoriaColor(viewGasto.categoria)}>{viewGasto.categoria}</Badge>
            </div>
            <p><span className="text-muted-foreground">Fecha:</span> {formatDate(viewGasto.fecha)}</p>
            <p><span className="text-muted-foreground">Monto:</span> {formatCurrency(viewGasto.monto)}</p>
            <p><span className="text-muted-foreground">Neto / IVA:</span> {formatCurrency(viewGasto.montoNeto)} / {formatCurrency(viewGasto.montoIva)}</p>
            <p>
              <span className="text-muted-foreground">Proveedor:</span>{' '}
              {viewGasto.proveedor ? `${viewGasto.proveedor.nombre} (${viewGasto.proveedor.rut})` : 'Sin proveedor'}
            </p>
            <p>
              <span className="text-muted-foreground">Comprobante:</span>{' '}
              {viewGasto.tipoComprobante}{viewGasto.numeroComprobante ? ` #${viewGasto.numeroComprobante}` : ''}
            </p>
            {viewGasto.periodo?.nombre ? (
              <p><span className="text-muted-foreground">Periodo:</span> {viewGasto.periodo.nombre}</p>
            ) : null}
          </div>
        ) : null}
      </ImmersiveModal>

      <Card className="bg-background border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-light flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Gastos
            </CardTitle>
            <Button onClick={onNuevoGasto} className="bg-primary-foreground text-foreground hover:bg-secondary">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Gasto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {gastos.length === 0 ? (
            <div className="text-center py-12">
<ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No hay gastos registrados</h3>
          <p className="text-muted-foreground mb-4">Comienza registrando tu primer gasto</p>
          <Button onClick={onNuevoGasto} className="bg-primary-foreground text-foreground hover:bg-secondary">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Gasto
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {gastos.map((gasto) => (
              <div key={gasto.id} className="border border-border rounded-lg p-4 hover:bg-background/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{gasto.descripcion}</h3>
                      <Badge className={getEstadoColor(gasto.estado)}>
                        {gasto.estado}
                      </Badge>
                      <Badge className={getCategoriaColor(gasto.categoria)}>
                        {gasto.categoria}
                      </Badge>
                    </div>
                    
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
        <div>
          <span className="text-muted-foreground">Proveedor:</span>
          <span className="ml-2 text-foreground">
            {gasto.proveedor ? `${gasto.proveedor.nombre} (${gasto.proveedor.rut})` : 'Sin proveedor'}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Fecha:</span>
          <span className="ml-2 text-foreground">{formatDate(gasto.fecha)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Comprobante:</span>
          <span className="ml-2 text-foreground">
                          {gasto.tipoComprobante} {gasto.numeroComprobante ? `#${gasto.numeroComprobante}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-destructive">-{formatCurrency(gasto.monto)}</div>
                      <div className="text-xs text-muted-foreground">
                        Neto: {formatCurrency(gasto.montoNeto)}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVer(gasto)}
className="hover:bg-surface-sunken"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEditarGasto(gasto)}
          className="hover:bg-surface-sunken"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={deletingId === gasto.id}
          onClick={() => handleDelete(gasto)}
          className="hover:bg-surface-sunken text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}