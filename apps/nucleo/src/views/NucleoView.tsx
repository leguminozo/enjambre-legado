import { useState } from 'react';
import { BarChart3, Shield, Sparkles, Package, TrendingUp, FileText } from 'lucide-react';
import { EjecutivoPanel } from '../components/gerente/EjecutivoPanel';
import VanguardiaPanel from '../components/vanguardia/VanguardiaPanel';
import { CreadoresAdminPanel } from '../components/creadores/CreadoresAdminPanel';
import { TiendaPanel } from '../components/tienda/TiendaPanel';
import ContableView from './ContableView';
import SiiDteView from './SiiDteView';

type Tab = 'dashboard' | 'tienda' | 'contable' | 'sii' | 'vanguardia' | 'creadores';

export default function NucleoView() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const tabs: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { key: 'dashboard', icon: <BarChart3 size={18} />, label: 'Panel Central' },
    { key: 'tienda', icon: <Package size={18} />, label: 'Tienda' },
    { key: 'contable', icon: <TrendingUp size={18} />, label: 'Contable' },
    { key: 'sii', icon: <FileText size={18} />, label: 'SII DTE' },
    { key: 'vanguardia', icon: <Shield size={18} />, label: 'Vanguardia' },
    { key: 'creadores', icon: <Sparkles size={18} />, label: 'Creadores' },
  ];

  return (
    <div className="space-y-8">
      <div className="hero-banner animate-in">
        <h1 className="hero-title">Núcleo · Enjambre Legado</h1>
        <p className="hero-subtitle">Corazón operativo del enjambre</p>
      </div>

      <div className="flex gap-4 mb-8 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`btn flex items-center gap-2 ${activeTab === tab.key ? 'btn-gold' : 'btn-outline'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && <EjecutivoPanel />}
      {activeTab === 'tienda' && <TiendaPanel />}
      {activeTab === 'contable' && <ContableView />}
      {activeTab === 'sii' && <SiiDteView />}
      {activeTab === 'vanguardia' && <VanguardiaPanel />}
      {activeTab === 'creadores' && <CreadoresAdminPanel />}
    </div>
  );
}
