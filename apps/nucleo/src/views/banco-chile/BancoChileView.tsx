import { useState, useEffect, useCallback } from 'react';
import { HexagonLoader, ViewLoading, Badge } from '@enjambre/ui';
import {
  Building2,
  Settings,
  RefreshCw,
  CheckCircle,
  Circle,
  AlertTriangle,
  Plug,
  ShieldCheck,
} from 'lucide-react';

import { formatCurrency } from '@/lib/format';
import { ImmersiveModal } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { ToolActionRail } from '@/components/layout/ToolActionRail';
import { EnjTableShell } from '@/components/layout/EnjTableShell';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface BancoChileConfig {
  id: string;
  empresa_id: string;
  enabled: boolean;
  environment: 'sandbox' | 'production';
  last_sync?: string;
  hasCredentials?: boolean;
}

interface ChecklistItem {
  id: string;
  titulo: string;
  cumplido: boolean;
  critico: boolean;
  detalle?: string;
}

interface CuentaBancaria {
  id: string;
  numero_cuenta: string;
  tipo_cuenta: string;
  saldo_disponible: number;
  saldo_contable: number;
  activa: boolean;
}

interface MovimientoBancario {
  id: string;
  fecha_contable: string;
  descripcion: string;
  monto: number;
  tipo: string;
  conciliado: boolean;
}

