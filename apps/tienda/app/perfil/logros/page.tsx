import React from 'react';
import { Trophy } from 'lucide-react';
import { LogrosClient } from '@/components/perfil/logros-client';
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
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <Trophy size={20} />
          </div>
          <h1 className="font-display text-4xl font-light text-foreground">
            Mis Logros e Impacto
          </h1>
        </div>
        <p className="text-muted-foreground text-sm tracking-wide">
          Descubre cómo tus acciones están ayudando a regenerar la biodiversidad de Chiloé.
        </p>
      </div>

      <LogrosClient 
        profile={profile} 
        footprint={footprint} 
        transactions={transactions} 
      />
    </div>
  );
}
