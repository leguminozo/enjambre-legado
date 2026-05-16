import { useState } from 'react';
import { CreadorPortal } from '../components/creadores/CreadorPortal';
import { CreadoresAdminPanel } from '../components/creadores/CreadoresAdminPanel';

interface CreadorViewProps {
  currentRole?: string;
  userId?: string;
}

export default function CreadorView({ currentRole, userId }: CreadorViewProps) {
  const [activeTab, setActiveTab] = useState<'portal' | 'admin'>(
    currentRole === 'gerente' || currentRole === 'tienda_admin' || currentRole === 'marketing' ? 'admin' : 'portal'
  );

  const showAdmin = currentRole === 'gerente' || currentRole === 'tienda_admin' || currentRole === 'marketing';

  return (
    <div className="space-y-8">
      {showAdmin && (
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('portal')}
            className={`btn ${activeTab === 'portal' ? 'btn-gold' : 'btn-outline'}`}
          >
            Mi Portal
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`btn ${activeTab === 'admin' ? 'btn-gold' : 'btn-outline'}`}
          >
            Administrar Creadores
          </button>
        </div>
      )}

      {activeTab === 'portal' ? <CreadorPortal userId={userId} /> : <CreadoresAdminPanel />}
    </div>
  );
}
