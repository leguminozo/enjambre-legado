'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Spinner,
  Button,
} from '@enjambre/ui';
import {
  CheckCircle,
  Circle,
  AlertTriangle,
  ShieldCheck,
  Globe,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { formatCurrency } from '@/lib/format';
import { EnjTableShell } from '@/components/layout/EnjTableShell';
import { toast } from '@enjambre/ui';

type ChecklistItem = {
  id: string;
  titulo: string;
  cumplido: boolean;
  critico: boolean;
  detalle?: string;
};

type ChecklistData = {
  provider: string;
  listoCheckout: boolean;
  listoProduccion: boolean;
  criticosPendientes: number;
  items: ChecklistItem[];
  vercelEnv: string | null;
  isProduction: boolean;
};

type SessionRow = {
  id: string;
  buy_order: string;
  provider: string;
  status: string;
  total: number;
  created_at: string;
  completed_at: string | null;
  buyer_mode: string | null;
};

/**
 * Operador: checklist go-live Flow/Transbank + sesiones recientes.
 * Las API keys NO se editan aquí (Vercel / plataforma) — sí se ve el estado.
 */
export function CheckoutWebStatusPanel() {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const checklistQuery = useQuery({
    queryKey: ['checkout', 'admin', 'checklist'],
    queryFn: async (): Promise<ChecklistData> => {
      const res = await apiFetch('/api/checkout/admin/checklist');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error cargando checklist de pagos web');
      }
      const json = await res.json();
      return json.data;
    },
  });

  const sessionsQuery = useQuery({
    queryKey: ['checkout', 'admin', 'sessions'],
    queryFn: async () => {
      const res = await apiFetch('/api/checkout/admin/sessions?limit=40');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error cargando sesiones');
      }
      return res.json();
    },
  });

  const expireStaleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/checkout/admin/sessions/expire-stale', {
        method: 'POST',
        body: JSON.stringify({ olderThanMinutes: 30, limit: 100 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error expirando sesiones');
      }
      return res.json();
    },
    onSuccess: (json) => {
      toast(json.message ?? `Expiradas: ${json.data?.expired ?? 0}`, { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['checkout', 'admin'] });
    },
    onError: (err: Error) => toast(err.message, { type: 'error' }),
  });

  const retryFulfillMutation = useMutation({
    mutationFn: async (buyOrder: string) => {
      const res = await apiFetch(
        `/api/checkout/admin/sessions/${encodeURIComponent(buyOrder)}/retry-fulfill`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Retry fulfill falló');
      }
      return res.json();
    },
    onSuccess: (json) => {
      toast(
        json.data?.alreadyProcessed
          ? 'Venta ya existía (idempotente)'
          : `Venta ${json.data?.ventaId ?? 'OK'}`,
        { type: 'success' },
      );
      queryClient.invalidateQueries({ queryKey: ['checkout', 'admin'] });
    },
    onError: (err: Error) => toast(err.message, { type: 'error' }),
  });

  const checklist = checklistQuery.data;
  const sessions: SessionRow[] = sessionsQuery.data?.data?.sessions ?? [];
  const counts = sessionsQuery.data?.data?.counts as
    | {
        pending: number;
        completed: number;
        expired?: number;
        stalePending?: number;
        total: number;
        pendingGlobal?: number;
        staleGlobal?: number;
      }
    | undefined;

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck size={18} /> Checkout web · go-live
          </CardTitle>
          <CardDescription>
            Flow / Transbank. Las credenciales de pasarela viven en Vercel (plataforma). Acá ves si el
            runtime está listo para cobrar y el historial de sesiones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checklistQuery.isLoading && <Spinner />}
          {checklistQuery.isError && (
            <p className="text-sm text-destructive font-medium">
              {(checklistQuery.error as Error).message}
            </p>
          )}
          {checklist && (
            <>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    checklist.listoCheckout
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-warning/10 text-warning border-warning/20'
                  }`}
                >
                  {checklist.listoCheckout ? (
                    <CheckCircle size={14} />
                  ) : (
                    <AlertTriangle size={14} />
                  )}
                  Checkout:{' '}
                  {checklist.listoCheckout
                    ? 'listo'
                    : `${checklist.criticosPendientes} crítico(s)`}
                </span>
                <Badge variant="default">provider: {checklist.provider}</Badge>
                <Badge variant={checklist.isProduction ? 'success' : 'default'}>
                  {checklist.vercelEnv ?? (checklist.isProduction ? 'production' : 'dev')}
                </Badge>
                {checklist.listoProduccion && (
                  <Badge variant="success">listo producción</Badge>
                )}
              </div>
              <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {checklist.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 px-3 py-2.5 bg-surface-sunken/40 text-sm"
                  >
                    {item.cumplido ? (
                      <CheckCircle size={16} className="mt-0.5 shrink-0 text-primary" />
                    ) : (
                      <Circle
                        size={16}
                        className={`mt-0.5 shrink-0 ${
                          item.critico ? 'text-warning' : 'text-muted-foreground'
                        }`}
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
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <Globe size={14} className="mt-0.5 shrink-0" />
                Para cambiar provider o keys: Vercel → nucleo → env (
                <code className="text-[11px]">PAYMENT_PROVIDER</code>, Flow/TBK). CAF boleta se
                configura en SII → Configuración.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink size={18} /> Sesiones de checkout recientes
          </CardTitle>
          <CardDescription>
            Pending = pago iniciado sin fulfill. Completed = venta registrada. Stale (&gt;30m) = abandonadas
            (liberar stock).
            {counts
              ? ` · ${counts.pendingGlobal ?? counts.pending} pending · ${counts.staleGlobal ?? 0} stale · ${counts.completed} completed (muestra)`
              : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={expireStaleMutation.isPending || (counts?.staleGlobal ?? 0) === 0}
              onClick={() => expireStaleMutation.mutate()}
            >
              <RefreshCw size={14} className="mr-1" />
              Expirar abandonadas (&gt;30m)
            </Button>
            <p className="text-[11px] text-muted-foreground self-center">
              Retry fulfill solo si el pago ya se autorizó y la sesión sigue pending (no re-cobra).
            </p>
          </div>
          {sessionsQuery.isLoading && <Spinner />}
          {sessionsQuery.isError && (
            <p className="text-sm text-destructive">
              {(sessionsQuery.error as Error).message}
            </p>
          )}
          {!sessionsQuery.isLoading && sessions.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin sesiones aún.</p>
          )}
          {sessions.length > 0 && (
            <EnjTableShell>
              <table className="w-full data-table text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2">Orden</th>
                    <th className="px-3 py-2">Provider</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2">Creada</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => {
                    const isStale =
                      s.status === 'pending' &&
                      Date.now() - new Date(s.created_at).getTime() > 30 * 60_000;
                    return (
                      <tr key={s.id} className="border-b border-border/50">
                        <td className="px-3 py-2 font-mono text-xs">{s.buy_order}</td>
                        <td className="px-3 py-2">{s.provider}</td>
                        <td className="px-3 py-2">
                          <Badge
                            variant={
                              s.status === 'completed'
                                ? 'success'
                                : s.status === 'pending'
                                  ? 'warning'
                                  : 'default'
                            }
                          >
                            {s.status}
                            {isStale ? ' · stale' : ''}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {formatCurrency(Number(s.total))}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {new Date(s.created_at).toLocaleString('es-CL')}
                        </td>
                        <td className="px-3 py-2">
                          {s.status === 'pending' && !isStale && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={retryFulfillMutation.isPending}
                              onClick={() => retryFulfillMutation.mutate(s.buy_order)}
                            >
                              Retry fulfill
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </EnjTableShell>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
