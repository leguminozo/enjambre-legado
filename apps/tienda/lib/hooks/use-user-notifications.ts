'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { friendlyError, toast } from '@enjambre/ui';
import type { Notification } from '@enjambre/ui';

// Minimal shape for the columns we consume (avoids cross-package type resolution issues while remaining strongly typed)
type NotificationRow = {
  id: string;
  channel: string;
  created_at: string;
  created_by: string | null;
  body: string | null;
  subject: string | null;
  recipient: string | null;
  status: string;
  provider_response: unknown;
};

interface UseUserNotificationsOptions {
  limit?: number;
}

export function useUserNotifications(userId: string | undefined | null, opts: UseUserNotificationsOptions = {}) {
  const limit = opts.limit ?? 8;
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persisted read state per user (client only)
  useEffect(() => {
    if (!userId) {
      setReadIds(new Set());
      return;
    }
    try {
      const key = `oyz-notif-read-${userId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setReadIds(new Set(parsed));
      }
    } catch {}
  }, [userId]);

  const persistRead = useCallback((ids: Set<string>) => {
    if (!userId) return;
    try {
      const key = `oyz-notif-read-${userId}`;
      localStorage.setItem(key, JSON.stringify(Array.from(ids)));
    } catch {}
  }, [userId]);

  const mapRow = (row: NotificationRow): Notification => ({
    id: row.id,
    title: row.subject || 'Notificación',
    message: row.body || '',
    time: row.created_at
      ? new Date(row.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
      : undefined,
    type: row.channel === 'in_app' ? 'gold' : 'default',
    href: (row.subject || '').toLowerCase().includes('floraci')
      ? '/perfil/alertas'
      : (row.subject || '').toLowerCase().includes('pedido') || (row.subject || '').toLowerCase().includes('despach')
        ? '/perfil/pedidos'
        : '/perfil/alertas',
  });

  const load = useCallback(async (background = false) => {
    if (!userId) {
      setNotifs([]);
      setError(null);
      return;
    }
    if (!background) {
      setIsLoading(true);
    }
    setError(null);
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from('notification_events')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (fetchError) {
      const msg = friendlyError(fetchError) || 'No se pudieron cargar las notificaciones';
      setError(msg);
      if (!background) setIsLoading(false);
      toast(msg, { type: 'error', duration: 5000 });
      return;
    }

    if (data) {
      setNotifs(data.map(mapRow));
    }
    if (!background) setIsLoading(false);
  }, [userId, limit]);

  // Initial load + realtime
  useEffect(() => {
    if (!userId) {
      setNotifs([]);
      return;
    }

    load(false);

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_events',
          filter: `created_by=eq.${userId}`,
        },
        () => {
          // Background realtime update – do not show loading spinner
          load(true).catch(() => {});
        }
      )
      .subscribe((status: string, err?: unknown) => {
        if (err || status === 'CHANNEL_ERROR') {
          console.error('[Notifications] Realtime error', err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, load]);

  const notifsWithRead = useMemo(
    () => notifs.map((n) => ({ ...n, read: readIds.has(String(n.id)) })),
    [notifs, readIds]
  );

  const unreadCount = notifsWithRead.filter((n) => !n.read).length;

  const markRead = (id: string | number) => {
    const idStr = String(id);
    const next = new Set(readIds);
    next.add(idStr);
    setReadIds(next);
    persistRead(next);
  };

  const markAllRead = () => {
    const all = notifs.map((n) => String(n.id));
    const next = new Set([...readIds, ...all]);
    setReadIds(next);
    persistRead(next);
  };

  return {
    notifications: notifsWithRead,
    unreadCount,
    isLoading,
    error,
    markRead,
    markAllRead,
    refresh: load,
  };
}
