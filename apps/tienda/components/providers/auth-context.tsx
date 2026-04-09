'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'tienda_admin_session';

export type TiendaUser = {
  name: string;
  email: string;
};

type AuthContextValue = {
  user: TiendaUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): TiendaUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TiendaUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TiendaUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(readSession());
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!email?.trim() || !password) {
      return { success: false, message: 'Completa correo y contraseña' };
    }
    // Demo: mismas credenciales que el legado; ampliable a API Route + Supabase.
    const ok =
      (email === 'admin@verano.com' && password === 'password') ||
      (email === 'admin@enjambre.cl' && password === 'password');

    if (!ok) {
      return { success: false, message: 'Credenciales incorrectas' };
    }

    const u: TiendaUser = {
      email: email.trim(),
      name: email.split('@')[0]?.replace(/\./g, ' ') || 'Administrador',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
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
