'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import type gsap from 'gsap';
import { Trophy, Leaf, Zap, Trees, Star, TreePine, Globe, Users } from 'lucide-react';
import { AchievementCard, EmptyState, Button } from '@enjambre/ui';
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

  const activeProfile: GamificationProfile = profile ?? {
    puntos_acumulados: 0,
    nivel_guardian: 'OBRERA',
    tier_name: 'Iniciador',
    next_tier_points: 500,
    next_tier_name: 'Aliado del Enjambre',
    progress_percentage: 0,
  };

  const achievements = [
    {
      title: 'Primer Árbol Nativo',
      description: 'Financia tu primer árbol de bosque nativo en Chiloé con tus recolecciones.',
      icon: <TreePine className="w-5 h-5 text-accent" />,
      progress: footprint.bosque_m2_protegido > 0 ? 100 : 0,
      status: (footprint.bosque_m2_protegido > 0 ? 'achieved' : 'locked') as 'locked' | 'in_progress' | 'achieved',
      hitoTag: 'Hito 1 · Inicial',
    },
    {
      title: 'Protección de 1 Hectárea',
      description: 'Tu impacto acumulado protege 10.000 m² de bosque nativo en la cordillera de Piuchén.',
      icon: <Globe className="w-5 h-5 text-accent" />,
      progress: Math.min((footprint.bosque_m2_protegido / 10000) * 100, 100),
      status: (footprint.bosque_m2_protegido >= 10000
        ? 'achieved'
        : footprint.bosque_m2_protegido > 0
        ? 'in_progress'
        : 'locked') as 'locked' | 'in_progress' | 'achieved',
      hitoTag: 'Hito 2 · Conservación',
    },
    {
      title: 'Impacto Regenerativo 10x',
      description: 'Tu consumo promueve la regeneración del bosque templado y la conservación de la flora nativa de Chiloé.',
      icon: <Zap className="w-5 h-5 text-accent" />,
      progress: Math.min((footprint.co2_evitado_kg / 10) * 100, 100),
      status: (footprint.co2_evitado_kg >= 10
        ? 'achieved'
        : footprint.co2_evitado_kg > 0
        ? 'in_progress'
        : 'locked') as 'locked' | 'in_progress' | 'achieved',
      hitoTag: 'Hito 3 · Regeneración',
    },
    {
      title: 'Embajador de la Colmena',
      description: 'Comparte tu código de guardián e integra a nuevos miembros al enjambre.',
      icon: <Users className="w-5 h-5 text-accent" />,
      progress: Math.min((activeProfile.puntos_acumulados / 500) * 100, 100),
      status: (activeProfile.puntos_acumulados >= 500
        ? 'achieved'
        : activeProfile.puntos_acumulados > 0
        ? 'in_progress'
        : 'locked') as 'locked' | 'in_progress' | 'achieved',
      hitoTag: 'Hito 4 · Comunidad',
    },
  ];

  useEffect(() => {
    if (!containerRef.current) return;
    let ctx: gsap.Context | undefined;
    let cancelled = false;
    (async () => {
      const { gsap } = await import('gsap');
      if (cancelled || !containerRef.current) return;
      ctx = gsap.context(() => {
        const root = containerRef.current;
        if (!root) return;
        const cards = root.querySelectorAll('.logro-card');
        if (cards.length > 0) {
          gsap.from(cards, {
            opacity: 0,
            y: 30,
            duration: 1,
            stagger: 0.15,
            ease: 'power3.out',
          });
        }

        const tx = root.querySelectorAll('.transaction-item');
        if (tx.length > 0) {
          gsap.from(tx, {
            opacity: 0,
            x: -20,
            duration: 0.8,
            stagger: 0.05,
            delay: 0.3,
            ease: 'power2.out',
          });
        }

        const bar = root.querySelector('.progress-bar-fill');
        if (bar && activeProfile.progress_percentage !== undefined) {
          gsap.fromTo(bar,
            { width: '0%' },
            {
              width: `${activeProfile.progress_percentage}%`,
              duration: 1.5,
              delay: 0.5,
              ease: 'power4.out',
            },
          );
        }

        const counters = root.querySelectorAll('.counter-value');
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
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [activeProfile]);

  return (
    <div ref={containerRef} className="space-y-8">
      
      {/* Gamification Main Tier Card */}
      <div className="logro-card relative overflow-hidden rounded-3xl bg-surface-raised border border-border shadow-2xl p-8 sm:p-10">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Trophy size={140} className="text-accent" />
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-8">
          <div className="space-y-2">
            <span className="text-[0.65rem] uppercase tracking-[0.3em] text-accent-text font-semibold">Nivel Actual</span>
            <h2 className="font-display text-4xl sm:text-5xl text-foreground font-medium text-balance">
              {activeProfile.tier_name}
            </h2>
            <p className="text-muted-foreground max-w-sm mt-4">
              Cada acción regenerativa suma a tu legado. Avanza de nivel para desbloquear reservas exclusivas.
            </p>
          </div>
          
          <div className="bg-background/60 backdrop-blur-md rounded-2xl p-6 border border-border/50 text-center min-w-[180px]">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Puntos de Impacto</p>
            <p className="font-display text-4xl text-accent-text counter-value" data-target={activeProfile.puntos_acumulados}>
              0
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {activeProfile.next_tier_name && (
          <div className="relative z-10 mt-10">
            <div className="flex justify-between text-xs text-muted-foreground mb-3 font-medium">
              <span>Progreso hacia {activeProfile.next_tier_name}</span>
              <span>
                <span className="text-foreground">{activeProfile.puntos_acumulados.toLocaleString('es-CL')}</span> 
                {' / '}
                {activeProfile.next_tier_points?.toLocaleString('es-CL')} pts
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
          <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Miel Virgen Consumida</span>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="font-display text-3xl text-foreground counter-value" data-target={footprint.azucar_sustituida_g}>0</span>
            <span className="text-sm text-muted-foreground font-medium">g</span>
          </div>
        </div>
      </div>

      {/* Hitos del Enjambre */}
      <div className="logro-card space-y-4">
        <div>
          <span className="block text-xs font-mono uppercase tracking-[0.2em] text-foreground/80 font-medium mb-1">
            Hitos del Enjambre
          </span>
          <p className="text-sm text-muted-foreground">
            Hitos clave verificados en terreno por cada etapa de regeneración y comunidad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.title}
              title={achievement.title}
              description={achievement.description}
              icon={achievement.icon}
              progress={achievement.progress}
              status={achievement.status}
            >
              <div className="flex items-center justify-between text-[11px] font-mono mt-3 pt-3 border-t border-border/40 text-muted-foreground">
                <span>{achievement.hitoTag}</span>
                <span className="capitalize">
                  {achievement.status === 'achieved'
                    ? 'Completado'
                    : achievement.status === 'in_progress'
                    ? `${Math.round(achievement.progress)}% en curso`
                    : 'Bloqueado'}
                </span>
              </div>
            </AchievementCard>
          ))}
        </div>
      </div>

      {/* History / Transactions */}
      <div className="logro-card rounded-3xl bg-secondary/30 border border-border p-8">
        <h3 className="font-display text-xl text-foreground mb-6 flex items-center gap-2">
          <Star size={18} className="text-accent" />
          Historial de Puntos y Regeneración
        </h3>
        
        {transactions.length === 0 ? (
          <EmptyState
            icon={<Star className="w-8 h-8 opacity-50 text-accent" />}
            title="Sin movimientos de puntos registrados"
            description="Tus compras de recolecciones y reservas registrarán aquí puntos y aporte al bosque nativo."
            action={
              <Link href="/catalogo">
                <Button type="button" variant="outline" className="min-h-11">
                  Explorar Catálogo
                </Button>
              </Link>
            }
            className="rounded-2xl border border-dashed border-border bg-surface-sunken my-2"
          />
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
                  <span className="text-sm font-semibold text-accent-text">+{t.points} pts</span>
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
