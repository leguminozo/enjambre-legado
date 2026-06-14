'use client';

import React, { useState } from 'react';
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

export function NotificationBell({
  notifications = [],
  onMarkRead,
  onMarkAllRead,
  className,
  isLoading = false,
  error = null,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  const handleToggle = () => setOpen((o) => !o);

  const handleMark = (id: string | number) => {
    onMarkRead?.(id);
  };

  const handleMarkAll = () => {
    onMarkAllRead?.();
    setOpen(false);
  };

  return (
    <div className={`relative ${className ?? ''}`}>
      <button
        onClick={handleToggle}
        aria-label="Notificaciones"
        aria-expanded={open}
        className="relative text-muted-foreground hover:text-accent transition-colors p-1"
      >
        <Bell size={20} strokeWidth={1.6} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center tabular-nums">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-[80] w-80 sm:w-96 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground font-medium">
              Notificaciones
            </div>
            {unread > 0 && onMarkAllRead && (
              <button
                onClick={handleMarkAll}
                className="text-[0.6rem] uppercase tracking-widest text-accent hover:underline"
              >
                Marcar todas leídas
              </button>
            )}
            <button onClick={() => setOpen(false)} aria-label="Cerrar" className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>

          <div className="max-h-[320px] overflow-auto divide-y divide-border text-sm">
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
                <p className="mt-1 text-[0.65rem] text-muted-foreground/70">Las alertas de floración y tus pedidos aparecerán aquí.</p>
              </div>
            ) : (
              notifications.slice(0, 6).map((n) => {
                const content = (
                  <>
                    <div className="font-medium tracking-tight text-foreground line-clamp-1">{n.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.message}</div>
                    {n.time && <div className="mt-1.5 text-[10px] text-muted-foreground/70 tracking-widest">{n.time}</div>}
                  </>
                );

                return (
                  <div
                    key={n.id}
                    className={`group flex gap-3 px-4 py-3.5 transition-colors hover:bg-surface-raised/60 ${!n.read ? 'bg-accent/[0.03]' : ''} border-l-2 ${typeAccent[n.type || 'default']}`}
                    onClick={() => handleMark(n.id)}
                  >
                    <div className="flex-1 min-w-0">
                      {n.href ? (
                        <a href={n.href} className="block" onClick={() => setOpen(false)}>
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
              onClick={() => setOpen(false)}
              className="inline-block w-full py-2 text-[0.65rem] uppercase tracking-[0.25em] text-accent hover:text-foreground transition-colors"
            >
              Ver todas las alertas y preferencias →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
