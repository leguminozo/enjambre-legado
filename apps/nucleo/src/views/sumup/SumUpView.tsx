'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Button, Badge, Spinner, HexagonLoader
} from '@enjambre/ui';
import { toast } from '@enjambre/ui';
import { formatCLP } from '@enjambre/ui';
import { 
  CreditCard, RefreshCw, CheckCircle, Wallet, ArrowRight, FileText,
  Settings2, Circle, AlertTriangle, ShieldCheck, Plug
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewShell } from '@/components/layout/ViewShell';
import { ToolActionRail } from '@/components/layout/ToolActionRail';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { EnjTableShell } from '@/components/layout/EnjTableShell';

type SumUpTab = 'transacciones' | 'payouts' | 'conciliacion' | 'config';

export function SumUpView() {
  const [activeTab, setActiveTab] = useState<SumUpTab>('transacciones');
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const [configForm, setConfigForm] = useState({
    merchantCode: '',
    apiKey: '',
    environment: 'test' as 'test' | 'live',
    enabled: false,
    syncIntervalMinutes: 30,
  });

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

  const configQuery = useQuery({
    queryKey: ['sumup', 'config'],
    queryFn: async () => {
      const res = await apiFetch('/api/sumup/config');
      if (!res.ok) throw new Error('Error cargando config SumUp');
      return res.json();
    },
    enabled: activeTab === 'config',
  });

  const checklistQuery = useQuery({
    queryKey: ['sumup', 'checklist'],
    queryFn: async () => {
      const res = await apiFetch('/api/sumup/checklist');
      if (!res.ok) throw new Error('Error cargando checklist SumUp');
      return res.json();
    },
    enabled: activeTab === 'config',
  });

  const readersQuery = useQuery({
    queryKey: ['sumup', 'readers'],
    queryFn: async () => {
      const res = await apiFetch('/api/sumup/readers');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error listando lectores');
      }
      return res.json();
    },
    enabled: activeTab === 'config' && Boolean(configQuery.data?.data?.config?.enabled),
    retry: false,
  });

  useEffect(() => {
    const cfg = configQuery.data?.data?.config;
    if (!cfg) return;
    setConfigForm((prev) => ({
      ...prev,
      merchantCode: cfg.merchant_code ?? '',
      environment: cfg.environment === 'live' ? 'live' : 'test',
      enabled: Boolean(cfg.enabled),
      syncIntervalMinutes: Number(cfg.sync_interval_minutes ?? 30),
      apiKey: '',
    }));
  }, [configQuery.data]);

  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/sumup/config', {
        method: 'POST',
        body: JSON.stringify({
          merchantCode: configForm.merchantCode,
          apiKey: configForm.apiKey || undefined,
          environment: configForm.environment,
          enabled: configForm.enabled,
          syncIntervalMinutes: configForm.syncIntervalMinutes,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error guardando config');
      }
      return res.json();
    },
    onSuccess: () => {
      toast('Configuración SumUp guardada', { type: 'success' });
      setConfigForm((p) => ({ ...p, apiKey: '' }));
      queryClient.invalidateQueries({ queryKey: ['sumup'] });
    },
    onError: (err: Error) => toast(err.message, { type: 'error' }),
  });

  const testConnMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/sumup/test-connection', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Fallo prueba de conexión');
      }
      return res.json();
    },
    onSuccess: (json) => {
      const d = json.data;
      toast(
        d.merchantOk || d.readersOk
          ? `Conexión OK · ${d.readersCount ?? 0} lector(es)`
          : `API respondió con errores: ${d.merchantError || d.readersError || 'revisá keys'}`,
        { type: d.merchantOk || d.readersOk ? 'success' : 'error' },
      );
      queryClient.invalidateQueries({ queryKey: ['sumup', 'checklist'] });
      queryClient.invalidateQueries({ queryKey: ['sumup', 'readers'] });
    },
    onError: (err: Error) => toast(err.message, { type: 'error' }),
  });

  const txns = transaccionesData?.data || [];
  const payouts = payoutsData?.data || [];
  const sugerencias = conciliacionData?.data || [];
  const checklist = checklistQuery.data?.data;
  const cfgMeta = configQuery.data?.data;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Pagos"
        title="Pagos SumUp"
        subtitle="Terminal POS, sync y conciliación — configurá merchant y API key en la app."
        icon={<CreditCard size={20} />}
      />
      <ToolActionRail context="sumup" current="/sumup" />

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
          { id: 'config', label: 'Configuración', icon: <Settings2 size={16} /> },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as SumUpTab)}
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

        {/* PESTAÑA: CONFIGURACIÓN (config-en-UI) */}
        {activeTab === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 max-w-3xl"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck size={18} /> Checklist go-live POS SumUp
                </CardTitle>
                <CardDescription>
                  Credenciales y lectores se configuran aquí — sin SQL ni redeploy.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {checklistQuery.isLoading && <Spinner />}
                {checklist && (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                          checklist.listoPos
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-warning/10 text-warning border-warning/20'
                        }`}
                      >
                        {checklist.listoPos ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                        POS: {checklist.listoPos ? 'listo' : `${checklist.criticosPendientes} crítico(s)`}
                      </span>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs border border-border bg-surface-sunken text-muted-foreground">
                        Env: {checklist.environment ?? '—'} · {checklist.enabled ? 'habilitado' : 'apagado'}
                      </span>
                    </div>
                    <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                      {(checklist.items as Array<{
                        id: string;
                        titulo: string;
                        cumplido: boolean;
                        critico: boolean;
                        detalle?: string;
                      }>).map((item) => (
                        <li key={item.id} className="flex items-start gap-3 px-3 py-2.5 bg-surface-sunken/40 text-sm">
                          {item.cumplido ? (
                            <CheckCircle size={16} className="mt-0.5 shrink-0 text-primary" />
                          ) : (
                            <Circle
                              size={16}
                              className={`mt-0.5 shrink-0 ${item.critico ? 'text-warning' : 'text-muted-foreground'}`}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-foreground">{item.titulo}</span>
                            {item.detalle && (
                              <p className="text-xs text-muted-foreground mt-0.5">{item.detalle}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 size={18} /> Merchant & API key
                </CardTitle>
                <CardDescription>
                  API key se cifra en servidor. Dejá el campo vacío al guardar para conservar la clave actual.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {configQuery.isLoading && <Spinner />}
                {cfgMeta && (
                  <p className="text-xs text-muted-foreground">
                    {cfgMeta.hasCredentials ? 'API key configurada' : 'Sin API key'} · cifrado runtime:{' '}
                    {cfgMeta.encryptionReady ? 'OK' : 'faltante (SII_CLAVE_ENCRYPTION_KEY)'}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-medium">Merchant code</label>
                    <input
                      value={configForm.merchantCode}
                      onChange={(e) => setConfigForm((p) => ({ ...p, merchantCode: e.target.value }))}
                      className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm font-mono"
                      placeholder="MCXXXXXX"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-medium">Ambiente</label>
                    <select
                      value={configForm.environment}
                      onChange={(e) =>
                        setConfigForm((p) => ({
                          ...p,
                          environment: e.target.value as 'test' | 'live',
                        }))
                      }
                      className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="test">Test / sandbox</option>
                      <option value="live">Live (producción)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">
                    API key {cfgMeta?.hasCredentials ? '(dejar vacío para no cambiar)' : ''}
                  </label>
                  <input
                    type="password"
                    value={configForm.apiKey}
                    onChange={(e) => setConfigForm((p) => ({ ...p, apiKey: e.target.value }))}
                    className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm font-mono"
                    placeholder="sup_sk_…"
                    autoComplete="off"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-medium">
                      Sync interval (minutos)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={1440}
                      value={configForm.syncIntervalMinutes}
                      onChange={(e) =>
                        setConfigForm((p) => ({
                          ...p,
                          syncIntervalMinutes: Number(e.target.value) || 30,
                        }))
                      }
                      className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={configForm.enabled}
                      onChange={(e) => setConfigForm((p) => ({ ...p, enabled: e.target.checked }))}
                      className="h-4 w-4 rounded border-border"
                    />
                    <span className="text-sm font-medium">Integración habilitada (POS + sync)</span>
                  </label>
                </div>
                <div className="flex flex-wrap gap-3 pt-1">
                  <Button
                    onClick={() => saveConfigMutation.mutate()}
                    disabled={saveConfigMutation.isPending || !configForm.merchantCode}
                  >
                    {saveConfigMutation.isPending ? (
                      <HexagonLoader size="sm" className="mr-2" />
                    ) : null}
                    Guardar configuración
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => testConnMutation.mutate()}
                    disabled={testConnMutation.isPending}
                  >
                    {testConnMutation.isPending ? (
                      <HexagonLoader size="sm" className="mr-2" />
                    ) : (
                      <Plug size={16} className="mr-2" />
                    )}
                    Probar conexión
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lectores / terminales</CardTitle>
                <CardDescription>
                  Lista desde SumUp API (requiere integración habilitada y credenciales válidas).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {readersQuery.isLoading && <Spinner />}
                {readersQuery.isError && (
                  <p className="text-sm text-muted-foreground">
                    {(readersQuery.error as Error).message}
                  </p>
                )}
                {Array.isArray(readersQuery.data?.data) && readersQuery.data.data.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin lectores registrados en el merchant.</p>
                )}
                {Array.isArray(readersQuery.data?.data) && readersQuery.data.data.length > 0 && (
                  <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                    {readersQuery.data.data.map((r: { id?: string; name?: string; status?: string; device?: { name?: string } }) => (
                      <li key={r.id ?? r.name} className="flex items-center gap-3 px-3 py-2.5 text-sm bg-surface-sunken/40">
                        <span className="font-medium flex-1">{r.name || r.device?.name || r.id}</span>
                        <Badge variant={String(r.status).toLowerCase() === 'online' ? 'success' : 'default'}>
                          {r.status ?? '—'}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground">{r.id}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