export function BancoChileView() {
  const apiFetch = useApiFetch();
  const [config, setConfig] = useState<BancoChileConfig | null>(null);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [encryptionReady, setEncryptionReady] = useState(false);
  const [checklist, setChecklist] = useState<{
    listoOperacion: boolean;
    criticosPendientes: number;
    items: ChecklistItem[];
    environment: string | null;
  } | null>(null);
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoBancario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingAuth, setTestingAuth] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    clientSecret: '',
    username: '',
    password: '',
    environment: 'sandbox' as 'sandbox' | 'production',
    enabled: false,
  });

  const fetchConfig = useCallback(async () => {
    try {
      const res = await apiFetch('/api/banco-chile/config');
      if (!res.ok) throw new Error('Error cargando config');
      const json = await res.json();
      const cfg = json.data?.config ?? null;
      setConfig(cfg);
      setHasCredentials(Boolean(json.data?.hasCredentials));
      setEncryptionReady(Boolean(json.data?.encryptionReady));
      if (cfg) {
        setFormData((prev) => ({
          ...prev,
          environment: cfg.environment === 'production' ? 'production' : 'sandbox',
          enabled: Boolean(cfg.enabled),
          clientId: '',
          clientSecret: '',
          username: '',
          password: '',
        }));
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  const fetchChecklist = useCallback(async () => {
    try {
      const res = await apiFetch('/api/banco-chile/checklist');
      if (!res.ok) return;
      const json = await res.json();
      setChecklist(json.data);
    } catch {
      /* ignore */
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchConfig();
    fetchChecklist();
  }, [fetchConfig, fetchChecklist]);

  const handleSubmitConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setConfigError(null);
    try {
      const body: Record<string, unknown> = {
        environment: formData.environment,
        enabled: formData.enabled,
      };
      // Only send secrets if filled (partial update)
      if (formData.clientId.trim()) body.clientId = formData.clientId.trim();
      if (formData.clientSecret.trim()) body.clientSecret = formData.clientSecret.trim();
      if (formData.username.trim()) body.username = formData.username.trim();
      if (formData.password.trim()) body.password = formData.password.trim();

      const res = await apiFetch('/api/banco-chile/config', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error guardando configuración');
      }
      setShowConfig(false);
      await fetchConfig();
      await fetchChecklist();
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  const testAuth = async () => {
    setTestingAuth(true);
    setConfigError(null);
    try {
      const res = await apiFetch('/api/banco-chile/auth', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Auth falló');
      }
      await fetchChecklist();
      await fetchConfig();
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : 'Error de auth');
    } finally {
      setTestingAuth(false);
    }
  };

  const sincronizarCuentas = async () => {
    setSyncing(true);
    try {
      // Pull from Banco Chile API via BFF (upserts local rows)
      const res = await apiFetch('/api/banco-chile/cuentas');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error sync cuentas');
      }
      const json = await res.json();
      const list = json.data ?? json.cuentas ?? [];
      // Map API shape → UI; prefer local list via second path if needed
      setCuentas(
        (Array.isArray(list) ? list : []).map(
          (c: {
            id?: string;
            numeroCuenta?: string;
            numero_cuenta?: string;
            tipoCuenta?: string;
            tipo_cuenta?: string;
            saldoDisponible?: number;
            saldo_disponible?: number;
            saldoContable?: number;
            saldo_contable?: number;
            activa?: boolean;
          }, i: number) => ({
            id: c.id ?? String(i),
            numero_cuenta: c.numero_cuenta ?? c.numeroCuenta ?? '—',
            tipo_cuenta: c.tipo_cuenta ?? c.tipoCuenta ?? '—',
            saldo_disponible: Number(c.saldo_disponible ?? c.saldoDisponible ?? 0),
            saldo_contable: Number(c.saldo_contable ?? c.saldoContable ?? 0),
            activa: c.activa !== false,
          }),
        ),
      );
      await fetchChecklist();
    } catch (err) {
      console.error('Error sincronizando cuentas:', err);
      setConfigError(err instanceof Error ? err.message : 'Sync falló');
    } finally {
      setSyncing(false);
    }
  };

  const fetchMovimientos = useCallback(
    async (cuentaId?: string) => {
      try {
        if (!cuentaId) return;
        const res = await apiFetch(`/api/banco-chile/movimientos/${cuentaId}?limite=50`);
        if (!res.ok) return;
        const json = await res.json();
        const list = json.data ?? json.movimientos ?? [];
        setMovimientos(
          (Array.isArray(list) ? list : []).map(
            (m: {
              id?: string;
              fechaContable?: string;
              fecha_contable?: string;
              descripcion?: string;
              monto?: number;
              tipo?: string;
              conciliado?: boolean;
            }, i: number) => ({
              id: m.id ?? String(i),
              fecha_contable: m.fecha_contable ?? m.fechaContable ?? '',
              descripcion: m.descripcion ?? '',
              monto: Number(m.monto ?? 0),
              tipo: m.tipo ?? '',
              conciliado: Boolean(m.conciliado),
            }),
          ),
        );
      } catch (err) {
        console.error('Error fetching movimientos:', err);
      }
    },
    [apiFetch],
  );

  useEffect(() => {
    if (config?.enabled) {
      sincronizarCuentas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once when enabled
  }, [config?.enabled]);

  if (loading) {
    return <ViewLoading variant="view" label="Banco Chile" hideLabel />;
  }

  return (
    <div className="space-y-8">
      <ViewShell
        variant="compact"
        eyebrow="Finanzas"
        title="Banco Chile Empresas"
        subtitle="Credenciales y sync se configuran en la app (BFF cifrado) — sin SQL ni secretos en el browser."
        icon={<Building2 size={20} />}
      />
      <ToolActionRail context="banco" current="/banco" />

      {checklist && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            <h2 className="font-display text-base">Checklist go-live Banco Chile</h2>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                checklist.listoOperacion
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-warning/10 text-warning border-warning/20'
              }`}
            >
              {checklist.listoOperacion ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
              {checklist.listoOperacion
                ? 'listo operación'
                : `${checklist.criticosPendientes} crítico(s)`}
            </span>
            <Badge variant="default">{checklist.environment ?? 'sin env'}</Badge>
          </div>
          <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {checklist.items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 px-3 py-2 text-sm bg-surface-sunken/40">
                {item.cumplido ? (
                  <CheckCircle size={16} className="mt-0.5 shrink-0 text-primary" />
                ) : (
                  <Circle
                    size={16}
                    className={`mt-0.5 shrink-0 ${item.critico ? 'text-warning' : 'text-muted-foreground'}`}
                  />
                )}
                <div>
                  <span className="font-medium">{item.titulo}</span>
                  {item.detalle && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.detalle}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {configError && (
        <p className="text-sm text-destructive font-medium max-w-3xl">{configError}</p>
      )}

      {!config ? (
        <div className="bg-card border border-border rounded-2xl p-6 max-w-3xl">
          <h2 className="font-display text-lg mb-3">Configurar Banco Chile</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Credenciales API Store (client id/secret + usuario/clave). Se guardan cifradas vía BFF —
            no se escriben desde el browser a Supabase.
          </p>
          <button
            type="button"
            onClick={() => setShowConfig(true)}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-bold"
          >
            Configurar ahora
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${config.enabled ? 'bg-primary' : 'bg-muted'}`} />
              <div>
                <p className="font-medium text-sm">
                  {config.enabled ? 'Habilitado' : 'Deshabilitado'}
                  {hasCredentials ? ' · credenciales OK' : ' · sin credenciales'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Ambiente: {config.environment}
                  {encryptionReady ? ' · cifrado runtime OK' : ' · falta SII_CLAVE_ENCRYPTION_KEY'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => testAuth()}
                disabled={testingAuth}
                className="p-2 hover:bg-secondary rounded-lg disabled:opacity-50"
                title="Probar OAuth"
              >
                {testingAuth ? <HexagonLoader size="sm" /> : <Plug size={18} />}
              </button>
              <button
                type="button"
                onClick={() => setShowConfig(true)}
                className="p-2 hover:bg-secondary rounded-lg"
              >
                <Settings size={18} />
              </button>
              <button
                type="button"
                onClick={sincronizarCuentas}
                disabled={syncing}
                className="p-2 hover:bg-secondary rounded-lg disabled:opacity-50"
              >
                {syncing ? <HexagonLoader size="sm" /> : <RefreshCw size={18} />}
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-display text-lg mb-4">Cuentas Bancarias</h2>
            {cuentas.length > 0 ? (
              <div className="grid gap-4">
                {cuentas.map((cuenta) => (
                  <div
                    key={cuenta.id}
                    className="border border-border rounded-xl p-4 hover:border-accent/20 transition-all cursor-pointer"
                    onClick={() => fetchMovimientos(cuenta.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{cuenta.numero_cuenta}</p>
                        <p className="text-xs text-muted-foreground capitalize">{cuenta.tipo_cuenta}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatCurrency(cuenta.saldo_disponible)}</p>
                        <p className="text-xs text-muted-foreground">
                          Contable: {formatCurrency(cuenta.saldo_contable)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay cuentas sincronizadas</p>
            )}
          </div>

          <div className="card overflow-hidden p-0">
            <div className="p-4 border-b border-border">
              <h2 className="font-display text-lg">Movimientos Recientes</h2>
            </div>
            <EnjTableShell>
            <table className="w-full data-table">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground">Descripción</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">Monto</th>
                  <th className="px-4 py-3 text-center text-xs text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Sin movimientos
                    </td>
                  </tr>
                ) : (
                  movimientos.map((mov) => (
                    <tr key={mov.id} className="border-b border-border/50 hover:bg-secondary/50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(mov.fecha_contable).toLocaleDateString('es-CL')}
                      </td>
                      <td className="px-4 py-3 text-sm">{mov.descripcion}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {formatCurrency(mov.monto)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          mov.conciliado
            ? 'bg-primary/10 text-primary'
            : 'bg-primary/10 text-primary'
                        }`}>
                          {mov.conciliado ? 'Conciliado' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </EnjTableShell>
          </div>
        </div>
      )}

      <ImmersiveModal
        open={showConfig}
        onClose={() => setShowConfig(false)}
        eyebrow="Integración bancaria"
        title="Configurar Banco Chile"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowConfig(false)}
              className="btn btn-outline btn-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="banco-chile-config-form"
              className="btn btn-primary btn-sm"
              disabled={saving}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </>
        }
      >
        <form id="banco-chile-config-form" onSubmit={handleSubmitConfig} className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Secretos vía BFF cifrado. En re-guardado, dejá vacío un campo para conservar el valor actual.
            {hasCredentials ? ' · Ya hay credenciales guardadas.' : ' · Primera config: completá los 4 secretos.'}
          </p>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Client ID</label>
            <input
              type="text"
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              required={!hasCredentials}
              autoComplete="off"
              placeholder={hasCredentials ? '•••• (sin cambiar)' : ''}
            />
          </div>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Client Secret</label>
            <input
              type="password"
              value={formData.clientSecret}
              onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              required={!hasCredentials}
              autoComplete="new-password"
              placeholder={hasCredentials ? '•••• (sin cambiar)' : ''}
            />
          </div>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              required={!hasCredentials}
              autoComplete="off"
              placeholder={hasCredentials ? '•••• (sin cambiar)' : ''}
            />
          </div>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              required={!hasCredentials}
              autoComplete="new-password"
              placeholder={hasCredentials ? '•••• (sin cambiar)' : ''}
            />
          </div>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Ambiente</label>
            <select
              value={formData.environment}
              onChange={(e) => setFormData({
                ...formData,
                environment: e.target.value as 'sandbox' | 'production',
              })}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="sandbox">Sandbox (Pruebas)</option>
              <option value="production">Producción</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="bc-enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="bc-enabled" className="text-sm">Habilitar integración</label>
          </div>
        </form>
      </ImmersiveModal>
    </div>
  );
}
