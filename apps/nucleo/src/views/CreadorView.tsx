import { Sparkles } from 'lucide-react';
import { CreadoresAdminPanel } from '../components/creadores/CreadoresAdminPanel';
import { ViewShell } from '@/components/layout/ViewShell';
import { ToolActionRail } from '@/components/layout/ToolActionRail';

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
      <ToolActionRail context="creadores" current="/creador" />

      <CreadoresAdminPanel />
    </div>
  );
}
