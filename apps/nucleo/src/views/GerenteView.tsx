import { useState } from 'react';
import { BarChart3, Shield, Sparkles, ShoppingCart } from 'lucide-react';
import { roleGreetings } from '../data/mockData';
import { EjecutivoPanel } from '../components/gerente/EjecutivoPanel';
import VanguardiaPanel from '../components/vanguardia/VanguardiaPanel';
import { CreadoresAdminPanel } from '../components/creadores/CreadoresAdminPanel';
import { TiendaPanel } from '../components/tienda/TiendaPanel';

export default function GerenteView() {
  const { greeting, title, subtitle } = roleGreetings.gerente;
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tienda' | 'vanguardia' | 'creadores'>('dashboard');

  return (
    <div className="space-y-8">
      <div className="hero-banner animate-in">
        <div className="hero-greeting">{greeting}</div>
        <h1 className="hero-title">{title}</h1>
        <p className="hero-subtitle">{subtitle}</p>
      </div>

      <div className="flex gap-4 mb-8 flex-wrap">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`btn flex items-center gap-2 ${activeTab === 'dashboard' ? 'btn-gold' : 'btn-outline'}`}
        >
          <BarChart3 size={18} /> Dashboard Ejecutivo
        </button>
        <button
          onClick={() => setActiveTab('tienda')}
          className={`btn flex items-center gap-2 ${activeTab === 'tienda' ? 'btn-gold' : 'btn-outline'}`}
        >
          <ShoppingCart size={18} /> Tienda
        </button>
        <button
          onClick={() => setActiveTab('vanguardia')}
          className={`btn flex items-center gap-2 ${activeTab === 'vanguardia' ? 'btn-gold' : 'btn-outline'}`}
        >
          <Shield size={18} /> Centro de Mando Vanguardia
        </button>
        <button
          onClick={() => setActiveTab('creadores')}
          className={`btn flex items-center gap-2 ${activeTab === 'creadores' ? 'btn-gold' : 'btn-outline'}`}
        >
          <Sparkles size={18} /> Red de Creadores
        </button>
      </div>

      {activeTab === 'dashboard' ? (
        <EjecutivoPanel />
      ) : activeTab === 'tienda' ? (
        <TiendaPanel />
      ) : activeTab === 'vanguardia' ? (
        <VanguardiaPanel />
      ) : (
        <CreadoresAdminPanel />
      )}
    </div>
  );
}
