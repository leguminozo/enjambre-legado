import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Building2, Settings, RefreshCw, DollarSign, Loader2, Check, X, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@enjambre/auth';
import { formatCurrency } from '@/lib/format';
import { ViewShell } from '@/components/layout/ViewShell';
import { EnjTableShell } from '@/components/layout/EnjTableShell';

interface BancoChileConfig {
  id: string;
  empresa_id: string;
  enabled: boolean;
  environment: 'sandbox' | 'production';
  last_sync?: string;
  hasCredentials?: boolean;
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
  const [config, setConfig] = useState<BancoChileConfig | null>(null);
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoBancario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [syncing, setSyncing] = useState(false);
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
      const user = useAuthStore.getState().user;
      if (!user) return;

      const { data, error } = await supabase
        .from('banco_chile_config')
        .select('*')
        .eq('empresa_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching config:', error.message);
        return;
      }
      if (data) setConfig(data as BancoChileConfig);
    } catch (err) {
      console.error('Error fetching config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSubmitConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = useAuthStore.getState().user;
      if (!user) return;

      const { error } = await supabase
        .from('banco_chile_config')
        .upsert({
          empresa_id: user.id,
          client_id: formData.clientId,
          client_secret: formData.clientSecret,
          username: formData.username,
          password: formData.password,
          environment: formData.environment,
          enabled: formData.enabled,
        });

      if (error) throw error;

      setShowConfig(false);
      await fetchConfig();
    } catch (err) {
      console.error('Error saving config:', err);
    }
  };

  const sincronizarCuentas = async () => {
    setSyncing(true);
    try {
      const user = useAuthStore.getState().user;
      if (!user) return;

      const { data, error } = await supabase
        .from('banco_chile_cuentas')
        .select('*')
        .eq('empresa_id', user.id);

      if (error) throw error;
      setCuentas(Array.isArray(data) ? (data as CuentaBancaria[]) : []);
    } catch (err) {
      console.error('Error sincronizando cuentas:', err);
    } finally {
      setSyncing(false);
    }
  };

  const fetchMovimientos = useCallback(async (cuentaId?: string) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return;

      let query = supabase
        .from('banco_chile_movimientos')
        .select('*')
        .eq('empresa_id', user.id)
        .order('fecha_contable', { ascending: false })
        .limit(50);

      if (cuentaId) query = query.eq('cuenta_id', cuentaId);

      const { data, error } = await query;

      if (error) throw error;
      setMovimientos(Array.isArray(data) ? (data as MovimientoBancario[]) : []);
    } catch (err) {
      console.error('Error fetching movimientos:', err);
    }
  }, []);

  useEffect(() => {
    if (config?.enabled) {
      sincronizarCuentas();
      fetchMovimientos();
    }
  }, [config?.enabled]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ViewShell
        variant="compact"
        eyebrow="Finanzas"
        title="Banco Chile Empresas"
        subtitle="Cuentas, movimientos y conciliación bancaria"
        icon={<Building2 size={20} />}
      />

      {!config ? (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-display text-lg mb-3">Configurar Banco Chile</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Necesitas configurar tus credenciales de Banco Chile Empresas para comenzar.
          </p>
          <button
            onClick={() => setShowConfig(true)}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-bold"
          >
            Configurar ahora
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${config.enabled ? 'bg-primary' : 'bg-muted'}`} />
              <div>
                <p className="font-medium text-sm">{config.enabled ? 'Conectado' : 'Desconectado'}</p>
                <p className="text-xs text-muted-foreground">Ambiente: {config.environment}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfig(true)}
                className="p-2 hover:bg-secondary rounded-lg"
              >
                <Settings size={18} />
              </button>
              <button
                onClick={sincronizarCuentas}
                disabled={syncing}
                className="p-2 hover:bg-secondary rounded-lg disabled:opacity-50"
              >
                {syncing ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
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

      {showConfig && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4">
            <h2 className="font-display text-lg mb-4">Configurar Banco Chile</h2>
            <form onSubmit={handleSubmitConfig} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Client ID</label>
                <input
                  type="text"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Client Secret</label>
                <input
                  type="password"
                  value={formData.clientSecret}
                  onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Ambiente</label>
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
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  className="flex-1 px-4 py-2 bg-secondary border border-border rounded-lg text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
