'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Lock,
  ExternalLink,
  Info,
} from 'lucide-react';
import {
  toast,
  friendlyError,
  ClubTierIcon,
  formatCLP,
  Button,
  ConfirmDialog,
} from '@enjambre/ui';
import type { WalletGuardianSnapshot } from '@enjambre/wallet';
import { GuardianStampsSection } from '@/components/shop/guardian-stamps-section';
import { DireccionForm } from '@/components/perfil/direccion-form';
import {
  redeemLoyaltyReward,
  type LoyaltyReward,
  type ReferralStats,
} from '@/app/actions/perfil-experiences';
import {
  createDireccion,
  updateDireccion,
  deleteDireccion,
  setDefaultDireccion,
} from '@/app/actions/direcciones';
import type { UnifiedTierDisplay } from '@/lib/shop/tier-display';
import type {
  ClienteDireccion,
  DireccionFormData,
} from '@/lib/shop/direcciones-schema';

interface BilleteraClientProps {
  initialSnapshot: WalletGuardianSnapshot | null;
  loyalty: {
    balance: number;
    tier: string;
    tierDisplay: UnifiedTierDisplay;
    rewards: LoyaltyReward[];
  };
  referral: ReferralStats;
  initialDirecciones?: ClienteDireccion[];
  hasPaymentMethod?: boolean;
  userName?: string;
  initialOpenModal?: boolean;
}

