'use client';

import { useAuth } from '@/components/providers/auth-context';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from '@enjambre/ui';
import { resolveLocalized, type AuthSettings } from '@/lib/shop/store-chrome';
import { safeReturnPath } from '@/lib/auth/safe-return-path';
import { isStaffRedirectExternal } from '@/lib/shop/nucleo-app-url';
import { createClient } from '@/utils/supabase/client';
import { logSecurityEvent } from '@enjambre/auth';

const TIENDA_ROLE_REDIRECT: Record<string, string> = {
  cliente: '/perfil',
  creador: '/perfil/creador',
};

function getTiendaRedirect(role: string): string {
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

export function LoginForm({ auth }: { auth: AuthSettings }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get('returnTo'));
  const cardTitle =
    resolveLocalized(auth.login_card_title, auth.login_card_title_en, locale) || 'Acceso al Club Legado';
  const cardSubtitle =
    resolveLocalized(auth.login_card_subtitle, auth.login_card_subtitle_en, locale) ||
    'Ingresa tus credenciales para ver tus pedidos y membresía';
  const submitLabel =
    resolveLocalized(auth.login_button_label, auth.login_button_label_en, locale) || 'Iniciar Sesión';

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const target = returnTo ?? getTiendaRedirect(user.role);
      if (typeof window !== 'undefined') {
        window.location.assign(target);
      } else {
        navigate(router, target, 'replace');
      }
    }
  }, [authLoading, isAuthenticated, user, router, returnTo]);

  useEffect(() => {
    const errParam = searchParams.get('error');
    if (errParam === 'auth-callback-failed') {
      setMessage('El enlace fue procesado. Si abriste la confirmación en otro navegador o dispositivo, inicia sesión a continuación.');
    } else if (errParam === 'recovery-failed') {
      setError('El enlace de recuperación no es válido o ha expirado. Solicita uno nuevo.');
    } else if (errParam === 'supabase-not-configured') {
      setError('Servicio de autenticación no disponible temporalmente.');
    }

    if (searchParams.get('verified') === 'true') {
      setMessage('¡Correo confirmado con éxito! Ya puedes iniciar sesión.');
    }
  }, [searchParams]);

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
      const target = returnTo ?? (user ? getTiendaRedirect(user.role) : '/perfil');
      if (typeof window !== 'undefined') {
        window.location.assign(target);
      } else {
        router.push(target);
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
      <div className="rounded-3xl border border-border/70 bg-surface-raised/85 backdrop-blur-xl shadow-2xl p-6 sm:p-8 transition-all">
        <div className="mb-6 text-center">
          <h2 className="text-base sm:text-lg font-semibold text-foreground tracking-tight font-display">
            {cardTitle}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {cardSubtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {message ? (
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-center text-xs text-primary animate-in fade-in">
              {message}
            </div>
          ) : null}

          <div>
            <label
              htmlFor="email"
              className="block text-[0.65rem] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5"
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
                className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-4 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                placeholder="tu@correo.cl"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-[0.65rem] uppercase tracking-wider font-semibold text-muted-foreground"
              >
                Contraseña
              </label>
              <Link
                href="/recuperar"
                className="text-xs text-primary underline-offset-2 hover:underline focus:outline-none transition-colors"
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
                className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-11 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Ver contraseña"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-center text-xs text-destructive animate-in fade-in">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-12 rounded-full bg-primary text-primary-foreground font-medium text-sm py-3.5 shadow-lg hover:opacity-95 transition-opacity disabled:opacity-50 mt-2 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? 'Entrando…' : submitLabel}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-border/40 text-center">
          <p className="text-xs text-muted-foreground">
            ¿Aún no tienes cuenta?{' '}
            <Link
              href={registerHref}
              className="text-primary font-medium underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}