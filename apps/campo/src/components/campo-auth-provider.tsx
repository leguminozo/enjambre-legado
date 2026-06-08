'use client';

import { useAuthStore } from '@enjambre/auth';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useMemo } from 'react';

export function CampoAuthProvider({ children }: { children: React.ReactNode }) {
  const checkUser = useAuthStore((s) => s.checkUser);
  const client = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!client) return;
    useAuthStore.getState().setAppSource('campo');
    checkUser();

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkUser();
      } else {
        useAuthStore.setState({ user: null, session: null, isAuthenticated: false, isLoading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [checkUser, client]);

  return <>{children}</>;
}
