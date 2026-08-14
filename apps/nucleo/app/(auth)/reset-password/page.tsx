'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, CheckCircle2, KeyRound } from 'lucide-react';
import { createClient } from '@enjambre/auth/browser';
import { useAuthStore, getRoleRedirectPath } from '@enjambre/auth';
import { friendlyError, friendlySupabaseError, toast } from '@enjambre/ui';

export default function NucleoResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast('La contraseña debe tener al menos 6 caracteres', { type: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      toast('Las contraseñas no coinciden', { type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error('No se pudo actualizar la contraseña. Intenta de nuevo.');
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(friendlySupabaseError(error));

      setSuccess(true);
      toast('Contraseña actualizada con éxito', { type: 'success' });

      await useAuthStore.getState().checkUser();
      const userRole = useAuthStore.getState().user?.role ?? 'cliente';
      const targetPath = getRoleRedirectPath(userRole);

      setTimeout(() => {
        router.replace(targetPath);
      }, 1800);
    } catch (err) {
      toast(
        friendlyError(err, err instanceof Error ? err.message : 'No se pudo reestablecer la contraseña'),
        { type: 'error' },
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Glow ambiental de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-surface-raised border border-border/80 text-primary mb-2 shadow-lg">
            <KeyRound size={22} />
          </div>
          <h1 className="font-display text-3xl font-light tracking-tight text-foreground">
            Nueva <span className="italic text-primary">Contraseña</span>
          </h1>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Ingresa tu nueva clave de acceso para tu cuenta en Enjambre Legado.
          </p>
        </div>

        {/* Panel del formulario */}
        <div className="rounded-3xl border border-border/60 bg-surface-raised/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl">
          {success ? (
            <div className="space-y-6 text-center animate-in fade-in duration-300">
              <div className="flex justify-center text-primary mb-2">
                <CheckCircle2 size={48} className="animate-bounce" />
              </div>
              <h3 className="text-lg font-medium text-foreground">¡Contraseña restablecida!</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tu contraseña ha sido actualizada correctamente. Redirigiéndote al panel de control...
              </p>
              <Link
                href="/login"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium text-xs tracking-wider uppercase shadow-lg hover:opacity-95 transition-all"
              >
                Ir a Iniciar Sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="password"
                  className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5"
                >
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-11 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    aria-label="Ver contraseña"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5"
                >
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-11 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-13 rounded-full bg-primary text-primary-foreground font-medium text-sm py-3.5 shadow-lg hover:opacity-95 transition-opacity disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-[0.65rem] uppercase tracking-widest text-muted-foreground/60">
          Enjambre Legado · Sistema de Gestión Biocultural
        </p>
      </div>
    </div>
  );
}
