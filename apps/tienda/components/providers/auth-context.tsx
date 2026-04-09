'use client';

import { createClient } from '@/utils/supabase/client';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type TiendaUser = {
  id: string;
  name: string;
  email: string;
  role: 'gerente' | 'tienda_admin';
};

type AuthContextValue = {
  user: TiendaUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadAuthorizedUser(): Promise<TiendaUser | null> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) return null;
  if (profile.role !== 'tienda_admin' && profile.role !== 'gerente') return null;

  return {
    id: profile.id as string,
    email: (profile.email as string) || user.email || '',
    name: (profile.full_name as string) || user.email?.split('@')[0] || 'Administrador',
    role: profile.role as 'gerente' | 'tienda_admin',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TiendaUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const authorizedUser = await loadAuthorizedUser();
      if (!mounted) return;
      setUser(authorizedUser);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!email?.trim() || !password) {
      return { success: false, message: 'Completa correo y contraseña' };
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { success: false, message: error.message || 'Credenciales incorrectas' };

    const authorizedUser = await loadAuthorizedUser();
    if (!authorizedUser) {
      await supabase.auth.signOut();
      setUser(null);
      return { success: false, message: 'No tienes permisos de admin en la tienda' };
    }

    setUser(authorizedUser);
    return { success: true, message: undefined };
  }, []);

  const logout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      logout,
    }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth dentro de AuthProvider');
  return ctx;
}
