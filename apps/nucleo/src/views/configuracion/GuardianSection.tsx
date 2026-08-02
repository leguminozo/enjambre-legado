'use client';

import { Star, TreePine } from 'lucide-react';
import { GUARDIAN_LEVELS, type PerfilFragmentProps } from './constants';

export function GuardianSection({ profile }: PerfilFragmentProps) {
  if (!profile) return null;

  const guardianInfo = GUARDIAN_LEVELS[profile.nivel_guardian] || GUARDIAN_LEVELS.brotes;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 animate-in">
      <div className="flex items-center gap-2 text-accent mb-6">
        <TreePine size={18} />
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Nivel Guardián</h3>
      </div>

      <div className="text-center p-8 bg-foreground text-background rounded-2xl mb-6 relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-15%] w-48 h-48 rounded-full bg-radial-gradient from-accent/15 to-transparent pointer-events-none" />
        <div className="text-5xl mb-2">{guardianInfo.icon}</div>
        <h3 className="text-accent font-display text-2xl font-light">Nivel {guardianInfo.label}</h3>
        <p className="text-muted-foreground text-xs mt-2 max-w-sm mx-auto">{guardianInfo.description}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-secondary/30 border border-border/50 rounded-xl text-center">
          <Star size={20} className="mx-auto text-accent mb-2" />
          <div className="text-2xl font-bold font-display text-foreground font-mono">{profile.puntos_acumulados}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Puntos Acumulados</div>
        </div>
        <div className="p-4 bg-secondary/30 border border-border/50 rounded-xl text-center">
          <TreePine size={20} className="mx-auto text-primary mb-2" />
          <div className="text-2xl font-bold font-display text-foreground font-mono">{profile.arboles_personal}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Árboles Plantados</div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground">Progresión de Niveles</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(GUARDIAN_LEVELS).map(([key, lvl]) => {
            const isActive = profile.nivel_guardian === key;
            const isPassed =
              Object.keys(GUARDIAN_LEVELS).indexOf(key) <= Object.keys(GUARDIAN_LEVELS).indexOf(profile.nivel_guardian);
            return (
              <div
                key={key}
                className={`text-center p-3 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-accent/10 border-accent/40'
                    : isPassed
                      ? 'bg-primary/10 border-primary/20 opacity-100'
                      : 'bg-secondary/50 border-border/50 opacity-40'
                }`}
              >
                <div className="text-lg mb-1">{lvl.icon}</div>
                <div className="text-[10px] font-semibold text-foreground truncate">{lvl.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