export function BilleteraClient({
  initialSnapshot,
  loyalty,
  referral,
  initialDirecciones = [],
  hasPaymentMethod = false,
  userName = '',
  initialOpenModal = false,
}: BilleteraClientProps) {
  const router = useRouter();
  const [balance, setBalance] = useState(loyalty.balance);
  const [showCatalogModal, setShowCatalogModal] = useState(initialOpenModal);
  const [showCardModal, setShowCardModal] = useState(false);
  const [isEnrollingCard, setIsEnrollingCard] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Gestión de Direcciones
  const [direcciones, setDirecciones] = useState<ClienteDireccion[]>(initialDirecciones);
  const [isEditingAddress, setIsEditingAddress] = useState<string | null>(null);
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Apertura automática desde enlaces externos (?modal=canje o #canjes o #direcciones)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('modal') === 'canje' || window.location.hash === '#canjes') {
        setShowCatalogModal(true);
      }
      if (window.location.hash === '#direcciones') {
        const el = document.getElementById('direcciones-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }, []);

  // Bloqueo de scroll y cierre con tecla Escape para los modales
  useEffect(() => {
    const isAnyModalOpen = showCatalogModal || showCardModal;
    if (!isAnyModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCatalogModal(false);
        setShowCardModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [showCatalogModal, showCardModal]);

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

  // Acciones de Direcciones
  const handleCreateAddress = async (data: DireccionFormData) => {
    try {
      const nueva = await createDireccion(data);
      setDirecciones((prev) => [
        nueva,
        ...prev.map((d) => (nueva.es_predeterminada ? { ...d, es_predeterminada: false } : d)),
      ]);
      setIsCreatingAddress(false);
      toast('Dirección añadida exitosamente', { type: 'success' });
      router.refresh();
    } catch (err) {
      toast(friendlyError(err, 'Error al guardar la dirección'), { type: 'error' });
    }
  };

  const handleUpdateAddress = async (id: string, data: DireccionFormData) => {
    try {
      const actualizada = await updateDireccion(id, data);
      setDirecciones((prev) => prev.map((d) => (d.id === id ? actualizada : d)));
      setIsEditingAddress(null);
      toast('Dirección actualizada exitosamente', { type: 'success' });
      router.refresh();
    } catch (err) {
      toast(friendlyError(err, 'Error al actualizar la dirección'), { type: 'error' });
    }
  };

  const handleDeleteAddress = (id: string) => {
    setDeleteTargetId(id);
  };

  const executeDeleteAddress = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    try {
      await deleteDireccion(deleteTargetId);
      setDirecciones((prev) => prev.filter((d) => d.id !== deleteTargetId));
      toast('Dirección eliminada', { type: 'success' });
      router.refresh();
      setDeleteTargetId(null);
    } catch {
      toast('Error al eliminar dirección', { type: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await setDefaultDireccion(id);
      setDirecciones((prev) =>
        prev
          .map((d) => ({
            ...d,
            es_predeterminada: d.id === id,
          }))
          .sort((a, b) =>
            a.es_predeterminada === b.es_predeterminada
              ? 0
              : a.es_predeterminada
              ? -1
              : 1,
          ),
      );
      toast('Dirección predeterminada actualizada', { type: 'success' });
      router.refresh();
    } catch {
      toast('Error al actualizar dirección predeterminada', { type: 'error' });
    }
  };

  const handleEnrollCard = async () => {
    setIsEnrollingCard(true);
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        toast('Inicia sesión para vincular tu tarjeta', { type: 'error' });
        setIsEnrollingCard(false);
        return;
      }

      const { getNucleoApiUrl } = await import('@/lib/shop/nucleo-url');
      const nucleoUrl = getNucleoApiUrl();
      if (!nucleoUrl) {
        toast('Servicio de pasarela no disponible temporalmente', { type: 'error' });
        setIsEnrollingCard(false);
        return;
      }

      const res = await fetch(`${nucleoUrl}/api/wallet/cards/enroll-init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/perfil/billetera`,
        }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        url?: string;
        token?: string;
        code?: string;
        message?: string;
      };

      if (res.ok && json.url && json.token) {
        window.location.href = `${json.url}?token=${json.token}`;
        return;
      }

      if (json.code === 'flow_service_not_contracted') {
        toast(
          'La cuenta de Flow requiere activar el módulo de Cobro Automático para tarjetas independientes. Puedes usar Reposición de Miel mientras tanto.',
          { type: 'error' },
        );
      } else {
        toast(json.message || 'No fue posible conectar con Flow en este momento.', {
          type: 'error',
        });
      }
    } catch {
      toast('Error al comunicarse con la pasarela bancaria', { type: 'error' });
    } finally {
      setIsEnrollingCard(false);
    }
  };

  const editAddressData = isEditingAddress
    ? direcciones.find((d) => d.id === isEditingAddress) ?? null
    : null;

  return (
    <div className="w-full space-y-12 sm:space-y-16 pb-20 animate-in fade-in duration-300">
      {/* ── HEADER NORMALIZADO Y ESPACIOSO ── */}
      <header className="space-y-4 border-b border-border/40 pb-8 sm:pb-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0 shadow-sm">
            <Wallet size={24} />
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground font-semibold block">
              Billetera del Bosque
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-foreground tracking-tight mt-1">
              Billetera & Beneficios
            </h1>
          </div>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-3xl">
          Tu pase digital para recolección en colmenas, acumulación de puntos por compras de miel nativa, catálogo de canje exclusivo, bóveda de tarjetas tokenizadas y libreta central de direcciones.
        </p>
      </header>

      {/* ── 1. BLOQUE DE PUNTOS & CANJE: 2 TARJETAS INDEPENDIENTES EN GRID ── */}
      <section aria-labelledby="puntos-heading" className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {/* TARJETA 1 (Col 1-7): Tarjeta Digital de Puntos / Balance del Bosque */}
          <div className="lg:col-span-7 rounded-3xl border border-border/70 p-7 sm:p-9 flex flex-col justify-between min-h-[270px] sm:min-h-[290px] relative overflow-hidden bg-gradient-to-br from-card via-surface-sunken to-card shadow-xl group transition-all hover:border-accent/40">
            {/* Resplandor ámbar decorativo */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

            {/* Cabecera de la tarjeta */}
            <div className="flex items-center justify-between gap-4 relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-accent-text text-xs font-mono font-bold uppercase tracking-wider">
                <Award size={13} className="text-accent shrink-0" />
                <span id="puntos-heading">Balance Disponible</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-raised/90 border border-border/80 text-foreground text-xs font-mono font-semibold uppercase tracking-wider">
                <ClubTierIcon icon={loyalty.tierDisplay.tierIcono} size={14} className="text-accent shrink-0" />
                <span>{loyalty.tierDisplay.tierNombre || loyalty.tierDisplay.guardianTier}</span>
              </div>
            </div>

            {/* Núcleo de la tarjeta: contador de puntos y equivalencia */}
            <div className="my-6 relative z-10 space-y-2">
              <div className="font-display text-5xl sm:text-6xl lg:text-7xl font-light text-foreground tracking-tight leading-none text-accent-text">
                {balance.toLocaleString('es-CL')}{' '}
                <span className="text-xl sm:text-2xl font-mono uppercase text-muted-foreground font-normal">
                  pts
                </span>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground font-sans font-light">
                ≈ <strong className="text-foreground font-semibold">{formatCLP(balance * 10)}</strong> en recompensas de miel nativa de autor
              </p>
            </div>

            {/* Pie de la tarjeta */}
            <div className="pt-4 border-t border-border/40 flex items-center justify-between gap-4 text-xs font-mono text-muted-foreground relative z-10">
              <span>1.000 pts = $10.000 en canjes exclusivos</span>
              <Wallet size={18} className="text-muted-foreground/60 shrink-0" />
            </div>
          </div>

          {/* TARJETA 2 (Col 8-12): Tarjeta del Catálogo de Canje por Puntos */}
          <div className="lg:col-span-5 rounded-3xl border border-border/70 bg-card p-7 sm:p-9 flex flex-col justify-between min-h-[270px] sm:min-h-[290px] shadow-sm relative overflow-hidden transition-all hover:border-border hover:shadow-md">
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent shrink-0">
                  <Award size={24} />
                </div>
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium bg-surface-sunken/80 px-3 py-1 rounded-full border border-border/60">
                  {loyalty.rewards.length} Recompensas
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-foreground font-light leading-tight">
                Catálogo de Canje
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-2.5">
                Redime tus puntos acumulados por frascos de miel nativa de autor, mieles de guarda y catas guiadas en el bosque de Chiloé.
              </p>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => setShowCatalogModal(true)}
                className="w-full min-h-[48px] py-3 px-6 rounded-2xl bg-primary text-primary-foreground text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2.5 shadow-sm"
              >
                <ShoppingBag size={16} />
                <span>Explorar Canjes</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. MODAL NORMALIZADO Y EXPANDIDO DEL CATÁLOGO DE CANJE ── */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0"
            aria-hidden="true"
            onClick={() => setShowCatalogModal(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-catalog-title"
            className="relative w-full max-w-4xl bg-card border border-border rounded-3xl p-6 sm:p-10 space-y-6 shadow-2xl z-10 my-8 max-h-[88vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-5 border-b border-border/60">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-accent" />
                  <span className="text-xs font-mono uppercase tracking-[0.2em] text-accent-text font-bold">
                    Recompensas de Miel Nativa
                  </span>
                </div>
                <h3 id="modal-catalog-title" className="font-display text-2xl sm:text-3xl text-foreground font-light">
                  Catálogo de Canje por Puntos
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
                aria-label="Cerrar catálogo"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-surface-sunken/60 border border-border/60">
              <span className="text-sm text-muted-foreground">Tu saldo disponible para canje:</span>
              <span className="font-mono text-xl sm:text-2xl font-bold text-accent-text">
                {balance.toLocaleString('es-CL')} pts
              </span>
            </div>

            {loyalty.rewards.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm italic">
                No hay recompensas activas disponibles en este momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {loyalty.rewards.map((reward) => {
                  const canAfford = balance >= reward.points_cost;
                  return (
                    <div
                      key={reward.id}
                      className="p-6 rounded-2xl bg-surface-sunken/40 border border-border/70 hover:border-accent/40 transition-colors flex flex-col justify-between gap-5"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {reward.reward_type === 'experience' ? (
                            <Flame size={16} className="text-accent shrink-0" />
                          ) : (
                            <Star size={16} className="text-accent shrink-0" />
                          )}
                          <h4 className="font-display text-lg sm:text-xl text-foreground font-medium leading-snug">
                            {reward.name}
                          </h4>
                        </div>
                        {reward.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {reward.description}
                          </p>
                        )}
                        <div className="pt-2">
                          <span className="inline-block text-xs font-mono text-accent-text font-bold px-3 py-1 rounded-md bg-accent/10 border border-accent/20">
                            {reward.points_cost.toLocaleString('es-CL')} puntos
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isPending || !canAfford}
                        onClick={() => handleClaimReward(reward)}
                        className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all ${
                          canAfford
                            ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm'
                            : 'bg-secondary text-muted-foreground cursor-not-allowed opacity-50'
                        }`}
                      >
                        <ShoppingBag size={15} />
                        <span>{canAfford ? 'Reclamar ($0)' : 'Puntos insuficientes'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-4 border-t border-border/40 text-xs text-muted-foreground leading-relaxed flex items-center gap-2">
              <Info size={14} className="shrink-0 text-accent" />
              <span>
                El producto se incorpora a tu bolsa a $0. Puedes solicitar su despacho inmediato o sumarlo a tus compras habituales de miel nativa.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. PASE DIGITAL, SELLOS Y WALLET NATIVO ── */}
      <section aria-labelledby="wallet-heading" className="space-y-6">
        <GuardianStampsSection initialSnapshot={initialSnapshot} />
      </section>

      {/* ── 4. MEDIOS DE PAGO & TARJETAS REGISTRADAS (VISUAL TIPO BILLETERA) ── */}
      <section aria-labelledby="pagos-heading" className="bg-card border border-border/70 rounded-3xl p-6 sm:p-9 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent shrink-0">
              <CreditCard size={22} />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground font-semibold block">
                Bóveda Segura de Pagos
              </span>
              <h3 id="pagos-heading" className="font-display text-2xl sm:text-3xl text-foreground font-light">
                Tarjetas & Medios de Pago
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCardModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-xs font-mono uppercase tracking-wider text-foreground hover:border-accent/40 hover:text-accent transition-colors shrink-0"
          >
            <Plus size={14} />
            <span>{hasPaymentMethod ? 'Actualizar Tarjeta' : 'Vincular Tarjeta'}</span>
          </button>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
          Administra de forma centralizada las tarjetas vinculadas para tus compras en tienda y reposición programada. Tus datos viajan protegidos bajo certificación bancaria oficial PCI-DSS Nivel 1 mediante la pasarela segura autorizada (Transbank / Flow).
        </p>

        {/* Tarjeta bancaria visual en Billetera */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pt-2">
          {/* Tarjeta Estilizada */}
          <div className="lg:col-span-7 rounded-2xl border border-border/80 bg-gradient-to-br from-surface-raised via-card to-surface-sunken p-6 sm:p-8 flex flex-col justify-between min-h-[200px] sm:min-h-[220px] shadow-lg relative overflow-hidden group">
            {/* Chip EMV y Contactless */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-7 rounded-md bg-accent/25 border border-accent/40 flex items-center justify-center relative">
                  <div className="w-6 h-4 border border-accent/50 rounded-sm" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80 font-bold">
                  Bóveda Tokenizada
                </span>
              </div>
              <span className="font-mono text-xs uppercase tracking-wider font-bold text-accent-text px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                Webpay · Visa / MC
              </span>
            </div>

            {/* Número enmascarado */}
            <div className="my-5 relative z-10">
              <div className="font-mono text-xl sm:text-2xl text-foreground tracking-[0.25em] font-medium">
                •••• •••• •••• {hasPaymentMethod ? '4821' : '••••'}
              </div>
              <p className="text-[11px] font-mono text-muted-foreground uppercase mt-1">
                {hasPaymentMethod ? 'Tarjeta autorizada para cobros automáticos' : 'Sin tarjeta activa registrada'}
              </p>
            </div>

            {/* Titular y Estado */}
            <div className="pt-3 border-t border-border/40 flex items-center justify-between relative z-10 text-xs font-mono">
              <div className="truncate max-w-[200px]">
                <span className="text-[10px] text-muted-foreground uppercase block">Titular</span>
                <span className="text-foreground uppercase font-medium">
                  {userName || 'Miembro del Legado'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase block">Estado</span>
                <span className={`font-semibold uppercase ${hasPaymentMethod ? 'text-accent-text' : 'text-muted-foreground'}`}>
                  {hasPaymentMethod ? 'Activo (Token OK)' : 'Pendiente'}
                </span>
              </div>
            </div>
          </div>

          {/* Garantías y Acciones Legales */}
          <div className="lg:col-span-5 rounded-2xl bg-surface-sunken/40 border border-border/70 p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-accent-text font-bold">
                <ShieldCheck size={16} className="text-accent shrink-0" />
                <span>Normativa Bancaria Chilena</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                En cumplimiento con la Ley N° 21.719 y la normativa de la CMF, <strong>no almacenamos números de tarjeta, códigos de seguridad (CVV) ni fechas de vencimiento</strong> en nuestras bases de datos.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cada transacción o cobro recurrente se ejecuta mediante un <em>token criptográfico único</em> emitido por la pasarela oficial autorizada.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/perfil/reposicion"
                className="w-full text-center py-2.5 px-4 rounded-xl border border-border text-xs font-mono uppercase tracking-wider text-foreground hover:border-accent/40 hover:text-accent transition-colors"
              >
                Ver Suscripción Activa
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── MODAL EXPLICATIVO DE VINCULACIÓN SEGURA DE TARJETA ── */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0"
            aria-hidden="true"
            onClick={() => setShowCardModal(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-card-title"
            className="relative w-full max-w-lg bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl z-10 my-8"
          >
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <Lock size={18} className="text-accent" />
                <h3 id="modal-card-title" className="font-display text-xl text-foreground font-light">
                  Vincular Tarjeta con Pasarela
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCardModal(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Para vincular o actualizar tu tarjeta bancaria de forma 100% legal y protegida, serás redirigido a la pasarela bancaria oficial (Transbank / Flow). Se realiza una validación de seguridad de $50 CLP que se reversa de inmediato.
            </p>

            <div className="p-4 rounded-xl bg-surface-sunken/60 border border-border/60 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <ShieldCheck size={15} className="text-accent" />
                <span>Bóveda Tokenizada PCI-DSS Nivel 1</span>
              </div>
              <p>Tu tarjeta quedará guardada como token seguro para tus compras y reposiciones futuras sin volver a ingresar tus datos.</p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                disabled={isEnrollingCard}
                onClick={handleEnrollCard}
                className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-mono uppercase tracking-wider font-semibold text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <span>
                  {isEnrollingCard
                    ? 'Conectando con Pasarela Flow...'
                    : 'Ir a Pasarela Oficial y Vincular Tarjeta'}
                </span>
                <ExternalLink size={14} />
              </button>

              <div className="relative my-1 text-center">
                <span className="text-[10px] font-mono text-muted-foreground uppercase px-2 bg-card">
                  o también
                </span>
              </div>

              <Link
                href="/perfil/reposicion"
                onClick={() => setShowCardModal(false)}
                className="w-full py-2.5 px-4 rounded-xl border border-border text-xs font-mono uppercase tracking-wider text-foreground hover:border-accent/40 hover:text-accent transition-colors flex items-center justify-center gap-2 text-center"
              >
                <span>Vincular mediante Reposición de Miel</span>
                <ArrowRight size={14} />
              </Link>

              <button
                type="button"
                onClick={() => setShowCardModal(false)}
                className="w-full py-2 px-4 rounded-xl text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. LIBRETA DE DIRECCIONES CENTRALIZADA EN BILLETERA ── */}
      <section id="direcciones-section" aria-labelledby="direcciones-heading" className="bg-card border border-border/70 rounded-3xl p-6 sm:p-9 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent shrink-0">
              <MapPin size={22} />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground font-semibold block">
                Logística & Despacho Territorial
              </span>
              <h3 id="direcciones-heading" className="font-display text-2xl sm:text-3xl text-foreground font-light">
                Libreta de Direcciones
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsEditingAddress(null);
              setIsCreatingAddress((prev) => !prev);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-mono uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity shrink-0 shadow-sm"
          >
            {isCreatingAddress ? <X size={14} /> : <Plus size={14} />}
            <span>{isCreatingAddress ? 'Cancelar' : 'Añadir Dirección'}</span>
          </button>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
          Gestiona tus domicilios de entrega para despachos rápidos de miel de bosque nativo. La dirección predeterminada se aplica de forma automática en tu bolsa de compras y en tus ciclos de reposición.
        </p>

        {/* Formulario de creación inline */}
        {isCreatingAddress && (
          <div className="bg-surface-raised rounded-2xl border border-accent/30 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h4 className="text-xl font-display text-accent-text mb-6">Añadir Nueva Dirección de Despacho</h4>
            <DireccionForm
              onSubmit={handleCreateAddress}
              onCancel={() => setIsCreatingAddress(false)}
            />
          </div>
        )}

        {/* Formulario de edición inline */}
        {isEditingAddress && editAddressData && (
          <div className="bg-surface-raised rounded-2xl border border-accent/30 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h4 className="text-xl font-display text-accent-text mb-6">Editar Dirección de Despacho</h4>
            <DireccionForm
              initialData={editAddressData}
              onSubmit={(data) => handleUpdateAddress(editAddressData.id, data)}
              onCancel={() => setIsEditingAddress(null)}
            />
          </div>
        )}

        {/* Lista de Direcciones en Grid */}
        {!isCreatingAddress && !isEditingAddress && (
          <>
            {direcciones.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 sm:p-12 text-center space-y-4 bg-surface-sunken/40">
                <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center text-muted-foreground mx-auto">
                  <MapPin size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-display text-foreground font-medium">Sin direcciones guardadas</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                    Añade tu domicilio de entrega para que tus pedidos y canjes de miel nativa lleguen con máxima rapidez.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingAddress(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-xs font-mono uppercase tracking-wider text-foreground hover:border-accent/40 hover:text-accent transition-colors"
                >
                  <Plus size={14} />
                  <span>Añadir primera dirección</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                {direcciones.map((dir) => (
                  <div
                    key={dir.id}
                    className={`rounded-2xl border p-6 flex flex-col justify-between gap-5 transition-all duration-300 ${
                      dir.es_predeterminada
                        ? 'bg-surface-raised border-accent/60 shadow-md ring-1 ring-accent/20'
                        : 'bg-surface-sunken/40 border-border/80 hover:border-border hover:bg-surface-raised/40'
                    }`}
                  >
                    <div>
                      {/* Cabecera de la tarjeta de dirección */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl ${dir.es_predeterminada ? 'bg-accent/15 text-accent-text' : 'bg-surface-raised text-muted-foreground'}`}>
                            <MapPin size={18} />
                          </div>
                          <div>
                            <h4 className="font-display text-lg text-foreground font-medium leading-tight">
                              {dir.etiqueta}
                            </h4>
                            {dir.es_predeterminada && (
                              <span className="text-[10px] font-mono uppercase tracking-wider text-accent-text font-bold inline-flex items-center gap-1 mt-0.5">
                                <Star size={11} className="fill-accent text-accent" /> Predeterminada
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setIsEditingAddress(dir.id)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
                            title="Editar dirección"
                            aria-label={`Editar dirección ${dir.etiqueta}`}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(dir.id)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Eliminar dirección"
                            aria-label={`Eliminar dirección ${dir.etiqueta}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Detalles del destinatario y domicilio */}
                      <div className="text-xs sm:text-sm text-muted-foreground space-y-1 pt-1 leading-relaxed">
                        <p className="font-semibold text-foreground">{dir.nombre}</p>
                        <p className="font-mono text-xs">{dir.telefono}</p>
                        <p>{dir.direccion}</p>
                        <p>{dir.comuna}, {dir.ciudad} ({dir.region})</p>
                        {dir.codigo_postal && <p className="font-mono text-xs text-muted-foreground/80">CP: {dir.codigo_postal}</p>}
                        {dir.instrucciones && (
                          <p className="pt-2 mt-2 border-t border-border/40 italic text-xs text-muted-foreground/90">
                            "{dir.instrucciones}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Acción de predeterminada */}
                    {!dir.es_predeterminada && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(dir.id)}
                        className="w-full py-2.5 px-3 text-xs font-mono uppercase tracking-wider font-semibold text-muted-foreground hover:text-accent border border-dashed border-border hover:border-accent rounded-xl transition-colors"
                      >
                        Establecer como predeterminada
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* ── 6. CÓDIGO DE INVITACIÓN (REFERIDOS) ── */}
      <section aria-labelledby="invitacion-heading" className="bg-card border border-border/70 rounded-3xl p-6 sm:p-9 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent shrink-0">
              <Users size={22} />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground font-semibold block">
                Comunidad de El Legado
              </span>
              <h3 id="invitacion-heading" className="font-display text-2xl sm:text-3xl text-foreground font-light">
                Invitaciones & Vínculos
              </h3>
            </div>
          </div>
          <span className="text-xs font-mono text-accent-text bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-full font-bold self-start sm:self-auto">
            +50 pts por cada amigo
          </span>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
          Comparte tu código de invitación con personas interesadas en miel nativa de autor y el bosque de Chiloé. Cuando se unan al Enjambre con tu código, sumas 50 puntos a tu billetera.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <div className="flex-1 bg-surface-sunken/60 border border-border rounded-2xl px-5 py-3.5 font-mono text-base font-bold text-foreground tracking-wider flex items-center justify-between">
            <span>{referral.referralCode || 'OYZ-LEGADO-01'}</span>
            <span className="text-xs text-muted-foreground font-normal uppercase">Código Personal</span>
          </div>
          <button
            type="button"
            onClick={handleCopyReferral}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground text-xs font-mono uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            {copiedReferral ? <Check size={16} className="text-accent" /> : <Copy size={16} />}
            <span>{copiedReferral ? '¡Copiado!' : 'Copiar Enlace'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-2">
          <div className="p-5 rounded-2xl bg-surface-sunken/30 border border-border/50 text-center space-y-1">
            <p className="font-display text-3xl sm:text-4xl text-foreground font-light">
              {referral.referralCount}
            </p>
            <p className="text-xs font-mono uppercase text-muted-foreground">
              Amigos Vinculados
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-surface-sunken/30 border border-border/50 text-center space-y-1">
            <p className="font-display text-3xl sm:text-4xl text-accent-text font-light">
              +{referral.referralPurchases * 50}
            </p>
            <p className="text-xs font-mono uppercase text-muted-foreground">
              Puntos Recompensados
            </p>
          </div>
        </div>
      </section>

      {/* Diálogo de confirmación para eliminar dirección */}
      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        title="Eliminar dirección de despacho"
        description="¿Estás seguro de eliminar este domicilio? Si eliminas una dirección predeterminada, deberás seleccionar otra."
        confirmLabel="Eliminar dirección"
        cancelLabel="Cancelar"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={executeDeleteAddress}
      />
    </div>
  );
}
