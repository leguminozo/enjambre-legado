import { useState } from 'react';
import { BarChart3, Shield, Sparkles, ShoppingCart, Package, Building2, TrendingUp } from 'lucide-react';
import { EjecutivoPanel } from '../components/gerente/EjecutivoPanel';
import VanguardiaPanel from '../components/vanguardia/VanguardiaPanel';
import { CreadoresAdminPanel } from '../components/creadores/CreadoresAdminPanel';
import { TiendaPanel } from '../components/tienda/TiendaPanel';
import { BancoChileView } from '../views/banco-chile';
import ContableView from './ContableView';

type Tab = 'dashboard' | 'tienda' | 'contable' | 'banco' | 'vanguardia' | 'creadores';

export default function NucleoView() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const tabs: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { key: 'dashboard', icon: <BarChart3 size={18} />, label: 'Dashboard' },
    { key: 'tienda', icon: <Package size={18} />, label: 'Tienda' },
    { key: 'contable', icon: <TrendingUp size={18} />, label: 'Contable' },
    { key: 'banco', icon: <Building2 size={18} />, label: 'Banco' },
    { key: 'vanguardia', icon: <Shield size={18} />, label: 'Vanguardia' },
    { key: 'creadores', icon: <Sparkles size={18} />, label: 'Creadores' },
  ];

  return (
    <div className="space-y-8">
      <div className="hero-banner animate-in">
        <h1 className="hero-title">Núcleo · Enjambre Legado</h1>
        <p className="hero-subtitle">Centro de mando unificado</p>
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
      {activeTab === 'banco' && <BancoChileView />}
      {activeTab === 'vanguardia' && <VanguardiaPanel />}
      {activeTab === 'creadores' && <CreadoresAdminPanel />}
    </div>
  );
}
