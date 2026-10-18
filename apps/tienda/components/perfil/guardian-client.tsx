'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TreePine, Users, Globe, Zap, Copy, Check, 
  ArrowRight, ArrowUpRight, Compass, ShieldCheck, ChevronRight
} from 'lucide-react';
import { 
  TierBadge, 
  AchievementCard, 
  ImpactStatGrid,
  formatCLP 
} from '@enjambre/ui';
import type { EcosystemMetrics } from '@/lib/shop/ecosystem-metrics';
import type { TiendaUserProfile } from '@/lib/shop/user-profile';
import type { GuardianTierProgress, GuardianImpactData, GuardianStampProgress, GuardianReferralData } from '@/lib/shop/guardian-dashboard';
import { BosqueGuardianVisualizer } from './bosque-guardian-visualizer';

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

const TIERS_ROADMAP = [
  { tier: 'OBRERA', label: 'Iniciador', desc: 'Inicio de la trayectoria de Guardián', req: '0 ciclos' },
  { tier: 'ZÁNGANO', label: 'Aliado del Enjambre', desc: 'Vínculo activo con recolecciones de autor', req: '500 ciclos o $50.000' },
  { tier: 'REINA', label: 'Círculo de la Reina', desc: 'Presencia consolidada con asignación prioritaria', req: '2.000 ciclos y 5 árboles' },
  { tier: 'COLMENA', label: 'Guardián Legado', desc: 'Máxima distinción y acceso preferente', req: '5.000 ciclos y 10 árboles' },
] as const;

function getTierIndex(tier: string): number {
  const idx = TIER_ORDER.indexOf(tier as (typeof TIER_ORDER)[number]);
  return idx >= 0 ? idx : 0;
}

