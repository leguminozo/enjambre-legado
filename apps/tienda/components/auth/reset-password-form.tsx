'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from '@enjambre/ui';
import { createClient } from '@/utils/supabase/client';
import { AuthFormPanel, AuthShell, authFieldClass, authLabelClass } from '@/components/auth/auth-shell';

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast('La contraseña debe tener al menos 8 caracteres', { type: 'error' });
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
      if (error) throw error;
      toast('Contraseña actualizada. Ya puedes iniciar sesión.', { type: 'success' });
      router.replace('/login');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo actualizar la contraseña', { type: 'error' });
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
                minLength={8}
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
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={authFieldClass}
              />
            </div>
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full btn btn-primary mt-6 disabled:opacity-50">
          {loading ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </AuthFormPanel>
    </AuthShell>
  );
}