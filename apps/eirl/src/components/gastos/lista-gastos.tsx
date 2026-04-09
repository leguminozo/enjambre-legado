"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Eye, Edit, Trash2, Plus } from "lucide-react";

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

  useEffect(() => {
    cargarGastos();
  }, []);

  const cargarGastos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/gastos?empresaId=temp-empresa-id`);
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

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Pagado':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Pendiente':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Reembolsado':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      'Arriendo': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'Servicios Básicos': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Transporte': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Suministros': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Honorarios': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Publicidad': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'Seguros': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      'Mantenimiento': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Telecomunicaciones': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'Impuestos': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      'Otros': 'bg-gray-600/20 text-gray-400 border-gray-600/30'
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  if (loading) {
    return (
      <Card className="bg-black border-gray-800">
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-light flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Gastos
          </CardTitle>
          <Button onClick={onNuevoGasto} className="bg-white text-black hover:bg-gray-200">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Gasto
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {gastos.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No hay gastos registrados</h3>
            <p className="text-gray-400 mb-4">Comienza registrando tu primer gasto</p>
            <Button onClick={onNuevoGasto} className="bg-white text-black hover:bg-gray-200">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Gasto
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {gastos.map((gasto) => (
              <div key={gasto.id} className="border border-gray-800 rounded-lg p-4 hover:bg-gray-900/50 transition-colors">
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
                      <div>
                        <span className="text-gray-500">Proveedor:</span>
                        <span className="ml-2 text-white">
                          {gasto.proveedor ? `${gasto.proveedor.nombre} (${gasto.proveedor.rut})` : 'Sin proveedor'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Fecha:</span>
                        <span className="ml-2 text-white">{formatDate(gasto.fecha)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Comprobante:</span>
                        <span className="ml-2 text-white">
                          {gasto.tipoComprobante} {gasto.numeroComprobante ? `#${gasto.numeroComprobante}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-red-400">-{formatCurrency(gasto.monto)}</div>
                      <div className="text-xs text-gray-400">
                        Neto: {formatCurrency(gasto.montoNeto)}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onVerGasto(gasto)}
                        className="hover:bg-gray-800"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditarGasto(gasto)}
                        className="hover:bg-gray-800"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-gray-800 text-red-400 hover:text-red-300"
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