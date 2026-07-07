'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Trophy, Leaf, Zap, Trees, Star } from 'lucide-react';
import type { GamificationProfile, ImpactFootprint, LoyaltyTransaction } from '@/lib/shop/logros-schema';

export function LogrosClient({ 
  profile, 
  footprint, 
  transactions 
}: { 
  profile: GamificationProfile | null;
  footprint: ImpactFootprint;
  transactions: LoyaltyTransaction[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const countersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate entry
      gsap.from('.logro-card', {
        opacity: 0,
        y: 30,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out',
      });
      
      gsap.from('.transaction-item', {
        opacity: 0,
        x: -20,
        duration: 0.8,
        stagger: 0.05,
        delay: 0.3,
        ease: 'power2.out',
      });

      // Animate the progress bar width
      if (profile?.progress_percentage !== undefined) {
        gsap.fromTo('.progress-bar-fill', 
          { width: '0%' },
          { 
            width: `${profile.progress_percentage}%`, 
            duration: 1.5, 
            delay: 0.5,
            ease: 'power4.out' 
          }
        );
      }

      // Animate counters
      const counters = document.querySelectorAll('.counter-value');
      counters.forEach((counter) => {
        const targetStr = counter.getAttribute('data-target') ?? '0';
        const target = parseFloat(targetStr);
        if (isNaN(target)) return;
        
        gsap.fromTo(counter, 
          { innerHTML: 0 },
          { 
            innerHTML: target, 
            duration: 2, 
            delay: 0.2,
            snap: { innerHTML: 1 },
            ease: 'power2.out',
            onUpdate: function() {
              const val = Number(this.targets()[0].innerHTML);
              counter.innerHTML = val.toLocaleString('es-CL');
            }
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, [profile]);

  if (!profile) {
    return (
      <div className="p-12 rounded-3xl bg-secondary/50 border border-border text-center">
        <Trophy size={48} className="mx-auto text-muted-foreground/50 mb-6" />
        <p className="text-muted-foreground font-display italic text-lg">
          Tus datos de impacto no están disponibles en este momento.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-8">
      
      {/* Gamification Main Tier Card */}
      <div className="logro-card relative overflow-hidden rounded-3xl bg-surface-raised border border-border shadow-2xl p-8 sm:p-10">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Trophy size={140} className="text-accent" />
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-8">
          <div className="space-y-2">
            <span className="text-[0.65rem] uppercase tracking-[0.3em] text-accent font-semibold">Nivel Actual</span>
            <h2 className="font-display text-4xl sm:text-5xl text-foreground font-medium text-balance">
              {profile.tier_name}
            </h2>
            <p className="text-muted-foreground max-w-sm mt-4">
              Cada acción regenerativa suma a tu legado. Avanza de nivel para desbloquear reservas exclusivas.
            </p>
          </div>
          
          <div className="bg-background/60 backdrop-blur-md rounded-2xl p-6 border border-border/50 text-center min-w[180px]">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Puntos de Impacto</p>
            <p className="font-display text-4xl text-accent counter-value" data-target={profile.puntos_acumulados}>
              0
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {profile.next_tier_name && (
          <div className="relative z-10 mt-10">
            <div className="flex justify-between text-xs text-muted-foreground mb-3 font-medium">
              <span>Progreso hacia {profile.next_tier_name}</span>
              <span>
                <span className="text-foreground">{profile.puntos_acumulados.toLocaleString('es-CL')}</span> 
                {' / '}
                {profile.next_tier_points?.toLocaleString('es-CL')} pts
              </span>
            </div>
            <div className="h-2 w-full bg-secondary/80 rounded-full overflow-hidden">
              <div 
                className="progress-bar-fill h-full bg-accent rounded-full" 
                style={{ width: '0%' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Environmental Footprint Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" ref={countersRef}>
        <div className="logro-card rounded-2xl bg-card border border-border p-6 flex flex-col">
          <Trees size={24} className="text-accent mb-4 opacity-80" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bosque Protegido</span>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="font-display text-3xl text-foreground counter-value" data-target={footprint.bosque_m2_protegido}>0</span>
            <span className="text-sm text-muted-foreground font-medium">m²</span>
          </div>
        </div>
        
        <div className="logro-card rounded-2xl bg-card border border-border p-6 flex flex-col">
          <Leaf size={24} className="text-accent mb-4 opacity-80" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">CO₂ Evitado</span>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="font-display text-3xl text-foreground counter-value" data-target={footprint.co2_evitado_kg}>0</span>
            <span className="text-sm text-muted-foreground font-medium">kg</span>
          </div>
        </div>
        
        <div className="logro-card rounded-2xl bg-card border border-border p-6 flex flex-col">
          <Zap size={24} className="text-accent mb-4 opacity-80" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Azúcar Sustituida</span>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="font-display text-3xl text-foreground counter-value" data-target={footprint.azucar_sustituida_g}>0</span>
            <span className="text-sm text-muted-foreground font-medium">g</span>
          </div>
        </div>
      </div>

      {/* History / Transactions */}
      <div className="logro-card rounded-3xl bg-secondary/30 border border-border p-8">
        <h3 className="font-display text-xl text-foreground mb-6 flex items-center gap-2">
          <Star size={18} className="text-accent" />
          Historial de Impacto
        </h3>
        
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-sm italic py-4">Aún no hay registros de impacto en tu historial.</p>
        ) : (
          <div className="space-y-4">
            {transactions.map((t) => (
              <div 
                key={t.id} 
                className="transaction-item flex items-center justify-between p-4 rounded-xl bg-card border border-border/50 hover:border-border transition-colors"
              >
                <div>
                  <p className="text-sm text-foreground font-medium">{t.description ?? 'Acción registrada'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(t.created_at).toLocaleDateString('es-CL', { 
                      year: 'numeric', month: 'long', day: 'numeric' 
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-accent">+{t.points} pts</span>
                  <p className="text-xs text-muted-foreground mt-1">Total: {t.balance_after}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
