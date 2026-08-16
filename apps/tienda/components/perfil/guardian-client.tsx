'use client';

import React, { useEffect } from 'react';
import { 
  Crown, TreePine, Leaf, Droplets, Users, Share2, Award, 
  ChevronRight, Lock, Unlock, Target, Globe, Zap, Package 
} from 'lucide-react';
import { 
  TierBadge, 
  ProgressRing, 
  AchievementCard, 
  ImpactStatCard, 
  ImpactStatGrid 
} from '@enjambre/ui';
import { GuardianStampsSection } from '@/components/shop/guardian-stamps-section';
import { WalletButtons } from '@/components/shop/wallet-buttons';
import type { EcosystemMetrics } from '@/lib/shop/ecosystem-metrics';
import type { TiendaUserProfile } from '@/lib/shop/user-profile';
import type { GuardianTierProgress, GuardianImpactData, GuardianStampProgress, GuardianReferralData } from '@/lib/shop/guardian-dashboard';

interface GuardianClientProps {
  user: TiendaUserProfile | null;
  tierData: GuardianTierProgress | null;
  impactData: GuardianImpactData | null;
  stampProgress: GuardianStampProgress[];
  referralData: GuardianReferralData | null;
  orders: Array<{
    id: string;
    created_at: string;
    total: number;
    estado: string;
    productos: Array<{ nombre: string; cantidad: number; precio: number }>;
  }>;
  ecosystemMetrics: EcosystemMetrics;
}

const TIER_ORDER = ['OBRERA', 'ZÁNGANO', 'REINA', 'COLMENA'] as const;

function getTierIndex(tier: string): number {
  return TIER_ORDER.indexOf(tier as (typeof TIER_ORDER)[number]);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-CL').format(Math.round(n));
}

