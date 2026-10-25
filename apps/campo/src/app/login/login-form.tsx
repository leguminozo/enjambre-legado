'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { friendlySupabaseError, friendlyError, overlayBackdropClassName } from '@enjambre/ui';
import { logSecurityEvent, useAuthStore } from '@enjambre/auth';
import { getTiendaOrigin } from '@/lib/public-urls';
import {
  CheckCircle2,
  Circle,
  ChevronsUpDown,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  User,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export interface SavedAccount {
  email: string;
  name: string;
  handle: string;
  role?: string;
  lastUsed: number;
}

// OAuth desactivado: Supabase del proyecto tiene google/apple/twitter: false.
// Los botones se ocultan hasta habilitar algún provider en el dashboard.
const OAUTH_PROVIDERS_ENABLED = false;

// Sin cuentas demo: el POS es para equipo (rep_ventas/admin); mostrar el
// email del dueño a visitantes filtra datos internos. Cada operador guarda
// su propia cuenta en localStorage tras el primer login.
const DEFAULT_SAVED_ACCOUNTS: SavedAccount[] = [];

function getSavedAccounts(): SavedAccount[] {
  if (typeof window === 'undefined') return DEFAULT_SAVED_ACCOUNTS;
  try {
    const raw = localStorage.getItem('enjambre_saved_accounts');
    if (!raw) {
      localStorage.setItem('enjambre_saved_accounts', JSON.stringify(DEFAULT_SAVED_ACCOUNTS));
      return DEFAULT_SAVED_ACCOUNTS;
    }
    const parsed = JSON.parse(raw) as SavedAccount[];
    return parsed.length > 0 ? parsed : DEFAULT_SAVED_ACCOUNTS;
  } catch {
    return DEFAULT_SAVED_ACCOUNTS;
  }
}

function saveAccountToStorage(email: string, name?: string, role?: string) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSavedAccounts();
    const handle = '@' + email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    const displayName = name || email.split('@')[0];
    const filtered = existing.filter((acc) => acc.email.toLowerCase() !== email.toLowerCase());
    const updated = [
      { email, name: displayName, handle, role: role || 'agente_comercial', lastUsed: Date.now() },
      ...filtered,
    ].slice(0, 5);
    localStorage.setItem('enjambre_saved_accounts', JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save account to localStorage:', err);
  }
}

function GoogleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
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

