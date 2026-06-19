'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  IN_APP_READ_STORAGE_PREFIX,
  mapInAppNotificationRow,
  type InAppBellNotification,
  type InAppNotificationApp,
  type InAppNotificationRow,
} from './in-app-notifications';

type QueryChain = {
  eq(col: string, val: string): QueryChain;
  order(col: string, opts: { ascending: boolean }): {
    limit(n: number): Promise<{ data: InAppNotificationRow[] | null; error: { message: string } | null }>;
  };
};

type RealtimeChannel = {
  on(
    event: string,
    filter: { event: string; schema: string; table: string; filter?: string },
    cb: () => void,
  ): RealtimeChannel;
  subscribe(cb?: (status: string, err?: unknown) => void): RealtimeChannel;
};

type SupabaseLike = {
  from(table: string): {
    select(cols: string): QueryChain;
  };
  channel(name: string): RealtimeChannel;
  removeChannel(channel: RealtimeChannel): void;
};

export interface UseInAppNotificationsOptions {
  userId: string | undefined | null;
  supabaseClient: unknown;
  app?: InAppNotificationApp;
  limit?: number;
  onLoadError?: (message: string) => void;
  /** Suscripción Realtime (lazy: activar al abrir campana o en checkout). Default false. */
  enableRealtime?: boolean;
}

export function useInAppNotifications({
  userId,
  supabaseClient,
  app = 'tienda',
  limit = 8,
  onLoadError,
  enableRealtime = false,
}: UseInAppNotificationsOptions) {
  const [notifs, setNotifs] = useState<InAppBellNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setReadIds(new Set());
      return;
    }
    try {
      const stored = localStorage.getItem(`${IN_APP_READ_STORAGE_PREFIX}${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setReadIds(new Set(parsed));
      }
    } catch {
      // ignore corrupt localStorage
    }
  }, [userId]);

  const persistRead = useCallback((ids: Set<string>) => {
    if (!userId) return;
    try {
      localStorage.setItem(`${IN_APP_READ_STORAGE_PREFIX}${userId}`, JSON.stringify(Array.from(ids)));
    } catch {
      // ignore quota errors
    }
  }, [userId]);

  const load = useCallback(
    async (background = false) => {
      if (!userId) {
        setNotifs([]);
        setError(null);
        return;
      }

      if (!background) setIsLoading(true);
      setError(null);

      const supabase = supabaseClient as SupabaseLike;
      const { data, error: fetchError } = await supabase
        .from('notification_events')
        .select('*')
        .eq('created_by', userId)
        .eq('channel', 'in_app')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) {
        const msg = fetchError.message || 'No se pudieron cargar las notificaciones';
        setError(msg);
        onLoadError?.(msg);
        if (!background) setIsLoading(false);
        return;
      }

      setNotifs((data ?? []).map((row) => mapInAppNotificationRow(row, app)));
      if (!background) setIsLoading(false);
    },
    [userId, limit, supabaseClient, app, onLoadError],
  );

  useEffect(() => {
    if (!userId) {
      setNotifs([]);
      return;
    }

    void load(false);

    if (!enableRealtime) return;

    const supabase = supabaseClient as SupabaseLike;
    const realtimeChannel = supabase.channel(`in-app-notifications-${app}-${userId}`);
    realtimeChannel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_events',
          filter: `created_by=eq.${userId}`,
        },
        () => {
          void load(true);
        },
      )
      .subscribe((status: string, err?: unknown) => {
        if (err || status === 'CHANNEL_ERROR') {
          console.error('[useInAppNotifications] Realtime error', err);
        }
      });

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [userId, load, supabaseClient, app, enableRealtime]);

  const notifications = useMemo(
    () => notifs.map((n) => ({ ...n, read: readIds.has(String(n.id)) })),
    [notifs, readIds],
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

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
    notifications,
    unreadCount,
    isLoading,
    error,
    markRead,
    markAllRead,
    refresh: load,
  };
}