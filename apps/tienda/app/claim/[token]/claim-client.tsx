'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { formatCLP } from '@/lib/shop/format';
import { authFieldClass, authLabelClass } from '@/components/auth/auth-shell';
import { friendlySupabaseError, HexagonLoader } from '@enjambre/ui';
import { Sparkles, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface ClaimClientProps {
  token: string;
  venta: { total?: unknown; [key: string]: unknown };
  initialUser: User | null;
}

export function ClaimClient({ token, venta, initialUser }: ClaimClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(initialUser);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [claimed, setClaimed] = useState(false);

  const total = typeof venta.total === 'number' ? venta.total : 0;
  const points = Math.floor(total / 1000);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const redirectUrl = new URL('/auth/callback', window.location.origin);
    redirectUrl.searchParams.set('next', window.location.pathname);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl.toString(),
      },
    });

    if (error) {
      setMessage({ type: 'error', text: friendlySupabaseError(error) });
    } else {
      setMessage({ type: 'success', text: '¡Revisa tu correo! Te enviamos un enlace para entrar.' });
    }
    setLoading(false);
  }

  async function claimVenta() {
    if (!user) return;
    setClaiming(true);
    setMessage(null);

    try {
      const { error } = await supabase.rpc('reclamar_venta_por_claim_token', {
        p_token: token,
      });

      if (error) {
        const msg = error.message === 'NOT_FOUND_OR_ALREADY_CLAIMED'
          ? 'Este ticket ya fue reclamado o no es válido'
          : friendlySupabaseError(error);
        setMessage({ type: 'error', text: msg });
      } else {
        setClaimed(true);
        setTimeout(() => {
          router.push('/perfil');
        }, 3000);
      }
    } catch (error) {
      console.error('[claim] error:', error);
      setMessage({ type: 'error', text: 'Error al procesar el reclamo' });
    } finally {
      setClaiming(false);
    }
  }

  if (claimed) {
    return (
      <div className="tienda-auth-page text-foreground flex flex-col items-center justify-center text-center">
        <div className="tienda-auth-glow pointer-events-none" aria-hidden />
        <div className="tienda-auth-inner animate-in fade-in zoom-in duration-1000">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-accent/10 rounded-full mb-8">
            <Sparkles className="w-12 h-12 text-accent" />
          </div>
          <h1 className="font-display text-5xl mb-4">¡Legado Reclamado!</h1>
          <p className="text-muted-foreground text-xl font-light mb-8">Has sumado <span className="text-accent font-bold">{points} puntos</span> a tu cuenta.</p>
          <div className="flex items-center justify-center gap-2 text-accent text-sm tracking-widest uppercase font-bold">
            Redirigiendo a tu bóveda <HexagonLoader size="sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tienda-auth-page text-foreground flex flex-col items-center justify-center">
      <div className="tienda-auth-glow pointer-events-none" aria-hidden />

      <div className="tienda-auth-inner max-w-md w-full space-y-10 sm:space-y-12">
        <div className="text-center">
          <p className="text-[0.6rem] uppercase tracking-[0.4em] text-accent font-bold mb-6">Fidelización Cíclica</p>
          <h1 className="font-display text-4xl md:text-5xl font-light tracking-tight mb-4">
            Reclama tu <span className="italic text-accent">impacto</span>
          </h1>
          <p className="text-muted-foreground font-light leading-relaxed">
            Has adquirido productos del bosque nativo. Al reclamar este ticket, sumas puntos y apoyas la regeneración biocultural.
          </p>
        </div>

        <div className="tienda-auth-panel">
          <div className="mb-8 pb-8 border-b border-border">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1">Recompensa</p>
                <p className="text-2xl font-display text-accent">{points} Puntos Guardián</p>
              </div>
              <div className="text-right">
                <p className="text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1">Total Compra</p>
                <p className="text-xl font-light text-muted-foreground">
                  {formatCLP(total)}
                </p>
              </div>
            </div>
          </div>

          {!user ? (
            <form onSubmit={handleMagicLink} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="claim-email" className={authLabelClass}>
                  Ingresa tu correo para reclamar
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                  <input
                    id="claim-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={authFieldClass}
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] py-4 rounded-lg bg-accent text-accent-foreground text-[0.7rem] uppercase tracking-[0.3em] font-bold hover:bg-foreground transition-all disabled:opacity-50"
              >
                {loading ? 'Enviando enlace...' : 'Continuar con enlace mágico'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-border">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center text-accent">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[0.6rem] uppercase tracking-tighter text-muted-foreground">Conectado como</p>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
              </div>

              <button
                onClick={claimVenta}
                disabled={claiming}
                className="w-full min-h-[48px] py-5 rounded-lg border border-accent text-accent text-[0.7rem] uppercase tracking-[0.3em] font-bold hover:bg-accent hover:text-accent-foreground transition-all duration-300 flex items-center justify-center gap-3"
              >
                {claiming ? 'Procesando...' : (
                  <>
                    Reclamar Legado
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {message && (
            <div className={`mt-6 p-4 text-[0.7rem] border ${
              message.type === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-success/30 bg-success/10 text-success'
            }`}>
              {message.text}
            </div>
          )}
        </div>

        <p className="text-center text-[0.6rem] tracking-[0.2em] text-muted-foreground uppercase">
          Enjambre Legado • Biocultural Regeneration
        </p>
      </div>
    </div>
  );
}