export function GuardianClient({
  user,
  tierData,
  impactData,
  stampProgress,
  referralData,
  orders,
  ecosystemMetrics,
}: GuardianClientProps) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { gsap } = await import('gsap');
      if (cancelled) return;
      gsap.from('.vanguard-data', {
        opacity: 0,
        y: 20,
        duration: 1.5,
        stagger: 0.2,
        ease: 'power2.out',
      });
    })().catch(() => {
      // Chunk de gsap fallido: los datos quedan visibles sin animación.
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentTier = tierData?.current_tier || 'OBRERA';
  const currentTierIndex = getTierIndex(currentTier);
  const nextTier = tierData?.next_tier || TIER_ORDER[Math.min(currentTierIndex + 1, TIER_ORDER.length - 1)];
  const overallProgress = tierData?.progress?.overall ?? 0;
  const isMaxTier = currentTierIndex >= TIER_ORDER.length - 1;

  const impactStats = [
    {
      title: 'CO₂ Evitado',
      value: impactData?.co2_evitado_kg ?? 0,
      unit: 'kg',
      variant: 'co2' as const,
      progress: Math.min((impactData?.co2_evitado_kg ?? 0) / 1000, 1) * 100,
      progressLabel: 'Meta: 1 tonelada',
    },
    {
      title: 'Bosque Protegido',
      value: impactData?.bosque_m2_protegido ?? 0,
      unit: 'm²',
      variant: 'bosque' as const,
      progress: Math.min((impactData?.bosque_m2_protegido ?? 0) / 10000, 1) * 100,
      progressLabel: 'Meta: 1 ha',
    },
    {
      title: 'Azúcar Sustituida',
      value: impactData?.azucar_sustituida_g ?? 0,
      unit: 'g',
      variant: 'azucar' as const,
      progress: Math.min((impactData?.azucar_sustituida_g ?? 0) / 5000, 1) * 100,
      progressLabel: 'Meta: 5 kg',
    },
    {
      title: 'IRR Personal',
      value: impactData?.irr_score ?? 0,
      unit: 'x',
      variant: 'irr' as const,
      progress: Math.min((impactData?.irr_score ?? 0) / 10, 1) * 100,
      progressLabel: 'Meta: 10x',
    },
  ];

  const achievements = [
    {
      title: 'Primer Árbol',
      description: 'Financiaste tu primer árbol nativo en Chiloé',
      icon: <TreePine className="w-6 h-6" />,
      tier: 'OBRERA' as const,
      progress: impactData && impactData.arboles_plantados > 0 ? 100 : 0,
      status: impactData && impactData.arboles_plantados > 0 ? 'achieved' as const : 'locked' as const,
    },
    {
      title: 'Guardiana del Bosque',
      description: 'Proteges 1 hectárea de bosque nativo',
      icon: <Globe className="w-6 h-6" />,
      tier: 'REINA' as const,
      progress: impactData ? Math.min((impactData.bosque_m2_protegido / 10000) * 100, 100) : 0,
      status: impactData && impactData.bosque_m2_protegido >= 10000 ? 'achieved' as const : 'in_progress' as const,
    },
    {
      title: 'Impacto Regenerativo 10x',
      description: 'Tu IRR supera 10: tu consumo captura 10× más carbono del que emite',
      icon: <Zap className="w-6 h-6" />,
      tier: 'COLMENA' as const,
      progress: impactData ? Math.min((impactData.irr_score || 0) / 10) * 100 : 0,
      status: impactData && (impactData.irr_score || 0) >= 10 ? 'achieved' as const : 'in_progress' as const,
    },
    {
      title: 'Embajadora de la Colmena',
      description: 'Referiste a 5 guardianes que completaron su primera compra',
      icon: <Users className="w-6 h-6" />,
      tier: 'REINA' as const,
      progress: referralData ? Math.min((referralData.referidos_capturados / 5) * 100, 100) : 0,
      status: referralData && referralData.referidos_capturados >= 5 ? 'achieved' as const : 'in_progress' as const,
    },
  ];

  return (
    <div className="w-full min-h-[var(--vh-full)] bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background z-0" />
        
        <div className="relative z-10 max-w-4xl w-full mx-auto px-4 lg:px-8 py-20 lg:py-32 text-center">
          <div className="vanguard-data mb-8">
            <span className="block text-[0.6rem] tracking-[0.5em] uppercase text-accent-text mb-4">
              Perfil Guardián
            </span>
            <h1 className="vanguard-data font-display text-5xl lg:text-7xl font-light text-foreground mb-4">
              {user?.full_name || 'Guardián del Bosque'}
            </h1>
            <div className="vanguard-data flex items-center justify-center gap-3 flex-wrap">
              <TierBadge tier={currentTier as 'OBRERA' | 'ZÁNGANO' | 'REINA' | 'COLMENA'} size="lg" />
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <span>{tierData?.metrics?.ciclos || 0} Ciclos</span>
                <span>·</span>
                <span>${formatNumber(tierData?.metrics?.spent || 0)} Legado</span>
                <span>·</span>
                <span>{impactData?.arboles_plantados || 0} Árboles</span>
              </div>
            </div>
          </div>

          {/* Referral Code Display */}
          {referralData?.referral_code && (
            <div className="vanguard-data mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 p-6 bg-surface-raised/50 border border-border/50 rounded-2xl">
              <div className="flex items-center gap-3">
                <Share2 className="w-5 h-5 text-accent/70" />
                <div>
                  <p className="text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">Tu código guardián</p>
                  <p className="font-display text-xl font-medium text-foreground tracking-wide">{referralData.referral_code}</p>
                </div>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm text-muted-foreground">
                  {referralData.referidos_capturados} guardianes invitados · {referralData.puntos_referidos} pts
                </p>
              </div>
            </div>
          )}

          {/* Progress to Next Tier */}
          {!isMaxTier && tierData && (
            <div className="vanguard-data mt-8 max-w-md mx-auto">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-muted-foreground">Progreso hacia {nextTier}</span>
                <span className="font-mono text-accent-text">{Math.round(overallProgress)}%</span>
              </div>
              <ProgressRing 
                progress={overallProgress} 
                size={120} 
                strokeWidth={6} 
                variant="default" 
                showValue 
              />
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 lg:px-8 pb-20 -mt-12 relative z-10">
        
        {/* Impact Grid */}
        <section className="vanguard-data mb-16">
          <h2 className="font-display text-2xl font-light text-foreground mb-8">Tu Impacto Regenerativo</h2>
          <ImpactStatGrid stats={impactStats} columns={2} gap="gap-4 lg:gap-6" />
        </section>

        {/* Tier Progress Detail */}
        <section className="vanguard-data mb-16">
          <h2 className="font-display text-2xl font-light text-foreground mb-6">Progreso de Tier</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tierData && [
              { key: 'ciclos', label: 'Ciclos', current: tierData.metrics.ciclos, target: tierData.thresholds.ciclos, progress: tierData.progress.ciclos },
              { key: 'spent', label: 'Legado Acumulado', current: tierData.metrics.spent, target: tierData.thresholds.spent, progress: tierData.progress.spent },
              { key: 'trees', label: 'Árboles', current: tierData.metrics.trees, target: tierData.thresholds.trees, progress: tierData.progress.trees },
              { key: 'referrals', label: 'Referidos', current: tierData.metrics.referrals, target: tierData.thresholds.referrals, progress: tierData.progress.referrals },
            ].map((metric) => (
              <div key={metric.key} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{metric.label}</span>
                  <ProgressRing progress={metric.progress * 100} size={44} strokeWidth={3} variant="default" />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-2xl font-light text-foreground">{formatNumber(metric.current)}</span>
                  <span className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                    {metric.target > 0 ? `/ ${formatNumber(metric.target)}` : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Achievements */}
        <section className="vanguard-data mb-16">
          <h2 className="font-display text-2xl font-light text-foreground mb-6">Logros de Guardián</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {achievements.map((achievement, i) => (
              <AchievementCard key={i} {...achievement} />
            ))}
          </div>
        </section>

        {/* Species Diversity */}
        {impactData?.especies_arboles && impactData.especies_arboles.length > 0 && (
          <section className="vanguard-data mb-16">
            <h2 className="font-display text-2xl font-light text-foreground mb-6">Especies que Custodias</h2>
            <div className="flex flex-wrap gap-3">
              {impactData.especies_arboles.map((especie, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1.5 bg-surface-raised/50 border border-border/50 rounded-full text-sm text-foreground"
                >
                  {especie}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Wallet Pass */}
        <section className="vanguard-data mb-16">
          <h2 className="font-display text-2xl font-light text-foreground mb-6">Tu Pasaporte Guardián</h2>
          <WalletButtons />
        </section>

        {/* Stamps Section */}
        <section className="vanguard-data mb-16">
          <h2 className="font-display text-2xl font-light text-foreground mb-6">Sellos de Producto</h2>
          <GuardianStampsSection />
        </section>

        {/* Ecosystem Context */}
        <section className="vanguard-data mb-16 border-t border-border pt-12">
          <h2 className="font-display text-2xl font-light text-foreground mb-6">Ecosistema que Custodias</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-2xl">
            Tu legado se suma al ecosistema colectivo de {ecosystemMetrics.anos_legado} años en Chiloé:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ImpactStatCard 
              title="Árboles Totales" 
              value={ecosystemMetrics.arboles_total} 
              variant="arboles" 
            />
            <ImpactStatCard 
              title="CO₂ Capturado" 
              value={ecosystemMetrics.co2_ton} 
              unit="ton" 
              variant="co2" 
            />
            <ImpactStatCard 
              title="Colmenas" 
              value={ecosystemMetrics.colmenas_total} 
              variant="ciclos" 
            />
            <ImpactStatCard 
              title="Especies Nativas" 
              value={ecosystemMetrics.especies_nativas} 
              variant="bosque" 
            />
          </div>
        </section>

        {/* Recent Orders */}
        <section className="vanguard-data">
          <h2 className="font-display text-2xl font-light text-foreground mb-6">Pedidos Recientes</h2>
          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-5 bg-card border border-border rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-raised flex items-center justify-center">
                      <Package className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {new Date(order.created_at).toLocaleDateString('es-CL')}
                      </div>
                      <div className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                        {order.productos[0]?.nombre || 'Varios'} · {order.productos[0]?.cantidad || 0} un.
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display italic text-foreground">${formatNumber(order.total)}</div>
                    <div className="text-[0.6rem] uppercase tracking-[0.2em] text-accent-text">{order.estado}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground italic">Sin pedidos recientes</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}