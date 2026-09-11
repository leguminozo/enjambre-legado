'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { toast, friendlyError } from '@enjambre/ui';

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
      toast(friendlyError(err, 'Error al solicitar recuperación'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-3xl border border-border/70 bg-surface-raised/85 backdrop-blur-xl shadow-2xl p-6 sm:p-8 transition-all">
        <div className="mb-6 text-center">
          <h2 className="text-base sm:text-lg font-semibold text-foreground tracking-tight font-display">
            Recuperar Contraseña
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Te enviaremos un enlace seguro para restablecer tu acceso
          </p>
        </div>

        {sent ? (
          <div className="space-y-6 text-center">
            <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
              Revisa tu correo (y carpeta de spam). El enlace expira en unos minutos.
            </p>
            <Link
              href="/login"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-primary text-primary-foreground font-medium text-sm py-3.5 shadow-lg hover:opacity-95 transition-opacity"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-[0.65rem] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full min-h-12 rounded-xl border border-border/60 bg-background/80 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  placeholder="tu@correo.cl"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-12 rounded-full bg-primary text-primary-foreground font-medium text-sm py-3.5 shadow-lg hover:opacity-95 transition-opacity disabled:opacity-50 mt-2 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Enviando…' : 'Enviar enlace de recuperación'}
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