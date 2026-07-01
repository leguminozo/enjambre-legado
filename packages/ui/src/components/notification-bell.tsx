'use client';

import React, { useEffect, useState } from 'react';
import { Bell, X, ArrowRight, Loader2 } from 'lucide-react';

export interface Notification {
  id: string | number;
  title: string;
  message: string;
  time?: string;
  type?: 'default' | 'success' | 'warning' | 'error' | 'gold';
  href?: string;
  read?: boolean;
}

interface NotificationBellProps {
  notifications?: Notification[];
  onMarkRead?: (id: string | number) => void;
  onMarkAllRead?: () => void;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  isLoading?: boolean;
  error?: string | null;
}

const typeAccent: Record<string, string> = {
  default: 'border-border',
  success: 'border-accent/50',
  warning: 'border-warning/60',
  error: 'border-destructive/60',
  gold: 'border-accent',
};

function NotificationPanel({
  unread,
  onMarkAllRead,
  onClose,
  isLoading,
  error,
  notifications,
  onMark,
  mobile = false,
}: {
  unread: number;
  onMarkAllRead?: () => void;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
  notifications: Notification[];
  onMark: (id: string | number) => void;
  mobile?: boolean;
}) {
  return (
    <div
      className={
        mobile
          ? 'flex max-h-[min(85vh,32rem)] flex-col overflow-hidden rounded-b-2xl border border-border bg-card shadow-2xl'
          : 'w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:w-96'
      }
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-muted-foreground">
          Notificaciones
        </div>
        {unread > 0 && onMarkAllRead && (
          <button
            onClick={onMarkAllRead}
            className="text-[0.6rem] uppercase tracking-widest text-accent hover:underline"
          >
            Marcar todas leídas
          </button>
        )}
        <button onClick={onClose} aria-label="Cerrar" className="text-muted-foreground hover:text-foreground">
          <X size={16} />
        </button>
      </div>

      <div className={`divide-y divide-border overflow-auto text-sm ${mobile ? 'flex-1' : 'max-h-[320px]'}`}>
        {isLoading ? (
          <div className="px-4 py-10 text-center text-muted-foreground">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin opacity-60" />
            <p className="text-xs tracking-wide">Cargando notificaciones...</p>
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-center text-destructive">
            <p className="text-xs tracking-wide">Error al cargar</p>
            <p className="mt-1 text-[0.65rem] text-muted-foreground/70">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-10 text-center text-muted-foreground">
            <Bell className="mx-auto mb-3 h-8 w-8 opacity-40" />
            <p className="text-xs tracking-wide">Todo en calma por ahora.</p>
            <p className="mt-1 text-[0.65rem] text-muted-foreground/70">
              Las alertas de floración y tus pedidos aparecerán aquí.
            </p>
          </div>
        ) : (
          notifications.slice(0, 6).map((n) => {
            const content = (
              <>
                <div className="line-clamp-1 font-medium tracking-tight text-foreground">{n.title}</div>
                <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</div>
                {n.time && (
                  <div className="mt-1.5 text-[10px] tracking-widest text-muted-foreground/70">{n.time}</div>
                )}
              </>
            );

            return (
              <div
                key={n.id}
                className={`group flex gap-3 px-4 py-3.5 transition-colors hover:bg-surface-raised/60 ${!n.read ? 'bg-accent/[0.03]' : ''} border-l-2 ${typeAccent[n.type || 'default']}`}
                onClick={() => onMark(n.id)}
              >
                <div className="min-w-0 flex-1">
                  {n.href ? (
                    <a href={n.href} className="block" onClick={onClose}>
                      {content}
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-accent group-hover:underline">
                        Ver detalle <ArrowRight size={11} />
                      </span>
                    </a>
                  ) : (
                    content
                  )}
                </div>
                {!n.read && <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />}
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-border p-2 text-center">
        <a
          href="/perfil/alertas"
          onClick={onClose}
          className="inline-block w-full py-2 text-[0.65rem] uppercase tracking-[0.25em] text-accent transition-colors hover:text-foreground"
        >
          Ver todas las alertas y preferencias →
        </a>
      </div>
    </div>
  );
}

export function NotificationBell({
  notifications = [],
  onMarkRead,
  onMarkAllRead,
  onOpenChange,
  className,
  isLoading = false,
  error = null,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      onOpenChange?.(next);
      return next;
    });
  };

  const handleClose = () => {
    setOpen(false);
    onOpenChange?.(false);
  };

  const handleMark = (id: string | number) => {
    onMarkRead?.(id);
  };

  const handleMarkAll = () => {
    onMarkAllRead?.();
    handleClose();
  };

  return (
    <div className={`relative ${className ?? ''}`}>
      <button
        onClick={handleToggle}
        aria-label="Notificaciones"
        aria-expanded={open}
        className="relative p-1 text-muted-foreground transition-colors hover:text-accent"
      >
        <Bell size={20} strokeWidth={1.6} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold tabular-nums text-accent-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && isMobile && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[78] border-0 bg-background/80 p-0 backdrop-blur-sm"
            aria-label="Cerrar notificaciones"
            onClick={handleClose}
          />
          <div
            className="fixed left-0 right-0 z-[79] px-3"
            style={{ top: 'var(--tienda-sticky-top, 0px)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Notificaciones"
          >
            <NotificationPanel
              unread={unread}
              onMarkAllRead={onMarkAllRead ? handleMarkAll : undefined}
              onClose={handleClose}
              isLoading={isLoading}
              error={error}
              notifications={notifications}
              onMark={handleMark}
              mobile
            />
          </div>
        </>
      )}

      {open && !isMobile && (
        <div className="absolute right-0 top-10 z-[80]">
          <NotificationPanel
            unread={unread}
            onMarkAllRead={onMarkAllRead ? handleMarkAll : undefined}
            onClose={handleClose}
            isLoading={isLoading}
            error={error}
            notifications={notifications}
            onMark={handleMark}
          />
        </div>
      )}
    </div>
  );
}