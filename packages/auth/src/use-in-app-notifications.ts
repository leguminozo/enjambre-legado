'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  IN_APP_READ_STORAGE_PREFIX,
  mapInAppNotificationRow,
  type InAppBellNotification,
  type InAppNotificationApp,
  type InAppNotificationRow,
} from './in-app-notifications';
import {
  categoriesForPlatformRole,
  sourceToNotificationCategory,
} from './notification-preferences';

function rowCategory(row: InAppNotificationRow): string {
  const meta = (row.provider_response ?? {}) as Record<string, unknown>;
  if (typeof meta.category === 'string' && meta.category) return meta.category;
  if (typeof meta.source === 'string' && meta.source) {
    try {
      return sourceToNotificationCategory(meta.source);
    } catch {
      return 'sistema';
    }
  }
  return 'sistema';
}

type QueryChain = {
  eq(col: string, val: string): QueryChain;
  or(filter: string): QueryChain;
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
  /** RoleKey: destinos y copy de la campana. */
  role?: string | null;
  limit?: number;
  onLoadError?: (message: string) => void;
  /** Suscripción Realtime (lazy: activar al abrir campana o en checkout). Default false. */
  enableRealtime?: boolean;
}

export function useInAppNotifications({
  userId,
  supabaseClient,
  app = 'tienda',
  role = null,
  limit = 8,
  onLoadError,
  enableRealtime = false,
}: UseInAppNotificationsOptions) {
  const [notifs, setNotifs] = useState<InAppBellNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Los consumidores crean el cliente en render (identidad nueva por render).
  // Ref: si entrara en deps, el canal realtime se re-crearía en cada render.
  const supabaseRef = useRef(supabaseClient);
  useEffect(() => {
    supabaseRef.current = supabaseClient;
  }, [supabaseClient]);
  const onLoadErrorRef = useRef(onLoadError);
  useEffect(() => {
    onLoadErrorRef.current = onLoadError;
  }, [onLoadError]);

  // Reset e hidratación en fase de render cuando el userId cambia (patrón
  // recomendado por React para ajustar estado por prop; evita setState en
  // efecto al desloguearse o cambiar de usuario).
  const [prevUserId, setPrevUserId] = useState(userId);
  if (prevUserId !== userId) {
    setPrevUserId(userId);
    if (!userId) {
      setReadIds(new Set());
      setNotifs([]);
    } else {
      try {
        const stored = localStorage.getItem(`${IN_APP_READ_STORAGE_PREFIX}${userId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setReadIds(new Set(parsed));
        }
      } catch {
        // ignore corrupt localStorage
      }
    }
  }

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

      const supabase = supabaseRef.current as SupabaseLike;
      const { data, error: fetchError } = await supabase
        .from('notification_events')
        .select('*')
        .eq('channel', 'in_app')
        .or(`recipient_user_id.eq.${userId},created_by.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) {
        const msg = fetchError.message || 'No se pudieron cargar las notificaciones';
        setError(msg);
        onLoadErrorRef.current?.(msg);
        if (!background) setIsLoading(false);
        return;
      }

      const allowed = new Set<string>(categoriesForPlatformRole(role));
      const rows = (data ?? []).filter((row) => allowed.has(rowCategory(row)));
      setNotifs(rows.map((row) => mapInAppNotificationRow(row, app, { role })));
      if (!background) setIsLoading(false);
    },
    [userId, limit, app, role],
  );

  useEffect(() => {
    if (!userId) return;

    // Microtask: load() setea estado sincrónicamente antes del primer await;
    // diferirlo evita el setState síncrono dentro del efecto (regla react-hooks).
    queueMicrotask(() => void load(false));

    if (!enableRealtime) return;

    const supabase = supabaseRef.current as SupabaseLike;
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
  }, [userId, load, app, enableRealtime]);

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