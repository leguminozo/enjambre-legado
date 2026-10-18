'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Award,
  Wallet,
  CreditCard,
  Users,
  Copy,
  Check,
  X,
  ShoppingBag,
  ArrowRight,
  Flame,
  Star,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { toast, friendlyError } from '@enjambre/ui';
import type { WalletGuardianSnapshot } from '@enjambre/wallet';
import { GuardianStampsSection } from '@/components/shop/guardian-stamps-section';
import { redeemLoyaltyReward, type LoyaltyReward, type ReferralStats } from '@/app/actions/perfil-experiences';
import type { UnifiedTierDisplay } from '@/lib/shop/tier-display';

interface BilleteraClientProps {
  initialSnapshot: WalletGuardianSnapshot | null;
  loyalty: {
    balance: number;
    tier: string;
    tierDisplay: UnifiedTierDisplay;
    rewards: LoyaltyReward[];
  };
  referral: ReferralStats;
}

export function BilleteraClient({
  initialSnapshot,
  loyalty,
  referral,
}: BilleteraClientProps) {
  const [balance, setBalance] = useState(loyalty.balance);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Bloqueo de scroll y cierre con tecla Escape para el modal
  useEffect(() => {
    if (!showCatalogModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCatalogModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [showCatalogModal]);

  const handleCopyReferral = () => {
    const textToCopy = referral.referralUrl || referral.referralCode;
    if (!textToCopy) return;
    void navigator.clipboard.writeText(textToCopy);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(15);
    }
    setCopiedReferral(true);
    toast('Enlace de invitación copiado al portapapeles', { type: 'success' });
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const handleClaimReward = (reward: LoyaltyReward) => {
    if (balance < reward.points_cost) {
      toast('Puntos insuficientes para este canje', { type: 'error' });
      return;
    }

    startTransition(async () => {
      try {
        await redeemLoyaltyReward(reward.id);
        // Actualizamos saldo en UI
        setBalance((prev) => Math.max(0, prev - reward.points_cost));

        setShowCatalogModal(false);
        toast(`¡${reward.name} canjeado! Quedó registrado en tu Billetera para coordinar entrega.`, {
          type: 'success',
        });
      } catch (err) {
        toast(friendlyError(err, 'Error al canjear producto'), { type: 'error' });
      }
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 pb-16 animate-in fade-in duration-300">
      {/* ── HEADER ── */}
      <header className="space-y-4 border-b border-border/40 pb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
            <Wallet size={20} />
          </div>
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/90 font-medium block">
              Billetera del Bosque
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-foreground tracking-tight mt-0.5">
              Billetera & Beneficios
            </h1>
          </div>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
          Tu pase digital para canjes presenciales en ferias, acumulación de sellos por variedad, catálogo de recompensas por puntos y medios de pago para reposición continua.
        </p>
      </header>

      {/* ── 1. TARJETA DESTACADA: CATÁLOGO DE CANJE POR PUNTOS ── */}
      <section aria-labelledby="canje-heading" className="bg-card border border-border/70 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-accent" />
              <span className="text-[0.65rem] font-mono uppercase tracking-[0.25em] text-accent-text font-bold">
                Puntos de Fidelización
              </span>
            </div>
            <h2 id="canje-heading" className="font-display text-2xl sm:text-3xl text-foreground font-light">
              Catálogo de Canje por Puntos
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Tus puntos acumulables por compras de miel nativa se canjean por frascos exclusivos, mieles de guarda y catas guiadas. Al reclamar, el canje queda registrado en tu Billetera y nuestro equipo coordina la entrega contigo.
            </p>
          </div>

          <div className="bg-surface-sunken/60 border border-border/80 rounded-2xl p-5 min-w-[220px] text-center space-y-3 shrink-0">
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Tu Saldo Disponible
            </div>
            <div className="font-display text-4xl text-foreground font-light text-accent-text">
              {balance.toLocaleString('es-CL')} <span className="text-sm font-mono uppercase text-muted-foreground">pts</span>
            </div>
            <button
              type="button"
              onClick={() => setShowCatalogModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-mono uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <span>Explorar Canjes</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground font-mono">
          <span>
            Nivel en colmena:{' '}
            <strong className="text-foreground">
              {loyalty.tierDisplay.guardianTier}
            </strong>
          </span>
          <span>1.000 pts = $10.000 en recompensas exclusivas</span>
        </div>
      </section>

      {/* ── 2. MODAL EMERGENTE DEL CATÁLOGO DE CANJE ── */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0"
            aria-hidden="true"
            onClick={() => setShowCatalogModal(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-catalog-title"
            className="relative w-full max-w-2xl bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl z-10 my-8 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <div>
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-accent" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent-text font-bold">
                    Catálogo de Recompensas
                  </span>
                </div>
                <h3 id="modal-catalog-title" className="font-display text-2xl text-foreground font-light mt-1">
                  Canjear Puntos por Productos
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
                aria-label="Cerrar catálogo"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-sunken/60 border border-border/60">
              <span className="text-xs text-muted-foreground">Tu saldo actual de puntos:</span>
              <span className="font-mono text-base font-bold text-accent-text">
                {balance.toLocaleString('es-CL')} pts
              </span>
            </div>

            {loyalty.rewards.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm italic">
                No hay recompensas activas disponibles en este momento.
              </div>
            ) : (
              <div className="space-y-4">
                {loyalty.rewards.map((reward) => {
                  const canAfford = balance >= reward.points_cost;
                  return (
                    <div
                      key={reward.id}
                      className="p-5 rounded-2xl bg-surface-sunken/40 border border-border/70 hover:border-accent/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 max-w-md">
                        <div className="flex items-center gap-2">
                          {reward.reward_type === 'experience' ? (
                            <Flame size={14} className="text-accent" />
                          ) : (
                            <Star size={14} className="text-accent" />
                          )}
                          <h4 className="font-display text-lg text-foreground font-medium">
                            {reward.name}
                          </h4>
                        </div>
                        {reward.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {reward.description}
                          </p>
                        )}
                        <span className="inline-block text-[11px] font-mono text-accent-text font-bold pt-1">
                          {reward.points_cost.toLocaleString('es-CL')} puntos
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isPending || !canAfford}
                        onClick={() => handleClaimReward(reward)}
                        className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all shrink-0 ${
                          canAfford
                            ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm'
                            : 'bg-secondary text-muted-foreground cursor-not-allowed opacity-50'
                        }`}
                      >
                        <ShoppingBag size={14} />
                        <span>{canAfford ? 'Reclamar ($0)' : 'Puntos insuficientes'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-4 border-t border-border/40 text-[11px] text-muted-foreground leading-relaxed">
              * El producto se incorpora a tu bolsa a $0. Puedes solicitar su despacho de inmediato pagando el envío, o sumar productos de catálogo con dinero: si alcanzas el monto para envío gratis, el despacho de todo tu pedido será bonificado.
            </div>
          </div>
        </div>
      )}

      {/* ── 3. PASE DIGITAL, SELLOS Y WALLET ── */}
      <section aria-labelledby="wallet-heading" className="space-y-6">
        <GuardianStampsSection initialSnapshot={initialSnapshot} />
      </section>

      {/* ── 4. GESTIÓN DE MEDIOS DE PAGO PARA SUSCRIPCIONES ── */}
      <section aria-labelledby="pagos-heading" className="bg-card border border-border/70 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
              <CreditCard size={18} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground font-medium block">
                Suscripciones Recurrentes
              </span>
              <h3 id="pagos-heading" className="font-display text-xl text-foreground font-light">
                Medio de Pago Registrado
              </h3>
            </div>
          </div>
          <Link
            href="/perfil/reposicion"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-mono uppercase tracking-wider text-foreground hover:border-accent/40 hover:text-accent transition-colors shrink-0"
          >
            <span>Ver Suscripción</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Los cobros de reposición programada se procesan mediante la pasarela segura de pago con cargo automático en la fecha de tu ciclo.
        </p>

        <div className="p-4 rounded-2xl bg-surface-sunken/40 border border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-accent" />
            <div>
              <p className="text-xs font-medium text-foreground">Pasarela Segura Autorizada</p>
              <p className="text-[10px] text-muted-foreground">Tarjeta vinculada a tu cuenta</p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-accent/10 text-accent-text border border-accent/20 font-bold">
            Activo
          </span>
        </div>
      </section>

      {/* ── 5. CÓDIGO DE INVITACIÓN (REFERIDOS) ── */}
      <section aria-labelledby="invitacion-heading" className="bg-card border border-border/70 rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
              <Users size={18} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground font-medium block">
                Comunidad de El Legado
              </span>
              <h3 id="invitacion-heading" className="font-display text-xl text-foreground font-light">
                Invitaciones & Vínculos
              </h3>
            </div>
          </div>
          <span className="text-xs font-mono text-accent-text bg-accent/10 border border-accent/20 px-3 py-1 rounded-full font-bold">
            +50 pts por cada amigo
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
          Comparte tu código de invitación con amigos o familiares interesados en miel nativa de autor y el bosque de Chiloé. Cuando se unan al Enjambre con tu código, sumas 50 puntos a tu billetera.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <div className="flex-1 bg-surface-sunken/60 border border-border rounded-xl px-4 py-3 font-mono text-sm font-bold text-foreground tracking-wider flex items-center justify-between">
            <span>{referral.referralCode || 'OYZ-LEGADO-01'}</span>
            <span className="text-[10px] text-muted-foreground font-normal uppercase">Código Personal</span>
          </div>
          <button
            type="button"
            onClick={handleCopyReferral}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-mono uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity"
          >
            {copiedReferral ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
            <span>{copiedReferral ? '¡Copiado!' : 'Copiar Enlace'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 rounded-xl bg-surface-sunken/30 border border-border/50 text-center">
            <p className="font-display text-2xl text-foreground font-light">
              {referral.referralCount}
            </p>
            <p className="text-[10px] font-mono uppercase text-muted-foreground mt-0.5">
              Amigos Vinculados
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-sunken/30 border border-border/50 text-center">
            <p className="font-display text-2xl text-foreground font-light text-accent-text">
              +{referral.referralPurchases * 50}
            </p>
            <p className="text-[10px] font-mono uppercase text-muted-foreground mt-0.5">
              Puntos Recompensados
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
