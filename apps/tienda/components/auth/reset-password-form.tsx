'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { friendlyError, friendlySupabaseError, toast } from '@enjambre/ui';
import { createClient } from '@/utils/supabase/client';
import { AuthFormPanel, AuthShell, authFieldClass, authLabelClass } from '@/components/auth/auth-shell';

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Alineado con login recovery / Supabase min (6); path /recuperar→callback→aquí
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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(friendlySupabaseError(error));
      toast('Contraseña actualizada. Ya puedes iniciar sesión.', { type: 'success' });
      router.replace('/login');
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
      title={<>Nueva <span className="italic text-accent">contraseña</span></>}
      subtitle="Elige una clave segura para tu cuenta"
      footer="Acceso Restringido · Tienda Enjambre"
    >
      <AuthFormPanel onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="password" className={authLabelClass}>Contraseña nueva</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={authFieldClass}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm" className={authLabelClass}>Confirmar contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="confirm"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={authFieldClass}
              />
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-12 mt-6 py-4 rounded-lg border border-accent text-accent text-[0.7rem] uppercase tracking-[0.3em] hover:bg-accent hover:text-accent-foreground transition-all duration-300 disabled:opacity-50"
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
    </AuthShell>
  );
}