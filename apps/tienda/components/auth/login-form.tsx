'use client';

import { useAuth } from '@/components/providers/auth-context';
import { AuthFormPanel, AuthPageLoading, AuthShell, authFieldClass, authLabelClass } from '@/components/auth/auth-shell';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from '@enjambre/ui';
import { safeReturnPath } from '@/lib/auth/safe-return-path';
import { getNucleoStaffEntryUrl } from '@/lib/shop/nucleo-app-url';
import { isNucleoStaffRole } from '@/lib/shop/staff-roles';

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

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get('returnTo'));

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      router.replace(returnTo ?? getTiendaRedirect(user.role));
    }
  }, [authLoading, isAuthenticated, user, router, returnTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    if (result.success) {
      toast('Sesión iniciada. Bienvenido de vuelta.', { type: 'success', duration: 4000 });
      if (returnTo) {
        router.push(returnTo);
      } else if (user) {
        router.push(getTiendaRedirect(user.role));
      } else {
        router.push('/perfil');
      }
    } else {
      const msg = result.message || 'Error al iniciar sesión';
      setError(msg);
      toast(msg, { type: 'error', duration: 6000 });
    }
    setLoading(false);
  };

  if (authLoading) {
    return <AuthPageLoading />;
  }

  const registerHref = returnTo ? `/register?returnTo=${encodeURIComponent(returnTo)}` : '/register';

  return (
    <AuthShell
      title={
        <>
          Identidad <span className="italic text-accent">Legado</span>
        </>
      }
      subtitle="Acceso al panel de control y gestión"
      footer="Acceso Restringido · Tienda Enjambre"
      intro={
        <ul className="mt-5 space-y-2 text-[0.65rem] text-muted-foreground/80 tracking-wide text-left max-w-xs mx-auto">
          <li>· Ver tu historia de colmenas y árboles plantados</li>
          <li>· Recibir invitaciones priorizadas a Iniciaciones en Chiloé</li>
          <li>· Guardar tus colecciones favoritas y obsequios recurrentes</li>
        </ul>
      }
    >
      <AuthFormPanel onSubmit={handleSubmit}>
        <div className="space-y-5 sm:space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className={authLabelClass}>
              Correo electrónico
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authFieldClass}
                placeholder="tu@correo.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center gap-2">
              <label htmlFor="password" className={authLabelClass}>
                Contraseña
              </label>
              <Link
                href="/recuperar"
                className="text-[0.6rem] uppercase tracking-[0.1em] text-muted-foreground hover:text-accent min-h-[44px] flex items-center"
              >
                ¿Olvidaste?
              </Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={authFieldClass}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-accent"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-[0.7rem] text-destructive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[48px] py-4 rounded-lg border border-accent text-accent text-[0.7rem] uppercase tracking-[0.3em] hover:bg-accent hover:text-accent-foreground transition-all duration-300 disabled:opacity-50"
        >
          {loading ? 'Validando...' : 'Iniciar Sesión'}
        </button>

        <div className="pt-2 text-center">
          <p className="text-[0.7rem] text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link
              href={registerHref}
              className="text-foreground hover:text-accent underline underline-offset-4 decoration-border"
            >
              Únete al Legado del Bosque
            </Link>
          </p>
        </div>
      </AuthFormPanel>
    </AuthShell>
  );
}