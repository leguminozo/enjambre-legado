'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  UserPlus,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore, logSecurityEvent, getRoleRedirectPath } from '@enjambre/auth';
import { friendlyError, friendlySupabaseError, overlayBackdropClassName } from '@enjambre/ui';

function GoogleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </svg>
  );
}

const fieldClass =
  'w-full min-h-12 rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors';
const fieldIconClass =
  'w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors';
const labelClass =
  'block text-[0.7rem] uppercase tracking-wider font-medium text-muted-foreground mb-2';

type ViewMode = 'collapsed' | 'sheet_email' | 'sheet_signup' | 'sheet_recovery';

// OAuth desactivado: Supabase del proyecto tiene google/apple/twitter: false.
// El botón de Google se oculta hasta habilitar el provider en el dashboard.
const OAUTH_PROVIDERS_ENABLED = false;

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);

  // Campos Territoriales Adicionales
  const [inviteCode, setInviteCode] = useState('');
  const [rol, setRol] = useState('api_residente');
  const [region, setRegion] = useState('Los Lagos');
  const [comuna, setComuna] = useState('');
  const [consentMapa, setConsentMapa] = useState(false);
  const [consentAlertas, setConsentAlertas] = useState(true);
  const [consentCatalogo, setConsentCatalogo] = useState(false);
  const [consentAcopio, setConsentAcopio] = useState(false);
  const [aceptaCarta, setAceptaCarta] = useState(false);
  const [aceptaPoliticaDatos, setAceptaPoliticaDatos] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('collapsed');

  // Bloquear scroll del body mientras hay un panel abierto
  useEffect(() => {
    if (viewMode === 'collapsed') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [viewMode]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string) => {
      if (
        event === 'PASSWORD_RECOVERY' ||
        (typeof window !== 'undefined' && window.location.hash.includes('type=recovery'))
      ) {
        setIsRecoveryMode(true);
        setIsForgotPassword(false);
        setViewMode('sheet_recovery');
      }
    });

    if (typeof window !== 'undefined') {
      if (window.location.hash.includes('type=recovery')) {
        setIsRecoveryMode(true);
        setIsForgotPassword(false);
        setViewMode('sheet_recovery');
      } else if (window.location.search.includes('mode=signup')) {
        setViewMode('sheet_signup');
      }
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleGoogleOAuth() {
    setError(null);
    setMessage(null);
    setLoading(true);
    const { error: oAuthErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/login`,
      },
    });
    if (oAuthErr) {
      setError(friendlySupabaseError(oAuthErr));
      setLoading(false);
    }
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isRecoveryMode) {
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        if (password !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden');
        }
        const { error: updateErr } = await supabase.auth.updateUser({ password });
        if (updateErr) throw new Error(friendlySupabaseError(updateErr));
        setMessage('¡Contraseña actualizada con éxito! Redirigiendo...');
        setIsRecoveryMode(false);
        setLoading(false);

        await useAuthStore.getState().checkUser();
        const userRole = useAuthStore.getState().user?.role ?? 'cliente';
        setTimeout(() => {
          router.replace(getRoleRedirectPath(userRole));
        }, 1500);
        return;
      }

      if (isForgotPassword) {
        if (!email.trim()) {
          throw new Error('Por favor ingresa tu correo electrónico.');
        }
        const siteUrl = process.env.NEXT_PUBLIC_NUCLEO_URL ?? (typeof window !== 'undefined' ? window.location.origin : '');
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
        });
        if (resetErr) throw new Error(friendlySupabaseError(resetErr));

        await logSecurityEvent(supabase, {
          eventType: 'password_reset_requested',
          userId: null,
          email,
          appSource: 'nucleo',
        });
        setMessage('Te hemos enviado un enlace a tu correo para reestablecer tu contraseña.');
        setIsForgotPassword(false);
        setLoading(false);
        return;
      }

      if (viewMode === 'sheet_signup') {
        if (!aceptaCarta || !aceptaPoliticaDatos) {
          throw new Error('Debes aceptar la Carta Constitutiva y la política de datos para inscribirte.');
        }
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              full_name: fullName, 
              app_source: 'nucleo_territorial',
              referrer_id: inviteCode.trim() || undefined,
              territorial_rol: rol,
              territorial_region: region,
              territorial_comuna: comuna,
              territorial_acepta_carta: aceptaCarta,
              territorial_acepta_politica_datos: aceptaPoliticaDatos,
              territorial_consentimientos: {
                mapa_comunitario: consentMapa,
                alertas_fitosanitarias: consentAlertas,
                catalogo_infraestructura: consentCatalogo,
                acopio_cooperativo: consentAcopio,
              }
            },
            emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/login`,
          },
        });
        if (signUpErr) throw new Error(friendlySupabaseError(signUpErr));

        // Si data.user.identities está vacío, significa que el correo ya está registrado en Supabase
        if (data?.user && data.user.identities && data.user.identities.length === 0) {
          throw new Error('Ya existe una cuenta con este correo. Por favor inicia sesión o recupera tu contraseña.');
        }

        await logSecurityEvent(supabase, {
          eventType: 'signup_success',
          userId: data.user?.id ?? null,
          email,
          appSource: 'nucleo_territorial',
        });
        setMessage('¡Registro exitoso! Por favor verifica tu bandeja de entrada para activar tu cuenta.');
        setLoading(false);
        return;
      }

      // Default: Login
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signErr) {
        await logSecurityEvent(supabase, {
          eventType: 'login_failed',
          userId: null,
          email,
          appSource: 'nucleo',
          details: { code: signErr.status },
        });
        throw new Error('Credenciales inválidas. Por favor intenta nuevamente.');
      }

      await useAuthStore.getState().checkUser();
      await logSecurityEvent(supabase, {
        eventType: 'login_success',
        userId: useAuthStore.getState().user?.id ?? null,
        email,
        appSource: 'nucleo',
      });
      
      const userRole = useAuthStore.getState().user?.role ?? 'cliente';
      router.replace(getRoleRedirectPath(userRole));
    } catch (err: unknown) {
      // fallback = mensaje ES local si ya se mapearon; friendlyError mapea AuthApiError crudos
      const fallback =
        err instanceof Error ? err.message : 'Error al procesar la solicitud.';
      setError(friendlyError(err, fallback));
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[var(--vh-full)] w-full bg-background text-foreground flex flex-col justify-between overflow-x-hidden px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] select-none">
      {/* Starry / Cosmic Atmosphere Layer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 enj-blur-orb w-[140vw] h-[60vh] rounded-full bg-gradient-to-b from-primary/15 via-primary/5 to-transparent blur-3xl opacity-60" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(1px 1px at 20px 30px, rgba(255, 255, 255, 0.7), rgba(0, 0, 0, 0)),
                              radial-gradient(1px 1px at 80px 120px, rgba(255, 255, 255, 0.5), rgba(0, 0, 0, 0)),
                              radial-gradient(1.5px 1.5px at 150px 70px, rgba(255, 255, 255, 0.8), rgba(0, 0, 0, 0)),
                              radial-gradient(1px 1px at 220px 190px, rgba(255, 255, 255, 0.6), rgba(0, 0, 0, 0)),
                              radial-gradient(1.5px 1.5px at 310px 40px, rgba(255, 255, 255, 0.75), rgba(0, 0, 0, 0)),
                              radial-gradient(1px 1px at 50px 280px, rgba(255, 255, 255, 0.5), rgba(0, 0, 0, 0)),
                              radial-gradient(2px 2px at 190px 320px, rgba(255, 255, 255, 0.65), rgba(0, 0, 0, 0)),
                              radial-gradient(1px 1px at 290px 240px, rgba(255, 255, 255, 0.8), rgba(0, 0, 0, 0))`,
            backgroundRepeat: 'repeat',
            backgroundSize: '350px 350px',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
      </div>

      {/* Salida clara: volver al inicio / cancelar */}
      <div className="relative z-20 flex items-center justify-between gap-3 pt-2 pb-1">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border/50 bg-surface-raised/70 px-3.5 py-2 text-sm text-foreground backdrop-blur-md transition-colors hover:border-border hover:bg-surface-raised"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          <span>Volver al inicio</span>
        </Link>
        <Link
          href="/mapa-chiloe"
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Mapa público
        </Link>
      </div>

      {/* Top / Center Hero Branding */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-8 sm:py-10">
        <h1 className="font-display text-[clamp(3rem,12vw,4.5rem)] font-light tracking-tight text-foreground text-center leading-none">
          Enjambre
        </h1>
        <p className="mt-3 flex items-center justify-center gap-1 font-mono text-[0.65rem] tracking-[0.24em] text-muted-foreground uppercase text-center max-w-[18rem]">
          <span>Sistema operativo biocultural</span>
          <span className="inline-block w-1.5 h-3 bg-primary animate-pulse" />
        </p>
        <p className="mt-4 max-w-xs text-center text-sm text-muted-foreground leading-relaxed">
          Un solo acceso: panel, censo y registro territorial de Chiloé.
        </p>
      </div>

      {/* Bottom: Google + correo + alta territorial (sin Apple/X) */}
      <div className="relative z-10 w-full max-w-md mx-auto pb-2 px-0 sm:px-1">
        
        {viewMode === 'collapsed' && (
          <div className="flex flex-col items-stretch gap-4 w-full animate-in fade-in duration-200">
            {OAUTH_PROVIDERS_ENABLED && (
              <button
                type="button"
                onClick={() => void handleGoogleOAuth()}
                disabled={loading}
                className="w-full min-h-14 rounded-2xl border border-border/60 bg-surface-raised/90 backdrop-blur-2xl px-5 py-3.5 flex items-center justify-center gap-3 text-sm font-medium text-foreground hover:border-border hover:bg-surface-raised transition-all shadow-lg disabled:opacity-50"
              >
                <GoogleIcon className="w-5 h-5" />
                <span>Continuar con Google</span>
              </button>
            )}

            <div className="flex items-center gap-3 px-1">
              <span className="h-px flex-1 bg-border/50" />
              <span className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                o con correo
              </span>
              <span className="h-px flex-1 bg-border/50" />
            </div>

            <button
              type="button"
              onClick={() => {
                setViewMode('sheet_email');
                setError(null);
                setMessage(null);
              }}
              className="w-full min-h-14 rounded-2xl border border-border/60 bg-background/50 backdrop-blur-2xl px-5 py-3.5 flex items-center justify-between gap-3 text-sm font-medium text-foreground hover:border-border hover:bg-surface-raised transition-all shadow-md"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary" />
                <span>Iniciar sesión con correo</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('sheet_signup');
                setError(null);
                setMessage(null);
              }}
              className="w-full min-h-12 rounded-2xl border border-primary/25 bg-primary/10 px-5 py-3 flex items-center justify-center gap-2.5 text-sm font-medium text-primary hover:bg-primary/15 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Crear cuenta · registro territorial</span>
            </button>

            <p className="text-center text-[0.7rem] text-muted-foreground/80 leading-relaxed px-2">
              Al continuar aceptas la{' '}
              <Link href="/carta" className="underline underline-offset-2 hover:text-foreground">
                Carta constitutiva
              </Link>
              {' '}y el uso de datos según la política de privacidad.
            </p>
          </div>
        )}

        {/* EMAIL LOGIN SHEET — centrado en desktop, sheet abajo en móvil */}
        {viewMode === 'sheet_email' && (
          <div className="fixed inset-0 z-[220] flex items-end justify-center sm:items-center p-0 sm:p-5">
            <button
              type="button"
              className={`absolute inset-0 animate-in fade-in duration-200 ${overlayBackdropClassName}`}
              aria-label="Cerrar"
              onClick={() => setViewMode('collapsed')}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="login-email-title"
              className="relative z-10 w-full max-w-md max-h-[min(90dvh,640px)] overflow-y-auto overscroll-contain
                rounded-t-[28px] sm:rounded-3xl border border-border/60 border-b-0 sm:border-b
                bg-surface-raised p-6 sm:p-8
                shadow-[0_-8px_40px_rgba(0,0,0,0.45)] sm:shadow-[0_24px_64px_rgba(0,0,0,0.45)]
                animate-in slide-in-from-bottom sm:fade-in sm:zoom-in-95 duration-300
                pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mb-4 sm:hidden" />

              <div className="mb-6 text-center">
                <h2 id="login-email-title" className="text-lg font-semibold text-foreground tracking-tight">
                  Iniciar sesión
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Acceso al Enjambre y al registro territorial
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
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
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setIsRecoveryMode(false);
                        setViewMode('sheet_recovery');
                        setError(null);
                        setMessage(null);
                      }}
                      className="text-xs text-primary underline-offset-2 hover:underline focus:outline-none"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
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
                  className="w-full min-h-13 rounded-full bg-primary text-primary-foreground font-medium text-sm py-3.5 shadow-lg hover:opacity-95 transition-opacity disabled:opacity-50 mt-2"
                >
                  {loading ? 'Entrando…' : 'Entrar al Enjambre'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setViewMode('collapsed');
                    setError(null);
                    setMessage(null);
                  }}
                  className="w-full min-h-11 text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Volver
                </button>
                <Link
                  href="/"
                  className="block w-full min-h-10 text-center text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
                >
                  Cancelar e ir al inicio
                </Link>
              </form>
            </div>
          </div>
        )}

        {/* REGISTRO TERRITORIAL — overlay centrado (flex), scroll interno, no se corta */}
        {viewMode === 'sheet_signup' && (
          <div
            className="fixed inset-0 z-[220] flex items-end justify-center sm:items-center p-0 sm:p-5 md:p-8"
            role="presentation"
          >
            <button
              type="button"
              className={`absolute inset-0 animate-in fade-in duration-200 ${overlayBackdropClassName}`}
              aria-label="Cerrar registro"
              onClick={() => {
                setViewMode('collapsed');
                setError(null);
                setMessage(null);
              }}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="signup-title"
              className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden
                max-h-[min(92dvh,880px)]
                rounded-t-[28px] sm:rounded-3xl
                border border-border/60 border-b-0 sm:border-b
                bg-surface-raised shadow-[0_-8px_40px_rgba(0,0,0,0.45)] sm:shadow-[0_24px_80px_rgba(0,0,0,0.5)]
                animate-in slide-in-from-bottom sm:fade-in sm:zoom-in-95 duration-300
                safe-area-pb"
            >
              <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mt-3 mb-0 sm:hidden shrink-0" />

              <header className="shrink-0 px-5 sm:px-8 lg:px-10 pt-3 sm:pt-6 pb-4 sm:pb-5 border-b border-border/40">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.65rem] uppercase tracking-[0.16em] text-primary font-semibold mb-1">
                      Registro territorial · Chiloé
                    </p>
                    <h2 id="signup-title" className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                      Crear cuenta
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                      Cuenta + perfil territorial. El registro básico es gratis.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('collapsed');
                      setError(null);
                      setMessage(null);
                    }}
                    className="hidden sm:inline-flex min-h-10 items-center rounded-full px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shrink-0"
                  >
                    Cerrar
                  </button>
                </div>
              </header>

              <form
                id="signup-territorial-form"
                onSubmit={handleAuthSubmit}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-8 lg:px-10 py-5 sm:py-6"
              >
                {message ? (
                  <div className="mb-5 rounded-xl border border-primary/20 bg-primary/10 p-3.5 text-center text-sm text-primary">
                    {message}
                  </div>
                ) : null}

                {/* Fila principal: cuenta | territorio — usa el ancho en escritorio */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16">
                  {/* Columna cuenta */}
                  <section className="space-y-5">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Datos de cuenta
                    </h3>

                    <div>
                      <label htmlFor="fullname" className={labelClass}>
                        Nombre completo
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                        <input
                          id="fullname"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={fieldIconClass}
                          placeholder="Ej. Gabriel Cuevas"
                          autoComplete="name"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="signup-email" className={labelClass}>
                        Correo electrónico
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                        <input
                          id="signup-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={fieldIconClass}
                          placeholder="tu@correo.cl"
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="signup-password" className={labelClass}>
                        Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                        <input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`${fieldIconClass} pr-11`}
                          placeholder="Mínimo 6 caracteres"
                          autoComplete="new-password"
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

                    {OAUTH_PROVIDERS_ENABLED && (
                      <div className="rounded-2xl border border-border/50 bg-background/40 p-4 sm:p-5">
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                          También puedes crear la cuenta con Google y completar el perfil territorial después.
                        </p>
                        <button
                          type="button"
                          onClick={() => void handleGoogleOAuth()}
                          disabled={loading}
                          className="w-full min-h-12 rounded-xl border border-border/60 bg-surface-raised px-4 flex items-center justify-center gap-2.5 text-sm font-medium text-foreground hover:bg-surface-sunken transition-colors disabled:opacity-50"
                        >
                          <GoogleIcon className="w-4 h-4" />
                          Continuar con Google
                        </button>
                      </div>
                    )}
                  </section>

                  {/* Columna territorio */}
                  <section className="space-y-5">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Perfil territorial
                    </h3>

                    <div>
                      <label htmlFor="rol" className={labelClass}>
                        Rol territorial
                      </label>
                      <select
                        id="rol"
                        required
                        value={rol}
                        onChange={(e) => setRol(e.target.value)}
                        className={`${fieldClass} appearance-none`}
                      >
                        <option value="api_residente">Apicultor Residente</option>
                        <option value="api_trashumante">Apicultor Trashumante</option>
                        <option value="api_mixto">Apicultor Mixto</option>
                        <option value="prop_facilitador">Propietario Facilitador</option>
                        <option value="agri_fitosanitario">Agricultor / Forestal</option>
                        <option value="agri_aplicador">Aplicador Fitosanitario</option>
                        <option value="comercial_acopio">Centro de Acopio / Comercializador</option>
                        <option value="tecnico_inspector">Técnico / Inspector / Investigador</option>
                        <option value="institucion_publica">Institución Pública</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="region" className={labelClass}>
                          Región
                        </label>
                        <input
                          id="region"
                          type="text"
                          required
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          className={fieldClass}
                          placeholder="Los Lagos"
                        />
                      </div>
                      <div>
                        <label htmlFor="comuna" className={labelClass}>
                          Comuna principal
                        </label>
                        <input
                          id="comuna"
                          type="text"
                          required
                          value={comuna}
                          onChange={(e) => setComuna(e.target.value)}
                          className={fieldClass}
                          placeholder="Ej. Ancud"
                        />
                      </div>
                    </div>

                    {/* Código opcional: oculto hasta que lo pidan */}
                    <div className="pt-1">
                      {!showInviteCode ? (
                        <button
                          type="button"
                          onClick={() => setShowInviteCode(true)}
                          className="inline-flex min-h-10 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" aria-hidden />
                          Tengo un código de invitación
                        </button>
                      ) : (
                        <div className="space-y-2 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between gap-2">
                            <label htmlFor="invite-code" className={labelClass + ' mb-0'}>
                              Código de invitación
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setShowInviteCode(false);
                                setInviteCode('');
                              }}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Ocultar
                            </button>
                          </div>
                          <input
                            id="invite-code"
                            type="text"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            className={fieldClass}
                            placeholder="Si te pasaron un código, pégalo acá"
                            autoComplete="off"
                            autoFocus
                          />
                          <p className="text-xs text-muted-foreground/80">
                            Opcional. Si no tienes, sigue sin él.
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                {/* Consentimientos: ancho completo, 2 columnas en desktop */}
                <section className="mt-8 lg:mt-10 space-y-5">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Consentimientos de participación
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {(
                      [
                        {
                          id: 'consent-mapa',
                          checked: consentMapa,
                          onChange: setConsentMapa,
                          title: 'Aparecer en mapa comunitario',
                          desc: 'Visibilidad pública básica (nombre y comuna) para fortalecer la red local.',
                        },
                        {
                          id: 'consent-alertas',
                          checked: consentAlertas,
                          onChange: setConsentAlertas,
                          title: 'Recibir alertas fitosanitarias',
                          desc: 'Notificaciones tempranas sobre aplicaciones agroquímicas en un radio de 5 km.',
                        },
                        {
                          id: 'consent-catalogo',
                          checked: consentCatalogo,
                          onChange: setConsentCatalogo,
                          title: 'Catálogo de infraestructura',
                          desc: 'Disponibilidad de predios facilitadores o salas de extracción compartidas.',
                        },
                        {
                          id: 'consent-acopio',
                          checked: consentAcopio,
                          onChange: setConsentAcopio,
                          title: 'Acopio cooperativo',
                          desc: 'Participación en acopio colectivo y compras conjuntas de la red.',
                        },
                      ] as const
                    ).map((c) => (
                      <label
                        key={c.id}
                        htmlFor={c.id}
                        className="flex items-start gap-3 cursor-pointer group rounded-xl border border-border/45 bg-background/35 p-4 hover:border-primary/30 transition-colors min-h-[5.5rem]"
                      >
                        <input
                          id={c.id}
                          type="checkbox"
                          checked={c.checked}
                          onChange={(e) => c.onChange(e.target.checked)}
                          className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border-border/60 bg-background text-primary focus:ring-primary"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {c.title}
                          </span>
                          <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">
                            {c.desc}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <label
                      htmlFor="acepta-carta"
                      className="flex items-start gap-3 cursor-pointer group rounded-xl border border-primary/25 bg-primary/5 p-4 min-h-[5.5rem]"
                    >
                      <input
                        id="acepta-carta"
                        type="checkbox"
                        checked={aceptaCarta}
                        onChange={(e) => setAceptaCarta(e.target.checked)}
                        className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border-border/60 bg-background text-primary focus:ring-primary"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">
                          Acepto la{' '}
                          <a
                            href="/carta"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-2 text-primary hover:text-primary/80"
                          >
                            Carta Constitutiva
                          </a>
                        </span>
                        <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">
                          Infraestructura colectiva, consentimiento informado y beneficio recíproco.
                        </span>
                      </span>
                    </label>
                    <label
                      htmlFor="acepta-politica"
                      className="flex items-start gap-3 cursor-pointer group rounded-xl border border-primary/25 bg-primary/5 p-4 min-h-[5.5rem]"
                    >
                      <input
                        id="acepta-politica"
                        type="checkbox"
                        checked={aceptaPoliticaDatos}
                        onChange={(e) => setAceptaPoliticaDatos(e.target.checked)}
                        className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border-border/60 bg-background text-primary focus:ring-primary"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">
                          Acepto la política de datos y privacidad
                        </span>
                        <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">
                          Puedes corregir, descargar y retirar consentimientos en cualquier momento.
                        </span>
                      </span>
                    </label>
                  </div>
                </section>

                {error ? (
                  <p className="text-sm text-destructive text-center mt-6">{error}</p>
                ) : null}
              </form>

              <footer className="shrink-0 border-t border-border/40 px-5 sm:px-8 lg:px-10 py-3.5 sm:py-4 bg-surface-raised pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('collapsed');
                        setError(null);
                        setMessage(null);
                      }}
                      className="min-h-11 px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Volver
                    </button>
                    <Link
                      href="/"
                      className="min-h-11 inline-flex items-center px-3 text-sm text-muted-foreground/80 hover:text-foreground transition-colors"
                    >
                      Ir al inicio
                    </Link>
                  </div>
                  <button
                    type="submit"
                    form="signup-territorial-form"
                    disabled={loading}
                    className="w-full sm:w-auto sm:min-w-[200px] min-h-12 rounded-full bg-primary text-primary-foreground font-medium text-sm px-8 py-3 shadow-lg hover:opacity-95 transition-opacity disabled:opacity-50"
                  >
                    {loading ? 'Procesando…' : 'Crear cuenta'}
                  </button>
                </div>
              </footer>
            </div>
          </div>
        )}

        {/* RECOVERY — mismo patrón de centrado */}
        {viewMode === 'sheet_recovery' && (
          <div className="fixed inset-0 z-[220] flex items-end justify-center sm:items-center p-0 sm:p-5">
            <button
              type="button"
              className={`absolute inset-0 animate-in fade-in duration-200 ${overlayBackdropClassName}`}
              aria-label="Cerrar"
              onClick={() => {
                setIsForgotPassword(false);
                setIsRecoveryMode(false);
                setViewMode('collapsed');
              }}
            />
            <div
              role="dialog"
              aria-modal="true"
              className="relative z-10 w-full max-w-md max-h-[min(90dvh,640px)] overflow-y-auto overscroll-contain
                rounded-t-[28px] sm:rounded-3xl border border-border/60 border-b-0 sm:border-b
                bg-surface-raised p-6 sm:p-8
                shadow-[0_-8px_40px_rgba(0,0,0,0.45)] sm:shadow-[0_24px_64px_rgba(0,0,0,0.45)]
                animate-in slide-in-from-bottom sm:fade-in sm:zoom-in-95 duration-300
                pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mb-4 sm:hidden" />

              <div className="mb-6 text-center">
                <h2 className="text-lg font-semibold text-foreground tracking-tight">
                  {isRecoveryMode ? 'Nueva Contraseña' : 'Recuperar Contraseña'}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {isRecoveryMode
                    ? 'Ingresa y confirma tu nueva contraseña para la cuenta del Registro Territorial.'
                    : 'Te enviaremos un enlace seguro a tu correo para crear una nueva contraseña.'}
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {message ? (
                  <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-center text-xs text-primary">
                    {message}
                  </div>
                ) : null}

                {!isRecoveryMode ? (
                  <div>
                    <label
                      htmlFor="recovery-email"
                      className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5"
                    >
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                      <input
                        id="recovery-email"
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
                ) : null}

                {isRecoveryMode ? (
                  <>
                    <div>
                      <label
                        htmlFor="new-password"
                        className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5"
                      >
                        Nueva Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                        <input
                          id="new-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          required
                          minLength={6}
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
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="confirm-password"
                        className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5"
                      >
                        Confirmar Nueva Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                        <input
                          id="confirm-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-11 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </>
                ) : null}

                {error ? <p className="text-xs text-destructive text-center">{error}</p> : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-13 rounded-full bg-primary text-primary-foreground font-medium text-sm py-3.5 shadow-lg hover:opacity-95 transition-opacity disabled:opacity-50 mt-2"
                >
                  {loading
                    ? 'Procesando…'
                    : isRecoveryMode
                      ? 'Guardar nueva contraseña'
                      : 'Enviar enlace de recuperación'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setIsRecoveryMode(false);
                    setViewMode('sheet_email');
                    setError(null);
                    setMessage(null);
                  }}
                  className="w-full min-h-10 text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}