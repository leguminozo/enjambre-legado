'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { GrainOverlay } from '@/components/shop/grain-overlay';
import { Sparkles, Mail, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface ClaimClientProps {
  token: string;
  venta: any;
  initialUser: User | null;
}

export function ClaimClient({ token, venta, initialUser }: ClaimClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(initialUser);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [claimed, setClaimed] = useState(false);

  // Calculated points (matches the DB trigger logic)
  const points = Math.floor(venta.total / 1000);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.href,
      },
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: '¡Revisa tu correo! Te enviamos un enlace mágico para entrar.' });
    }
    setLoading(false);
  }

  async function claimVenta() {
    if (!user) return;
    setClaiming(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('ventas')
        .update({
          claim_status: 'claimed',
          claimed_by: user.id,
          claimed_at: new Date().toISOString(),
          cliente_id: user.id
        })
        .eq('claim_token', token)
        .eq('claim_status', 'pending');

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setClaimed(true);
        setTimeout(() => {
          router.push('/perfil');
        }, 3000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al procesar el reclamo' });
    } finally {
      setClaiming(false);
    }
  }

  if (claimed) {
    return (
      <div className="min-h-screen bg-black text-[#f5f0e8] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        <GrainOverlay />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#c9a227]/10 blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 animate-in fade-in zoom-in duration-1000">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-[#c9a227]/10 rounded-full mb-8">
            <Sparkles className="w-12 h-12 text-[#c9a227]" />
          </div>
          <h1 className="font-display text-5xl mb-4">¡Legado Reclamado!</h1>
          <p className="text-[#8a8279] text-xl font-light mb-8">Has sumado <span className="text-[#c9a227] font-bold">{points} puntos</span> a tu cuenta.</p>
          <div className="flex items-center justify-center gap-2 text-[#c9a227] text-sm tracking-widest uppercase font-bold">
            Redirigiendo a tu bóveda <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#f5f0e8] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <GrainOverlay />
      
      {/* Background glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#c9a227]/5 blur-[150px]" />
      </div>

      <div className="max-w-md w-full relative z-10 space-y-12">
        <div className="text-center">
          <p className="text-[0.6rem] uppercase tracking-[0.4em] text-[#c9a227] font-bold mb-6">Fidelización Cíclica</p>
          <h1 className="font-display text-4xl md:text-5xl font-light tracking-tight mb-4">
            Reclama tu <span className="italic text-[#c9a227]">impacto</span>
          </h1>
          <p className="text-[#8a8279] font-light leading-relaxed">
            Has adquirido productos del bosque nativo. Al reclamar este ticket, sumas puntos y apoyas la regeneración biocultural.
          </p>
        </div>

        <div className="bg-[#0c0c0c]/80 backdrop-blur-2xl border border-white/5 p-10 shadow-2xl rounded-sm">
          <div className="mb-8 pb-8 border-b border-white/5">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[0.6rem] uppercase tracking-widest text-[#8a8279] mb-1">Recompensa</p>
                <p className="text-2xl font-serif text-[#c9a227]">{points} Puntos Guardián</p>
              </div>
              <div className="text-right">
                <p className="text-[0.6rem] uppercase tracking-widest text-[#8a8279] mb-1">Total Compra</p>
                <p className="text-xl font-light text-stone-400">
                  {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(venta.total)}
                </p>
              </div>
            </div>
          </div>

          {!user ? (
            <form onSubmit={handleMagicLink} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279]">Ingresa tu correo para reclamar</label>
                <div className="relative group">
                  <Mail className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8279] group-focus-within:text-[#c9a227] transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-b border-white/10 pl-8 py-3 text-sm focus:outline-none focus:border-[#c9a227] transition-colors"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#c9a227] text-black text-[0.7rem] uppercase tracking-[0.3em] font-bold hover:bg-white transition-all disabled:opacity-50"
              >
                {loading ? 'Enviando enlace...' : 'Continuar con Magic Link'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/5">
                <div className="w-10 h-10 bg-[#c9a227]/20 rounded-full flex items-center justify-center text-[#c9a227]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[0.6rem] uppercase tracking-tighter text-[#8a8279]">Conectado como</p>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
              </div>

              <button
                onClick={claimVenta}
                disabled={claiming}
                className="w-full py-5 border border-[#c9a227] text-[#c9a227] text-[0.7rem] uppercase tracking-[0.3em] font-bold hover:bg-[#c9a227] hover:text-black transition-all duration-500 flex items-center justify-center gap-3"
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
              message.type === 'error' ? 'border-red-900/30 bg-red-950/20 text-red-400' : 'border-green-900/30 bg-green-950/20 text-green-400'
            }`}>
              {message.text}
            </div>
          )}
        </div>

        <p className="text-center text-[0.6rem] tracking-[0.2em] text-[#8a8279] uppercase">
          Enjambre Legado • Biocultural Regeneration
        </p>
      </div>
    </div>
  );
}
