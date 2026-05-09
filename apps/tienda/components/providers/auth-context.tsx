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

async function loadUser(): Promise<TiendaUser | null> {
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

  return {
    id: profile.id as string,
    email: (profile.email as string) || user.email || '',
    name: (profile.full_name as string) || user.email?.split('@')[0] || 'Usuario',
    role: profile.role as TiendaUser['role'],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TiendaUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const u = await loadUser();
      if (!mounted) return;
      setUser(u);
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

    const u = await loadUser();
    setUser(u);
    return { success: true, message: undefined };
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    if (!email?.trim() || !password || !fullName?.trim()) {
      return { success: false, message: 'Completa todos los campos' };
    }
    const supabase = createClient();
    
    // 1. Sign up in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (authError) return { success: false, message: authError.message };
    if (!authData.user) return { success: false, message: 'No se pudo crear el usuario' };

    // 2. Create profile (Supabase might have a trigger, but we ensure it here)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email.trim(),
        full_name: fullName.trim(),
        role: 'cliente', // Default role
      });

    if (profileError && profileError.code !== '23505') { // Ignore unique constraint if trigger already created it
      return { success: false, message: profileError.message };
    }

    const u = await loadUser();
    setUser(u);
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
      register,
      logout,
    }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth dentro de AuthProvider');
  return ctx;
}
