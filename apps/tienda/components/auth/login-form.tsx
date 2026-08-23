'use client';

import { useAuth } from '@/components/providers/auth-context';
import { Eye, EyeOff, Lock, Mail, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast, overlayBackdropClassName } from '@enjambre/ui';
import { safeReturnPath } from '@/lib/auth/safe-return-path';
import { getNucleoStaffEntryUrl, isStaffRedirectExternal } from '@/lib/shop/nucleo-app-url';
import { isNucleoStaffRole } from '@/lib/shop/staff-roles';
import { createClient } from '@/utils/supabase/client';
import { logSecurityEvent } from '@enjambre/auth';

const TIENDA_ROLE_REDIRECT: Record<string, string> = {
  cliente: '/perfil',
  creador: '/perfil/creador',
};

function getTiendaRedirect(role: string): string {
  if (isNucleoStaffRole(role)) {
    return getNucleoStaffEntryUrl() ?? '/perfil';
  }
  if (TIENDA_ROLE_REDIRECT[role]) return TIENDA_ROLE_REDIRECT[role];
  return '/perfil';
}

function navigate(router: ReturnType<typeof useRouter>, target: string, mode: 'replace' | 'push'): void {
  if (isStaffRedirectExternal(target)) {
    if (typeof window !== 'undefined') {
      if (mode === 'replace') window.location.replace(target);
      else window.location.assign(target);
    }
    return;
  }
  if (mode === 'replace') router.replace(target);
  else router.push(target);
}

type ViewMode = 'main' | 'sheet_email';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('main');

  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get('returnTo'));

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      navigate(router, returnTo ?? getTiendaRedirect(user.role), 'replace');
    }
  }, [authLoading, isAuthenticated, user, router, returnTo]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      if (
        hash.includes('type=recovery') ||
        search.includes('type=recovery') ||
        search.includes('token_hash')
      ) {
        router.replace('/reset-password' + search + hash);
        return;
      }
    }

    const supabase = createClient();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string) => {
      if (
        event === 'PASSWORD_RECOVERY' ||
        (typeof window !== 'undefined' && window.location.hash.includes('type=recovery'))
      ) {
        router.replace('/reset-password' + (typeof window !== 'undefined' ? window.location.search + window.location.hash : ''));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage(null);

    const supabase = createClient();

    const result = await login(email, password);
    if (result.success) {
      try {
        const { data: sessionData } = await supabase.auth.getUser();
        await logSecurityEvent(supabase, {
          eventType: 'login_success',
          email: email.trim(),
          userId: sessionData.user?.id ?? null,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          appSource: 'tienda',
        });
      } catch (err) {
        console.error('[login] failed to log security event:', err);
      }
      toast('Sesión iniciada. Bienvenido de vuelta.', { type: 'success', duration: 4000 });
      setLoading(false);
      if (returnTo) {
        navigate(router, returnTo, 'push');
      } else if (user) {
        navigate(router, getTiendaRedirect(user.role), 'push');
      } else {
        router.push('/perfil');
      }
    } else {
      const msg = result.message || 'Error al iniciar sesión';
      try {
        await logSecurityEvent(supabase, {
          eventType: 'login_failed',
          email: email.trim(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          appSource: 'tienda',
          details: { message: msg },
        });
      } catch (err) {
        console.error('[login] failed to log security event:', err);
      }
      setError(msg);
      toast(msg, { type: 'error', duration: 6000 });
      setLoading(false);
    }
  };

  const registerHref = returnTo ? `/register?returnTo=${encodeURIComponent(returnTo)}` : '/register';

  return (
    <div className="w-full">
      {/* MAIN VIEW: Clean, Neutral Email Login Button & Centralized Create Account Button */}
      {viewMode === 'main' && (
        <div className="flex flex-col items-center gap-3.5 w-full animate-in fade-in duration-200">
          {/* Primary Neutral Button: Email Login */}
          <button
            type="button"
            onClick={() => {
              setViewMode('sheet_email');
              setError('');
              setMessage(null);
            }}
            className="w-full min-h-14 rounded-full border border-border/80 bg-surface-raised/90 backdrop-blur-2xl px-6 py-3.5 flex items-center justify-center gap-3 text-sm font-medium text-foreground hover:border-primary/60 hover:bg-surface-raised transition-all shadow-lg group cursor-pointer"
          >
            <Mail className="w-4 h-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
            <span>Iniciar sesión con email</span>
          </button>

          {/* Secondary Button: Centralized, Highly Visible Create Account Button */}
          <Link
            href={registerHref}
            className="w-full min-h-14 rounded-full border border-primary/40 bg-primary/10 hover:bg-primary/20 backdrop-blur-2xl px-6 py-3.5 flex items-center justify-center gap-3 text-sm font-medium text-primary hover:border-primary transition-all shadow-md group cursor-pointer text-center"
          >
            <UserPlus className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
            <span>Crear cuenta</span>
          </Link>
        </div>
      )}

      {/* EMAIL & PASSWORD LOGIN BOTTOM SHEET MODAL */}
      {viewMode === 'sheet_email' && (
        <>
          <div
            className={`fixed inset-0 z-[220] animate-in fade-in duration-200 ${overlayBackdropClassName}`}
            onClick={() => setViewMode('main')}
          />
          <div className="fixed inset-x-0 bottom-0 md:bottom-auto md:inset-y-0 md:my-auto md:h-fit z-[221] rounded-t-[32px] md:rounded-[32px] border-t md:border border-border/60 bg-surface-raised/95 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_-12px_48px_rgba(0,0,0,0.85)] md:shadow-[0_24px_80px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom md:fade-in md:slide-in-from-bottom-0 md:zoom-in-95 duration-300 max-w-md mx-auto max-h-[calc(var(--vh-full)-2.5rem)] md:max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mb-4" />

            <div className="mb-6 text-center">
              <h2 className="text-lg font-semibold text-foreground tracking-tight">
                Iniciar sesión con Email
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Ingresa tus credenciales para acceder a Enjambre Legado
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {message ? (
                <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-center text-xs text-primary">
                  {message}
                </div>
              ) : null}

              <div>
                <label
                  htmlFor="email"
                  className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5"
                >
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                    placeholder="tu@correo.cl"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground"
                  >
                    Contraseña
                  </label>
                  <Link
                    href="/recuperar"
                    className="text-xs text-primary underline-offset-2 hover:underline focus:outline-none"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-11 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Ver contraseña"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error ? <p className="text-xs text-destructive text-center">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-13 rounded-full bg-primary text-primary-foreground font-medium text-sm py-3.5 shadow-lg hover:opacity-95 transition-opacity disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loading ? 'Entrando…' : 'Entrar'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode('main');
                  setError('');
                  setMessage(null);
                }}
                className="w-full min-h-10 text-center text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Volver
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}