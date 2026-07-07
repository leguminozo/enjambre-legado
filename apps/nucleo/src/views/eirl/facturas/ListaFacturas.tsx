'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@enjambre/ui";
import { Button } from "@enjambre/ui";
import { Badge } from "@enjambre/ui";
import { HexagonLoader, ViewLoading } from '@enjambre/ui';
import { FileText, Eye, Edit, Trash2, Plus, Send } from "lucide-react";
import { formatDate, formatCurrency } from '@/lib/format';
import { deleteFacturaEmitida } from '@/lib/actions/facturas';
import { NuevaFacturaForm } from './NuevaFacturaForm';
import { useApiFetch } from '@/hooks/use-api-fetch';

export interface Factura {
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
  estadoSii?: string | null;
  folio?: number | null;
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
  facturasInitiales?: Factura[];
  empresaId: string;
}

function mapFacturaRow(row: Record<string, unknown>): Factura {
  const tercero = row.tercero as Record<string, unknown> | null;
  const periodo = row.periodo as Record<string, unknown> | null;
  return {
    id: String(row.id),
    numero: String(row.numero ?? ''),
    fecha: String(row.fecha_emision ?? row.fecha ?? ''),
    fechaVencimiento: row.fecha_vencimiento ? String(row.fecha_vencimiento) : undefined,
    montoTotal: Number(row.monto_total) || 0,
    montoNeto: Number(row.monto_neto) || 0,
    montoIva: Number(row.monto_iva) || 0,
    estado: String(row.estado ?? 'Pendiente'),
    descripcion: row.descripcion ? String(row.descripcion) : undefined,
    tipoDocumento: String(row.tipo_documento ?? 'Factura'),
    estadoSii: row.estado_sii ? String(row.estado_sii) : null,
    folio: row.folio != null ? Number(row.folio) : null,
    cliente: tercero ? {
      id: String(tercero.id),
      nombre: String(tercero.nombre ?? ''),
      rut: String(tercero.rut ?? ''),
    } : undefined,
    periodo: { nombre: String(periodo?.nombre ?? '—') },
  };
}

export function ListaFacturas({ facturasInitiales = [], empresaId }: ListaFacturasProps) {
  const [facturas, setFacturas] = useState<Factura[]>(facturasInitiales);
  const [loading, setLoading] = useState(facturasInitiales.length === 0);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [emittingId, setEmittingId] = useState<string | null>(null);
  const apiFetch = useApiFetch();

  const cargarFacturas = useCallback(async () => {
    if (!empresaId) {
      setFacturas([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch('/api/facturas-emitidas');
      if (res.ok) {
        const data = await res.json();
        setFacturas(Array.isArray(data) ? data.map((r: Record<string, unknown>) => mapFacturaRow(r)) : []);
      }
    } catch (error) {
      console.error('[facturas] fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, empresaId]);

  useEffect(() => {
    cargarFacturas();
  }, [cargarFacturas]);

  const canEmitirDte = (factura: Factura) =>
    factura.tipoDocumento === 'Factura' &&
    !['aceptado', 'enviado'].includes(factura.estadoSii ?? '');

  const handleEmitirDte = async (id: string) => {
    setEmittingId(id);
    try {
      const res = await apiFetch(`/api/facturas-emitidas/${id}/emitir-dte`, { method: 'POST' });
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) {
        const reasons = Array.isArray(json.reasons) ? (json.reasons as string[]).join(', ') : '';
        const msg = typeof json.message === 'string' ? json.message : 'No se pudo emitir el DTE';
        alert(reasons ? `${msg}: ${reasons}` : msg);
        return;
      }
      await cargarFacturas();
    } catch (error) {
      console.error('[facturas] emitir-dte error:', error);
      alert('Error de red al emitir DTE');
    } finally {
      setEmittingId(null);
    }
  };

  const getEstadoSiiColor = (estado?: string | null) => {
    switch (estado) {
    case 'aceptado':
      return 'bg-primary/10 text-primary border-primary/30';
    case 'enviado':
      return 'bg-primary/20 text-primary border-primary/30';
    case 'rechazado':
      return 'bg-destructive/10 text-destructive border-destructive/30';
    case 'pendiente':
      return 'bg-muted/20 text-muted-foreground border-muted/30';
    default:
      return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta factura?')) {
      startTransition(async () => {
        await deleteFacturaEmitida(id);
        setFacturas(prev => prev.filter(f => f.id !== id));
      });
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
    case 'Pagada':
      return 'bg-primary/10 text-primary border-primary/30';
    case 'Pendiente':
      return 'bg-primary/20 text-primary border-primary/30';
    case 'Vencida':
      return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'Anulada':
        return 'bg-muted/20 text-muted-foreground border-muted/30';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  if (mostrarFormulario) {
    return (
      <NuevaFacturaForm
        empresaId={empresaId}
        clientes={[]}
        onSuccess={() => {
          setMostrarFormulario(false);
          cargarFacturas();
        }}
        onCancel={() => setMostrarFormulario(false)}
      />
    );
  }

  return (
    <Card className="bg-background border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-light flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Facturas Emitidas
          </CardTitle>
          <Button 
            onClick={() => setMostrarFormulario(true)} 
            className="bg-primary-foreground text-foreground hover:bg-secondary"
            disabled={isPending}
          >
            {isPending ? (
              <HexagonLoader size="sm" className="mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Nueva Factura
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ViewLoading variant="view" label="Facturas emitidas" hideLabel />
        ) : !empresaId ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Vincula una empresa en tu perfil para gestionar facturas emitidas.
          </div>
        ) : facturas.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No hay facturas emitidas</h3>
            <p className="text-muted-foreground mb-4">Comienza creando tu primera factura</p>
            <Button 
              onClick={() => setMostrarFormulario(true)} 
              className="bg-primary-foreground text-foreground hover:bg-secondary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Factura
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {facturas.map((factura) => (
              <div 
                key={factura.id} 
                className="border border-border rounded-lg p-4 hover:bg-background/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{factura.tipoDocumento} #{factura.numero}</h3>
                      <Badge className={getEstadoColor(factura.estado)}>
                        {factura.estado}
                      </Badge>
                      {factura.estadoSii && (
                        <Badge className={getEstadoSiiColor(factura.estadoSii)}>
                          SII: {factura.estadoSii}
                          {factura.folio ? ` · folio ${factura.folio}` : ''}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="text-muted-foreground">Cliente:</span>
                        <span className="ml-2 text-foreground">
                          {factura.cliente ? `${factura.cliente.nombre} (${factura.cliente.rut})` : 'Sin cliente'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fecha:</span>
                        <span className="ml-2 text-foreground">{formatDate(factura.fecha)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Período:</span>
                        <span className="ml-2 text-foreground">{factura.periodo.nombre}</span>
                      </div>
                    </div>

                    {factura.descripcion && (
                      <p className="text-sm text-muted-foreground mt-2">{factura.descripcion}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold">{formatCurrency(factura.montoTotal)}</div>
                      <div className="text-xs text-muted-foreground">
                        Neto: {formatCurrency(factura.montoNeto)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {canEmitirDte(factura) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleEmitirDte(factura.id)}
                          disabled={emittingId === factura.id || isPending}
                          className="hover:bg-surface-sunken"
                          title="Emitir DTE al SII"
                        >
                          {emittingId === factura.id ? (
                            <HexagonLoader size="sm" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-surface-sunken"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-surface-sunken"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(factura.id)}
                        className="hover:bg-surface-sunken text-destructive hover:text-destructive/80"
                        disabled={isPending}
                      >
                        {isPending ? (
                          <HexagonLoader size="sm" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
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
