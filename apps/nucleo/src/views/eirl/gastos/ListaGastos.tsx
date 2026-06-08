"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@enjambre/ui";
import { Button } from "@enjambre/ui";
import { Badge } from "@enjambre/ui";
import { ShoppingCart, Eye, Edit, Trash2, Plus } from "lucide-react";
import { formatDate } from '@/lib/format';
import { useApiFetch } from '@/lib/use-api-fetch';

interface Gasto {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  montoIva: number;
  montoNeto: number;
  categoria: string;
  tipoComprobante: string;
  numeroComprobante?: string;
  estado: string;
  proveedor?: {
    id: string;
    nombre: string;
    rut: string;
  };
  periodo: {
    nombre: string;
  };
}

interface ListaGastosProps {
  onNuevoGasto: () => void;
  onVerGasto: (gasto: Gasto) => void;
  onEditarGasto: (gasto: Gasto) => void;
}

export function ListaGastos({ onNuevoGasto, onVerGasto, onEditarGasto }: ListaGastosProps) {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const apiFetch = useApiFetch();

  const cargarGastos = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/gastos');
      if (response.ok) {
        const data = await response.json();
        setGastos(data);
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

  const getEstadoColor = (estado: string) => {
    switch (estado) {
    case 'Pagado':
      return 'bg-primary/10 text-primary border-primary/30';
    case 'Pendiente':
      return 'bg-primary/20 text-primary border-primary/30';
    case 'Reembolsado':
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
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </CardContent>
      </Card>
    );
  }

  return (
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
                        onClick={() => onVerGasto(gasto)}
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
  );
}