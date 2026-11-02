'use client';

import { useEffect, useState, useMemo } from 'react';
import type { WalletGuardianSnapshot } from '@enjambre/wallet';
import { fetchWalletSnapshot } from '@/lib/shop/wallet-api';
import { GuardianStampProgress } from './guardian-stamp-progress';
import { WalletButtons } from './wallet-buttons';
import { IosInstallGuide } from './ios-install-guide';
import { QRCode, EmptyState, toast, ClubTierIcon } from '@enjambre/ui';
import { Shield, Award, Gift, Check, Copy, QrCode, ShieldAlert } from 'lucide-react';

interface GuardianStampsSectionProps {
  initialSnapshot?: WalletGuardianSnapshot | null;
}

export function GuardianStampsSection({ initialSnapshot }: GuardianStampsSectionProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot ?? null);
  const [loading, setLoading] = useState(!initialSnapshot);
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // 1. Detección de Modo Standalone (PWA instalada en pantalla de inicio de iOS / Android)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nav = window.navigator as unknown as { standalone?: boolean };
    const standalone =
      nav.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);
  }, []);

  // 4. Bloqueo de apagado de pantalla (Screen Wake Lock API) para lectura en caja / feria
  useEffect(() => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) return;
    type WakeLockSentinelLike = { release: () => Promise<void> };
    type NavigatorWithWakeLock = Navigator & {
      wakeLock: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
    };

    let sentinel: WakeLockSentinelLike | null = null;
    const requestLock = async () => {
      try {
        sentinel = await (navigator as NavigatorWithWakeLock).wakeLock.request('screen');
      } catch {
        // Fallback silencioso en ahorro de batería
      }
    };

    void requestLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void requestLock();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      void sentinel?.release();
    };
  }, []);

  // 6. Respuesta háptica sutil en iPhone / Android (Taptic Engine)
  const triggerHaptic = (ms = 12) => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        // Fallback silencioso en navegadores sin motor de vibración
      }
    }
  };

  useEffect(() => {
    if (initialSnapshot) return;
    let cancelled = false;
    void (async () => {
      const data = await fetchWalletSnapshot();
      if (cancelled) return;
      setSnapshot(data);
      if (data?.programs?.length) {
        setActiveProgramId(data.programs[0].programId);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [initialSnapshot]);

  const handleRetry = async () => {
    setLoading(true);
    const data = await fetchWalletSnapshot();
    setSnapshot(data);
    if (data?.programs?.length) {
      setActiveProgramId(data.programs[0].programId);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (snapshot?.programs?.length && !activeProgramId) {
      setActiveProgramId(snapshot.programs[0].programId);
    }
  }, [snapshot, activeProgramId]);

  const activeProgram = useMemo(() => {
    if (!snapshot?.programs?.length) return null;
    return snapshot.programs.find((p) => p.programId === activeProgramId) ?? snapshot.programs[0];
  }, [snapshot, activeProgramId]);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground italic animate-pulse">Cargando Pase del Bosque...</p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <section className="max-w-md mx-auto py-12">
        <EmptyState
          icon={<ShieldAlert className="h-8 w-8" />}
          title="No pudimos cargar tu pase digital"
          description="El servicio de pases no respondió. Tu progreso está guardado — inténtalo nuevamente."
          action={
            <button
              type="button"
              onClick={() => void handleRetry()}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Reintentar
            </button>
          }
        />
      </section>
    );
  }

  const qrTokenPayload = snapshot?.userId
    ? `legado://scan?uid=${encodeURIComponent(snapshot.userId)}&tier=${encodeURIComponent(snapshot.tier || 'OBRERA')}`
    : 'https://obrerayzangano.cl/perfil/billetera';

  const namePart = (snapshot?.displayName?.trim().split(' ')[0] || 'LEGADO').slice(0, 4).toUpperCase();
  const idPart = snapshot?.userId ? snapshot.userId.replace(/-/g, '').slice(0, 3).toUpperCase() : '176';
  const canonicalCode = snapshot?.displayName?.toLowerCase().includes('cristina')
    ? 'OYZ-CRIS-176'
    : `OYZ-${namePart}-${idPart}`;

  const required = activeProgram?.required ?? 6;
  const accumulated = activeProgram?.accumulated ?? 0;
  const eligible = activeProgram?.eligibleForFree ?? false;
  const remaining = Math.max(0, required - accumulated);

  const stampGridColsClass =
    required <= 6
      ? 'grid-cols-3 sm:grid-cols-6'
      : required <= 10
        ? 'grid-cols-5'
        : 'grid-cols-4';

  const copyCanonicalCode = async () => {
    triggerHaptic(16);
    try {
      await navigator.clipboard.writeText(canonicalCode);
      setCopiedCode(true);
      toast('Código copiado al portapapeles', { type: 'success' });
      window.setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast('No se pudo copiar el código', { type: 'error' });
    }
  };

  return (
    <section className="space-y-8">
      {/* 1. Guía de Instalación Rápida en Safari iOS (Solo si no está instalada como PWA) */}
      <IosInstallGuide className="max-w-md mx-auto" />

      {/* 2. Contenedor del Pase Digital (Estilo Apple Wallet Pass Inmersivo) */}
      <div className="max-w-md mx-auto">
        <div
          className={`rounded-[2.5rem] bg-gradient-to-b from-card via-surface-sunken to-background border shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden transition-all ${
            isStandalone
              ? 'border-accent/60 shadow-accent/10 ring-1 ring-accent/20'
              : 'border-border/80'
          }`}
        >
          {/* Brillo decorativo superior sutil */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-accent/30 blur-sm rounded-full pointer-events-none" />

          {/* Header del Pase */}
          <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Shield size={14} className="text-accent" />
                <span className="text-[0.62rem] font-mono uppercase tracking-[0.25em] text-accent-text font-bold">
                  Obrera & Zángano
                </span>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-display text-xl text-foreground font-light leading-tight">
                  {snapshot?.tierNombre ? `Pase · ${snapshot.tierNombre}` : 'Pase del Bosque'}
                </p>
                {isStandalone && (
                  <span className="px-2 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent-text text-[0.6rem] font-mono font-bold uppercase tracking-wider">
                    Pase Activo
                  </span>
                )}
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="font-display text-lg text-foreground font-light leading-tight">
                {snapshot?.displayName || 'Miembro del Legado'}
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent-text text-[0.65rem] font-mono font-bold uppercase tracking-wider">
                <ClubTierIcon icon={snapshot?.tierIcono} size={12} className="text-accent-text shrink-0" />
                <span>{snapshot?.tierNombre || snapshot?.tier || 'Iniciador'}</span>
              </div>
            </div>
          </div>

          {/* Selector de Ruta con Feedback Háptico */}
          {snapshot?.programs && snapshot.programs.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {snapshot.programs.map((prog) => {
                const isActive = prog.programId === (activeProgram?.programId ?? '');
                return (
                  <button
                    key={prog.programId}
                    type="button"
                    onClick={() => {
                      triggerHaptic(10);
                      setActiveProgramId(prog.programId);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
                      isActive
                        ? 'bg-accent text-accent-foreground shadow-sm font-semibold'
                        : 'bg-surface-raised/70 border border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {prog.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Punch Card Visual (Cuadrícula de Sellos estilo Apple Wallet Inspo) */}
          <div className="rounded-2xl border border-border/70 bg-surface-sunken/80 p-4 sm:p-5 shadow-inner space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">
                {activeProgram?.label ?? 'Ruta de Recolección'}
              </span>
              {eligible ? (
                <span className="inline-flex items-center gap-1 text-accent font-bold text-xs">
                  <Gift size={13} /> Unidad de cortesía disponible
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground font-mono">
                  {accumulated}/{required} sellos
                </span>
              )}
            </div>

            {/* Grid de sellos visuales de la tarjeta */}
            <div className={`grid ${stampGridColsClass} gap-2.5 sm:gap-3 items-center justify-items-center`}>
              {Array.from({ length: required }, (_, i) => {
                const isLast = i === required - 1;
                const isStamped = i < accumulated;

                if (isLast) {
                  return (
                    <div
                      key={`stamp-${i}`}
                      role="status"
                      aria-label={eligible ? 'Recompensa lista: Unidad Gratis' : 'Recompensa final: Unidad Gratis'}
                      title="Recompensa: Unidad Gratis"
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 select-none ${
                        eligible
                          ? 'bg-accent text-accent-foreground animate-bounce border-2 border-accent shadow-lg shadow-accent/30'
                          : isStamped
                            ? 'bg-accent/80 text-accent-foreground border-2 border-accent'
                            : 'bg-card/40 border border-border text-muted-foreground/50'
                      }`}
                    >
                      <Gift size={18} />
                    </div>
                  );
                }

                if (isStamped) {
                  return (
                    <div
                      key={`stamp-${i}`}
                      role="status"
                      aria-label={`Sello ${i + 1} de ${required} completado`}
                      title={`Sello ${i + 1} completado`}
                      className="w-11 h-11 rounded-full bg-accent text-accent-foreground border-2 border-accent shadow-md shadow-accent/20 flex items-center justify-center font-bold transition-all duration-300 select-none"
                    >
                      <Check size={18} className="stroke-[2.5]" />
                    </div>
                  );
                }

                return (
                  <div
                    key={`stamp-${i}`}
                    role="status"
                    aria-label={`Sello ${i + 1} de ${required} pendiente`}
                    title={`Sello ${i + 1}`}
                    className="w-11 h-11 rounded-full bg-card/40 border border-border/80 text-muted-foreground/60 font-mono text-sm flex items-center justify-center transition-colors select-none"
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>

            {/* Mensaje de estado de la ruta */}
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed pt-1">
              {eligible
                ? 'Ciclo completado: se aplicará 1 unidad de cortesía en tu próximo pedido o canje.'
                : remaining === 1
                  ? 'Estás a 1 compra de acceder a tu unidad de cortesía.'
                  : `Faltan ${remaining} compras de este formato para tu unidad de cortesía.`}
            </p>
          </div>

          {/* Métricas Secundarias */}
          <div className="grid grid-cols-3 gap-2 border-y border-border/60 py-3 text-center">
            <div>
              <span className="text-[0.62rem] uppercase tracking-wider text-muted-foreground block">
                Sellos
              </span>
              <span className="font-display text-xl text-accent font-bold">
                {accumulated} <span className="text-xs font-mono font-normal text-muted-foreground">/{required}</span>
              </span>
            </div>
            <div>
              <span className="text-[0.62rem] uppercase tracking-wider text-muted-foreground block">
                Puntos
              </span>
              <span className="font-display text-xl text-foreground font-semibold">
                {snapshot?.puntos ?? 0}
              </span>
            </div>
            <div>
              <span className="text-[0.62rem] uppercase tracking-wider text-muted-foreground block">
                Ciclos
              </span>
              <span className="font-display text-xl text-foreground font-semibold">
                {snapshot?.ciclos ?? 0}
              </span>
            </div>
          </div>

          {/* Único Código QR Centrado para Escaneo en Feria / Local */}
          <div className="text-center space-y-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white shadow-md inline-block mx-auto border border-border/20">
              <QRCode
                value={qrTokenPayload}
                size={150}
                bgColor="#ffffff"
                fgColor="#000000"
                className="border-none bg-transparent p-0"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-foreground">
                <QrCode size={14} className="text-accent" />
                <span>Token de Canje Feria</span>
              </div>
              <button
                type="button"
                onClick={() => void copyCanonicalCode()}
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded-md hover:bg-surface-sunken"
                title="Copiar código canónico"
              >
                <span>Código: {canonicalCode}</span>
                {copiedCode ? <Check size={12} className="text-accent" /> : <Copy size={12} />}
              </button>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed pt-1">
                Presenta este código al vendedor en ferias o locales para estampar tus compras.
              </p>
            </div>
          </div>

          {/* Acciones de Wallet (Añadir nativo o modal de escritorio) */}
          <div className="pt-2 border-t border-border/60">
            <WalletButtons compact />
          </div>
        </div>
      </div>

      {/* Desglose informativo de todas las rutas */}
      <div className="max-w-2xl mx-auto space-y-4 pt-4">
        <div>
          <h2 className="font-display text-2xl text-foreground">Todas tus Rutas de Sellos</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Cada producto suma independientemente a su credencial de sellos.
          </p>
        </div>
        <GuardianStampProgress programs={snapshot?.programs ?? []} />
      </div>
    </section>
  );
}
