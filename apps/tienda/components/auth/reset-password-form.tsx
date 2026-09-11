'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { friendlyError, friendlySupabaseError, toast } from '@enjambre/ui';
import { createClient } from '@/utils/supabase/client';

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search);
      const tokenHash = search.get('token_hash');
      const type = search.get('type');
      if (tokenHash && type === 'recovery') {
        supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' }).then(({ error }: { error: unknown }) => {
          if (error) {
            toast(friendlySupabaseError(error), { type: 'error' });
          }
        });
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast('La contraseña debe tener al menos 6 caracteres', { type: 'error' });
      return;
    }
    if (password !== confirm) {
      toast('Las contraseñas no coinciden', { type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error('El sistema no está configurado');
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(friendlySupabaseError(error));
      setSuccess(true);
      toast('Contraseña actualizada con éxito', { type: 'success' });
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
    } catch (err) {
      toast(
        friendlyError(err, err instanceof Error ? err.message : 'No se pudo actualizar la contraseña'),
        { type: 'error' },
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-3xl border border-border/70 bg-surface-raised/85 backdrop-blur-xl shadow-2xl p-6 sm:p-8 transition-all">
        <div className="mb-6 text-center">
          <h2 className="text-base sm:text-lg font-semibold text-foreground tracking-tight font-display">
            Nueva Contraseña
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Elige una clave segura de al menos 6 caracteres
          </p>
        </div>

        {success ? (
          <div className="space-y-6 text-center animate-in fade-in duration-300">
            <div className="flex justify-center text-primary mb-2">
              <CheckCircle2 size={48} className="animate-bounce" />
            </div>
            <h3 className="text-lg font-light text-foreground font-display">¡Contraseña restablecida!</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tu clave ha sido actualizada correctamente. Redirigiéndote al inicio de sesión...
            </p>
            <Link
              href="/login"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-primary text-primary-foreground font-medium text-sm py-3.5 shadow-lg hover:opacity-95 transition-opacity"
            >
              Ir al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-[0.65rem] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5"
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
                  className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-11 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
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
                htmlFor="confirm"
                className="block text-[0.65rem] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5"
              >
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-11 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-12 rounded-full bg-primary text-primary-foreground font-medium text-sm py-3.5 shadow-lg hover:opacity-95 transition-opacity disabled:opacity-50 mt-2 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Guardando…' : 'Guardar contraseña'}
            </button>

            <div className="mt-6 pt-4 border-t border-border/40 text-center">
              <Link
                href="/login"
                className="text-xs text-primary font-medium underline underline-offset-2 hover:text-primary/80 transition-colors"
              >
                Volver a Iniciar Sesión
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}