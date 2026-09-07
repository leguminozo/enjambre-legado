'use client';

import { useAuth } from '@/components/providers/auth-context';
import { AuthFormPanel, authFieldClass, authLabelClass } from '@/components/auth/auth-shell';
import {
  AuthLegalBlock,
  AuthStepCard,
  AuthStepList,
  type AuthStepMeta,
} from '@/components/auth/auth-steps';
import { Eye, EyeOff, Lock, Mail, User, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast, friendlySupabaseError } from '@enjambre/ui';
import { safeReturnPath } from '@/lib/auth/safe-return-path';
import { createClient } from '@/utils/supabase/client';
import { logSecurityEvent } from '@enjambre/auth';

// Estructura copiada del wizard del Registro Territorial (Núcleo): pasos con
// checklist, bloque legal con cita, consentimiento explícito — separación
// estricta: componentes propios de Tienda, sin imports cruzados.

const PASSWORD_POLICY = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [aceptaPolitica, setAceptaPolitica] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pasoAbierto, setPasoAbierto] = useState('identidad');
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

  const pasos: AuthStepMeta[] = [
    { id: 'identidad', titulo: 'Identidad', desc: 'Nombre y correo', done: identidadOk, icon: User },
    { id: 'cuenta', titulo: 'Cuenta segura', desc: 'Contraseña con letras y números', done: cuentaOk, icon: Lock },
    { id: 'privacidad', titulo: 'Privacidad', desc: 'Consentimiento de datos', done: aceptaPolitica, icon: UserPlus },
  ];

  const togglePaso = (id: string) => {
    if (id === 'privacidad' && !cuentaOk) {
      toast.error('Completa la contraseña antes de revisar la privacidad');
      return;
    }
    if (id === 'cuenta' && !identidadOk) {
      toast.error('Completa tu nombre y correo primero');
      return;
    }
    setPasoAbierto(pasoAbierto === id ? '' : id);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoListo) {
      setError('Completa los pasos y acepta la política de datos para crear tu cuenta.');
      return;
    }
    setLoading(true);
    setError('');

    const storedRef = (sessionStorage.getItem('oyz_ref')?.trim() || refParam).trim();
    const referrerId = storedRef.length > 0 ? storedRef : undefined;

    const result = await register(email, password, fullName, referrerId);
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
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${baseOrigin}/auth/callback?next=/perfil`,
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
      <div className="w-full space-y-6 rounded-2xl border border-border/70 bg-card p-6 md:p-8 text-center backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 border border-accent/20 text-accent">
          <Mail className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-serif text-foreground">Revisa tu correo</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Hemos enviado un enlace de confirmación a <strong className="text-foreground font-medium">{email}</strong>. Haz clic en el enlace para activar tu cuenta antes de iniciar sesión.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href={loginHref}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-lg border border-accent text-accent-text text-[0.7rem] uppercase tracking-[0.25em] hover:bg-accent hover:text-accent-foreground transition-all duration-300 flex items-center justify-center"
          >
            Ir a Iniciar Sesión
          </Link>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-lg border border-border/60 text-muted-foreground text-[0.7rem] uppercase tracking-[0.2em] hover:text-foreground hover:border-border transition-all duration-300 disabled:opacity-50"
          >
            {resendLoading ? 'Enviando...' : resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar correo'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <AuthStepList pasos={pasos} />

      <AuthStepCard paso={pasos[0]} activo={pasoAbierto === 'identidad'} onToggle={() => togglePaso('identidad')}>
        <div className="space-y-4">
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
        </div>
      </AuthStepCard>

      <AuthStepCard paso={pasos[1]} activo={pasoAbierto === 'cuenta'} onToggle={() => togglePaso('cuenta')}>
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
              placeholder="Mínimo 6 caracteres con letras y números"
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
          <p className="text-[0.65rem] text-muted-foreground leading-relaxed">
            Al menos 6 caracteres con letras y números para proteger tu cuenta y tu historial.
          </p>
        </div>
      </AuthStepCard>

      <AuthStepCard paso={pasos[2]} activo={pasoAbierto === 'privacidad'} onToggle={() => togglePaso('privacidad')}>
        <AuthFormPanel onSubmit={handleSubmit}>
          <AuthLegalBlock
            kicker="Protección de datos · Chile"
            titulo="Tus datos, tu consentimiento"
            cuerpo="Al crear tu cuenta aceptas la política de privacidad y los términos del servicio. Tus datos se tratan conforme a la Ley N° 19.628 (protección de la vida privada) y solo se usan para tu pedido, tu club y el vínculo de invitación que hayas ingresado."
          >
            <label className="flex items-start gap-3 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={aceptaPolitica}
                onChange={(e) => setAceptaPolitica(e.target.checked)}
                className="mt-1 flex-shrink-0 w-4 h-4 rounded border-border/60 bg-background text-primary focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                Acepto la{' '}
                <Link href="/privacidad" className="text-primary hover:underline" target="_blank">
                  política de privacidad
                </Link>{' '}
                y los{' '}
                <Link href="/terminos" className="text-primary hover:underline" target="_blank">
                  términos del servicio
                </Link>
                .
              </span>
            </label>
          </AuthLegalBlock>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-[0.7rem] text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !todoListo}
            className="w-full min-h-[48px] py-4 rounded-lg border border-accent text-accent-text text-[0.7rem] uppercase tracking-[0.3em] hover:bg-accent hover:text-accent-foreground transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear Cuenta'}
          </button>

          <div className="pt-2 text-center">
            <p className="text-[0.7rem] text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link
                href={loginHref}
                className="inline-flex min-h-11 items-center text-foreground hover:text-accent underline underline-offset-4 decoration-border"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </AuthFormPanel>
      </AuthStepCard>
    </div>
  );
}