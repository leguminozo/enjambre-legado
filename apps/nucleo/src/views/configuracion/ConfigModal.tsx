'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Lock,
  Building2,
  Map,
  TreePine,
  Settings,
  SlidersHorizontal,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button,
  Skeleton,
  overlayBackdropClassName,
  useModalFocusTrap,
  cn,
} from '@enjambre/ui';
import { useAuthStore } from '@enjambre/auth';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { usePerfil } from '../perfil/use-perfil';
import { PreferenciasTab } from '../perfil/PreferenciasTab';
import { DatosPersonalesSection } from './DatosPersonalesSection';
import { SeguridadSection } from './SeguridadSection';
import { PushSection } from './PushSection';
import { EmpresasSection } from './EmpresasSection';
import { TerritorioSection } from './TerritorioSection';
import { RedeemInviteForm } from '@/components/invitaciones/RedeemInviteForm';
import {
  ROLE_LABELS,
  getConfigSectionsForRole,
  SECTION_GROUPS,
  SECTION_DEFS,
  type Section,
} from './constants';

const SECTION_ICONS: Record<Section, React.ComponentType<{ size?: number; className?: string }>> = {
  personal: User,
  seguridad: Lock,
  preferencias: SlidersHorizontal,
  territorio: Map,
  empresas: Building2,
};

export interface ConfigModalProps {
  open: boolean;
  onClose: () => void;
  initialSection?: Section;
}

