'use client';

import { createClient } from '@/utils/supabase/client';
import { friendlySupabaseError } from '@enjambre/ui';
import { useAuthStore, logSecurityEvent, LEGACY_ROLE_MAP, type RoleKey } from '@enjambre/auth';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';

export type TiendaUser = {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
};

type AuthContextValue = {
  user: TiendaUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (
    email: string,
    password: string,
    fullName: string,
    referrerId?: string,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const VALID_ROLES = new Set<RoleKey>([
  'admin',
  'cliente',
  'creador',
  'rep_ventas',
]);

function toTiendaUser(authUser: { id: string; email: string; role: string; full_name: string } | null): TiendaUser | null {
  if (!authUser) return null;
  const normalizedRole = (LEGACY_ROLE_MAP[authUser.role] ?? authUser.role) as RoleKey;
  return {
    id: authUser.id,
    email: authUser.email,
    name: authUser.full_name || authUser.email.split('@')[0] || 'Usuario',
    role: VALID_ROLES.has(normalizedRole) ? normalizedRole : 'cliente',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const signOut = useAuthStore((s) => s.signOut);
  const checkUser = useAuthStore((s) => s.checkUser);
  const client = useMemo(() => createClient(), []);

  useEffect(() => {
    useAuthStore.getState().setAppSource('tienda');
    checkUser();

    const { data: { subscription } } = client.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (session) {
        checkUser();
      } else {
        useAuthStore.setState({ user: null, session: null, isAuthenticated: false, isLoading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [checkUser, client]);

  const login = useCallback(async (email: string, password: string) => {
    if (!email?.trim() || !password) {
      return { success: false, message: 'Completa correo y contraseña' };
    }
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Error al iniciar sesión' };
      }
      await useAuthStore.getState().checkUser();
      return { success: true, message: undefined };
    } catch {
      return { success: false, message: 'Error de conexión' };
    }
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string, referrerId?: string) => {
    if (!email?.trim() || !password || !fullName?.trim()) {
      return { success: false, message: 'Completa todos los campos' };
    }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password, fullName: fullName.trim(), referrerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Error al crear la cuenta' };
      }
      await useAuthStore.getState().checkUser();
      return { success: true, message: undefined };
    } catch {
      return { success: false, message: 'Error de conexión' };
    }
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
