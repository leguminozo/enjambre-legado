'use client';

import { createClient } from '@/utils/supabase/client';
import { friendlySupabaseError } from '@enjambre/ui';
import { useAuthStore, logSecurityEvent } from '@enjambre/auth';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';

export type TiendaUser = {
  id: string;
  name: string;
  email: string;
  role: 'gerente' | 'tienda_admin' | 'cliente' | 'vendedor' | 'apicultor' | 'logistica' | 'marketing';
};

type AuthContextValue = {
  user: TiendaUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, password: string, fullName: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toTiendaUser(authUser: { id: string; email: string; role: string; full_name: string } | null): TiendaUser | null {
  if (!authUser) return null;
  return {
    id: authUser.id,
    email: authUser.email,
    name: authUser.full_name || authUser.email.split('@')[0] || 'Usuario',
    role: authUser.role as TiendaUser['role'],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const signOut = useAuthStore((s) => s.signOut);
  const checkUser = useAuthStore((s) => s.checkUser);
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);

  if (!clientRef.current) clientRef.current = createClient();

  useEffect(() => {
    useAuthStore.getState().setAppSource('tienda');
    checkUser();

    const { data: { subscription } } = clientRef.current!.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (session) {
        checkUser();
      } else {
        useAuthStore.setState({ user: null, session: null, isAuthenticated: false, isLoading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [checkUser]);

  const login = useCallback(async (email: string, password: string) => {
    if (!email?.trim() || !password) {
      return { success: false, message: 'Completa correo y contraseña' };
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      void logSecurityEvent(supabase, {
        eventType: 'login_failed',
        email: email.trim(),
        userAgent: navigator.userAgent,
        appSource: 'tienda',
        details: { code: error.code, message: error.message },
      });
      return { success: false, message: friendlySupabaseError(error) };
    }
    void logSecurityEvent(supabase, {
      eventType: 'login_success',
      email: email.trim(),
      userAgent: navigator.userAgent,
      appSource: 'tienda',
    });
    await useAuthStore.getState().checkUser();
    return { success: true, message: undefined };
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    if (!email?.trim() || !password || !fullName?.trim()) {
      return { success: false, message: 'Completa todos los campos' };
    }
    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });

    if (authError) return { success: false, message: friendlySupabaseError(authError) };
    if (!authData.user) return { success: false, message: 'No se pudo crear el usuario' };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: authData.user.id, email: email.trim(), full_name: fullName.trim(), role: 'cliente' });

    if (profileError && profileError.code !== '23505') {
      return { success: false, message: friendlySupabaseError(profileError) };
    }

    void logSecurityEvent(supabase, {
      eventType: 'signup_success',
      email: email.trim(),
      userId: authData.user.id,
      appSource: 'tienda',
      details: { role: 'cliente' },
    });

    await useAuthStore.getState().checkUser();
    return { success: true, message: undefined };
  }, []);

  const logout = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: toTiendaUser(authUser),
      isAuthenticated,
      loading: isLoading,
      login,
      register,
      logout,
    }),
    [authUser, isAuthenticated, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth dentro de AuthProvider');
  return ctx;
}
