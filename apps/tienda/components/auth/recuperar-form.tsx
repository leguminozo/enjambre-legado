'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { toast } from '@enjambre/ui';
import { AuthFormPanel, AuthShell, authFieldClass, authLabelClass } from '@/components/auth/auth-shell';

export function RecuperarForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
      const res = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'No se pudo enviar el correo');
      }
      setSent(true);
      toast('Si el correo existe, recibirás instrucciones en tu bandeja.', { type: 'success' });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al solicitar recuperación', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={<>Recuperar <span className="italic text-accent-text">acceso</span></>}
      subtitle="Te enviaremos un enlace seguro para restablecer tu contraseña"
      footer="Acceso Restringido · La Obrera y el Zángano"
    >
      {sent ? (
        <div className="space-y-6 text-center">
          <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
            Revisa tu correo (y spam). El enlace expira en unos minutos.
          </p>
          <Link
            href="/login"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-accent px-6 py-3 text-[0.7rem] uppercase tracking-[0.3em] text-accent-text hover:bg-accent hover:text-accent-foreground transition-all"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <AuthFormPanel onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className={authLabelClass}>Correo electrónico</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authFieldClass}
                placeholder="tu@correo.com"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-12 mt-6 py-4 rounded-lg border border-accent text-accent-text text-[0.7rem] uppercase tracking-[0.3em] hover:bg-accent hover:text-accent-foreground transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Enviando…' : 'Enviar enlace'}
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