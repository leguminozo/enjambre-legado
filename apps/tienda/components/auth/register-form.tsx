'use client';

import { useAuth } from '@/components/providers/auth-context';
import { AuthFormPanel, AuthShell, authFieldClass, authLabelClass } from '@/components/auth/auth-shell';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from '@enjambre/ui';
import { safeReturnPath } from '@/lib/auth/safe-return-path';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get('returnTo'));
  const refParam = searchParams.get('ref')?.trim() ?? '';

  useEffect(() => {
    if (refParam) {
      sessionStorage.setItem('oyz_ref', refParam);
    }
  }, [refParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const storedRef = sessionStorage.getItem('oyz_ref')?.trim() || refParam;
    const referrerId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storedRef)
      ? storedRef
      : undefined;

    const result = await register(email, password, fullName, referrerId);
    if (result.success) {
      sessionStorage.removeItem('oyz_ref');
      const referralNote = referrerId ? ' Tu invitación quedó vinculada a la colmena.' : '';
      toast(`¡Bienvenido al Legado! Revisa tu correo para confirmar tu cuenta.${referralNote}`, {
        type: 'success',
        duration: 8000,
      });
      router.push(returnTo ?? '/');
    } else {
      const msg = result.message || 'Error al crear la cuenta';
      setError(msg);
      toast(msg, { type: 'error', duration: 6000 });
    }
    setLoading(false);
  };

  const loginHref = returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login';

  return (
    <AuthShell
      title={
        <>
          Únete al <span className="italic text-accent">Legado</span>
        </>
      }
      subtitle="Sé parte de la comunidad guardián del bosque"
      footer="Regeneración y Legado · Chiloé"
    >
      <AuthFormPanel onSubmit={handleSubmit}>
        <div className="space-y-5 sm:space-y-6">
          <div className="space-y-2">
            <label htmlFor="fullName" className={authLabelClass}>
              Nombre completo
            </label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={authFieldClass}
                placeholder="Tu nombre"
              />
            </div>
          </div>

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
            <label htmlFor="password" className={authLabelClass}>
              Contraseña
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={authFieldClass}
                placeholder="Mínimo 6 caracteres"
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
          {loading ? 'Creando...' : 'Crear Cuenta'}
        </button>

        <div className="pt-2 text-center">
          <p className="text-[0.7rem] text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link
              href={loginHref}
              className="text-foreground hover:text-accent underline underline-offset-4 decoration-border"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </AuthFormPanel>
    </AuthShell>
  );
}