import { useState } from 'react';
import { Sparkles, Users } from 'lucide-react';
import { CreadorPortal } from '../components/creadores/CreadorPortal';
import { CreadoresAdminPanel } from '../components/creadores/CreadoresAdminPanel';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';

interface CreadorViewProps {
  userId?: string;
}

export function CreadorView({ userId }: CreadorViewProps) {
  const [activeTab, setActiveTab] = useState<'portal' | 'admin'>('admin');

  return (
    <div className="space-y-6">
      <ViewShell
        variant="compact"
        eyebrow="Creadores"
        title="Programa de Creadores"
        subtitle="Portal de afiliados y administración de la red"
        icon={<Sparkles size={20} />}
      />

      <ResponsiveTabBar
        variant="pill"
        layoutId="creador-view-tabs"
        tabs={[
          { id: 'portal', label: 'Mi Portal', icon: <Sparkles size={16} /> },
          { id: 'admin', label: 'Administrar', icon: <Users size={16} /> },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as 'portal' | 'admin')}
      />

      {activeTab === 'portal' ? <CreadorPortal userId={userId} /> : <CreadoresAdminPanel />}
    </div>
  );
}