export function GuardianClient({
  user,
  tierData,
  impactData,
  referralData,
}: GuardianClientProps) {
  const [copied, setCopied] = useState(false);

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

  const safeTierData: GuardianTierProgress = tierData ?? {
    current_tier: 'OBRERA',
    tier_override: null,
    metrics: { ciclos: 0, spent: 0, referrals: 0, trees: 0 },
    next_tier: 'ZÁNGANO',
    thresholds: { ciclos: 500, spent: 50000, trees: 0, referrals: 0 },
    progress: { ciclos: 0, spent: 0, trees: 0, referrals: 0, overall: 0 },
  };

  const currentTier = safeTierData.current_tier || 'OBRERA';
  const currentTierIndex = getTierIndex(currentTier);
  const nextTier = safeTierData.next_tier || TIER_ORDER[Math.min(currentTierIndex + 1, TIER_ORDER.length - 1)];
  const overallProgress = (safeTierData.progress?.overall ?? 0) * 100;
  const isMaxTier = currentTierIndex >= TIER_ORDER.length - 1;

  const referralCode = referralData?.referral_code || '—';

  const handleCopyCode = () => {
    void navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      progressLabel: 'Meta: 1 ha (10.000 m²)',
    },
    {
      title: 'Miel Virgen Consumida',
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
      progressLabel: 'Meta: 10x trazabilidad verificable',
    },
  ];

  const achievements = [
    {
      title: 'Primer Árbol Nativo',
      description: 'Financiaste tu primer árbol de bosque nativo en Chiloé con tus recolecciones.',
      icon: <TreePine className="w-5 h-5 text-accent" />,
      progress: impactData && impactData.arboles_plantados > 0 ? 100 : 0,
      status: (impactData && impactData.arboles_plantados > 0 ? 'achieved' : 'locked') as 'locked' | 'in_progress' | 'achieved',
      hitoTag: 'Hito 1 · Inicial',
    },
    {
      title: 'Protección de 1 Hectárea',
      description: 'Tu impacto acumulado protege 10.000 m² de bosque nativo en la cordillera de Piuchén.',
      icon: <Globe className="w-5 h-5 text-accent" />,
      progress: impactData ? Math.min((impactData.bosque_m2_protegido / 10000) * 100, 100) : 0,
      status: (impactData && impactData.bosque_m2_protegido >= 10000
        ? 'achieved'
        : (impactData?.bosque_m2_protegido ?? 0) > 0
        ? 'in_progress'
        : 'locked') as 'locked' | 'in_progress' | 'achieved',
      hitoTag: 'Hito 2 · Conservación',
    },
    {
      title: 'Impacto Regenerativo 10x',
      description: 'Tu IRR supera 10: tu consumo captura 10× más carbono del que emite.',
      icon: <Zap className="w-5 h-5 text-accent" />,
      progress: impactData ? Math.min(((impactData.irr_score || 0) / 10) * 100, 100) : 0,
      status: (impactData && (impactData.irr_score || 0) >= 10
        ? 'achieved'
        : (impactData?.irr_score || 0) > 0
        ? 'in_progress'
        : 'locked') as 'locked' | 'in_progress' | 'achieved',
      hitoTag: 'Hito 3 · Regeneración',
    },
    {
      title: 'Embajador de la Colmena',
      description: 'Referiste a 5 guardianes que completaron su primer ciclo de miel.',
      icon: <Users className="w-5 h-5 text-accent" />,
      progress: referralData ? Math.min((referralData.referidos_capturados / 5) * 100, 100) : 0,
      status: (referralData && referralData.referidos_capturados >= 5
        ? 'achieved'
        : (referralData?.referidos_capturados ?? 0) > 0
        ? 'in_progress'
        : 'locked') as 'locked' | 'in_progress' | 'achieved',
      hitoTag: 'Hito 4 · Comunidad',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 pb-16">
      {/* ── HEADER DE IDENTIDAD DEL GUARDIÁN ── */}
      <header className="vanguard-data space-y-5 border-b border-border/40 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/90 font-medium">
            Panel Guardián · Reconocimiento y Metas
          </span>
          <span className="text-xs text-muted-foreground italic hidden sm:inline">
            Evolución y mérito en el territorio
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-light text-foreground tracking-tight">
              Panel Guardián
            </h1>
            <p className="font-display text-xl sm:text-2xl text-foreground/90 font-normal">
              {user?.full_name || 'Guardián del Bosque'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <TierBadge tier={currentTier} size="lg" />
          </div>
        </div>

        {/* Resumen numérico con jerarquía nítida */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-mono">
          <span className="text-foreground/90 font-medium">
            {safeTierData.metrics.ciclos} Ciclos
          </span>
          <span className="text-border" aria-hidden>·</span>
          <span>
            {formatCLP(safeTierData.metrics.spent)} Legado
          </span>
          <span className="text-border" aria-hidden>·</span>
          <span>
            {impactData?.arboles_plantados || 0} Árboles en Chiloé
          </span>
        </div>
      </header>

      {/* ── CÓDIGO GUARDIÁN / REFERRAL HUMANO ── */}
      <section aria-labelledby="referral-heading" className="vanguard-data bg-surface-raised/40 border border-border/70 rounded-2xl p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <span id="referral-heading" className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent" />
              Código Guardián de Invitación
            </span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-bold tracking-wider text-foreground">
                {referralCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-mono text-foreground/80 hover:text-foreground hover:bg-surface-raised transition-colors"
                title="Copiar código al portapapeles"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-accent" />
                    <span className="text-accent font-medium">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pt-1">
              Comparte tu código con nuevos guardianes. Cada persona que inicie su primer ciclo suma puntos de impacto para tu rango y canjes en la colmena.
            </p>
          </div>

          <div className="sm:border-l sm:border-border/50 sm:pl-6 shrink-0 space-y-1">
            <p className="font-display text-2xl font-light text-foreground">
              {referralData?.referidos_capturados || 0}
            </p>
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Guardianes invitados
            </p>
            <p className="text-xs text-muted-foreground/80 font-mono pt-0.5">
              {referralData?.puntos_referidos || 0} pts de impacto
            </p>
          </div>
        </div>
      </section>

      {/* ── PARCELA DEL SANTUARIO EN EL BOSQUE NATIVO (IMPACTO TANGIBLE) ── */}
      <section className="vanguard-data">
        <BosqueGuardianVisualizer
          bosqueM2={impactData?.bosque_m2_protegido ?? 0}
          arbolesPlantados={impactData?.arboles_plantados ?? 0}
          co2EvitadoKg={impactData?.co2_evitado_kg ?? 0}
          especiesArboles={impactData?.especies_arboles}
        />
      </section>

      {/* ── METAS DE IMPACTO REGENERATIVO CON DIRECCIÓN Y % ── */}
      <section aria-labelledby="metas-heading" className="vanguard-data space-y-6">
        <div>
          <span id="metas-heading" className="block text-xs font-mono uppercase tracking-[0.2em] text-foreground/80 font-medium mb-1.5">
            Metas de Impacto Regenerativo
          </span>
          <p className="text-sm text-muted-foreground">
            Métricas acumuladas con objetivos tangibles de restauración en el archipiélago.
          </p>
        </div>

        <ImpactStatGrid stats={impactStats} columns={2} gap="gap-4 lg:gap-6" />
      </section>

      {/* ── PROGRESO DE TIER (ROADMAP VISUAL + MÉTRICAS) ── */}
      <section aria-labelledby="tier-heading" className="vanguard-data border-t border-border/50 pt-10 space-y-6">
        <div>
          <span id="tier-heading" className="block text-xs font-mono uppercase tracking-[0.2em] text-foreground/80 font-medium mb-1.5">
            Progreso de Rango en la Colmena
          </span>
          <p className="text-sm text-muted-foreground">
            Tu nivel evoluciona de forma inmutable con cada ciclo completado, árboles financiados y aportes a la colmena.
          </p>
        </div>

        {/* Stepper / Roadmap Visual de los 4 Rangos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TIERS_ROADMAP.map((item, idx) => {
            const isPassed = idx < currentTierIndex;
            const isCurrent = idx === currentTierIndex;
            return (
              <div
                key={item.tier}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-accent/10 border-accent/40 shadow-sm'
                    : isPassed
                    ? 'bg-card/70 border-border/80'
                    : 'bg-surface-sunken/30 border-border/40 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${
                    isCurrent ? 'text-accent' : isPassed ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {item.label}
                  </span>
                  {isPassed ? (
                    <span className="w-2 h-2 rounded-full bg-accent" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  ) : null}
                </div>
                <p className="text-xs font-display text-foreground font-medium">
                  {item.req}
                </p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-1">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Barra de progreso y requisitos hacia el siguiente rango */}
        <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-7 space-y-5">
          {!isMaxTier ? (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Ascenso a rango {nextTier}
                  </span>
                  <p className="font-display text-xl text-foreground font-medium mt-0.5">
                    {Math.round(overallProgress)}% completado
                  </p>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  Rango actual: <strong className="text-foreground uppercase">{currentTier}</strong>
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-surface-sunken overflow-hidden border border-border/40">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-surface-raised/40 border border-border/50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Ciclos registrados</p>
                    <p className="font-display text-2xl text-foreground font-normal mt-0.5">
                      {safeTierData.metrics.ciclos} <span className="text-sm font-sans text-muted-foreground">/ {safeTierData.thresholds.ciclos}</span>
                    </p>
                  </div>
                  <div className="text-right text-xs font-mono text-muted-foreground">
                    {Math.max(0, safeTierData.thresholds.ciclos - safeTierData.metrics.ciclos)} ciclos restantes
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-raised/40 border border-border/50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Legado acumulado</p>
                    <p className="font-display text-2xl text-foreground font-normal mt-0.5">
                      {formatCLP(safeTierData.metrics.spent)}
                    </p>
                  </div>
                  <div className="text-right text-xs font-mono text-muted-foreground">
                    Meta: {formatCLP(safeTierData.thresholds.spent)}
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground italic leading-relaxed pt-1">
                {safeTierData.metrics.ciclos === 0
                  ? `Tu primer pedido de miel o reserva anual iniciará el conteo de ciclos para ascender a ${nextTier}.`
                  : `Te faltan ${Math.max(0, safeTierData.thresholds.ciclos - safeTierData.metrics.ciclos)} ciclos para ascender al rango ${nextTier}.`}
              </p>
            </>
          ) : (
            <div className="text-center py-4 space-y-1.5">
              <p className="font-display text-2xl text-foreground font-medium">
                Rango Máximo Alcanzado · Protector de Colmena
              </p>
              <p className="text-xs text-muted-foreground">
                Has alcanzado el mayor nivel de fidelización y vínculo comunitario del archipiélago.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── LOGROS DE GUARDIÁN (ESTADOS HONESTOS, SIN CONFLICTO CON IDENTIDAD) ── */}
      <section aria-labelledby="logros-heading" className="vanguard-data border-t border-border/50 pt-10 space-y-6">
        <div>
          <span id="logros-heading" className="block text-xs font-mono uppercase tracking-[0.2em] text-foreground/80 font-medium mb-1.5">
            Hitos del Enjambre
          </span>
          <p className="text-sm text-muted-foreground">
            Hitos clave verificados en terreno por cada etapa de regeneración y comunidad.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.title}
              title={achievement.title}
              description={achievement.description}
              icon={achievement.icon}
              progress={achievement.progress}
              status={achievement.status}
            >
              <span className="inline-block text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 pt-1">
                {achievement.hitoTag}
              </span>
            </AchievementCard>
          ))}
        </div>
      </section>

      {/* ── ESPECIES VINCULADAS ── */}
      <section aria-labelledby="especies-heading" className="vanguard-data border-t border-border/50 pt-10 space-y-4">
        <div>
          <span id="especies-heading" className="block text-xs font-mono uppercase tracking-[0.2em] text-foreground/80 font-medium mb-1.5">
            Especies del Bosque Nativo Vinculadas
          </span>
          <p className="text-sm text-muted-foreground">
            Variedades arbóreas protegidas y polinizadas en los apiarios de Quemchi, Molulco y Pureo.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {(impactData?.especies_arboles && impactData.especies_arboles.length > 0
            ? impactData.especies_arboles
            : ['Ulmo (Eucryphia cordifolia)', 'Tiaca (Caldcluvia paniculata)', 'Coigüe de Chiloé (Nothofagus nitida)', 'Avellano (Gevuina avellana)', 'Pelú (Sophora cassioides)']
          ).map((especie) => (
            <span
              key={especie}
              className="px-3.5 py-1.5 bg-card border border-border/70 rounded-full text-xs font-mono text-foreground/90"
            >
              {especie}
            </span>
          ))}
        </div>
      </section>

      {/* ── NAVEGACIÓN CRUZADA DE RECONOCIMIENTO (ENLACES A PASAPORTE Y BILLETERA) ── */}
      <div className="vanguard-data border-t border-border/50 pt-10 grid sm:grid-cols-2 gap-4">
        <Link
          href="/perfil/pasaporte"
          className="group p-6 rounded-2xl bg-card border border-border/70 hover:border-border transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-accent" />
                Telemetría en Vivo
              </span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
            </div>
            <h3 className="font-display text-xl text-foreground font-light">
              Pasaporte Colmena
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Monitorea en tiempo real el ritmo vital, peso estimado (28.5 kg), floración y coordenadas de tu colmena centinela.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-1.5 text-xs font-mono text-foreground group-hover:text-accent transition-colors">
            <span>Ver telemetría y bitácora</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          href="/perfil/billetera"
          className="group p-6 rounded-2xl bg-card border border-border/70 hover:border-border transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-accent" />
                Tarjeta Obrera
              </span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
            </div>
            <h3 className="font-display text-xl text-foreground font-light">
              Billetera del Bosque
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Accede a tu código QR para ferias locales, gestiona sellos por producto y descarga tu pase oficial a Apple/Google Wallet.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-1.5 text-xs font-mono text-foreground group-hover:text-accent transition-colors">
            <span>Abrir Billetera y Pase</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>
    </div>
  );
}