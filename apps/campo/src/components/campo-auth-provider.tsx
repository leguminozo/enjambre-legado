'use client';

import { useAuthStore } from '@enjambre/auth';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useRef } from 'react';

export function CampoAuthProvider({ children }: { children: React.ReactNode }) {
  const checkUser = useAuthStore((s) => s.checkUser);
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);

  if (!clientRef.current) clientRef.current = createClient();

  useEffect(() => {
    useAuthStore.getState().setAppSource('campo');
    checkUser();

    if (!clientRef.current) return;

    const { data: { subscription } } = clientRef.current.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkUser();
      } else {
        useAuthStore.setState({ user: null, session: null, isAuthenticated: false, isLoading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [checkUser]);

  return <>{children}</>;
}
