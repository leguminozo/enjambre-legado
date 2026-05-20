'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { friendlySupabaseError } from '@enjambre/ui';
import { logSecurityEvent } from '@enjambre/auth';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    if (!supabase) {
		setError('El sistema no está configurado. Contacta al administrador.');
      return;
    }
    setLoading(true);
	const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
	setLoading(false);
	if (signErr) {
		setError(friendlySupabaseError(signErr));
		void logSecurityEvent(supabase, {
			eventType: 'login_failed',
			email,
			userAgent: navigator.userAgent,
			appSource: 'campo',
			details: { code: signErr.code, message: signErr.message },
		});
		return;
	}
	void logSecurityEvent(supabase, {
		eventType: 'login_success',
		email,
		userAgent: navigator.userAgent,
		appSource: 'campo',
	});
    router.push('/pos/catalogo');
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
		Correo
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-bosque py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
