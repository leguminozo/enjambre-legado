'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Button, Badge, Spinner
} from '@enjambre/ui';
import { toast } from '@enjambre/ui';
import { formatCLP } from '@enjambre/ui';
import { 
  CreditCard, RefreshCw, CheckCircle, Wallet, ArrowRight, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { EnjTableShell } from '@/components/layout/EnjTableShell';

export function SumUpView() {
  const [activeTab, setActiveTab] = useState<'transacciones' | 'payouts' | 'conciliacion'>('transacciones');
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  // Queries
  const { data: transaccionesData, isLoading: isLoadingTxns } = useQuery({
    queryKey: ['sumup', 'transactions'],
    queryFn: async () => {
      const res = await apiFetch('/api/sumup/transactions?limit=50');
      if (!res.ok) throw new Error('Error al obtener transacciones');
      return res.json();
    },
    enabled: activeTab === 'transacciones'
  });

  const { data: payoutsData, isLoading: isLoadingPayouts } = useQuery({
    queryKey: ['sumup', 'payouts'],
    queryFn: async () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      const res = await apiFetch(`/api/sumup/payouts?start_date=${start.toISOString().split('T')[0]}&end_date=${end.toISOString().split('T')[0]}`);
      if (!res.ok) throw new Error('Error al obtener payouts');
      return res.json();
    },
    enabled: activeTab === 'payouts'
  });

  const { data: conciliacionData, isLoading: isLoadingConciliacion } = useQuery({
    queryKey: ['sumup', 'conciliacion', 'pendientes'],
    queryFn: async () => {
      const res = await apiFetch('/api/sumup/conciliacion/pendientes');
      if (!res.ok) throw new Error('Error al obtener pendientes de conciliación');
      return res.json();
    },
    enabled: activeTab === 'conciliacion'
  });

  // Mutations
  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/sumup/transactions/sincronizar', { method: 'POST' });
      if (!res.ok) throw new Error('Error al sincronizar transacciones');
      return res.json();
    },
    onSuccess: (data) => {
      toast(`Sincronización exitosa: ${data.data.sincronizadas} nuevas de ${data.data.total}`, { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sumup', 'transactions'] });
    },
    onError: (err: any) => toast(err.message, { type: 'error' })
  });

  const autoConciliarMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/sumup/conciliacion/auto-conciliar?min_score=70', { method: 'POST' });
      if (!res.ok) throw new Error('Error en auto-conciliación');
      return res.json();
    },
    onSuccess: (data) => {
      toast(`Conciliadas automáticamente: ${data.data.conciliadas}`, { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sumup'] });
    },
    onError: (err: any) => toast(err.message, { type: 'error' })
  });

  const conciliarManualMutation = useMutation({
    mutationFn: async ({ transaccion_id, venta_id }: { transaccion_id: string, venta_id: string }) => {
      const res = await apiFetch('/api/sumup/conciliacion/conciliar', {
        method: 'POST',
        body: JSON.stringify({ transaccion_id, venta_id, tipo: 'manual' })
      });
      if (!res.ok) throw new Error('Error al conciliar');
      return res.json();
    },
    onSuccess: () => {
      toast('Transacción conciliada exitosamente', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sumup', 'conciliacion', 'pendientes'] });
    },
    onError: (err: any) => toast(err.message, { type: 'error' })
  });

  const txns = transaccionesData?.data || [];
  const payouts = payoutsData?.data || [];
  const sugerencias = conciliacionData?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Pagos"
        title="Pagos SumUp"
        subtitle="Gestión y conciliación de pagos con tarjeta y enlaces de pago."
        icon={<CreditCard size={20} />}
      />

      <ResponsiveTabBar
        variant="pill"
        layoutId="sumup-tabs"
        tabs={[
          { id: 'transacciones', label: 'Transacciones', icon: <CreditCard size={16} /> },
          { id: 'payouts', label: 'Depósitos', icon: <Wallet size={16} /> },
          {
            id: 'conciliacion',
            label: 'Conciliación',
            icon: <CheckCircle size={16} />,
            badge: sugerencias.length > 0 ? sugerencias.length : undefined,
          },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as 'transacciones' | 'payouts' | 'conciliacion')}
      />

      <AnimatePresence mode="wait">
        {/* PESTAÑA: TRANSACCIONES */}
        {activeTab === 'transacciones' && (
          <motion.div
            key="transacciones"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <RefreshCw className="text-primary" size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Sincronización</h3>
                  <p className="text-sm text-muted-foreground">Últimas transacciones desde SumUp.</p>
                </div>
              </div>
              <Button 
                onClick={() => syncMutation.mutate()} 
                disabled={syncMutation.isPending}
              >
                {syncMutation.isPending ? <Spinner className="w-4 h-4 mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Sincronizar Ahora
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {isLoadingTxns ? (
                  <div className="flex justify-center p-8"><Spinner className="w-6 h-6" /></div>
                ) : txns.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay transacciones registradas.</p>
                ) : (
                  <EnjTableShell>
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-surface-sunken">
                        <tr>
                          <th className="px-4 py-3">Fecha</th>
                          <th className="px-4 py-3">ID SumUp</th>
                          <th className="px-4 py-3">Tipo</th>
                          <th className="px-4 py-3">Monto</th>
                          <th className="px-4 py-3">Estado</th>
                          <th className="px-4 py-3">Conciliado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {txns.map((txn: any) => (
                          <tr key={txn.id} className="border-b border-border last:border-0 hover:bg-surface-sunken/50">
                            <td className="px-4 py-3 font-medium">
                              {new Date(txn.fecha).toLocaleString('es-CL')}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                              {txn.sumup_id}
                            </td>
                            <td className="px-4 py-3 capitalize">
                              <Badge variant="default">{txn.tipo}</Badge>
                            </td>
                            <td className="px-4 py-3 font-display text-foreground">
                              {formatCLP(txn.monto)}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={txn.estado === 'successful' ? 'success' : txn.estado === 'failed' ? 'danger' : 'warning'}>
                                {txn.estado}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              {txn.conciliado ? (
                                <Badge variant="success">Sí</Badge>
                              ) : (
                                <Badge variant="warning">No</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </EnjTableShell>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* PESTAÑA: PAYOUTS */}
        {activeTab === 'payouts' && (
          <motion.div
            key="payouts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Depósitos a Cuenta (Payouts)</CardTitle>
                <CardDescription>Transferencias realizadas por SumUp a la cuenta bancaria de la empresa (últimos 30 días).</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingPayouts ? (
                  <div className="flex justify-center p-8"><Spinner className="w-6 h-6" /></div>
                ) : payouts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay depósitos en los últimos 30 días.</p>
                ) : (
                  <EnjTableShell>
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-surface-sunken">
                        <tr>
                          <th className="px-4 py-3">Fecha</th>
                          <th className="px-4 py-3">Referencia</th>
                          <th className="px-4 py-3">Monto</th>
                          <th className="px-4 py-3">Comisión</th>
                          <th className="px-4 py-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payouts.map((payout: any) => (
                          <tr key={payout.id} className="border-b border-border last:border-0 hover:bg-surface-sunken/50">
                            <td className="px-4 py-3 font-medium">
                              {new Date(payout.date).toLocaleDateString('es-CL')}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                              {payout.reference || payout.sumup_id}
                            </td>
                            <td className="px-4 py-3 font-display text-primary">
                              {formatCLP(payout.amount)}
                            </td>
                            <td className="px-4 py-3 text-destructive">
                              {formatCLP(payout.fee || 0)}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={payout.status === 'PAID' ? 'success' : 'warning'}>
                                {payout.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </EnjTableShell>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* PESTAÑA: CONCILIACION */}
        {activeTab === 'conciliacion' && (
          <motion.div
            key="conciliacion"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <CheckCircle className="text-primary" size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Conciliación SumUp {'<->'} ERP</h3>
                  <p className="text-sm text-muted-foreground">Sugerencias de emparejamiento inteligente.</p>
                </div>
              </div>
              <Button 
                onClick={() => autoConciliarMutation.mutate()} 
                disabled={autoConciliarMutation.isPending || sugerencias.length === 0}
              >
                {autoConciliarMutation.isPending && <Spinner className="w-4 h-4 mr-2" />}
                Auto-Conciliar
              </Button>
            </div>

            {isLoadingConciliacion ? (
              <div className="flex justify-center p-12"><Spinner className="w-8 h-8 text-primary" /></div>
            ) : sugerencias.length === 0 ? (
              <div className="bg-surface-sunken border border-border rounded-xl p-12 text-center">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">Todo al día</h3>
                <p className="text-muted-foreground">No hay transacciones pendientes de conciliar con ventas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {sugerencias.map((sug: any) => (
                    <motion.div 
                      key={`${sug.transaccion.id}-${sug.venta.id}`}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    >
                      <Card className="overflow-hidden border-border hover:border-primary/30 transition-colors">
                        <div className="bg-surface-sunken px-4 py-2 border-b border-border flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Badge variant={sug.score >= 80 ? 'success' : 'warning'} className="font-mono">
                              {sug.score} pts
                            </Badge>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                              Emparejamiento Sugerido
                            </span>
                          </div>
                          <Button 
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            onClick={() => conciliarManualMutation.mutate({ transaccion_id: sug.transaccion.id, venta_id: sug.venta.id })}
                            disabled={conciliarManualMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Aprobar
                          </Button>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
                          
                          {/* SumUp */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground mb-3">
                              <CreditCard size={16} />
                              <span className="text-xs font-semibold uppercase">Transacción SumUp</span>
                            </div>
                            <p className="text-lg font-medium text-foreground leading-tight">
                              ID: {sug.transaccion.sumup_id}
                            </p>
                            <p className="text-2xl font-display text-primary">
                              {formatCLP(sug.transaccion.monto)}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{new Date(sug.transaccion.fecha).toLocaleString('es-CL')}</span>
                            </div>
                          </div>

                          {/* Flecha */}
                          <div className="hidden md:flex justify-center items-center text-muted-foreground/30">
                            <ArrowRight className="w-8 h-8" />
                          </div>

                          {/* ERP */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground mb-3">
                              <FileText size={16} />
                              <span className="text-xs font-semibold uppercase">Venta ERP</span>
                            </div>
                            <p className="text-lg font-medium text-foreground leading-tight">
                              Folio #{sug.venta.id.substring(0,8)}
                            </p>
                            <p className="text-2xl font-display text-foreground">
                              {formatCLP(sug.venta.total)}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="default" className="text-[10px] py-0">{sug.venta.estado}</Badge>
                              <span>•</span>
                              <span>{new Date(sug.venta.fecha).toLocaleString('es-CL')}</span>
                            </div>
                          </div>

                        </div>
                        {sug.detalles && sug.detalles.length > 0 && (
                          <div className="px-4 pb-4">
                            <div className="flex gap-2 flex-wrap">
                              {sug.detalles.map((d: string, i: number) => (
                                <span key={i} className="text-xs px-2 py-1 bg-accent/50 text-muted-foreground rounded-md">
                                  {d}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
