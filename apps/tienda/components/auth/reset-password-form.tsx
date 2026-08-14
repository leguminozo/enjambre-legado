'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { friendlyError, friendlySupabaseError, toast } from '@enjambre/ui';
import { createClient } from '@/utils/supabase/client';
import { AuthFormPanel, AuthShell, authFieldClass, authLabelClass } from '@/components/auth/auth-shell';

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
    <AuthShell
      title={<>Nueva <span className="italic text-accent-text">contraseña</span></>}
      subtitle="Elige una clave segura de al menos 6 caracteres"
      footer="Acceso Restringido · La Obrera y el Zángano"
    >
      {success ? (
        <div className="space-y-6 text-center animate-in fade-in duration-300">
          <div className="flex justify-center text-accent-text mb-2">
            <CheckCircle2 size={48} className="animate-bounce" />
          </div>
          <h3 className="text-lg font-light text-foreground">¡Contraseña restablecida!</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tu clave ha sido actualizada correctamente. Redirigiéndote al inicio de sesión...
          </p>
          <Link
            href="/login"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-accent px-6 py-3 text-[0.7rem] uppercase tracking-[0.3em] text-accent-text hover:bg-accent hover:text-accent-foreground transition-all"
          >
            Ir al inicio de sesión
          </Link>
        </div>
      ) : (
        <AuthFormPanel onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="password" className={authLabelClass}>Nueva contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={authFieldClass}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label="Ver contraseña"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="confirm" className={authLabelClass}>Confirmar contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={authFieldClass}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-12 mt-6 py-4 rounded-lg border border-accent text-accent-text text-[0.7rem] uppercase tracking-[0.3em] hover:bg-accent hover:text-accent-foreground transition-all duration-300 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Guardando…' : 'Guardar contraseña'}
          </button>
          <p className="pt-2 text-center text-[0.7rem] text-muted-foreground">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center text-foreground underline underline-offset-4 decoration-border hover:text-accent"
            >
              Volver al login
            </Link>
          </p>
        </AuthFormPanel>
      )}
    </AuthShell>
  );
}