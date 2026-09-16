'use client';

import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Sprout, Users, PackageOpen, Flame, FlaskConical, Factory, Users2, ListChecks,
  Calculator,
} from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { InfusionesResumenPanel } from '@/components/infusiones/InfusionesResumenPanel';
import { MateriasPrimasPanel } from '@/components/infusiones/MateriasPrimasPanel';
import { ProveedoresPanel } from '@/components/infusiones/ProveedoresPanel';
import { LotesEntradaPanel } from '@/components/infusiones/LotesEntradaPanel';
import { LotesDeshidratadoPanel } from '@/components/infusiones/LotesDeshidratadoPanel';
import { FormulasPanel } from '@/components/infusiones/FormulasPanel';
import { ProduccionPanel } from '@/components/infusiones/ProduccionPanel';
import { EquipoPanel } from '@/components/infusiones/EquipoPanel';
import { TareasPanel } from '@/components/infusiones/TareasPanel';
import { CostosPlanPanel } from '@/components/infusiones/CostosPlanPanel';

const INFUSION_TABS = ['resumen', 'materias', 'proveedores', 'entrada', 'deshidratado', 'formulas', 'produccion', 'equipo', 'tareas', 'costos'] as const;
type Tab = (typeof INFUSION_TABS)[number];

/**
 * Infusiones — trazabilidad de hierbas: entrada → deshidratado → stock seco →
 * fórmula → lote de producción. Cada paso tiene responsable y traza hacia atrás.
 */
export function InfusionesView() {
  const [activeTab, setActiveTab] = useState<Tab>('resumen');
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    if (t && (INFUSION_TABS as readonly string[]).includes(t)) setActiveTab(t as Tab);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Producción"
        title="Infusiones"
        subtitle="Hierbas e infusiones: cuánto fresco entra, cuánto seco se registra, qué fórmula lo mezcla y qué sachets salen — trazable y delegable en cada paso."
        icon={<Sprout size={20} />}
      />

      <ResponsiveTabBar
        variant="pill"
        layoutId="infusiones-tabs"
        tabs={[
          { id: 'resumen', label: 'Resumen', icon: <LayoutDashboard size={16} /> },
          { id: 'materias', label: 'Materias primas', icon: <Sprout size={16} /> },
          { id: 'proveedores', label: 'Proveedores', icon: <Users size={16} /> },
          { id: 'entrada', label: 'Lotes de entrada', icon: <PackageOpen size={16} /> },
          { id: 'deshidratado', label: 'Deshidratación', icon: <Flame size={16} /> },
          { id: 'formulas', label: 'Fórmulas', icon: <FlaskConical size={16} /> },
          { id: 'produccion', label: 'Producción', icon: <Factory size={16} /> },
          { id: 'equipo', label: 'Equipo', icon: <Users2 size={16} /> },
          { id: 'tareas', label: 'Tareas', icon: <ListChecks size={16} /> },
          { id: 'costos', label: 'Costos y Plan', icon: <Calculator size={16} /> },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as Tab)}
      />

      {activeTab === 'resumen' && <InfusionesResumenPanel />}
      {activeTab === 'materias' && <MateriasPrimasPanel />}
      {activeTab === 'proveedores' && <ProveedoresPanel />}
      {activeTab === 'entrada' && <LotesEntradaPanel />}
      {activeTab === 'deshidratado' && <LotesDeshidratadoPanel />}
      {activeTab === 'formulas' && <FormulasPanel />}
      {activeTab === 'produccion' && <ProduccionPanel />}
      {activeTab === 'equipo' && <EquipoPanel />}
      {activeTab === 'tareas' && <TareasPanel />}
      {activeTab === 'costos' && <CostosPlanPanel />}
    </div>
  );
}
