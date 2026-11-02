'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { friendlyError, toast, Button, SkeletonKpi, SkeletonTable } from '@enjambre/ui';
import { Calendar, CheckCircle2, Clock, DollarSign, Package, PhoneCall, Search, Download, AlertCircle } from 'lucide-react';

interface PreOrderItem {
  id: string;
  user_id: string | null;
  producto_id: string | null;
  email: string | null;
  quantity: number;
  status: string;
  created_at: string;
  productos?: { nombre: string; precio: number } | null;
  profiles?: { full_name: string } | null;
}

export type ReservasTabProps = Record<string, never>;

export function ReservasTab(_props: ReservasTabProps = {}) {
  const [reservas, setReservas] = useState<PreOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pre_orders')
        .select('*, productos(nombre, precio), profiles:user_id(full_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservas((data as unknown as PreOrderItem[]) ?? []);
    } catch (err) {
      console.error('Error fetching pre_orders:', err);
      toast(friendlyError(err, 'Error al cargar reservas de recolección'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('pre_orders')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast(`Estado actualizado a "${newStatus}"`, { type: 'success' });
      setReservas((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error('Error updating pre_order status:', err);
      toast(friendlyError(err, 'Error al actualizar estado'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReservas = useMemo(() => {
    return reservas.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        (item.email && item.email.toLowerCase().includes(term)) ||
        (item.productos?.nombre && item.productos.nombre.toLowerCase().includes(term)) ||
        (item.profiles?.full_name && item.profiles.full_name.toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [reservas, statusFilter, searchTerm]);

  // Métricas
  const stats = useMemo(() => {
    const totalReservas = reservas.length;
    const totalCupos = reservas.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
    const montoTotal = reservas.reduce((acc, curr) => {
      const precio = curr.productos?.precio || 0;
      return acc + precio * (curr.quantity || 1);
    }, 0);
    const pendientes = reservas.filter((r) => r.status === 'reserved').length;
    const contactados = reservas.filter((r) => r.status === 'contacted').length;
    const pagados = reservas.filter((r) => r.status === 'paid').length;
    const despachados = reservas.filter((r) => r.status === 'fulfilled').length;

    return { totalReservas, totalCupos, montoTotal, pendientes, contactados, pagados, despachados };
  }, [reservas]);

  const exportToCsv = () => {
    const headers = ['ID', 'Fecha', 'Cliente / Nombre', 'Email', 'Producto', 'Cantidad', 'Precio Unitario', 'Total Estimado', 'Estado'];
    const rows = filteredReservas.map((r) => [
      r.id,
      new Date(r.created_at).toISOString().split('T')[0],
      `"${r.profiles?.full_name || ''}"`,
      `"${r.email || ''}"`,
      `"${r.productos?.nombre || 'Reserva Anual'}"`,
      r.quantity,
      r.productos?.precio || 0,
      (r.productos?.precio || 0) * r.quantity,
      r.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reservas_recoleccion_anual_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reserved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-warning/15 text-warning border border-warning/20">
            <Clock size={12} /> Reservado
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-text/15 text-accent-text border border-accent-text/20">
            <PhoneCall size={12} /> Contactado
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/20">
            <DollarSign size={12} /> Pagado
          </span>
        );
      case 'fulfilled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
            <CheckCircle2 size={12} /> Despachado
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/20">
            <AlertCircle size={12} /> Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonKpi />
          <SkeletonKpi />
          <SkeletonKpi />
          <SkeletonKpi />
        </div>
        <SkeletonTable rows={5} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Total Reservas</span>
            <Calendar size={16} />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.totalReservas}</p>
          <span className="text-xs text-muted-foreground">{stats.totalCupos} cupos acumulados</span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Monto Proyectado</span>
            <DollarSign size={16} />
          </div>
          <p className="text-2xl font-bold text-foreground">
            ${stats.montoTotal.toLocaleString('es-CL')}
          </p>
          <span className="text-xs text-muted-foreground">Pre-financiación estimada</span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Pendientes de Gestión</span>
            <Clock size={16} />
          </div>
          <p className="text-2xl font-bold text-amber-500">{stats.pendientes}</p>
          <span className="text-xs text-muted-foreground">{stats.contactados} ya contactados</span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Recolección Liquidada</span>
            <Package size={16} />
          </div>
          <p className="text-2xl font-bold text-emerald-500">{stats.pagados + stats.despachados}</p>
          <span className="text-xs text-muted-foreground">{stats.despachados} despachadas</span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
            <input
              type="text"
              placeholder="Buscar por cliente, email o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Todos los estados</option>
            <option value="reserved">Reservado (Pendiente)</option>
            <option value="contacted">Contactado</option>
            <option value="paid">Pagado</option>
            <option value="fulfilled">Despachado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={exportToCsv}
          disabled={filteredReservas.length === 0}
          className="flex items-center gap-2 text-xs shrink-0"
        >
          <Download size={14} /> Exportar CSV
        </Button>
      </div>

      {/* Tabla de Reservas */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente / Email</th>
                <th className="px-4 py-3">Producto Reservado</th>
                <th className="px-4 py-3 text-center">Cupos</th>
                <th className="px-4 py-3 text-right">Total Est.</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReservas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No se encontraron reservas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredReservas.map((item) => {
                  const unitPrice = item.productos?.precio || 0;
                  const totalEst = unitPrice * item.quantity;
                  const isUpdating = actionLoading === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground block">
                          {item.profiles?.full_name || 'Guardián del Bosque'}
                        </span>
                        <span className="text-muted-foreground text-[11px] block">{item.email || 'Sin correo'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">
                          {item.productos?.nombre || 'Reserva Anual de Miel'}
                        </span>
                        {unitPrice > 0 && (
                          <span className="text-[11px] text-muted-foreground block">
                            ${unitPrice.toLocaleString('es-CL')} ref / u
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-foreground font-mono">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-foreground">
                        ${totalEst.toLocaleString('es-CL')}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === 'reserved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isUpdating}
                              onClick={() => updateStatus(item.id, 'contacted')}
                              className="text-[11px] h-7 px-2"
                            >
                              Contactar
                            </Button>
                          )}
                          {['reserved', 'contacted'].includes(item.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isUpdating}
                              onClick={() => updateStatus(item.id, 'paid')}
                              className="text-[11px] h-7 px-2 text-emerald-600 dark:text-emerald-400"
                            >
                              Marcar Pagado
                            </Button>
                          )}
                          {item.status === 'paid' && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isUpdating}
                              onClick={() => updateStatus(item.id, 'fulfilled')}
                              className="text-[11px] h-7 px-2 text-purple-600 dark:text-purple-400"
                            >
                              Despachar
                            </Button>
                          )}
                          {item.status !== 'cancelled' && item.status !== 'fulfilled' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isUpdating}
                              onClick={() => updateStatus(item.id, 'cancelled')}
                              className="text-[11px] h-7 px-2 text-destructive hover:bg-destructive/10"
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
