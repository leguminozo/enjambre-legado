'use client';

import { useEffect, useState } from 'react';
import {
  Store, Users2, Package, ShoppingCart, Gift, Radar, FileText,
} from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { PuntosVentaPanel } from '@/components/microcanales/PuntosVentaPanel';
import { RevendedoresPanel } from '@/components/microcanales/RevendedoresPanel';
import { SetsPanel } from '@/components/microcanales/SetsPanel';
import { PedidosPanel } from '@/components/microcanales/PedidosPanel';
import { FidelizacionPanel } from '@/components/microcanales/FidelizacionPanel';
import { PercepcionPanel } from '@/components/microcanales/PercepcionPanel';
import { CondicionesComercialesPanel } from '@/components/microcanales/CondicionesComercialesPanel';

const MICRO_TABS = ['puntos', 'revendedores', 'sets', 'pedidos', 'fidelizacion', 'percepcion', 'condiciones'] as const;
type Tab = (typeof MICRO_TABS)[number];

/**
 * Microcanales — B2B (puntos de venta, revendedores, sets, pedidos) +
 * condiciones comerciales y cotizador B2B +
 * fidelización segmentada (retribución al por mayor + wallet del consumidor) +
 * percepción semántica profunda (instrumento CATA, reseñas profundas).
 */
export function MicrocanalesView() {
  const [activeTab, setActiveTab] = useState<Tab>('puntos');
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    if (t && (MICRO_TABS as readonly string[]).includes(t)) setActiveTab(t as Tab);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Mercado"
        title="Microcanales"
        subtitle="Cafés, tiendas, hoteles y revendedores: sets de entrada, condiciones comerciales editables, retribución al por mayor y fidelización del consumidor."
        icon={<Store size={20} />}
      />

      <ResponsiveTabBar
        variant="pill"
        layoutId="microcanales-tabs"
        tabs={[
          { id: 'puntos', label: 'Puntos de venta', icon: <Store size={16} /> },
          { id: 'revendedores', label: 'Revendedores', icon: <Users2 size={16} /> },
          { id: 'condiciones', label: 'Condiciones B2B', icon: <FileText size={16} /> },
          { id: 'sets', label: 'Sets', icon: <Package size={16} /> },
          { id: 'pedidos', label: 'Pedidos', icon: <ShoppingCart size={16} /> },
          { id: 'fidelizacion', label: 'Fidelización', icon: <Gift size={16} /> },
          { id: 'percepcion', label: 'Percepción', icon: <Radar size={16} /> },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as Tab)}
      />

      {activeTab === 'puntos' && <PuntosVentaPanel />}
      {activeTab === 'revendedores' && <RevendedoresPanel />}
      {activeTab === 'condiciones' && <CondicionesComercialesPanel />}
      {activeTab === 'sets' && <SetsPanel />}
      {activeTab === 'pedidos' && <PedidosPanel />}
      {activeTab === 'fidelizacion' && <FidelizacionPanel />}
      {activeTab === 'percepcion' && <PercepcionPanel />}
    </div>
  );
}
