'use client';

import { useState, useEffect, useCallback } from 'react';
import { ContableView } from '@/views/ContableView';
import { ListaFacturas } from '@/views/eirl/facturas/ListaFacturas';
import { ListaGastos } from '@/views/eirl/gastos/ListaGastos';
import { MetricasCards } from '@/views/eirl/dashboard/MetricasCards';
import { ResumenActividad } from '@/views/eirl/dashboard/ResumenActividad';
import { useApiFetch } from '@/lib/use-api-fetch';
import { Calculator, FileText, ShoppingCart, BarChart3 } from 'lucide-react';

const tabs = [
  { id: 'resumen', label: 'Resumen', icon: BarChart3 },
  { id: 'facturas', label: 'Facturas', icon: FileText },
  { id: 'gastos', label: 'Gastos', icon: ShoppingCart },
  { id: 'contable', label: 'Contable', icon: Calculator },
] as const;

type TabId = typeof tabs[number]['id'];

interface DashboardData {
  metricas: {
    ingresosMes: number;
    gastosMes: number;
    utilidadNeta: number;
    margenUtilidad: number;
    ivaPagar: number;
    ppm: number;
  };
  resumen: {
    totalFacturasEmitidas: number;
    totalFacturasRecibidas: number;
    totalGastos: number;
    facturasPendientes: number;
  };
}

export default function ContablePage() {
  const [activeTab, setActiveTab] = useState<TabId>('resumen');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const apiFetch = useApiFetch();

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
      <div className="flex gap-2 border-b border-border pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-primary/10 text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

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
      {activeTab === 'facturas' && <ListaFacturas facturasInitiales={[]} empresaId="" />}
      {activeTab === 'gastos' && <ListaGastos onNuevoGasto={() => {}} onVerGasto={() => {}} onEditarGasto={() => {}} />}
      {activeTab === 'contable' && <ContableView />}
    </div>
  );
}
