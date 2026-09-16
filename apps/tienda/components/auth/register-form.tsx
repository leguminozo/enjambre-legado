'use client';

import { useAuth } from '@/components/providers/auth-context';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast, friendlySupabaseError } from '@enjambre/ui';
import { safeReturnPath } from '@/lib/auth/safe-return-path';
import { createClient } from '@/utils/supabase/client';
import { logSecurityEvent } from '@enjambre/auth';

const PASSWORD_POLICY = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [aceptaPolitica, setAceptaPolitica] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificacionPendiente, setVerificacionPendiente] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { register, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get('returnTo'));
  const refParam = searchParams.get('ref')?.trim() ?? '';

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (refParam) {
      sessionStorage.setItem('oyz_ref', refParam);
    }
  }, [refParam]);

  const identidadOk = fullName.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const cuentaOk = PASSWORD_POLICY.test(password);
  const todoListo = identidadOk && cuentaOk && aceptaPolitica;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identidadOk) {
      setError('Por favor ingresa tu nombre y un correo electrónico válido.');
      return;
    }
    if (!cuentaOk) {
      setError('La contraseña debe tener al menos 6 caracteres e incluir letras y números.');
      return;
    }
    if (!aceptaPolitica) {
      setError('Debes aceptar la política de privacidad y términos para continuar.');
      return;
    }

    setLoading(true);
    setError('');

    const storedRef = (sessionStorage.getItem('oyz_ref')?.trim() || refParam).trim();
    const referrerId = storedRef.length > 0 ? storedRef : undefined;

    const result = await register(email, password, fullName, referrerId, returnTo ?? undefined);
    if (result.success) {
      try {
        const supabase = createClient();
        if (supabase) {
          await logSecurityEvent(supabase, {
            eventType: 'signup_success',
            email: email.trim(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            appSource: 'tienda',
          });
        }
      } catch (err) {
        console.error('[register] failed to log security event:', err);
      }
      sessionStorage.removeItem('oyz_ref');
      const referralNote = referrerId ? ' Tu invitación quedó vinculada a la colmena.' : '';

      if (result.requiresEmailConfirmation) {
        setVerificacionPendiente(true);
        setLoading(false);
        return;
      }

      const session = await login(email.trim(), password);
      if (session.success) {
        toast(`¡Bienvenido al Legado! Cuenta creada y sesión iniciada.${referralNote}`, {
          type: 'success',
          duration: 8000,
        });
        router.push(returnTo ?? '/perfil');
      } else {
        setVerificacionPendiente(true);
      }
    } else {
      const msg = result.message || 'Error al crear la cuenta';
      setError(msg);
      toast(msg, { type: 'error', duration: 6000 });
    }
    setLoading(false);
  };

  const loginHref = returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login';

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading || !email.trim()) return;
    setResendLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error('Cliente no disponible');
      const baseOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const safeNext = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
        ? returnTo
        : '/perfil';
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${baseOrigin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
        },
      });
      if (resendErr) {
        toast.error(friendlySupabaseError(resendErr));
      } else {
        toast.success('Nuevo enlace de confirmación enviado.');
        setResendCooldown(60);
      }
    } catch {
      toast.error('No se pudo reenviar el enlace. Intenta más tarde.');
    } finally {
      setResendLoading(false);
    }
  };

  if (verificacionPendiente) {
    return (
      <div className="w-full">
        <div className="rounded-3xl border border-border/70 bg-surface-raised/85 backdrop-blur-xl shadow-2xl p-6 sm:p-8 text-center transition-all space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary">
            <Mail className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-semibold font-display text-foreground">
              Revisa tu correo
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Hemos enviado un enlace de confirmación a <strong className="text-foreground font-medium">{email}</strong>. Haz clic en el enlace para activar tu cuenta y continuar.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href={loginHref}
              className="w-full sm:w-auto min-h-11 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:opacity-95 transition-all flex items-center justify-center"
            >
              Ir a Iniciar Sesión
            </Link>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resendLoading}
              className="w-full sm:w-auto min-h-11 px-6 py-2.5 rounded-full border border-border/60 text-muted-foreground text-xs font-medium hover:text-foreground hover:border-border transition-all disabled:opacity-50 cursor-pointer"
            >
              {resendLoading ? 'Enviando…' : resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar correo'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="rounded-3xl border border-border/70 bg-surface-raised/85 backdrop-blur-xl shadow-2xl p-6 sm:p-8 transition-all">
        <div className="mb-6 text-center">
          <h2 className="text-base sm:text-lg font-semibold text-foreground tracking-tight font-display">
            Crear Cuenta en el Club Legado
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Únete para acumular puntos, recibir recolecciones exclusivas y proteger el bosque
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="block text-[0.65rem] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5"
            >
              Nombre Completo
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                placeholder="Ej. Francisca Andrade"
              />
            </div>
          </div>

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
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                placeholder="tu@correo.cl"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[0.65rem] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5"
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-11 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-[0.68rem] text-muted-foreground">
              Mínimo 6 caracteres con letras y números.
            </p>
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-border/50 bg-background/50 cursor-pointer hover:border-border transition-colors">
              <input
                type="checkbox"
                checked={aceptaPolitica}
                onChange={(e) => setAceptaPolitica(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-border/60 bg-background text-primary focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                Acepto la{' '}
                <Link href="/privacidad" className="text-primary hover:underline font-medium" target="_blank">
                  política de privacidad
                </Link>{' '}
                y los{' '}
                <Link href="/terminos" className="text-primary hover:underline font-medium" target="_blank">
                  términos del servicio
                </Link>{' '}
                (conforme a la Ley N° 19.628 de protección de datos).
              </span>
            </label>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-center text-xs text-destructive animate-in fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !todoListo}
            className="w-full min-h-12 rounded-full bg-primary text-primary-foreground font-medium text-sm py-3.5 shadow-lg hover:opacity-95 transition-opacity disabled:opacity-50 mt-2 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? 'Creando cuenta…' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-border/40 text-center">
          <p className="text-xs text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link
              href={loginHref}
              className="text-primary font-medium underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}