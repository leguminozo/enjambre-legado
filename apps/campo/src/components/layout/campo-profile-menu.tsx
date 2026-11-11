'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Building2,
  Moon,
  Sun,
  Laptop,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  useTheme,
  toast,
  type Theme,
} from '@enjambre/ui';
import { useAuthStore } from '@enjambre/auth';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/offline/db';
import { useSyncEngine } from '@/hooks/use-sync-engine';

export interface CampoProfileMenuProps {
  /** Trigger personalizado o deja vacío para usar el botón por defecto */
  trigger?: React.ReactNode;
  /** Dirección del menú desplegable */
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
  onNavigate?: () => void;
  /** Modo compacto (solo avatar) para barras superiores móviles */
  compact?: boolean;
}

/**
 * Menú centralizado de cuenta para Campo (inspirado en el patrón Trama de Núcleo).
 * Exclusivo para la identidad y herramientas del agente comercial:
 * - Identidad del operador (Agente Comercial)
 * - Datos de transferencia bancaria (para cobro de comisiones)
 * - Selector de tema visual (oscuro / claro / sistema)
 * - Estado de conectividad y cola de sincronización Dexie
 * - Cierre de sesión seguro
 */
export function CampoProfileMenu({
  trigger,
  side = 'top',
  align = 'start',
  className,
  onNavigate,
  compact = false,
}: CampoProfileMenuProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { theme, setTheme } = useTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const { triggerSync } = useSyncEngine();

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const pendingCount = useLiveQuery(
    () => db.sync_queue.where('status').equals('pending').count(),
    [],
    0,
  );

  const displayName = user?.full_name?.trim() || user?.email?.split('@')[0] || 'Agente Comercial';
  const initial = (displayName.charAt(0) || 'A').toUpperCase();
  const email = user?.email || '';

  const handleLogout = async () => {
    setMenuOpen(false);
    onNavigate?.();
    try {
      localStorage.removeItem('enjambre-campo-pos-cart');
      localStorage.removeItem('enjambre-campo-pos-discount');
      localStorage.removeItem('enjambre_campo_active_cash_session');
    } catch {
      // Ignore local storage cleanup errors during logout
    }
    await signOut();
    window.location.href = '/login';
  };

  const handleBankDetails = () => {
    setMenuOpen(false);
    onNavigate?.();
    router.push('/pos/historial?tab=datos_pago');
  };

  const cycleTheme = () => {
    const themes: Theme[] = ['dark', 'light', 'system'];
    const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const defaultTrigger = compact ? (
    <button
      type="button"
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-accent/15 text-accent font-display font-bold text-sm hover:bg-accent/25 transition-colors border border-accent/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Menú de perfil del agente comercial"
      aria-haspopup="menu"
    >
      <span>{initial}</span>
    </button>
  ) : (
    <button
      type="button"
      className="w-full flex items-center justify-between gap-3 min-h-11 px-3 py-2 rounded-xl bg-background/[0.04] hover:bg-background/[0.08] border border-border/40 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Menú de perfil del agente comercial"
      aria-haspopup="menu"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 text-accent font-display font-bold flex items-center justify-center text-sm shrink-0">
          {initial}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-foreground truncate">{displayName}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
            Agente Comercial
          </span>
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-1">
        <span
          className={`w-2 h-2 rounded-full ${
            isOnline ? (pendingCount > 0 ? 'bg-warning' : 'bg-success') : 'bg-destructive'
          }`}
          title={isOnline ? (pendingCount > 0 ? 'Sincronizando' : 'En línea') : 'Sin conexión'}
        />
      </div>
    </button>
  );

  return (
    <DropdownMenu
      open={menuOpen}
      onOpenChange={setMenuOpen}
      side={side}
      align={align}
      sideOffset={8}
      className={className ?? 'w-64 p-1.5'}
      trigger={trigger ?? defaultTrigger}
    >
      <div className="px-3 py-2.5 border-b border-border/60 mb-1">
        <p className="text-sm font-semibold text-foreground truncate leading-tight">
          {displayName}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5 leading-tight">
          {email}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent/15 text-accent border border-accent/30">
            Agente Comercial
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              isOnline
                ? 'bg-success/10 text-success border border-success/30'
                : 'bg-destructive/10 text-destructive border border-destructive/30'
            }`}
          >
            {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
            {isOnline ? (pendingCount > 0 ? `${pendingCount} pend.` : 'Online') : 'Offline'}
          </span>
        </div>
      </div>

      {pendingCount > 0 && (
        <DropdownMenuItem
          onSelect={async (e) => {
            e.preventDefault();
            if (isManualSyncing) return;
            setIsManualSyncing(true);
            toast(`Sincronizando ${pendingCount} ${pendingCount === 1 ? 'venta' : 'ventas'} con Núcleo...`);
            try {
              await triggerSync();
              toast('Sincronización completada', { type: 'success' });
            } catch {
              toast('Error al sincronizar; se reintentará automáticamente', { type: 'error' });
            } finally {
              setIsManualSyncing(false);
            }
          }}
          className="gap-2.5 cursor-pointer text-xs bg-primary/10 text-primary focus:bg-primary/20 font-medium my-1"
        >
          <RefreshCw size={15} className={`shrink-0 text-primary ${isManualSyncing ? 'animate-spin' : ''}`} />
          <div className="flex flex-col">
            <span className="font-bold">Sincronizar ahora</span>
            <span className="text-[10px] text-muted-foreground">
              {pendingCount} {pendingCount === 1 ? 'venta en cola local' : 'ventas en cola local'}
            </span>
          </div>
        </DropdownMenuItem>
      )}

      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          handleBankDetails();
        }}
        className="gap-2.5 cursor-pointer text-xs"
      >
        <Building2 size={16} className="text-muted-foreground shrink-0" />
        <div className="flex flex-col">
          <span>Datos Bancarios</span>
          <span className="text-[10px] text-muted-foreground">Para depósito de comisiones</span>
        </div>
      </DropdownMenuItem>

      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          cycleTheme();
        }}
        className="gap-2.5 cursor-pointer text-xs"
      >
        {theme === 'dark' ? (
          <Moon size={16} className="text-muted-foreground shrink-0" />
        ) : theme === 'light' ? (
          <Sun size={16} className="text-muted-foreground shrink-0" />
        ) : (
          <Laptop size={16} className="text-muted-foreground shrink-0" />
        )}
        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-between">
            <span>Tema visual</span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">{theme}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Oscuro / Claro / Sistema</span>
        </div>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        destructive
        onSelect={(e) => {
          e.preventDefault();
          void handleLogout();
        }}
        className="gap-2.5 cursor-pointer text-xs text-destructive focus:text-destructive"
      >
        <LogOut size={16} className="shrink-0" />
        <span>Cerrar sesión</span>
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
