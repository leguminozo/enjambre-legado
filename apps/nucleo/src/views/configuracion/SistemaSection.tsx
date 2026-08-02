'use client';

import { useState } from 'react';
import { RefreshCw, ShieldAlert, Loader2, CheckCircle, Radio, Zap } from 'lucide-react';
import { toast, Badge } from '@enjambre/ui';
import { useQuery } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { supabase } from '@/lib/supabase';
import type { SecurityEvent, SecurityEventType, AppSource } from '@enjambre/auth/security-events';

/** Row de security_events tipada (evita `any` en el mapeo a SecurityEvent). */
interface SecurityEventRow {
  id: string;
  event_type: string;
  email: string;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown> | null;
  app_source: string;
  created_at: string;
}

export function SistemaSection() {
  const apiFetch = useApiFetch();
  const [purging, setPurging] = useState(false);

  const securityQuery = useQuery({
    queryKey: ['system', 'security-events'],
    queryFn: async (): Promise<SecurityEvent[]> => {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return ((data ?? []) as unknown as SecurityEventRow[]).map((row) => ({
        id: row.id,
        eventType: row.event_type as SecurityEventType,
        email: row.email,
        userId: row.user_id,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        details: row.details || {},
        appSource: row.app_source as AppSource,
        createdAt: row.created_at,
      }));
    },
    refetchInterval: 30000, // Cada 30s
  });

  const handlePurgeCache = async () => {
    setPurging(true);
    try {
      const res = await apiFetch('/api/admin-system/purge-cache', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falló purga de caché');
      }
      toast('Caché de tienda purgado correctamente', { type: 'success' });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error purgando caché', { type: 'error' });
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <section className="space-y-6 bg-surface p-6 rounded-2xl border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-accent">
              <Radio size={18} />
              <h3 className="text-sm font-bold uppercase tracking-widest">Salud de Integraciones</h3>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-secondary/40 rounded-xl border border-border/50">
              <div className="flex items-center gap-3">
                <CheckCircle size={16} className="text-primary" />
                <div>
                  <p className="text-sm font-medium">Transbank Webpay</p>
                  <p className="text-xs text-muted-foreground">Checkout Tienda</p>
                </div>
              </div>
              <Badge variant="success">Operativo</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary/40 rounded-xl border border-border/50">
              <div className="flex items-center gap-3">
                <CheckCircle size={16} className="text-primary" />
                <div>
                  <p className="text-sm font-medium">SumUp</p>
                  <p className="text-xs text-muted-foreground">POS Campo</p>
                </div>
              </div>
              <Badge variant="success">Conectado</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary/40 rounded-xl border border-border/50">
              <div className="flex items-center gap-3">
                <CheckCircle size={16} className="text-primary" />
                <div>
                  <p className="text-sm font-medium">Banco Chile</p>
                  <p className="text-xs text-muted-foreground">Conciliación Bancaria API</p>
                </div>
              </div>
              <Badge variant="success">Autenticado</Badge>
            </div>
          </div>
        </section>

        <section className="space-y-6 bg-surface p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-3 text-accent">
            <Zap size={18} />
            <h3 className="text-sm font-bold uppercase tracking-widest">Caché &amp; Edge</h3>
          </div>

          <div className="p-4 bg-secondary/40 rounded-xl border border-border/50 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Purga de Caché Global (Tienda)</p>
              <p className="text-xs text-muted-foreground mt-1">
                Invalida toda la caché estática de la tienda. Usar solo cuando los cambios en productos no se reflejan.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePurgeCache}
              disabled={purging}
              className="shrink-0 flex items-center gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-destructive/20"
            >
              {purging ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Purgar
            </button>
          </div>
        </section>
      </div>

      <section className="space-y-6 bg-surface p-6 rounded-2xl border border-border h-full flex flex-col">
        <div className="flex items-center gap-3 text-accent">
          <ShieldAlert size={18} />
          <h3 className="text-sm font-bold uppercase tracking-widest">Auditoría de Seguridad</h3>
          {securityQuery.isFetching && <Loader2 size={14} className="animate-spin text-muted-foreground ml-auto" />}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-[300px]">
          {securityQuery.isLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : securityQuery.isError ? (
            <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-xl">Error al cargar eventos de seguridad.</div>
          ) : securityQuery.data?.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 text-center">No hay eventos de seguridad recientes.</div>
          ) : (
            securityQuery.data?.map((ev) => (
              <div key={ev.id} className="p-3 bg-secondary/30 rounded-xl border border-border/50 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Badge variant={ev.eventType.includes('failed') || ev.eventType.includes('denied') ? 'danger' : 'default'}>
                      {ev.eventType}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{new Date(ev.createdAt).toLocaleString()}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono text-muted-foreground px-2 py-0.5 bg-surface-sunken rounded">
                    {ev.appSource}
                  </span>
                </div>
                {ev.details && Object.keys(ev.details).length > 0 && (
                  <pre className="text-[10px] bg-background p-2 rounded border border-border/30 overflow-x-auto text-muted-foreground font-mono">
                    {JSON.stringify(ev.details, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
