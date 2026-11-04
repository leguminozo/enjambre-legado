'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  ChevronDown,
  Check,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore, logSecurityEvent, getRoleRedirectPath } from '@enjambre/auth';
import { adoptTerritorialSession } from '@/lib/adopt-territorial-session';
import { TERRITORIAL_ROL_OPTIONS } from '@/lib/territorial-rol';
import { CHILE_REGIONES, getComunasPorRegion } from '@enjambre/logistica';
import { friendlyError, friendlySupabaseError } from '@enjambre/ui';
import { validarRUT, formatearRUT } from '@/lib/rut';

interface UnclaimedActor {
  id: string;
  nombre_actor: string;
  comuna: string;
  region: string;
  rol: string;
  n_apiarios: number;
  n_colmenas: number;
  apiarios_nombres: string[];
}

const fieldIconClass =
  'w-full min-h-11 rounded-xl border border-border/60 bg-background/70 pl-10 pr-4 py-2.5 text-base md:text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all';
const fieldClass =
  'w-full min-h-11 rounded-xl border border-border/60 bg-background/70 px-4 py-2.5 text-base md:text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all';
const labelClass =
  'block text-[0.65rem] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5';

type AuthTab = 'login' | 'signup' | 'recovery';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<AuthTab>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [sugerencias, setSugerencias] = useState<UnclaimedActor[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [reclamarActor, setReclamarActor] = useState<UnclaimedActor | null>(null);
  const [claimRut, setClaimRut] = useState('');
  const [claimTelefono, setClaimTelefono] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);

  // Perfil Territorial
  const [inviteCode, setInviteCode] = useState('');
  const [rol, setRol] = useState('api_residente');
  const [region, setRegion] = useState<string>('Los Lagos');
  const [comuna, setComuna] = useState('');

  const comunasDisponibles = getComunasPorRegion(region);

  function handleRegionChange(newRegion: string) {
    setRegion(newRegion);
    setComuna('');
  }

  // Detección automática y sugerencia de reclamo de asentamientos comunitarios precargados
  useEffect(() => {
    if (tab !== 'signup' || reclamarActor) {
      setSugerencias([]);
      return;
    }
    const q = fullName.trim();
    if (q.length < 3) {
      setSugerencias([]);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await fetch(
          `/api/registro-territorial/actores/buscar-unclaimed?q=${encodeURIComponent(q)}`,
        );
        if (res.ok) {
          const json = (await res.json()) as { data?: UnclaimedActor[] };
          setSugerencias(json.data ?? []);
        }
      } catch {
        // Fallo no intrusivo en búsqueda de sugerencias
      } finally {
        setBuscando(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [fullName, reclamarActor, tab]);

  function handleReclamar(sug: UnclaimedActor) {
    setReclamarActor(sug);
    setFullName(sug.nombre_actor);
    if (sug.region) setRegion(sug.region);
    if (sug.comuna) setComuna(sug.comuna);
    if (sug.rol && TERRITORIAL_ROL_OPTIONS.some((r) => r.value === sug.rol)) {
      setRol(sug.rol);
    }
    setSugerencias([]);
  }

  function handleDesvincular() {
    setReclamarActor(null);
    setClaimRut('');
    setClaimTelefono('');
  }
  const [consentMapa, setConsentMapa] = useState(false);
  const [consentAlertas, setConsentAlertas] = useState(true);
  const [consentCatalogo, setConsentCatalogo] = useState(false);
  const [consentAcopio, setConsentAcopio] = useState(false);
  const [aceptaCarta, setAceptaCarta] = useState(false);
  const [aceptaPoliticaDatos, setAceptaPoliticaDatos] = useState(false);
  const [verificacionPendiente, setVerificacionPendiente] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // Contador regresivo para reenvío de verificación
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Sincronizar tab con URL inicial y parámetros de callback
  useEffect(() => {
    const mode = searchParams.get('mode');
    const tabParam = searchParams.get('tab');
    if (mode === 'signup' || tabParam === 'signup') {
      setTab('signup');
    }

    const err = searchParams.get('error');
    if (err === 'auth-callback-failed') {
      setMessage(
        'El enlace de acceso o confirmación expiró o fue procesado en otro dispositivo. Si ya confirmaste tu correo, inicia sesión con tu contraseña.',
      );
    } else if (err === 'recovery-failed') {
      setError(
        'El enlace para restablecer tu contraseña expiró o es inválido. Solicita un nuevo enlace.',
      );
      setTab('recovery');
    } else if (err === 'supabase-not-configured') {
      setError('El servicio de autenticación no está disponible en este momento.');
    }

    if (searchParams.get('verified') === 'true') {
      setMessage('Correo verificado exitosamente. Ya puedes iniciar sesión con tus credenciales.');
    }
  }, [searchParams]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string) => {
      if (
        event === 'PASSWORD_RECOVERY' ||
        (typeof window !== 'undefined' && window.location.hash.includes('type=recovery'))
      ) {
        setIsRecoveryMode(true);
        setTab('recovery');
      }
    });

    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      setIsRecoveryMode(true);
      setTab('recovery');
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function goAfterNucleoAuth() {
    const roleNow = useAuthStore.getState().user?.role ?? 'cliente';
    if (roleNow === 'rep_ventas') {
      router.replace(getRoleRedirectPath(roleNow));
      return;
    }
    if (roleNow === 'admin' || roleNow === 'apicultor' || roleNow === 'territorial') {
      router.replace('/inicio');
      return;
    }
    await adoptTerritorialSession();
    // En Núcleo el destino post-autenticación es siempre el Registro Territorial (/inicio)
    router.replace('/inicio');
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      return;
    }
    let cancelled = false;
    void (async () => {
      await useAuthStore.getState().checkUser();
      if (cancelled) return;
      const role = useAuthStore.getState().user?.role;
      if (!role) return;
      if (role === 'rep_ventas') {
        router.replace(getRoleRedirectPath(role));
        return;
      }
      if (role === 'admin' || role === 'apicultor' || role === 'territorial' || role === 'operador' || role === 'colaborador') {
        router.replace('/inicio');
        return;
      }
      // Cualquier otro usuario que ingrese a Núcleo adopta la sesión territorial y va a /inicio
      setLoading(true);
      await goAfterNucleoAuth();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchTab = (nextTab: AuthTab) => {
    setTab(nextTab);
    setError(null);
    setMessage(null);
    setVerificacionPendiente(false);
    setResendStatus(null);
    setSugerencias([]);
    if (nextTab !== 'signup') {
      setReclamarActor(null);
      setClaimRut('');
      setClaimTelefono('');
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || resendLoading || !email.trim()) return;
    setResendLoading(true);
    setResendStatus(null);
    try {
      const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?next=/inicio`,
        },
      });
      if (resendErr) {
        throw new Error(friendlySupabaseError(resendErr));
      }
      setResendStatus('Nuevo enlace de activación enviado a tu correo.');
      setResendCooldown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al reenviar correo de activación';
      setResendStatus(msg);
    } finally {
      setResendLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // 1. Modo Recuperación / Reset de contraseña
      if (isRecoveryMode || tab === 'recovery') {
        if (isRecoveryMode) {
          if (password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres.');
          }
          if (password !== confirmPassword) {
            throw new Error('Las contraseñas no coinciden.');
          }
          const { error: updateErr } = await supabase.auth.updateUser({ password });
          if (updateErr) throw new Error(friendlySupabaseError(updateErr));
          setMessage('¡Contraseña actualizada con éxito! Redirigiendo...');
          setIsRecoveryMode(false);
          await useAuthStore.getState().checkUser();
          await goAfterNucleoAuth();
          setLoading(false);
          return;
        }

        // Solicitar enlace de recuperación
        if (!email.trim()) {
          throw new Error('Por favor ingresa tu correo electrónico.');
        }
        const siteUrl =
          process.env.NEXT_PUBLIC_NUCLEO_URL ??
          (typeof window !== 'undefined' ? window.location.origin : '');
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
        });
        if (resetErr) throw new Error(friendlySupabaseError(resetErr));

        await logSecurityEvent(supabase, {
          eventType: 'password_reset_requested',
          userId: null,
          email,
          appSource: 'nucleo',
        });
        setMessage('Te hemos enviado un enlace a tu correo para restablecer tu contraseña.');
        setLoading(false);
        return;
      }

      // 2. Modo Registro (Crear Cuenta Territorial)
      if (tab === 'signup') {
        if (!aceptaCarta || !aceptaPoliticaDatos) {
          throw new Error('Debes aceptar la Carta Constitutiva y la política de datos para inscribirte.');
        }
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }
        if (reclamarActor) {
          if (!claimRut.trim()) {
            throw new Error('Debes ingresar tu RUT para acreditar la titularidad del asentamiento.');
          }
          if (!validarRUT(claimRut.trim())) {
            throw new Error('El RUT ingresado no es válido. Formato: 12.345.678-9');
          }
          if (!claimTelefono.trim()) {
            throw new Error('Debes ingresar un teléfono de contacto para verificación territorial.');
          }
        }
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              app_source: 'nucleo_territorial',
              referrer_id: inviteCode.trim() || undefined,
              reclamar_actor_id: reclamarActor ? reclamarActor.id : undefined,
              rut: reclamarActor ? formatearRUT(claimRut.trim()) : undefined,
              telefono: reclamarActor ? claimTelefono.trim() : undefined,
              territorial_rol: rol,
              territorial_region: region,
              territorial_comuna: comuna.trim(),
              territorial_acepta_carta: aceptaCarta,
              territorial_acepta_politica_datos: aceptaPoliticaDatos,
              territorial_consentimientos: {
                mapa_comunitario: consentMapa,
                alertas_fitosanitarias: consentAlertas,
                catalogo_infraestructura: consentCatalogo,
                acopio_cooperativo: consentAcopio,
              },
            },
            emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?next=/inicio`,
          },
        });
        if (signUpErr) throw new Error(friendlySupabaseError(signUpErr));

        if (data?.user && data.user.identities && data.user.identities.length === 0) {
          throw new Error('Ya existe una cuenta con este correo. Por favor inicia sesión.');
        }

        await logSecurityEvent(supabase, {
          eventType: 'signup_success',
          userId: data.user?.id ?? null,
          email,
          appSource: 'nucleo_territorial',
        });

        if (data.session) {
          await useAuthStore.getState().checkUser();
          await goAfterNucleoAuth();
          return;
        }
        setVerificacionPendiente(true);
        setLoading(false);
        return;
      }

      // 3. Modo Iniciar Sesión (Login)
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signErr) {
        await logSecurityEvent(supabase, {
          eventType: 'login_failed',
          userId: null,
          email,
          appSource: 'nucleo',
          details: { code: signErr.status },
        });
        throw new Error('Credenciales inválidas. Por favor verifica tu correo y contraseña.');
      }

      await useAuthStore.getState().checkUser();
      await logSecurityEvent(supabase, {
        eventType: 'login_success',
        userId: useAuthStore.getState().user?.id ?? null,
        email,
        appSource: 'nucleo_territorial',
      });

      await goAfterNucleoAuth();
    } catch (err: unknown) {
      const fallback = err instanceof Error ? err.message : 'Error al procesar la solicitud.';
      setError(friendlyError(err, fallback));
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[var(--vh-full)] w-full bg-background text-foreground flex flex-col justify-between overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 select-none">
      {/* Fondo ambiental */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-sunken/50 via-background to-background" />
      </div>

      {/* Barra superior de navegación */}
      <header className="relative z-20 flex items-center justify-between gap-3 max-w-4xl mx-auto w-full">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border/60 bg-surface-raised/80 px-3.5 py-1.5 text-xs font-medium text-foreground backdrop-blur-md transition-colors hover:border-border hover:bg-surface-raised"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>Volver al inicio</span>
        </Link>
        <Link
          href="/mapa-chiloe"
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors"
        >
          Mapa público
        </Link>
      </header>

      {/* Contenedor central unificado */}
      <div className="relative z-10 w-full max-w-2xl mx-auto my-auto py-6">
        {/* Cabecera de marca */}
        <div className="text-center mb-6">
          <span className="inline-block text-[0.65rem] font-mono tracking-[0.2em] text-primary uppercase font-semibold mb-1">
            Censo · Mapa · Panel
          </span>
          <h1 className="font-existencial text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground text-balance">
            Registro Apícola de Chiloé
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Un solo acceso al Enjambre. No reemplaza al SAG: ordena y defiende tu registro territorial.
          </p>
        </div>

        {/* Tarjeta de autenticación centralizada */}
        <div className="rounded-3xl border border-border/70 bg-surface-raised/90 backdrop-blur-xl shadow-2xl p-6 sm:p-8 transition-all">
          {/* Switch de pestañas si no está en recuperación */}
          {tab !== 'recovery' && !isRecoveryMode ? (
            <div className="flex items-center p-1 rounded-2xl bg-surface-sunken/80 border border-border/50 mb-6">
              <button
                type="button"
                onClick={() => switchTab('login')}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all ${
                  tab === 'login'
                    ? 'bg-card text-foreground shadow-sm border border-border/40 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => switchTab('signup')}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all ${
                  tab === 'signup'
                    ? 'bg-card text-foreground shadow-sm border border-border/40 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Crear cuenta
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-6">
              <h2 className="text-base font-semibold text-foreground font-existencial">
                {isRecoveryMode ? 'Nueva Contraseña' : 'Recuperar Contraseña'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsRecoveryMode(false);
                  switchTab('login');
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Volver a Iniciar sesión
              </button>
            </div>
          )}

          {/* Mensajes de error y estado */}
          {message ? (
            <div className="mb-5 rounded-xl border border-primary/25 bg-primary/10 p-3.5 text-center text-xs sm:text-sm text-primary animate-in fade-in">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="mb-5 rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-center text-xs sm:text-sm text-destructive animate-in fade-in">
              {error}
            </div>
          ) : null}

          {/* Formulario unificado */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {/* ─── TAB: LOGIN ─── */}
            {tab === 'login' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <label htmlFor="login-email" className={labelClass}>
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={fieldIconClass}
                      placeholder="tu@correo.cl"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-password" className={labelClass + ' mb-0'}>
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => switchTab('recovery')}
                      className="text-xs text-primary underline-offset-2 hover:underline focus:outline-none"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${fieldIconClass} pr-11`}
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-12 rounded-xl bg-primary text-primary-foreground font-medium text-sm py-3 shadow-md hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Entrando al Enjambre…</span>
                    </>
                  ) : (
                    <span>Entrar al Enjambre</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => switchTab('signup')}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ¿No tienes cuenta?{' '}
                    <span className="text-primary font-medium underline underline-offset-2">
                      Crear cuenta sin costo
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ─── TAB: SIGNUP (CREAR CUENTA) ─── */}
            {tab === 'signup' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Datos de cuenta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="fullname" className={labelClass}>
                        Nombre completo
                      </label>
                      {buscando && (
                        <span className="text-[10px] text-muted-foreground animate-pulse">
                          Buscando en catastro...
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                      <input
                        id="fullname"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (reclamarActor) setReclamarActor(null);
                        }}
                        className={fieldIconClass}
                        placeholder="Ej. Gabriel Cuevas o Víctor Ariel Ojeda"
                        autoComplete="name"
                      />
                    </div>

                    {reclamarActor ? (
                      <div className="mt-2.5 rounded-xl border border-primary/40 bg-primary/5 p-3.5 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                              Asentamiento comunitario vinculado
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleDesvincular}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                          >
                            Cambiar
                          </button>
                        </div>
                        <div className="text-sm font-medium text-foreground">
                          {reclamarActor.nombre_actor}
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                          <span>{reclamarActor.comuna}, {reclamarActor.region}</span>
                          <span>•</span>
                          <span>{reclamarActor.n_apiarios} {reclamarActor.n_apiarios === 1 ? 'apiario' : 'apiarios'}</span>
                          <span>•</span>
                          <span>{reclamarActor.n_colmenas} colmenas</span>
                        </div>
                        <div className="pt-2 border-t border-primary/20 space-y-2.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>Acreditación de titularidad requerida (Ley 21.489)</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug">
                            Para resguardar este asentamiento y evitar suplantaciones en la red territorial, ingresa tu RUT y teléfono de contacto directo.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1">
                                RUT del titular *
                              </label>
                              <input
                                type="text"
                                required
                                value={claimRut}
                                onChange={(e) => setClaimRut(e.target.value)}
                                onBlur={() => claimRut && setClaimRut(formatearRUT(claimRut))}
                                placeholder="12.345.678-9"
                                className="w-full rounded-lg border border-border/70 bg-background/90 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                              />
                              {claimRut && !validarRUT(claimRut) && (
                                <span className="text-[10px] text-destructive mt-0.5 block">RUT inválido</span>
                              )}
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1">
                                Teléfono de contacto *
                              </label>
                              <input
                                type="tel"
                                required
                                value={claimTelefono}
                                onChange={(e) => setClaimTelefono(e.target.value)}
                                placeholder="+56 9 1234 5678"
                                className="w-full rounded-lg border border-border/70 bg-background/90 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground/80 italic pt-1 border-t border-border/50">
                          Al crear tu cuenta, se asociarán tus apiarios históricos bajo acreditación territorial oficial.
                        </p>
                      </div>
                    ) : sugerencias.length > 0 ? (
                      <div className="mt-2.5 rounded-xl border border-border bg-card/95 p-3 space-y-2.5 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Asentamiento detectado en el catastro</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Detectamos registros comunitarios con nombres coincidentes. Puedes reclamar tu asentamiento con 1 clic para no tener que cargarlo de cero:
                        </p>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {sugerencias.map((sug) => (
                            <div
                              key={sug.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border border-border/60 bg-background hover:border-primary/50 transition-colors"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{sug.nombre_actor}</p>
                                <p className="text-xs text-muted-foreground">
                                  {sug.comuna} · {sug.n_apiarios} {sug.n_apiarios === 1 ? 'apiario' : 'apiarios'} · {sug.n_colmenas} colmenas
                                </p>
                              </div>
                              <button
                                type="button"
                                className="shrink-0 text-xs px-2.5 py-1.5 rounded-md border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-colors cursor-pointer"
                                onClick={() => handleReclamar(sug)}
                              >
                                Reclamar registro
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
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
                </div>

                {/* Perfil Territorial */}
                <div className="pt-2 border-t border-border/50">
                  <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">
                    Perfil territorial
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
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
                        {/* Canon: TERRITORIAL_ROL_OPTIONS (sin comercial_acopio).
                            institucion_publica se mantiene como entrada con validación posterior. */}
                        {TERRITORIAL_ROL_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                        <option value="institucion_publica">Institución Pública</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="region" className={labelClass}>
                        Región
                      </label>
                      <select
                        id="region"
                        required
                        value={region}
                        onChange={(e) => handleRegionChange(e.target.value)}
                        className={`${fieldClass} appearance-none`}
                      >
                        <option value="">Selecciona tu región</option>
                        {CHILE_REGIONES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="comuna" className={labelClass}>
                        Comuna principal
                      </label>
                      <select
                        id="comuna"
                        required
                        value={comuna}
                        onChange={(e) => setComuna(e.target.value)}
                        disabled={!region}
                        className={`${fieldClass} appearance-none disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <option value="">
                          {region ? 'Selecciona tu comuna' : 'Primero selecciona una región'}
                        </option>
                        {comunasDisponibles.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Código opcional */}
                  <div className="mt-3">
                    {!showInviteCode ? (
                      <button
                        type="button"
                        onClick={() => setShowInviteCode(true)}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>Tengo un código de invitación</span>
                      </button>
                    ) : (
                      <div className="space-y-1.5 pt-1 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <label htmlFor="invite-code" className={labelClass + ' mb-0'}>
                            Código de invitación
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setShowInviteCode(false);
                              setInviteCode('');
                            }}
                            className="text-[0.65rem] text-muted-foreground hover:text-foreground"
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
                          placeholder="Código opcional"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Consentimientos */}
                <div className="pt-2 border-t border-border/50 space-y-3">
                  <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Consentimientos de participación
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      htmlFor="consent-alertas"
                      className="flex items-start gap-2.5 p-3 rounded-xl border border-border/50 bg-background/50 cursor-pointer hover:border-border transition-colors text-xs"
                    >
                      <input
                        id="consent-alertas"
                        type="checkbox"
                        checked={consentAlertas}
                        onChange={(e) => setConsentAlertas(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="leading-snug">
                        <strong className="block text-foreground font-medium">Recibir alertas</strong>
                        <span className="text-muted-foreground text-[0.7rem]">
                          Avisos de fumigación en un radio de 5 km.
                        </span>
                      </span>
                    </label>

                    <label
                      htmlFor="consent-mapa"
                      className="flex items-start gap-2.5 p-3 rounded-xl border border-border/50 bg-background/50 cursor-pointer hover:border-border transition-colors text-xs"
                    >
                      <input
                        id="consent-mapa"
                        type="checkbox"
                        checked={consentMapa}
                        onChange={(e) => setConsentMapa(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="leading-snug">
                        <strong className="block text-foreground font-medium">Mapa comunitario</strong>
                        <span className="text-muted-foreground text-[0.7rem]">
                          Presencia básica para la red local.
                        </span>
                      </span>
                    </label>
                  </div>

                  {/* Aceptación legal */}
                  <div className="space-y-2 pt-1">
                    <label
                      htmlFor="acepta-carta"
                      className="flex items-start gap-2.5 p-3 rounded-xl border border-primary/25 bg-primary/5 cursor-pointer text-xs"
                    >
                      <input
                        id="acepta-carta"
                        type="checkbox"
                        required
                        checked={aceptaCarta}
                        onChange={(e) => setAceptaCarta(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-muted-foreground text-[0.75rem] leading-relaxed">
                        Acepto la{' '}
                        <a
                          href="/carta"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 text-primary hover:text-primary/80 font-medium"
                        >
                          Carta Constitutiva
                        </a>{' '}
                        (infraestructura colectiva y beneficio recíproco).
                      </span>
                    </label>

                    <label
                      htmlFor="acepta-politica"
                      className="flex items-start gap-2.5 p-3 rounded-xl border border-primary/25 bg-primary/5 cursor-pointer text-xs"
                    >
                      <input
                        id="acepta-politica"
                        type="checkbox"
                        required
                        checked={aceptaPoliticaDatos}
                        onChange={(e) => setAceptaPoliticaDatos(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-muted-foreground text-[0.75rem] leading-relaxed">
                        Acepto la{' '}
                        <a
                          href="/privacidad"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 text-primary hover:text-primary/80 font-medium"
                        >
                          política de datos y privacidad
                        </a>{' '}
                        (tus coordenadas exactas nunca son públicas).
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-12 rounded-xl bg-primary text-primary-foreground font-medium text-sm py-3 shadow-md hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creando cuenta territorial…</span>
                    </>
                  ) : (
                    <span>Crear cuenta e inscribirme</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => switchTab('login')}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ¿Ya tienes cuenta?{' '}
                    <span className="text-primary font-medium underline underline-offset-2">
                      Inicia sesión
                    </span>
                  </button>
                </div>

                {verificacionPendiente && (
                  <div
                    className="animate-in fade-in duration-300 rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3"
                    role="status"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary shrink-0" />
                        Revisa tu correo para activar tu cuenta
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Enviamos un enlace de verificación a{' '}
                        <strong className="text-foreground">{email.trim()}</strong>. Tu inscripción
                        {comuna ? ` en ${comuna}` : ''} queda en espera hasta que lo confirmes:
                        sin verificación no podrás entrar al mapa.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-background/60 border border-border/40 text-[0.75rem] text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">¿No lo encuentras?</p>
                      <ul className="list-disc list-inside space-y-0.5 text-muted-foreground/90">
                        <li>Revisa la carpeta de <strong>Spam</strong> o <strong>Correo no deseado</strong>.</li>
                        <li>Busca en tu correo: <em>Registro Apícola de Chiloé</em>.</li>
                        <li>El servidor puede tardar 1 a 2 minutos en entregar el mensaje.</li>
                      </ul>
                    </div>

                    <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendCooldown > 0 || resendLoading}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50 disabled:pointer-events-none transition-colors border border-primary/30"
                      >
                        {resendLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Enviando...
                          </>
                        ) : resendCooldown > 0 ? (
                          `Reenviar en ${resendCooldown}s`
                        ) : (
                          'Reenviar enlace de verificación'
                        )}
                      </button>
                    </div>

                    {resendStatus && (
                      <p className="text-xs text-primary font-medium">
                        {resendStatus}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB: RECOVERY (RECUPERACIÓN) ─── */}
            {(tab === 'recovery' || isRecoveryMode) && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {!isRecoveryMode ? (
                  <div>
                    <label htmlFor="recovery-email" className={labelClass}>
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
                        className={fieldIconClass}
                        placeholder="tu@correo.cl"
                      />
                    </div>
                    <p className="text-[0.7rem] text-muted-foreground mt-2">
                      Te enviaremos un enlace seguro para restablecer tu acceso.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="new-password" className={labelClass}>
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
                          className={`${fieldIconClass} pr-11`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label="Ver contraseña"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirm-password" className={labelClass}>
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
                          className={fieldIconClass}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-12 rounded-xl bg-primary text-primary-foreground font-medium text-sm py-3 shadow-md hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Procesando…</span>
                    </>
                  ) : isRecoveryMode ? (
                    <span>Guardar nueva contraseña</span>
                  ) : (
                    <span>Enviar enlace de recuperación</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => switchTab('login')}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Volver a Iniciar sesión
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Pie sutil */}
      <footer className="relative z-20 text-center py-2 max-w-md mx-auto w-full">
        <p className="text-[0.7rem] text-muted-foreground/70 leading-relaxed">
          Al continuar aceptas la{' '}
          <Link href="/carta" className="underline underline-offset-2 hover:text-foreground">
            Carta constitutiva
          </Link>{' '}
          y el uso de datos según la{' '}
          <Link href="/privacidad" className="underline underline-offset-2 hover:text-foreground">
            política de privacidad
          </Link>
          .
        </p>
      </footer>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}