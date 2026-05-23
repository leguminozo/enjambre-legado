'use client';

import { useState, createContext, useContext, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@enjambre/ui';
import { createClient } from '@/lib/supabase-client';
import type { Session, SupabaseClient } from '@supabase/supabase-js';

interface ProvidersProps {
  children: React.ReactNode;
  session: Session | null;
}

const SupabaseContext = createContext<SupabaseClient | null>(null);
const SessionContext = createContext<Session | null>(null);

export function useSupabase(): SupabaseClient {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabase must be used within Providers');
  return ctx;
}

export function useSession(): Session | null {
  return useContext(SessionContext);
}

export function Providers({ children, session: initialSession }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } },
  }));
  const [supabaseClient] = useState(() => createClient());
  const [session, setSession] = useState<Session | null>(initialSession);

  useEffect(() => {
    if (!supabaseClient) return;
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.unsubscribe();
  }, [supabaseClient]);

  if (!supabaseClient) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark">
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return (
    <SupabaseContext.Provider value={supabaseClient}>
      <SessionContext.Provider value={session}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="dark">
            {children}
          </ThemeProvider>
        </QueryClientProvider>
      </SessionContext.Provider>
    </SupabaseContext.Provider>
  );
}
