"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Edit, Trash2, Plus } from "lucide-react";

interface Factura {
  id: string;
  numero: string;
  fecha: string;
  fechaVencimiento?: string;
  montoTotal: number;
  montoNeto: number;
  montoIva: number;
  estado: string;
  descripcion?: string;
  tipoDocumento: string;
  cliente?: {
    id: string;
    nombre: string;
    rut: string;
  };
  periodo: {
    nombre: string;
  };
}

interface ListaFacturasProps {
  onNuevaFactura: () => void;
  onVerFactura: (factura: Factura) => void;
  onEditarFactura: (factura: Factura) => void;
}

export function ListaFacturas({ onNuevaFactura, onVerFactura, onEditarFactura }: ListaFacturasProps) {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarFacturas();
  }, []);

  const cargarFacturas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/facturas-emitidas?empresaId=temp-empresa-id`);
      if (response.ok) {
        const data = await response.json();
        setFacturas(data);
      }
    } catch (error) {
      console.error('Error cargando facturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Pagada':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Pendiente':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Vencida':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Anulada':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
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
            <FileText className="h-5 w-5" />
            Facturas Emitidas
          </CardTitle>
          <Button onClick={onNuevaFactura} className="bg-white text-black hover:bg-gray-200">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Factura
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {facturas.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No hay facturas emitidas</h3>
            <p className="text-gray-400 mb-4">Comienza creando tu primera factura</p>
            <Button onClick={onNuevaFactura} className="bg-white text-black hover:bg-gray-200">
              <Plus className="h-4 w-4 mr-2" />
              Crear Factura
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {facturas.map((factura) => (
              <div key={factura.id} className="border border-gray-800 rounded-lg p-4 hover:bg-gray-900/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{factura.tipoDocumento} #{factura.numero}</h3>
                      <Badge className={getEstadoColor(factura.estado)}>
                        {factura.estado}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
                      <div>
                        <span className="text-gray-500">Cliente:</span>
                        <span className="ml-2 text-white">
                          {factura.cliente ? `${factura.cliente.nombre} (${factura.cliente.rut})` : 'Sin cliente'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Fecha:</span>
                        <span className="ml-2 text-white">{formatDate(factura.fecha)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Período:</span>
                        <span className="ml-2 text-white">{factura.periodo.nombre}</span>
                      </div>
                    </div>
                    
                    {factura.descripcion && (
                      <p className="text-sm text-gray-400 mt-2">{factura.descripcion}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold">{formatCurrency(factura.montoTotal)}</div>
                      <div className="text-xs text-gray-400">
                        Neto: {formatCurrency(factura.montoNeto)}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onVerFactura(factura)}
                        className="hover:bg-gray-800"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditarFactura(factura)}
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