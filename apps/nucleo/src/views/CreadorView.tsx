import { Sparkles } from 'lucide-react';
import { CreadoresAdminPanel } from '../components/creadores/CreadoresAdminPanel';
import { ViewShell } from '@/components/layout/ViewShell';

export function CreadorView() {
  return (
    <div className="space-y-6">
      <ViewShell
        variant="compact"
        eyebrow="Creadores"
        title="Administración de Creadores"
        subtitle="Administración de la red de afiliados"
        icon={<Sparkles size={20} />}
      />

      <CreadoresAdminPanel />
    </div>
  );
}
