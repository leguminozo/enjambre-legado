import React from 'react';
import { Trophy } from 'lucide-react';
import { LogrosClient } from '@/components/perfil/logros-client';
import { PerfilPageHeader } from '@/components/perfil/perfil-page-header';
import { 
  getUserGamificationProfile, 
  getUserImpactFootprint, 
  getUserLoyaltyHistory 
} from '@/app/actions/logros';

export const metadata = {
  title: 'Mis Logros e Impacto | La Obrera y el Zángano',
  description: 'Revisa tu progreso, puntos de lealtad y huella regenerativa en el bosque.',
};

export default async function LogrosPage() {
  const [profile, footprint, transactions] = await Promise.all([
    getUserGamificationProfile(),
    getUserImpactFootprint(),
    getUserLoyaltyHistory(),
  ]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-16">
      <PerfilPageHeader
        icon={<Trophy size={20} />}
        greeting="Identidad guardiana"
        title="Mis Logros e Impacto"
        mission="Descubre cómo tus acciones regeneran la biodiversidad de Chiloé"
      />

      <LogrosClient 
        profile={profile} 
        footprint={footprint} 
        transactions={transactions} 
      />
    </div>
  );
}
