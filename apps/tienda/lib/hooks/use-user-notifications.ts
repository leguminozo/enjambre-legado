'use client';

import { createClient } from '@/utils/supabase/client';
import { useInAppNotifications } from '@enjambre/auth';
import { friendlyError, toast } from '@enjambre/ui';
import { useCallback } from 'react';

interface UseUserNotificationsOptions {
  limit?: number;
  enableRealtime?: boolean;
}

export function useUserNotifications(
  userId: string | undefined | null,
  opts: UseUserNotificationsOptions = {},
) {
  const onLoadError = useCallback((message: string) => {
    toast(friendlyError({ message }) || message, { type: 'error', duration: 5000 });
  }, []);

  return useInAppNotifications({
    userId,
    supabaseClient: createClient(),
    app: 'tienda',
    limit: opts.limit ?? 8,
    enableRealtime: opts.enableRealtime ?? false,
    onLoadError,
  });
}