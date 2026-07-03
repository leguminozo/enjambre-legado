import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast, ViewLoading } from '@enjambre/ui';

interface ResumenEjecutivo {
  totalCuentas: number;
  saldoTotal: number;
  movimientosPendientes: number;
  transferenciasHoy: number;
  montosTransferidosHoy: number;
  conciliacionesPendientes: number;
  documentosPendientes: number;
  nominaProxima: string | null;
}

interface CuentaResumen {
  numero_cuenta: string;
  tipo_cuenta: string;
  saldo_disponible: number;
  movimientos_hoy: number;
}

interface MovimientoReciente {
  id: string;
  fecha_contable: string;
  descripcion: string;
  monto: number;
  tipo: string;
  conciliado: boolean;
}

export function DashboardBancoChile() {
  const [resumen, setResumen] = useState<ResumenEjecutivo | null>(null);
  const [cuentas, setCuentas] = useState<CuentaResumen[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoReciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [sugerenciasConciliacion, setSugerenciasConciliacion] = useState<number>(0);

  useEffect(() => {
    if (!supabase) return;
    fetchDashboard();
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchDashboard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDashboard() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: { session } } = await supabase.auth.getSession();

      // Obtener resumen
      const { data: resumenData } = await supabase
        .from('banco_chile_cuentas')
        .select('saldo_disponible')
        .eq('empresa_id', user.id)
        .eq('activa', true);

      const { count: cuentasCount } = await supabase
        .from('banco_chile_cuentas')
        .select('*', { count: 'exact' })
        .eq('empresa_id', user.id)
        .eq('activa', true);

      const { count: movsCount } = await supabase
        .from('banco_chile_movimientos')
        .select('*', { count: 'exact' })
        .eq('empresa_id', user.id)
        .is('conciliado', false);

      const { count: conciliacionesCount } = await supabase
        .from('banco_chile_movimientos')
        .select('*', { count: 'exact' })
        .eq('empresa_id', user.id)
        .is('conciliado', false);

      const { count: documentosCount } = await supabase
        .from('banco_chile_documentos')
        .select('*', { count: 'exact' })
        .eq('empresa_id', user.id)
        .eq('estado', 'pendiente');

      // Calcular saldo total
      const saldoTotal = resumenData?.reduce((acc: number, c: Record<string, unknown>) => acc + (Number(c.saldo_disponible) || 0), 0) || 0;

      setResumen({
        totalCuentas: cuentasCount || 0,
        saldoTotal: saldoTotal,
        movimientosPendientes: movsCount || 0,
        transferenciasHoy: 0, // Implementar query para hoy
        montosTransferidosHoy: 0,
        conciliacionesPendientes: conciliacionesCount || 0,
        documentosPendientes: documentosCount || 0,
        nominaProxima: null,
      });

      // Obtener cuentas con saldo
      const { data: cuentasData } = await supabase
        .from('banco_chile_cuentas')
        .select('*')
        .eq('empresa_id', user.id)
        .eq('activa', true)
        .limit(10);

      if (cuentasData) {
        setCuentas(Array.isArray(cuentasData) ? (cuentasData as CuentaResumen[]) : []);
      }

      // Obtener movimientos recientes
      const { data: movsData } = await supabase
        .from('banco_chile_movimientos')
        .select('*')
        .eq('empresa_id', user.id)
        .order('fecha_contable', { ascending: false })
        .limit(10);

      if (movsData) {
        setMovimientos(Array.isArray(movsData) ? (movsData as MovimientoReciente[]) : []);
      }

      // Obtener sugerencias de conciliación
      const response = await fetch('/api/banco-chile/conciliacion-auto/sugerencias', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'x-empresa-id': user.id,
        },
      });
      const sugerencias = await response.json();
      setSugerenciasConciliacion(sugerencias.total || 0);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function autoConciliar() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/banco-chile/conciliacion-auto/auto-conciliar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'x-empresa-id': user.id,
        },
        body: JSON.stringify({ confianzaMinima: 'media' }),
      });

      const result = await response.json();
      if (result.success) {
        toast(`Se conciliaron ${result.conciliados} movimientos automáticamente`, { type: 'success' });
        fetchDashboard();
      }
    } catch (error) {
console.error('Error auto-conciliando:', error);
		toast('Error al auto-conciliar', { type: 'error' });
    }
  }

  if (loading) {
    return <ViewLoading variant="view" label="Dashboard bancario" hideLabel />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Dashboard Banco Chile
        </h1>
        <p className="text-muted-foreground">
          Vista ejecutiva de tu banca empresarial
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ResumenCard
          title="Saldo Total"
          value={`$${resumen?.saldoTotal.toLocaleString('es-CL') || '0'}`}
          subtitle={`${resumen?.totalCuentas || 0} cuentas activas`}
          icon="💰"
          color="bg-success"
        />
        <ResumenCard
          title="Pendientes Conciliar"
          value={resumen?.conciliacionesPendientes || 0}
          subtitle="Movimientos sin conciliar"
          icon="📋"
          color="bg-warning"
        />
        <ResumenCard
          title="Documentos"
          value={resumen?.documentosPendientes || 0}
          subtitle="Por revisar"
          icon="📄"
          color="bg-info"
        />
        <ResumenCard
          title="Sugerencias"
          value={sugerenciasConciliacion}
          subtitle="Conciliaciones sugeridas"
          icon="✨"
          color="bg-accent"
          action={sugerenciasConciliacion > 0 ? autoConciliar : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cuentas */}
        <div className="bg-card rounded-lg p-4 border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Cuentas Bancarias</h2>
            <button
              onClick={fetchDashboard}
              className="text-sm text-primary hover:underline"
            >
              Actualizar
            </button>
          </div>
          {cuentas.length > 0 ? (
            <div className="space-y-3">
              {cuentas.map((cuenta) => (
                <div
                  key={cuenta.numero_cuenta}
                  className="border rounded p-3 hover:bg-accent transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{cuenta.numero_cuenta}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {cuenta.tipo_cuenta}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        ${cuenta.saldo_disponible.toLocaleString('es-CL')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cuenta.movimientos_hoy || 0} movs hoy
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No hay cuentas registradas
            </p>
          )}
        </div>

        {/* Movimientos recientes */}
        <div className="bg-card rounded-lg p-4 border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Últimos Movimientos</h2>
            <span className="text-xs text-muted-foreground">
              {movimientos.length} movimientos
            </span>
          </div>
          {movimientos.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {movimientos.map((mov) => (
                <div
                  key={mov.id}
                  className={`flex justify-between items-center p-2 border-b last:border-0 ${
                    !mov.conciliado ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {mov.descripcion}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(mov.fecha_contable).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <p
                      className={`font-bold ${
                        mov.monto > 0 ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {mov.monto > 0 ? '+' : ''}
                      ${mov.monto.toLocaleString('es-CL')}
                    </p>
                    <p className="text-xs">
                      {mov.conciliado ? (
<span className="text-success">✓ Conciliado</span>
                ) : (
                <span className="text-warning">⏳ Pendiente</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No hay movimientos recientes
            </p>
          )}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="mt-6 bg-card rounded-lg p-4 border">
        <h2 className="text-lg font-semibold mb-4">Acciones Rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="/banco-chile/transferencias"
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
          >
            Nueva Transferencia
          </a>
          <a
            href="/banco-chile/conciliacion"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:opacity-90 transition-opacity"
          >
            Conciliación Manual
          </a>
          <a
            href="/banco-chile/documentos"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:opacity-90 transition-opacity"
          >
            Revisar Documentos
          </a>
          <a
            href="/banco-chile/nominas"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:opacity-90 transition-opacity"
          >
            Gestionar Nóminas
          </a>
        </div>
      </div>
    </div>
  );
}

function ResumenCard({
  title,
  value,
  subtitle,
  icon,
  color,
  action,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: string;
  action?: () => void;
}) {
  return (
    <div className="bg-card rounded-lg p-4 border relative overflow-hidden">
      <div className={`absolute top-0 right-0 p-4 opacity-10 ${color}`}>
        <span className="text-4xl">{icon}</span>
      </div>
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        </div>
        <p className="text-2xl font-bold mb-1">{value}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        {action && (
          <button
            onClick={action}
            className="mt-2 text-xs bg-primary text-primary-foreground px-3 py-1 rounded hover:opacity-90"
          >
            Auto-conciliar
          </button>
        )}
      </div>
    </div>
  );
}