type ViewMode = 'collapsed' | 'expanded' | 'sheet_accounts' | 'sheet_email' | 'sheet_recovery' | 'sheet_invite';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<SavedAccount | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('collapsed');

  const redirectPath = searchParams.get('redirect') || '/pos/catalogo';
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    const code = searchParams.get('invite') || searchParams.get('code');
    if (code) {
      setInviteCode(code.trim().toUpperCase());
      setViewMode('sheet_invite');
    }
  }, [searchParams]);

  useEffect(() => {
    const loaded = getSavedAccounts();
    setSavedAccounts(loaded);
    if (loaded.length > 0) {
      setSelectedAccount(loaded[0]);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !isRecoveryMode) {
      router.push(redirectPath);
    }
  }, [isLoading, isAuthenticated, user, router, redirectPath, isRecoveryMode]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

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

    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      setIsRecoveryMode(true);
      setIsForgotPassword(false);
      setViewMode('sheet_recovery');
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleOAuth(provider: 'google' | 'apple' | 'twitter') {
    setError(null);
    setMessage(null);
    const supabase = createClient();
    if (!supabase) {
      setError('El sistema no está configurado. Contacta al administrador.');
      return;
    }
    setLoading(true);
    // OAuth debe volver a /login (público): si redirectTo es /pos el middleware
    // descarta el ?code= antes de que el client intercambie la sesión (hermano tienda /auth/callback).
    const { error: oAuthErr } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/login`,
      },
    });
    if (oAuthErr) {
      setError(friendlySupabaseError(oAuthErr));
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const supabase = createClient();
    if (!supabase) {
      setError('El sistema no está configurado. Contacta al administrador.');
      return;
    }
    setLoading(true);

    if (isRecoveryMode) {
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        setLoading(false);
        return;
      }
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) {
        setError(friendlySupabaseError(updateErr));
        setLoading(false);
        return;
      }
      setMessage('¡Contraseña actualizada con éxito! Entrando...');
      setIsRecoveryMode(false);
      setLoading(false);
      // Hidratar profiles.role antes de ir al POS (misma ruta post-login)
      await useAuthStore.getState().checkUser();
      router.push(redirectPath);
      router.refresh();
      return;
    }

    if (isForgotPassword) {
      if (!email.trim()) {
        setError('Ingresa tu correo electrónico.');
        setLoading(false);
        return;
      }
      const siteUrl = process.env.NEXT_PUBLIC_CAMPO_URL ?? (typeof window !== 'undefined' ? window.location.origin : '');
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
      });
      if (resetErr) {
        setError(friendlySupabaseError(resetErr));
        setLoading(false);
        return;
      }
      try {
        await logSecurityEvent(supabase, {
          eventType: 'password_reset_requested',
          email: email.trim(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          appSource: 'campo',
        });
      } catch (err) {
        console.error('[login] failed to log security event:', err);
      }
      setMessage('Te hemos enviado un enlace a tu correo para reestablecer tu contraseña.');
      setIsForgotPassword(false);
      setLoading(false);
      return;
    }

    const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });

    if (signErr) {
      setError(friendlySupabaseError(signErr));
      try {
        await logSecurityEvent(supabase, {
          eventType: 'login_failed',
          email,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          appSource: 'campo',
          details: { code: signErr.code, message: signErr.message },
        });
      } catch (err) {
        console.error('[login] failed to log security event:', err);
      }
      setLoading(false);
      return;
    }

    try {
      await logSecurityEvent(supabase, {
        eventType: 'login_success',
        email,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        appSource: 'campo',
      });
    } catch (err) {
      console.error('[login] failed to log security event:', err);
    }

    if (typeof window !== 'undefined') {
      const pendingCode = localStorage.getItem('enj_pending_invite_code');
      if (pendingCode) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: redeemData } = await supabase.rpc('canjear_codigo_invitacion', {
            p_code: pendingCode,
            p_user_id: user.id,
          });
          const res = redeemData?.[0];
          if (res?.exito) {
            localStorage.removeItem('enj_pending_invite_code');
            await useAuthStore.getState().checkUser();
          }
        }
      }
    }

    saveAccountToStorage(email, selectedAccount?.name || email.split('@')[0]);
    setLoading(false);
    router.push(redirectPath);
    router.refresh();
  }

  async function onRegisterWithInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const supabase = createClient();
    if (!supabase) {
      setError('El sistema no está configurado. Contacta al administrador.');
      return;
    }
    if (!fullName.trim()) {
      setError('Ingresa tu nombre completo.');
      return;
    }
    if (!inviteCode.trim()) {
      setError('Ingresa tu código de invitación.');
      return;
    }
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // 1. Sign up user
      const { data: signData, error: signErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (signErr) {
        setError(friendlySupabaseError(signErr));
        setLoading(false);
        return;
      }

      const newUserId = signData.user?.id;
      if (!newUserId) {
        setError('No se pudo inicializar la cuenta. Intenta de nuevo.');
        setLoading(false);
        return;
      }

      // 2. Si no hay sesión (confirmación de correo requerida en Supabase)
      if (!signData.session) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('enj_pending_invite_code', inviteCode.trim().toUpperCase());
        }
        setMessage('Cuenta creada con éxito. Revisa tu correo para confirmarla, luego inicia sesión para activar tu acceso.');
        setViewMode('sheet_email');
        setLoading(false);
        return;
      }

      // 2b. Con sesión activa, canjear código de invitación con RPC SECURITY DEFINER
      const { data: redeemData, error: redeemErr } = await supabase.rpc('canjear_codigo_invitacion', {
        p_code: inviteCode.trim().toUpperCase(),
        p_user_id: newUserId,
      });

      if (redeemErr) {
        setError(friendlyError(redeemErr, 'No se pudo canjear la invitación. Intenta de nuevo.'));
        setLoading(false);
        return;
      }

      const res = redeemData?.[0];
      if (!res?.exito) {
        setError('Código de invitación inválido, inactivo o expirado.');
        setLoading(false);
        return;
      }

      // 3. Registrar evento de seguridad y persistir cuenta en storage
      try {
        await logSecurityEvent(supabase, {
          eventType: 'signup_success',
          email: email.trim(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          appSource: 'campo',
          details: { invite_code: inviteCode.trim().toUpperCase() },
        });
      } catch (err) {
        console.error('[login] log security event error:', err);
      }

      saveAccountToStorage(email.trim(), fullName.trim(), 'rep_ventas');
      await useAuthStore.getState().checkUser();
      setMessage('¡Cuenta creada y activada con éxito! Entrando al POS...');
      router.push(redirectPath);
      router.refresh();
    } catch (err) {
      console.error('[login] register with invite failed:', err);
      setError(friendlyError(err, 'Error inesperado al activar cuenta'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      {/* 1. COLLAPSED MODE (Default Grok Mobile Layout) */}
      {viewMode === 'collapsed' && (
        <div className="flex flex-col items-center gap-3 w-full animate-in fade-in duration-200">
          {selectedAccount ? (
            <div className="relative w-full">
              <button
                type="button"
                onClick={() => {
                  setEmail(selectedAccount.email);
                  setViewMode('sheet_email');
                  setError(null);
                  setMessage(null);
                }}
                className="w-full min-h-14 rounded-full border border-border/60 bg-surface-raised/80 backdrop-blur-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-sm font-medium text-foreground hover:border-border hover:bg-surface-raised transition-all shadow-lg group"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                    {selectedAccount.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col items-start truncate">
                    <span className="text-xs text-muted-foreground font-normal tracking-wide">
                      Continuar como
                    </span>
                    <span className="text-sm font-medium text-foreground truncate">
                      {selectedAccount.name}{' '}
                      <span className="text-muted-foreground font-normal">
                        {selectedAccount.handle}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewMode('sheet_accounts');
                    }}
                    className="p-2 rounded-full hover:bg-background/80 transition-colors text-muted-foreground hover:text-foreground"
                    title="Cambiar de cuenta"
                  >
                    <ChevronsUpDown className="w-4 h-4" />
                  </span>
                </div>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setViewMode('sheet_email');
                setError(null);
                setMessage(null);
              }}
              className="w-full min-h-14 rounded-full border border-border/60 bg-surface-raised/80 backdrop-blur-2xl px-6 py-3 flex items-center justify-center gap-3 text-sm font-medium text-foreground hover:border-border hover:bg-surface-raised transition-all shadow-lg"
            >
              <Mail className="w-4 h-4 text-primary" />
              <span>Continuar con correo electrónico</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setViewMode('sheet_invite');
              setError(null);
              setMessage(null);
            }}
            className="w-full min-h-12 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-primary hover:bg-primary/15 transition-all shadow-sm"
          >
            <KeyRound className="w-4 h-4" />
            <span>¿Tienes código de invitación? Activar cuenta</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('expanded')}
            className="w-full py-2.5 text-center text-xs text-muted-foreground/80 hover:text-foreground tracking-widest uppercase transition-colors"
          >
            Otras opciones
          </button>

          <p className="mt-4 text-[0.65rem] text-muted-foreground/60 text-center max-w-xs mx-auto text-balance leading-relaxed">
            Al continuar, aceptas los{' '}
            <a
              href={`${getTiendaOrigin()}/terminos`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Términos de servicio
            </a>{' '}
            y la{' '}
            <a
              href={`${getTiendaOrigin()}/privacidad`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Política de privacidad
            </a>{' '}
            de Enjambre Legado.
          </p>
        </div>
      )}

      {/* 2. EXPANDED OPTIONS MODE (Grok Mobile Option Stack) */}
      {viewMode === 'expanded' && (
        <div className="flex flex-col items-center gap-2.5 w-full animate-in fade-in duration-200">
          {selectedAccount && (
            <button
              type="button"
              onClick={() => {
                setEmail(selectedAccount.email);
                setViewMode('sheet_email');
                setError(null);
                setMessage(null);
              }}
              className="w-full min-h-13 rounded-full border border-border/60 bg-surface-raised/90 backdrop-blur-2xl px-5 py-3 flex items-center justify-center gap-3 text-sm font-medium text-foreground hover:border-border transition-all"
            >
              <User className="w-4 h-4 text-primary" />
              <span className="truncate">
                Continuar como {selectedAccount.name} {selectedAccount.handle}
              </span>
            </button>
          )}

          {OAUTH_PROVIDERS_ENABLED && (
            <>
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
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setViewMode('sheet_email');
              setError(null);
              setMessage(null);
            }}
            className="w-full min-h-13 rounded-full border border-border/60 bg-surface-raised/80 backdrop-blur-2xl px-5 py-3 flex items-center justify-center gap-3 text-sm font-medium text-foreground hover:border-border transition-all"
          >
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span>Continuar con email</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('collapsed')}
            className="w-full py-2.5 text-center text-xs text-muted-foreground/80 hover:text-foreground tracking-widest uppercase transition-colors"
          >
            Otras opciones
          </button>

          <p className="mt-2 text-[0.65rem] text-muted-foreground/60 text-center max-w-xs mx-auto text-balance leading-relaxed">
            Al continuar, aceptas los{' '}
            <a
              href={`${getTiendaOrigin()}/terminos`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Términos de servicio
            </a>{' '}
            y la{' '}
            <a
              href={`${getTiendaOrigin()}/privacidad`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Política de privacidad
            </a>{' '}
            de Enjambre Legado.
          </p>
        </div>
      )}

      {/* 3. ACCOUNT SWITCHER BOTTOM SHEET MODAL (Grok Mobile Account Selector) */}
      {viewMode === 'sheet_accounts' && (
        <>
          <div
            className={`fixed inset-0 z-[220] animate-in fade-in duration-200 ${overlayBackdropClassName}`}
            onClick={() => setViewMode('collapsed')}
          />
          <div className="fixed inset-x-0 bottom-0 md:bottom-auto md:inset-y-0 md:my-auto md:h-fit z-[221] rounded-t-[32px] md:rounded-[32px] border-t md:border border-border/60 bg-surface-raised/95 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_-12px_48px_rgba(0,0,0,0.85)] md:shadow-[0_24px_80px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom md:fade-in md:slide-in-from-bottom-0 md:zoom-in-95 duration-300 max-w-md mx-auto max-h-[calc(var(--vh-full)-2.5rem)] md:max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mb-6" />

            <div className="space-y-3 mb-6">
              {savedAccounts.map((account) => {
                const isSelected =
                  selectedAccount?.email.toLowerCase() === account.email.toLowerCase();
                return (
                  <div
                    key={account.email}
                    onClick={() => setSelectedAccount(account)}
                    className="rounded-2xl border border-border/40 bg-background/60 p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                        {account.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-sm font-medium text-foreground truncate">
                          {account.name}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {account.handle}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <CheckCircle2 className="w-6 h-6 text-primary fill-primary/20" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground/30" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                if (selectedAccount) {
                  setEmail(selectedAccount.email);
                  setViewMode('sheet_email');
                  setError(null);
                  setMessage(null);
                }
              }}
              className="w-full min-h-13 rounded-full bg-primary text-primary-foreground font-medium text-sm py-3.5 shadow-lg hover:opacity-95 transition-opacity"
            >
              Continuar con {selectedAccount?.handle || 'cuenta'}
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail('');
                setPassword('');
                setViewMode('sheet_email');
                setError(null);
                setMessage(null);
              }}
              className="w-full mt-3 min-h-11 text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              + Usar otra cuenta o correo electrónico
            </button>
          </div>
        </>
      )}

      {/* 4. EMAIL & PASSWORD LOGIN BOTTOM SHEET MODAL */}
      {viewMode === 'sheet_email' && (
        <>
          <div
            className={`fixed inset-0 z-[220] animate-in fade-in duration-200 ${overlayBackdropClassName}`}
            onClick={() => setViewMode('collapsed')}
          />
          <div className="fixed inset-x-0 bottom-0 md:bottom-auto md:inset-y-0 md:my-auto md:h-fit z-[221] rounded-t-[32px] md:rounded-[32px] border-t md:border border-border/60 bg-surface-raised/95 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_-12px_48px_rgba(0,0,0,0.85)] md:shadow-[0_24px_80px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom md:fade-in md:slide-in-from-bottom-0 md:zoom-in-95 duration-300 max-w-md mx-auto max-h-[calc(var(--vh-full)-2.5rem)] md:max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mb-4" />

            <div className="mb-6 text-center">
              <h2 className="text-lg font-semibold text-foreground tracking-tight">
                Iniciar sesión en Campo
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Patrimonio forestal y gestión operativa de ventas
              </p>
            </div>

            <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
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
                    className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-4 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
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
                    className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-11 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
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
                {loading ? 'Entrando…' : 'Entrar'}
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
                Volver al menú de opciones
              </button>

              <div className="pt-2 text-center border-t border-border/40">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('sheet_invite');
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-xs text-primary underline-offset-2 hover:underline inline-flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  ¿Nuevo agente comercial con código de invitación? Activa tu cuenta
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* 5. RECOVERY / FORGOT PASSWORD BOTTOM SHEET MODAL */}
      {viewMode === 'sheet_recovery' && (
        <>
          <div
            className={`fixed inset-0 z-[220] animate-in fade-in duration-200 ${overlayBackdropClassName}`}
            onClick={() => {
              setIsForgotPassword(false);
              setIsRecoveryMode(false);
              setViewMode('collapsed');
            }}
          />
          <div className="fixed inset-x-0 bottom-0 md:bottom-auto md:inset-y-0 md:my-auto md:h-fit z-[221] rounded-t-[32px] md:rounded-[32px] border-t md:border border-border/60 bg-surface-raised/95 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_-12px_48px_rgba(0,0,0,0.85)] md:shadow-[0_24px_80px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom md:fade-in md:slide-in-from-bottom-0 md:zoom-in-95 duration-300 max-w-md mx-auto max-h-[calc(var(--vh-full)-2.5rem)] md:max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mb-4" />

            <div className="mb-6 text-center">
              <h2 className="text-lg font-semibold text-foreground tracking-tight">
                {isRecoveryMode ? 'Nueva Contraseña' : 'Recuperar Contraseña'}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {isRecoveryMode
                  ? 'Ingresa y confirma tu nueva contraseña para la cuenta.'
                  : 'Te enviaremos un enlace seguro a tu correo para crear una nueva contraseña.'}
              </p>
            </div>

            <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
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
                      className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-4 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
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
                        className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-11 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
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
                        className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-11 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
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
                Volver al inicio de sesión
              </button>
            </form>
          </div>
        </>
      )}

      {/* 6. INVITE REGISTRATION BOTTOM SHEET MODAL */}
      {viewMode === 'sheet_invite' && (
        <>
          <div
            className={`fixed inset-0 z-[220] animate-in fade-in duration-200 ${overlayBackdropClassName}`}
            onClick={() => {
              setViewMode('collapsed');
              setError(null);
              setMessage(null);
            }}
          />
          <div className="fixed inset-x-0 bottom-0 md:bottom-auto md:inset-y-0 md:my-auto md:h-fit z-[221] rounded-t-[32px] md:rounded-[32px] border-t md:border border-border/60 bg-surface-raised/95 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_-12px_48px_rgba(0,0,0,0.85)] md:shadow-[0_24px_80px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom md:fade-in md:slide-in-from-bottom-0 md:zoom-in-95 duration-300 max-w-md mx-auto max-h-[calc(var(--vh-full)-2.5rem)] md:max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mb-4" />

            <div className="mb-6 text-center">
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mx-auto mb-2.5">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-foreground tracking-tight">
                Activar Cuenta de Agente Comercial
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Ingresa tus datos y el código de invitación provisto por el equipo
              </p>
            </div>

            <form onSubmit={(e) => void onRegisterWithInvite(e)} className="space-y-3.5">
              {message ? (
                <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-center text-xs text-primary">
                  {message}
                </div>
              ) : null}

              <div>
                <label
                  htmlFor="inviteCode"
                  className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1"
                >
                  Código de Invitación
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <input
                    id="inviteCode"
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full min-h-12 rounded-xl border border-primary/40 bg-background/80 pl-10 pr-4 py-3 text-sm text-foreground font-mono font-bold tracking-wider placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors uppercase"
                    placeholder="EJ: FERIA-CHILOE"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="fullName"
                  className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1"
                >
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-4 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                    placeholder="Camila Soto"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="inviteEmail"
                  className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1"
                >
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    id="inviteEmail"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-4 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                    placeholder="camila@correo.cl"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="invitePassword"
                  className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1"
                >
                  Crear Contraseña (mínimo 6 caracteres)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    id="invitePassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-11 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
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
                className="w-full min-h-13 rounded-full bg-primary text-primary-foreground font-medium text-sm py-3.5 shadow-lg hover:opacity-95 transition-opacity disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Activando cuenta…</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Crear y Activar Cuenta</span>
                  </>
                )}
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
                Volver al menú de opciones
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
