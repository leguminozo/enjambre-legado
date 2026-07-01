'use client';

import { useState, useEffect, useCallback } from 'react';
import { ListaFacturas } from '@/views/eirl/facturas/ListaFacturas';
import { ListaGastos, type Gasto } from '@/views/eirl/gastos/ListaGastos';
import { NuevoGastoForm } from '@/views/eirl/gastos/NuevoGastoForm';
import { MetricasCards } from '@/views/eirl/dashboard/MetricasCards';
import { ResumenActividad } from '@/views/eirl/dashboard/ResumenActividad';
import { ContableView } from '@/views/ContableView';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { useAuthStore } from '@enjambre/auth';
import { Calculator, FileText, ShoppingCart, BarChart3 } from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';

const tabs = [
  { id: 'resumen', label: 'Resumen', icon: BarChart3 },
  { id: 'facturas', label: 'Facturas', icon: FileText },
  { id: 'gastos', label: 'Gastos', icon: ShoppingCart },
  { id: 'contable', label: 'Contable', icon: Calculator },
] as const;

type TabId = (typeof tabs)[number]['id'];

interface DashboardData {
  metricas: {
    ingresosMes: number;
    gastosMes: number;
    utilidadNeta: number;
    margenUtilidad: number;
    ivaPagar: number;
    ppm: number;
    ingresosVariacionPct?: number | null;
    gastosVariacionPct?: number | null;
  };
  resumen: {
    totalFacturasEmitidas: number;
    totalFacturasRecibidas: number;
    totalGastos: number;
    facturasPendientes: number;
  };
}

export function ContableHubView() {
  const [activeTab, setActiveTab] = useState<TabId>('resumen');
  const [gastoMode, setGastoMode] = useState<'list' | 'new' | 'edit'>('list');
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
  const [gastosKey, setGastosKey] = useState(0);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const apiFetch = useApiFetch();
  const empresaId = useAuthStore((s) => s.session?.user?.app_metadata?.empresa_id ?? '');

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/eirl-dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error('[contable] fetch error:', error);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const m = dashboard?.metricas;
  const r = dashboard?.resumen;

  return (
    <div className="space-y-6">
      <ViewShell
        eyebrow="Finanzas"
        title="Contable EIRL"
        subtitle="Resumen, facturas, gastos y libro contable"
        icon={<Calculator size={20} />}
        variant="compact"
      />

      <ResponsiveTabBar
        layoutId="contable-tabs"
        tabs={tabs.map((tab) => ({
          id: tab.id,
          label: tab.label,
          icon: <tab.icon size={16} />,
        }))}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
      />

      {activeTab === 'resumen' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-muted-foreground text-sm">Cargando métricas...</div>
          ) : (
            <>
              <MetricasCards
                ingresosMes={m?.ingresosMes ?? 0}
                gastosMes={m?.gastosMes ?? 0}
                utilidadNeta={m?.utilidadNeta ?? 0}
                margenUtilidad={m?.margenUtilidad ?? 0}
                ivaPagar={m?.ivaPagar ?? 0}
                ppm={m?.ppm ?? 0}
                ingresosVariacionPct={m?.ingresosVariacionPct}
                gastosVariacionPct={m?.gastosVariacionPct}
              />
              <ResumenActividad
                totalFacturasEmitidas={r?.totalFacturasEmitidas ?? 0}
                totalFacturasRecibidas={r?.totalFacturasRecibidas ?? 0}
                totalGastos={r?.totalGastos ?? 0}
                facturasPendientes={r?.facturasPendientes ?? 0}
              />
            </>
          )}
        </div>
      )}
      {activeTab === 'facturas' && <ListaFacturas empresaId={empresaId} />}
      {activeTab === 'gastos' && (
        gastoMode === 'new' || gastoMode === 'edit' ? (
          <NuevoGastoForm
            gasto={gastoMode === 'edit' ? editingGasto : null}
            onSave={() => {
              setGastoMode('list');
              setEditingGasto(null);
              setGastosKey((k) => k + 1);
              fetchDashboard();
            }}
            onCancel={() => {
              setGastoMode('list');
              setEditingGasto(null);
            }}
          />
        ) : (
          <ListaGastos
            key={gastosKey}
            onNuevoGasto={() => {
              setEditingGasto(null);
              setGastoMode('new');
            }}
            onVerGasto={() => {}}
            onEditarGasto={(gasto) => {
              setEditingGasto(gasto);
              setGastoMode('edit');
            }}
            onDeleted={fetchDashboard}
          />
        )
      )}
      {activeTab === 'contable' && <ContableView />}
    </div>
  );
}