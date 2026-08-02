'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore, logSecurityEvent, getRoleRedirectPath } from '@enjambre/auth';

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

function AppleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.35c.64-.78 1.08-1.86.96-2.95-.94.04-2.09.63-2.75 1.41-.59.68-.96 1.78-.82 2.85 1.05.08 2.15-.53 2.61-1.31z" />
    </svg>
  );
}

function XLogoIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

type ViewMode =
  | 'collapsed'
  | 'expanded'
  | 'sheet_email'
  | 'sheet_signup'
  | 'sheet_recovery';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Campos Territoriales Adicionales
  const [inviteCode, setInviteCode] = useState('');
  const [rol, setRol] = useState('api_residente');
  const [region, setRegion] = useState('Los Lagos');
  const [comuna, setComuna] = useState('');
  const [consentMapa, setConsentMapa] = useState(false);
  const [consentAlertas, setConsentAlertas] = useState(true);
  const [consentCatalogo, setConsentCatalogo] = useState(false);
  const [consentAcopio, setConsentAcopio] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('collapsed');

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

  async function handleOAuth(provider: 'google' | 'apple' | 'twitter') {
    setError(null);
    setMessage(null);
    setLoading(true);
    const { error: oAuthErr } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/login`,
      },
    });
    if (oAuthErr) {
      setError(oAuthErr.message || 'Error en autenticación');
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
        if (updateErr) throw updateErr;
        setMessage('¡Contraseña actualizada con éxito! Redirigiendo...');
        setIsRecoveryMode(false);
        
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
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/login`,
        });
        if (resetErr) throw resetErr;

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
        if (signUpErr) throw signUpErr;

        // Si data.user.identities está vacío, significa que el correo ya está registrado en Supabase
        if (data?.user && data.user.identities && data.user.identities.length === 0) {
          throw new Error('Ya existe una cuenta con este correo. Por favor inicia sesión o recupera tu contraseña.');
        }

        await logSecurityEvent(supabase, {
          eventType: 'signup_success',
          userId: data.user?.id ?? null,
          email,
          appSource: 'nucleo',
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
      const msg = err instanceof Error ? err.message : 'Error al procesar la solicitud.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[100dvh] w-full bg-background text-foreground flex flex-col justify-between overflow-hidden px-5 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] select-none">
      {/* Starry / Cosmic Atmosphere Layer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] h-[60vh] rounded-full bg-gradient-to-b from-primary/15 via-primary/5 to-transparent blur-3xl opacity-60" />
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

      {/* Top / Center Hero Branding — Grok-style Display Logo + Tagline */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto pt-6 pb-4">
        <h1 className="font-display text-[clamp(3.5rem,15vw,5rem)] font-light tracking-tight text-foreground text-center leading-none">
          Enjambre
        </h1>
        <p className="mt-3 flex items-center justify-center gap-1 font-mono text-[0.65rem] tracking-[0.24em] text-muted-foreground uppercase text-center">
          <span>Sistema Operativo Biocultural</span>
          <span className="inline-block w-1.5 h-3 bg-primary animate-pulse" />
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-surface-raised/50 backdrop-blur-md px-3 py-1 text-[0.6rem] tracking-[0.2em] text-muted-foreground uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>Registro Territorial</span>
        </div>
      </div>

      {/* Bottom Action Sheet / Pill Options + Modals */}
      <div className="relative z-10 w-full max-w-sm mx-auto">
        
        {/* 1. COLLAPSED MODE (Clean Hybrid) */}
        {viewMode === 'collapsed' && (
          <div className="flex flex-col items-center gap-3 w-full animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => {
                setViewMode('sheet_email');
                setError(null);
                setMessage(null);
              }}
              className="w-full min-h-14 rounded-full border border-border/60 bg-surface-raised/80 backdrop-blur-2xl px-6 py-3 flex items-center justify-between gap-3 text-sm font-medium text-foreground hover:border-border hover:bg-surface-raised transition-all shadow-lg"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary" />
                <span>Iniciar sesión con correo</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('sheet_signup');
                setError(null);
                setMessage(null);
              }}
              className="w-full min-h-14 rounded-full border border-border/60 bg-background/40 backdrop-blur-2xl px-6 py-3 flex items-center justify-between gap-3 text-sm font-medium text-foreground hover:border-border hover:bg-surface-raised transition-all shadow-lg"
            >
              <div className="flex items-center gap-3">
                <UserPlus className="w-4 h-4 text-muted-foreground" />
                <span>Crear cuenta nueva</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </button>

            <button
              type="button"
              onClick={() => setViewMode('expanded')}
              className="w-full py-2.5 mt-2 text-center text-xs text-muted-foreground/80 hover:text-foreground tracking-widest uppercase transition-colors"
            >
              Otras opciones
            </button>
          </div>
        )}

        {/* 2. EXPANDED OPTIONS MODE */}
        {viewMode === 'expanded' && (
          <div className="flex flex-col items-center gap-2.5 w-full animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => void handleOAuth('google')}
              disabled={loading}
              className="w-full min-h-13 rounded-full border border-border/60 bg-surface-raised/80 backdrop-blur-2xl px-5 py-3 flex items-center justify-center gap-3 text-sm font-medium text-foreground hover:border-border transition-all disabled:opacity-50"
            >
              <GoogleIcon className="w-4 h-4" />
              <span>Continuar con Google</span>
            </button>

            <button
              type="button"
              onClick={() => void handleOAuth('apple')}
              disabled={loading}
              className="w-full min-h-13 rounded-full border border-border/60 bg-surface-raised/80 backdrop-blur-2xl px-5 py-3 flex items-center justify-center gap-3 text-sm font-medium text-foreground hover:border-border transition-all disabled:opacity-50"
            >
              <AppleIcon className="w-4 h-4" />
              <span>Iniciar sesión con Apple</span>
            </button>

            <button
              type="button"
              onClick={() => void handleOAuth('twitter')}
              disabled={loading}
              className="w-full min-h-13 rounded-full border border-border/60 bg-surface-raised/80 backdrop-blur-2xl px-5 py-3 flex items-center justify-center gap-3 text-sm font-medium text-foreground hover:border-border transition-all disabled:opacity-50"
            >
              <XLogoIcon className="w-4 h-4" />
              <span>Continuar con X</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('collapsed')}
              className="w-full py-2.5 mt-2 text-center text-xs text-muted-foreground/80 hover:text-foreground tracking-widest uppercase transition-colors"
            >
              Menos opciones
            </button>
          </div>
        )}

        {/* 3. EMAIL & PASSWORD LOGIN BOTTOM SHEET MODAL */}
        {viewMode === 'sheet_email' && (
          <>
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-in fade-in duration-200"
              onClick={() => setViewMode('collapsed')}
            />
            <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[32px] border-t border-border/60 bg-surface-raised/95 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_-12px_48px_rgba(0,0,0,0.85)] animate-in slide-in-from-bottom duration-300 max-w-md mx-auto">
              <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mb-4" />

              <div className="mb-6 text-center">
                <h2 className="text-lg font-semibold text-foreground tracking-tight">
                  Iniciar sesión en el Registro
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Panel operativo y gestión del sistema territorial
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
                  className="w-full min-h-10 text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Volver a las opciones
                </button>
              </form>
            </div>
          </>
        )}

        {/* 4. SIGNUP BOTTOM SHEET MODAL */}
        {viewMode === 'sheet_signup' && (
          <>
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-in fade-in duration-200"
              onClick={() => setViewMode('collapsed')}
            />
            <div className="fixed inset-x-0 bottom-0 md:bottom-auto md:inset-y-0 md:my-auto md:h-fit z-50 rounded-t-[32px] md:rounded-[32px] border-t md:border border-border/60 bg-surface-raised/95 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_-12px_48px_rgba(0,0,0,0.85)] md:shadow-[0_24px_80px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom md:fade-in md:slide-in-from-bottom-0 md:zoom-in-95 duration-300 max-w-md md:max-w-2xl mx-auto md:max-h-[90vh] overflow-y-auto">
              <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mb-4" />

              <div className="mb-6 text-center">
                <h2 className="text-lg font-semibold text-foreground tracking-tight">
                  Crear cuenta
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Únete a la Red Apícola para registrar tu apiario de forma autónoma.
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4 md:space-y-6 max-h-[70vh] md:max-h-[80vh] overflow-y-auto px-1 pb-4">
                {message ? (
                  <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-center text-xs text-primary">
                    {message}
                  </div>
                ) : null}

                <div className="flex flex-col md:grid md:grid-cols-2 md:gap-8">
                  <div className="space-y-4">
                    <div>
                      <label
                    htmlFor="fullname"
                    className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5"
                  >
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <input
                      id="fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                      placeholder="Ej. Gabriel Cuevas"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5"
                  >
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <input
                      id="signup-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                      placeholder="tu@correo.cl"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5"
                  >
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
                      className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-11 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                      placeholder="Mínimo 6 caracteres"
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
                </div>

                <div className="space-y-4 mt-2 md:mt-0">
                  <div className="pt-2 md:pt-0">
                    <div className="h-[1px] w-full bg-border/40 my-4 md:hidden" />
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                      Perfil Territorial
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label
                      htmlFor="invite-code"
                      className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5"
                    >
                      Código de Invitación <span className="text-muted-foreground/60 lowercase">(Opcional)</span>
                    </label>
                    <input
                      id="invite-code"
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                      placeholder="Ej. d5301..."
                    />
                  </div>

                  <div className="col-span-2">
                    <label
                      htmlFor="rol"
                      className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5"
                    >
                      Rol Territorial
                    </label>
                    <select
                      id="rol"
                      required
                      value={rol}
                      onChange={(e) => setRol(e.target.value)}
                      className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none transition-colors appearance-none"
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

                  <div className="col-span-2 sm:col-span-1">
                    <label
                      htmlFor="region"
                      className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5"
                    >
                      Región
                    </label>
                    <input
                      id="region"
                      type="text"
                      required
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                      placeholder="Los Lagos"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label
                      htmlFor="comuna"
                      className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5"
                    >
                      Comuna Principal
                    </label>
                    <input
                      id="comuna"
                      type="text"
                      required
                      value={comuna}
                      onChange={(e) => setComuna(e.target.value)}
                      className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                      placeholder="Ej. Ancud"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-3">
                    Consentimientos de Participación
                  </label>
                  
                  <div className="space-y-3 bg-surface-raised/40 p-3.5 rounded-xl border border-border/40">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={consentMapa}
                        onChange={(e) => setConsentMapa(e.target.checked)}
                        className="mt-1 flex-shrink-0 w-4 h-4 rounded border-border/60 bg-background text-primary focus:ring-primary focus:ring-offset-background transition-colors"
                      />
                      <div className="flex-1">
                        <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">Aparecer en Mapa Comunitario</span>
                        <p className="text-[0.65rem] text-muted-foreground/80 mt-0.5 leading-tight">Visibilidad pública básica (nombre y comuna) para fortalecer la red local.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={consentAlertas}
                        onChange={(e) => setConsentAlertas(e.target.checked)}
                        className="mt-1 flex-shrink-0 w-4 h-4 rounded border-border/60 bg-background text-primary focus:ring-primary focus:ring-offset-background transition-colors"
                      />
                      <div className="flex-1">
                        <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">Recibir Alertas Fitosanitarias</span>
                        <p className="text-[0.65rem] text-muted-foreground/80 mt-0.5 leading-tight">Notificaciones tempranas sobre aplicaciones agroquímicas en un radio de 5km.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={consentCatalogo}
                        onChange={(e) => setConsentCatalogo(e.target.checked)}
                        className="mt-1 flex-shrink-0 w-4 h-4 rounded border-border/60 bg-background text-primary focus:ring-primary focus:ring-offset-background transition-colors"
                      />
                      <div className="flex-1">
                        <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">Catálogo de Infraestructura</span>
                        <p className="text-[0.65rem] text-muted-foreground/80 mt-0.5 leading-tight">Disponibilidad de predios facilitadores o salas de extracción compartidas.</p>
                      </div>
                    </label>
                  </div>
                </div>
                </div>
                </div>

                {error ? <p className="text-xs text-destructive text-center mt-4">{error}</p> : null}

                <div className="pt-4 pb-2 sticky bottom-0 bg-gradient-to-t from-surface-raised via-surface-raised/95 to-transparent backdrop-blur-sm z-10">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-13 rounded-full bg-primary text-primary-foreground font-medium text-sm py-3.5 shadow-lg hover:opacity-95 transition-opacity disabled:opacity-50"
                  >
                    {loading ? 'Procesando…' : 'Crear Cuenta'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setViewMode('collapsed');
                    setError(null);
                    setMessage(null);
                  }}
                  className="w-full min-h-10 text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
              </form>
            </div>
          </>
        )}

        {/* 5. RECOVERY / FORGOT PASSWORD BOTTOM SHEET MODAL */}
        {viewMode === 'sheet_recovery' && (
          <>
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-in fade-in duration-200"
              onClick={() => {
                setIsForgotPassword(false);
                setIsRecoveryMode(false);
                setViewMode('collapsed');
              }}
            />
            <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[32px] border-t border-border/60 bg-surface-raised/95 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_-12px_48px_rgba(0,0,0,0.85)] animate-in slide-in-from-bottom duration-300 max-w-md mx-auto">
              <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mb-4" />

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
          </>
        )}
      </div>
    </main>
  );
}