export function ConfigModal({ open, onClose, initialSection }: ConfigModalProps) {
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const shellMode = useShellLayout();
  const isMobile = shellMode === 'mobile';

  const perfil = usePerfil();
  const { profile, loading, message } = perfil;

  const allowedKeys = useMemo(
    () => getConfigSectionsForRole(profile?.role),
    [profile?.role],
  );

  const defaultSection = useMemo<Section>(() => {
    if (initialSection && allowedKeys.includes(initialSection)) {
      return initialSection;
    }
    return allowedKeys[0] ?? 'personal';
  }, [initialSection, allowedKeys]);

  const [activeSection, setActiveSection] = useState<Section>(defaultSection);
  const [mobileView, setMobileView] = useState<'menu' | Section>(
    initialSection && initialSection !== 'personal' ? initialSection : 'menu',
  );
  const [direction, setDirection] = useState<number>(1);
  const lastPushedViewRef = useRef<'menu' | Section | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);

  useModalFocusTrap({
    open,
    onClose,
    containerRef: dialogRef,
    lockBodyScroll: true,
  });

  // Sincronizar sección por defecto al abrir o cambiar initialSection
  useEffect(() => {
    if (!open) return;
    setActiveSection(defaultSection);
    if (initialSection && initialSection !== 'personal') {
      setMobileView(initialSection);
    } else {
      setMobileView('menu');
    }
  }, [open, defaultSection, initialSection]);

  // Manejo de historial para Nivel 2 en móvil (Back button de Android / Safari regresa al Menú)
  useEffect(() => {
    if (!open || !isMobile) return;

    if (lastPushedViewRef.current === null) {
      window.history.pushState({ type: 'nucleo_config', view: 'menu' }, '');
      lastPushedViewRef.current = 'menu';

      if (initialSection && initialSection !== 'personal') {
        window.history.pushState({ type: 'nucleo_config', view: initialSection }, '');
        lastPushedViewRef.current = initialSection;
        setMobileView(initialSection);
      }
    }

    const handlePopState = (e: PopStateEvent) => {
      const state = e.state as { type?: string; view?: 'menu' | Section } | null;
      if (!state || state.type !== 'nucleo_config') {
        onClose();
        return;
      }
      const targetView = state.view || 'menu';
      setDirection(targetView === 'menu' ? -1 : 1);
      setMobileView(targetView);
      if (targetView !== 'menu') setActiveSection(targetView);
      lastPushedViewRef.current = targetView;
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [open, isMobile, initialSection, onClose]);

  const handleClose = useCallback(() => {
    onClose();
    if (isMobile && lastPushedViewRef.current !== null) {
      const steps = mobileView === 'menu' ? -1 : -2;
      lastPushedViewRef.current = null;
      window.history.go(steps);
    }
  }, [onClose, isMobile, mobileView]);

  const goToSectionMobile = useCallback(
    (sec: Section) => {
      setDirection(1);
      setActiveSection(sec);
      setMobileView(sec);
      if (isMobile) {
        if (lastPushedViewRef.current === 'menu') {
          window.history.pushState({ type: 'nucleo_config', view: sec }, '');
        } else {
          window.history.replaceState({ type: 'nucleo_config', view: sec }, '');
        }
        lastPushedViewRef.current = sec;
      }
    },
    [isMobile],
  );

  const handleMobileBack = useCallback(() => {
    if (isMobile) {
      window.history.back();
    } else {
      setMobileView('menu');
    }
  }, [isMobile]);

  const handleLogout = async () => {
    onClose();
    await signOut();
    window.location.href = '/login';
  };

  const groupedSections = useMemo(() => {
    return SECTION_GROUPS.map((group) => {
      const items = Object.values(SECTION_DEFS).filter(
        (def) => def.groupId === group.id && allowedKeys.includes(def.key),
      );
      return { ...group, items };
    }).filter((g) => g.items.length > 0);
  }, [allowedKeys]);

  if (!open) return null;

  const renderSectionContent = (sec: Section) => {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {sec === 'personal' && (
          <div className="space-y-6">
            <DatosPersonalesSection {...perfil} />
            <RedeemInviteForm compact />
          </div>
        )}
        {sec === 'seguridad' && (
          <div className="space-y-6">
            <SeguridadSection {...perfil} />
            <PushSection />
          </div>
        )}
        {sec === 'preferencias' && <PreferenciasTab />}
        {sec === 'territorio' && allowedKeys.includes('territorio') && (
          <TerritorioSection {...perfil} />
        )}
        {sec === 'empresas' && allowedKeys.includes('empresas') && (
          <EmpresasSection {...perfil} />
        )}
      </div>
    );
  };

  /* ════════════════════════════════════════════════════════════════
     MOBILE VIEW — 2 Niveles: Menú agrupado -> Drill-down con animaciones
     ════════════════════════════════════════════════════════════════ */
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[220] flex flex-col justify-end">
        {/* Backdrop */}
        <button
          type="button"
          className={cn('absolute inset-0', overlayBackdropClassName)}
          aria-label="Cerrar modal"
          onClick={handleClose}
        />

        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Configuración"
          className="relative z-10 w-full h-[92dvh] max-h-[92dvh] rounded-t-3xl border-t border-border bg-background shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
        >
          {/* Header sticky móvil */}
          <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/70 bg-card/90 backdrop-blur-md">
            <div className="w-10 flex items-center">
              <AnimatePresence mode="popLayout">
                {mobileView !== 'menu' && (
                  <motion.button
                    key="back-btn"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    type="button"
                    onClick={handleMobileBack}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface-sunken/80 text-foreground hover:bg-muted transition-colors"
                    aria-label="Volver al menú de configuración"
                  >
                    <ChevronLeft size={20} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1 text-center truncate px-2">
              <h2 className="text-base font-semibold text-foreground tracking-tight truncate">
                {mobileView === 'menu'
                  ? 'Configuración'
                  : (SECTION_DEFS[mobileView]?.label ?? 'Configuración')}
              </h2>
            </div>

            <div className="w-10 flex items-center justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface-sunken/80 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Cerrar configuración"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* Contenido scrollable móvil con transición horizontal */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={mobileView}
                custom={direction}
                variants={{
                  enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
                  center: { x: 0, opacity: 1 },
                  exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 380, damping: 35 }}
                className="absolute inset-0 overflow-y-auto overscroll-contain p-4 pb-12 space-y-6"
              >
                {loading ? (
                  <div className="space-y-4" aria-busy="true" aria-label="Cargando configuración">
                    <Skeleton variant="text" className="w-48 h-6" />
                    <Skeleton variant="rectangular" className="w-full h-24 rounded-2xl" />
                    <Skeleton variant="rectangular" className="w-full h-12 rounded-xl" />
                    <Skeleton variant="rectangular" className="w-full h-12 rounded-xl" />
                  </div>
                ) : mobileView === 'menu' ? (
                  <div className="space-y-5">
                    {/* Tarjeta de Perfil interactiva */}
                    {profile && (
                      <button
                        type="button"
                        onClick={() => goToSectionMobile('personal')}
                        className="w-full p-4 rounded-2xl border border-border bg-card flex items-center gap-3.5 text-left active:scale-[0.98] hover:border-primary/40 transition-all shadow-sm cursor-pointer"
                      >
                        <div
                          className="relative h-12 w-12 rounded-full border border-border bg-cover bg-center shrink-0 flex items-center justify-center overflow-hidden"
                          style={{
                            backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : undefined,
                            backgroundColor: profile.avatar_url ? undefined : 'hsl(var(--muted))',
                          }}
                        >
                          {!profile.avatar_url && (
                            <span className="font-display text-lg text-foreground">
                              {profile.full_name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {profile.full_name || 'Sin nombre'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                          <span className="mt-1 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                            {ROLE_LABELS[profile.role] || profile.role}
                          </span>
                        </div>
                        <ChevronRight size={18} className="text-muted-foreground/60 shrink-0" />
                      </button>
                    )}

                    {/* Grupos de secciones */}
                    {groupedSections.map((group) => (
                      <div key={group.id} className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                          {group.label}
                        </p>
                        <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/60">
                          {group.items.map((item) => {
                            const Icon = SECTION_ICONS[item.key] ?? Settings;
                            return (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => goToSectionMobile(item.key)}
                                className="w-full flex items-center gap-3.5 p-3.5 text-left active:bg-muted/70 transition-colors cursor-pointer"
                              >
                                <div className="h-9 w-9 rounded-xl bg-surface-sunken/90 flex items-center justify-center text-foreground shrink-0">
                                  <Icon size={17} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {item.description}
                                  </p>
                                </div>
                                <ChevronRight size={16} className="text-muted-foreground/50 shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Controles de pie móvil: Cerrar sesión */}
                    <div className="rounded-2xl border border-border bg-card p-3">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => void handleLogout()}
                        className="w-full justify-center gap-2 text-sm"
                      >
                        <LogOut size={16} />
                        Cerrar sesión
                      </Button>
                    </div>
                  </div>
                ) : (
                  renderSectionContent(mobileView)
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════
     DESKTOP VIEW — 2 Columnas: Sidebar de categorías + Panel de contenido
     ════════════════════════════════════════════════════════════════ */
  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <button
        type="button"
        className={cn('absolute inset-0', overlayBackdropClassName)}
        aria-label="Cerrar modal"
        onClick={handleClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Configuración y perfil"
        className="relative z-10 w-[95vw] max-w-5xl h-[85vh] max-h-[880px] rounded-3xl border border-border bg-card shadow-2xl flex flex-row overflow-hidden animate-in zoom-in-95 fade-in-0 duration-200"
      >
        {/* ── Sidebar Izquierdo ── */}
        <aside className="w-64 sm:w-72 bg-surface-sunken/40 border-r border-border p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-6">
            {/* Cabecera Sidebar */}
            <div className="px-1">
              <p className="text-[0.62rem] uppercase tracking-[0.32em] text-muted-foreground font-semibold">
                Enjambre Legado
              </p>
              <h2 className="font-display text-xl font-semibold text-foreground tracking-tight mt-0.5">
                Configuración
              </h2>
            </div>

            {/* Resumen de Identidad */}
            {profile && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border">
                <div
                  className="relative h-10 w-10 rounded-full border border-border bg-cover bg-center shrink-0 flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : undefined,
                    backgroundColor: profile.avatar_url ? undefined : 'hsl(var(--muted))',
                  }}
                >
                  {!profile.avatar_url && (
                    <span className="font-display text-base text-foreground">
                      {profile.full_name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {profile.full_name || 'Usuario'}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">{profile.email}</p>
                </div>
              </div>
            )}

            {/* Listas de Tabs Agrupadas */}
            <div className="space-y-5">
              {groupedSections.map((group) => (
                <div key={group.id} className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = SECTION_ICONS[item.key] ?? Settings;
                      const isActive = activeSection === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setActiveSection(item.key)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer',
                            isActive
                              ? 'bg-accent text-accent-foreground font-semibold shadow-sm'
                              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                          )}
                        >
                          <Icon size={16} className={cn(isActive ? 'text-accent-foreground' : 'text-muted-foreground')} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer de Sidebar */}
          <div className="pt-4 border-t border-border/80">
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <LogOut size={15} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </aside>

        {/* ── Panel Derecho de Contenido ── */}
        <main className="flex-1 min-w-0 bg-background flex flex-col overflow-hidden relative">
          {/* Header del Panel */}
          <div className="shrink-0 flex items-center justify-between px-7 py-5 border-b border-border bg-card/50">
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                {SECTION_DEFS[activeSection]?.label ?? 'Configuración'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {SECTION_DEFS[activeSection]?.description}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cerrar ventana"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mensaje global de notificación si existe */}
          {message && (
            <div
              className={`mx-7 mt-5 p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                message.type === 'success'
                  ? 'bg-primary/10 border-primary/20 text-primary'
                  : 'bg-destructive/10 border-destructive/20 text-destructive'
              }`}
            >
              <AlertCircle size={15} />
              <span>{message.text}</span>
            </div>
          )}

          {/* Cuerpo scrollable del tab */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-7">
            {loading ? (
              <div className="max-w-3xl space-y-6 animate-in" aria-busy="true" aria-label="Cargando configuración">
                <Skeleton variant="text" className="w-48 h-6" />
                <Skeleton variant="text" className="w-80 max-w-full h-4" />
                <div className="space-y-4 pt-2">
                  <Skeleton variant="rectangular" className="h-10 rounded-lg" />
                  <Skeleton variant="rectangular" className="h-10 rounded-lg" />
                  <Skeleton variant="rectangular" className="h-10 rounded-lg" />
                </div>
              </div>
            ) : (
              <div key={activeSection} className="max-w-3xl space-y-6 animate-in fade-in duration-200">
                {renderSectionContent(activeSection)}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

