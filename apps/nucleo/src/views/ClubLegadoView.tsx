'use client';

import { useState } from 'react';
import { Crown, Settings2, Shield, Stamp, MapPin } from 'lucide-react';
import { cn } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { EnjambreConfigPanel } from '@/components/enjambre/EnjambreConfigPanel';
import { GuardianTiersConfigPanel } from '@/components/enjambre/GuardianTiersConfigPanel';
import { GuardianStampsAdminPanel } from '@/components/enjambre/GuardianStampsAdminPanel';
import { EnjambreColmenaPanel } from '@/components/enjambre/EnjambreColmenaPanel';

export type ClubLegadoTab = 'beneficios' | 'tiers' | 'sellos' | 'colmenas';

interface TabDef {
  id: ClubLegadoTab;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const TABS: readonly TabDef[] = [
  {
    id: 'beneficios',
    label: 'Beneficios & Puntos',
    description: 'Valores de puntos, descuentos y multiplicadores de checkout',
    icon: Settings2,
  },
  {
    id: 'tiers',
    label: 'Tiers de Guardián',
    description: 'Configuración dinámica de rangos, nombres públicos, íconos y umbrales de lealtad',
    icon: Shield,
  },
  {
    id: 'sellos',
    label: 'Sellos D2C / Billetera',
    description: 'Programas de tarjetas de fidelización por formato de producto',
    icon: Stamp,
  },
  {
    id: 'colmenas',
    label: 'Pasaporte Colmena',
    description: 'Asignación de colmenas del bosque a suscriptores activos',
    icon: MapPin,
  },
] as const;

export interface ClubLegadoViewProps {}

export function ClubLegadoView(_props: ClubLegadoViewProps = {}) {
  const [activeTab, setActiveTab] = useState<ClubLegadoTab>('beneficios');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <ViewShell
        variant="compact"
        eyebrow="Fidelización & Membresías"
        title="Club Legado"
        subtitle="Reglas de incentivo, tiers de guardián, sellos y asignación de colmenas"
        icon={<Crown size={20} />}
      />

      {/* Selector de pestañas */}
      <div className="flex flex-wrap gap-2 border-b border-border/80 pb-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer',
                isActive
                  ? 'bg-accent text-accent-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              <Icon size={16} className={isActive ? 'text-accent-foreground' : 'text-muted-foreground'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido de la pestaña activa */}
      <div key={activeTab} className="animate-in fade-in duration-200">
        {activeTab === 'beneficios' && <EnjambreConfigPanel />}
        {activeTab === 'tiers' && <GuardianTiersConfigPanel />}
        {activeTab === 'sellos' && <GuardianStampsAdminPanel />}
        {activeTab === 'colmenas' && <EnjambreColmenaPanel />}
      </div>
    </div>
  );
}
